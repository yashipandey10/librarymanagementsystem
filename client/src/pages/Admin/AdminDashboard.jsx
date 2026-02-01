import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiUsers, FiBookOpen, FiAlertCircle, FiClock } from 'react-icons/fi';
import { adminAPI } from '../../api';
import { Loading, Card, Button } from '../../components/common';
import { DashboardStats, PendingRequests } from '../../components/admin';
import './AdminPages.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await adminAPI.getDashboardStats();
        if (response.success) {
          setStats(response.data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handlePendingUpdate = () => {
    // Refetch stats when pending requests are updated
    adminAPI.getDashboardStats().then(response => {
      if (response.success) {
        setStats(response.data);
      }
    });
  };

  if (loading) return <Loading fullScreen />;

  return (
    <div className="admin-page">
      <h1 className="admin-page__title">Admin Dashboard</h1>

      <DashboardStats stats={stats.stats} />

      {/* Pending Requests Section - Prominent */}
      {stats.stats.pendingRequests > 0 && (
        <div className="admin-page__pending-section">
          <Card className="admin-card admin-card--pending">
            <div className="pending-alert">
              <div className="pending-alert__icon">
                <FiClock size={32} />
              </div>
              <div className="pending-alert__content">
                <h3>
                  <strong>{stats.stats.pendingRequests}</strong> Pending Borrow Request{stats.stats.pendingRequests !== 1 ? 's' : ''}
                </h3>
                <p>Action required: Review and approve or reject pending borrow requests</p>
                <Link to="/admin/borrows?filter=pending">
                  <Button variant="primary">Review Requests</Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      )}

      <PendingRequests onUpdate={handlePendingUpdate} />

      <div className="admin-page__grid">
        <Card className="admin-card" hover={false}>
          <h3><FiBook /> Books by Genre</h3>
          <div className="genre-list">
            {stats.booksByGenre.map((item) => (
              <div key={item._id} className="genre-list__item">
                <span>{item._id}</span>
                <span className="genre-list__count">{item.count}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="admin-card" hover={false}>
          <h3><FiBookOpen /> Recent Borrows</h3>
          <div className="recent-list">
            {stats.recentBorrows.map((borrow) => (
              <div key={borrow._id} className="recent-list__item">
                <span>{borrow.bookId?.title}</span>
                <span className="recent-list__user">
                  {borrow.userId?.firstName} {borrow.userId?.lastName}
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="admin-card" hover={false}>
          <h3><FiUsers /> Most Borrowed Books</h3>
          <div className="popular-list">
            {stats.mostBorrowedBooks.map((book, index) => (
              <div key={book._id} className="popular-list__item">
                <span className="popular-list__rank">#{index + 1}</span>
                <span className="popular-list__title">{book.title}</span>
                <span className="popular-list__count">{book.count} borrows</span>
              </div>
            ))}
          </div>
        </Card>

        {stats.stats.overdueBorrows > 0 && (
          <Card className="admin-card admin-card--warning" hover={false}>
            <h3><FiAlertCircle /> Overdue Alert</h3>
            <p>There are {stats.stats.overdueBorrows} overdue books.</p>
            <Link to="/admin/borrows?filter=overdue">
              <Button variant="secondary">View Overdue</Button>
            </Link>
          </Card>
        )}
      </div>

      <div className="admin-page__actions">
        <Link to="/admin/books"><Button>Manage Books</Button></Link>
        <Link to="/admin/users"><Button variant="secondary">Manage Users</Button></Link>
        <Link to="/admin/borrows"><Button variant="secondary">Manage Borrows</Button></Link>
      </div>
    </div>
  );
};

export default AdminDashboard;
