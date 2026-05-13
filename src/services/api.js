import axios from 'axios';
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 150000,
});
// Request interceptor - attach token
api.interceptors.request.use(
  (config) => {
    // Try multiple possible token locations
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('equiprent_access_token') ||
                  localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
// Response interceptor - handle 401
let refreshing = false;
let failedQueue = [];
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    // Don't retry login requests
    if (originalRequest.url?.includes('/auth/login')) {
      return Promise.reject(error);
    }
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    if (refreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(token => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }).catch(err => Promise.reject(err));
    }
    originalRequest._retry = true;
    refreshing = true;
    const refreshToken = localStorage.getItem('refreshToken') || 
                        localStorage.getItem('equiprent_refresh_token');
    if (!refreshToken) {
      refreshing = false;
      return Promise.reject(error);
    }
    try {
      const response = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken: refreshToken
      });
      const newToken = response.data?.data?.accessToken || 
                      response.data?.accessToken ||
                      response.accessToken;
      if (newToken) {
        // Store in all possible locations
        localStorage.setItem('token', newToken);
        localStorage.setItem('equiprent_access_token', newToken);
        localStorage.setItem('accessToken', newToken);
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(originalRequest);
      } else {
        throw new Error('No token in refresh response');
      }
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Clear all auth data
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('equiprent-user');
      localStorage.removeItem('equiprent_access_token');
      localStorage.removeItem('equiprent_refresh_token');
      localStorage.removeItem('equiprent_user');
      // Redirect to login
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      refreshing = false;
    }
  }
);
export default api;