const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  getBooks,
  searchBooks,
  getBook,
  getGenres,
  createBook,
  updateBook,
  deleteBook
} = require('../controllers/bookController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/roleCheck');

// Multer configuration for image upload (memory storage for GridFS)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Public routes
router.get('/', getBooks);
router.get('/search', searchBooks);
router.get('/genres', getGenres);
router.get('/:id', getBook);

// Admin routes
router.post('/', protect, adminOnly, upload.single('coverImage'), createBook);
router.put('/:id', protect, adminOnly, upload.single('coverImage'), updateBook);
router.delete('/:id', protect, adminOnly, deleteBook);

module.exports = router;
