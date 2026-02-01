import { useState, useEffect } from 'react';
import { FiPlus } from 'react-icons/fi';
import { booksAPI } from '../../api';
import { Button, Modal, Loading } from '../../components/common';
import { BookTable, BookForm } from '../../components/admin';
import './AdminPages.css';

const ManageBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchBooks = async (page = 1) => {
    setLoading(true);
    try {
      const response = await booksAPI.getBooks({ page, limit: 10 });
      if (response.success) {
        setBooks(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleAddSuccess = () => {
    setShowAddModal(false);
    fetchBooks(1);
  };

  if (loading && books.length === 0) return <Loading fullScreen />;

  return (
    <div className="admin-page">
      <div className="admin-page__header">
        <h1 className="admin-page__title">Manage Books</h1>
        <Button onClick={() => setShowAddModal(true)}>
          <FiPlus /> Add Book
        </Button>
      </div>

      <BookTable
        books={books}
        pagination={pagination}
        onPageChange={fetchBooks}
        onRefresh={() => fetchBooks(pagination.page)}
      />

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Book"
        size="large"
      >
        <BookForm
          onSuccess={handleAddSuccess}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>
    </div>
  );
};

export default ManageBooks;
