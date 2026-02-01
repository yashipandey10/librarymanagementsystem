import { Link } from 'react-router-dom';
import { Rating } from '../common';
import { getBookImageUrl, handleImageError } from '../../utils/imageUtils';
import './BookCard.css';

const BookCard = ({ book }) => {
  return (
    <Link to={`/books/${book._id}`} className="book-card">
      <div className="book-card__image-wrapper">
        <img
          src={getBookImageUrl(book.coverImage)}
          alt={book.title}
          className="book-card__image"
          onError={handleImageError}
        />
        {book.availableCopies === 0 && (
          <span className="book-card__badge book-card__badge--unavailable">
            Unavailable
          </span>
        )}
      </div>
      <div className="book-card__content">
        <h3 className="book-card__title">{book.title}</h3>
        <p className="book-card__author">{book.author}</p>
        <span className="book-card__genre">{book.genre}</span>
        {book.averageRating > 0 && (
          <Rating value={book.averageRating} readonly size="small" />
        )}
        <p className="book-card__availability">
          {book.availableCopies} of {book.totalCopies} available
        </p>
      </div>
    </Link>
  );
};

export default BookCard;
