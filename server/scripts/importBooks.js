/**
 * Book Import Script
 * Imports books from JSON file into MongoDB with images stored in GridFS
 *
 * Usage: node scripts/importBooks.js <path-to-json-file>
 *
 * JSON format:
 * [
 *   {
 *     "title": "Book Title",
 *     "author": "Author Name",
 *     "genre": "self-help",
 *     "description": "Book description",
 *     "isbn": "1234567890",
 *     "totalCopies": 5,
 *     "imageUrl": "https://example.com/image.jpg",
 *     "localImagePath": "./images/book.jpg"
 *   }
 * ]
 *
 * Note: Use either imageUrl OR localImagePath, not both
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const dns = require('dns');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Use Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const Book = require('../models/Book');
const { initGridFS } = require('../config/gridfs');
const { uploadToGridFS } = require('../utils/gridfsStorage');

// Progress tracking
let processed = 0;
let successful = 0;
let failed = 0;
const errors = [];

// Download image from URL with timeout and redirects
async function downloadImage(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error('Too many redirects'));
    }

    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, { timeout: 30000 }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        const redirectUrl = response.headers.location;
        if (!redirectUrl) {
          return reject(new Error('Redirect without location header'));
        }
        // Handle relative redirects
        const fullUrl = redirectUrl.startsWith('http') ? redirectUrl : new URL(redirectUrl, url).href;
        return downloadImage(fullUrl, maxRedirects - 1).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode}`));
      }

      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        const contentType = response.headers['content-type'] || 'image/jpeg';
        resolve({
          buffer: Buffer.concat(chunks),
          contentType: contentType.split(';')[0].trim()
        });
      });
      response.on('error', reject);
    });

    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Get filename from URL
function getFilenameFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = path.basename(pathname);
    return filename || 'image.jpg';
  } catch {
    return 'image.jpg';
  }
}

// Process single book
async function processBook(bookData, basePath) {
  const bookTitle = bookData.title || 'Unknown';

  try {
    let coverImageId = null;

    // Handle image - prefer URL, fallback to local
    if (bookData.imageUrl) {
      console.log(`  Downloading image from: ${bookData.imageUrl}`);
      try {
        const { buffer, contentType } = await downloadImage(bookData.imageUrl);
        const filename = getFilenameFromUrl(bookData.imageUrl);
        coverImageId = await uploadToGridFS(buffer, filename, contentType);
        console.log(`    Image uploaded to GridFS: ${coverImageId}`);
      } catch (imgError) {
        console.warn(`    Warning: Failed to download image: ${imgError.message}`);
      }
    } else if (bookData.localImagePath) {
      const imagePath = path.isAbsolute(bookData.localImagePath)
        ? bookData.localImagePath
        : path.join(basePath, bookData.localImagePath);

      console.log(`  Reading local image: ${imagePath}`);

      if (fs.existsSync(imagePath)) {
        const buffer = fs.readFileSync(imagePath);
        const ext = path.extname(imagePath).toLowerCase();
        const mimeTypes = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp'
        };
        const contentType = mimeTypes[ext] || 'image/jpeg';
        const filename = path.basename(imagePath);
        coverImageId = await uploadToGridFS(buffer, filename, contentType);
        console.log(`    Image uploaded to GridFS: ${coverImageId}`);
      } else {
        console.warn(`    Warning: Image not found at ${imagePath}`);
      }
    }

    // Check for existing book with same ISBN
    if (bookData.isbn) {
      const existingBook = await Book.findOne({ isbn: bookData.isbn });
      if (existingBook) {
        console.log(`  Skipping "${bookTitle}" - ISBN already exists`);
        return null;
      }
    }

    // Create book document
    const book = await Book.create({
      title: bookData.title,
      author: bookData.author,
      genre: bookData.genre,
      description: bookData.description,
      isbn: bookData.isbn,
      totalCopies: bookData.totalCopies || 1,
      availableCopies: bookData.totalCopies || 1,
      coverImage: coverImageId ? coverImageId.toString() : null
    });

    successful++;
    console.log(`  Created: "${book.title}" (ID: ${book._id})`);
    return book;
  } catch (error) {
    failed++;
    const errorMsg = `Failed "${bookTitle}": ${error.message}`;
    console.error(`  ${errorMsg}`);
    errors.push(errorMsg);
    return null;
  }
}

// Main import function
async function importBooks(jsonFilePath) {
  console.log('='.repeat(60));
  console.log('Book Import Script');
  console.log('='.repeat(60));

  // Connect to MongoDB
  console.log('\nConnecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Initialize GridFS
  initGridFS();
  console.log('GridFS initialized');

  // Read JSON file
  console.log(`\nReading JSON file: ${jsonFilePath}`);
  const absolutePath = path.resolve(jsonFilePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    process.exit(1);
  }

  const jsonContent = fs.readFileSync(absolutePath, 'utf-8');
  let books;

  try {
    books = JSON.parse(jsonContent);
  } catch (parseError) {
    console.error(`Invalid JSON: ${parseError.message}`);
    process.exit(1);
  }

  if (!Array.isArray(books)) {
    console.error('JSON file must contain an array of books');
    process.exit(1);
  }

  const basePath = path.dirname(absolutePath);
  const total = books.length;

  console.log(`Found ${total} books to import\n`);

  // Process books with concurrency limit
  const CONCURRENCY = 3; // Limit concurrent downloads

  for (let i = 0; i < books.length; i += CONCURRENCY) {
    const batch = books.slice(i, i + CONCURRENCY);
    const batchNum = Math.floor(i / CONCURRENCY) + 1;
    const totalBatches = Math.ceil(books.length / CONCURRENCY);

    console.log(`\n--- Batch ${batchNum}/${totalBatches} ---`);

    await Promise.all(batch.map((book) => processBook(book, basePath)));

    processed += batch.length;
    const progress = Math.round((processed / total) * 100);
    console.log(`Progress: ${processed}/${total} (${progress}%)`);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Import Summary');
  console.log('='.repeat(60));
  console.log(`Total processed: ${processed}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);

  if (errors.length > 0) {
    console.log('\nErrors:');
    errors.forEach((err) => console.log(`  - ${err}`));
  }

  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
}

// Run script
const jsonFile = process.argv[2];
if (!jsonFile) {
  console.log('Book Import Script');
  console.log('==================');
  console.log('\nUsage: node scripts/importBooks.js <path-to-json-file>');
  console.log('\nJSON format example:');
  console.log(JSON.stringify([
    {
      title: 'Atomic Habits',
      author: 'James Clear',
      genre: 'self-help',
      description: 'Tiny changes, remarkable results',
      isbn: '978-0735211292',
      totalCopies: 5,
      imageUrl: 'https://example.com/atomic-habits.jpg'
    }
  ], null, 2));
  console.log('\nAvailable genres:');
  console.log('  Action & Adventure, Biography, Mystery, Horror,');
  console.log('  Thriller & Suspense, Historical Fiction, Romance,');
  console.log('  self-help, folktales, History, True Crime,');
  console.log('  Religion & Spirituality');
  process.exit(0);
}

importBooks(jsonFile)
  .then(() => process.exit(failed > 0 ? 1 : 0))
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  });
