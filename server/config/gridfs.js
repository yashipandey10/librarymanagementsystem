const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');

let bucket = null;

/**
 * Initialize GridFS bucket after MongoDB connection is established
 * @returns {GridFSBucket} The initialized GridFS bucket
 */
const initGridFS = () => {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('MongoDB connection not established. Call initGridFS after connecting to database.');
  }

  bucket = new GridFSBucket(db, {
    bucketName: 'bookImages'
  });

  console.log('GridFS bucket initialized');
  return bucket;
};

/**
 * Get the GridFS bucket instance
 * @returns {GridFSBucket} The GridFS bucket
 * @throws {Error} If bucket not initialized
 */
const getGridFSBucket = () => {
  if (!bucket) {
    throw new Error('GridFS bucket not initialized. Call initGridFS first.');
  }
  return bucket;
};

/**
 * Check if GridFS is initialized
 * @returns {boolean}
 */
const isGridFSInitialized = () => {
  return bucket !== null;
};

module.exports = { initGridFS, getGridFSBucket, isGridFSInitialized };
