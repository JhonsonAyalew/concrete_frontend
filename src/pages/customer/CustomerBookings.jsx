import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bookingService, reviewService } from '../../services';
import { Button, Table, StatusBadge, Modal, Tabs, SectionHeader, StarRating } from '../../components/ui';
import { Eye, XCircle, Star, ExternalLink, MapPin, Calendar, Clock, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, isWithinInterval, subDays } from 'date-fns';
import clsx from 'clsx';
/* booking is "new" if created within last 48 hours */
function isNew(booking) {
  if (!booking.created_at) return false;
  return isWithinInterval(new Date(booking.created_at), {
    start: subDays(new Date(), 2),
    end:   new Date(),
  });
}
export default function CustomerBookings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [bookings,    setBookings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [tab,         setTab]         = useState('');
  const [selected,    setSelected]    = useState(null);
  const [cancelOpen,  setCancelOpen]  = useState(false);
  const [reviewOpen,  setReviewOpen]  = useState(false);
  const [cancelReason,setCancelReason]= useState('');
  const [rating,      setRating]      = useState(5);
  const [comment,     setComment]     = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [alreadyReviewedOpen, setAlreadyReviewedOpen] = useState(false);
  const TABS = [
    { value: '', label: t('customerBookings.tabs.all') },
    { value: 'pending',   label: t('customerBookings.tabs.pending') },
    { value: 'confirmed', label: t('customerBookings.tabs.confirmed') },
    { value: 'completed', label: t('customerBookings.tabs.completed') },
    { value: 'cancelled', label: t('customerBookings.tabs.cancelled') },
  ];
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await bookingService.getMy();
      const all = data.data || [];
      // Get all reviews for the current user to check which bookings have reviews
      let userReviews = [];
      try {
        const reviewsRes = await reviewService.getMine();
        userReviews = reviewsRes.data?.data || [];
      } catch (err) {
      }
      // Mark which bookings have been reviewed
      const bookingsWithReviewStatus = all.map((booking) => {
        const hasReview = userReviews.some(review => review.booking_id === booking.id);
        return { ...booking, hasReview };
      });
      setBookings(tab ? bookingsWithReviewStatus.filter(b => b.status === tab) : bookingsWithReviewStatus);
    } catch { setBookings([]); }
    setLoading(false);
  }, [tab, t]);
  useEffect(() => { fetch(); }, [fetch]);
  /* ── actions ── */
  const handleCancel = async () => {
    setSubmitting(true);
    try {
      await bookingService.cancel(selected.id, cancelReason);
      toast.success(t('customerBookings.messages.cancelSuccess'));
      setCancelOpen(false); setSelected(null); fetch();
    } catch (e) { toast.error(e.response?.data?.message || t('customerBookings.messages.cancelFailed')); }
    setSubmitting(false);
  };
  const handleReview = async () => {
    if (!comment.trim()) { toast.error(t('customerBookings.messages.commentRequired')); return; }
    setSubmitting(true);
    try {
      await reviewService.create({ booking_id: selected.id, rating, comment });
      toast.success(t('customerBookings.messages.reviewSuccess'));
      setReviewOpen(false); 
      setSelected(null); 
      fetch();
    } catch (e) { 
      const errorMessage = e.response?.data?.message || t('customerBookings.messages.reviewFailed');
      if (errorMessage.includes('already reviewed') || errorMessage.includes('already')) {
        setReviewOpen(false);
        setAlreadyReviewedOpen(true);
      } else {
        toast.error(errorMessage);
      }
    }
    setSubmitting(false);
  };
  const openDetail = (row) => { setSelected(row); };
  /* ── columns ── */
  const columns = [
    {
      key: 'booking_ref', label: t('customerBookings.columns.ref'),
      render: (v, row) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs font-bold text-brand-500">{v}</span>
          {isNew(row) && (
            <span className="px-1.5 py-0.5 rounded-full bg-green-500 text-white text-[9px] font-bold uppercase tracking-wide">
              {t('customerBookings.newBadge')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'equipment_name', label: t('customerBookings.columns.equipment'),
      render: (v, row) => (
        <div>
          <p className="text-sm font-medium text-[var(--text)] truncate max-w-[150px]">{v || '—'}</p>
          {row.equipment_city && (
            <p className="text-xs text-[var(--text-muted)] flex items-center gap-0.5 mt-0.5">
              <MapPin className="w-2.5 h-2.5" />{row.equipment_city}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'start_date', label: t('customerBookings.columns.dates'),
      render: (v, r) => (
        <div className="text-xs text-[var(--text-muted)]">
          <p>{v ? format(new Date(v), 'dd MMM yyyy') : '—'}</p>
          <p>{r.end_date ? format(new Date(r.end_date), 'dd MMM yyyy') : ''}</p>
        </div>
      ),
    },
    {
      key: 'total_amount', label: t('customerBookings.columns.amount'),
      render: v => <span className="font-semibold text-sm">{t('customerBookings.currency')} {Number(v || 0).toLocaleString()}</span>,
    },
    {
      key: 'status', label: t('customerBookings.columns.status'),
      render: (v, row) => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={v} />
          {isNew(row) && v === 'confirmed' && (
            <span className="text-[9px] font-bold text-green-500 uppercase">{t('customerBookings.justConfirmed')}</span>
          )}
          {isNew(row) && v === 'cancelled' && (
            <span className="text-[9px] font-bold text-red-500 uppercase">{t('customerBookings.recentlyCancelled')}</span>
          )}
        </div>
      ),
    },
    {
      key: 'id', label: t('customerBookings.columns.actions'), width: '140px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          {/* View detail */}
          <button onClick={() => openDetail(row)}
            title={t('customerBookings.actions.viewDetails')}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-brand-500 transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          {/* View equipment page */}
          {row.equipment_id && (
            <Link to={`/equipment/${row.equipment_id}`}
              title={t('customerBookings.actions.viewEquipment')}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-purple-500 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </Link>
          )}
          {/* Cancel */}
          {(row.status === 'pending' || row.status === 'confirmed') && (
            <button
              title={t('customerBookings.actions.cancel')}
              onClick={() => { setSelected(row); setCancelOpen(true); }}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 transition-colors">
              <XCircle className="w-4 h-4" />
            </button>
          )}
          {/* Leave review */}
          {row.status === 'completed' && !row.hasReview && (
            <button
              title={t('customerBookings.actions.leaveReview')}
              onClick={() => { setSelected(row); setRating(5); setComment(''); setReviewOpen(true); }}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-500 transition-colors">
              <Star className="w-4 h-4" />
            </button>
          )}
          {row.status === 'completed' && row.hasReview && (
            <button
              title={t('customerBookings.actions.alreadyReviewed')}
              disabled
              className="p-1.5 rounded-lg text-[var(--text-muted)] cursor-not-allowed opacity-50">
              <Star className="w-4 h-4" fill="currentColor" />
            </button>
          )}
        </div>
      ),
    },
  ];
  /* totals for header stats */
  const newCount = bookings.filter(isNew).length;
  return (
    <div className="space-y-5">
      <SectionHeader
        title={t('customerBookings.header.title')}
        subtitle={t('customerBookings.header.subtitle')}
        action={
          <Link to="/equipment" className="btn-primary text-sm px-4 py-2.5 inline-flex items-center gap-2">
            <Package className="w-4 h-4" /> {t('customerBookings.header.bookButton')}
          </Link>
        }
      />
      {/* New activity banner */}
      {newCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800 dark:text-green-300"
              style={{ fontFamily: 'Syne, sans-serif' }}>
              {t('customerBookings.newActivity.title', { count: newCount })}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
              {t('customerBookings.newActivity.description')} <span className="font-bold">{t('customerBookings.newBadge')}</span> {t('customerBookings.newActivity.suffix')}
            </p>
          </div>
        </div>
      )}
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <Tabs tabs={TABS} active={tab} onChange={v => setTab(v)} />
        </div>
        <Table columns={columns} data={bookings} loading={loading} emptyText={t('customerBookings.emptyText')} />
      </div>
      {/* ── Booking Detail Modal ── */}
      <Modal open={!!selected && !cancelOpen && !reviewOpen}
        onClose={() => setSelected(null)}
        title={
          <div className="flex items-center gap-2">
            <span>{t('customerBookings.detailModal.title')}</span>
            <span className="font-mono text-brand-500 text-sm">{selected?.booking_ref}</span>
            {selected && isNew(selected) && (
              <span className="px-2 py-0.5 rounded-full bg-green-500 text-white text-[10px] font-bold">{t('customerBookings.newBadge')}</span>
            )}
          </div>
        }
        size="md"
        footer={
          <div className="flex gap-2 flex-wrap">
            {selected?.equipment_id && (
              <Link to={`/equipment/${selected.equipment_id}`}
                className="btn-secondary text-sm px-4 py-2 inline-flex items-center gap-1.5"
                onClick={() => setSelected(null)}>
                <ExternalLink className="w-3.5 h-3.5" /> {t('customerBookings.detailModal.viewEquipment')}
              </Link>
            )}
            {(selected?.status === 'pending' || selected?.status === 'confirmed') && (
              <Button variant="danger" size="sm"
                onClick={() => { setCancelOpen(true); }}>
                <XCircle className="w-3.5 h-3.5" /> {t('customerBookings.detailModal.cancelButton')}
              </Button>
            )}
            {selected?.status === 'completed' && !selected?.hasReview && (
              <Button size="sm" variant="outline"
                onClick={() => { setReviewOpen(true); setRating(5); setComment(''); }}>
                <Star className="w-3.5 h-3.5" /> {t('customerBookings.detailModal.leaveReview')}
              </Button>
            )}
            {selected?.status === 'completed' && selected?.hasReview && (
              <Button size="sm" variant="outline" disabled className="opacity-50 cursor-not-allowed">
                <Star className="w-3.5 h-3.5" fill="currentColor" /> {t('customerBookings.detailModal.alreadyReviewed')}
              </Button>
            )}
          </div>
        }>
        {selected && (
          <div className="space-y-4 text-sm">
            {/* Status banner */}
            <div className={clsx('flex items-center gap-2 p-3 rounded-xl',
              selected.status === 'confirmed' ? 'bg-green-50 dark:bg-green-900/20' :
              selected.status === 'pending'   ? 'bg-amber-50 dark:bg-amber-900/20' :
              selected.status === 'cancelled' ? 'bg-red-50 dark:bg-red-900/20' :
              'bg-[var(--bg-secondary)]'
            )}>
              <StatusBadge status={selected.status} />
              <span className="text-xs text-[var(--text-secondary)]">
                {selected.status === 'pending'   && t('customerBookings.statusMessages.pending')}
                {selected.status === 'confirmed' && t('customerBookings.statusMessages.confirmed')}
                {selected.status === 'completed' && t('customerBookings.statusMessages.completed')}
                {selected.status === 'cancelled' && t('customerBookings.statusMessages.cancelled')}
              </span>
            </div>
            {/* Equipment info */}
            {(selected.equipment_name || selected.equipment_city) && (
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-brand-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-[var(--text)] truncate">{selected.equipment_name}</p>
                  {selected.equipment_city && (
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                      <MapPin className="w-2.5 h-2.5" />{selected.equipment_city}
                    </p>
                  )}
                </div>
                {selected.equipment_id && (
                  <Link to={`/equipment/${selected.equipment_id}`}
                    className="text-xs text-brand-500 font-semibold hover:underline flex items-center gap-1"
                    onClick={() => setSelected(null)}>
                    {t('customerBookings.detailModal.view')} <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
              </div>
            )}
            {/* Details grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                [t('customerBookings.detailFields.owner'),       selected.owner_name],
                [t('customerBookings.detailFields.ownerPhone'), selected.owner_phone],
                [t('customerBookings.detailFields.pricingMode'),selected.pricing_mode],
                [t('customerBookings.detailFields.totalDays'),  selected.total_days],
                [t('customerBookings.detailFields.startDate'),  selected.start_date ? format(new Date(selected.start_date), 'PPP') : '—'],
                [t('customerBookings.detailFields.endDate'),    selected.end_date   ? format(new Date(selected.end_date),   'PPP') : '—'],
                [t('customerBookings.detailFields.unitPrice'),  `${t('customerBookings.currency')} ${Number(selected.unit_price   || 0).toLocaleString()}`],
                [t('customerBookings.detailFields.total'),      `${t('customerBookings.currency')} ${Number(selected.total_amount || 0).toLocaleString()}`],
                [t('customerBookings.detailFields.platformFee'),`${t('customerBookings.currency')} ${Number(selected.platform_fee || 0).toLocaleString()}`],
              ].filter(([, v]) => v && v !== '—').map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide">{k}</p>
                  <p className="font-semibold text-[var(--text)] mt-0.5 capitalize text-xs">{v}</p>
                </div>
              ))}
            </div>
            {/* Notes */}
            {selected.notes && (
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide mb-1">{t('customerBookings.detailFields.notes')}</p>
                <p className="text-xs text-[var(--text-secondary)]">{selected.notes}</p>
              </div>
            )}
            {/* Cancellation reason */}
            {selected.cancellation_reason && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-xs font-semibold text-red-600 mb-1">{t('customerBookings.detailFields.cancellationReason')}</p>
                <p className="text-xs text-red-700 dark:text-red-400">{selected.cancellation_reason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
      {/* ── Cancel Modal ── */}
      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title={t('customerBookings.cancelModal.title')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>{t('customerBookings.cancelModal.goBack')}</Button>
            <Button variant="danger" onClick={handleCancel} loading={submitting}>
              <XCircle className="w-4 h-4" /> {t('customerBookings.cancelModal.confirmButton')}
            </Button>
          </>
        }>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                {t('customerBookings.cancelModal.warning')} <span className="font-mono">{selected?.booking_ref}</span>?
              </p>
              <p className="text-xs text-red-600 dark:text-red-500 mt-0.5">
                {selected?.equipment_name} · {t('customerBookings.currency')} {Number(selected?.total_amount || 0).toLocaleString()}
              </p>
            </div>
          </div>
          <div>
            <label className="label">{t('customerBookings.cancelModal.reasonLabel')} *</label>
            <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)}
              rows={3} placeholder={t('customerBookings.cancelModal.reasonPlaceholder')}
              className="input-field w-full resize-none" />
          </div>
        </div>
      </Modal>
      {/* ── Review Modal ── */}
      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title={t('customerBookings.reviewModal.title')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewOpen(false)}>{t('customerBookings.reviewModal.cancel')}</Button>
            <Button onClick={handleReview} loading={submitting}>
              <Star className="w-4 h-4" /> {t('customerBookings.reviewModal.submit')}
            </Button>
          </>
        }>
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-[var(--bg-secondary)] flex items-center gap-3">
            <Package className="w-5 h-5 text-brand-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-[var(--text)]">{selected?.equipment_name}</p>
              <p className="text-xs text-[var(--text-muted)]">{t('customerBookings.reviewModal.booking')} {selected?.booking_ref}</p>
            </div>
          </div>
          <div>
            <label className="label">{t('customerBookings.reviewModal.ratingLabel')}</label>
            <div className="mt-1">
              <StarRating value={rating} max={5} size="lg" onChange={setRating} />
              <p className="text-xs text-[var(--text-muted)] mt-1">
                {rating === 5 ? t('customerBookings.reviewModal.ratingLabels.excellent') : 
                 rating === 4 ? t('customerBookings.reviewModal.ratingLabels.veryGood') : 
                 rating === 3 ? t('customerBookings.reviewModal.ratingLabels.average') : 
                 rating === 2 ? t('customerBookings.reviewModal.ratingLabels.poor') : 
                 t('customerBookings.reviewModal.ratingLabels.veryPoor')}
              </p>
            </div>
          </div>
          <div>
            <label className="label">{t('customerBookings.reviewModal.reviewLabel')}</label>
            <textarea value={comment} onChange={e => setComment(e.target.value)}
              rows={4} placeholder={t('customerBookings.reviewModal.reviewPlaceholder')}
              className="input-field w-full resize-none" />
          </div>
        </div>
      </Modal>
      {/* ── Already Reviewed Popup Modal ── */}
      <Modal 
        open={alreadyReviewedOpen} 
        onClose={() => setAlreadyReviewedOpen(false)} 
        title={t('customerBookings.alreadyReviewedModal.title')}
        size="sm"
        footer={
          <Button onClick={() => setAlreadyReviewedOpen(false)}>
            {t('customerBookings.alreadyReviewedModal.gotIt')}
          </Button>
        }>
        <div className="space-y-4 text-center py-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Star className="w-8 h-8 text-amber-500" fill="currentColor" />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--text)] mb-2">{t('customerBookings.alreadyReviewedModal.subtitle')}</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {t('customerBookings.alreadyReviewedModal.description')}
            </p>
            <p className="text-xs text-[var(--text-muted)] mt-3">
              {t('customerBookings.alreadyReviewedModal.thanks')}
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}