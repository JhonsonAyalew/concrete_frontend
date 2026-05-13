import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ownerEquipmentService } from '../../services'; 
import { Table, StatusBadge, Modal, SectionHeader, Button, Input, Select, Textarea, FormRow } from '../../components/ui';
import { Eye, Plus, Edit, Trash2, AlertCircle, Save, X } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
const CONDITIONS = ['excellent', 'good', 'fair'];
const CITIES = ['Addis Ababa', 'Dire Dawa', 'Hawassa', 'Bahir Dar', 'Mekelle', 'Adama', 'Gondar', 'Jimma', 'Dessie', 'Jijiga'];
export default function OwnerMySubmissions() {
  const { t } = useTranslation();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewItem, setViewItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const loadSubmissions = () => {
    setLoading(true);
    ownerEquipmentService.getMine()
      .then(response => {
        // ownerEquipmentService.getMine returns { data: [...] } or just [...]
        const submissionsData = response?.data || response;
        if (Array.isArray(submissionsData)) {
          setSubmissions(submissionsData);
        } else if (submissionsData?.data && Array.isArray(submissionsData.data)) {
          setSubmissions(submissionsData.data);
        } else {
          setSubmissions([]);
        }
      })
      .catch((error) => {
        toast.error(t('ownerSubmissions.errors.loadFailed'));
        setSubmissions([]);
      })
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    loadSubmissions();
  }, []);
  const handleEdit = (submission) => {
    if (submission.status !== 'pending') {
      toast.error(t('ownerSubmissions.errors.cannotEdit'));
      return;
    }
    setEditingItem({ ...submission });
  };
  const handleUpdate = async () => {
    if (!editingItem) return;
    setUpdating(true);
    try {
      const payload = {
        name: editingItem.name,
        brand: editingItem.brand,
        model: editingItem.model,
        year: editingItem.year,
        condition: editingItem.condition,
        category_id: editingItem.category_id,
        description: editingItem.description,
        price_per_day: parseFloat(editingItem.price_per_day),
        price_per_hour: editingItem.price_per_hour ? parseFloat(editingItem.price_per_hour) : undefined,
        price_per_week: editingItem.price_per_week ? parseFloat(editingItem.price_per_week) : undefined,
        price_per_month: editingItem.price_per_month ? parseFloat(editingItem.price_per_month) : undefined,
        deposit_required: editingItem.deposit_required ? parseFloat(editingItem.deposit_required) : 0,
        min_rental_days: editingItem.min_rental_days || 1,
        available_from: editingItem.available_from,
        available_to: editingItem.available_to,
        city: editingItem.city,
        specific_address: editingItem.specific_address,
        delivery_available: editingItem.delivery_available,
        delivery_radius_km: editingItem.delivery_radius_km ? parseFloat(editingItem.delivery_radius_km) : undefined,
      };
      await ownerEquipmentService.update(editingItem.id, payload);
      toast.success(t('ownerSubmissions.success.updated'));
      loadSubmissions();
      setEditingItem(null);
    } catch (error) {
      toast.error(error.response?.data?.message || t('ownerSubmissions.errors.updateFailed'));
    } finally {
      setUpdating(false);
    }
  };
  const handleDelete = async () => {
    if (!deleteItem) return;
    if (deleteItem.status !== 'pending') {
      toast.error(t('ownerSubmissions.errors.cannotDelete'));
      setDeleteItem(null);
      return;
    }
    setDeleting(true);
    try {
      await ownerEquipmentService.delete(deleteItem.id);
      toast.success(t('ownerSubmissions.success.deleted'));
      loadSubmissions();
      setDeleteItem(null);
    } catch (error) {
      toast.error(error.response?.data?.message || t('ownerSubmissions.errors.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };
  const columns = [
    { 
      key: 'data', 
      label: t('ownerSubmissions.columns.equipment'), 
      render: (_, row) => (
        <div>
          <p className="font-semibold text-sm text-[var(--text)]">{row?.name || '—'}</p>
          <p className="text-xs text-[var(--text-muted)]">{row?.brand} {row?.year && `· ${row.year}`}</p>
        </div>
      )
    },
    { 
      key: 'status', 
      label: t('ownerSubmissions.columns.status'), 
      render: (status) => <StatusBadge status={status} /> 
    },
    { 
      key: 'rejection_reason', 
      label: t('ownerSubmissions.columns.adminNote'), 
      render: (v, r) => (
        <span className="text-xs text-[var(--text-secondary)] truncate max-w-xs block">{v || r.review_note || '—'}</span>
      )
    },
    { 
      key: 'created_at', 
      label: t('ownerSubmissions.columns.submitted'), 
      render: (v) => (
        <span className="text-xs text-[var(--text-muted)]">{v ? format(new Date(v), 'dd MMM yyyy') : '—'}</span>
      )
    },
    { 
      key: 'actions', 
      label: '', 
      width: '100px',
      render: (_, row) => (
        <div className="flex items-center gap-1">
          <Button size="sm" variant="ghost" onClick={() => setViewItem(row)}>
            <Eye className="w-3.5 h-3.5" />
          </Button>
          {row.status === 'pending' && (
            <>
              <Button size="sm" variant="ghost" onClick={() => handleEdit(row)}>
                <Edit className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setDeleteItem(row)}>
                <Trash2 className="w-3.5 h-3.5 text-red-500" />
              </Button>
            </>
          )}
        </div>
      )
    },
  ];
  return (
    <div className="space-y-5">
      <SectionHeader 
        title={t('ownerSubmissions.header.title')} 
        subtitle={t('ownerSubmissions.header.subtitle')}
        action={
          <Link to="/owner/add-equipment" className="btn-primary text-sm px-4 py-2.5 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            {t('ownerSubmissions.header.newButton')}
          </Link>
        } 
      />
      <div className="card overflow-hidden">
        <Table 
          columns={columns} 
          data={submissions} 
          loading={loading} 
          emptyText={t('ownerSubmissions.table.emptyText')} 
        />
      </div>
      {/* View Modal */}
      <Modal open={!!viewItem} onClose={() => setViewItem(null)} title={t('ownerSubmissions.modal.title')}>
        {viewItem && (
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <StatusBadge status={viewItem.status} />
              <span className="text-xs text-[var(--text-muted)]">
                {viewItem.created_at ? format(new Date(viewItem.created_at), 'PPP') : ''}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['name', viewItem.name],
                ['brand', viewItem.brand],
                ['model', viewItem.model],
                ['year', viewItem.year],
                ['condition', viewItem.condition],
                ['city', viewItem.city],
                ['pricePerDay', viewItem.price_per_day ? `ETB ${Number(viewItem.price_per_day).toLocaleString()}` : '—'],
              ].map(([key, value]) => (
                <div key={key} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                  <p className="text-xs text-[var(--text-muted)]">{t(`ownerSubmissions.modal.fields.${key}`)}</p>
                  <p className="font-semibold text-[var(--text)] mt-0.5 capitalize">{value || '—'}</p>
                </div>
              ))}
            </div>
            {viewItem.description && (
              <div className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                <p className="text-xs text-[var(--text-muted)]">{t('ownerSubmissions.modal.fields.description')}</p>
                <p className="text-sm text-[var(--text)] mt-0.5">{viewItem.description}</p>
              </div>
            )}
            {viewItem.rejection_reason && (
              <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-xs font-semibold text-red-600 mb-1">{t('ownerSubmissions.modal.rejectionReason')}</p>
                <p className="text-red-700 dark:text-red-400">{viewItem.rejection_reason}</p>
              </div>
            )}
            {viewItem.review_note && (
              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <p className="text-xs font-semibold text-blue-600 mb-1">{t('ownerSubmissions.modal.adminNote')}</p>
                <p className="text-blue-700 dark:text-blue-400">{viewItem.review_note}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
      {/* Edit Modal */}
      <Modal open={!!editingItem} onClose={() => !updating && setEditingItem(null)} title={t('ownerSubmissions.editModal.title')} size="lg">
        {editingItem && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto">
            <FormRow>
              <Input 
                label={t('ownerEquipment.basicInfo.name')}
                value={editingItem.name || ''}
                onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
              />
              <Input 
                label={t('ownerEquipment.basicInfo.brand')}
                value={editingItem.brand || ''}
                onChange={(e) => setEditingItem({...editingItem, brand: e.target.value})}
              />
            </FormRow>
            <FormRow>
              <Input 
                label={t('ownerEquipment.basicInfo.model')}
                value={editingItem.model || ''}
                onChange={(e) => setEditingItem({...editingItem, model: e.target.value})}
              />
              <Input 
                label={t('ownerEquipment.basicInfo.year')}
                type="number"
                value={editingItem.year || ''}
                onChange={(e) => setEditingItem({...editingItem, year: e.target.value})}
              />
            </FormRow>
            <FormRow>
              <Select 
                label={t('ownerEquipment.basicInfo.condition')}
                value={editingItem.condition || ''}
                onChange={(e) => setEditingItem({...editingItem, condition: e.target.value})}
              >
                <option value="">Select condition</option>
                {CONDITIONS.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
              <Select 
                label={t('ownerEquipment.location.city')}
                value={editingItem.city || ''}
                onChange={(e) => setEditingItem({...editingItem, city: e.target.value})}
              >
                <option value="">Select city</option>
                {CITIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </FormRow>
            <Textarea 
              label={t('ownerEquipment.details.description')}
              rows={3}
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
            />
            <FormRow>
              <Input 
                label={t('ownerEquipment.pricing.perDay')}
                type="number"
                value={editingItem.price_per_day || ''}
                onChange={(e) => setEditingItem({...editingItem, price_per_day: e.target.value})}
                required
              />
              <Input 
                label={t('ownerEquipment.pricing.perHour')}
                type="number"
                value={editingItem.price_per_hour || ''}
                onChange={(e) => setEditingItem({...editingItem, price_per_hour: e.target.value})}
              />
            </FormRow>
            <FormRow>
              <Input 
                label={t('ownerEquipment.pricing.deposit')}
                type="number"
                value={editingItem.deposit_required || ''}
                onChange={(e) => setEditingItem({...editingItem, deposit_required: e.target.value})}
              />
              <Input 
                label={t('ownerEquipment.pricing.minRentalDays')}
                type="number"
                value={editingItem.min_rental_days || 1}
                onChange={(e) => setEditingItem({...editingItem, min_rental_days: e.target.value})}
              />
            </FormRow>
            <FormRow>
              <Input 
                label={t('ownerEquipment.pricing.availableFrom')}
                type="date"
                value={editingItem.available_from || ''}
                onChange={(e) => setEditingItem({...editingItem, available_from: e.target.value})}
              />
              <Input 
                label={t('ownerEquipment.pricing.availableTo')}
                type="date"
                value={editingItem.available_to || ''}
                onChange={(e) => setEditingItem({...editingItem, available_to: e.target.value})}
              />
            </FormRow>
            <div className="flex gap-3 pt-4 border-t border-[var(--border)]">
              <Button 
                variant="secondary" 
                onClick={() => setEditingItem(null)}
                disabled={updating}
                className="flex-1"
              >
                <X className="w-4 h-4 mr-2" />
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleUpdate}
                loading={updating}
                disabled={updating}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {t('common.save')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
      {/* Delete Confirmation Modal */}
      <Modal 
        open={!!deleteItem} 
        onClose={() => !deleting && setDeleteItem(null)} 
        title={t('ownerSubmissions.deleteModal.title')}
        size="sm"
      >
        {deleteItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">
                {t('ownerSubmissions.deleteModal.warning', { name: deleteItem.name || 'this item' })}
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="secondary" 
                onClick={() => setDeleteItem(null)}
                disabled={deleting}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button 
                variant="danger" 
                onClick={handleDelete}
                loading={deleting}
                disabled={deleting}
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {t('ownerSubmissions.deleteModal.confirmButton')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}