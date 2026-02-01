const mongoose = require('mongoose');

const borrowRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  bookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: [true, 'Book ID is required']
  },
  borrowDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  returnDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'borrowed', 'returned', 'overdue'],
    default: 'pending'
  },
  requestDate: {
    type: Date,
    default: Date.now
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  fineAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  finePaid: {
    type: Boolean,
    default: false
  },
  renewalCount: {
    type: Number,
    default: 0,
    max: [2, 'Cannot renew more than 2 times']
  }
}, {
  timestamps: true
});

// Set due date to 14 days from borrow date before saving (only for approved/borrowed status)
borrowRecordSchema.pre('save', function(next) {
  if ((this.status === 'approved' || this.status === 'borrowed') && this.borrowDate && !this.dueDate) {
    const dueDate = new Date(this.borrowDate);
    dueDate.setDate(dueDate.getDate() + 14);
    this.dueDate = dueDate;
  }
  next();
});

// Calculate fine (₹1 per day after due date)
borrowRecordSchema.methods.calculateFine = function() {
  if (this.status === 'returned' && this.returnDate) {
    const dueDate = new Date(this.dueDate);
    const returnDate = new Date(this.returnDate);
    if (returnDate > dueDate) {
      const diffTime = Math.abs(returnDate - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
  } else if (this.status === 'borrowed' || this.status === 'overdue') {
    const dueDate = new Date(this.dueDate);
    const today = new Date();
    if (today > dueDate) {
      const diffTime = Math.abs(today - dueDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }
  }
  return 0;
};

// Static method to check and update overdue status
borrowRecordSchema.statics.updateOverdueStatus = async function() {
  const today = new Date();
  await this.updateMany(
    {
      status: 'borrowed',
      dueDate: { $lt: today }
    },
    {
      status: 'overdue'
    }
  );
};

// Static method to get pending requests count
borrowRecordSchema.statics.getPendingCount = async function() {
  return await this.countDocuments({ status: 'pending' });
};

module.exports = mongoose.model('BorrowRecord', borrowRecordSchema);
