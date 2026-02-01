/**
 * Migration Script: Disk Storage to GridFS
 * Migrates existing book images from /uploads directory to MongoDB GridFS
 *
 * Usage: node scripts/migrateToGridFS.js [--dry-run] [--delete-old]
 *
 * Options:
 *   --dry-run     Preview changes without making them
 *   --delete-old  Delete old files after successful migration
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Use Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const Book = require('../models/Book');
const { initGridFS } = require('../config/gridfs');
const { uploadToGridFS } = require('../utils/gridfsStorage');

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const DELETE_OLD = args.includes('--delete-old');

const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Track migration results
const results = {
  total: 0,
  migrated: 0,
  skipped: 0,
  failed: 0,
  failedBooks: []
};

// Mime type lookup
const getMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp'
  };
  return mimeTypes[ext] || 'image/jpeg';
};

// Check if coverImage is already a GridFS ObjectId
const isObjectId = (value) => {
  if (!value) return false;
  if (mongoose.Types.ObjectId.isValid(value)) {
    return String(new mongoose.Types.ObjectId(value)) === String(value);
  }
  return false;
};

// Migrate single book
async function migrateBook(book) {
  try {
    // Skip if already migrated (coverImage is ObjectId)
    if (isObjectId(book.coverImage)) {
      console.log(`  Skipping "${book.title}" - already migrated to GridFS`);
      results.skipped++;
      return;
    }

    // Skip if no image (null or undefined)
    if (!book.coverImage) {
      console.log(`  Skipping "${book.title}" - no cover image`);
      results.skipped++;
      return;
    }

    // Skip default images
    if (book.coverImage === 'default-book-cover.jpg') {
      console.log(`  Skipping "${book.title}" - using default image`);
      // Set to null since we don't use default filename anymore
      if (!DRY_RUN) {
        await Book.findByIdAndUpdate(book._id, { coverImage: null });
      }
      results.skipped++;
      return;
    }

    const imagePath = path.join(UPLOADS_DIR, book.coverImage);

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      console.warn(`  Warning: Image not found for "${book.title}": ${book.coverImage}`);
      results.failed++;
      results.failedBooks.push({ id: book._id, title: book.title, reason: 'File not found' });
      return;
    }

    console.log(`  Migrating "${book.title}" - ${book.coverImage}`);

    if (DRY_RUN) {
      console.log(`    [DRY RUN] Would upload ${imagePath} to GridFS`);
      results.migrated++;
      return;
    }

    // Read file and upload to GridFS
    const buffer = fs.readFileSync(imagePath);
    const mimeType = getMimeType(book.coverImage);
    const fileId = await uploadToGridFS(buffer, book.coverImage, mimeType);
    const imageIdString = fileId.toString();

    // Update book document
    await Book.findByIdAndUpdate(book._id, {
      coverImage: imageIdString
    });

    console.log(`    Uploaded to GridFS with ID: ${imageIdString}`);

    // Optionally delete old file
    if (DELETE_OLD) {
      fs.unlinkSync(imagePath);
      console.log(`    Deleted old file: ${imagePath}`);
    }

    results.migrated++;
  } catch (error) {
    console.error(`  Failed to migrate "${book.title}": ${error.message}`);
    results.failed++;
    results.failedBooks.push({ id: book._id, title: book.title, reason: error.message });
  }
}

// Main migration function
async function migrate() {
  console.log('='.repeat(60));
  console.log('GridFS Migration Script');
  console.log('='.repeat(60));

  if (DRY_RUN) {
    console.log('\n*** DRY RUN MODE - No changes will be made ***\n');
  }

  if (DELETE_OLD) {
    console.log('*** DELETE_OLD enabled - Old files will be removed ***\n');
  }

  // Connect to MongoDB
  console.log('Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Initialize GridFS
  if (!DRY_RUN) {
    initGridFS();
    console.log('GridFS initialized');
  }

  // Check if uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log('\nNo uploads directory found. Nothing to migrate.');
    await mongoose.connection.close();
    return;
  }

  // Get all books
  console.log('\nFetching books from database...');
  const books = await Book.find({});
  results.total = books.length;
  console.log(`Found ${books.length} books\n`);

  // Process books sequentially to avoid memory issues
  for (const book of books) {
    await migrateBook(book);
  }

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('Migration Summary');
  console.log('='.repeat(60));
  console.log(`Total books: ${results.total}`);
  console.log(`Migrated: ${results.migrated}`);
  console.log(`Skipped: ${results.skipped}`);
  console.log(`Failed: ${results.failed}`);

  if (results.failedBooks.length > 0) {
    console.log('\nFailed books:');
    results.failedBooks.forEach((book) => {
      console.log(`  - ${book.title} (${book.id}): ${book.reason}`);
    });
  }

  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
}

// Run migration
migrate()
  .then(() => process.exit(results.failed > 0 ? 1 : 0))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
