const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/borrowController');
const { protect } = require('../middleware/auth');
const { adminOnly, userOnly } = require('../middleware/roleCheck');

// User routes
router.post('/', protect, userOnly, borrowBook);
router.get('/my-borrows', protect, userOnly, getMyBorrows);
router.get('/current', protect, userOnly, getCurrentBorrows);
router.get('/my-fines', protect, userOnly, getMyFines);
router.put('/:id/return', protect, userOnly, returnBook);
router.put('/:id/renew', protect, userOnly, renewBook);
router.put('/:id/pay-fine', protect, userOnly, payFine);

// Admin routes
router.get('/', protect, adminOnly, getAllBorrows);
router.get('/overdue', protect, adminOnly, getOverdueBorrows);
router.get('/pending', protect, adminOnly, getPendingRequests);
router.put('/:id/approve', protect, adminOnly, approveBorrowRequest);
router.put('/:id/reject', protect, adminOnly, rejectBorrowRequest);

module.exports = router;
