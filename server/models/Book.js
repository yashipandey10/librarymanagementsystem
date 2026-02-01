const mongoose = require('mongoose');

const GENRES = [
  'Action & Adventure',
  'Biography',
  'Mystery',
  'Horror',
  'Thriller & Suspense',
  'Historical Fiction',
  'Romance',
  'self-help',
  'folktales',
  'History',
  'True Crime',
  'Religion & Spirituality'
];

const bookSchema = new mongoose.Schema({
  isbn: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  title: {
    type: String,
    required: [true, 'Book title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  author: {
    type: String,
    required: [true, 'Author name is required'],
    trim: true,
    maxlength: [100, 'Author name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    enum: {
      values: GENRES,
      message: 'Invalid genre selected'
    }
  },
  coverImage: {
    type: String,
    default: null
  },
  totalCopies: {
    type: Number,
    required: [true, 'Total copies is required'],
    min: [1, 'Must have at least 1 copy'],
    default: 1
  },
  availableCopies: {
    type: Number,
    min: [0, 'Available copies cannot be negative'],
    default: 1
  },
  averageRating: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  totalReviews: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for search functionality
bookSchema.index({ title: 'text', author: 'text' });

// Ensure availableCopies doesn't exceed totalCopies
bookSchema.pre('save', function(next) {
  if (this.availableCopies > this.totalCopies) {
    this.availableCopies = this.totalCopies;
  }
  next();
});

// Static method to get genres
bookSchema.statics.getGenres = function() {
  return GENRES;
};

module.exports = mongoose.model('Book', bookSchema);
