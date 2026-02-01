import BookCard from './BookCard';
import { Loading, Pagination } from '../common';
import './BookGrid.scss';

const BookGrid = ({ books, loading, pagination, onPageChange, emptyMessage = 'No books found' }) => {
  if (loading) {
    return (
      <div className="book-grid__loading">
        <Loading />
      </div>
    );
  }

  if (!books || books.length === 0) {
    return (
      <div className="book-grid__empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="book-grid">
      <div className="book-grid__container">
        {books.map((book) => (
          <BookCard key={book._id} book={book} />
        ))}
      </div>
      {pagination && pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default BookGrid;
