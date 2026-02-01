/**
 * Fix Cover Images Script
 * Converts coverImage ObjectId to String in existing books
 *
 * Usage: node scripts/fixCoverImages.js
 */

const mongoose = require('mongoose');
const path = require('path');
const dns = require('dns');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Use Google DNS to resolve MongoDB Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const Book = require('../models/Book');

async function fixCoverImages() {
  console.log('='.repeat(60));
  console.log('Fix Cover Images Script');
  console.log('='.repeat(60));

  // Connect to MongoDB
  console.log('\nConnecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Get all books with coverImage
  const books = await Book.find({ coverImage: { $ne: null } });
  console.log(`\nFound ${books.length} books with cover images\n`);

  let fixed = 0;
  let skipped = 0;

  for (const book of books) {
    const coverImage = book.coverImage;

    // Check if it's already a string (24-char hex)
    if (typeof coverImage === 'string' && /^[a-f0-9]{24}$/i.test(coverImage)) {
      console.log(`  "${book.title}" - already a string, skipping`);
      skipped++;
      continue;
    }

    // Convert to string
    const imageIdString = coverImage.toString();

    await Book.findByIdAndUpdate(book._id, {
      coverImage: imageIdString
    });

    console.log(`  "${book.title}" - fixed: ${imageIdString}`);
    fixed++;
  }

  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Fixed: ${fixed}`);
  console.log(`Skipped: ${skipped}`);

  await mongoose.connection.close();
  console.log('\nDatabase connection closed');
}

fixCoverImages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
