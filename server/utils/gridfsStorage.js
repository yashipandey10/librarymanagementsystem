const { ObjectId } = require('mongodb');
const { getGridFSBucket } = require('../config/gridfs');

/**
 * Upload a buffer to GridFS
 * @param {Buffer} buffer - The file buffer
 * @param {string} filename - Original filename
 * @param {string} mimetype - MIME type of the file
 * @returns {Promise<ObjectId>} The GridFS file ID
 */
async function uploadToGridFS(buffer, filename, mimetype) {
  const bucket = getGridFSBucket();

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimetype,
      metadata: {
        uploadDate: new Date(),
        originalName: filename
      }
    });

    uploadStream.on('error', (error) => {
      reject(error);
    });

    uploadStream.on('finish', () => {
      resolve(uploadStream.id);
    });

    uploadStream.end(buffer);
  });
}

/**
 * Upload from a readable stream to GridFS (for downloading from URLs)
 * @param {ReadableStream} readableStream - The source stream
 * @param {string} filename - Filename to store
 * @param {string} mimetype - MIME type
 * @returns {Promise<ObjectId>} The GridFS file ID
 */
async function uploadStreamToGridFS(readableStream, filename, mimetype) {
  const bucket = getGridFSBucket();

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: mimetype,
      metadata: {
        uploadDate: new Date(),
        originalName: filename
      }
    });

    uploadStream.on('error', reject);
    uploadStream.on('finish', () => resolve(uploadStream.id));

    readableStream.pipe(uploadStream);
  });
}

/**
 * Download a file from GridFS
 * @param {string|ObjectId} fileId - The GridFS file ID
 * @returns {GridFSBucketReadStream} Readable stream
 */
function downloadFromGridFS(fileId) {
  const bucket = getGridFSBucket();
  const objectId = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
  return bucket.openDownloadStream(objectId);
}

/**
 * Delete a file from GridFS
 * @param {string|ObjectId} fileId - The GridFS file ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteFromGridFS(fileId) {
  const bucket = getGridFSBucket();
  const objectId = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
  await bucket.delete(objectId);
  return true;
}

/**
 * Get file info/metadata from GridFS
 * @param {string|ObjectId} fileId - The GridFS file ID
 * @returns {Promise<Object|null>} File metadata or null if not found
 */
async function getFileInfo(fileId) {
  const bucket = getGridFSBucket();
  const objectId = typeof fileId === 'string' ? new ObjectId(fileId) : fileId;
  const files = await bucket.find({ _id: objectId }).toArray();
  return files[0] || null;
}

/**
 * Check if a file exists in GridFS
 * @param {string|ObjectId} fileId - The GridFS file ID
 * @returns {Promise<boolean>}
 */
async function fileExistsInGridFS(fileId) {
  const info = await getFileInfo(fileId);
  return info !== null;
}

module.exports = {
  uploadToGridFS,
  uploadStreamToGridFS,
  downloadFromGridFS,
  deleteFromGridFS,
  getFileInfo,
  fileExistsInGridFS
};
