import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { equipmentService } from '../../services/equipmentService';
import { categoryService, uploadService } from '../../services';
import { Button, Modal, SectionHeader, ConfirmDialog, Input, Select, Textarea, StatusBadge, FormRow, Spinner } from '../../components/ui';
import { useDropzone } from 'react-dropzone';
import { Edit, Trash2, Eye, MapPin, Star, X, Upload, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import clsx from 'clsx';
const CONDITIONS = ['excellent', 'good', 'fair'];
const CITIES = ['Addis Ababa','Dire Dawa','Hawassa','Bahir Dar','Mekelle','Adama','Gondar','Jimma','Dessie','Jijiga'];
export default function OwnerMyEquipment() {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newImages, setNewImages] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm();
  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      // Get current user from localStorage
      const userStr = localStorage.getItem('equiprent_user');
      const user = userStr ? JSON.parse(userStr) : null;
      if (!user || user.role !== 'owner') {
        setEquipment([]);
        setLoading(false);
        return;
      }
      // Get all equipment and filter by owner_id
      const { data } = await equipmentService.getAll({ limit: 100 });
      const allEquipment = data.data || [];
      // Filter equipment for current owner only
      const myEquipment = allEquipment.filter(eq => eq.owner_id === user.id);
      setEquipment(myEquipment);
    } catch (error) {
      setEquipment([]);
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    fetch();
    categoryService.getAll({ active: true })
      .then(r => setCategories(r.data.data || []))
      .catch(() => {});
  }, [fetch]);
  const openEdit = (item) => {
    setEditItem(item);
    setExistingImages(item.images || []);
    setNewImages([]);
    reset({
      name: item.name, brand: item.brand, model: item.model,
      year: item.year, condition: item.condition, category_id: item.category_id,
      description: item.description,
      price_per_hour: item.price_per_hour || '',
      price_per_day: item.price_per_day || '',
      price_per_week: item.price_per_week || '',
      price_per_month: item.price_per_month || '',
      deposit_required: item.deposit_required || '',
      min_rental_days: item.min_rental_days || 1,
      city: item.city, specific_address: item.specific_address || '',
      delivery_available: item.delivery_available ? 'true' : 'false',
      delivery_radius_km: item.delivery_radius_km || '',
      attachments: item.attachments?.join(', ') || '',
      spec_weight: item.specifications?.weight || '',
      spec_engine: item.specifications?.engine || '',
      spec_power: item.specifications?.power || '',
      spec_max_reach: item.specifications?.max_reach || '',
    });
    setEditOpen(true);
  };
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': [] }, multiple: true, maxFiles: 10,
    onDrop: files => setNewImages(p => [...p, ...files].slice(0, 10 - existingImages.length)),
  });
  const removeExistingImage = (url) => setExistingImages(p => p.filter(u => u !== url));
  const removeNewImage = (idx) => setNewImages(p => p.filter((_, i) => i !== idx));
  const onSave = async (data) => {
    setSaving(true);
    try {
      let uploadedUrls = [];
      if (newImages.length > 0) {
        setUploading(true);
        const r = await uploadService.multiple(newImages, 'image');
        uploadedUrls = r.data.data.urls || [];
        setUploading(false);
      }
      const allImages = [...existingImages, ...uploadedUrls];
      const payload = {
        name: data.name, brand: data.brand, model: data.model,
        year: data.year ? Number(data.year) : null,
        condition: data.condition, category_id: data.category_id,
        description: data.description,
        price_per_hour: data.price_per_hour ? Number(data.price_per_hour) : null,
        price_per_day: data.price_per_day ? Number(data.price_per_day) : null,
        price_per_week: data.price_per_week ? Number(data.price_per_week) : null,
        price_per_month: data.price_per_month ? Number(data.price_per_month) : null,
        deposit_required: data.deposit_required ? Number(data.deposit_required) : null,
        min_rental_days: data.min_rental_days ? Number(data.min_rental_days) : 1,
        city: data.city, specific_address: data.specific_address,
        delivery_available: data.delivery_available === 'true',
        delivery_radius_km: data.delivery_radius_km ? Number(data.delivery_radius_km) : null,
        attachments: data.attachments ? data.attachments.split(',').map(s => s.trim()).filter(Boolean) : [],
        specifications: {
          weight: data.spec_weight, engine: data.spec_engine,
          power: data.spec_power, max_reach: data.spec_max_reach,
        },
        images: allImages,
      };
      await equipmentService.update(editItem.id, payload);
      toast.success('Equipment updated! Admin has been notified.');
      setEditOpen(false);
      fetch();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Update failed');
    } finally { setSaving(false); setUploading(false); }
  };
  const handleDelete = async () => {
    try {
      await equipmentService.delete(deleteTarget.id);
      toast.success('Equipment removed successfully');
      setDeleteTarget(null);
      fetch();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };
  const condBadge = { excellent: 'badge-success', good: 'badge-info', fair: 'badge-warning' };
  return (
    <div className="space-y-5">
      <SectionHeader title="My Equipment" subtitle={`${equipment.length} equipment listings`}
        action={
          <Button onClick={() => navigate('/owner/add-equipment')}>
            <Plus className="w-4 h-4" /> Add Equipment
          </Button>
        }
      />
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton aspect-[16/9]" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : equipment.length === 0 ? (
        <div className="card p-16 text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h3 className="text-lg font-bold text-[var(--text)] mb-2" style={{ fontFamily: 'Syne,sans-serif' }}>No Equipment Yet</h3>
          <p className="text-[var(--text-secondary)] text-sm mb-5">Start by adding your first equipment listing.</p>
          <Button onClick={() => navigate('/owner/add-equipment')}>
            <Plus className="w-4 h-4" /> Add First Equipment
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {equipment.map(eq => (
            <div key={eq.id} className="card overflow-hidden group hover:border-brand-500 transition-all duration-300">
              {/* Image */}
              <div className="relative aspect-[16/9] bg-[var(--bg-secondary)] overflow-hidden">
                {eq.images?.[0]
                  ? <img src={eq.images[0]} alt={eq.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">⚙️</div>}
                <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                  <StatusBadge status={eq.status} />
                  {!eq.is_approved && <span className="badge badge-warning">Pending</span>}
                </div>
              </div>
              {/* Info */}
              <div className="p-4">
                <h3 className="font-bold text-[var(--text)] text-sm truncate" style={{ fontFamily: 'Syne,sans-serif' }}>{eq.name}</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{eq.brand} {eq.model} {eq.year && `· ${eq.year}`}</p>
                <div className="flex items-center gap-2 mt-2 mb-3 flex-wrap">
                  <span className={clsx('badge text-xs', condBadge[eq.condition] || 'badge-neutral')}>{eq.condition}</span>
                  <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                    <MapPin className="w-3 h-3" />{eq.city}
                  </span>
                  {eq.avg_rating > 0 && (
                    <span className="flex items-center gap-1 text-xs text-amber-500">
                      <Star className="w-3 h-3 fill-amber-400" />{Number(eq.avg_rating).toFixed(1)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-base font-bold text-brand-500" style={{ fontFamily: 'Syne,sans-serif' }}>
                      ETB {Number(eq.price_per_day || 0).toLocaleString()}
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">/day</span>
                  </div>
                  <span className="text-xs text-[var(--text-muted)]">{eq.total_bookings || 0} bookings</span>
                </div>
                {/* Actions */}
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => openEdit(eq)}>
                    <Edit className="w-3.5 h-3.5" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/equipment/${eq.id}`)}>
                    <Eye className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={() => setDeleteTarget(eq)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={`Edit — ${editItem?.name}`} size="xl"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit(onSave)} loading={saving || uploading}>
              {uploading ? 'Uploading images…' : 'Save Changes'}
            </Button>
          </>
        }>
        <form className="space-y-5">
          {/* Basic */}
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3" style={{ fontFamily: 'Syne,sans-serif' }}>Basic Info</p>
            <div className="space-y-3">
              <Input label="Equipment Name *" error={errors.name?.message}
                {...register('name', { required: 'Required' })} />
              <FormRow>
                <Input label="Brand" {...register('brand')} />
                <Input label="Model" {...register('model')} />
              </FormRow>
              <FormRow>
                <Input label="Year" type="number" min="1990" {...register('year')} />
                <Select label="Condition" {...register('condition')}>
                  {CONDITIONS.map(c => <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </Select>
              </FormRow>
              <Select label="Category" error={errors.category_id?.message} {...register('category_id', { required: 'Required' })}>
                <option value="">Select category</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </Select>
              <Textarea label="Description" rows={3} {...register('description')} />
              <Input label="Attachments (comma-separated)" placeholder="Hydraulic Hammer, Bucket" {...register('attachments')} />
            </div>
          </div>
          {/* Specs */}
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3" style={{ fontFamily: 'Syne,sans-serif' }}>Specifications</p>
            <FormRow>
              <Input label="Weight" placeholder="20 tons" {...register('spec_weight')} />
              <Input label="Engine" placeholder="CAT C7.1" {...register('spec_engine')} />
            </FormRow>
            <FormRow>
              <Input label="Power" placeholder="148 kW" {...register('spec_power')} />
              <Input label="Max Reach" placeholder="9.6 m" {...register('spec_max_reach')} />
            </FormRow>
          </div>
          {/* Pricing */}
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3" style={{ fontFamily: 'Syne,sans-serif' }}>Pricing (ETB)</p>
            <FormRow>
              <Input label="Per Hour" type="number" {...register('price_per_hour')} />
              <Input label="Per Day *" type="number" error={errors.price_per_day?.message}
                {...register('price_per_day', { required: 'Required' })} />
            </FormRow>
            <FormRow>
              <Input label="Per Week" type="number" {...register('price_per_week')} />
              <Input label="Per Month" type="number" {...register('price_per_month')} />
            </FormRow>
            <FormRow>
              <Input label="Security Deposit" type="number" {...register('deposit_required')} />
              <Input label="Min Rental Days" type="number" min="1" {...register('min_rental_days')} />
            </FormRow>
          </div>
          {/* Location */}
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3" style={{ fontFamily: 'Syne,sans-serif' }}>Location</p>
            <Select label="City" {...register('city')}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </Select>
            <div className="mt-3">
              <Input label="Specific Address" placeholder="Bole, near airport" {...register('specific_address')} />
            </div>
            <div className="mt-3">
              <Select label="Delivery Available" {...register('delivery_available')}>
                <option value="false">No — Customer picks up</option>
                <option value="true">Yes — I can deliver</option>
              </Select>
            </div>
            {watch('delivery_available') === 'true' && (
              <div className="mt-3">
                <Input label="Delivery Radius (km)" type="number" {...register('delivery_radius_km')} />
              </div>
            )}
          </div>
          {/* Images */}
          <div>
            <p className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3" style={{ fontFamily: 'Syne,sans-serif' }}>Images</p>
            {/* Existing images */}
            {existingImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {existingImages.map((url, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-[var(--border)]">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeExistingImage(url)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {/* New image dropzone */}
            <div {...getRootProps()} className="border-2 border-dashed border-[var(--border)] hover:border-brand-500 rounded-xl p-5 text-center cursor-pointer transition-colors">
              <input {...getInputProps()} />
              <Upload className="w-6 h-6 text-[var(--text-muted)] mx-auto mb-1.5" />
              <p className="text-sm text-[var(--text-secondary)]">Drop new images or <span className="text-brand-500 font-semibold">click to browse</span></p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Add up to {10 - existingImages.length} more images</p>
            </div>
            {newImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {newImages.map((f, i) => (
                  <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-brand-300">
                    <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeNewImage(i)}
                      className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center">
                      <X className="w-3 h-3" />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-brand-500/80 text-white text-[9px] text-center py-0.5">NEW</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>
      </Modal>
      {/* Delete confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Equipment"
        message={`Permanently remove "${deleteTarget?.name}"? All bookings and data for this equipment will be affected.`}
      />
    </div>
  );
}