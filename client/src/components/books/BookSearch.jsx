import { useState, useEffect } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import { useBooks } from '../../context/BookContext';
import './BookSearch.scss';

const BookSearch = () => {
  const [query, setQuery] = useState('');
  const { searchBooks, searchQuery, clearFilters } = useBooks();

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    searchBooks(query);
  };

  const handleClear = () => {
    setQuery('');
    clearFilters();
  };

  return (
    <form className="book-search" onSubmit={handleSubmit}>
      <div className="book-search__wrapper">
        <FiSearch className="book-search__icon" />
        <input
          type="text"
          className="book-search__input"
          placeholder="Search by title or author..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            className="book-search__clear"
            onClick={handleClear}
          >
            <FiX />
          </button>
        )}
      </div>
      <button type="submit" className="book-search__btn">
        Search
      </button>
    </form>
  );
};

export default BookSearch;
