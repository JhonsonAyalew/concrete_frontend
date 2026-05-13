import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { bookingService, userService } from '../../services';
import { ownerEquipmentService } from '../../services';
import { Button, StatusBadge, Tabs, SearchInput, Pagination, SectionHeader } from '../../components/ui';
import {
  Eye, CheckCircle, XCircle, Flag, ArrowLeft, User,
  Phone, Mail, MapPin, Calendar, DollarSign, Wrench,
  Building, Shield, Clock, Star, X, AlertCircle, CreditCard, Truck
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import clsx from 'clsx';
const TABS = [
  { value: '', label: 'all' },
  { value: 'pending', label: 'pending' },
  { value: 'confirmed', label: 'confirmed' },
  { value: 'completed', label: 'completed' },
  { value: 'cancelled', label: 'cancelled' },
];
// Helper function to calculate owner's original price and admin profit
const calculateOwnerPricing = async (equipmentId, pricingMode, startDate, endDate, startTime, endTime, adminTotalAmount) => {
  try {
    const response = await ownerEquipmentService.getAll({ limit: 100 });
    const allOwnerEquipment = response?.data?.data || response?.data || [];
    const ownerEquip = allOwnerEquipment.find(oe => oe.equipment_id === equipmentId);
    if (!ownerEquip) {
      return { ownerPrice: 0, ownerTotal: 0, adminProfit: 0 };
    }
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.max(1, differenceInDays(end, start));
    let ownerUnitPrice = 0;
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
        if (startTime && endTime) {
          const startDateTime = new Date(`2000-01-01T${startTime}`);
          const endDateTime = new Date(`2000-01-01T${endTime}`);
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
    const adminProfit = adminTotalAmount - ownerTotal;
    return {
      ownerPrice: ownerUnitPrice,
      ownerTotal: ownerTotal,
      adminProfit: adminProfit
    };
  } catch (error) {
    return { ownerPrice: 0, ownerTotal: 0, adminProfit: 0 };
  }
};
/* ─── Booking detail mini-page ─────────────────────── */
function BookingDetailView({ booking, onBack, onConfirm, onCancel, onComplete, t }) {
  const [cancelReason, setCancelReason] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [actLoading, setActLoading] = useState(false);
  const [ownerPricing, setOwnerPricing] = useState(null);
  const [loadingPricing, setLoadingPricing] = useState(true);
  useEffect(() => {
    const loadOwnerPricing = async () => {
      setLoadingPricing(true);
      const pricing = await calculateOwnerPricing(
        booking.equipment_id,
        booking.pricing_mode,
        booking.start_date,
        booking.end_date,
        booking.start_time,
        booking.end_time,
        Number(booking.total_amount || 0)
      );
      setOwnerPricing(pricing);
      setLoadingPricing(false);
    };
    loadOwnerPricing();
  }, [booking]);
  const handleConfirm = async () => {
    setActLoading(true);
    try { 
      await onConfirm(booking.id); 
      toast.success(t('adminBookings.toasts.confirmSuccess'));
      onBack(); 
    } catch (e) { 
      toast.error(e.response?.data?.message || t('adminBookings.toasts.confirmFailed')); 
    }
    setActLoading(false);
  };
  const handleCancel = async () => {
    if (!cancelReason.trim()) { 
      toast.error(t('adminBookings.toasts.reasonRequired')); 
      return; 
    }
    setActLoading(true);
    try { 
      await onCancel(booking.id, cancelReason); 
      toast.success(t('adminBookings.toasts.cancelSuccess'));
      onBack(); 
    } catch (e) { 
      toast.error(e.response?.data?.message || t('adminBookings.toasts.cancelFailed')); 
    }
    setActLoading(false);
  };
  const handleComplete = async () => {
    setActLoading(true);
    try { 
      await onComplete(booking.id); 
      toast.success(t('adminBookings.toasts.completeSuccess'));
      onBack(); 
    } catch (e) { 
      toast.error(e.response?.data?.message || t('adminBookings.toasts.completeFailed')); 
    }
    setActLoading(false);
  };
  const canConfirm = booking.status === 'pending';
  const canComplete = booking.status === 'confirmed';
  const canCancel = ['pending', 'confirmed'].includes(booking.status);
  const formatPhoneForLink = (phone) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };
  return (
    <div className="animate-fade-in space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onBack} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-brand-500 transition-colors">
          <ArrowLeft className="w-4 h-4" /> {t('adminBookings.detail.backToList')}
        </button>
        <div className="flex items-center gap-2">
          <StatusBadge status={booking.status} />
          <span className="font-mono text-sm font-bold text-brand-500 bg-brand-50 dark:bg-brand-900/20 px-3 py-1 rounded-lg">
            {booking.booking_ref}
          </span>
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left Column — Booking Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Equipment Info Card */}
          <div className="card p-5">
            <h3 className="section-title mb-3 flex items-center gap-2">
              <Wrench className="w-4 h-4 text-brand-500" />
              {t('adminBookings.detail.equipment')}
            </h3>
            <div className="flex items-center gap-4">
              {booking.equipment_images?.[0] && (
                <img src={booking.equipment_images[0]} alt="" className="w-20 h-16 rounded-xl object-cover shrink-0" />
              )}
              <div>
                <p className="font-bold text-[var(--text)]">{booking.equipment_name}</p>
                <p className="text-sm text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5" />{booking.equipment_city}
                </p>
              </div>
            </div>
          </div>
          {/* Booking Info Grid - UPDATED with Owner Price and Admin Profit */}
          <div className="card p-5">
            <h3 className="section-title mb-3">{t('adminBookings.detail.bookingDetails')}</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                [t('adminBookings.detail.startDate'), booking.start_date ? format(new Date(booking.start_date), 'PPP') : '—'],
                [t('adminBookings.detail.endDate'), booking.end_date ? format(new Date(booking.end_date), 'PPP') : '—'],
                [t('adminBookings.detail.totalDays'), booking.total_days || '—'],
                [t('adminBookings.detail.pricingMode'), booking.pricing_mode || 'daily'],
                [t('adminBookings.detail.unitPrice'), `ETB ${Number(booking.unit_price || 0).toLocaleString()}`],
                ['Owner Price', loadingPricing ? 'Loading...' : `ETB ${(ownerPricing?.ownerPrice || 0).toLocaleString()}`],
                [t('adminBookings.detail.totalAmount'), `ETB ${Number(booking.total_amount || 0).toLocaleString()}`],
                ['Owner Total', loadingPricing ? 'Loading...' : `ETB ${(ownerPricing?.ownerTotal || 0).toLocaleString()}`],
                ['Admin Profit', loadingPricing ? 'Loading...' : `ETB ${(ownerPricing?.adminProfit || 0).toLocaleString()}`],
                [t('adminBookings.detail.deposit'), booking.deposit_amount ? `ETB ${Number(booking.deposit_amount).toLocaleString()}` : '—'],
                [t('adminBookings.detail.timeSlot'), booking.time_slot_name || '—'],
              ].map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <p className="text-xs text-[var(--text-muted)]">{k}</p>
                  <p className={`font-semibold mt-0.5 ${k === 'Admin Profit' ? 'text-green-600 dark:text-green-400' : 'text-[var(--text)]'}`}>
                    {v}
                  </p>
                </div>
              ))}
            </div>
            {booking.notes && (
              <div className="mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-600 mb-1">{t('adminBookings.detail.customerNotes')}</p>
                <p className="text-sm text-blue-700 dark:text-blue-300">{booking.notes}</p>
              </div>
            )}
            {booking.delivery_address && (
              <div className="mt-2 p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-xs text-[var(--text-muted)] mb-1">{t('adminBookings.detail.deliveryAddress')}</p>
                <p className="text-sm flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-brand-500" />{booking.delivery_address}</p>
              </div>
            )}
            {booking.cancellation_reason && (
              <div className="mt-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-xs font-semibold text-red-600 mb-1">{t('adminBookings.detail.cancelReason')}</p>
                <p className="text-sm text-red-700 dark:text-red-400">{booking.cancellation_reason}</p>
              </div>
            )}
          </div>
          {/* Action Buttons */}
          {(canConfirm || canComplete || canCancel) && (
            <div className="card p-4">
              {!cancelOpen ? (
                <div className="flex flex-wrap gap-3">
                  {canConfirm && (
                    <Button onClick={handleConfirm} loading={actLoading} className="flex-1">
                      <CheckCircle className="w-4 h-4" /> {t('adminBookings.detail.confirmButton')}
                    </Button>
                  )}
                  {canComplete && (
                    <Button variant="success" onClick={handleComplete} loading={actLoading} className="flex-1">
                      <Flag className="w-4 h-4" /> {t('adminBookings.detail.completeButton')}
                    </Button>
                  )}
                  {canCancel && (
                    <Button variant="danger" onClick={() => setCancelOpen(true)} className="flex-1">
                      <XCircle className="w-4 h-4" /> {t('adminBookings.detail.cancelButton')}
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea 
                    value={cancelReason} 
                    onChange={e => setCancelReason(e.target.value)} 
                    rows={3}
                    placeholder={t('adminBookings.detail.cancelPlaceholder')} 
                    className="input-field w-full resize-none" 
                  />
                  <div className="flex gap-3">
                    <Button variant="secondary" className="flex-1" onClick={() => setCancelOpen(false)}>
                      {t('common.back')}
                    </Button>
                    <Button variant="danger" className="flex-1" onClick={handleCancel} loading={actLoading}>
                      <XCircle className="w-4 h-4" /> {t('adminBookings.detail.confirmCancel')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Right Column — People Cards */}
        <div className="space-y-4">
          {/* Customer Card - Phone as clickable link */}
          <div className="card p-5">
            <h3 className="section-title mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" />
              {t('adminBookings.detail.customer')}
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                {booking.customer_name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-semibold text-[var(--text)] text-sm">{booking.customer_name || '—'}</p>
                <p className="text-xs text-[var(--text-muted)]">{booking.customer_email}</p>
              </div>
            </div>
            <div className="text-xs text-[var(--text-muted)] flex items-center gap-2 mt-2 pt-2 border-t border-[var(--border)]">
              <Phone className="w-3 h-3" />
              {booking.customer_phone ? (
                <a 
                  href={`tel:${formatPhoneForLink(booking.customer_phone)}`}
                  className="hover:text-brand-500 transition-colors text-[var(--text)]"
                >
                  {booking.customer_phone}
                </a>
              ) : (
                <span>{t('adminBookings.detail.noPhone')}</span>
              )}
            </div>
          </div>
          {/* Owner Card - Phone as clickable link */}
          <div className="card p-5">
            <h3 className="section-title mb-3 flex items-center gap-2">
              <Building className="w-4 h-4 text-orange-500" />
              {t('adminBookings.detail.owner')}
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold shrink-0">
                {booking.owner_name?.charAt(0) || '?'}
              </div>
              <div>
                <p className="font-semibold text-[var(--text)] text-sm">{booking.owner_name || '—'}</p>
                <p className="text-xs text-[var(--text-muted)]">{booking.owner_email}</p>
              </div>
            </div>
            <div className="text-xs text-[var(--text-muted)] flex items-center gap-2 mt-2 pt-2 border-t border-[var(--border)]">
              <Phone className="w-3 h-3" />
              {booking.owner_phone ? (
                <a 
                  href={`tel:${formatPhoneForLink(booking.owner_phone)}`}
                  className="hover:text-brand-500 transition-colors text-[var(--text)]"
                >
                  {booking.owner_phone}
                </a>
              ) : (
                <span>{t('adminBookings.detail.noPhone')}</span>
              )}
            </div>
          </div>
          {/* Financial Summary - UPDATED with Admin Profit */}
          <div className="card p-5">
            <h3 className="section-title mb-3 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-500" />
              {t('adminBookings.detail.financialSummary')}
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Customer Paid</span>
                <span className="font-bold text-[var(--text)]">ETB {Number(booking.total_amount || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Owner Earns</span>
                <span className="font-bold text-orange-500">{loadingPricing ? 'Loading...' : `ETB ${(ownerPricing?.ownerTotal || 0).toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                <span className="font-semibold text-[var(--text)]">Admin Profit</span>
                <span className="font-bold text-green-600 text-lg">{loadingPricing ? 'Loading...' : `ETB ${(ownerPricing?.adminProfit || 0).toLocaleString()}`}</span>
              </div>
            </div>
          </div>
          {/* Booking Timeline */}
          <div className="card p-5">
            <h3 className="section-title mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" />
              {t('adminBookings.detail.timeline')}
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">{t('adminBookings.detail.created')}</span>
                <span>{booking.created_at ? format(new Date(booking.created_at), 'dd MMM yyyy, h:mm a') : '—'}</span>
              </div>
              {booking.confirmed_at && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">{t('adminBookings.detail.confirmed')}</span>
                  <span>{format(new Date(booking.confirmed_at), 'dd MMM yyyy, h:mm a')}</span>
                </div>
              )}
              {booking.completed_at && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">{t('adminBookings.detail.completed')}</span>
                  <span>{format(new Date(booking.completed_at), 'dd MMM yyyy, h:mm a')}</span>
                </div>
              )}
              {booking.cancelled_at && (
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">{t('adminBookings.detail.cancelled')}</span>
                  <span>{format(new Date(booking.cancelled_at), 'dd MMM yyyy, h:mm a')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
/* ── Main AdminBookings Component ───────────────────── */
export default function AdminBookings() {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [detailView, setDetailView] = useState(null);
  const tabsTranslated = TABS.map(tab => ({
    value: tab.value,
    label: t(`adminBookings.tabs.${tab.label}`)
  }));
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const response = await bookingService.getAll({ 
        status: tab || undefined, 
        search: search || undefined, 
        page, 
        limit: 15 
      });
      setBookings(response.data.data || []);
      setTotal(response.data.total || 0);
    } catch (error) {
      setBookings([]);
      toast.error(t('adminBookings.toasts.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [tab, search, page, t]);
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);
  const confirmBooking = async (id) => {
    const response = await bookingService.confirm(id);
    return response;
  };
  const cancelBooking = async (id, reason) => {
    const response = await bookingService.cancel(id, reason);
    return response;
  };
  const completeBooking = async (id) => {
    const response = await bookingService.complete(id);
    return response;
  };
  const handleQuickConfirm = async (id) => {
    try {
      await confirmBooking(id);
      toast.success(t('adminBookings.toasts.confirmSuccess'));
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || t('adminBookings.toasts.confirmFailed'));
    }
  };
  const handleQuickComplete = async (id) => {
    try {
      await completeBooking(id);
      toast.success(t('adminBookings.toasts.completeSuccess'));
      fetchBookings();
    } catch (error) {
      toast.error(error.response?.data?.message || t('adminBookings.toasts.completeFailed'));
    }
  };
  // If in detail view, show the detail component
  if (detailView) {
    return (
      <BookingDetailView
        booking={detailView}
        onBack={() => { setDetailView(null); fetchBookings(); }}
        onConfirm={confirmBooking}
        onCancel={cancelBooking}
        onComplete={completeBooking}
        t={t}
      />
    );
  }
  return (
    <div className="space-y-5">
      <SectionHeader 
        title={t('adminBookings.title')} 
        subtitle={t('adminBookings.subtitle', { count: total })} 
      />
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <Tabs tabs={tabsTranslated} active={tab} onChange={v => { setTab(v); setPage(1); }} />
          <SearchInput 
            value={search} 
            onChange={v => { setSearch(v); setPage(1); }} 
            placeholder={t('adminBookings.searchPlaceholder')} 
            className="w-full sm:w-80" 
          />
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('adminBookings.table.reference')}</th>
                <th>{t('adminBookings.table.equipment')}</th>
                <th>{t('adminBookings.table.customer')}</th>
                <th>{t('adminBookings.table.owner')}</th>
                <th>{t('adminBookings.table.dates')}</th>
                <th>{t('adminBookings.table.amount')}</th>
                <th>{t('adminBookings.table.status')}</th>
                <th>{t('adminBookings.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}><div className="skeleton h-4 w-3/4" /></td>
                    ))}
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-14 text-[var(--text-muted)]">
                    {t('adminBookings.table.noData')}
                  </td>
                </tr>
              ) : (
                bookings.map(booking => (
                  <tr key={booking.id}>
                    <td>
                      <span className="font-mono text-xs font-bold text-brand-500">
                        {booking.booking_ref}
                      </span>
                    </td>
                    <td>
                      <p className="text-sm font-medium text-[var(--text)] truncate max-w-[150px]">
                        {booking.equipment_name || '—'}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">{booking.equipment_city}</p>
                    </td>
                    <td>
                      <p className="text-sm text-[var(--text)]">{booking.customer_name || '—'}</p>
                      <p className="text-xs text-[var(--text-muted)] truncate max-w-[120px]">
                        {booking.customer_email}
                      </p>
                    </td>
                    <td>
                      <p className="text-sm text-[var(--text)]">{booking.owner_name || '—'}</p>
                    </td>
                    <td>
                      <span className="text-xs text-[var(--text-muted)]">
                        {booking.start_date ? format(new Date(booking.start_date), 'dd MMM') : '—'} 
                        {' → '}
                        {booking.end_date ? format(new Date(booking.end_date), 'dd MMM yy') : '—'}
                      </span>
                    </td>
                    <td>
                      <p className="font-semibold text-sm text-[var(--text)]">
                        ETB {Number(booking.total_amount || 0).toLocaleString()}
                      </p>
                      {/* REMOVED: Payout line - No more platform fee display */}
                    </td>
                    <td>
                      <StatusBadge status={booking.status} />
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setDetailView(booking)} 
                          title={t('adminBookings.table.viewDetails')}
                          className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-brand-500 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {booking.status === 'pending' && (
                          <button 
                            onClick={() => handleQuickConfirm(booking.id)} 
                            title={t('adminBookings.table.quickConfirm')}
                            className="p-1.5 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {booking.status === 'confirmed' && (
                          <button 
                            onClick={() => handleQuickComplete(booking.id)} 
                            title={t('adminBookings.table.quickComplete')}
                            className="p-1.5 rounded-lg text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-[var(--border)]">
          <Pagination 
            page={page} 
            totalPages={Math.ceil(total / 15)} 
            onPageChange={setPage} 
          />
        </div>
      </div>
    </div>
  );
}