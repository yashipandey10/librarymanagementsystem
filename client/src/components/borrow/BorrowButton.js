import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common';
import { borrowsAPI } from '../../api';
import { useAuth } from '../../context/AuthContext';

const BorrowButton = ({ bookId, availableCopies, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [checkingPending, setCheckingPending] = useState(true);
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkPendingRequest = async () => {
      if (!isAuthenticated || !bookId) {
        setCheckingPending(false);
        return;
      }

      try {
        const response = await borrowsAPI.getMyBorrows({ status: 'pending' });
        if (response.success) {
          const hasPending = response.data.some(
            borrow => borrow.bookId?._id === bookId || borrow.bookId === bookId
          );
          setPendingRequest(hasPending);
        }
      } catch (err) {
        console.error('Error checking pending request:', err);
      } finally {
        setCheckingPending(false);
      }
    };

    checkPendingRequest();
  }, [isAuthenticated, bookId]);

  const handleBorrow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await borrowsAPI.borrowBook(bookId);
      if (response.success) {
        setPendingRequest(true);
        if (onSuccess) {
          onSuccess(response.data);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit borrow request');
    } finally {
      setLoading(false);
    }
  };

  const activeBorrows = user?.currentlyBorrowed || 0;
  const isDisabled = availableCopies === 0 || 
    (isAuthenticated && activeBorrows >= 5) ||
    pendingRequest ||
    checkingPending;

  let buttonText = 'Request to Borrow';
  if (checkingPending) {
    buttonText = 'Checking...';
  } else if (pendingRequest) {
    buttonText = 'Request Pending';
  } else if (availableCopies === 0) {
    buttonText = 'Unavailable';
  } else if (isAuthenticated && activeBorrows >= 5) {
    buttonText = 'Limit Reached';
  }

  return (
    <div>
      <Button
        onClick={handleBorrow}
        loading={loading}
        disabled={isDisabled}
        fullWidth
        variant={pendingRequest ? 'secondary' : 'primary'}
      >
        {buttonText}
      </Button>
      {error && (
        <p style={{ color: 'var(--color-error, #dc3545)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {error}
        </p>
      )}
      {pendingRequest && !error && (
        <p style={{ color: 'var(--color-info, #17a2b8)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Your request is pending admin approval
        </p>
      )}
    </div>
  );
};

export default BorrowButton;
