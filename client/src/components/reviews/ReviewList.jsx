import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Rating, Loading, Pagination, Button } from '../common';
import { reviewsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';
import './ReviewList.scss';

const ReviewList = ({ bookId, onReviewsLoaded }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const { user } = useAuth();

  const fetchReviews = async (page = 1) => {
    setLoading(true);
    try {
      const response = await reviewsAPI.getBookReviews(bookId, { page, limit: 5 });
      if (response.success) {
        setReviews(response.data);
        setPagination(response.pagination);
        if (onReviewsLoaded) {
          onReviewsLoaded(response.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [bookId]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      const response = await reviewsAPI.deleteReview(reviewId);
      if (response.success) {
        fetchReviews(pagination.page);
      }
    } catch (err) {
      console.error('Failed to delete review:', err);
    }
  };

  if (loading) return <Loading size="small" />;

  if (reviews.length === 0) {
    return (
      <div className="review-list review-list--empty">
        <p>No reviews yet. Be the first to review this book!</p>
      </div>
    );
  }

  return (
    <div className="review-list">
      <h3 className="review-list__title">Reviews ({pagination.total})</h3>

      {reviews.map((review) => (
        <div key={review._id} className="review-card">
          <div className="review-card__header">
            <div className="review-card__user">
              <span className="review-card__name">
                {review.userId?.firstName} {review.userId?.lastName}
              </span>
              <span className="review-card__date">
                {format(new Date(review.createdAt), 'MMM dd, yyyy')}
              </span>
            </div>
            <Rating value={review.rating} readonly size="small" />
          </div>
          {review.comment && (
            <p className="review-card__comment">{review.comment}</p>
          )}
          {user && (user._id === review.userId?._id || user.role === 'admin') && (
            <Button
              size="small"
              variant="ghost"
              onClick={() => handleDelete(review._id)}
            >
              Delete
            </Button>
          )}
        </div>
      ))}

      {pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={fetchReviews}
        />
      )}
    </div>
  );
};

export default ReviewList;
