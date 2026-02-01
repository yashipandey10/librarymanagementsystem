const User = require('../models/User');
const Book = require('../models/Book');
const BorrowRecord = require('../models/BorrowRecord');
const Review = require('../models/Review');

// @desc    Get dashboard stats
// @route   GET /api/admin/dashboard
// @access  Admin
const getDashboardStats = async (req, res) => {
  try {
    // Update overdue status
    await BorrowRecord.updateOverdueStatus();

    const [
      totalBooks,
      totalUsers,
      totalBorrows,
      activeBorrows,
      overdueBorrows,
      pendingRequests,
      totalFines
    ] = await Promise.all([
      Book.countDocuments(),
      User.countDocuments({ role: 'user' }),
      BorrowRecord.countDocuments(),
      BorrowRecord.countDocuments({ status: 'borrowed' }),
      BorrowRecord.countDocuments({ status: 'overdue' }),
      BorrowRecord.countDocuments({ status: 'pending' }),
      BorrowRecord.aggregate([
        { $match: { fineAmount: { $gt: 0 }, finePaid: false } },
        { $group: { _id: null, total: { $sum: '$fineAmount' } } }
      ])
    ]);

    // Get books by genre
    const booksByGenre = await Book.aggregate([
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get recent borrows
    const recentBorrows = await BorrowRecord.find()
      .populate('userId', 'firstName lastName')
      .populate('bookId', 'title')
      .sort({ borrowDate: -1 })
      .limit(5);

    // Get most borrowed books
    const mostBorrowedBooks = await BorrowRecord.aggregate([
      { $group: { _id: '$bookId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: '_id',
          as: 'book'
        }
      },
      { $unwind: '$book' },
      {
        $project: {
          _id: 1,
          count: 1,
          title: '$book.title',
          author: '$book.author'
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalBooks,
          totalUsers,
          totalBorrows,
          activeBorrows,
          overdueBorrows,
          pendingRequests,
          totalUnpaidFines: totalFines[0]?.total || 0
        },
        booksByGenre,
        recentBorrows,
        mostBorrowedBooks
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = { role: 'user' };
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ];
    }

    const users = await User.find(filter)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments(filter);

    res.json({
      success: true,
      data: users,
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

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle-status
// @access  Admin
const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot modify admin status'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    // If deactivating, clear refresh token
    if (!user.isActive) {
      user.refreshToken = null;
      await user.save();
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        isActive: user.isActive
      },
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get user details with borrow history
// @route   GET /api/admin/users/:id
// @access  Admin
const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const borrowHistory = await BorrowRecord.find({ userId: user._id })
      .populate('bookId', 'title author')
      .sort({ borrowDate: -1 })
      .limit(10);

    const totalFines = await BorrowRecord.aggregate([
      { $match: { userId: user._id, fineAmount: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$fineAmount' } } }
    ]);

    const unpaidFines = await BorrowRecord.aggregate([
      { $match: { userId: user._id, fineAmount: { $gt: 0 }, finePaid: false } },
      { $group: { _id: null, total: { $sum: '$fineAmount' } } }
    ]);

    res.json({
      success: true,
      data: {
        user,
        borrowHistory,
        totalFines: totalFines[0]?.total || 0,
        unpaidFines: unpaidFines[0]?.total || 0
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

module.exports = {
  getDashboardStats,
  getUsers,
  toggleUserStatus,
  getUserDetails
};
