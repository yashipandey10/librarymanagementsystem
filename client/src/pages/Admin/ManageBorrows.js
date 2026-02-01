import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { FiCheck, FiX } from 'react-icons/fi';
import { borrowsAPI } from '../../api';
import { Loading, Pagination, Card, Button, Modal } from '../../components/common';
import './AdminPages.css';

const ManageBorrows = () => {
  const [borrows, setBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState({ open: false, requestId: null, reason: '' });

  const fetchBorrows = async (page = 1) => {
    setLoading(true);
    try {
      let response;
      if (filter === 'overdue') {
        response = await borrowsAPI.getOverdueBorrows();
        if (response.success) {
          setBorrows(response.data);
          setPagination({ page: 1, pages: 1, total: response.data.length });
        }
      } else if (filter === 'pending') {
        response = await borrowsAPI.getPendingRequests({ page, limit: 20 });
        if (response.success) {
          setBorrows(response.data);
          setPagination(response.pagination);
        }
      } else {
        const params = { page, limit: 20 };
        if (filter !== 'all') params.status = filter;
        response = await borrowsAPI.getAllBorrows(params);
        if (response.success) {
          setBorrows(response.data);
          setPagination(response.pagination);
        }
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

  const handleApprove = async (borrowId) => {
    setActionLoading(borrowId);
    try {
      const response = await borrowsAPI.approveBorrowRequest(borrowId);
      if (response.success) {
        await fetchBorrows(pagination.page);
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
        await fetchBorrows(pagination.page);
      }
    } catch (err) {
      console.error('Failed to reject request:', err);
      alert(err.response?.data?.message || 'Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusClass = (status) => {
    return `borrow-status borrow-status--${status}`;
  };

  if (loading && borrows.length === 0) return <Loading fullScreen />;

  return (
    <>
      <div className="admin-page">
        <h1 className="admin-page__title">Manage Borrows</h1>

        <div className="admin-page__filters">
          {['all', 'pending', 'borrowed', 'returned', 'overdue'].map((f) => (
            <button
              key={f}
              className={`filter-btn ${filter === f ? 'filter-btn--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'pending' && filter === 'pending' && borrows.length > 0 && (
                <span className="filter-btn__badge">{borrows.length}</span>
              )}
            </button>
          ))}
        </div>

        {filter === 'pending' && borrows.length > 0 && (
          <div className="admin-page__alert">
            <strong>{borrows.length}</strong> pending request{borrows.length !== 1 ? 's' : ''} waiting for approval
          </div>
        )}

        <div className="borrows-table-wrapper">
          <table className="borrows-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Book</th>
                {filter !== 'pending' && <th>Borrowed</th>}
                {filter === 'pending' && <th>Requested</th>}
                {filter !== 'pending' && <th>Due Date</th>}
                {filter !== 'pending' && <th>Returned</th>}
                <th>Status</th>
                {filter !== 'pending' && <th>Fine</th>}
                {filter === 'pending' && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {borrows.length === 0 ? (
                <tr>
                  <td colSpan={filter === 'pending' ? 5 : 7} className="borrows-table__empty">
                    No borrows found
                  </td>
                </tr>
              ) : (
                borrows.map((borrow) => (
                  <tr key={borrow._id}>
                    <td>
                      {borrow.userId?.firstName} {borrow.userId?.lastName}
                      <br />
                      <small>{borrow.userId?.email}</small>
                    </td>
                    <td>{borrow.bookId?.title}</td>
                    {filter !== 'pending' && (
                      <td>
                        {borrow.borrowDate
                          ? format(new Date(borrow.borrowDate), 'MMM dd, yyyy')
                          : '-'}
                      </td>
                    )}
                    {filter === 'pending' && (
                      <td>
                        {borrow.requestDate
                          ? format(new Date(borrow.requestDate), 'MMM dd, yyyy')
                          : '-'}
                      </td>
                    )}
                    {filter !== 'pending' && (
                      <td>
                        {borrow.dueDate
                          ? format(new Date(borrow.dueDate), 'MMM dd, yyyy')
                          : '-'}
                      </td>
                    )}
                    {filter !== 'pending' && (
                      <td>
                        {borrow.returnDate
                          ? format(new Date(borrow.returnDate), 'MMM dd, yyyy')
                          : '-'}
                      </td>
                    )}
                    <td>
                      <span className={getStatusClass(borrow.status)}>
                        {borrow.status}
                      </span>
                    </td>
                    {filter !== 'pending' && (
                      <td>
                        {borrow.fineAmount > 0 || borrow.currentFine > 0 ? (
                          <>
                            Rs. {borrow.fineAmount || borrow.currentFine}
                            {borrow.finePaid && <span className="paid-badge">Paid</span>}
                          </>
                        ) : (
                          '-'
                        )}
                      </td>
                    )}
                    {filter === 'pending' && (
                      <td>
                        <div className="borrow-actions">
                          <Button
                            variant="success"
                            size="small"
                            onClick={() => handleApprove(borrow._id)}
                            loading={actionLoading === borrow._id}
                            disabled={actionLoading !== null}
                          >
                            <FiCheck /> Approve
                          </Button>
                          <Button
                            variant="danger"
                            size="small"
                            onClick={() =>
                              setRejectModal({ open: true, requestId: borrow._id, reason: '' })
                            }
                            disabled={actionLoading !== null}
                          >
                            <FiX /> Reject
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.pages > 1 && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.pages}
            onPageChange={fetchBorrows}
          />
        )}
      </div>

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

export default ManageBorrows;
