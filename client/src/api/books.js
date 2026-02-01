import api from './axios';

export const booksAPI = {
  getBooks: async (params = {}) => {
    const response = await api.get('/books', { params });
    return response.data;
  },

  searchBooks: async (query, params = {}) => {
    const response = await api.get('/books/search', { params: { q: query, ...params } });
    return response.data;
  },

  getBook: async (id) => {
    const response = await api.get(`/books/${id}`);
    return response.data;
  },

  getGenres: async () => {
    const response = await api.get('/books/genres');
    return response.data;
  },

  createBook: async (bookData) => {
    const formData = new FormData();
    Object.keys(bookData).forEach(key => {
      if (bookData[key] !== null && bookData[key] !== undefined) {
        formData.append(key, bookData[key]);
      }
    });
    const response = await api.post('/books', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  updateBook: async (id, bookData) => {
    const formData = new FormData();
    Object.keys(bookData).forEach(key => {
      if (bookData[key] !== null && bookData[key] !== undefined) {
        formData.append(key, bookData[key]);
      }
    });
    const response = await api.put(`/books/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  deleteBook: async (id) => {
    const response = await api.delete(`/books/${id}`);
    return response.data;
  }
};
