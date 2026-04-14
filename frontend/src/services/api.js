import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle token expiration — but NOT password-gated share links
    if (error.response?.status === 401 && !error.response?.data?.requiresPassword) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/update', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
};

// Datacard API calls
export const cardAPI = {
  getAll: (params) => api.get('/cards', { params }),
  getOne: (id) => api.get(`/cards/${id}`),
  create: (data) => api.post('/cards', data),
  update: (id, data) => api.put(`/cards/${id}`, data),
  delete: (id) => api.delete(`/cards/${id}`),
  generateShareLink: (id, data) => api.post(`/cards/${id}/share`, data),
  revokeShareLink: (id) => api.delete(`/cards/${id}/share`),
  getShared: (token, password = null) => api.get(`/cards/shared/${token}`, {
    headers: password ? { 'x-share-password': password } : {}
  }),
  getShareStats: (id) => api.get(`/cards/${id}/share/stats`),
  exportPDF: (id, password) => api.post(`/cards/${id}/export`, { password }, { responseType: 'blob' }),
};

// LLM API calls
export const llmAPI = {
  generate: (data) => api.post('/generate', data),
  getTemplates: () => api.get('/generate/templates'),
};

export default api;
