import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { bookingService } from '../../services';
import { Button, Table, StatusBadge, Modal, Tabs, Pagination, SectionHeader } from '../../components/ui';
import { Eye, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
export default function OwnerBookings() {
  const { t } = useTranslation();
  const TABS = [
    { value: '', label: t('ownerBookings.tabs.all') },
    { value: 'pending', label: t('ownerBookings.tabs.pending') },
    { value: 'confirmed', label: t('ownerBookings.tabs.confirmed') },
    { value: 'completed', label: t('ownerBookings.tabs.completed') },
    { value: 'cancelled', label: t('ownerBookings.tabs.cancelled') },
  ];
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('');
  const [selected, setSelected] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await bookingService.getOwner();
      const all = data.data || [];
      setBookings(tab ? all.filter(b => b.status === tab) : all);
    } catch { setBookings([]); }
    setLoading(false);
  }, [tab]);
  useEffect(() => { fetch(); }, [fetch]);
  const handleConfirm = async (id) => {
    try { 
      await bookingService.confirm(id); 
      toast.success(t('ownerBookings.messages.confirmSuccess')); 
      fetch(); 
    } catch (e) { 
      toast.error(e.response?.data?.message || t('ownerBookings.messages.confirmFailed')); 
    }
  };
  const handleCancel = async () => {
    try {
      await bookingService.cancel(selected.id, cancelReason);
      toast.success(t('ownerBookings.messages.cancelSuccess'));
      setCancelOpen(false);
      setSelected(null);
      fetch();
    } catch { 
      toast.error(t('ownerBookings.messages.cancelFailed')); 
    }
  };
  const columns = [
    { key: 'booking_ref', label: t('ownerBookings.table.ref'), render: v => <span className="font-mono text-xs font-bold text-brand-500">{v}</span> },
    { key: 'equipment_name', label: t('ownerBookings.table.equipment'), render: v => <span className="text-sm font-medium truncate max-w-[140px] block">{v || '—'}</span> },
    { key: 'customer_name', label: t('ownerBookings.table.customer'), render: v => <span className="text-sm">{v || '—'}</span> },
    { key: 'start_date', label: t('ownerBookings.table.period'), render: (v, r) => (
      <span className="text-xs text-[var(--text-muted)]">
        {v ? format(new Date(v), 'dd MMM') : ''} → {r.end_date ? format(new Date(r.end_date), 'dd MMM yy') : ''}
      </span>
    )},
    { key: 'status', label: t('ownerBookings.table.status'), render: v => <StatusBadge status={v} /> },
  ];
  return (
    <div className="space-y-5">
      <SectionHeader 
        title={t('ownerBookings.header.title')} 
        subtitle={t('ownerBookings.header.subtitle')} 
      />
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)]">
          <Tabs tabs={TABS} active={tab} onChange={setTab} />
        </div>
        <Table 
          columns={columns} 
          data={bookings} 
          loading={loading} 
          emptyText={t('ownerBookings.table.emptyText')} 
        />
      </div>
      <Modal 
        open={!!selected && !cancelOpen} 
        onClose={() => setSelected(null)} 
        title={t('ownerBookings.modal.title', { ref: selected?.booking_ref })}
      >
        {selected && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              [t('ownerBookings.modal.customer'), selected.customer_name],
              [t('ownerBookings.modal.phone'), selected.customer_phone],
              [t('ownerBookings.modal.dates'), `${selected.start_date ? format(new Date(selected.start_date), 'dd MMM') : ''} – ${selected.end_date ? format(new Date(selected.end_date), 'dd MMM yy') : ''}`],
              [t('ownerBookings.modal.totalDays'), selected.total_days],
              [t('ownerBookings.modal.totalAmount'), `${t('ownerBookings.currency')} ${Number(selected.total_amount || 0).toLocaleString()}`],
              [t('ownerBookings.modal.yourPayout'), `${t('ownerBookings.currency')} ${Number(selected.owner_payout || 0).toLocaleString()}`],
            ].map(([k, v]) => (
              <div key={k} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-xs text-[var(--text-muted)]">{k}</p>
                <p className="font-semibold text-[var(--text)] mt-0.5">{v || '—'}</p>
              </div>
            ))}
            {selected.notes && (
              <div className="col-span-2 p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-xs text-[var(--text-muted)] mb-1">{t('ownerBookings.modal.customerNotes')}</p>
                <p>{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
      <Modal 
        open={cancelOpen} 
        onClose={() => { setCancelOpen(false); }} 
        title={t('ownerBookings.cancelModal.title')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCancelOpen(false)}>
              {t('ownerBookings.cancelModal.backButton')}
            </Button>
            <Button variant="danger" onClick={handleCancel}>
              {t('ownerBookings.cancelModal.confirmButton')}
            </Button>
          </>
        }
      >
        <p className="text-sm text-[var(--text-secondary)] mb-3">
          {t('ownerBookings.cancelModal.description', { ref: selected?.booking_ref })}
        </p>
        <textarea 
          value={cancelReason} 
          onChange={e => setCancelReason(e.target.value)} 
          rows={3} 
          placeholder={t('ownerBookings.cancelModal.placeholder')} 
          className="input-field w-full resize-none" 
        />
      </Modal>
    </div>
  );
}