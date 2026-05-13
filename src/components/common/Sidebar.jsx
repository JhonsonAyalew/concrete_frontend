import { NavLink, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import clsx from 'clsx';
import {
  LayoutDashboard, Wrench, Tag, ClipboardList, CalendarCheck,
  Users, UserCheck, BarChart2, Settings, User, Clock,
  PlusCircle, Calendar, TrendingUp, Search, ShieldCheck, X
} from 'lucide-react';
/* ── link definitions ── */
const adminLinks = [
  { to: '/admin',            label: 'sidebar.dashboard',   icon: LayoutDashboard, end: true },
  { to: '/admin/time-slots', label: 'sidebar.timeSlots',   icon: Clock },
  { to: '/admin/equipment',  label: 'sidebar.equipment',   icon: Wrench },
  { to: '/admin/categories', label: 'sidebar.categories',  icon: Tag },
  { to: '/admin/submissions',label: 'sidebar.submissions', icon: ClipboardList, badgeKey: 'submissions' },
  { to: '/admin/bookings',   label: 'sidebar.bookings',    icon: CalendarCheck,  badgeKey: 'bookings' },
  { to: '/admin/customers',  label: 'sidebar.customers',   icon: Users },
  { to: '/admin/owners',     label: 'sidebar.owners',      icon: UserCheck },
  { to: '/admin/reports',    label: 'sidebar.reports',     icon: BarChart2 },
  { to: '/admin/settings',   label: 'sidebar.settings',    icon: Settings },
  { to: '/admin/profile',    label: 'sidebar.profile',     icon: User },
];
const adminSuperLinks = [
  { to: '/admin/admins', label: 'sidebar.admins', icon: ShieldCheck },
];
const ownerLinks = [
  { to: '/owner',             label: 'sidebar.dashboard',    icon: LayoutDashboard, end: true },
  { to: '/owner/add-equipment',label: 'sidebar.addEquipment',icon: PlusCircle },
  { to: '/owner/submissions', label: 'sidebar.mySubmissions',icon: ClipboardList },
  { to: '/owner/bookings',    label: 'sidebar.bookings',     icon: CalendarCheck,  badgeKey: 'bookings' },
  { to: '/owner/calendar',    label: 'sidebar.calendar',     icon: Calendar },
  { to: '/owner/analytics',   label: 'sidebar.analytics',    icon: TrendingUp },
  { to: '/owner/settings',    label: 'sidebar.settings',     icon: Settings },
  { to: '/owner/profile',     label: 'sidebar.profile',      icon: User },
];
const customerLinks = [
  { to: '/customer',          label: 'sidebar.dashboard', icon: LayoutDashboard, end: true },
  { to: '/equipment',         label: 'sidebar.search',    icon: Search },
  { to: '/customer/bookings', label: 'sidebar.myBookings',icon: CalendarCheck,  badgeKey: 'bookings' },
  { to: '/customer/profile',  label: 'sidebar.profile',   icon: User },
];
/* ── helper: count unread notifications relevant to a key ── */
function useBadgeCounts(notifications) {
  const bookings    = notifications.filter(n => !n.is_read && (n.type?.includes('booking')    || n.data?.booking_id)).length;
  const submissions = notifications.filter(n => !n.is_read && (n.type?.includes('submission') || n.data?.submission_id)).length;
  return { bookings, submissions };
}
export default function Sidebar({ open, onClose }) {
  const { t }                     = useTranslation();
  const { user, isSuperAdmin }    = useAuth();
  const { notifications }         = useNotifications();
  const badges                    = useBadgeCounts(notifications);
  let links = customerLinks;
  if (user?.role === 'admin' || user?.role === 'superadmin') links = adminLinks;
  else if (user?.role === 'owner') links = ownerLinks;
  // Get role panel text
  const getRolePanelText = () => {
    switch (user?.role) {
      case 'admin': return t('sidebar.rolePanel.admin');
      case 'superadmin': return t('sidebar.rolePanel.superAdmin');
      case 'owner': return t('sidebar.rolePanel.owner');
      case 'customer': return t('sidebar.rolePanel.customer');
      default: return '';
    }
  };
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose} />
      )}
      {/* Sidebar */}
      <aside className={clsx(
        'fixed top-0 left-0 h-full w-64 z-50 flex flex-col transition-transform duration-300',
        'lg:translate-x-0 lg:static lg:z-auto',
        open ? 'translate-x-0' : '-translate-x-full'
      )} style={{ background: 'var(--sidebar-bg)' }}>
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-white/10 shrink-0">
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
          <button onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Role label */}
        <div className="px-5 pt-4 pb-1">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/30"
            style={{ fontFamily: 'Syne, sans-serif' }}>
            {getRolePanelText()}
          </span>
        </div>
        {/* Nav links */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          {links.map(({ to, label, icon: Icon, end, badgeKey }) => {
            const badgeCount = badgeKey ? badges[badgeKey] : 0;
            return (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}
                onClick={onClose}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-sm flex-1">{t(label)}</span>
                {/* ── notification badge ── */}
                {badgeCount > 0 && (
                  <span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-brand-500 text-white
                                   text-[10px] font-bold flex items-center justify-center leading-none">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </NavLink>
            );
          })}
          {/* Superadmin extras */}
          {isSuperAdmin && (
            <>
              <div className="pt-3 pb-1 px-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/30"
                  style={{ fontFamily: 'Syne, sans-serif' }}>
                  {t('sidebar.superAdminLabel')}
                </span>
              </div>
              {adminSuperLinks.map(({ to, label, icon: Icon }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) => clsx('sidebar-link', isActive && 'active')}
                  onClick={onClose}>
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="text-sm">{t(label)}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>
        {/* User chip at bottom */}
        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl bg-white/5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600
                            flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white/90 truncate"
                style={{ fontFamily: 'Syne, sans-serif' }}>{user?.name}</p>
              <p className="text-xs text-white/40 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}