const BorrowRecord = require('../models/BorrowRecord');
const Book = require('../models/Book');
const User = require('../models/User');

// @desc    Request to borrow a book (creates pending request)
// @route   POST /api/borrows
// @access  User
const borrowBook = async (req, res) => {
  try {
    const { bookId } = req.body;
    const userId = req.user._id;

    // Validate user is active
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account is inactive. Please contact administrator.'
      });
    }

    // Check user's current borrow count (including pending)
    const activeBorrows = await BorrowRecord.countDocuments({
      userId,
      status: { $in: ['borrowed', 'overdue', 'pending', 'approved'] }
    });

    if (activeBorrows >= 5) {
      return res.status(400).json({
        success: false,
        message: 'You have reached the maximum limit of 5 active borrow requests/books'
      });
    }

    // Check if user already has this book in any active status
    const existingBorrow = await BorrowRecord.findOne({
      userId,
      bookId,
      status: { $in: ['borrowed', 'overdue', 'pending', 'approved'] }
    });

    if (existingBorrow) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending request or active borrow for this book'
      });
    }

    // Check book exists
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    // Create pending borrow request (don't update availability yet)
    const borrowRecord = await BorrowRecord.create({
      userId,
      bookId,
      status: 'pending'
    });

    // Populate the borrow record
    await borrowRecord.populate('bookId', 'title author coverImage');

    res.status(201).json({
      success: true,
      data: borrowRecord,
      message: 'Borrow request submitted successfully. Waiting for admin approval.'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create borrow request'
    });
  }
};

// @desc    Return a book
// @route   PUT /api/borrows/:id/return
// @access  User
const returnBook = async (req, res) => {
  try {
    const borrowRecord = await BorrowRecord.findById(req.params.id);

    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found'
      });
    }

    // Check if it belongs to the user (unless admin)
    if (borrowRecord.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to return this book'
      });
    }

    if (borrowRecord.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'Book already returned'
      });
    }

    if (borrowRecord.status !== 'borrowed' && borrowRecord.status !== 'overdue') {
      return res.status(400).json({
        success: false,
        message: `Cannot return book with status: ${borrowRecord.status}`
      });
    }

    // Calculate fine
    const returnDate = new Date();
    borrowRecord.returnDate = returnDate;
    borrowRecord.status = 'returned';

    const fine = borrowRecord.calculateFine();
    borrowRecord.fineAmount = fine;

    await borrowRecord.save();

    // Update book availability
    await Book.findByIdAndUpdate(borrowRecord.bookId, {
      $inc: { availableCopies: 1 }
    });

    // Update user's currently borrowed count
    await User.findByIdAndUpdate(borrowRecord.userId, {
      $inc: { currentlyBorrowed: -1 }
    });

    await borrowRecord.populate('bookId', 'title author coverImage');

    res.json({
      success: true,
      data: borrowRecord,
      message: fine > 0 ? `Book returned with a fine of ₹${fine}` : 'Book returned successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Renew a book
// @route   PUT /api/borrows/:id/renew
// @access  User
const renewBook = async (req, res) => {
  try {
    const borrowRecord = await BorrowRecord.findById(req.params.id);

    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found'
      });
    }

    // Check if it belongs to the user
    if (borrowRecord.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to renew this book'
      });
    }

    if (borrowRecord.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: 'Cannot renew a returned book'
      });
    }

    if (borrowRecord.renewalCount >= 2) {
      return res.status(400).json({
        success: false,
        message: 'Maximum renewal limit reached (2 renewals)'
      });
    }

    // Extend due date by 14 days from current due date
    const newDueDate = new Date(borrowRecord.dueDate);
    newDueDate.setDate(newDueDate.getDate() + 14);

    borrowRecord.dueDate = newDueDate;
    borrowRecord.renewalCount += 1;
    borrowRecord.status = 'borrowed'; // Reset if was overdue

    await borrowRecord.save();
    await borrowRecord.populate('bookId', 'title author coverImage');

    res.json({
      success: true,
      data: borrowRecord,
      message: `Book renewed. New due date: ${newDueDate.toLocaleDateString()}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's borrow history
// @route   GET /api/borrows/my-borrows
// @access  User
const getMyBorrows = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    const borrows = await BorrowRecord.find(filter)
      .populate('bookId', 'title author coverImage genre')
      .sort({ requestDate: -1, borrowDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BorrowRecord.countDocuments(filter);

    // Update overdue status and calculate fines
    const borrowsWithFines = borrows.map(borrow => {
      const borrowObj = borrow.toObject();
      if (borrow.status !== 'returned') {
        borrowObj.currentFine = borrow.calculateFine();
      }
      return borrowObj;
    });

    res.json({
      success: true,
      data: borrowsWithFines,
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

// @desc    Get user's current borrows
// @route   GET /api/borrows/current
// @access  User
const getCurrentBorrows = async (req, res) => {
  try {
    const borrows = await BorrowRecord.find({
      userId: req.user._id,
      status: { $in: ['borrowed', 'overdue'] }
    })
      .populate('bookId', 'title author coverImage genre')
      .sort({ dueDate: 1 });

    // Update overdue status
    await BorrowRecord.updateOverdueStatus();

    const borrowsWithFines = borrows.map(borrow => {
      const borrowObj = borrow.toObject();
      borrowObj.currentFine = borrow.calculateFine();
      return borrowObj;
    });

    res.json({
      success: true,
      data: borrowsWithFines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user's fines
// @route   GET /api/borrows/my-fines
// @access  User
const getMyFines = async (req, res) => {
  try {
    const borrows = await BorrowRecord.find({
      userId: req.user._id,
      fineAmount: { $gt: 0 }
    })
      .populate('bookId', 'title author')
      .sort({ returnDate: -1 });

    const totalUnpaidFines = borrows
      .filter(b => !b.finePaid)
      .reduce((sum, b) => sum + b.fineAmount, 0);

    res.json({
      success: true,
      data: {
        fines: borrows,
        totalUnpaidFines
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Pay fine
// @route   PUT /api/borrows/:id/pay-fine
// @access  User
const payFine = async (req, res) => {
  try {
    const borrowRecord = await BorrowRecord.findById(req.params.id);

    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        message: 'Borrow record not found'
      });
    }

    if (borrowRecord.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    }

    if (borrowRecord.fineAmount === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fine to pay'
      });
    }

    if (borrowRecord.finePaid) {
      return res.status(400).json({
        success: false,
        message: 'Fine already paid'
      });
    }

    borrowRecord.finePaid = true;
    await borrowRecord.save();

    res.json({
      success: true,
      message: `Fine of ₹${borrowRecord.fineAmount} paid successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all borrows (Admin)
// @route   GET /api/borrows
// @access  Admin
const getAllBorrows = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const borrows = await BorrowRecord.find(filter)
      .populate('userId', 'firstName lastName email')
      .populate('bookId', 'title author')
      .populate('approvedBy', 'firstName lastName')
      .sort({ requestDate: -1, borrowDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BorrowRecord.countDocuments(filter);

    res.json({
      success: true,
      data: borrows,
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

// @desc    Get overdue borrows (Admin)
// @route   GET /api/borrows/overdue
// @access  Admin
const getOverdueBorrows = async (req, res) => {
  try {
    // Update overdue status first
    await BorrowRecord.updateOverdueStatus();

    const borrows = await BorrowRecord.find({ status: 'overdue' })
      .populate('userId', 'firstName lastName email phone')
      .populate('bookId', 'title author')
      .sort({ dueDate: 1 });

    const borrowsWithFines = borrows.map(borrow => {
      const borrowObj = borrow.toObject();
      borrowObj.currentFine = borrow.calculateFine();
      return borrowObj;
    });

    res.json({
      success: true,
      data: borrowsWithFines
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch overdue borrows'
    });
  }
};

// @desc    Get pending borrow requests (Admin)
// @route   GET /api/borrows/pending
// @access  Admin
const getPendingRequests = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const borrows = await BorrowRecord.find({ status: 'pending' })
      .populate('userId', 'firstName lastName email phone')
      .populate('bookId', 'title author coverImage availableCopies totalCopies')
      .sort({ requestDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await BorrowRecord.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: borrows,
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
      message: error.message || 'Failed to fetch pending requests'
    });
  }
};

// @desc    Approve a borrow request (Admin)
// @route   PUT /api/borrows/:id/approve
// @access  Admin
const approveBorrowRequest = async (req, res) => {
  try {
    const borrowRecord = await BorrowRecord.findById(req.params.id);

    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        message: 'Borrow request not found'
      });
    }

    if (borrowRecord.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot approve request with status: ${borrowRecord.status}`
      });
    }

    // Check book still exists and is available
    const book = await Book.findById(borrowRecord.bookId);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: 'Book not found'
      });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No copies available. Cannot approve this request.'
      });
    }

    // Check user is still active
    const user = await User.findById(borrowRecord.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!user.isActive) {
      return res.status(400).json({
        success: false,
        message: 'User account is inactive. Cannot approve request.'
      });
    }

    // Check user hasn't exceeded limit
    const activeBorrows = await BorrowRecord.countDocuments({
      userId: borrowRecord.userId,
      status: { $in: ['borrowed', 'overdue', 'approved'] }
    });

    if (activeBorrows >= 5) {
      return res.status(400).json({
        success: false,
        message: 'User has reached maximum borrow limit. Cannot approve request.'
      });
    }

    // Approve the request
    const borrowDate = new Date();
    const dueDate = new Date(borrowDate);
    dueDate.setDate(dueDate.getDate() + 14);

    borrowRecord.status = 'borrowed';
    borrowRecord.borrowDate = borrowDate;
    borrowRecord.dueDate = dueDate;
    borrowRecord.approvedBy = req.user._id;
    await borrowRecord.save();

    // Update book availability
    book.availableCopies -= 1;
    await book.save();

    // Update user's currently borrowed count
    user.currentlyBorrowed += 1;
    await user.save();

    await borrowRecord.populate('userId', 'firstName lastName email');
    await borrowRecord.populate('bookId', 'title author coverImage');

    res.json({
      success: true,
      data: borrowRecord,
      message: 'Borrow request approved successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to approve borrow request'
    });
  }
};

// @desc    Reject a borrow request (Admin)
// @route   PUT /api/borrows/:id/reject
// @access  Admin
const rejectBorrowRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const borrowRecord = await BorrowRecord.findById(req.params.id);

    if (!borrowRecord) {
      return res.status(404).json({
        success: false,
        message: 'Borrow request not found'
      });
    }

    if (borrowRecord.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status: ${borrowRecord.status}`
      });
    }

    // Reject the request
    borrowRecord.status = 'rejected';
    borrowRecord.approvedBy = req.user._id;
    if (reason) {
      borrowRecord.rejectionReason = reason;
    }
    await borrowRecord.save();

    await borrowRecord.populate('userId', 'firstName lastName email');
    await borrowRecord.populate('bookId', 'title author');

    res.json({
      success: true,
      data: borrowRecord,
      message: 'Borrow request rejected successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to reject borrow request'
    });
  }
};

module.exports = {
  borrowBook,
  returnBook,
  renewBook,
  getMyBorrows,
  getCurrentBorrows,
  getMyFines,
  payFine,
  getAllBorrows,
  getOverdueBorrows,
  getPendingRequests,
  approveBorrowRequest,
  rejectBorrowRequest
};
