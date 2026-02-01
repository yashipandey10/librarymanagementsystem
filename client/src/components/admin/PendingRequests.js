import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FiCheck, FiX, FiClock } from 'react-icons/fi';
import { borrowsAPI } from '../../api';
import { Loading, Card, Button, Modal } from '../common';
import './PendingRequests.css';

const PendingRequests = ({ onUpdate }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null, reason: '' });

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    setLoading(true);
    try {
      const response = await borrowsAPI.getPendingRequests({ limit: 10 });
      if (response.success) {
        setRequests(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    setActionLoading(requestId);
    try {
      const response = await borrowsAPI.approveBorrowRequest(requestId);
      if (response.success) {
        await fetchPendingRequests();
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error('Failed to approve request:', err);
      alert(err.response?.data?.message || 'Failed to approve request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectModal.requestId) return;

    setActionLoading(rejectModal.requestId);
    try {
      const response = await borrowsAPI.rejectBorrowRequest(
        rejectModal.requestId,
        rejectModal.reason
      );
      if (response.success) {
        setRejectModal({ open: false, requestId: null, reason: '' });
        await fetchPendingRequests();
        if (onUpdate) onUpdate();
      }
    } catch (err) {
      console.error('Failed to reject request:', err);
      alert(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return <Loading />;
  }

  if (requests.length === 0) {
    return (
      <Card className="pending-requests">
        <div className="pending-requests__empty">
          <FiClock size={48} />
          <p>No pending requests</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card className="pending-requests">
        <h3 className="pending-requests__title">Pending Borrow Requests</h3>
        <div className="pending-requests__list">
          {requests.map((request) => (
            <div key={request._id} className="pending-request">
              <div className="pending-request__info">
                <div className="pending-request__user">
                  <strong>
                    {request.userId?.firstName} {request.userId?.lastName}
                  </strong>
                  <span className="pending-request__email">{request.userId?.email}</span>
                </div>
                <div className="pending-request__book">
                  <strong>{request.bookId?.title}</strong>
                  <span>by {request.bookId?.author}</span>
                </div>
                <div className="pending-request__meta">
                  <span>
                    Requested: {format(new Date(request.requestDate), 'MMM dd, yyyy')}
                  </span>
                  <span className="pending-request__availability">
                    Available: {request.bookId?.availableCopies || 0} / {request.bookId?.totalCopies || 0}
                  </span>
                </div>
              </div>
              <div className="pending-request__actions">
                <Button
                  variant="success"
                  size="small"
                  onClick={() => handleApprove(request._id)}
                  loading={actionLoading === request._id}
                  disabled={actionLoading !== null}
                >
                  <FiCheck /> Approve
                </Button>
                <Button
                  variant="danger"
                  size="small"
                  onClick={() => setRejectModal({ open: true, requestId: request._id, reason: '' })}
                  disabled={actionLoading !== null}
                >
                  <FiX /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, requestId: null, reason: '' })}
        title="Reject Borrow Request"
      >
        <div className="reject-modal">
          <p>Are you sure you want to reject this borrow request?</p>
          <label>
            Rejection Reason (optional):
            <textarea
              value={rejectModal.reason}
              onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
              placeholder="Enter reason for rejection..."
              rows={4}
            />
          </label>
          <div className="reject-modal__actions">
            <Button
              variant="secondary"
              onClick={() => setRejectModal({ open: false, requestId: null, reason: '' })}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={actionLoading === rejectModal.requestId}
            >
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PendingRequests;
