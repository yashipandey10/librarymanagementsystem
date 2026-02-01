import { useState } from 'react';
import { FiEdit, FiTrash2 } from 'react-icons/fi';
import { Button, Modal, Pagination } from '../common';
import { booksAPI } from '../../api';
import BookForm from './BookForm';
import { getBookImageUrl, handleImageError } from '../../utils/imageUtils';
import './BookTable.css';

const BookTable = ({ books, pagination, onPageChange, onRefresh }) => {
  const [editBook, setEditBook] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleEdit = (book) => {
    setEditBook(book);
    setShowModal(true);
  };

  const handleDelete = async (book) => {
    if (!window.confirm(`Are you sure you want to delete "${book.title}"?`)) return;

    try {
      await booksAPI.deleteBook(book._id);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete book');
    }
  };

  const handleFormSuccess = () => {
    setShowModal(false);
    setEditBook(null);
    onRefresh();
  };

  return (
    <div className="book-table-wrapper">
      <table className="book-table">
        <thead>
          <tr>
            <th>Cover</th>
            <th>Title</th>
            <th>Author</th>
            <th>Genre</th>
            <th>Copies</th>
            <th>Rating</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {books.map((book) => (
            <tr key={book._id}>
              <td>
                <img
                  src={getBookImageUrl(book.coverImage)}
                  alt={book.title}
                  className="book-table__cover"
                  onError={handleImageError}
                />
              </td>
              <td className="book-table__title">{book.title}</td>
              <td>{book.author}</td>
              <td>
                <span className="book-table__genre">{book.genre}</span>
              </td>
              <td>
                {book.availableCopies}/{book.totalCopies}
              </td>
              <td>
                {book.averageRating > 0 ? `${book.averageRating.toFixed(1)} (${book.totalReviews})` : '-'}
              </td>
              <td>
                <div className="book-table__actions">
                  <Button
                    size="small"
                    variant="ghost"
                    onClick={() => handleEdit(book)}
                  >
                    <FiEdit />
                  </Button>
                  <Button
                    size="small"
                    variant="ghost"
                    onClick={() => handleDelete(book)}
                  >
                    <FiTrash2 />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={onPageChange}
        />
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditBook(null);
        }}
        title={editBook ? 'Edit Book' : 'Add Book'}
        size="large"
      >
        <BookForm
          book={editBook}
          onSuccess={handleFormSuccess}
          onCancel={() => {
            setShowModal(false);
            setEditBook(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default BookTable;
