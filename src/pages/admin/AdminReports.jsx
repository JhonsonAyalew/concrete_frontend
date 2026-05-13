import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { reportService } from '../../services';
import { StatCard, PageLoader, Card, Button } from '../../components/ui';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Legend
} from 'recharts';
import { 
  DollarSign, TrendingUp, CalendarCheck, Wrench, 
  Download, FileText, FileSpreadsheet, Printer, 
  Calendar, ChevronDown, Eye, Clock, Users, 
  ShoppingBag, Award, Activity, Zap, Shield,
  ArrowUpRight, ArrowDownRight, Filter, RefreshCw,
  PieChart as PieChartIcon, BarChart2, LineChart as LineChartIcon,
  Package, UserCheck, Star, ThumbsUp, AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
const COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
const CustomTooltip = ({ active, payload, label, valuePrefix = '', valueSuffix = '' }) => {
  const { t } = useTranslation();
  if (!active || !payload?.length) return null;
  return (
    <div className="card px-3 py-2 shadow-lg text-xs border border-[var(--border)] min-w-[140px]">
      <p className="font-bold text-[var(--text)] mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex justify-between gap-4 mb-1">
          <span style={{ color: p.color }}>{p.name}:</span>
          <span className="font-semibold text-[var(--text)]">
            {valuePrefix}{p.value?.toLocaleString()}{valueSuffix}
          </span>
        </div>
      ))}
    </div>
  );
};
export default function AdminReports() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(6);
  const [chartView, setChartView] = useState('revenue');
  const [isExporting, setIsExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const reportRef = useRef();
  useEffect(() => {
    loadReports();
  }, [months]);
  const loadReports = async () => {
    setLoading(true);
    try {
      const [ov, rev, bk, cat] = await Promise.all([
        reportService.overview(),
        reportService.revenue(months),
        reportService.bookings(months),
        reportService.categories(),
      ]);
      setOverview(ov?.data?.data || null);
      const revenueData = rev?.data?.data;
      setRevenue(Array.isArray(revenueData) ? revenueData : []);
      const bookingsData = bk?.data?.data;
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      const categoriesData = cat?.data?.data;
      setCategories(Array.isArray(categoriesData) ? categoriesData.slice(0, 6) : []);
    } catch (error) {
      toast.error(t('adminReports.errors.loadFailed'));
      setRevenue([]);
      setBookings([]);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };
  const exportToCSV = () => {
    setIsExporting(true);
    try {
      const csvRows = [];
      csvRows.push(`"${t('adminReports.export.title', { date: format(new Date(), 'yyyy-MM-dd HH:mm:ss') })}"`);
      csvRows.push('');
      if (overview) {
        const rev = overview.revenue || {};
        const bk = overview.bookings || {};
        const users = overview.users || {};
        const equip = overview.equipment || {};
        csvRows.push(t('adminReports.export.sections.overview'));
        csvRows.push(t('adminReports.export.headers.metric') + ',' + t('adminReports.export.headers.value'));
        csvRows.push(`${t('adminReports.export.metrics.totalRevenue')},ETB ${(rev.total_revenue || 0).toLocaleString()}`);
        csvRows.push(`${t('adminReports.export.metrics.monthlyRevenue')},ETB ${(rev.revenue_this_month || 0).toLocaleString()}`);
        csvRows.push(`${t('adminReports.export.metrics.totalBookings')},${bk.total || 0}`);
        csvRows.push(`${t('adminReports.export.metrics.completedBookings')},${bk.completed || 0}`);
        csvRows.push(`${t('adminReports.export.metrics.pendingBookings')},${bk.pending || 0}`);
        csvRows.push(`${t('adminReports.export.metrics.cancelledBookings')},${bk.cancelled || 0}`);
        csvRows.push(`${t('adminReports.export.metrics.totalUsers')},${users.total || 0}`);
        csvRows.push(`${t('adminReports.export.metrics.customers')},${users.customers || 0}`);
        csvRows.push(`${t('adminReports.export.metrics.owners')},${users.owners || 0}`);
        csvRows.push(`${t('adminReports.export.metrics.activeEquipment')},${equip.active || 0}`);
        csvRows.push(`${t('adminReports.export.metrics.totalEquipment')},${equip.total || 0}`);
        csvRows.push(`${t('adminReports.export.metrics.averageRating')},${overview.avg_rating || 0}`);
        csvRows.push('');
      }
      if (revenue.length > 0) {
        csvRows.push(t('adminReports.export.sections.revenueTrend'));
        csvRows.push(`${t('adminReports.export.headers.month')},${t('adminReports.export.headers.revenue')} (ETB)`);
        revenue.forEach(r => {
          csvRows.push(`${r.month || ''},${r.revenue || 0}`);
        });
        csvRows.push('');
      }
      if (bookings.length > 0) {
        csvRows.push(t('adminReports.export.sections.bookingTrend'));
        csvRows.push(`${t('adminReports.export.headers.month')},${t('adminReports.export.headers.totalBookings')},${t('adminReports.export.headers.completed')},${t('adminReports.export.headers.cancelled')},${t('adminReports.export.headers.pending')}`);
        bookings.forEach(b => {
          csvRows.push(`${b.month || ''},${b.bookings || 0},${b.completed || 0},${b.cancelled || 0},${b.pending || 0}`);
        });
        csvRows.push('');
      }
      if (categories.length > 0) {
        csvRows.push(t('adminReports.export.sections.categoryPerformance'));
        csvRows.push(`${t('adminReports.export.headers.category')},${t('adminReports.export.headers.equipmentCount')},${t('adminReports.export.headers.revenue')} (ETB)`);
        categories.forEach(c => {
          csvRows.push(`${c.name || ''},${c.count || 0},${c.revenue || 0}`);
        });
      }
      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.setAttribute('download', `admin_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success(t('adminReports.export.csvSuccess'));
    } catch (error) {
      toast.error(t('adminReports.export.exportFailed', { error: error.message }));
    }
    setIsExporting(false);
  };
  const exportToPDF = () => {
    setIsExporting(true);
    try {
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${t('adminReports.export.pdfTitle', { date: format(new Date(), 'yyyy-MM-dd') })}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #f97316; text-align: center; }
            h2 { color: #333; border-bottom: 2px solid #f97316; padding-bottom: 5px; margin-top: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f97316; color: white; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <h1>${t('adminReports.export.pdfHeader')}</h1>
          <p style="text-align: center;">${t('adminReports.export.generatedOn', { date: format(new Date(), 'MMMM dd, yyyy HH:mm:ss') })}</p>
          <h2>${t('adminReports.export.sections.overview')}</h2>
          <table border="1">
            <tr><th>${t('adminReports.export.headers.metric')}</th><th>${t('adminReports.export.headers.value')}</th></tr>
            <tr><td>${t('adminReports.export.metrics.totalRevenue')}</td><td>ETB ${(overview?.revenue?.total_revenue || 0).toLocaleString()}</td></tr>
            <tr><td>${t('adminReports.export.metrics.totalBookings')}</td><td>${overview?.bookings?.total || 0}</td></tr>
          </table>
          <div class="footer">
            <p>${t('adminReports.export.footer')}</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = () => printWindow.close();
      toast.success(t('adminReports.export.pdfSuccess'));
    } catch (error) {
      toast.error(t('adminReports.export.exportFailed', { error: error.message }));
    }
    setIsExporting(false);
  };
  const printReport = () => {
    window.print();
  };
  if (loading) return <PageLoader />;
  const ov = overview || {};
  const rev = ov.revenue || { total_revenue: 0, revenue_this_month: 0, revenue_last_month: 0 };
  const bk = ov.bookings || { total: 0, completed: 0, pending: 0, cancelled: 0 };
  const users = ov.users || { total: 0, owners: 0, customers: 0, new_this_month: 0 };
  const equipment = ov.equipment || { total: 0, active: 0, pending_approval: 0, inactive: 0 };
  const revGrowth = rev.revenue_last_month > 0
    ? (((rev.revenue_this_month - rev.revenue_last_month) / rev.revenue_last_month) * 100).toFixed(1)
    : 0;
  const isUp = revGrowth >= 0;
  const completionRate = bk.total > 0 ? ((bk.completed / bk.total) * 100).toFixed(1) : 0;
  const statusData = [
    { name: t('adminReports.status.completed'), value: bk.completed, color: '#10b981' },
    { name: t('adminReports.status.pending'), value: bk.pending, color: '#f59e0b' },
    { name: t('adminReports.status.cancelled'), value: bk.cancelled, color: '#ef4444' },
  ].filter(item => item.value > 0);
  const safeRevenue = Array.isArray(revenue) ? revenue : [];
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  return (
    <div className="space-y-6" ref={reportRef}>
      {/* Header with Export Options */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text)]" style={{ fontFamily: 'Syne,sans-serif' }}>
            {t('adminReports.header.title')}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {t('adminReports.header.subtitle')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text)] hover:border-brand-500 hover:text-brand-500 transition-all flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              {t('adminReports.filters.title')}
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            {showFilters && (
              <div className="absolute top-full right-0 mt-2 w-64 card p-4 z-10 shadow-xl">
                <label className="text-xs font-semibold text-[var(--text-muted)] mb-2 block">
                  {t('adminReports.filters.timeRange')}
                </label>
                <select
                  value={months}
                  onChange={e => setMonths(Number(e.target.value))}
                  className="input-field text-sm w-full"
                >
                  <option value={3}>{t('adminReports.filters.last3Months')}</option>
                  <option value={6}>{t('adminReports.filters.last6Months')}</option>
                  <option value={12}>{t('adminReports.filters.last12Months')}</option>
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={exportToCSV} disabled={isExporting} className="px-4 py-2 rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-all flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              {t('adminReports.export.csv')}
            </button>
            <button onClick={exportToPDF} disabled={isExporting} className="px-4 py-2 rounded-xl border border-brand-500 text-brand-500 hover:bg-brand-500/10 transition-all flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {t('adminReports.export.pdf')}
            </button>
            <button onClick={printReport} className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--text)] hover:border-brand-500 hover:text-brand-500 transition-all flex items-center gap-2">
              <Printer className="w-4 h-4" />
              {t('adminReports.export.print')}
            </button>
          </div>
        </div>
      </div>
      {/* Chart Type Selector */}
      <div className="flex gap-2 p-1 rounded-xl bg-[var(--bg-secondary)] w-fit">
        {[
          { id: 'revenue', icon: BarChart2, label: t('adminReports.chartTypes.revenue') },
          { id: 'bookings', icon: LineChartIcon, label: t('adminReports.chartTypes.bookings') },
          { id: 'categories', icon: PieChartIcon, label: t('adminReports.chartTypes.categories') }
        ].map(type => (
          <button
            key={type.id}
            onClick={() => setChartView(type.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              chartView === type.id 
                ? 'bg-[var(--bg-card)] text-brand-500 shadow-sm' 
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
          >
            <type.icon className="w-4 h-4" />
            {type.label}
          </button>
        ))}
      </div>
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="card p-4 bg-gradient-to-br from-brand-500 to-brand-700 text-white relative overflow-hidden">
          <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
          <div className="relative">
            <DollarSign className="w-5 h-5 text-white/70 mb-2" />
            <p className="text-xs font-semibold text-white/70 uppercase">{t('adminReports.kpi.totalRevenue')}</p>
            <p className="text-2xl font-bold">ETB {(rev.total_revenue / 1000).toFixed(1)}K</p>
            <div className="flex items-center gap-1 mt-1">
              {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span className="text-xs font-bold">{Math.abs(revGrowth)}%</span>
            </div>
          </div>
        </div>
        <StatCard 
          title={t('adminReports.kpi.monthlyRevenue')} 
          value={rev.revenue_this_month} 
          prefix="ETB " 
          icon={TrendingUp} 
          color="green" 
        />
        <StatCard 
          title={t('adminReports.kpi.totalBookings')} 
          value={bk.total} 
          icon={CalendarCheck} 
          color="blue" 
        />
        <StatCard 
          title={t('adminReports.kpi.completionRate')} 
          value={completionRate} 
          suffix="%" 
          icon={Award} 
          color="emerald" 
        />
        <StatCard 
          title={t('adminReports.kpi.activeEquipment')} 
          value={equipment.active} 
          icon={Wrench} 
          color="purple" 
        />
      </div>
      {/* Secondary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-3 text-center">
          <Users className="w-4 h-4 text-brand-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-[var(--text)]">{users.total}</p>
          <p className="text-xs text-[var(--text-muted)]">{t('adminReports.metrics.totalUsers')}</p>
        </div>
        <div className="card p-3 text-center">
          <UserCheck className="w-4 h-4 text-green-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-[var(--text)]">{bk.completed}</p>
          <p className="text-xs text-[var(--text-muted)]">{t('adminReports.metrics.completedBookings')}</p>
        </div>
        <div className="card p-3 text-center">
          <Package className="w-4 h-4 text-blue-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-[var(--text)]">{equipment.total}</p>
          <p className="text-xs text-[var(--text-muted)]">{t('adminReports.metrics.totalEquipment')}</p>
        </div>
        <div className="card p-3 text-center">
          <Star className="w-4 h-4 text-yellow-500 mx-auto mb-1" />
          <p className="text-lg font-bold text-[var(--text)]">{ov.avg_rating || 0}</p>
          <p className="text-xs text-[var(--text-muted)]">{t('adminReports.metrics.avgRating')}</p>
        </div>
      </div>
      {/* Main Charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Revenue Chart */}
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="section-title">{t('adminReports.charts.revenueAnalytics')}</h2>
              <p className="text-xs text-[var(--text-muted)]">{t('adminReports.charts.monthlyRevenueTrend')}</p>
            </div>
          </div>
          {safeRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={safeRevenue}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip valuePrefix="ETB " />} />
                <Area type="monotone" dataKey="revenue" name={t('adminReports.charts.revenue')} stroke="#f97316" strokeWidth={2.5} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-[var(--text-muted)]">
              {t('adminReports.errors.noRevenueData')}
            </div>
          )}
        </div>
        {/* Booking Status Pie */}
        <div className="card p-5">
          <h2 className="section-title mb-1">{t('adminReports.charts.bookingDistribution')}</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">{t('adminReports.charts.statusBreakdown')}</p>
          {statusData.length > 0 ? (
            <>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {statusData.map((d, i) => (
                        <Cell key={i} fill={d.color} stroke="var(--bg-card)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                {statusData.map(d => (
                  <div key={d.name} className="flex items-center gap-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                    <span className="text-xs text-[var(--text-secondary)]">{d.name}</span>
                    <span className="text-xs font-bold text-[var(--text)]">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-[var(--text-muted)]">
              {t('adminReports.errors.noBookingData')}
            </div>
          )}
        </div>
      </div>
      {/* Second Row Charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Booking Trend */}
        <div className="card p-5">
          <h2 className="section-title mb-1">{t('adminReports.charts.bookingTrend')}</h2>
          <p className="text-xs text-[var(--text-muted)] mb-4">{t('adminReports.charts.monthlyPerformance')}</p>
          {safeBookings.length > 0 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={safeBookings}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="bookings" name={t('adminReports.charts.totalBookings')} stroke="#f97316" strokeWidth={2.5} dot={{ fill: '#f97316', r: 4 }} />
                <Line type="monotone" dataKey="completed" name={t('adminReports.charts.completed')} stroke="#10b981" strokeWidth={2} />
                <Line type="monotone" dataKey="cancelled" name={t('adminReports.charts.cancelled')} stroke="#ef4444" strokeWidth={1.5} />
                <Line type="monotone" dataKey="pending" name={t('adminReports.charts.pending')} stroke="#f59e0b" strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[260px] text-[var(--text-muted)]">
              {t('adminReports.errors.noBookingData')}
            </div>
          )}
        </div>
        {/* Category Performance */}
        <div className="card p-5">
          <h2 className="section-title mb-4">{t('adminReports.charts.categoryPerformance')}</h2>
          {categories.length > 0 ? (
            <div className="space-y-4">
              {categories.map((cat, i) => {
                const maxCount = Math.max(...categories.map(c => c.count || 0));
                const percentage = maxCount > 0 ? ((cat.count || 0) / maxCount) * 100 : 0;
                return (
                  <div key={cat.name || i}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="font-medium text-[var(--text)]">{cat.name || ''}</span>
                        <span className="text-xs text-[var(--text-muted)]">{cat.count || 0} {t('adminReports.units')}</span>
                      </div>
                      <span className="text-xs font-bold text-[var(--text)]">
                        ETB {((cat.revenue || 0) / 1000).toFixed(0)}k
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          background: COLORS[i % COLORS.length]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[150px] text-[var(--text-muted)]">
              {t('adminReports.errors.noCategoryData')}
            </div>
          )}
        </div>
      </div>
      {/* Health Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">{t('adminReports.health.totalRevenue')}</p>
            <p className="text-lg font-bold text-[var(--text)]">ETB {(rev.total_revenue / 1000).toFixed(0)}K</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <CalendarCheck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">{t('adminReports.health.completedBookings')}</p>
            <p className="text-lg font-bold text-[var(--text)]">{bk.completed}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">{t('adminReports.health.activeUsers')}</p>
            <p className="text-lg font-bold text-[var(--text)]">{users.total}</p>
          </div>
        </div>
      </div>
      {/* Footer Note */}
      <div className="text-center text-xs text-[var(--text-muted)] pt-4 border-t border-[var(--border)] print:mt-4">
        <p>{t('adminReports.footer.generatedOn', { date: format(new Date(), 'MMMM dd, yyyy HH:mm:ss') })}</p>
        <p className="mt-1">* {t('adminReports.footer.disclaimer')}</p>
      </div>
    </div>
  );
}