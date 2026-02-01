/**
 * Upload Local Images Script
 * Reads images from /uploads folder and adds them as books to MongoDB with GridFS
 *
 * Usage: node scripts/uploadLocalImages.js
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

const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Book metadata mapping (filename without extension -> book info)
const bookMetadata = {
  'atomic_habbit': {
    title: 'Atomic Habits',
    author: 'James Clear',
    genre: 'self-help',
    description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. Tiny changes, remarkable results.',
    totalCopies: 5
  },
  'Can_t_Hurt_Me': {
    title: "Can't Hurt Me",
    author: 'David Goggins',
    genre: 'self-help',
    description: 'Master Your Mind and Defy the Odds. The story of overcoming pain, fear, and self-doubt.',
    totalCopies: 3
  },
  'Daring_Greatly': {
    title: 'Daring Greatly',
    author: 'Brené Brown',
    genre: 'self-help',
    description: 'How the Courage to Be Vulnerable Transforms the Way We Live, Love, Parent, and Lead.',
    totalCopies: 3
  },
  'Deep_Work': {
    title: 'Deep Work',
    author: 'Cal Newport',
    genre: 'self-help',
    description: 'Rules for Focused Success in a Distracted World. Learn to focus without distraction.',
    totalCopies: 4
  },
  'Grit_The_Power_of_Passion_and_Perseverance': {
    title: 'Grit: The Power of Passion and Perseverance',
    author: 'Angela Duckworth',
    genre: 'self-help',
    description: 'Why passion and persistence are the keys to success, not talent alone.',
    totalCopies: 3
  },
  'How_to_Win_Friends_and_Influence_People': {
    title: 'How to Win Friends and Influence People',
    author: 'Dale Carnegie',
    genre: 'self-help',
    description: 'The timeless classic on human relations and the art of dealing with people.',
    totalCopies: 5
  },
  'kidnapped': {
    title: 'Kidnapped',
    author: 'Robert Louis Stevenson',
    genre: 'Action & Adventure',
    description: 'A thrilling tale of adventure, kidnapping, and survival in 18th century Scotland.',
    totalCopies: 3
  },
  'Make_Your_Bed': {
    title: 'Make Your Bed',
    author: 'Admiral William H. McRaven',
    genre: 'self-help',
    description: 'Little Things That Can Change Your Life...And Maybe the World.',
    totalCopies: 4
  },
  'Man_s_Search_for_Meaning': {
    title: "Man's Search for Meaning",
    author: 'Viktor E. Frankl',
    genre: 'self-help',
    description: 'A Holocaust survivor reflects on finding purpose and meaning in life.',
    totalCopies: 4
  },
  'Mindset_The_New_Psychology_of_Success': {
    title: 'Mindset: The New Psychology of Success',
    author: 'Carol S. Dweck',
    genre: 'self-help',
    description: 'Discover how a growth mindset can help you achieve your goals.',
    totalCopies: 3
  },
  'The_7_Habits_of_Highly_Effective_People': {
    title: 'The 7 Habits of Highly Effective People',
    author: 'Stephen R. Covey',
    genre: 'self-help',
    description: 'Powerful lessons in personal change for a principle-centered life.',
    totalCopies: 5
  },
  'The_Four_Agreements': {
    title: 'The Four Agreements',
    author: 'Don Miguel Ruiz',
    genre: 'self-help',
    description: 'A Practical Guide to Personal Freedom based on ancient Toltec wisdom.',
    totalCopies: 3
  },
  'The_Miracle_Morning': {
    title: 'The Miracle Morning',
    author: 'Hal Elrod',
    genre: 'self-help',
    description: 'The Not-So-Obvious Secret Guaranteed to Transform Your Life Before 8AM.',
    totalCopies: 3
  },
  'The_Power_of_Now': {
    title: 'The Power of Now',
    author: 'Eckhart Tolle',
    genre: 'self-help',
    description: 'A Guide to Spiritual Enlightenment. Live in the present moment.',
    totalCopies: 4
  },
  'The_Subtle_Art_of_Not_Giving_a_Fuck': {
    title: 'The Subtle Art of Not Giving a F*ck',
    author: 'Mark Manson',
    genre: 'self-help',
    description: 'A Counterintuitive Approach to Living a Good Life.',
    totalCopies: 5
  },
  'Think_and_Grow_Rich': {
    title: 'Think and Grow Rich',
    author: 'Napoleon Hill',
    genre: 'self-help',
    description: 'The classic guide to wealth and success through positive thinking.',
    totalCopies: 4
  },
  'where_the_sun_never_set': {
    title: 'Where the Sun Never Set',
    author: 'Unknown Author',
    genre: 'Historical Fiction',
    description: 'A historical journey through lands where the sun never sets.',
    totalCopies: 3
  }
};

// Get mime type from extension
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

// Process single image
async function processImage(filename) {
  const nameWithoutExt = path.parse(filename).name;
  const metadata = bookMetadata[nameWithoutExt];

  if (!metadata) {
    console.log(`  Skipping ${filename} - no metadata defined`);
    return null;
  }

  try {
    // Check if book already exists
    const existingBook = await Book.findOne({ title: metadata.title });
    if (existingBook) {
      console.log(`  Skipping "${metadata.title}" - already exists`);
      return null;
    }

    const imagePath = path.join(UPLOADS_DIR, filename);
    const buffer = fs.readFileSync(imagePath);
    const mimeType = getMimeType(filename);

    // Upload to GridFS
    const fileId = await uploadToGridFS(buffer, filename, mimeType);
    const imageId = fileId.toString(); // Convert ObjectId to string
    console.log(`  Uploaded image to GridFS: ${imageId}`);

    // Create book
    const book = await Book.create({
      title: metadata.title,
      author: metadata.author,
      genre: metadata.genre,
      description: metadata.description,
      totalCopies: metadata.totalCopies,
      availableCopies: metadata.totalCopies,
      coverImage: imageId
    });

    console.log(`  Created book: "${book.title}"`);
    return book;
  } catch (error) {
    console.error(`  Error processing ${filename}: ${error.message}`);
    return null;
  }
}

// Main function
async function main() {
  console.log('='.repeat(60));
  console.log('Upload Local Images Script');
  console.log('='.repeat(60));

  // Connect to MongoDB
  console.log('\nConnecting to MongoDB...');
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Initialize GridFS
  initGridFS();
  console.log('GridFS initialized');

  // Check if uploads directory exists
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log('\nNo uploads directory found.');
    await mongoose.connection.close();
    return;
  }

  // Get all image files
  const files = fs.readdirSync(UPLOADS_DIR).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
  });

  console.log(`\nFound ${files.length} images in uploads folder\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const file of files) {
    console.log(`Processing: ${file}`);
    const result = await processImage(file);
    if (result) {
      created++;
    } else {
      skipped++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('Summary');
  console.log('='.repeat(60));
  console.log(`Total images: ${files.length}`);
  console.log(`Books created: ${created}`);
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
