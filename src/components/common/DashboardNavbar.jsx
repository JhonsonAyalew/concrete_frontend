import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import {
  Moon, Sun, Globe, Bell, LogOut, User, Settings,
  Menu, Check, Trash2, ExternalLink, CalendarCheck,
  ClipboardList, Package, AlertCircle, ChevronDown
} from 'lucide-react';
import { Avatar } from '../ui';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';
/* ── resolve notification → navigation route ── */
function getNotifRoute(n, role) {
  const d   = n.data || {};
  const typ = n.type || '';
  if (typ.includes('booking') || d.booking_id) {
    if (role === 'customer')              return '/customer/bookings';
    if (role === 'owner')                 return '/owner/bookings';
    return '/admin/bookings';
  }
  if (typ.includes('submission') || d.submission_id) {
    if (role === 'owner') return '/owner/submissions';
    return '/admin/submissions';
  }
  if (typ.includes('equipment') || d.equipment_id) {
    if (role === 'customer') return d.equipment_id ? `/equipment/${d.equipment_id}` : '/equipment';
    if (role === 'owner')    return '/owner/submissions';
    return '/admin/equipment';
  }
  if (d.url) return d.url;
  return null;
}
function NotifTypeIcon({ type }) {
  const t = type || '';
  if (t.includes('booking'))    return <CalendarCheck className="w-4 h-4 text-blue-500" />;
  if (t.includes('submission')) return <ClipboardList className="w-4 h-4 text-brand-500" />;
  if (t.includes('equipment'))  return <Package className="w-4 h-4 text-purple-500" />;
  return <AlertCircle className="w-4 h-4 text-[var(--text-muted)]" />;
}
export default function DashboardNavbar({ onMenuToggle, title }) {
  const { t, i18n }                                       = useTranslation();
  const { user, logout }                                  = useAuth();
  const { dark, toggle }                                  = useTheme();
  const { notifications, unreadCount, markRead, markAllRead, remove } = useNotifications();
  const navigate                                          = useNavigate();
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen,  setUserOpen]  = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const notifRef = useRef(null);
  const userRef  = useRef(null);
  const langRef  = useRef(null);
  const languages = [
    { code: 'en', label: 'English', short: 'EN', native: 'English' },
    { code: 'am', label: 'አማርኛ', short: 'AM', native: 'አማርኛ' },
    { code: 'zh', label: '中文', short: 'ZH', native: '中文' },
  ];
  useEffect(() => {
    function handle(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (userRef.current  && !userRef.current.contains(e.target))  setUserOpen(false);
      if (langRef.current  && !langRef.current.contains(e.target))  setLangOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);
  const handleLogout = async () => { await logout(); navigate('/login'); };
  const switchLang = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
    setLangOpen(false);
  };
  const getCurrentLanguageShort = () => {
    const current = languages.find(l => l.code === i18n.language);
    return current ? current.short : 'EN';
  };
  const handleNotifClick = async (n) => {
    if (!n.is_read) await markRead(n.id);
    const route = getNotifRoute(n, user?.role);
    if (route) { navigate(route); setNotifOpen(false); }
  };
  const profileRoute  = user?.role === 'owner' ? '/owner/profile' : user?.role === 'customer' ? '/customer/profile' : '/admin/profile';
  const settingsRoute = user?.role === 'owner' ? '/owner/settings': user?.role === 'customer' ? '/customer/profile' : '/admin/settings';
  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-[var(--border)] bg-[var(--bg)] sticky top-0 z-30">
      {/* Left */}
      <div className="flex items-center gap-3">
        <button onClick={onMenuToggle}
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors lg:hidden">
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold text-[var(--text)] hidden sm:block"
          style={{ fontFamily: 'Syne, sans-serif' }}>{title}</h1>
      </div>
      {/* Right */}
      <div className="flex items-center gap-1.5">
        {/* Language dropdown */}
        <div className="relative" ref={langRef}>
          <button onClick={() => setLangOpen(v => !v)}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors border border-[var(--border)]">
            <Globe className="w-3.5 h-3.5" />
            {getCurrentLanguageShort()}
            <ChevronDown className="w-3 h-3" />
          </button>
          {langOpen && (
            <div className="absolute right-0 mt-2 w-36 card shadow-card-hover py-1 animate-slide-down z-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => switchLang(lang.code)}
                  className={clsx(
                    'w-full flex items-center justify-between px-4 py-2 text-sm transition-colors hover:bg-[var(--bg-secondary)]',
                    i18n.language === lang.code 
                      ? 'text-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                      : 'text-[var(--text)]'
                  )}
                >
                  <span>{lang.native}</span>
                  {i18n.language === lang.code && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          )}
        </div>
        {/* Dark/light */}
        <button onClick={toggle}
          className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors">
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        {/* ──────── Notifications ──────── */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen(v => !v)}
            className="relative p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] transition-colors">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-brand-500 text-white
                               text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-[370px] card shadow-card-hover animate-slide-down z-50
                            flex flex-col overflow-hidden" style={{ maxHeight: '500px' }}>
              {/* Dropdown header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] shrink-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-[var(--text)]"
                    style={{ fontFamily: 'Syne, sans-serif' }}>{t('dashboardNavbar.notifications.title')}</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-bold">
                      {unreadCount}
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button onClick={markAllRead}
                    className="text-xs text-brand-500 hover:text-brand-600 font-semibold flex items-center gap-1 transition-colors">
                    <Check className="w-3 h-3" /> {t('dashboardNavbar.notifications.markAllRead')}
                  </button>
                )}
              </div>
              {/* Notification list */}
              <div className="overflow-y-auto flex-1">
                {notifications.length === 0 ? (
                  <div className="py-14 text-center px-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-3">
                      <Bell className="w-5 h-5 text-[var(--text-muted)]" />
                    </div>
                    <p className="text-sm font-semibold text-[var(--text)]"
                      style={{ fontFamily: 'Syne, sans-serif' }}>{t('dashboardNavbar.notifications.allCaughtUp')}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-1">{t('dashboardNavbar.notifications.noNotifications')}</p>
                  </div>
                ) : notifications.slice(0, 20).map(n => {
                  const route = getNotifRoute(n, user?.role);
                  return (
                    <div key={n.id}
                      className={clsx(
                        'group relative flex items-start gap-3 px-4 py-3.5 border-b border-[var(--border)] last:border-0 transition-colors',
                        route ? 'cursor-pointer' : 'cursor-default',
                        !n.is_read
                          ? 'bg-brand-50 dark:bg-brand-900/10 hover:bg-brand-100/60 dark:hover:bg-brand-900/20'
                          : 'hover:bg-[var(--bg-secondary)]'
                      )}
                      onClick={() => route && handleNotifClick(n)}
                    >
                      {/* Type icon */}
                      <div className={clsx(
                        'w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                        !n.is_read ? 'bg-brand-100 dark:bg-brand-900/30' : 'bg-[var(--bg-secondary)]'
                      )}>
                        <NotifTypeIcon type={n.type} />
                      </div>
                      {/* Text */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-1.5">
                          <p className={clsx('text-xs font-semibold truncate',
                            !n.is_read ? 'text-[var(--text)]' : 'text-[var(--text-secondary)]')}
                            style={{ fontFamily: 'Syne, sans-serif' }}>
                            {n.title}
                          </p>
                          {!n.is_read && (
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {n.created_at
                              ? formatDistanceToNow(new Date(n.created_at), { addSuffix: true })
                              : ''}
                          </span>
                          {route && (
                            <span className="text-[10px] text-brand-500 font-semibold flex items-center gap-0.5
                                            opacity-0 group-hover:opacity-100 transition-opacity">
                              {t('dashboardNavbar.notifications.viewDetails')} <ExternalLink className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Delete btn */}
                      <button
                        onClick={e => { e.stopPropagation(); remove(n.id); }}
                        className="absolute right-3 top-3.5 opacity-0 group-hover:opacity-100
                                   text-[var(--text-muted)] hover:text-red-500 transition-all p-1 rounded-lg
                                   hover:bg-red-50 dark:hover:bg-red-900/20">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
                  <p className="text-[10px] text-center text-[var(--text-muted)]">
                    {t('dashboardNavbar.notifications.footer', { count: notifications.length })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
        {/* ──────── User menu ──────── */}
        <div className="relative" ref={userRef}>
          <button onClick={() => setUserOpen(v => !v)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors">
            <Avatar src={user?.avatar_url} name={user?.name} size="sm" />
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-[var(--text)] leading-none"
                style={{ fontFamily: 'Syne, sans-serif' }}>{user?.name?.split(' ')[0]}</p>
              <p className="text-[10px] text-[var(--text-muted)] capitalize mt-0.5">{user?.role}</p>
            </div>
          </button>
          {userOpen && (
            <div className="absolute right-0 mt-2 w-52 card shadow-card-hover py-1 animate-slide-down z-50">
              <div className="px-4 py-2.5 border-b border-[var(--border)]">
                <p className="text-sm font-semibold text-[var(--text)] truncate"
                  style={{ fontFamily: 'Syne, sans-serif' }}>{user?.name}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
              </div>
              <Link to={profileRoute}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors"
                onClick={() => setUserOpen(false)}>
                <User className="w-4 h-4 text-[var(--text-muted)]" /> {t('dashboardNavbar.userMenu.profile')}
              </Link>
              <hr className="my-1 border-[var(--border)]" />
              <button onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <LogOut className="w-4 h-4" /> {t('dashboardNavbar.userMenu.logout')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}