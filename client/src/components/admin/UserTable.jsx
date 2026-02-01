import { format } from 'date-fns';
import { FiCheck, FiX } from 'react-icons/fi';
import { Button, Pagination } from '../common';
import { adminAPI } from '../../api';
import './UserTable.scss';

const UserTable = ({ users, pagination, onPageChange, onRefresh }) => {
  const handleToggleStatus = async (userId) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      onRefresh();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  return (
    <div className="user-table-wrapper">
      <table className="user-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Borrowed</th>
            <th>Joined</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user._id}>
              <td className="user-table__name">
                {user.firstName} {user.lastName}
              </td>
              <td>{user.email}</td>
              <td>{user.phone || '-'}</td>
              <td>{user.currentlyBorrowed}/5</td>
              <td>{format(new Date(user.createdAt), 'MMM dd, yyyy')}</td>
              <td>
                <span className={`user-table__status ${user.isActive ? 'user-table__status--active' : 'user-table__status--inactive'}`}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </td>
              <td>
                <Button
                  size="small"
                  variant={user.isActive ? 'danger' : 'success'}
                  onClick={() => handleToggleStatus(user._id)}
                >
                  {user.isActive ? <><FiX /> Deactivate</> : <><FiCheck /> Activate</>}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {pagination && pagination.pages > 1 && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default UserTable;
