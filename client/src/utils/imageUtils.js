/**
 * Image utility functions for handling book cover images
 * Images are stored in MongoDB GridFS and served via /api/images/:id
 */

// Default placeholder image
export const DEFAULT_BOOK_IMAGE = '/default-book.svg';

// API URL for images
const getApiUrl = () => {
  return process.env.REACT_APP_API_URL || 'http://localhost:5000';
};

/**
 * Get the URL for a book cover image from GridFS
 * @param {string|null} coverImage - The GridFS ObjectId from database
 * @returns {string} - The full URL to the image
 */
export const getBookImageUrl = (coverImage) => {
  const API_URL = getApiUrl();

  // Handle null, undefined, or empty values
  if (!coverImage) {
    return DEFAULT_BOOK_IMAGE;
  }

  // Convert to string if it's an object (ObjectId from MongoDB)
  const imageId = typeof coverImage === 'object' ? coverImage.toString() : coverImage;

  // Handle empty strings
  if (!imageId || imageId.trim() === '') {
    return DEFAULT_BOOK_IMAGE;
  }

  // If it's already a full URL, return it
  if (imageId.startsWith('http://') || imageId.startsWith('https://')) {
    return imageId;
  }

  // Return the GridFS image URL
  return `${API_URL}/api/images/${imageId}`;
};

/**
 * Get the default book image URL
 * @returns {string} - The default book image URL
 */
export const getDefaultBookImage = () => {
  return DEFAULT_BOOK_IMAGE;
};

/**
 * Handle image error by setting fallback
 * @param {Event} event - The error event
 */
export const handleImageError = (event) => {
  const currentSrc = event.target.src;
  if (currentSrc !== DEFAULT_BOOK_IMAGE && !currentSrc.includes('default-book')) {
    console.warn('Image failed to load:', currentSrc);
    event.target.src = DEFAULT_BOOK_IMAGE;
  }
};
