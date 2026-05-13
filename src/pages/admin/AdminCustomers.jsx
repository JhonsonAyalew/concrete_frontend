import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { userService } from '../../services';
import { Button, Table, StatusBadge, Modal, SearchInput, Pagination, SectionHeader, ConfirmDialog, Avatar, Select } from '../../components/ui';
import { Eye, Ban, CheckCircle, Trash2, Filter, X, Shield, UserCheck, UserX, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import clsx from 'clsx';
export default function AdminCustomers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [viewItem, setViewItem] = useState(null);
  const [actionTarget, setActionTarget] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Filter states
  const [filters, setFilters] = useState({
    verificationStatus: '',
    bookingCount: '',
    status: '',
    city: '',
  });
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await userService.getAll({ 
        role: 'customer', 
        search, 
        page, 
        limit: 15,
        verification_status: filters.verificationStatus,
        min_bookings: filters.bookingCount === 'top' ? 5 : filters.bookingCount === 'medium' ? 2 : filters.bookingCount === 'low' ? 0 : undefined,
        max_bookings: filters.bookingCount === 'top' ? undefined : filters.bookingCount === 'medium' ? 4 : filters.bookingCount === 'low' ? 1 : undefined,
        status: filters.status,
        city: filters.city
      });
      setUsers(data.data || []); 
      setTotal(data.total || 0);
    } catch { 
      setUsers([]); 
    }
    setLoading(false);
  }, [search, page, filters]);
  useEffect(() => { 
    fetch(); 
  }, [fetch]);
  const handleSuspend = async () => {
    try {
      if (actionTarget.status === 'suspended') 
        await userService.activate(actionTarget.id);
      else 
        await userService.suspend(actionTarget.id);
      toast.success(t('adminCustomers.toast.success'));
      setActionTarget(null); 
      fetch();
    } catch { 
      toast.error(t('adminCustomers.toast.error')); 
    }
  };
  const clearFilters = () => {
    setFilters({
      verificationStatus: '',
      bookingCount: '',
      status: '',
      city: '',
    });
    setPage(1);
  };
  const hasActiveFilters = Object.values(filters).some(v => v !== '');
  const columns = [
    { key: 'avatar_url', label: '', width: '48px', render: (v, r) => <Avatar src={v} name={r.name} size="sm" /> },
    { 
      key: 'name', 
      label: t('adminCustomers.columns.name'), 
      render: (v, r) => (
        <div>
          <p className="font-semibold text-sm text-[var(--text)]">{v}</p>
          <p className="text-xs text-[var(--text-muted)]">{r.email}</p>
        </div>
      ) 
    },
    { 
      key: 'id_number', 
      label: t('adminCustomers.columns.idNumber'), 
      render: (v) => <span className="text-xs font-mono text-[var(--text-muted)]">{v || '—'}</span> 
    },
    { 
      key: 'phone', 
      label: t('adminCustomers.columns.phone'), 
      render: (v) => <span className="text-sm">{v || '—'}</span> 
    },
    { 
      key: 'city', 
      label: t('adminCustomers.columns.city'), 
      render: (v) => <span className="text-sm">{v || '—'}</span> 
    },
    { 
      key: 'id_verified', 
      label: t('adminCustomers.columns.idVerified'), 
      render: (v) => (
        <span className={clsx(
          'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
          v ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        )}>
          {v ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
          {v ? t('common.verified') : t('common.unverified')}
        </span>
      ) 
    },
    { 
      key: 'status', 
      label: t('adminCustomers.columns.status'), 
      render: (v) => <StatusBadge status={v} /> 
    },
    { 
      key: 'created_at', 
      label: t('adminCustomers.columns.joined'), 
      render: (v) => <span className="text-xs text-[var(--text-muted)]">{v ? format(new Date(v), 'dd MMM yyyy') : '—'}</span> 
    },
    { 
      key: 'id', 
      label: t('adminCustomers.columns.actions'), 
      width: '110px', 
      render: (_, row) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setViewItem(row)}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className={row.status === 'suspended' ? 'text-green-500' : 'text-amber-500'} 
            onClick={() => setActionTarget(row)}
          >
            {row.status === 'suspended' ? <CheckCircle className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
          </Button>
        </div>
      )
    },
  ];
  // Filter options
  const verificationOptions = [
    { value: '', label: t('adminCustomers.filters.allVerification') },
    { value: 'verified', label: t('common.verified'), icon: UserCheck },
    { value: 'unverified', label: t('common.unverified'), icon: UserX },
  ];
  const bookingOptions = [
    { value: '', label: t('adminCustomers.filters.allBookings') },
    { value: 'top', label: t('adminCustomers.filters.topCustomers'), desc: '5+ bookings' },
    { value: 'medium', label: t('adminCustomers.filters.mediumCustomers'), desc: '2-4 bookings' },
    { value: 'low', label: t('adminCustomers.filters.lowCustomers'), desc: '0-1 bookings' },
  ];
  const statusOptions = [
    { value: '', label: t('adminCustomers.filters.allStatus') },
    { value: 'active', label: t('common.active') },
    { value: 'suspended', label: t('common.suspended') },
  ];
  const cityOptions = [
    { value: '', label: t('adminCustomers.filters.allCities') },
    { value: 'Addis Ababa', label: 'Addis Ababa' },
    { value: 'Dire Dawa', label: 'Dire Dawa' },
    { value: 'Hawassa', label: 'Hawassa' },
    { value: 'Bahir Dar', label: 'Bahir Dar' },
    { value: 'Mekelle', label: 'Mekelle' },
    { value: 'Adama', label: 'Adama' },
    { value: 'Gondar', label: 'Gondar' },
    { value: 'Jimma', label: 'Jimma' },
    { value: 'Dessie', label: 'Dessie' },
  ];
  return (
    <div className="space-y-5">
      <SectionHeader 
        title={t('adminCustomers.header.title')} 
        subtitle={t('adminCustomers.header.subtitle', { count: total })} 
      />
      <div className="card overflow-hidden">
        {/* Search and Filter Bar */}
        <div className="p-4 border-b border-[var(--border)] space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <SearchInput 
              value={search} 
              onChange={(v) => { setSearch(v); setPage(1); }} 
              placeholder={t('adminCustomers.searchPlaceholder')} 
              className="flex-1" 
            />
            <button 
              onClick={() => setFiltersOpen(v => !v)}
              className={clsx(
                'btn-secondary flex items-center gap-2 px-4 py-2 text-sm',
                hasActiveFilters && 'border-brand-500 text-brand-500'
              )}
            >
              <Filter className="w-4 h-4" />
              {t('adminCustomers.filters.button')}
              {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-brand-500" />}
            </button>
          </div>
          {/* Filter Panel */}
          {filtersOpen && (
            <div className="pt-3 animate-slide-down">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-[var(--text)]">{t('adminCustomers.filters.title')}</span>
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="text-xs text-brand-500 hover:text-brand-600 flex items-center gap-1">
                    <X className="w-3 h-3" /> {t('adminCustomers.filters.clear')}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Verification Status Filter */}
                <select 
                  value={filters.verificationStatus} 
                  onChange={(e) => { setFilters({ ...filters, verificationStatus: e.target.value }); setPage(1); }}
                  className="input-field text-sm"
                >
                  {verificationOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {/* Status Filter */}
                <select 
                  value={filters.status} 
                  onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
                  className="input-field text-sm"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {/* City Filter */}
                <select 
                  value={filters.city} 
                  onChange={(e) => { setFilters({ ...filters, city: e.target.value }); setPage(1); }}
                  className="input-field text-sm"
                >
                  {cityOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              {/* Active filters display */}
              {hasActiveFilters && (
                <div className="flex flex-wrap gap-2 mt-3 pt-2 border-t border-[var(--border)]">
                  <span className="text-xs text-[var(--text-muted)]">{t('adminCustomers.filters.active')}:</span>
                  {filters.verificationStatus && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30">
                      {filters.verificationStatus === 'verified' ? t('common.verified') : t('common.unverified')}
                      <button onClick={() => { setFilters({ ...filters, verificationStatus: '' }); setPage(1); }}>
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  )}
                  {filters.status && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30">
                      {filters.status === 'active' ? t('common.active') : t('common.suspended')}
                      <button onClick={() => { setFilters({ ...filters, status: '' }); setPage(1); }}>
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  )}
                  {filters.city && (
                    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-600 dark:bg-brand-900/30">
                      {filters.city}
                      <button onClick={() => { setFilters({ ...filters, city: '' }); setPage(1); }}>
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <Table 
          columns={columns} 
          data={users} 
          loading={loading} 
          emptyText={t('adminCustomers.emptyText')} 
        />
        <div className="px-4">
          <Pagination 
            page={page} 
            totalPages={Math.ceil(total / 15)} 
            onPageChange={setPage} 
          />
        </div>
      </div>
      {/* Customer Profile Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={t('adminCustomers.modal.title')}>
        {viewItem && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-[var(--bg-secondary)]">
              <Avatar src={viewItem.avatar_url} name={viewItem.name} size="xl" />
              <div>
                <p className="text-lg font-bold text-[var(--text)]">{viewItem.name}</p>
                <p className="text-[var(--text-muted)]">{viewItem.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={viewItem.status} />
                  <span className={clsx(
                    'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                    viewItem.id_verified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                  )}>
                    {viewItem.id_verified ? <CheckCircle className="w-3 h-3" /> : <X className="w-3 h-3" />}
                    {viewItem.id_verified ? t('common.verified') : t('common.unverified')}
                  </span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                [t('adminCustomers.modal.idNumber'), viewItem.id_number],
                [t('adminCustomers.modal.phone'), viewItem.phone],
                [t('adminCustomers.modal.city'), viewItem.city],
                [t('adminCustomers.modal.joined'), viewItem.created_at ? format(new Date(viewItem.created_at), 'PPPP') : '—'],
              ].map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <p className="text-xs text-[var(--text-muted)]">{k}</p>
                  <p className="font-semibold text-[var(--text)] mt-0.5">{v || '—'}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>
      {/* Confirm Dialog */}
      <ConfirmDialog 
        open={!!actionTarget} 
        onClose={() => setActionTarget(null)} 
        onConfirm={handleSuspend}
        title={actionTarget?.status === 'suspended' 
          ? t('adminCustomers.confirm.activateTitle') 
          : t('adminCustomers.confirm.suspendTitle')}
        message={actionTarget?.status === 'suspended'
          ? t('adminCustomers.confirm.activateMessage', { name: actionTarget?.name })
          : t('adminCustomers.confirm.suspendMessage', { name: actionTarget?.name })}
        type={actionTarget?.status === 'suspended' ? 'warning' : 'danger'} 
      />
    </div>
  );
}