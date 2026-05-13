import api from './api';
export const authService = {
  // Login user
  async login(credentials) {
    try {
      const response = await api.post('/auth/login', credentials);
      // Return the full response data
      return response;
    } catch (error) {
      throw error;
    }
  },
  // Get current user
  async me() {
    try {
      const response = await api.get('/auth/me');
      return response;
    } catch (error) {
      throw error;
    }
  },
  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const response = await api.post('/auth/refresh', { refreshToken });
      return response;
    } catch (error) {
      throw error;
    }
  },
  // Logout user
  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      throw error;
    }
  },
  // Forgot password
  async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response;
    } catch (error) {
      throw error;
    }
  },
  // Reset password
  async resetPassword(token, password) {
    try {
      const response = await api.post('/auth/reset-password', { token, password });
      return response;
    } catch (error) {
      throw error;
    }
  },
  // Register user
  async register(userData) {
    try {
      const response = await api.post('/auth/register', userData);
      return response;
    } catch (error) {
      throw error;
    }
  },
};
export default authService;