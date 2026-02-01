/**
 * Cleanup Books Script
 * Fixes books with invalid coverImage references
 * - Migrates valid local files to GridFS
 * - Sets coverImage to null for missing files
 *
 * Usage: node scripts/cleanupBooks.js
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dns = require('dns');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

dns.setServers(['8.8.8.8', '8.8.4.4']);

const Book = require('../models/Book');
const { initGridFS } = require('../config/gridfs');
const { uploadToGridFS } = require('../utils/gridfsStorage');

const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Check if value looks like a valid 24-char hex ObjectId
const isValidGridFSId = (value) => {
  if (!value || typeof value !== 'string') return false;
  return /^[a-f0-9]{24}$/i.test(value);
};

// Check if value looks like a filename
const isFilename = (value) => {
  if (!value || typeof value !== 'string') return false;
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(value);
};

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

async function main() {
  console.log('='.repeat(60));
  console.log('Cleanup Books Script');
  console.log('='.repeat(60));

  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  initGridFS();
  console.log('GridFS initialized\n');

  const books = await Book.find({});
  console.log(`Found ${books.length} books in database\n`);

  let migrated = 0;
  let cleared = 0;
  let alreadyOk = 0;
  let noImage = 0;

  for (const book of books) {
    const coverImage = book.coverImage;

    console.log(`Processing: "${book.title}"`);
    console.log(`  Current coverImage: ${coverImage || '(null)'}`);

    // Case 1: No cover image
    if (!coverImage) {
      console.log(`  Status: No image - OK\n`);
      noImage++;
      continue;
    }

    // Case 2: Already a valid GridFS ID
    if (isValidGridFSId(coverImage)) {
      console.log(`  Status: Already GridFS ID - OK\n`);
      alreadyOk++;
      continue;
    }

    // Case 3: It's a filename - check if file exists
    if (isFilename(coverImage)) {
      const filePath = path.join(UPLOADS_DIR, coverImage);

      if (fs.existsSync(filePath)) {
        // File exists - migrate to GridFS
        console.log(`  File found: ${filePath}`);
        console.log(`  Migrating to GridFS...`);

        const buffer = fs.readFileSync(filePath);
        const mimeType = getMimeType(coverImage);
        const fileId = await uploadToGridFS(buffer, coverImage, mimeType);
        const imageIdString = fileId.toString();

        await Book.findByIdAndUpdate(book._id, { coverImage: imageIdString });
        console.log(`  Migrated! New ID: ${imageIdString}\n`);
        migrated++;
      } else {
        // File doesn't exist - clear the reference
        console.log(`  File NOT found: ${filePath}`);
        console.log(`  Clearing coverImage...`);

        await Book.findByIdAndUpdate(book._id, { coverImage: null });
        console.log(`  Cleared!\n`);
        cleared++;
      }
    } else {
      // Unknown format - clear it
      console.log(`  Unknown format - clearing...`);
      await Book.findByIdAndUpdate(book._id, { coverImage: null });
      console.log(`  Cleared!\n`);
      cleared++;
    }
  }

  console.log('='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total books: ${books.length}`);
  console.log(`Already OK (GridFS): ${alreadyOk}`);
  console.log(`No image: ${noImage}`);
  console.log(`Migrated to GridFS: ${migrated}`);
  console.log(`Cleared (file missing): ${cleared}`);

  await mongoose.connection.close();
  console.log('\nDone!');
}

main().catch(console.error);
