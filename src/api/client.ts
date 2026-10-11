import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const TENANT_ID = import.meta.env.VITE_TENANT_ID || 'shri-hari-pack';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-tenant-id': TENANT_ID,
  },
});

// Request interceptor to attach JWT token and tenant ID
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('shrihari_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (!config.headers['x-tenant-id']) {
    config.headers['x-tenant-id'] = TENANT_ID;
  }
  return config;
});

// Response interceptor to handle unauthorized redirects
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('shrihari_token');
      localStorage.removeItem('shrihari_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
