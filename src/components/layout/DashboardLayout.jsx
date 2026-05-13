import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Menu, X, Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Sidebar from './Sidebar'
import useAuthStore from '@/stores/authStore'
import { Avatar } from '@/components/ui'
import styles from './DashboardLayout.module.css'
const DashboardLayout = ({ children, role }) => {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  return (
    <div className={styles.layout}>
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <div className={`${styles.sidebarWrapper} ${mobileSidebarOpen ? styles.sidebarOpen : ''}`}>
        <Sidebar role={role} />
      </div>
      {/* Main */}
      <main className={styles.main}>
        {/* Top bar */}
        <header className={styles.topbar}>
          <button
            className={styles.mobileMenuBtn}
            onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          >
            {mobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className={styles.topbarRight}>
            <Link to={role === 'admin' || role === 'superadmin' ? '/admin/notifications' : `/${role}/notifications`} className={styles.topbarBtn}>
              <Bell size={18} />
              <span className={styles.notifDot} />
            </Link>
            <div className={styles.userChip}>
              <Avatar src={user?.avatar_url} name={user?.name || ''} size={28} />
              <span className={styles.userChipName}>{user?.name?.split(' ')[0]}</span>
            </div>
          </div>
        </header>
        {/* Content */}
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  )
}
export default DashboardLayout