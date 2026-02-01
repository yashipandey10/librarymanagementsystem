const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');
const { userOnly } = require('../middleware/roleCheck');

// All routes require authentication
router.use(protect, userOnly);

router.get('/', getWishlist);
router.post('/add/:bookId', addToWishlist);
router.delete('/remove/:bookId', removeFromWishlist);
router.get('/check/:bookId', checkWishlist);

module.exports = router;
