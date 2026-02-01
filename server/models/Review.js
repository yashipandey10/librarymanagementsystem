const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Ensure one review per user per book
reviewSchema.index({ userId: 1, bookId: 1 }, { unique: true });

// Static method to calculate average rating for a book
reviewSchema.statics.calculateAverageRating = async function(bookId) {
  const result = await this.aggregate([
    { $match: { bookId: bookId } },
    {
      $group: {
        _id: '$bookId',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  try {
    const Book = mongoose.model('Book');
    if (result.length > 0) {
      await Book.findByIdAndUpdate(bookId, {
        averageRating: Math.round(result[0].averageRating * 10) / 10,
        totalReviews: result[0].totalReviews
      });
    } else {
      await Book.findByIdAndUpdate(bookId, {
        averageRating: 0,
        totalReviews: 0
      });
    }
  } catch (error) {
    console.error('Error updating book rating:', error);
  }
};

// Update average rating after save
reviewSchema.post('save', async function() {
  await this.constructor.calculateAverageRating(this.bookId);
});

// Update average rating after delete
reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await doc.constructor.calculateAverageRating(doc.bookId);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
