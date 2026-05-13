// router/index.js - MODIFIED VERSION
import { createBrowserRouter, Navigate } from 'react-router-dom';
// Layouts
import PublicLayout from '../layouts/PublicLayout';
import AdminLayout from '../layouts/AdminLayout';
import { OwnerLayout } from '../layouts/OwnerLayout';
import CustomerLayout from '../layouts/CustomerLayout';
// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
// Public Pages
import LandingPage from '../pages/public/LandingPage';
import SearchPage from '../pages/public/SearchPage';
import EquipmentDetailPage from '../pages/public/EquipmentDetailPage';
import AboutPage from '../pages/public/AboutPage';
import ContactPage from '../pages/public/ContactPage';
// Admin Pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminEquipment from '../pages/admin/AdminEquipment';
import AdminCategories from '../pages/admin/AdminCategories';
import AdminSubmissions from '../pages/admin/AdminSubmissions';
import AdminBookings from '../pages/admin/AdminBookings';
import AdminCustomers from '../pages/admin/AdminCustomers';
import AdminOwners from '../pages/admin/AdminOwners';
import AdminReports from '../pages/admin/AdminReports';
import AdminSettings from '../pages/admin/AdminSettings';
import AdminProfile from '../pages/admin/AdminProfile';
import AdminTimeSlots from '../pages/admin/AdminTimeSlots';
import AdminAdmins from '../pages/admin/AdminAdmins';
// Owner Pages
import OwnerDashboard from '../pages/owner/OwnerDashboard';
import OwnerAddEquipment from '../pages/owner/OwnerAddEquipment';
import OwnerMySubmissions from '../pages/owner/OwnerMySubmissions';
import OwnerCalendar from '../pages/owner/OwnerCalendar';
import OwnerAnalytics from '../pages/owner/OwnerAnalytics';
import OwnerProfile from '../pages/owner/OwnerProfile';
import OwnerSettings from '../pages/owner/OwnerSettings';
import OwnerBookings from '../pages/owner/OwnerBookings';
import OwnerMyEquipment from '../pages/owner/OwnerMyEquipment';
// Customer Pages
import CustomerDashboard from '../pages/customer/CustomerDashboard';
import CustomerBookings from '../pages/customer/CustomerBookings';
import CustomerProfile from '../pages/customer/CustomerProfile';
import BookEquipmentPage from '../pages/customer/BookEquipmentPage';
// Superadmin
import SuperAdminPage from '../pages/superadmin/SuperAdminPage';
// SIMPLE AUTH CHECK - DIRECT from localStorage, no hooks
function getAuthFromStorage() {
  const token = localStorage.getItem('token') || localStorage.getItem('equiprent_access_token');
  const userStr = localStorage.getItem('equiprent-user') || localStorage.getItem('equiprent_user');
  if (!token || !userStr) return null;
  try {
    const user = JSON.parse(userStr);
    return { user, token };
  } catch {
    return null;
  }
}
// SIMPLE Protected Route - NO HOOKS
function SimpleRequireAuth({ children, roles }) {
  const auth = getAuthFromStorage();
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  if (roles && !roles.includes(auth.user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}
// SIMPLE GuestOnly - NO HOOKS
function SimpleGuestOnly({ children }) {
  const auth = getAuthFromStorage();
  if (auth) {
    const dest = {
      admin: '/admin',
      superadmin: '/admin',
      owner: '/owner',
      customer: '/customer',
    };
    return <Navigate to={dest[auth.user.role] ?? '/'} replace />;
  }
  return children;
}
export const router = createBrowserRouter([
  // Public routes
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/equipment', element: <SearchPage /> },
      { path: '/equipment/:id', element: <EquipmentDetailPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/contact', element: <ContactPage /> },
    ],
  },
  // Auth routes
  { path: '/login', element: <SimpleGuestOnly><LoginPage /></SimpleGuestOnly> },
  { path: '/register', element: <SimpleGuestOnly><RegisterPage /></SimpleGuestOnly> },
  { path: '/forgot-password', element: <SimpleGuestOnly><ForgotPasswordPage /></SimpleGuestOnly> },
  { path: '/reset-password', element: <ResetPasswordPage /> },
  // Admin routes
  {
    path: '/admin',
    element: <SimpleRequireAuth roles={['admin', 'superadmin']}><AdminLayout /></SimpleRequireAuth>,
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: 'equipment', element: <AdminEquipment /> },
      { path: 'categories', element: <AdminCategories /> },
      { path: 'submissions', element: <AdminSubmissions /> },
      { path: 'bookings', element: <AdminBookings /> },
      { path: 'customers', element: <AdminCustomers /> },
      { path: 'owners', element: <AdminOwners /> },
      { path: 'reports', element: <AdminReports /> },
      { path: 'settings', element: <AdminSettings /> },
      { path: 'profile', element: <AdminProfile /> },
      { path: 'time-slots', element: <AdminTimeSlots /> },
      { path: 'admins', element: <SimpleRequireAuth roles={['superadmin']}><AdminAdmins /></SimpleRequireAuth> },
    ],
  },
  // Owner routes
  {
    path: '/owner',
    element: <SimpleRequireAuth roles={['owner']}><OwnerLayout /></SimpleRequireAuth>,
    children: [
      { index: true, element: <OwnerDashboard /> },
      { path: 'add-equipment', element: <OwnerAddEquipment /> },
      { path: 'submissions', element: <OwnerMySubmissions /> },
      { path: 'bookings', element: <OwnerBookings /> },
      { path: 'my-equipment', element: <OwnerMyEquipment /> },
      { path: 'calendar', element: <OwnerCalendar /> },
      { path: 'analytics', element: <OwnerAnalytics /> },
      { path: 'profile', element: <OwnerProfile /> },
      { path: 'settings', element: <OwnerSettings /> },
    ],
  },
  // Customer routes
  {
    path: '/customer',
    element: <SimpleRequireAuth roles={['customer']}><CustomerLayout /></SimpleRequireAuth>,
    children: [
      { index: true, element: <CustomerDashboard /> },
      { path: 'bookings', element: <CustomerBookings /> },
      { path: 'book/:id', element: <BookEquipmentPage /> },
      { path: 'profile', element: <CustomerProfile /> },
    ],
  },
  // Super Admin
  {
    path: '/superadmin',
    element: <SimpleRequireAuth roles={['superadmin']}><AdminLayout /></SimpleRequireAuth>,
    children: [
      { index: true, element: <SuperAdminPage /> },
    ],
  },
  // Fallback
  { path: '*', element: <Navigate to="/" replace /> },
]);