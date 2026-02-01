import { useState, useEffect } from 'react';
import { format, differenceInDays } from 'date-fns';
import { Card, Button, Loading } from '../common';
import { borrowsAPI } from '../../api';
import { getBookImageUrl, handleImageError } from '../../utils/imageUtils';
import './CurrentBorrows.scss';

const CurrentBorrows = ({ compact = false }) => {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCurrentBorrows = async () => {
    try {
      const response = await borrowsAPI.getCurrentBorrows();
      if (response.success) {
        setBorrows(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch current borrows:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentBorrows();
  }, []);

  const handleReturn = async (borrowId) => {
    try {
      const response = await borrowsAPI.returnBook(borrowId);
      if (response.success) {
        fetchCurrentBorrows();
      }
    } catch (err) {
      console.error('Failed to return book:', err);
    }
  };

  const getDaysRemaining = (dueDate) => {
    const days = differenceInDays(new Date(dueDate), new Date());
    if (days < 0) return `${Math.abs(days)} days overdue`;
    if (days === 0) return 'Due today';
    return `${days} days remaining`;
  };

  if (loading) return <Loading size="small" />;

  if (borrows.length === 0) {
    return (
      <div className="current-borrows current-borrows--empty">
        <p>No books currently borrowed</p>
      </div>
    );
  }

  return (
    <div className={`current-borrows ${compact ? 'current-borrows--compact' : ''}`}>
      {borrows.map((borrow) => (
        <Card key={borrow._id} className="current-borrow" hover={false} padding="small">
          <img
            src={getBookImageUrl(borrow.bookId?.coverImage)}
            alt={borrow.bookId?.title}
            className="current-borrow__image"
            onError={handleImageError}
          />
          <div className="current-borrow__info">
            <h4 className="current-borrow__title">{borrow.bookId?.title}</h4>
            <p className="current-borrow__due">
              Due: {format(new Date(borrow.dueDate), 'MMM dd, yyyy')}
            </p>
            <p className={`current-borrow__remaining ${borrow.status === 'overdue' ? 'current-borrow__remaining--overdue' : ''}`}>
              {getDaysRemaining(borrow.dueDate)}
            </p>
            {borrow.currentFine > 0 && (
              <p className="current-borrow__fine">Fine: Rs. {borrow.currentFine}</p>
            )}
          </div>
          {!compact && (
            <Button size="small" onClick={() => handleReturn(borrow._id)}>
              Return
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
};

export default CurrentBorrows;
