import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ownerAnalyticsService } from '../../services';
import { StatCard, PageLoader, SectionHeader } from '../../components/ui';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, CalendarCheck, Star, Wrench, AlertCircle, Download, FileText, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
export default function OwnerAnalytics() {
  const { t } = useTranslation();
  const [overview, setOverview] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [months, setMonths] = useState(6);
  const [apiError, setApiError] = useState(false);
  const chartRef = useRef();
  useEffect(() => {
    setLoading(true);
    setApiError(false);
    Promise.all([
      ownerAnalyticsService.overview(),
      ownerAnalyticsService.revenue(months),
      ownerAnalyticsService.equipment(),
    ])
    .then(([ovRes, revRes, eqRes]) => {
      const overviewData = ovRes?.data?.data || ovRes?.data || {};
      const revenueData = revRes?.data?.data || revRes?.data || [];
      const equipmentData = eqRes?.data?.data || eqRes?.data || [];
      setOverview(overviewData);
      setRevenue(Array.isArray(revenueData) ? revenueData : []);
      setEquipment(Array.isArray(equipmentData) ? equipmentData : []);
    })
    .catch(err => {
      setApiError(true);
      setOverview({ 
        stats: { 
          total_earnings: revenue.reduce((sum, r) => sum + (r.earnings || 0), 0),
          earnings_this_month: revenue[revenue.length - 1]?.earnings || 0,
          total_bookings: revenue.reduce((sum, r) => sum + (r.bookings || 0), 0)
        }, 
        equipment: { avg_rating: 0 } 
      });
      setRevenue([]);
      setEquipment([]);
    })
    .finally(() => setLoading(false));
  }, [months]);
  // Calculate totals from revenue data for accurate display
  const totalEarnings = revenue.reduce((sum, r) => sum + (r.earnings || 0), 0);
  const totalBookings = revenue.reduce((sum, r) => sum + (r.bookings || 0), 0);
  const currentMonthEarnings = revenue[revenue.length - 1]?.earnings || 0;
  // Export to PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    const title = t('ownerAnalytics.title');
    const subtitle = t('ownerAnalytics.subtitle');
    doc.setFontSize(20);
    doc.text(title, 14, 22);
    doc.setFontSize(10);
    doc.text(subtitle, 14, 32);
    // Summary stats
    doc.setFontSize(12);
    doc.text(t('ownerAnalytics.stats.summary'), 14, 45);
    doc.setFontSize(10);
    doc.text(`${t('ownerAnalytics.stats.totalEarnings')}: ETB ${totalEarnings.toLocaleString()}`, 14, 55);
    doc.text(`${t('ownerAnalytics.stats.totalBookings')}: ${totalBookings}`, 14, 62);
    doc.text(`${t('ownerAnalytics.stats.avgRating')}: ${Number(overview?.equipment?.avg_rating || 0).toFixed(1)}/5`, 14, 69);
    // Equipment table
    if (equipment.length > 0) {
      autoTable(doc, {
        startY: 80,
        head: [[
          t('ownerAnalytics.equipmentTable.name'),
          t('ownerAnalytics.equipmentTable.bookings'),
          t('ownerAnalytics.equipmentTable.earnings')
        ]],
        body: equipment.map(eq => [
          eq.name,
          eq.total_bookings || 0,
          `ETB ${(eq.total_earnings || 0).toLocaleString()}`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [249, 115, 22] },
      });
    }
    doc.save(`analytics_${new Date().toISOString().split('T')[0]}.pdf`);
  };
  // Export to CSV
  const exportToCSV = () => {
    // Prepare revenue data
    const revenueData = revenue.map(r => ({
      [t('ownerAnalytics.csv.month')]: r.label,
      [t('ownerAnalytics.csv.revenue')]: r.earnings || 0,
      [t('ownerAnalytics.csv.bookings')]: r.bookings || 0,
    }));
    // Prepare equipment data
    const equipmentData = equipment.map(eq => ({
      [t('ownerAnalytics.csv.equipmentName')]: eq.name,
      [t('ownerAnalytics.csv.totalBookings')]: eq.total_bookings || 0,
      [t('ownerAnalytics.csv.totalEarnings')]: eq.total_earnings || 0,
    }));
    // Combine both datasets
    const combinedData = [
      { '': t('ownerAnalytics.csv.revenueReport') },
      ...revenueData,
      { '': '' },
      { '': t('ownerAnalytics.csv.equipmentReport') },
      ...equipmentData,
    ];
    const ws = XLSX.utils.json_to_sheet(combinedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Analytics');
    XLSX.writeFile(wb, `analytics_${new Date().toISOString().split('T')[0]}.xlsx`);
  };
  if (loading) return <PageLoader />;
  return (
    <div className="space-y-6">
      <SectionHeader 
        title={t('ownerAnalytics.title')} 
        subtitle={t('ownerAnalytics.subtitle')}
        action={
          <div className="flex items-center gap-2">
            {/* Export buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <button 
                onClick={exportToPDF}
                className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs"
                title={t('ownerAnalytics.export.pdf')}
              >
                <FileText className="w-3.5 h-3.5" />
                PDF
              </button>
              <button 
                onClick={exportToCSV}
                className="btn-secondary flex items-center gap-1.5 px-3 py-2 text-xs"
                title={t('ownerAnalytics.export.csv')}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>
            <select 
              value={months} 
              onChange={e => setMonths(Number(e.target.value))} 
              className="input-field w-auto text-sm py-2"
            >
              <option value={3}>{t('ownerAnalytics.period.last3Months')}</option>
              <option value={6}>{t('ownerAnalytics.period.last6Months')}</option>
              <option value={12}>{t('ownerAnalytics.period.last12Months')}</option>
            </select>
          </div>
        }
      />
      {apiError && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">{t('ownerAnalytics.apiError')}</p>
        </div>
      )}
      {/* Stats - FIXED: Now using calculated totals from revenue data */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title={t('ownerAnalytics.stats.totalEarnings')} 
          value={totalEarnings} 
          prefix="ETB " 
          icon={DollarSign} 
          color="orange" 
        />
        <StatCard 
          title={t('ownerAnalytics.stats.thisMonth')} 
          value={currentMonthEarnings} 
          prefix="ETB " 
          icon={DollarSign} 
          color="green" 
        />
        <StatCard 
          title={t('ownerAnalytics.stats.totalBookings')} 
          value={totalBookings} 
          icon={CalendarCheck} 
          color="blue" 
        />
        <StatCard 
          title={t('ownerAnalytics.stats.avgRating')} 
          value={Number(overview?.equipment?.avg_rating || 0).toFixed(1)} 
          icon={Star} 
          color="orange" 
          suffix="/5" 
        />
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        {/* Revenue chart */}
        <div className="card p-5">
          <h2 className="section-title mb-5">{t('ownerAnalytics.revenueTrend')}</h2>
          {revenue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-[var(--text-muted)]">
              <div className="text-4xl mb-2 opacity-20">📈</div>
              <p className="text-sm">{t('ownerAnalytics.noRevenueData')}</p>
              <p className="text-xs mt-1">{t('ownerAnalytics.noRevenueSubtext')}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="label" tick={{ fontSize:12, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`} />
                <Tooltip 
                  formatter={(v) => [`ETB ${Number(v).toLocaleString()}`, t('ownerAnalytics.revenue')]} 
                  contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'12px', fontSize:'12px' }} 
                />
                <Line type="monotone" dataKey="earnings" stroke="#f97316" strokeWidth={2.5} dot={{ fill:'#f97316', r:4 }} activeDot={{ r:6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        {/* Equipment performance */}
        <div className="card p-5">
          <h2 className="section-title mb-5">{t('ownerAnalytics.equipmentPerformance')}</h2>
          {equipment.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-[var(--text-muted)]">
              <Wrench className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">{t('ownerAnalytics.noEquipmentData')}</p>
              <p className="text-xs mt-1">{t('ownerAnalytics.noEquipmentSubtext')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {equipment.map((eq, i) => {
                const maxEarnings = Math.max(...equipment.map(e => e.total_earnings || 0), 1);
                const earnings = eq.total_earnings || 0;
                return (
                  <div key={eq.id || i} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold text-[var(--text)] truncate max-w-[180px]">{eq.name}</span>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-[var(--text-muted)]">
                          {eq.total_bookings || 0} {t('ownerAnalytics.bookings')}
                        </span>
                        <span className="font-bold text-brand-500">
                          ETB {Number(earnings).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--bg-secondary)] overflow-hidden">
                      <div className="h-full rounded-full bg-brand-500 transition-all duration-700"
                        style={{ width: `${(earnings / maxEarnings) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {/* Bookings bar chart */}
      {revenue.length > 0 && (
        <div className="card p-5">
          <h2 className="section-title mb-5">{t('ownerAnalytics.bookingsPerMonth')}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" tick={{ fontSize:12, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip 
                formatter={(v) => [`${v} ${t('ownerAnalytics.bookings')}`, t('ownerAnalytics.bookingsCount')]}
                contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:'12px', fontSize:'12px' }} 
              />
              <Bar dataKey="bookings" fill="#3b82f6" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}