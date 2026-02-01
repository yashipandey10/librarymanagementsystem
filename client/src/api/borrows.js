import api from './axios';

export const borrowsAPI = {
  borrowBook: async (bookId) => {
    const response = await api.post('/borrows', { bookId });
    return response.data;
  },

  returnBook: async (borrowId) => {
    const response = await api.put(`/borrows/${borrowId}/return`);
    return response.data;
  },

  renewBook: async (borrowId) => {
    const response = await api.put(`/borrows/${borrowId}/renew`);
    return response.data;
  },

  getMyBorrows: async (params = {}) => {
    const response = await api.get('/borrows/my-borrows', { params });
    return response.data;
  },

  getCurrentBorrows: async () => {
    const response = await api.get('/borrows/current');
    return response.data;
  },

  getMyFines: async () => {
    const response = await api.get('/borrows/my-fines');
    return response.data;
  },

  payFine: async (borrowId) => {
    const response = await api.put(`/borrows/${borrowId}/pay-fine`);
    return response.data;
  },

  // Admin endpoints
  getAllBorrows: async (params = {}) => {
    const response = await api.get('/borrows', { params });
    return response.data;
  },

  getOverdueBorrows: async () => {
    const response = await api.get('/borrows/overdue');
    return response.data;
  },

  getPendingRequests: async (params = {}) => {
    const response = await api.get('/borrows/pending', { params });
    return response.data;
  },

  approveBorrowRequest: async (borrowId) => {
    const response = await api.put(`/borrows/${borrowId}/approve`);
    return response.data;
  },

  rejectBorrowRequest: async (borrowId, reason) => {
    const response = await api.put(`/borrows/${borrowId}/reject`, { reason });
    return response.data;
  }
};
