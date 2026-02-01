import { useBooks } from '../../context/BookContext';
import './GenreFilter.scss';

const GenreFilter = () => {
  const { genres, selectedGenre, filterByGenre, clearFilters } = useBooks();

  return (
    <div className="genre-filter">
      <h4 className="genre-filter__title">Filter by Genre</h4>
      <div className="genre-filter__list">
        <button
          className={`genre-filter__btn ${!selectedGenre ? 'genre-filter__btn--active' : ''}`}
          onClick={clearFilters}
        >
          All
        </button>
        {genres.map((genre) => (
          <button
            key={genre}
            className={`genre-filter__btn ${selectedGenre === genre ? 'genre-filter__btn--active' : ''}`}
            onClick={() => filterByGenre(genre)}
          >
            {genre}
          </button>
        ))}
      </div>
    </div>
  );
};

export default GenreFilter;
