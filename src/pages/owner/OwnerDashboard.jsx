import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ownerAnalyticsService } from '../../services';
import { StatCard, PageLoader } from '../../components/ui';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, CalendarCheck, Wrench, Star, Plus, ClipboardList, ArrowRight, AlertCircle } from 'lucide-react';
export default function OwnerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ovRes, revRes] = await Promise.all([
          ownerAnalyticsService.overview(),
          ownerAnalyticsService.revenue(6),
        ]);
        const overviewData = ovRes?.data?.data || ovRes?.data || {};
        const revenueData = revRes?.data?.data || revRes?.data || [];
        setOverview(overviewData);
        setRevenue(Array.isArray(revenueData) ? revenueData : []);
      } catch (err) {
        setApiError(true);
        setOverview({ 
          stats: { 
            total_earnings: 0, 
            earnings_this_month: 0, 
            total_bookings: 0,
            confirmed_bookings: 0,
            pending_bookings: 0,
            completed_bookings: 0
          }, 
          equipment: { 
            total_equipment: 0, 
            avg_rating: 0 
          } 
        });
        setRevenue([]);
      } finally { setLoading(false); }
    };
    load();
  }, []);
  if (loading) return <PageLoader />;
  const stats = overview?.stats || {};
  const equipment = overview?.equipment || {};
  const activeBookings = (stats.confirmed_bookings || 0) + (stats.pending_bookings || 0);
  // FIX: Get this month's earnings from the revenue chart data
  // This finds the most recent month's earnings (assuming data is chronological)
  const getThisMonthEarnings = () => {
    if (!revenue || revenue.length === 0) return 0;
    // Get the last item (most recent month)
    const lastMonth = revenue[revenue.length - 1];
    // Look for earnings field (could be 'earnings', 'amount', 'revenue', etc.)
    return lastMonth?.earnings || lastMonth?.amount || lastMonth?.revenue || 0;
  };
  const thisMonthEarnings = getThisMonthEarnings();
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]" style={{ fontFamily:'Syne,sans-serif' }}>
            {t('ownerDashboard.welcome', { name: user?.name?.split(' ')[0] })}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5">
            {t('ownerDashboard.subtitle')}
          </p>
        </div>
        <button onClick={() => navigate('/owner/add-equipment')}
          className="btn-primary text-sm px-4 py-2.5 shrink-0 hidden sm:flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('ownerDashboard.addEquipmentButton')}
        </button>
      </div>
      {apiError && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            {t('ownerDashboard.apiError')}
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard 
          title={t('ownerDashboard.stats.totalEarnings')} 
          value={stats?.total_earnings || 0} 
          prefix="ETB " 
          icon={DollarSign} 
          color="orange" 
        />
        <StatCard 
          title={t('ownerDashboard.stats.thisMonth')} 
          value={thisMonthEarnings}  // FIXED: Using chart data instead of API
          prefix="ETB " 
          icon={DollarSign} 
          color="green" 
        />
        <StatCard 
          title={t('ownerDashboard.stats.totalBookings')} 
          value={stats?.total_bookings || 0} 
          icon={CalendarCheck} 
          color="blue" 
        />
        <StatCard 
          title={t('ownerDashboard.stats.activeBookings')} 
          value={activeBookings} 
          icon={CalendarCheck} 
          color="cyan" 
        />
        <StatCard 
          title={t('ownerDashboard.stats.equipmentListed')} 
          value={equipment?.total_equipment || 0} 
          icon={Wrench} 
          color="purple" 
        />
        <StatCard 
          title={t('ownerDashboard.stats.avgRating')} 
          value={Number(equipment?.avg_rating || 0).toFixed(1)} 
          icon={Star} 
          color="orange" 
          suffix="/5" 
        />
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="card p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="section-title">{t('ownerDashboard.monthlyEarnings.title')}</h2>
            <Link to="/owner/analytics" className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
              {t('ownerDashboard.monthlyEarnings.fullReport')} <ArrowRight className="w-3 h-3"/>
            </Link>
          </div>
          {revenue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-44 text-center text-[var(--text-muted)]">
              <div className="text-4xl mb-2 opacity-20">📊</div>
              <p className="text-sm">{t('ownerDashboard.monthlyEarnings.noData')}</p>
              <p className="text-xs mt-1">{t('ownerDashboard.monthlyEarnings.noDataHint')}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize:12, fill:'var(--text-muted)' }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize:11, fill:'var(--text-muted)' }} 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={v=>`${(v/1000).toFixed(0)}k`} 
                />
                <Tooltip 
                  formatter={(v) => [`ETB ${Number(v).toLocaleString()}`, t('ownerDashboard.monthlyEarnings.tooltipEarnings')]} 
                  contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'12px', fontSize:'12px' }} 
                />
                <Bar dataKey="earnings" fill="#f97316" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card p-5">
          <h2 className="section-title mb-4">{t('ownerDashboard.quickActions.title')}</h2>
          <div className="space-y-2.5">
            {[
              { to:'/owner/add-equipment', icon:Plus, key:'addEquipment', cls:'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
              { to:'/owner/my-equipment', icon:Wrench, key:'myEquipment', cls:'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' },
              { to:'/owner/submissions', icon:ClipboardList, key:'mySubmissions', cls:'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
              { to:'/owner/bookings', icon:CalendarCheck, key:'manageBookings', cls:'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
            ].map(({ to, icon:Icon, key, cls }) => (
              <Link key={to} to={to}
                className="flex items-center gap-3 p-3.5 rounded-xl border border-[var(--border)] hover:border-brand-500 transition-all duration-200 hover:-translate-y-0.5 group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cls}`}>
                  <Icon className="w-4 h-4"/>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--text)] group-hover:text-brand-500 transition-colors" style={{ fontFamily:'Syne,sans-serif' }}>
                    {t(`ownerDashboard.quickActions.${key}.label`)}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {t(`ownerDashboard.quickActions.${key}.description`)}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}