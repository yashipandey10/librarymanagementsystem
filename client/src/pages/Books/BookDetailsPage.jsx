import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiHeart } from 'react-icons/fi';
import { booksAPI, wishlistAPI, reviewsAPI } from '../../api';
import { Button, Loading, Rating } from '../../components/common';
import { BorrowButton } from '../../components/borrow';
import { ReviewList, ReviewForm } from '../../components/reviews';
import { useAuth } from '../../context/AuthContext';
import { getBookImageUrl, handleImageError } from '../../utils/imageUtils';
import './BookDetailsPage.scss';

const BookDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inWishlist, setInWishlist] = useState(false);
  const [myReview, setMyReview] = useState(null);
  const [wishlistLoading, setWishlistLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bookResponse = await booksAPI.getBook(id);
        if (bookResponse.success) {
          setBook(bookResponse.data);
        }

        if (isAuthenticated && !isAdmin) {
          const wishlistResponse = await wishlistAPI.checkWishlist(id);
          setInWishlist(wishlistResponse.data.inWishlist);

          const reviewResponse = await reviewsAPI.getMyReview(id);
          setMyReview(reviewResponse.data);
        }
      } catch (err) {
        console.error('Error fetching book:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isAuthenticated, isAdmin]);

  const handleWishlistToggle = async () => {
    setWishlistLoading(true);
    try {
      if (inWishlist) {
        await wishlistAPI.removeFromWishlist(id);
        setInWishlist(false);
      } else {
        await wishlistAPI.addToWishlist(id);
        setInWishlist(true);
      }
    } catch (err) {
      console.error('Wishlist error:', err);
    } finally {
      setWishlistLoading(false);
    }
  };

  const handleBorrowSuccess = () => {
    setBook(prev => ({
      ...prev,
      availableCopies: prev.availableCopies - 1
    }));
  };

  const handleReviewSuccess = (review) => {
    setMyReview(review);
    // Refetch book to update rating
    booksAPI.getBook(id).then(res => {
      if (res.success) setBook(res.data);
    });
  };

  if (loading) return <Loading fullScreen />;

  if (!book) {
    return (
      <div className="book-details-page">
        <p>Book not found</p>
        <Button onClick={() => navigate('/')}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="book-details-page">
      <button className="book-details-page__back" onClick={() => navigate(-1)}>
        <FiArrowLeft /> Back
      </button>

      <div className="book-details">
        <div className="book-details__image">
          <img
            src={getBookImageUrl(book.coverImage)}
            alt={book.title}
            onError={handleImageError}
          />
        </div>

        <div className="book-details__info">
          <h1 className="book-details__title">{book.title}</h1>
          <p className="book-details__author">by {book.author}</p>

          <div className="book-details__meta">
            <span className="book-details__genre">{book.genre}</span>
            {book.isbn && <span className="book-details__isbn">ISBN: {book.isbn}</span>}
          </div>

          {book.averageRating > 0 && (
            <div className="book-details__rating">
              <Rating value={book.averageRating} readonly />
              <span>({book.totalReviews} reviews)</span>
            </div>
          )}

          <p className="book-details__availability">
            <strong>{book.availableCopies}</strong> of <strong>{book.totalCopies}</strong> copies available
          </p>

          {book.description && (
            <div className="book-details__description">
              <h3>Description</h3>
              <p>{book.description}</p>
            </div>
          )}

          {!isAdmin && (
            <div className="book-details__actions">
              <BorrowButton
                bookId={book._id}
                availableCopies={book.availableCopies}
                onSuccess={handleBorrowSuccess}
              />
              {isAuthenticated && (
                <Button
                  variant={inWishlist ? 'danger' : 'secondary'}
                  onClick={handleWishlistToggle}
                  loading={wishlistLoading}
                >
                  <FiHeart style={{ fill: inWishlist ? 'currentColor' : 'none' }} />
                  {inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="book-details__reviews">
        {!isAdmin && (
          <ReviewForm
            bookId={book._id}
            existingReview={myReview}
            onSuccess={handleReviewSuccess}
          />
        )}
        <ReviewList bookId={book._id} />
      </div>
    </div>
  );
};

export default BookDetailsPage;
