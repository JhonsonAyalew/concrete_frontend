import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Menu, X, Sun, Moon, Globe, Bell, ChevronDown, User, LogOut, Settings, LayoutDashboard } from 'lucide-react'
import useAuthStore from '@/stores/authStore'
import useThemeStore from '@/stores/themeStore'
import { Avatar } from '@/components/ui'
import styles from './Navbar.module.css'
const Navbar = () => {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  useEffect(() => { setMobileOpen(false) }, [location])
  const getDashboardPath = () => {
    if (!user) return '/login'
    if (user.role === 'admin' || user.role === 'superadmin') return '/admin'
    if (user.role === 'owner') return '/owner'
    return '/customer'
  }
  const handleLogout = async () => {
    await logout()
    navigate('/')
    setUserMenuOpen(false)
  }
  const switchLanguage = (lang) => {
    i18n.changeLanguage(lang)
    setLangMenuOpen(false)
  }
  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.inner}>
        {/* Logo */}
        <Link to="/" className={styles.logo}>
          <span className={styles.logoIcon}>⚙</span>
          <span className={styles.logoText}>
            <span className={styles.logoMain}>EquipRent</span>
            <span className={styles.logoSub}>Ethiopia</span>
          </span>
        </Link>
        {/* Desktop nav */}
        <nav className={styles.desktopNav}>
          <Link to="/equipment" className={`${styles.navLink} ${location.pathname.startsWith('/equipment') ? styles.active : ''}`}>
            {t('nav.equipment')}
          </Link>
          <Link to="/how-it-works" className={`${styles.navLink} ${location.pathname === '/how-it-works' ? styles.active : ''}`}>
            {t('nav.howItWorks')}
          </Link>
          <Link to="/about" className={`${styles.navLink} ${location.pathname === '/about' ? styles.active : ''}`}>
            {t('nav.about')}
          </Link>
          <Link to="/contact" className={`${styles.navLink} ${location.pathname === '/contact' ? styles.active : ''}`}>
            {t('nav.contact')}
          </Link>
        </nav>
        {/* Right side */}
        <div className={styles.right}>
          {/* Lang */}
          <div className={styles.dropdown}>
            <button className={styles.iconBtn} onClick={() => setLangMenuOpen(!langMenuOpen)}>
              <Globe size={18} />
              <span className={styles.langLabel}>{i18n.language === 'am' ? 'አማ' : 'EN'}</span>
            </button>
            {langMenuOpen && (
              <div className={styles.dropdownMenu}>
                <button onClick={() => switchLanguage('en')} className={`${styles.dropdownItem} ${i18n.language === 'en' ? styles.dropdownItemActive : ''}`}>
                  🇺🇸 English
                </button>
                <button onClick={() => switchLanguage('am')} className={`${styles.dropdownItem} ${i18n.language === 'am' ? styles.dropdownItemActive : ''}`}>
                  🇪🇹 አማርኛ
                </button>
              </div>
            )}
          </div>
          {/* Theme toggle */}
          <button className={styles.iconBtn} onClick={toggleTheme} title={theme === 'dark' ? t('common.lightMode') : t('common.darkMode')}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {isAuthenticated ? (
            <>
              <Link to="/customer/notifications" className={styles.iconBtn}>
                <Bell size={18} />
              </Link>
              {/* User menu */}
              <div className={styles.dropdown}>
                <button className={styles.userBtn} onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <Avatar src={user?.avatar_url} name={user?.name || ''} size={32} />
                  <span className={styles.userName}>{user?.name?.split(' ')[0]}</span>
                  <ChevronDown size={14} className={userMenuOpen ? styles.chevronUp : ''} />
                </button>
                {userMenuOpen && (
                  <div className={styles.dropdownMenu} style={{ minWidth: '200px', right: 0, left: 'auto' }}>
                    <div className={styles.dropdownHeader}>
                      <Avatar src={user?.avatar_url} name={user?.name || ''} size={36} />
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '13px' }}>{user?.name}</p>
                        <p style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>{user?.email}</p>
                      </div>
                    </div>
                    <div className={styles.dropdownDivider} />
                    <Link to={getDashboardPath()} className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      <LayoutDashboard size={15} />{t('common.dashboard')}
                    </Link>
                    <Link to="/profile" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      <User size={15} />{t('common.profile')}
                    </Link>
                    <Link to="/settings" className={styles.dropdownItem} onClick={() => setUserMenuOpen(false)}>
                      <Settings size={15} />{t('common.settings')}
                    </Link>
                    <div className={styles.dropdownDivider} />
                    <button className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`} onClick={handleLogout}>
                      <LogOut size={15} />{t('common.logout')}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className={styles.authBtns}>
              <Link to="/login" className={styles.loginBtn}>{t('auth.login')}</Link>
              <Link to="/register" className={styles.registerBtn}>{t('auth.register')}</Link>
            </div>
          )}
          {/* Mobile menu toggle */}
          <button className={styles.mobileToggle} onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
      {/* Mobile menu */}
      <div className={`${styles.mobileMenu} ${mobileOpen ? styles.mobileMenuOpen : ''}`}>
        <Link to="/equipment" className={styles.mobileLink}>{t('nav.equipment')}</Link>
        <Link to="/how-it-works" className={styles.mobileLink}>{t('nav.howItWorks')}</Link>
        <Link to="/about" className={styles.mobileLink}>{t('nav.about')}</Link>
        <Link to="/contact" className={styles.mobileLink}>{t('nav.contact')}</Link>
        <div className={styles.mobileDivider} />
        {isAuthenticated ? (
          <>
            <Link to={getDashboardPath()} className={styles.mobileLink}>{t('common.dashboard')}</Link>
            <button className={`${styles.mobileLink} ${styles.mobileLinkDanger}`} onClick={handleLogout}>{t('common.logout')}</button>
          </>
        ) : (
          <>
            <Link to="/login" className={styles.mobileLink}>{t('auth.login')}</Link>
            <Link to="/register" className={`${styles.mobileLink} ${styles.mobileLinkBrand}`}>{t('auth.register')}</Link>
          </>
        )}
        <div className={styles.mobileFooter}>
          <button onClick={toggleTheme} className={styles.iconBtn}>{theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}</button>
          <button onClick={() => switchLanguage(i18n.language === 'en' ? 'am' : 'en')} className={styles.iconBtn}>
            <Globe size={18}/> <span style={{ fontSize:'12px' }}>{i18n.language === 'am' ? 'EN' : 'አማ'}</span>
          </button>
        </div>
      </div>
      {/* Overlay for dropdowns */}
      {(userMenuOpen || langMenuOpen) && (
        <div style={{ position:'fixed', inset:0, zIndex:39 }} onClick={() => { setUserMenuOpen(false); setLangMenuOpen(false) }} />
      )}
    </header>
  )
}
export default Navbar