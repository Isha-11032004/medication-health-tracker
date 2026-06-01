import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute =
      err.config?.url?.includes('/auth/login') ||
      err.config?.url?.includes('/auth/register');

    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

/** Human-readable message for failed requests */
export const getApiErrorMessage = (err, fallback = 'Something went wrong') => {
  if (err.response?.data?.message) return err.response.data.message;
  if (err.code === 'ECONNABORTED') return 'Request timed out. Is the backend running?';
  if (!err.response) {
    return 'Cannot reach the server. Start the backend: cd server → npm run dev (port 5000).';
  }
  return fallback;
};

export default api;
