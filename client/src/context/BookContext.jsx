import { createContext, useContext, useState, useCallback } from 'react';
import { booksAPI } from '../api';

const BookContext = createContext(null);

export const useBooks = () => {
  const context = useContext(BookContext);
  if (!context) {
    throw new Error('useBooks must be used within a BookProvider');
  }
  return context;
};

export const BookProvider = ({ children }) => {
  const [books, setBooks] = useState([]);
  const [genres, setGenres] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBooks = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await booksAPI.getBooks({
        page: pagination.page,
        limit: pagination.limit,
        genre: selectedGenre,
        ...params
      });
      if (response.success) {
        setBooks(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch books');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, selectedGenre]);

  const searchBooks = useCallback(async (query, params = {}) => {
    if (!query.trim()) {
      setSearchQuery('');
      return fetchBooks();
    }
    try {
      setLoading(true);
      setError(null);
      setSearchQuery(query);
      const response = await booksAPI.searchBooks(query, {
        page: 1,
        limit: pagination.limit,
        ...params
      });
      if (response.success) {
        setBooks(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, [pagination.limit, fetchBooks]);

  const fetchGenres = useCallback(async () => {
    try {
      const response = await booksAPI.getGenres();
      if (response.success) {
        setGenres(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch genres:', err);
    }
  }, []);

  const filterByGenre = useCallback((genre) => {
    setSelectedGenre(genre);
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedGenre(null);
    setSearchQuery('');
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  const changePage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const value = {
    books,
    genres,
    pagination,
    loading,
    error,
    selectedGenre,
    searchQuery,
    fetchBooks,
    searchBooks,
    fetchGenres,
    filterByGenre,
    clearFilters,
    changePage,
    clearError: () => setError(null)
  };

  return (
    <BookContext.Provider value={value}>
      {children}
    </BookContext.Provider>
  );
};
