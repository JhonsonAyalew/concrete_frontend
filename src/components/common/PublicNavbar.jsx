import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, Globe, Menu, X, ChevronDown, LayoutDashboard, LogOut, User, Settings } from 'lucide-react';
import { Avatar } from '../ui';
import clsx from 'clsx';
export default function PublicNavbar() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/equipment', label: t('nav.equipment') },
    { to: '/about', label: t('nav.about') },
    { to: '/contact', label: t('nav.contact') },
  ];
  const languages = [
    { code: 'en', label: 'English', short: 'EN', native: 'English' },
    { code: 'am', label: 'አማርኛ', short: 'AM', native: 'አማርኛ' },
    { code: 'zh', label: '中文', short: 'ZH', native: '中文' },
  ];
  const switchLang = (langCode) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('i18nextLng', langCode);
    setLangMenuOpen(false);
  };
  const getCurrentLanguageLabel = () => {
    const current = languages.find(l => l.code === i18n.language);
    return current ? current.short : 'EN';
  };
  const handleLogout = async () => {
    await logout();
    navigate('/');
  };
  const dashboardRoute = { admin: '/admin', superadmin: '/admin', owner: '/owner', customer: '/customer' };
  // Get user menu items based on role
  const getUserMenuItems = () => {
    const items = [];
    // Dashboard is always shown
    items.push({
      type: 'link',
      to: dashboardRoute[user?.role] || '/',
      icon: LayoutDashboard,
      label: t('nav.dashboard')
    });
    // Profile is always shown
    items.push({
      type: 'link',
      to: user?.role === 'owner' ? '/owner/profile' : user?.role === 'customer' ? '/customer/profile' : '/admin/profile',
      icon: User,
      label: t('nav.profile')
    });
    // Settings - only for admin and owner (NOT for customer)
    if (user?.role !== 'customer') {
      items.push({
        type: 'link',
        to: user?.role === 'owner' ? '/owner/settings' : '/admin/settings',
        icon: Settings,
        label: t('nav.settings')
      });
    }
    return items;
  };
  return (
    <nav className="fixed top-0 inset-x-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-md shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
              <img 
                src="/logo.png" 
                alt={t('nav.logoAlt')} 
                className="w-7 h-6 object-cover brightness-0 invert"
              />
            </div>
            <span className="font-bold text-xl text-[var(--text)] tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
              <span className="text-brand-500">C</span>oncrete
            </span>
          </Link>
          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1 lg:gap-2">
            {navLinks.map(l => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'}
                className={({ isActive }) => clsx(
                  'px-4 lg:px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive 
                    ? 'text-brand-500 bg-brand-50 dark:bg-brand-900/20 shadow-sm' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]'
                )}>
                {l.label}
              </NavLink>
            ))}
          </div>
          {/* Right side actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Language dropdown */}
            <div className="relative">
              <button 
                onClick={() => setLangMenuOpen(v => !v)} 
                title={t('nav.switchLanguage')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)] transition-all duration-200 border border-[var(--border)]"
              >
                <Globe className="w-3.5 h-3.5" />
                {getCurrentLanguageLabel()}
                <ChevronDown className="w-3 h-3" />
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 card shadow-card-hover py-1 animate-slide-down z-50">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => switchLang(lang.code)}
                      className={clsx(
                        'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-all duration-200 hover:bg-[var(--bg-secondary)]',
                        i18n.language === lang.code 
                          ? 'text-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                          : 'text-[var(--text)]'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5" />
                        {lang.native}
                      </span>
                      {i18n.language === lang.code && <span className="text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Theme toggle */}
            <button 
              onClick={toggle}
              title={dark ? t('nav.lightMode') : t('nav.darkMode')}
              className="p-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)] transition-all duration-200"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {/* User menu or auth buttons */}
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-all duration-200 border border-transparent hover:border-[var(--border)]"
                >
                  <Avatar src={user.avatar_url} name={user.name} size="sm" />
                  <span className="hidden sm:block text-sm font-medium text-[var(--text)] max-w-[100px] truncate">
                    {user.name?.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 card shadow-card-hover py-1 animate-slide-down z-50">
                    {getUserMenuItems().map((item, index) => (
                      <Link
                        key={index}
                        to={item.to}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-all duration-200"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <item.icon className="w-4 h-4 text-[var(--text-muted)]" />
                        {item.label}
                      </Link>
                    ))}
                    <hr className="my-1 border-[var(--border)]" />
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/login" className="btn-ghost text-sm px-5 py-2 rounded-xl font-medium transition-all duration-200">
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn-primary text-sm px-5 py-2 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200">
                  {t('nav.register')}
                </Link>
              </div>
            )}
            {/* Mobile hamburger */}
            <button 
              onClick={() => setMobileOpen(v => !v)} 
              className="md:hidden p-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)] transition-all duration-200"
              aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[var(--border)] bg-[var(--bg)] px-4 py-4 space-y-2 animate-slide-down shadow-lg">
          {navLinks.map(l => (
            <NavLink key={l.to} to={l.to} end={l.to === '/'} onClick={() => setMobileOpen(false)}
              className={({ isActive }) => clsx(
                'block px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                isActive 
                  ? 'text-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]'
              )}>
              {l.label}
            </NavLink>
          ))}
          <div className="pt-3 mt-2 border-t border-[var(--border)] space-y-2">
            {/* Language selector in mobile */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-[var(--text-muted)] px-4 pt-2 uppercase tracking-wider">
                {t('nav.language')}
              </p>
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    switchLang(lang.code);
                    setMobileOpen(false);
                  }}
                  className={clsx(
                    'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-200',
                    i18n.language === lang.code 
                      ? 'text-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                  )}
                >
                  <span className="flex items-center gap-3">
                    <Globe className="w-4 h-4" />
                    {lang.native}
                  </span>
                  {i18n.language === lang.code && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
            {/* Auth buttons for mobile */}
            {!user && (
              <div className="space-y-2 pt-2">
                <Link to="/login" className="btn-secondary text-sm text-center block py-3 rounded-xl" onClick={() => setMobileOpen(false)}>
                  {t('nav.login')}
                </Link>
                <Link to="/register" className="btn-primary text-sm text-center block py-3 rounded-xl" onClick={() => setMobileOpen(false)}>
                  {t('nav.register')}
                </Link>
              </div>
            )}
            {/* User menu items for mobile when logged in */}
            {user && (
              <div className="space-y-1 pt-2">
                <Link 
                  to={dashboardRoute[user.role] || '/'} 
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-all duration-200"
                  onClick={() => setMobileOpen(false)}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  {t('nav.dashboard')}
                </Link>
                <Link 
                  to={user?.role === 'owner' ? '/owner/profile' : user?.role === 'customer' ? '/customer/profile' : '/admin/profile'}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-all duration-200"
                  onClick={() => setMobileOpen(false)}
                >
                  <User className="w-4 h-4" />
                  {t('nav.profile')}
                </Link>
                {user?.role !== 'customer' && (
                  <Link 
                    to={user?.role === 'owner' ? '/owner/settings' : '/admin/settings'}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-all duration-200"
                    onClick={() => setMobileOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    {t('nav.settings')}
                  </Link>
                )}
                <hr className="my-2 border-[var(--border)]" />
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                >
                  <LogOut className="w-4 h-4" />
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
// Import Check icon if not already imported
import { Check } from 'lucide-react';