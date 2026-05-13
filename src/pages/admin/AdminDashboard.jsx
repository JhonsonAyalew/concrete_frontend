import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { reportService, bookingService } from '../../services';
import { userService } from '../../services/index';
import { equipmentService } from '../../services/equipmentService';
import { ownerEquipmentService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  DollarSign, Users, Wrench, ClipboardList, CalendarCheck,
  TrendingUp, AlertCircle, CheckCircle2, Clock, XCircle,
  ArrowUpRight, ArrowDownRight, BarChart2, RefreshCw,
  UserCheck, Award, Package
} from 'lucide-react';
import { format, differenceInDays, differenceInHours } from 'date-fns';
const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 shadow-lg text-xs border border-[var(--border])">
      <p className="font-bold text-[var(--text)] mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: {p.value > 999 ? `ETB ${p.value.toLocaleString()}` : p.value}
        </p>
      ))}
    </div>
  );
};
const ensureIterable = (data) => {
  if (Array.isArray(data) && data.length > 0) return data;
  return [];
};
function StatusBadge({ status }) {
  const { t } = useTranslation();
  const config = {
    pending: { label: t('admin.status.pending'), className: 'badge-warning' },
    confirmed: { label: t('admin.status.confirmed'), className: 'badge-info' },
    completed: { label: t('admin.status.completed'), className: 'badge-success' },
    cancelled: { label: t('admin.status.cancelled'), className: 'badge-danger' },
  };
  const { label, className } = config[status] || { label: status, className: 'badge-neutral' };
  return <span className={`badge ${className}`}>{label}</span>;
}
// Helper function to calculate owner's original price and admin profit for a booking
const calculateBookingOwnerPricing = async (booking) => {
  try {
    const response = await ownerEquipmentService.getAll({ limit: 100 });
    const allOwnerEquipment = response?.data?.data || response?.data || [];
    const ownerEquip = allOwnerEquipment.find(oe => oe.equipment_id === booking.equipment_id);
    if (!ownerEquip) {
      return {
        adminRevenue: booking.total_amount || 0,
        ownerEarns: booking.owner_payout || 0,
        adminProfit: (booking.total_amount || 0) - (booking.owner_payout || 0)
      };
    }
    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    const days = Math.max(1, differenceInDays(end, start));
    let ownerUnitPrice = 0;
    const pricingMode = booking.pricing_mode || 'daily';
    switch (pricingMode) {
      case 'hourly':
        ownerUnitPrice = ownerEquip.price_per_hour || (ownerEquip.price_per_day / 8);
        break;
      case 'daily':
        ownerUnitPrice = ownerEquip.price_per_day;
        break;
      case 'weekly':
        ownerUnitPrice = ownerEquip.price_per_week || (ownerEquip.price_per_day * 7);
        break;
      case 'monthly':
        ownerUnitPrice = ownerEquip.price_per_month || (ownerEquip.price_per_day * 30);
        break;
      default:
        ownerUnitPrice = ownerEquip.price_per_day;
    }
    let ownerTotal = 0;
    switch (pricingMode) {
      case 'hourly': {
        let hours = 8;
        if (booking.start_time && booking.end_time) {
          const startDateTime = new Date(`2000-01-01T${booking.start_time}`);
          const endDateTime = new Date(`2000-01-01T${booking.end_time}`);
          hours = Math.max(1, differenceInHours(endDateTime, startDateTime));
        }
        ownerTotal = ownerUnitPrice * hours * days;
        break;
      }
      case 'daily':
        ownerTotal = ownerUnitPrice * days;
        break;
      case 'weekly':
        ownerTotal = ownerUnitPrice * Math.ceil(days / 7);
        break;
      case 'monthly':
        ownerTotal = ownerUnitPrice * Math.ceil(days / 30);
        break;
      default:
        ownerTotal = ownerUnitPrice * days;
    }
    const adminRevenue = booking.total_amount || 0;
    const adminProfit = adminRevenue - ownerTotal;
    return {
      adminRevenue: adminRevenue,
      ownerEarns: ownerTotal,
      adminProfit: adminProfit
    };
  } catch (error) {
    return {
      adminRevenue: booking.total_amount || 0,
      ownerEarns: booking.owner_payout || 0,
      adminProfit: (booking.total_amount || 0) - (booking.owner_payout || 0)
    };
  }
};
export default function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState(6);
  // Top performers data (using owner's original prices)
  const [topBookings, setTopBookings] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [topOwners, setTopOwners] = useState([]);
  const [topEquipment, setTopEquipment] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [adminProfitData, setAdminProfitData] = useState([]);
  const loadTopPerformers = async () => {
    try {
      // Get all bookings for sorting
      const bookingsRes = await bookingService.getAll({ limit: 100 });
      const allBookings = bookingsRes?.data?.data || [];
      // Calculate recalculated values for each completed booking
      const bookingsWithRealValues = await Promise.all(
        allBookings.map(async (booking) => {
          if (booking.status === 'completed') {
            const pricing = await calculateBookingOwnerPricing(booking);
            return {
              ...booking,
              real_admin_revenue: pricing.adminRevenue,
              real_owner_earns: pricing.ownerEarns,
              real_admin_profit: pricing.adminProfit
            };
          }
          return booking;
        })
      );
      // Top Bookings by admin revenue
      const sortedByAdminRevenue = [...bookingsWithRealValues]
        .sort((a, b) => (b.real_admin_revenue || b.total_amount || 0) - (a.real_admin_revenue || a.total_amount || 0))
        .slice(0, 5);
      setTopBookings(sortedByAdminRevenue);
      // Calculate customer totals using admin revenue (what customer paid)
      const customerMap = new Map();
      bookingsWithRealValues.forEach(booking => {
        const customerId = booking.customer_id;
        const customerName = booking.customer_name;
        const amount = booking.real_admin_revenue || booking.total_amount || 0;
        if (customerId && customerName) {
          if (!customerMap.has(customerId)) {
            customerMap.set(customerId, { name: customerName, total: 0, count: 0 });
          }
          customerMap.get(customerId).total += amount;
          customerMap.get(customerId).count += 1;
        }
      });
      const sortedCustomers = Array.from(customerMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .map(c => ({ name: c.name, total_spent: c.total, bookings_count: c.count }));
      setTopCustomers(sortedCustomers);
      // Calculate owner totals using owner's real earnings
      const ownerMap = new Map();
      bookingsWithRealValues.forEach(booking => {
        const ownerId = booking.owner_id;
        const ownerName = booking.owner_name;
        const ownerEarns = booking.real_owner_earns || booking.owner_payout || 0;
        if (ownerId && ownerName) {
          if (!ownerMap.has(ownerId)) {
            ownerMap.set(ownerId, { name: ownerName, revenue: 0, bookings_count: 0 });
          }
          ownerMap.get(ownerId).revenue += ownerEarns;
          ownerMap.get(ownerId).bookings_count += 1;
        }
      });
      // Also add equipment count from owner_equipment
      const equipRes = await ownerEquipmentService.getAll({ limit: 100 });
      const allOwnerEquip = equipRes?.data?.data || equipRes?.data || [];
      allOwnerEquip.forEach(oe => {
        if (oe.status === 'approved' && ownerMap.has(oe.owner_id)) {
          ownerMap.get(oe.owner_id).equipment_count = (ownerMap.get(oe.owner_id).equipment_count || 0) + 1;
        }
      });
      const sortedOwners = Array.from(ownerMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);
      setTopOwners(sortedOwners);
      // Calculate equipment totals using admin revenue
      const equipmentMap = new Map();
      const allEquipment = allOwnerEquip.filter(oe => oe.status === 'approved');
      allEquipment.forEach(equip => {
        equipmentMap.set(equip.equipment_id, {
          name: equip.name,
          equipment_id: equip.equipment_id,
          booking_count: 0,
          total_revenue: 0
        });
      });
      bookingsWithRealValues.forEach(booking => {
        const equipId = booking.equipment_id;
        const amount = booking.real_admin_revenue || booking.total_amount || 0;
        if (equipId && equipmentMap.has(equipId)) {
          equipmentMap.get(equipId).booking_count += 1;
          equipmentMap.get(equipId).total_revenue += amount;
        }
      });
      const sortedEquipment = Array.from(equipmentMap.values())
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 5);
      setTopEquipment(sortedEquipment);
      // Recent activity with real values
      const sortedByDate = [...bookingsWithRealValues]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 8);
      setRecentActivity(sortedByDate);
      // Monthly admin profit data for chart
      const monthlyProfitMap = new Map();
      const completedBookings = bookingsWithRealValues.filter(b => b.status === 'completed');
      completedBookings.forEach(booking => {
        const date = new Date(booking.completed_at || booking.created_at);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const monthLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        const profit = booking.real_admin_profit || 0;
        if (!monthlyProfitMap.has(monthKey)) {
          monthlyProfitMap.set(monthKey, { month: monthLabel, profit: 0, revenue: 0, ownerEarns: 0 });
        }
        const monthData = monthlyProfitMap.get(monthKey);
        monthData.profit += profit;
        monthData.revenue += booking.real_admin_revenue || booking.total_amount || 0;
        monthData.ownerEarns += booking.real_owner_earns || 0;
      });
      const profitChartData = Array.from(monthlyProfitMap.values())
        .sort((a, b) => {
          const dateA = new Date(a.month);
          const dateB = new Date(b.month);
          return dateA - dateB;
        })
        .slice(-6);
      setAdminProfitData(profitChartData);
    } catch (err) {
    }
  };
  const load = async (months) => {
    try {
      setError(null);
      const [ov, rev, bk, cat] = await Promise.all([
        reportService.overview(),
        reportService.revenue(months),
        reportService.bookings(months),
        reportService.categories(),
      ]);
      const overviewData = ov?.data?.data || null;
      const revenueData = rev?.data?.data || [];
      const bookingsData = bk?.data?.data || [];
      const categoriesData = cat?.data?.data?.slice(0, 6) || [];
      if (!overviewData) throw new Error('No overview data received');
      setData({
        overview: overviewData,
        revenue: ensureIterable(revenueData),
        bookings: ensureIterable(bookingsData),
        categories: ensureIterable(categoriesData),
      });
      await loadTopPerformers();
    } catch (err) {
      setError(t('admin.errors.loadFailed'));
    }
  };
  useEffect(() => {
    load(timeRange).finally(() => setLoading(false));
  }, []);
  const refresh = async () => {
    setRefreshing(true);
    await load(timeRange);
    setRefreshing(false);
  };
  const changeRange = async (m) => {
    setTimeRange(m);
    setRefreshing(true);
    await load(m);
    setRefreshing(false);
  };
  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="skeleton h-8 w-64 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="card p-8 text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-[var(--text)] mb-2">{t('admin.errors.title')}</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">{error}</p>
          <button onClick={refresh} className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600">
            {t('admin.errors.retry')}
          </button>
        </div>
      </div>
    );
  }
  if (!data || !data.overview) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="card p-8 text-center">
          <p className="text-[var(--text-secondary)]">{t('admin.errors.noData')}</p>
        </div>
      </div>
    );
  }
  const ov = data.overview;
  const rev = ov.revenue || { total_revenue: 0, revenue_this_month: 0, revenue_last_month: 0 };
  const bk = ov.bookings || { total: 0, confirmed: 0, pending: 0, completed: 0, cancelled: 0 };
  const users = ov.users || { total: 0, owners: 0, customers: 0, new_this_month: 0 };
  const equipment = ov.equipment || { total: 0, active: 0, pending_approval: 0, inactive: 0 };
  const revGrowth = rev.revenue_last_month > 0
    ? (((rev.revenue_this_month - rev.revenue_last_month) / rev.revenue_last_month) * 100).toFixed(1)
    : 0;
  const statusData = [
    { name: t('admin.status.completed'), value: bk.completed || 0, color: '#10b981' },
    { name: t('admin.status.confirmed'), value: bk.confirmed || 0, color: '#3b82f6' },
    { name: t('admin.status.pending'), value: bk.pending || 0, color: '#f59e0b' },
    { name: t('admin.status.cancelled'), value: bk.cancelled || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? t('admin.greeting.morning') : hour < 17 ? t('admin.greeting.afternoon') : t('admin.greeting.evening');
  // Calculate total admin profit (sum of all profits from completed bookings)
  const totalAdminProfit = topBookings.reduce((sum, b) => sum + (b.real_admin_profit || 0), 0);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block" />
            <span className="text-xs font-semibold text-green-500 tracking-wider uppercase">{t('admin.header.live')}</span>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]" style={{ fontFamily: 'Syne,sans-serif' }}>
            {greeting}, {user?.name?.split(' ')[0] || 'Admin'} 👋
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {format(new Date(), 'EEEE, MMMM do yyyy')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={e => changeRange(Number(e.target.value))}
            className="input-field text-sm py-2 w-auto"
          >
            {[3, 6, 12].map(m => (
              <option key={m} value={m}>{t('admin.timeRange.lastMonths', { months: m })}</option>
            ))}
          </select>
          <button
            onClick={refresh}
            disabled={refreshing}
            className={`p-2.5 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:border-brand-500 hover:text-brand-500 transition-all ${refreshing ? 'animate-spin' : ''}`}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      {/* Alert for pending submissions */}
      {(ov.pending_submissions || 0) > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              {t('admin.pendingSubmissions.message', { count: ov.pending_submissions })}
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500">{t('admin.pendingSubmissions.description')}</p>
          </div>
          <Link to="/admin/submissions" className="shrink-0 px-4 py-2 rounded-xl bg-amber-500 text-white text-xs font-bold hover:bg-amber-600">
            {t('admin.pendingSubmissions.review')} →
          </Link>
        </div>
      )}
      {/* KPI Row - UPDATED with Admin Profit */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4 bg-gradient-to-br from-brand-500 to-brand-700 border-brand-500 text-white relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-20 h-20 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-white/70 uppercase tracking-wide">Admin Profit</p>
              <DollarSign className="w-4 h-4 text-white/60" />
            </div>
            <p className="text-xl font-bold leading-none">ETB {(totalAdminProfit / 1000000).toFixed(2)}M</p>
            <div className="flex items-center gap-1 mt-2 text-xs">
              <span className="text-white/40">Platform commission replaced</span>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">{t('admin.kpi.thisMonth')}</p>
            <div className="w-7 h-7 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-[var(--text)]">ETB {(rev.revenue_this_month / 1000).toFixed(0)}k</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{t('admin.kpi.customerPaid')}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">{t('admin.kpi.totalUsers')}</p>
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-[var(--text)]">{users.total.toLocaleString()}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">+{users.new_this_month} {t('admin.kpi.thisMonth')}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">{t('admin.kpi.activeListings')}</p>
            <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600">
              <Wrench className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-[var(--text)]">{equipment.active}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{equipment.pending_approval} {t('admin.kpi.pending')}</p>
        </div>
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase">{t('admin.kpi.totalBookings')}</p>
            <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
              <CalendarCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-xl font-bold text-[var(--text)]">{bk.total.toLocaleString()}</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">{bk.completed} {t('admin.kpi.completed')}</p>
        </div>
      </div>
      {/* Admin Profit Chart - NEW */}
      {adminProfitData.length > 0 && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Admin Profit Analytics</h2>
              <p className="text-xs text-[var(--text-muted)]">Monthly profit from price differences (Customer price - Owner price)</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={adminProfitData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="profit" name="Admin Profit" fill="#f97316" radius={[6, 6, 0, 0]} />
              <Bar dataKey="ownerEarns" name="Owner Earns" fill="#10b981" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
      {/* Booking Status Mini Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'pending', val: bk.pending, icon: Clock, color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { key: 'confirmed', val: bk.confirmed, icon: CheckCircle2, color: '#3b82f6', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { key: 'completed', val: bk.completed, icon: Award, color: '#10b981', bg: 'bg-green-50 dark:bg-green-900/20' },
          { key: 'cancelled', val: bk.cancelled, icon: XCircle, color: '#ef4444', bg: 'bg-red-50 dark:bg-red-900/20' },
        ].map(({ key, val, icon: Icon, color, bg }) => (
          <div key={key} className={`rounded-xl p-3 flex items-center gap-2 border border-[var(--border)] ${bg}`}>
            <Icon className="w-8 h-8 shrink-0" style={{ color }} />
            <div>
              <p className="text-xs text-[var(--text-secondary)]">{t(`admin.status.${key}`)}</p>
              <p className="text-lg font-bold text-[var(--text)]">{val.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Chart Row */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">Customer Revenue</h2>
              <p className="text-xs text-[var(--text-muted)]">Total amount paid by customers</p>
            </div>
          </div>
          {data.revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={data.revenue}>
                <defs>
                  <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Customer Paid" stroke="#f97316" strokeWidth={2.5} fill="url(#revG)" dot={{ fill: '#f97316', r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-[var(--text-muted)]">{t('admin.errors.noRevenueData')}</div>
          )}
        </div>
        <div className="card p-5">
          <h2 className="section-title mb-1">{t('admin.charts.bookingStatus')}</h2>
          <p className="text-xs text-[var(--text-muted)] mb-3">{t('admin.charts.allTimeDistribution')}</p>
          {statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={46} outerRadius={68} paddingAngle={3} dataKey="value">
                    {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {statusData.map(d => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                      <span className="text-[var(--text-secondary)]">{d.name}</span>
                    </div>
                    <span className="font-bold text-[var(--text)]">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-[var(--text-muted)]">{t('admin.errors.noData')}</div>
          )}
        </div>
      </div>
      {/* Top Performers Section */}
      <div className="grid lg:grid-cols-4 gap-5">
        {/* Top Bookings */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-brand-500" /> {t('admin.topPerformers.topBookings')}
            </h3>
            <Link to="/admin/bookings" className="text-xs text-brand-500 hover:text-brand-600">{t('admin.topPerformers.viewAll')}</Link>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {topBookings.map((b, i) => (
              <div key={b.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-5 text-xs font-bold text-brand-500 shrink-0">#{i+1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--text)] truncate">{b.equipment_name || 'Unknown'}</p>
                    <p className="text-[10px] text-[var(--text-muted)] truncate">{b.booking_ref}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-brand-500">ETB {Number(b.real_admin_revenue || b.total_amount || 0).toLocaleString()}</span>
                  <p className="text-[9px] text-green-500">Profit: ETB {Number(b.real_admin_profit || 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {topBookings.length === 0 && <p className="text-xs text-[var(--text-muted)] text-center py-4">{t('admin.topPerformers.noData')}</p>}
          </div>
        </div>
        {/* Top Customers */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-500" /> {t('admin.topPerformers.topCustomers')}
            </h3>
            <Link to="/admin/customers" className="text-xs text-brand-500 hover:text-brand-600">{t('admin.topPerformers.viewAll')}</Link>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {topCustomers.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-5 text-xs font-bold text-blue-500 shrink-0">#{i+1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--text)] truncate">{c.name || 'Unknown'}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{c.bookings_count || 0} {t('admin.topPerformers.bookings')}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-500 shrink-0 ml-2">ETB {Number(c.total_spent || 0).toLocaleString()}</span>
              </div>
            ))}
            {topCustomers.length === 0 && <p className="text-xs text-[var(--text-muted)] text-center py-4">{t('admin.topPerformers.noData')}</p>}
          </div>
        </div>
        {/* Top Owners */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Award className="w-4 h-4 text-purple-500" /> {t('admin.topPerformers.topOwners')}
            </h3>
            <Link to="/admin/owners" className="text-xs text-brand-500 hover:text-brand-600">{t('admin.topPerformers.viewAll')}</Link>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {topOwners.map((o, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-5 text-xs font-bold text-purple-500 shrink-0">#{i+1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--text)] truncate">{o.name || 'Unknown'}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{o.bookings_count || 0} {t('admin.topPerformers.rentals')}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-purple-500 shrink-0 ml-2">ETB {Number(o.revenue || 0).toLocaleString()}</span>
              </div>
            ))}
            {topOwners.length === 0 && <p className="text-xs text-[var(--text-muted)] text-center py-4">{t('admin.topPerformers.noData')}</p>}
          </div>
        </div>
        {/* Top Equipment */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
              <Package className="w-4 h-4 text-green-500" /> {t('admin.topPerformers.topEquipment')}
            </h3>
            <Link to="/admin/equipment" className="text-xs text-brand-500 hover:text-brand-600">{t('admin.topPerformers.viewAll')}</Link>
          </div>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {topEquipment.map((e, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--bg-secondary)]">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="w-5 text-xs font-bold text-green-500 shrink-0">#{i+1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[var(--text)] truncate">{e.name || 'Unknown'}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">{e.booking_count || 0} {t('admin.topPerformers.rentals')}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-green-500 shrink-0 ml-2">ETB {Number(e.total_revenue || 0).toLocaleString()}</span>
              </div>
            ))}
            {topEquipment.length === 0 && <p className="text-xs text-[var(--text-muted)] text-center py-4">{t('admin.topPerformers.noData')}</p>}
          </div>
        </div>
      </div>
      {/* Bottom Row */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent Activity */}
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="section-title">{t('admin.recentActivity.title')}</h2>
            <Link to="/admin/bookings" className="text-xs text-brand-500 hover:text-brand-600">{t('admin.recentActivity.viewAll')}</Link>
          </div>
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="w-8 h-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center shrink-0">
                  {activity.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                  {activity.status === 'confirmed' && <CheckCircle2 className="w-4 h-4 text-blue-500" />}
                  {activity.status === 'pending' && <Clock className="w-4 h-4 text-amber-500" />}
                  {activity.status === 'cancelled' && <XCircle className="w-4 h-4 text-red-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text)]">
                    {t('admin.recentActivity.booking')} <span className="font-mono text-xs">{activity.booking_ref}</span>
                  </p>
                  <p className="text-xs text-[var(--text-muted)] truncate">
                    {activity.equipment_name || 'Unknown'} · {activity.customer_name || 'Unknown'} · ETB {Number(activity.real_admin_revenue || activity.total_amount || 0).toLocaleString()}
                  </p>
                  {activity.real_admin_profit > 0 && (
                    <p className="text-[10px] text-green-500">Admin Profit: ETB {Number(activity.real_admin_profit).toLocaleString()}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <StatusBadge status={activity.status} />
                  <p className="text-[10px] text-[var(--text-muted)] mt-1">
                    {activity.created_at ? format(new Date(activity.created_at), 'dd MMM, h:mm a') : ''}
                  </p>
                </div>
              </div>
            ))}
            {recentActivity.length === 0 && (
              <div className="text-center py-8 text-[var(--text-muted)]">{t('admin.recentActivity.noActivity')}</div>
            )}
          </div>
        </div>
        {/* Quick Actions & Platform Health */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="section-title mb-3">{t('admin.quickActions.title')}</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/admin/submissions', icon: ClipboardList, label: t('admin.quickActions.submissions'), badge: ov.pending_submissions || 0 },
                { to: '/admin/bookings', icon: CalendarCheck, label: t('admin.quickActions.bookings'), badge: bk.pending },
                { to: '/admin/owners', icon: Users, label: t('admin.quickActions.owners') },
                { to: '/admin/customers', icon: UserCheck, label: t('admin.quickActions.customers') },
                { to: '/admin/equipment', icon: Wrench, label: t('admin.quickActions.equipment') },
                { to: '/admin/reports', icon: BarChart2, label: t('admin.quickActions.reports') },
              ].map(({ to, icon: Icon, label, badge }) => (
                <Link
                  key={to}
                  to={to}
                  className="flex items-center justify-between p-2.5 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-medium text-[var(--text)] group-hover:text-brand-500">{label}</span>
                  </div>
                  {badge > 0 && (
                    <span className="w-5 h-5 rounded-full bg-brand-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
          <div className="card p-5">
            <h2 className="section-title mb-3">{t('admin.platformHealth.title')}</h2>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--text-secondary)]">{t('admin.platformHealth.activeEquipment')}</span>
                  <span className="font-bold text-[var(--text)]">{equipment.total ? Math.round((equipment.active / equipment.total) * 100) : 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                  <div className="h-full rounded-full bg-green-500" style={{ width: `${equipment.total ? (equipment.active / equipment.total) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--text-secondary)]">{t('admin.platformHealth.bookingSuccess')}</span>
                  <span className="font-bold text-[var(--text)]">{bk.total ? Math.round((bk.completed / bk.total) * 100) : 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                  <div className="h-full rounded-full bg-blue-500" style={{ width: `${bk.total ? (bk.completed / bk.total) * 100 : 0}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[var(--text-secondary)]">{t('admin.platformHealth.ownerVerification')}</span>
                  <span className="font-bold text-[var(--text)]">{users.owners ? Math.round((ov.verified_owners || 0) / users.owners * 100) : 0}%</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                  <div className="h-full rounded-full bg-purple-500" style={{ width: `${users.owners ? (ov.verified_owners || 0) / users.owners * 100 : 0}%` }} />
                </div>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-[var(--border)] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)]">{t('admin.platformHealth.systemStatus')}</span>
                <span className="badge badge-success">{t('admin.platformHealth.operational')}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)]">Revenue Model</span>
                <span className="text-sm font-bold text-brand-500">Price Difference</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[var(--text-secondary)]">{t('admin.platformHealth.activeTimeSlots')}</span>
                <span className="text-sm font-bold text-[var(--text)]">{ov.active_time_slots || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}