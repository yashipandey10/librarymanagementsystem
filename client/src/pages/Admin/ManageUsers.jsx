import { useState, useEffect } from 'react';
import { adminAPI } from '../../api';
import { Loading, Input } from '../../components/common';
import { UserTable } from '../../components/admin';
import './AdminPages.scss';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [search, setSearch] = useState('');

  const fetchUsers = async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20 };
      if (search) params.search = search;
      const response = await adminAPI.getUsers(params);
      if (response.success) {
        setUsers(response.data);
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  if (loading && users.length === 0) return <Loading fullScreen />;

  return (
    <div className="admin-page">
      <h1 className="admin-page__title">Manage Users</h1>

      <form className="admin-page__search" onSubmit={handleSearch}>
        <Input
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      <UserTable
        users={users}
        pagination={pagination}
        onPageChange={fetchUsers}
        onRefresh={() => fetchUsers(pagination.page)}
      />
    </div>
  );
};

export default ManageUsers;
