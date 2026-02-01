import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiTrash2 } from 'react-icons/fi';
import { wishlistAPI } from '../../api';
import { Card, Button, Loading } from '../../components/common';
import { getBookImageUrl, handleImageError } from '../../utils/imageUtils';
import './UserPages.scss';

const WishlistPage = () => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = async () => {
    try {
      const response = await wishlistAPI.getWishlist();
      if (response.success) {
        setWishlist(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemove = async (bookId) => {
    try {
      await wishlistAPI.removeFromWishlist(bookId);
      setWishlist(prev => prev.filter(item => item.bookId._id !== bookId));
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    }
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="user-page">
      <h1 className="user-page__title">My Wishlist</h1>

      {wishlist.length === 0 ? (
        <div className="user-page__empty">
          <p>Your wishlist is empty</p>
          <Link to="/">
            <Button>Browse Books</Button>
          </Link>
        </div>
      ) : (
        <div className="wishlist-grid">
          {wishlist.map((item) => (
            <Card key={item.bookId._id} className="wishlist-card" hover={false}>
              <Link to={`/books/${item.bookId._id}`} className="wishlist-card__link">
                <img
                  src={getBookImageUrl(item.bookId.coverImage)}
                  alt={item.bookId.title}
                  className="wishlist-card__image"
                  onError={handleImageError}
                />
                <div className="wishlist-card__info">
                  <h3>{item.bookId.title}</h3>
                  <p>{item.bookId.author}</p>
                  <span className="wishlist-card__genre">{item.bookId.genre}</span>
                  <p className={`wishlist-card__availability ${item.bookId.availableCopies === 0 ? 'wishlist-card__availability--unavailable' : ''}`}>
                    {item.bookId.availableCopies > 0
                      ? `${item.bookId.availableCopies} available`
                      : 'Currently unavailable'}
                  </p>
                </div>
              </Link>
              <Button
                variant="ghost"
                size="small"
                onClick={() => handleRemove(item.bookId._id)}
                className="wishlist-card__remove"
              >
                <FiTrash2 /> Remove
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
