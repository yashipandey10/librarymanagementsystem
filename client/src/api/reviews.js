import api from './axios';

export const reviewsAPI = {
  getBookReviews: async (bookId, params = {}) => {
    const response = await api.get(`/reviews/book/${bookId}`, { params });
    return response.data;
  },

  getMyReview: async (bookId) => {
    const response = await api.get(`/reviews/my-review/${bookId}`);
    return response.data;
  },

  addReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  updateReview: async (reviewId, reviewData) => {
    const response = await api.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
  },

  deleteReview: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  }
};
