import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Card, Button, Loading, Pagination } from '../common';
import { borrowsAPI } from '../../api';
import { getBookImageUrl, handleImageError } from '../../utils/imageUtils';
import './BorrowHistory.css';

const BorrowHistory = () => {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [filter, setFilter] = useState('all');

  const fetchBorrows = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10 };
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await borrowsAPI.getMyBorrows(params);
      if (response.success) {
        setBorrows(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch borrows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBorrows();
  }, [filter]);

  const handleReturn = async (borrowId) => {
    try {
      const response = await borrowsAPI.returnBook(borrowId);
      if (response.success) {
        fetchBorrows(pagination.page);
      }
    } catch (err) {
      console.error('Failed to return book:', err);
    }
  };

  const handleRenew = async (borrowId) => {
    try {
      const response = await borrowsAPI.renewBook(borrowId);
      if (response.success) {
        fetchBorrows(pagination.page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to renew');
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      pending: 'borrow-card__status--pending',
      approved: 'borrow-card__status--approved',
      rejected: 'borrow-card__status--rejected',
      borrowed: 'borrow-card__status--borrowed',
      returned: 'borrow-card__status--returned',
      overdue: 'borrow-card__status--overdue'
    };
    return `borrow-card__status ${classes[status] || ''}`;
  };

  if (loading) return <Loading />;

  return (
    <div className="borrow-history">
      <div className="borrow-history__filters">
        {['all', 'pending', 'borrowed', 'returned', 'overdue'].map((f) => (
          <button
            key={f}
            className={`borrow-history__filter ${filter === f ? 'borrow-history__filter--active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {borrows.length === 0 ? (
        <p className="borrow-history__empty">No borrow records found.</p>
      ) : (
        <div className="borrow-history__list">
          {borrows.map((borrow) => (
            <Card key={borrow._id} className="borrow-card" hover={false}>
              <div className="borrow-card__image">
                <img
                  src={getBookImageUrl(borrow.bookId?.coverImage)}
                  alt={borrow.bookId?.title}
                  onError={handleImageError}
                />
              </div>
              <div className="borrow-card__details">
                <h3 className="borrow-card__title">{borrow.bookId?.title}</h3>
                <p className="borrow-card__author">{borrow.bookId?.author}</p>
                <span className={getStatusBadge(borrow.status)}>
                  {borrow.status}
                </span>
                <div className="borrow-card__dates">
                  {borrow.requestDate && (
                    <p>Requested: {format(new Date(borrow.requestDate), 'MMM dd, yyyy')}</p>
                  )}
                  {borrow.borrowDate && (
                    <p>Borrowed: {format(new Date(borrow.borrowDate), 'MMM dd, yyyy')}</p>
                  )}
                  {borrow.dueDate && (
                    <p>Due: {format(new Date(borrow.dueDate), 'MMM dd, yyyy')}</p>
                  )}
                  {borrow.returnDate && (
                    <p>Returned: {format(new Date(borrow.returnDate), 'MMM dd, yyyy')}</p>
                  )}
                  {borrow.rejectionReason && (
                    <p className="borrow-card__rejection">Rejection reason: {borrow.rejectionReason}</p>
                  )}
                </div>
                {borrow.currentFine > 0 && (
                  <p className="borrow-card__fine">Fine: Rs. {borrow.currentFine}</p>
                )}
                {borrow.fineAmount > 0 && borrow.status === 'returned' && (
                  <p className="borrow-card__fine">
                    Fine: Rs. {borrow.fineAmount} {borrow.finePaid ? '(Paid)' : '(Unpaid)'}
                  </p>
                )}
              </div>
              {borrow.status === 'pending' && (
                <div className="borrow-card__info">
                  <p className="borrow-card__pending-message">
                    Your request is pending admin approval
                  </p>
                </div>
              )}
              {borrow.status === 'rejected' && (
                <div className="borrow-card__info">
                  <p className="borrow-card__rejected-message">
                    Your request was rejected
                  </p>
                </div>
              )}
              {borrow.status !== 'returned' && borrow.status !== 'pending' && borrow.status !== 'rejected' && (
                <div className="borrow-card__actions">
                  <Button size="small" onClick={() => handleReturn(borrow._id)}>
                    Return
                  </Button>
                  {borrow.renewalCount < 2 && (
                    <Button size="small" variant="secondary" onClick={() => handleRenew(borrow._id)}>
                      Renew ({2 - borrow.renewalCount} left)
                    </Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={fetchBorrows}
        />
      )}
    </div>
  );
};

export default BorrowHistory;
