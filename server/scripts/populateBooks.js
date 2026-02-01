/**
 * Populate Books Script
 * Fetches popular books from Open Library API and adds them to the database
 *
 * Usage: node scripts/populateBooks.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const dns = require('dns');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Use Google DNS
dns.setServers(['8.8.8.8', '8.8.4.4']);

const Book = require('../models/Book');
const { initGridFS } = require('../config/gridfs');
const { uploadToGridFS } = require('../utils/gridfsStorage');

// Curated list of popular books with ISBNs and metadata
const popularBooks = [
  // Self-Help
  { isbn: '9780743273565', genre: 'self-help', copies: 4 }, // The 7 Habits
  { isbn: '9780671027032', genre: 'self-help', copies: 5 }, // How to Win Friends
  { isbn: '9781501111105', genre: 'self-help', copies: 3 }, // When Breath Becomes Air
  { isbn: '9780062457714', genre: 'self-help', copies: 4 }, // The Subtle Art
  { isbn: '9780735211292', genre: 'self-help', copies: 5 }, // Atomic Habits
  { isbn: '9780399590504', genre: 'self-help', copies: 3 }, // 12 Rules for Life

  // Fiction - Mystery/Thriller
  { isbn: '9780307474278', genre: 'Mystery', copies: 4 }, // The Girl with the Dragon Tattoo
  { isbn: '9780307588364', genre: 'Mystery', copies: 5 }, // Gone Girl
  { isbn: '9780525478812', genre: 'Thriller & Suspense', copies: 4 }, // The Girl on the Train
  { isbn: '9781501161933', genre: 'Thriller & Suspense', copies: 3 }, // It Ends with Us

  // Fiction - Literary
  { isbn: '9780061120084', genre: 'Historical Fiction', copies: 5 }, // To Kill a Mockingbird
  { isbn: '9780142437247', genre: 'Historical Fiction', copies: 4 }, // Pride and Prejudice
  { isbn: '9780743273565', genre: 'Historical Fiction', copies: 3 }, // The Great Gatsby
  { isbn: '9780060935467', genre: 'Historical Fiction', copies: 4 }, // To Kill a Mockingbird

  // Horror
  { isbn: '9781501142970', genre: 'Horror', copies: 3 }, // It - Stephen King
  { isbn: '9780307743657', genre: 'Horror', copies: 4 }, // The Shining
  { isbn: '9781982127794', genre: 'Horror', copies: 3 }, // Later - Stephen King

  // Biography
  { isbn: '9780812981605', genre: 'Biography', copies: 4 }, // Educated
  { isbn: '9780399592522', genre: 'Biography', copies: 3 }, // Becoming - Michelle Obama
  { isbn: '9781501139154', genre: 'Biography', copies: 4 }, // Born a Crime
  { isbn: '9780385353700', genre: 'Biography', copies: 3 }, // When Breath Becomes Air

  // Action & Adventure
  { isbn: '9780618640157', genre: 'Action & Adventure', copies: 5 }, // The Hobbit
  { isbn: '9780618346257', genre: 'Action & Adventure', copies: 4 }, // LOTR Fellowship
  { isbn: '9780439708180', genre: 'Action & Adventure', copies: 5 }, // Harry Potter
  { isbn: '9780553593716', genre: 'Action & Adventure', copies: 4 }, // Game of Thrones

  // Romance
  { isbn: '9780061122415', genre: 'Romance', copies: 3 }, // The Notebook
  { isbn: '9781501110344', genre: 'Romance', copies: 4 }, // It Ends with Us
  { isbn: '9780062294432', genre: 'Romance', copies: 3 }, // Me Before You

  // History
  { isbn: '9780743270755', genre: 'History', copies: 4 }, // Team of Rivals
  { isbn: '9780375725784', genre: 'History', copies: 3 }, // The Diary of Anne Frank
  { isbn: '9780060566524', genre: 'History', copies: 4 }, // 1776

  // True Crime
  { isbn: '9780316098175', genre: 'True Crime', copies: 3 }, // In Cold Blood
  { isbn: '9780062872760', genre: 'True Crime', copies: 4 }, // American Predator

  // Religion & Spirituality
  { isbn: '9780062515872', genre: 'Religion & Spirituality', copies: 3 }, // The Alchemist
  { isbn: '9781577314806', genre: 'Religion & Spirituality', copies: 4 }, // The Power of Now
];

// Fetch with timeout and redirects
function fetchUrl(url, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;

    const request = protocol.get(url, { timeout }, (response) => {
      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 307) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          return fetchUrl(redirectUrl, timeout).then(resolve).catch(reject);
        }
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode}`));
      }

      const chunks = [];
      response.on('data', chunk => chunks.push(chunk));
      response.on('end', () => resolve({
        buffer: Buffer.concat(chunks),
        contentType: response.headers['content-type'] || 'application/octet-stream'
      }));
      response.on('error', reject);
    });

    request.on('error', reject);
    request.on('timeout', () => {
      request.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Fetch book data from Open Library
async function fetchBookData(isbn) {
  try {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
    const { buffer } = await fetchUrl(url);
    const data = JSON.parse(buffer.toString());

    const bookData = data[`ISBN:${isbn}`];
    if (!bookData) return null;

    return {
      title: bookData.title,
      author: bookData.authors?.[0]?.name || 'Unknown Author',
      description: bookData.notes || bookData.subtitle || `A book by ${bookData.authors?.[0]?.name || 'Unknown'}`,
      coverUrl: bookData.cover?.large || bookData.cover?.medium || null
    };
  } catch (error) {
    console.warn(`  Failed to fetch book data: ${error.message}`);
    return null;
  }
}

// Download cover image
async function downloadCover(coverUrl) {
  if (!coverUrl) return null;

  try {
    const { buffer, contentType } = await fetchUrl(coverUrl);

    // Verify it's an image
    if (!contentType.startsWith('image/')) {
      return null;
    }

    return { buffer, contentType };
  } catch (error) {
    console.warn(`  Failed to download cover: ${error.message}`);
    return null;
  }
}

// Process single book
async function processBook(bookInfo) {
  const { isbn, genre, copies } = bookInfo;

  try {
    // Check if book with this ISBN already exists
    const existing = await Book.findOne({ isbn });
    if (existing) {
      console.log(`  Skipping ISBN ${isbn} - already exists: "${existing.title}"`);
      return null;
    }

    console.log(`  Fetching data for ISBN: ${isbn}`);
    const bookData = await fetchBookData(isbn);

    if (!bookData) {
      console.log(`  No data found for ISBN: ${isbn}`);
      return null;
    }

    console.log(`  Found: "${bookData.title}" by ${bookData.author}`);

    // Download cover image
    let coverImageId = null;
    if (bookData.coverUrl) {
      console.log(`  Downloading cover image...`);
      const coverData = await downloadCover(bookData.coverUrl);

      if (coverData) {
        const filename = `${isbn}.jpg`;
        const fileId = await uploadToGridFS(coverData.buffer, filename, coverData.contentType);
        coverImageId = fileId.toString();
        console.log(`  Cover uploaded to GridFS: ${coverImageId}`);
      }
    }

    // Create book
    const book = await Book.create({
      isbn,
      title: bookData.title,
      author: bookData.author,
      genre,
      description: bookData.description.substring(0, 2000),
      totalCopies: copies,
      availableCopies: copies,
      coverImage: coverImageId
    });

    console.log(`  Created: "${book.title}"\n`);
    return book;
  } catch (error) {
    console.error(`  Error processing ISBN ${isbn}: ${error.message}`);
    return null;
  }
}

// Add delay between requests to be nice to the API
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Main function
async function main() {
  console.log('='.repeat(60));
  console.log('Populate Books Script');
  console.log('='.repeat(60));

  // Connect to MongoDB
  console.log('\nConnecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Initialize GridFS
  initGridFS();
  console.log('GridFS initialized\n');

  let created = 0;
  let skipped = 0;
  let failed = 0;

  // Process books one by one with delay
  for (let i = 0; i < popularBooks.length; i++) {
    const bookInfo = popularBooks[i];
    console.log(`[${i + 1}/${popularBooks.length}] Processing ISBN: ${bookInfo.isbn}`);

    const result = await processBook(bookInfo);

    if (result) {
      created++;
    } else {
      skipped++;
    }

    // Add delay between requests (be nice to the API)
    if (i < popularBooks.length - 1) {
      await delay(1000);
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total processed: ${popularBooks.length}`);
  console.log(`Created: ${created}`);
  console.log(`Skipped: ${skipped}`);

  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
