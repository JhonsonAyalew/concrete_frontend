import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar';
import DashboardNavbar from '../components/common/DashboardNavbar';
const ownerTitles = {
  '/owner': 'Dashboard',
  '/owner/add-equipment': 'Add Equipment',
  '/owner/submissions': 'My Submissions',
  '/owner/bookings': 'Bookings',
  '/owner/my-equipment': 'My Equipment',
  '/owner/calendar': 'Calendar',
  '/owner/analytics': 'Analytics',
  '/owner/settings': 'Settings',
  '/owner/profile': 'My Profile',
};
const customerTitles = {
  '/customer': 'Dashboard',
  '/customer/bookings': 'My Bookings',
  '/customer/profile': 'My Profile',
};
export function OwnerLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardNavbar onMenuToggle={() => setOpen(v => !v)} title={ownerTitles[pathname] || 'Owner Panel'} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
export function CustomerLayout() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg)]">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardNavbar onMenuToggle={() => setOpen(v => !v)} title={customerTitles[pathname] || 'My Account'} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  );
}
export default OwnerLayout;