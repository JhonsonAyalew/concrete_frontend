import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { categoryService } from '../../services';
import { Button, Table, Modal, SearchInput, SectionHeader, ConfirmDialog, Input, Textarea } from '../../components/ui';
import { Edit, Trash2, Plus, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
export default function AdminCategories() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors }, watch, setValue } = useForm();
  const watchName = watch('name');
  // Auto-generate slug from name
  useEffect(() => {
    if (watchName && !editItem) {
      const slug = watchName
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
      setValue('slug', slug);
    }
  }, [watchName, editItem, setValue]);
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const response = await categoryService.getAll();
      const categoriesData = response.data?.data || response.data || [];
      setCategories(categoriesData);
    } catch (error) {
      setCategories([]);
      toast.error(t('adminCategories.errors.fetchFailed'));
    }
    setLoading(false);
  }, [t]);
  useEffect(() => { fetch(); }, [fetch]);
  const openCreate = () => { 
    setEditItem(null); 
    reset({ 
      name: '', 
      slug: '',
      icon: '🔧', 
      description: '', 
      sort_order: 0,
      is_active: true 
    }); 
    setModalOpen(true); 
  };
  const openEdit = (item) => { 
    setEditItem(item); 
    reset({ 
      name: item.name,
      slug: item.slug,
      icon: item.icon || '🔧', 
      description: item.description || '', 
      sort_order: item.sort_order || 0,
      is_active: item.is_active !== undefined ? item.is_active : true
    }); 
    setModalOpen(true); 
  };
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const categoryData = {
        name: data.name,
        slug: data.slug || data.name.toLowerCase().replace(/\s+/g, '-'),
        icon: data.icon || '🔧',
        description: data.description || '',
        sort_order: parseInt(data.sort_order) || 0,
        is_active: data.is_active !== undefined ? data.is_active : true
      };
      if (editItem) {
        await categoryService.update(editItem.id, categoryData);
        toast.success(t('adminCategories.messages.updateSuccess'));
      } else {
        await categoryService.create(categoryData);
        toast.success(t('adminCategories.messages.createSuccess'));
      }
      setModalOpen(false);
      fetch();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || t('common.error');
      toast.error(errorMessage);
    }
    setSaving(false);
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await categoryService.delete(deleteTarget.id);
      toast.success(t('adminCategories.messages.deleteSuccess'));
      setDeleteTarget(null);
      fetch();
    } catch (error) {
      const errorMessage = error.response?.data?.message || t('adminCategories.errors.deleteFailed');
      toast.error(errorMessage);
    }
    setSaving(false);
  };
  const filtered = categories.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.slug?.toLowerCase().includes(search.toLowerCase())
  );
  const columns = [
    { 
      key: 'icon', 
      label: t('adminCategories.columns.icon'), 
      width: '80px', 
      render: (v) => <span className="text-2xl">{v || '🔧'}</span> 
    },
    { 
      key: 'name', 
      label: t('adminCategories.columns.name'), 
      render: (v, r) => (
        <div>
          <p className="font-semibold text-sm text-[var(--text)]">{v}</p>
          <p className="text-xs text-[var(--text-muted)]">{t('adminCategories.columns.slugLabel')}: {r.slug}</p>
        </div>
      ) 
    },
    { 
      key: 'description', 
      label: t('adminCategories.columns.description'), 
      render: (v) => (
        <span className="text-sm text-[var(--text-secondary)] truncate max-w-xs block">
          {v || '—'}
        </span>
      ) 
    },
    { 
      key: 'equipment_count', 
      label: t('adminCategories.columns.equipment'), 
      width: '100px',
      render: (v) => (
        <span className="text-sm font-semibold text-[var(--text)]">
          {v || 0}
        </span>
      ) 
    },
    { 
      key: 'is_active', 
      label: t('adminCategories.columns.status'), 
      width: '100px',
      render: (v) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
          v ? 'bg-green-500/10 text-green-600' : 'bg-gray-500/10 text-gray-500'
        }`}>
          {v ? (
            <>
              <ToggleRight className="w-3.5 h-3.5 text-green-500" />
              {t('adminCategories.status.active')}
            </>
          ) : (
            <>
              <ToggleLeft className="w-3.5 h-3.5 text-gray-500" />
              {t('adminCategories.status.inactive')}
            </>
          )}
        </span>
      ) 
    },
    { 
      key: 'id', 
      label: t('adminCategories.columns.actions'), 
      width: '100px', 
      render: (_, row) => (
        <div className="flex gap-1">
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => openEdit(row)}
            className="hover:text-brand-500"
          >
            <Edit className="w-3.5 h-3.5"/>
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            className="text-red-500 hover:text-red-600 hover:bg-red-500/10" 
            onClick={() => setDeleteTarget(row)}
          >
            <Trash2 className="w-3.5 h-3.5"/>
          </Button>
        </div>
      ),
    },
  ];
  return (
    <div className="space-y-5">
      <SectionHeader 
        title={t('adminCategories.title')} 
        subtitle={t('adminCategories.subtitle', { count: categories.length })} 
        action={
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4"/>
            {t('adminCategories.addButton')}
          </Button>
        } 
      />
      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
          <SearchInput 
            value={search} 
            onChange={setSearch} 
            placeholder={t('adminCategories.searchPlaceholder')} 
            className="w-full sm:w-80" 
          />
          {search && (
            <button 
              onClick={() => setSearch('')}
              className="text-xs text-brand-500 hover:text-brand-600 ml-2"
            >
              {t('common.clear')}
            </button>
          )}
        </div>
        <Table 
          columns={columns} 
          data={filtered} 
          loading={loading} 
          emptyText={t('adminCategories.emptyText')} 
        />
      </div>
      <Modal 
        open={modalOpen} 
        onClose={() => setModalOpen(false)} 
        title={editItem ? t('adminCategories.modal.editTitle') : t('adminCategories.modal.createTitle')}
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSubmit(onSubmit)} loading={saving}>
              {editItem ? t('common.update') : t('common.create')}
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label={t('adminCategories.form.nameLabel')} 
              placeholder={t('adminCategories.form.namePlaceholder')} 
              error={errors.name?.message && t('adminCategories.errors.nameRequired')} 
              {...register('name', { 
                required: true,
                minLength: {
                  value: 2,
                  message: 'minLength'
                }
              })} 
            />
            <Input 
              label={t('adminCategories.form.slugLabel')} 
              placeholder={t('adminCategories.form.slugPlaceholder')} 
              {...register('slug')}
              helperText={t('adminCategories.form.slugHelper')}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label={t('adminCategories.form.iconLabel')} 
              placeholder={t('adminCategories.form.iconPlaceholder')} 
              {...register('icon')}
              helperText={t('adminCategories.form.iconHelper')}
            />
            <Input 
              label={t('adminCategories.form.sortOrderLabel')} 
              type="number" 
              placeholder="0"
              {...register('sort_order', { valueAsNumber: true })}
              helperText={t('adminCategories.form.sortOrderHelper')}
            />
          </div>
          <Textarea 
            label={t('adminCategories.form.descriptionLabel')} 
            placeholder={t('adminCategories.form.descriptionPlaceholder')} 
            rows={3} 
            {...register('description')} 
          />
          <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
            <input 
              type="checkbox" 
              className="w-4 h-4 accent-brand-500 rounded" 
              {...register('is_active')} 
              defaultChecked={true}
            />
            <div>
              <span className="text-sm font-medium text-[var(--text)]">{t('adminCategories.form.activeLabel')}</span>
              <p className="text-xs text-[var(--text-muted)]">{t('adminCategories.form.activeHelper')}</p>
            </div>
          </label>
        </form>
      </Modal>
      <ConfirmDialog 
        open={!!deleteTarget} 
        onClose={() => setDeleteTarget(null)} 
        onConfirm={handleDelete}
        title={t('adminCategories.deleteDialog.title')} 
        message={
          <div>
            <p>{t('adminCategories.deleteDialog.message', { name: deleteTarget?.name })}</p>
            {deleteTarget?.equipment_count > 0 && (
              <p className="text-red-500 text-sm mt-2">
                {t('adminCategories.deleteDialog.warning', { count: deleteTarget.equipment_count })}
              </p>
            )}
          </div>
        }
        confirmText={t('common.delete')}
        cancelText={t('common.cancel')}
        variant="danger"
      />
    </div>
  );
}