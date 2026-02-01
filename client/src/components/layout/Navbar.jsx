import { Link, useNavigate } from 'react-router-dom';
import { FiUser, FiLogOut, FiBook, FiHeart, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__brand">
        <img src="/logo.png" alt="Library" className="navbar__logo" onError={(e) => e.target.style.display = 'none'} />
        <span className="navbar__title">Library</span>
      </Link>

      <ul className="navbar__links">
        <li>
          <Link to="/" className="navbar__link">Home</Link>
        </li>
        <li>
          <Link to="/contact" className="navbar__link">Contact</Link>
        </li>
        {isAuthenticated ? (
          <>
            {isAdmin ? (
              <li>
                <Link to="/admin" className="navbar__link">
                  <FiSettings /> Admin
                </Link>
              </li>
            ) : (
              <>
                <li>
                  <Link to="/my-borrows" className="navbar__link">
                    <FiBook /> My Borrows
                  </Link>
                </li>
                <li>
                  <Link to="/wishlist" className="navbar__link">
                    <FiHeart /> Wishlist
                  </Link>
                </li>
              </>
            )}
            <li className="navbar__user">
              <Link to="/profile" className="navbar__link">
                <FiUser /> {user?.firstName}
              </Link>
            </li>
            <li>
              <button onClick={handleLogout} className="navbar__link navbar__link--button">
                <FiLogOut /> Logout
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link to="/login" className="navbar__link">Login</Link>
            </li>
            <li>
              <Link to="/register" className="navbar__link navbar__link--register">Register</Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
