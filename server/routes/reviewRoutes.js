const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  getBookReviews,
  addReview,
  updateReview,
  deleteReview,
  getMyReview
} = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');
const { userOnly } = require('../middleware/roleCheck');

// Validation rules
const reviewValidation = [
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment cannot exceed 1000 characters')
];

// Validation middleware
const validate = (req, res, next) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }
  next();
};

// Public routes
router.get('/book/:bookId', getBookReviews);

// User routes
router.post('/', protect, userOnly, reviewValidation, validate, addReview);
router.get('/my-review/:bookId', protect, userOnly, getMyReview);
router.put('/:id', protect, userOnly, reviewValidation, validate, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
