import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { bookingService } from '../../services';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, PageLoader } from '../../components/ui';
import { Search, CalendarCheck, Clock, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
export default function CustomerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    bookingService.getMy()
      .then(r => setBookings(r.data.data || []))
      .catch(() => setBookings([]))
      .finally(() => setLoading(false));
  }, []);
  const counts = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  };
  if (loading) return <PageLoader />;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text)]" style={{ fontFamily: 'Syne,sans-serif' }}>
          {t('customerDashboard.welcome', { name: user?.name?.split(' ')[0] })} 👋
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-0.5">
          {t('customerDashboard.subtitle')}
        </p>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { key: 'totalBookings', val: counts.total, icon: CalendarCheck, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
          { key: 'pending', val: counts.pending, icon: Clock, color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' },
          { key: 'confirmed', val: counts.confirmed, icon: CheckCircle2, color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' },
          { key: 'completed', val: counts.completed, icon: CheckCircle2, color: 'bg-brand-100 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400' },
        ].map(({ key, val, icon: Icon, color }) => (
          <div key={key} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)]" style={{ fontFamily: 'Syne,sans-serif' }}>
                {t(`customerDashboard.stats.${key}`)}
              </p>
              <p className="text-2xl font-bold text-[var(--text)]" style={{ fontFamily: 'Syne,sans-serif' }}>{val}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Search CTA */}
      <div className="card p-6 bg-gradient-to-r from-brand-500 to-brand-600 border-brand-500 text-white">
        <h2 className="text-xl font-bold mb-2" style={{ fontFamily: 'Syne,sans-serif' }}>
          {t('customerDashboard.findEquipment.title')}
        </h2>
        <p className="text-white/80 text-sm mb-4">
          {t('customerDashboard.findEquipment.description')}
        </p>
        <Link 
          to="/equipment" 
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-brand-600 font-semibold text-sm hover:bg-brand-50 transition-colors" 
          style={{ fontFamily: 'Syne,sans-serif' }}
        >
          <Search className="w-4 h-4" /> {t('customerDashboard.findEquipment.button')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      {/* Recent bookings */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h2 className="section-title">{t('customerDashboard.recentBookings.title')}</h2>
          <Link to="/customer/bookings" className="text-sm text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
            {t('customerDashboard.recentBookings.viewAll')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {bookings.length === 0 ? (
          <div className="py-12 text-center">
            <CalendarCheck className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-30" />
            <p className="text-sm text-[var(--text-muted)]">{t('customerDashboard.recentBookings.noBookings')}</p>
            <Link to="/equipment" className="btn-primary text-sm px-5 py-2 mt-3 inline-flex">
              {t('customerDashboard.recentBookings.browseButton')}
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {bookings.slice(0, 5).map(b => (
              <div key={b.id} className="flex items-center justify-between p-4 hover:bg-[var(--bg-secondary)] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center shrink-0 text-brand-500">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--text)] truncate">{b.equipment_name}</p>
                    <p className="text-xs text-[var(--text-muted)]">
                      {b.start_date ? format(new Date(b.start_date), 'dd MMM') : ''} – {b.end_date ? format(new Date(b.end_date), 'dd MMM yy') : ''}
                      {' · '}{t('customerDashboard.currency')} {Number(b.total_amount || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={b.status} />
                  <span className="font-mono text-xs text-[var(--text-muted)]">{b.booking_ref}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}