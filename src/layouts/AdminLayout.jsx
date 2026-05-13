import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import DashboardNavbar from '../components/common/DashboardNavbar';
import { useTranslation } from 'react-i18next';
const routeTitles = {
  '/admin': 'Dashboard',
  '/admin/equipment': 'Equipment',
  '/admin/categories': 'Categories',
  '/admin/submissions': 'Submissions',
  '/admin/bookings': 'Bookings',
  '/admin/customers': 'Customers',
  '/admin/owners': 'Owners',
  '/admin/reports': 'Reports',
  '/admin/settings': 'Settings',
  '/admin/profile': 'My Profile',
  '/admin/time-slots': 'Time Control',
  '/admin/admins': 'Administrators',
};
export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const title = routeTitles[pathname] || 'Admin Panel';
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardNavbar onMenuToggle={() => setSidebarOpen(v => !v)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}