const Book = require('../models/Book');
const { uploadToGridFS, deleteFromGridFS } = require('../utils/gridfsStorage');

// @desc    Get all books with pagination and filtering
// @route   GET /api/books
// @access  Public
const getBooks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.genre) {
      filter.genre = req.query.genre;
    }
    if (req.query.available === 'true') {
      filter.availableCopies = { $gt: 0 };
    }

    // Build sort object
    let sort = {};
    if (req.query.sort) {
      const sortField = req.query.sort.startsWith('-')
        ? req.query.sort.substring(1)
        : req.query.sort;
      const sortOrder = req.query.sort.startsWith('-') ? -1 : 1;
      sort[sortField] = sortOrder;
    } else {
      sort = { createdAt: -1 };
    }

    const books = await Book.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const total = await Book.countDocuments(filter);

    res.json({
      success: true,
      data: books,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Search books by title or author
// @route   GET /api/books/search
// @access  Public
const searchBooks = async (req, res) => {
  try {
    const { q } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const searchRegex = new RegExp(q, 'i');
    const filter = {
      $or: [
        { title: searchRegex },
        { author: searchRegex }
      ]
    };

    const books = await Book.find(filter)
      .skip(skip)
      .limit(limit);

    const total = await Book.countDocuments(filter);

    res.json({
      success: true,
      data: books,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single book
// @route   GET /api/books/:id
// @access  Public
const getBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all genres
// @route   GET /api/books/genres
// @access  Public
const getGenres = async (req, res) => {
  try {
    const genres = Book.getGenres();
    res.json({
      success: true,
      data: genres
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create book
// @route   POST /api/books
// @access  Admin
const createBook = async (req, res) => {
  try {
    const { isbn, title, author, description, genre, totalCopies } = req.body;

    const bookData = {
      isbn,
      title,
      author,
      description,
      genre,
      totalCopies: totalCopies || 1,
      availableCopies: totalCopies || 1
    };

    // Handle cover image upload to GridFS
    if (req.file) {
      const fileId = await uploadToGridFS(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      bookData.coverImage = fileId.toString();
    }

    const book = await Book.create(bookData);

    res.status(201).json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update book
// @route   PUT /api/books/:id
// @access  Admin
const updateBook = async (req, res) => {
  try {
    let book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    const { isbn, title, author, description, genre, totalCopies } = req.body;

    const updateData = {
      isbn,
      title,
      author,
      description,
      genre
    };

    // Handle total copies update
    if (totalCopies !== undefined) {
      const currentlyBorrowed = book.totalCopies - book.availableCopies;
      if (totalCopies < currentlyBorrowed) {
        return res.status(400).json({
          success: false,
          message: `Cannot reduce total copies below ${currentlyBorrowed} (currently borrowed)`
        });
      }
      updateData.totalCopies = totalCopies;
      updateData.availableCopies = totalCopies - currentlyBorrowed;
    }

    // Handle cover image upload to GridFS
    if (req.file) {
      // Delete old image from GridFS if it exists
      if (book.coverImage) {
        try {
          await deleteFromGridFS(book.coverImage);
        } catch (err) {
          console.warn('Failed to delete old image:', err.message);
        }
      }
      // Upload new image to GridFS
      const fileId = await uploadToGridFS(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      updateData.coverImage = fileId.toString();
    }

    book = await Book.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true
    });

    res.json({
      success: true,
      data: book
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete book
// @route   DELETE /api/books/:id
// @access  Admin
const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Check if book has borrowed copies
    if (book.totalCopies !== book.availableCopies) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete book with borrowed copies'
      });
    }

    // Delete cover image from GridFS
    if (book.coverImage) {
      try {
        await deleteFromGridFS(book.coverImage);
      } catch (err) {
        console.warn('Failed to delete image:', err.message);
      }
    }

    await book.deleteOne();

    res.json({
      success: true,
      message: 'Book deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getBooks,
  searchBooks,
  getBook,
  getGenres,
  createBook,
  updateBook,
  deleteBook
};
