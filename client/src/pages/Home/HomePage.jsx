import { useEffect } from 'react';
import { Sidebar } from '../../components/layout';
import { BookGrid, BookSearch, GenreFilter } from '../../components/books';
import { useBooks } from '../../context/BookContext';
import './HomePage.scss';

const HomePage = () => {
  const {
    books,
    loading,
    pagination,
    selectedGenre,
    searchQuery,
    fetchBooks,
    fetchGenres,
    changePage
  } = useBooks();

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  useEffect(() => {
    if (!searchQuery) {
      fetchBooks();
    }
  }, [fetchBooks, searchQuery, selectedGenre, pagination.page]);

  return (
    <div className="home-page">
      <Sidebar />
      <main className="home-page__content">
        <BookSearch />
        <GenreFilter />

        {selectedGenre && (
          <h2 className="home-page__filter-title">
            {selectedGenre}
          </h2>
        )}
        {searchQuery && (
          <h2 className="home-page__filter-title">
            Search results for "{searchQuery}"
          </h2>
        )}

        <BookGrid
          books={books}
          loading={loading}
          pagination={pagination}
          onPageChange={changePage}
          emptyMessage={
            selectedGenre
              ? `No books found in ${selectedGenre} genre`
              : searchQuery
                ? `No books found for "${searchQuery}"`
                : 'No books available'
          }
        />
      </main>
    </div>
  );
};

export default HomePage;
