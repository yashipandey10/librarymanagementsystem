import { useBooks } from '../../context/BookContext';
import './Sidebar.scss';

const Sidebar = () => {
  const { genres, selectedGenre, filterByGenre, clearFilters } = useBooks();

  return (
    <aside className="sidebar">
      <h3 className="sidebar__title">Genres</h3>
      <button
        className={`sidebar__btn ${!selectedGenre ? 'sidebar__btn--active' : ''}`}
        onClick={clearFilters}
      >
        All Books
      </button>
      {genres.map((genre) => (
        <button
          key={genre}
          className={`sidebar__btn ${selectedGenre === genre ? 'sidebar__btn--active' : ''}`}
          onClick={() => filterByGenre(genre)}
        >
          {genre}
        </button>
      ))}
    </aside>
  );
};

export default Sidebar;
