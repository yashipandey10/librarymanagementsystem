import { useState, useEffect } from 'react';
import { Button, Rating } from '../common';
import { reviewsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import './ReviewForm.scss';

const ReviewForm = ({ bookId, existingReview, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
    }
  }, [existingReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let response;
      if (existingReview) {
        response = await reviewsAPI.updateReview(existingReview._id, { rating, comment });
      } else {
        response = await reviewsAPI.addReview({ bookId, rating, comment });
      }
      if (response.success && onSuccess) {
        onSuccess(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="review-form review-form--disabled">
        <p>Please login to leave a review</p>
      </div>
    );
  }

  return (
    <form className="review-form" onSubmit={handleSubmit}>
      <h4 className="review-form__title">
        {existingReview ? 'Update Your Review' : 'Write a Review'}
      </h4>

      {error && <p className="review-form__error">{error}</p>}

      <div className="review-form__rating">
        <label>Your Rating:</label>
        <Rating value={rating} onChange={setRating} size="large" />
      </div>

      <div className="review-form__comment">
        <label htmlFor="comment">Comment (optional):</label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your thoughts about this book..."
          rows={4}
          maxLength={1000}
        />
        <span className="review-form__count">{comment.length}/1000</span>
      </div>

      <Button type="submit" loading={loading}>
        {existingReview ? 'Update Review' : 'Submit Review'}
      </Button>
    </form>
  );
};

export default ReviewForm;
