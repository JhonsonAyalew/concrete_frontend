import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/authService';
const AuthContext = createContext(null);
// Storage keys - using multiple formats for compatibility
const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'equiprent-user',
  // Legacy keys for compatibility
  LEGACY_TOKEN: 'equiprent_access_token',
  LEGACY_REFRESH: 'equiprent_refresh_token',
  LEGACY_USER: 'equiprent_user',
};
// Helper functions
function getStoredToken() {
  return localStorage.getItem(STORAGE_KEYS.TOKEN) || 
         localStorage.getItem(STORAGE_KEYS.LEGACY_TOKEN);
}
function getStoredRefreshToken() {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || 
         localStorage.getItem(STORAGE_KEYS.LEGACY_REFRESH);
}
function getStoredUser() {
  try {
    const userData = localStorage.getItem(STORAGE_KEYS.USER) || 
                    localStorage.getItem(STORAGE_KEYS.LEGACY_USER);
    if (!userData) return null;
    const parsed = JSON.parse(userData);
    return parsed.user || parsed;
  } catch {
    return null;
  }
}
function storeAuthData(user, accessToken, refreshToken) {
  // Store in primary keys
  if (accessToken) {
    localStorage.setItem(STORAGE_KEYS.TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.LEGACY_TOKEN, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    localStorage.setItem(STORAGE_KEYS.LEGACY_REFRESH, refreshToken);
  }
  if (user) {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    localStorage.setItem(STORAGE_KEYS.LEGACY_USER, JSON.stringify(user));
  }
}
function clearAllAuthData() {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
}
export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  // Validate existing session on mount
  useEffect(() => {
    const validateSession = async () => {
      const token = getStoredToken();
      // Safety timeout to prevent infinite loading (5 seconds)
      const safetyTimeout = setTimeout(() => {
        if (isMounted.current && loading) {
          setLoading(false);
        }
      }, 5000);
      try {
        if (!token) {
          setUser(null);
          return;
        }
        // First, use stored user data immediately if available
        const storedUser = getStoredUser();
        if (storedUser && storedUser.id) {
          setUser(storedUser);
        }
        // Validate with API
        try {
          const response = await authService.me();
          if (!isMounted.current) return;
          // Extract user from response
          let userData = response.data?.data || response.data?.user || response.data;
          if (userData && userData.id) {
            setUser(userData);
            // Update stored user data with latest info
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
            localStorage.setItem(STORAGE_KEYS.LEGACY_USER, JSON.stringify(userData));
          } else if (storedUser && storedUser.id) {
            // If API returns invalid but we have stored user, keep stored user
            setUser(storedUser);
          } else {
            clearAllAuthData();
            setUser(null);
          }
        } catch (error) {
          if (!isMounted.current) return;
          // If API fails but we have stored user, keep it
          const storedUser = getStoredUser();
          if (storedUser && storedUser.id) {
            setUser(storedUser);
          } else {
            // Only clear on 401 (unauthorized) or 403 (forbidden)
            if (error.response?.status === 401 || error.response?.status === 403) {
              clearAllAuthData();
              setUser(null);
            } else {
              // For network errors, keep stored user if exists
              if (!storedUser) {
                setUser(null);
              }
            }
          }
        }
      } catch (error) {
        if (!isMounted.current) return;
        // Last resort: try to use stored user
        const storedUser = getStoredUser();
        if (storedUser && storedUser.id) {
          setUser(storedUser);
        } else {
          setUser(null);
        }
      } finally {
        clearTimeout(safetyTimeout);
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    validateSession();
  }, []); // Empty dependency array - only run once on mount
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const response = await authService.login({ email, password });
      // Extract data from different possible response structures
      let userData = null;
      let accessToken = null;
      let refreshToken = null;
      // Try to find tokens in the response
      const responseData = response.data;
      // Case 1: response.data.data (nested)
      if (responseData?.data) {
        userData = responseData.data.user || responseData.data;
        accessToken = responseData.data.accessToken || responseData.data.token || responseData.data.access_token;
        refreshToken = responseData.data.refreshToken || responseData.data.refresh_token;
      }
      // Case 2: response.data directly
      if (!accessToken && responseData) {
        userData = userData || responseData.user || responseData;
        accessToken = accessToken || responseData.accessToken || responseData.token || responseData.access_token;
        refreshToken = refreshToken || responseData.refreshToken || responseData.refresh_token;
      }
      // Case 3: response directly
      if (!accessToken && response) {
        userData = userData || response.user || response;
        accessToken = accessToken || response.accessToken || response.token;
        refreshToken = refreshToken || response.refreshToken;
      }
      // Special case: If we have refreshToken but no accessToken,
      // maybe the refreshToken IS the access token
      if (!accessToken && refreshToken) {
        accessToken = refreshToken;
      }
      if (!accessToken) {
        throw new Error('Invalid server response: No access token received');
      }
      if (!userData || !userData.id) {
        throw new Error('Invalid server response: No user data received');
      }
      // Store all auth data
      storeAuthData(userData, accessToken, refreshToken);
      // Update state
      setUser(userData);
      return userData;
    } catch (error) {
      clearAllAuthData();
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);
  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (error) {
    } finally {
      clearAllAuthData();
      setUser(null);
      setLoading(false);
    }
  }, []);
  const updateUser = useCallback((updates) => {
    setUser(prev => {
      if (!prev) return null;
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(next));
      localStorage.setItem(STORAGE_KEYS.LEGACY_USER, JSON.stringify(next));
      return next;
    });
  }, []);
  const refreshSession = useCallback(async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) {
      return false;
    }
    try {
      const response = await authService.refreshToken(refreshToken);
      let newAccessToken = response.data?.data?.accessToken || 
                          response.data?.accessToken || 
                          response.accessToken;
      if (newAccessToken) {
        localStorage.setItem(STORAGE_KEYS.TOKEN, newAccessToken);
        localStorage.setItem(STORAGE_KEYS.LEGACY_TOKEN, newAccessToken);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }, []);
  const value = {
    user,
    loading,
    login,
    logout,
    updateUser,
    refreshSession,
    isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
    isSuperAdmin: user?.role === 'superadmin',
    isOwner: user?.role === 'owner',
    isCustomer: user?.role === 'customer',
  };
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}