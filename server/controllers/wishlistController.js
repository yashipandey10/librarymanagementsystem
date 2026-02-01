const Wishlist = require('../models/Wishlist');
const Book = require('../models/Book');

// @desc    Get user's wishlist
// @route   GET /api/wishlist
// @access  User
const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user._id })
      .populate('books.bookId', 'title author coverImage genre availableCopies averageRating');

    if (!wishlist) {
      wishlist = { books: [] };
    }

    res.json({
      success: true,
      data: wishlist.books
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add book to wishlist
// @route   POST /api/wishlist/add/:bookId
// @access  User
const addToWishlist = async (req, res) => {
  try {
    const bookId = req.params.bookId;

    // Check if book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    let wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (!wishlist) {
      // Create new wishlist
      wishlist = await Wishlist.create({
        userId: req.user._id,
        books: [{ bookId, addedAt: new Date() }]
      });
    } else {
      // Check if book already in wishlist
      const bookExists = wishlist.books.some(
        item => item.bookId.toString() === bookId
      );

      if (bookExists) {
        return res.status(400).json({
          success: false,
          message: 'Book already in wishlist'
        });
      }

      wishlist.books.push({ bookId, addedAt: new Date() });
      await wishlist.save();
    }

    await wishlist.populate('books.bookId', 'title author coverImage genre availableCopies');

    res.status(201).json({
      success: true,
      data: wishlist.books,
      message: 'Book added to wishlist'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove book from wishlist
// @route   DELETE /api/wishlist/remove/:bookId
// @access  User
const removeFromWishlist = async (req, res) => {
  try {
    const bookId = req.params.bookId;

    const wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: 'Wishlist not found'
      });
    }

    const bookIndex = wishlist.books.findIndex(
      item => item.bookId.toString() === bookId
    );

    if (bookIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Book not found in wishlist'
      });
    }

    wishlist.books.splice(bookIndex, 1);
    await wishlist.save();

    await wishlist.populate('books.bookId', 'title author coverImage genre availableCopies');

    res.json({
      success: true,
      data: wishlist.books,
      message: 'Book removed from wishlist'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Check if book is in wishlist
// @route   GET /api/wishlist/check/:bookId
// @access  User
const checkWishlist = async (req, res) => {
  try {
    const bookId = req.params.bookId;

    const wishlist = await Wishlist.findOne({
      userId: req.user._id,
      'books.bookId': bookId
    });

    res.json({
      success: true,
      data: { inWishlist: !!wishlist }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkWishlist
};
