import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationService } from '../services';
import { useAuth } from './AuthContext';
const NotificationContext = createContext(null);
export function NotificationProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount]     = useState(0);
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await notificationService.getAll();
      setNotifications(data.data?.notifications ?? []);
      setUnreadCount(data.data?.unread_count ?? 0);
    } catch {
      // silently ignore — don't log out the user over a notification failure
    }
  }, [user]);
  useEffect(() => {
    // Wait until auth has finished loading before touching the API
    if (authLoading) return;
    if (!user)       return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, [authLoading, user, fetchNotifications]);
  const markRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch { /* ignore */ }
  };
  const markAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch { /* ignore */ }
  };
  const remove = async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch { /* ignore */ }
  };
  return (
    <NotificationContext.Provider value={{
      notifications, unreadCount, fetchNotifications, markRead, markAllRead, remove,
    }}>
      {children}
    </NotificationContext.Provider>
  );
}
export function useNotifications() {
  return useContext(NotificationContext);
}