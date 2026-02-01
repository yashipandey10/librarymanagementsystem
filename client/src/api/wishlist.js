import api from './axios';

export const wishlistAPI = {
  getWishlist: async () => {
    const response = await api.get('/wishlist');
    return response.data;
  },

  addToWishlist: async (bookId) => {
    const response = await api.post(`/wishlist/add/${bookId}`);
    return response.data;
  },

  removeFromWishlist: async (bookId) => {
    const response = await api.delete(`/wishlist/remove/${bookId}`);
    return response.data;
  },

  checkWishlist: async (bookId) => {
    const response = await api.get(`/wishlist/check/${bookId}`);
    return response.data;
  }
};
