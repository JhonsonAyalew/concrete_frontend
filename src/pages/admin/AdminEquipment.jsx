import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { equipmentService } from '../../services/equipmentService';
import { Button, Table, StatusBadge, Modal, SearchInput, Pagination, SectionHeader, ConfirmDialog, Input, Select, Textarea } from '../../components/ui';
import { Eye, Edit, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
export default function AdminEquipment() {
  const { t } = useTranslation();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await equipmentService.getAll({ search, page, limit: 15 });
      setEquipment(data.data || []);
      setTotal(data.total || 0);
    } catch { setEquipment([]); }
    setLoading(false);
  }, [search, page]);
  useEffect(() => { fetch(); }, [fetch]);
  const handleDelete = async () => {
    try {
      await equipmentService.delete(deleteTarget.id);
      toast.success(t('adminEquipment.deleteSuccess'));
      setDeleteTarget(null);
      fetch();
    } catch {
      toast.error(t('adminEquipment.deleteError'));
    }
  };
  const columns = [
    {
      key: 'images',
      label: '',
      width: '56px',
      render: (v) => (
        <div className="w-10 h-10 rounded-lg bg-[var(--bg-secondary)] overflow-hidden">
          {v?.[0] ? (
            <img src={v[0]} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg">⚙️</div>
          )}
        </div>
      )
    },
    {
      key: 'name',
      label: t('adminEquipment.columns.name'),
      render: (v, row) => (
        <div>
          <p className="font-semibold text-[var(--text)] text-sm">{v}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {row.brand} {row.model} {row.year && `· ${row.year}`}
          </p>
        </div>
      )
    },
    {
      key: 'category_name',
      label: t('adminEquipment.columns.category'),
      render: (v) => <span className="badge badge-neutral">{v || '—'}</span>
    },
    {
      key: 'city',
      label: t('adminEquipment.columns.city'),
      render: (v) => <span className="text-sm">{v}</span>
    },
    {
      key: 'price_per_day',
      label: t('adminEquipment.columns.pricePerDay'),
      render: (v) => (
        <span className="font-semibold text-sm text-brand-500">
          {t('adminEquipment.currency')} {Number(v || 0).toLocaleString()}
        </span>
      )
    },
    {
      key: 'status',
      label: t('adminEquipment.columns.status'),
      render: (v, row) => (
        <div className="flex flex-col gap-1">
          <StatusBadge status={v} />
          {!row.is_approved && <span className="badge badge-warning">{t('adminEquipment.pendingApproval')}</span>}
        </div>
      )
    },
    {
      key: 'id',
      label: t('adminEquipment.columns.actions'),
      width: '120px',
      render: (_, row) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => setViewItem(row)}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setDeleteTarget(row)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      )
    },
  ];
  return (
    <div className="space-y-5">
      <SectionHeader 
        title={t('adminEquipment.title')} 
        subtitle={t('adminEquipment.subtitle', { count: total })} 
      />
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex justify-between gap-3">
          <SearchInput 
            value={search} 
            onChange={(v) => { setSearch(v); setPage(1); }} 
            placeholder={t('adminEquipment.searchPlaceholder')} 
            className="w-full sm:w-72" 
          />
        </div>
        <Table 
          columns={columns} 
          data={equipment} 
          loading={loading} 
          emptyText={t('adminEquipment.emptyText')} 
        />
        <div className="px-4">
          <Pagination 
            page={page} 
            totalPages={Math.ceil(total / 15)} 
            onPageChange={setPage} 
          />
        </div>
      </div>
      {/* View Modal */}
      <Modal 
        open={!!viewItem} 
        onClose={() => setViewItem(null)} 
        title={viewItem?.name || t('adminEquipment.modal.title')} 
        size="lg"
      >
        {viewItem && (
          <div className="space-y-3 text-sm">
            {viewItem.images?.[0] && (
              <img 
                src={viewItem.images[0]} 
                alt="" 
                className="w-full h-48 object-cover rounded-xl" 
              />
            )}
            <div className="grid grid-cols-2 gap-3">
              {[
                [t('adminEquipment.modal.brand'), viewItem.brand],
                [t('adminEquipment.modal.model'), viewItem.model],
                [t('adminEquipment.modal.year'), viewItem.year],
                [t('adminEquipment.modal.condition'), viewItem.condition],
                [t('adminEquipment.modal.city'), viewItem.city],
                [t('adminEquipment.modal.pricePerDay'), `${t('adminEquipment.currency')} ${Number(viewItem.price_per_day || 0).toLocaleString()}`],
                [t('adminEquipment.modal.owner'), viewItem.owner_name],
                [t('adminEquipment.modal.status'), viewItem.status],
              ].map(([k, v]) => (
                <div key={k} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <p className="text-xs text-[var(--text-muted)]">{k}</p>
                  <p className="font-semibold text-[var(--text)] capitalize mt-0.5">{v || '—'}</p>
                </div>
              ))}
            </div>
            {viewItem.description && (
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-xs text-[var(--text-muted)] mb-1">
                  {t('adminEquipment.modal.description')}
                </p>
                <p>{viewItem.description}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
      {/* Delete Confirmation Dialog */}
      <ConfirmDialog 
        open={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        onConfirm={handleDelete}
        title={t('adminEquipment.deleteDialog.title')} 
        message={t('adminEquipment.deleteDialog.message', { name: deleteTarget?.name })} 
      />
    </div>
  );
}