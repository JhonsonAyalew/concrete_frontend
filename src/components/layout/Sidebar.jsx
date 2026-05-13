import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  LayoutDashboard, Package, BookOpen, Users, BarChart2, Settings,
  ChevronLeft, ChevronRight, LogOut, Bell, FileText, Plus,
  TrendingUp, Star, Sun, Moon, Globe, PanelLeft, List
} from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import useThemeStore from '@/stores/themeStore'
import { Avatar } from '@/components/ui'
import styles from './Sidebar.module.css'
const ADMIN_NAV = [
  { label: 'nav.adminDashboard', icon: LayoutDashboard, path: '/admin' },
  { label: 'nav.manageUsers', icon: Users, path: '/admin/users' },
  { label: 'nav.manageEquipment', icon: Package, path: '/admin/equipment' },
  { label: 'nav.manageSubmissions', icon: FileText, path: '/admin/submissions' },
  { label: 'nav.manageBookings', icon: BookOpen, path: '/admin/bookings' },
  { label: 'nav.reports', icon: BarChart2, path: '/admin/reports' },
  { label: 'nav.adminSettings', icon: Settings, path: '/admin/settings' },
]
const OWNER_NAV = [
  { label: 'nav.ownerDashboard', icon: LayoutDashboard, path: '/owner' },
  { label: 'nav.myEquipment', icon: List, path: '/owner/my-equipment' },
  { label: 'nav.newSubmission', icon: Plus, path: '/owner/submit' },
  { label: 'nav.ownerBookings', icon: BookOpen, path: '/owner/bookings' },
  { label: 'nav.earnings', icon: TrendingUp, path: '/owner/earnings' },
]
const CUSTOMER_NAV = [
  { label: 'nav.home', icon: LayoutDashboard, path: '/customer' },
  { label: 'nav.myBookings', icon: BookOpen, path: '/customer/bookings' },
  { label: 'nav.myReviews', icon: Star, path: '/customer/reviews' },
]
const Sidebar = ({ role }) => {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const [collapsed, setCollapsed] = useState(false)
  const navItems = role === 'admin' || role === 'superadmin' ? ADMIN_NAV
    : role === 'owner' ? OWNER_NAV
    : CUSTOMER_NAV
  const handleLogout = async () => {
    await logout()
    navigate('/')
  }
  const isActive = (path) => {
    if (path === '/admin' || path === '/owner' || path === '/customer') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }
  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Logo */}
      <div className={styles.logo}>
        {!collapsed && (
          <Link to="/" className={styles.logoLink}>
            <span className={styles.logoIcon}>⚙</span>
            <div>
              <div className={styles.logoMain}>EquipRent</div>
              <div className={styles.logoSub}>Ethiopia</div>
            </div>
          </Link>
        )}
        <button className={styles.collapseBtn} onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
      {/* Navigation */}
      <nav className={styles.nav}>
        {navItems.map(({ label, icon: Icon, path }) => (
          <Link
            key={path}
            to={path}
            className={`${styles.navItem} ${isActive(path) ? styles.active : ''}`}
            title={collapsed ? t(label) : undefined}
          >
            <Icon size={18} className={styles.navIcon} />
            {!collapsed && <span className={styles.navLabel}>{t(label)}</span>}
            {isActive(path) && <span className={styles.activeIndicator} />}
          </Link>
        ))}
      </nav>
      {/* Bottom utilities */}
      <div className={styles.bottom}>
        <button className={styles.utilBtn} onClick={toggleTheme} title={theme === 'dark' ? 'Light mode' : 'Dark mode'}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          {!collapsed && <span>{theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}</span>}
        </button>
        <button className={styles.utilBtn} onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'am' : 'en')} title="Switch language">
          <Globe size={16} />
          {!collapsed && <span>{i18n.language === 'am' ? 'English' : 'አማርኛ'}</span>}
        </button>
        <div className={styles.divider} />
        {/* User */}
        <div className={styles.userArea}>
          <Avatar src={user?.avatar_url} name={user?.name || ''} size={collapsed ? 32 : 36} />
          {!collapsed && (
            <div className={styles.userInfo}>
              <p className={styles.userName}>{user?.name}</p>
              <p className={styles.userRole}>{user?.role}</p>
            </div>
          )}
        </div>
        <button className={`${styles.utilBtn} ${styles.logoutBtn}`} onClick={handleLogout} title="Logout">
          <LogOut size={16} />
          {!collapsed && <span>{t('common.logout')}</span>}
        </button>
      </div>
    </aside>
  )
}
export default Sidebar