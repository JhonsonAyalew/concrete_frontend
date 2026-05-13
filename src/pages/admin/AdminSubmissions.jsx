import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ownerEquipmentService, categoryService, uploadService, userService } from '../../services';
import {
  Button, StatusBadge, Tabs, SearchInput,
  Pagination, SectionHeader, Input, Select, Textarea
} from '../../components/ui';
import {
  Eye, CheckCircle, XCircle, Trash2, ArrowLeft,
  MapPin, DollarSign, Wrench, X, Edit, Upload,
  Phone, Mail, Building, Shield, Calendar, User,
  Package, Clock, Star, ChevronRight, ImageIcon,
  AlertCircle, Info, Layers,FileText, FileImage, File, FileArchive, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import clsx from 'clsx';
import { useDropzone } from 'react-dropzone';
// ─── Constants ────────────────────────────────────────────
const TABS = [
  { value: 'pending',  labelKey: 'pending'   },
  { value: 'review',   labelKey: 'inReview'  },
  { value: 'approved', labelKey: 'approved'  },
  { value: 'rejected', labelKey: 'rejected'  },
  { value: '',         labelKey: 'all'        },
];
const CONDITIONS  = ['excellent', 'good', 'fair', 'poor', 'new'];
const CITIES      = [
  'Addis Ababa','Dire Dawa','Hawassa','Bahir Dar','Mekelle',
  'Adama','Gondar','Jimma','Dessie','Jijiga',
];
// ─── Status colour helper ─────────────────────────────────
const statusMeta = (status) => {
  const map = {
    pending:  { dot: 'bg-amber-400',  text: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20'  },
    review:   { dot: 'bg-blue-400',   text: 'text-blue-600 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/20'    },
    approved: { dot: 'bg-green-400',  text: 'text-green-600 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-900/20'  },
    rejected: { dot: 'bg-red-400',    text: 'text-red-600 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-900/20'      },
  };
  return map[status] || { dot: 'bg-gray-400', text: 'text-gray-600', bg: 'bg-gray-50' };
};
// ─── Reusable Info Row ────────────────────────────────────
function InfoCard({ label, value, icon: Icon, accent }) {
  return (
    <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] group hover:border-brand-400/40 transition-all duration-200">
      {Icon && (
        <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center mb-2', accent || 'bg-brand-100 dark:bg-brand-900/30')}>
          <Icon className="w-3.5 h-3.5 text-brand-500" />
        </div>
      )}
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-[var(--text)] leading-snug">{value || '—'}</p>
    </div>
  );
}
// ─── Section heading inside modals/detail views ───────────
function SectionLabel({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="w-6 h-6 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5 text-brand-500" />
      </div>
      <h4 className="text-sm font-bold text-[var(--text)] tracking-tight">{children}</h4>
      <div className="flex-1 h-px bg-[var(--border)]" />
    </div>
  );
}
// ═══════════════════════════════════════════════════════════
// OWNER DETAIL VIEW  (from file 2 — fully preserved)
// ═══════════════════════════════════════════════════════════
function OwnerDetailView({ ownerId, onBack }) {
  const { t } = useTranslation();
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    userService.getById(ownerId)
      .then(r => setOwner(r.data?.data || r.data))
      .catch(() => setOwner(null))
      .finally(() => setLoading(false));
  }, [ownerId]);
  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!owner) return (
    <div className="text-center py-24 space-y-3">
      <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mx-auto">
        <User className="w-8 h-8 text-[var(--text-muted)]" />
      </div>
      <p className="text-[var(--text-muted)] font-medium">Owner not found</p>
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back
      </Button>
    </div>
  );
  return (
    <div className="animate-fade-in space-y-5">
      {/* Back */}
      <button
        onClick={onBack}
        className="group flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-brand-500 transition-colors font-medium"
      >
        <div className="w-7 h-7 rounded-xl bg-[var(--bg-secondary)] group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 flex items-center justify-center transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
        </div>
        Back to Submissions
      </button>
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left — avatar card */}
        <div className="space-y-4">
          <div className="card p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 via-transparent to-brand-600/5 pointer-events-none" />
            <div className="relative">
              {owner.avatar_url ? (
                <img src={owner.avatar_url} alt={owner.name}
                  className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4 ring-4 ring-brand-100 dark:ring-brand-900/40" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 ring-4 ring-brand-100 dark:ring-brand-900/40">
                  {owner.name?.charAt(0).toUpperCase()}
                </div>
              )}
              <h2 className="text-lg font-bold text-[var(--text)] mb-0.5">{owner.name}</h2>
              <p className="text-sm text-[var(--text-muted)] mb-1">{owner.email}</p>
              {owner.company_name && (
                <p className="text-sm text-brand-500 flex items-center justify-center gap-1 font-medium">
                  <Building className="w-3.5 h-3.5" />{owner.company_name}
                </p>
              )}
              <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                <StatusBadge status={owner.status} />
                {owner.id_verified
                  ? <span className="badge badge-success flex items-center gap-1 text-xs"><Shield className="w-3 h-3" />Verified</span>
                  : <span className="badge badge-warning text-xs">Unverified</span>}
              </div>
            </div>
          </div>
          {/* Account status card */}
          <div className="card p-4 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Account Status</p>
            {[
              ['Status',         owner.status],
              ['Email Verified', owner.email_verified ? 'Yes' : 'No'],
              ['ID Verified',    owner.id_verified    ? 'Yes' : 'No'],
              ['Role',           owner.role || '—'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center justify-between py-1.5 border-b border-[var(--border)] last:border-0">
                <span className="text-xs text-[var(--text-muted)]">{k}</span>
                <span className={clsx('text-xs font-semibold capitalize',
                  v === 'Yes' ? 'text-green-500' : v === 'No' ? 'text-red-500' : 'text-[var(--text)]'
                )}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Right — details */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5">
            <SectionLabel icon={Phone}>Contact Information</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="Email"   value={owner.email}        icon={Mail}     />
              <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-brand-400/40 transition-all">
                <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-2">
                  <Phone className="w-3.5 h-3.5 text-brand-500" />
                </div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">Phone</p>
                {owner.phone ? (
                  <a href={`tel:${owner.phone.replace(/\D/g,'')}`}
                    className="text-sm font-semibold text-brand-500 hover:text-brand-600 hover:underline flex items-center gap-1">
                    {owner.phone} <Phone className="w-3 h-3" />
                  </a>
                ) : <p className="text-sm font-semibold text-[var(--text)]">—</p>}
              </div>
              <InfoCard label="City"    value={owner.city}         icon={MapPin}   />
              <InfoCard label="Company" value={owner.company_name} icon={Building} />
              <InfoCard label="Joined"  value={owner.created_at ? format(new Date(owner.created_at), 'dd MMM yyyy') : '—'} icon={Calendar} />
              <InfoCard label="ID Type" value={owner.id_type || '—'} icon={Shield} />
            </div>
          </div>
          {owner.bio && (
            <div className="card p-5">
              <SectionLabel icon={Info}>About</SectionLabel>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{owner.bio}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════
// EQUIPMENT DETAIL VIEW  (from file 2 — fully preserved + enhanced)
// ═══════════════════════════════════════════════════════════
function EquipmentDetailView({ submission, onBack }) {
  const [imgIdx, setImgIdx] = useState(0);
  const images = Array.isArray(submission.images)
    ? submission.images
    : submission.images ? [submission.images] : [];
  const sm = statusMeta(submission.status);
// Add this state near other useState declarations (around line 285)
const [selectedDoc, setSelectedDoc] = useState(null);
// Add this helper function to get file icon
const getFileIcon = (url) => {
  const ext = url?.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return <FileText className="w-4 h-4" />;
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext)) return <FileImage className="w-4 h-4" />;
  if (['zip', 'rar', '7z'].includes(ext)) return <FileArchive className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
};
// Add this helper to get readable filename
const getFileName = (url) => {
  return url?.split('/').pop() || 'document';
};
  return (
    <div className="animate-fade-in space-y-5">
      {/* Back */}
      <button
        onClick={onBack}
        className="group flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-brand-500 transition-colors font-medium"
      >
        <div className="w-7 h-7 rounded-xl bg-[var(--bg-secondary)] group-hover:bg-brand-50 dark:group-hover:bg-brand-900/30 flex items-center justify-center transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
        </div>
        Back to Submissions
      </button>
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="space-y-4">
          {/* Image gallery */}
          <div className="card overflow-hidden">
            <div className="relative aspect-video bg-[var(--bg-secondary)]">
              {images.length > 0 ? (
                <img src={images[imgIdx]} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
                  <Package className="w-12 h-12 opacity-30" />
                  <p className="text-xs">No images</p>
                </div>
              )}
              {/* Image count badge */}
              {images.length > 0 && (
                <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-lg backdrop-blur-sm">
                  {imgIdx + 1} / {images.length}
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="p-2 flex gap-1.5 overflow-x-auto bg-[var(--bg-secondary)]">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setImgIdx(i)}
                    className={clsx(
                      'w-14 h-10 rounded-lg overflow-hidden shrink-0 border-2 transition-all duration-200',
                      i === imgIdx ? 'border-brand-500 scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                    )}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
{/* Documents Section */}
{submission.documents && submission.documents.length > 0 && (
  <div className="card p-4">
    <div className="flex items-center justify-between mb-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
        Documents ({submission.documents.length})
      </p>
    </div>
    <div className="space-y-1.5">
      {submission.documents.map((doc, idx) => (
        <a
          key={idx}
          href={doc}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] hover:border-brand-400/40 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all group cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-500 group-hover:scale-105 transition-transform">
            {getFileIcon(doc)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-[var(--text)] truncate group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
              {doc?.split('/').pop() || 'Document'}
            </p>
            <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
              Open in new tab <ExternalLink className="w-2.5 h-2.5 opacity-60" />
            </p>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
        </a>
      ))}
    </div>
  </div>
)}
          {/* Status + meta card */}
          <div className="card p-4 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Submission Info</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">Status</span>
              <StatusBadge status={submission.status} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--text-secondary)]">Submitted</span>
              <span className="text-xs font-semibold text-[var(--text)]">
                {submission.created_at ? format(new Date(submission.created_at), 'dd MMM yyyy') : '—'}
              </span>
            </div>
            {submission.reviewed_at && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Reviewed</span>
                <span className="text-xs font-semibold text-[var(--text)]">
                  {format(new Date(submission.reviewed_at), 'dd MMM yyyy')}
                </span>
              </div>
            )}
            {submission.reviewed_by_name && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-[var(--text-secondary)]">Reviewed by</span>
                <span className="text-xs font-semibold text-brand-500">{submission.reviewed_by_name}</span>
              </div>
            )}
          </div>
          {/* Owner mini card */}
          {(submission.owner_name || submission.owner_email) && (
            <div className="card p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3">Owner</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                  {submission.owner_name?.charAt(0).toUpperCase() || 'O'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[var(--text)] truncate">{submission.owner_name || '—'}</p>
                  <p className="text-xs text-[var(--text-muted)] truncate">{submission.owner_email || '—'}</p>
                </div>
              </div>
              {submission.owner_phone && (
                <a href={`tel:${submission.owner_phone.replace(/\D/g,'')}`}
                  className="mt-3 flex items-center gap-2 text-xs text-brand-500 hover:text-brand-600 font-medium">
                  <Phone className="w-3.5 h-3.5" />{submission.owner_phone}
                </a>
              )}
            </div>
          )}
          {/* Rejection reason */}
          {submission.rejection_reason && (
            <div className="card p-4 border-l-4 border-red-400">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="text-xs font-bold text-red-600">Rejection Reason</p>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{submission.rejection_reason}</p>
            </div>
          )}
          {/* Review note */}
          {submission.review_note && (
            <div className="card p-4 border-l-4 border-brand-400">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-brand-500" />
                <p className="text-xs font-bold text-brand-600">Review Note</p>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{submission.review_note}</p>
            </div>
          )}
        </div>
        {/* Right — details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header card */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-[var(--text)] leading-tight">{submission.name}</h2>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">
                  {[submission.brand, submission.model, submission.year].filter(Boolean).join(' · ')}
                </p>
              </div>
              {submission.category_name && (
                <span className="badge badge-info text-xs shrink-0">{submission.category_icon} {submission.category_name}</span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoCard label="Brand"     value={submission.brand}     />
              <InfoCard label="Model"     value={submission.model}     />
              <InfoCard label="Year"      value={submission.year}      />
              <InfoCard label="Condition" value={submission.condition} />
            </div>
            {submission.description && (
              <div className="mt-4 p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-1">Description</p>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{submission.description}</p>
              </div>
            )}
          </div>
          {/* Pricing */}
          <div className="card p-5">
            <SectionLabel icon={DollarSign}>Pricing (ETB)</SectionLabel>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                ['Per Hour',    submission.price_per_hour ],
                ['Per Day',     submission.price_per_day  ],
                ['Per Week',    submission.price_per_week ],
                ['Per Month',   submission.price_per_month],
                ['Deposit',     submission.deposit_required],
                ['Min Days',    submission.min_rental_days],
              ].map(([k, v]) => (
                <div key={k} className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-0.5">{k}</p>
                  <p className={clsx('text-sm font-bold', v ? 'text-brand-500' : 'text-[var(--text-muted)]')}>
                    {v ? (k === 'Min Days' ? `${v} day(s)` : `ETB ${Number(v).toLocaleString()}`) : '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {/* Location */}
          <div className="card p-5">
            <SectionLabel icon={MapPin}>Location & Delivery</SectionLabel>
            <div className="grid grid-cols-2 gap-3">
              <InfoCard label="City"              value={submission.city}                                          icon={MapPin}  />
              <InfoCard label="Address"           value={submission.specific_address}                              icon={MapPin}  />
              <InfoCard label="Delivery"          value={submission.delivery_available ? 'Available' : 'Pickup Only'} icon={Package} />
              <InfoCard label="Delivery Radius"   value={submission.delivery_radius_km ? `${submission.delivery_radius_km} km` : null} icon={MapPin} />
            </div>
          </div>
          {/* Availability */}
          {(submission.available_from || submission.available_to) && (
            <div className="card p-5">
              <SectionLabel icon={Calendar}>Availability</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <InfoCard label="Available From" value={submission.available_from ? format(new Date(submission.available_from), 'dd MMM yyyy') : null} icon={Calendar} />
                <InfoCard label="Available To"   value={submission.available_to   ? format(new Date(submission.available_to),   'dd MMM yyyy') : null} icon={Calendar} />
              </div>
            </div>
          )}
          {/* Specifications */}
          {submission.specifications && Object.keys(submission.specifications).some(k => submission.specifications[k]) && (
            <div className="card p-5">
              <SectionLabel icon={Wrench}>Technical Specifications</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(submission.specifications)
                  .filter(([, v]) => v)
                  .map(([k, v]) => (
                    <InfoCard key={k} label={k.replace(/_/g, ' ')} value={String(v)} icon={Wrench} />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════
// EDIT & APPROVE MODAL
// ═══════════════════════════════════════════════════════════
function EditAndApproveModal({ submission, onClose, onDone }) {
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(false);
  const [uploading, setUploading]       = useState(false);
  const [activeTab, setActiveTab]       = useState('basic');
  const [existingImages, setExistingImages] = useState(() => {
    if (Array.isArray(submission.images))                          return [...submission.images];
    if (typeof submission.images === 'string' && submission.images) return [submission.images];
    return [];
  });
  const [newImages,      setNewImages]      = useState([]);
  const [imagePreviews,  setImagePreviews]  = useState([]);
  const [formData, setFormData] = useState({
    name:               submission.name               || '',
    brand:              submission.brand              || '',
    model:              submission.model              || '',
    year:               submission.year               || '',
    condition:          submission.condition          || '',
    category_id:        submission.category_id        || '',
    description:        submission.description        || '',
    price_per_hour:     submission.price_per_hour     || '',
    price_per_day:      submission.price_per_day      || '',
    price_per_week:     submission.price_per_week     || '',
    price_per_month:    submission.price_per_month    || '',
    deposit_required:   submission.deposit_required   || '',
    min_rental_days:    submission.min_rental_days    || 1,
    city:               submission.city               || '',
    specific_address:   submission.specific_address   || '',
    delivery_available: submission.delivery_available || false,
    delivery_radius_km: submission.delivery_radius_km || '',
  });
  const [note, setNote] = useState('');
  const set = (k, v) => setFormData(p => ({ ...p, [k]: v }));
  useEffect(() => {
    categoryService.getAll({ active: true })
      .then(r => setCategories(r.data?.data || r.data || []))
      .catch(() => {});
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'] },
    multiple: true, maxFiles: 10,
    onDrop: files => {
      setNewImages(p => [...p, ...files]);
      setImagePreviews(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
    },
  });
  const removeExisting = i => setExistingImages(p => p.filter((_, idx) => idx !== i));
  const removeNew = i => {
    URL.revokeObjectURL(imagePreviews[i]);
    setNewImages(p => p.filter((_, idx) => idx !== i));
    setImagePreviews(p => p.filter((_, idx) => idx !== i));
  };
  const handleSubmit = async () => {
    if (!formData.name || !formData.brand || !formData.price_per_day || !formData.city) {
      toast.error('Name, brand, price/day and city are required');
      return;
    }
    setLoading(true); setUploading(true);
    try {
      let uploadedUrls = [];
      if (newImages.length > 0) {
        const result = await uploadService.multiple(newImages, 'image');
// Handle both { urls: [...] } and { data: { urls: [...] } }
uploadedUrls = result.data?.data?.urls 
           || result.data?.urls 
           || result.urls 
           || [];
      }
      setUploading(false);
      // Always include images (fix — even if empty array)
      const finalImages = [...existingImages, ...uploadedUrls];
      const payload = { note: note.trim() || undefined };
      if (formData.name)               payload.name               = formData.name;
      if (formData.brand)              payload.brand              = formData.brand;
      if (formData.model)              payload.model              = formData.model;
      if (formData.year)               payload.year               = String(formData.year);
      if (formData.condition)          payload.condition          = formData.condition;
      if (formData.category_id)        payload.category_id        = formData.category_id;
      if (formData.description)        payload.description        = formData.description;
      if (formData.price_per_day)      payload.price_per_day      = String(parseFloat(formData.price_per_day).toFixed(2));
      if (formData.price_per_hour)     payload.price_per_hour     = String(parseFloat(formData.price_per_hour).toFixed(2));
      if (formData.price_per_week)     payload.price_per_week     = String(parseFloat(formData.price_per_week).toFixed(2));
      if (formData.price_per_month)    payload.price_per_month    = String(parseFloat(formData.price_per_month).toFixed(2));
      if (formData.deposit_required)   payload.deposit_required   = String(parseFloat(formData.deposit_required).toFixed(2));
      if (formData.min_rental_days)    payload.min_rental_days    = String(formData.min_rental_days);
      if (formData.city)               payload.city               = formData.city;
      if (formData.specific_address)   payload.specific_address   = formData.specific_address;
      payload.delivery_available = formData.delivery_available === 'true' || formData.delivery_available === true;
      if (formData.delivery_radius_km) payload.delivery_radius_km = String(formData.delivery_radius_km);
      // ✅ ALWAYS send images array
      payload.images = finalImages;
      await ownerEquipmentService.approve(submission.id, payload);
      toast.success(`"${formData.name}" approved and published!`);
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    } finally {
      setLoading(false); setUploading(false);
    }
  };
  const MODAL_TABS = [
    { id: 'basic',    label: 'Basic Info',  icon: Package    },
    { id: 'pricing',  label: 'Pricing',     icon: DollarSign },
    { id: 'location', label: 'Location',    icon: MapPin     },
    { id: 'images',   label: 'Images',      icon: ImageIcon  },
  ];
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-4xl max-h-[92vh] flex flex-col animate-scale-in">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-[var(--bg)] border-b border-[var(--border)] px-6 pt-5 pb-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
                Edit & Approve Equipment
              </h3>
              <p className="text-xs text-[var(--text-muted)] mt-1 ml-10">Review and edit before publishing to public</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors">
              <X className="w-4 h-4 text-[var(--text-muted)]" />
            </button>
          </div>
          {/* Tab bar */}
          <div className="flex gap-1">
            {MODAL_TABS.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={clsx(
                  'flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-t-xl border-b-2 transition-all',
                  activeTab === tab.id
                    ? 'text-brand-600 border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'text-[var(--text-muted)] border-transparent hover:text-[var(--text)] hover:bg-[var(--bg-secondary)]'
                )}>
                <tab.icon className="w-3.5 h-3.5" />{tab.label}
              </button>
            ))}
          </div>
        </div>
        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* ── Basic Info ── */}
          {activeTab === 'basic' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 flex items-center gap-3">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                  Approving will immediately publish this equipment to the public marketplace.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Name *"  value={formData.name}    onChange={e => set('name', e.target.value)} />
                <Input label="Brand *" value={formData.brand}   onChange={e => set('brand', e.target.value)} />
                <Input label="Model"   value={formData.model}   onChange={e => set('model', e.target.value)} />
                <Input label="Year" type="number" value={formData.year} onChange={e => set('year', e.target.value)} />
                <Select label="Condition" value={formData.condition} onChange={e => set('condition', e.target.value)}>
                  <option value="">Select condition</option>
                  {CONDITIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </Select>
                <Select label="Category" value={formData.category_id} onChange={e => set('category_id', e.target.value)}>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
                </Select>
              </div>
              <Textarea label="Description" rows={3} value={formData.description} onChange={e => set('description', e.target.value)} />
              <div>
                <label className="label">Note for Owner (Optional)</label>
                <textarea
                  value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Optional message to the owner about any changes..."
                  className="input-field w-full resize-none" rows={2}
                />
              </div>
            </div>
          )}
          {/* ── Pricing ── */}
          {activeTab === 'pricing' && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Price / Day *" type="number" value={formData.price_per_day}    onChange={e => set('price_per_day', e.target.value)} />
                <Input label="Price / Hour"  type="number" value={formData.price_per_hour}   onChange={e => set('price_per_hour', e.target.value)} />
                <Input label="Price / Week"  type="number" value={formData.price_per_week}   onChange={e => set('price_per_week', e.target.value)} />
                <Input label="Price / Month" type="number" value={formData.price_per_month}  onChange={e => set('price_per_month', e.target.value)} />
                <Input label="Deposit"       type="number" value={formData.deposit_required} onChange={e => set('deposit_required', e.target.value)} />
                <Input label="Min Rental Days" type="number" value={formData.min_rental_days} onChange={e => set('min_rental_days', e.target.value)} />
              </div>
            </div>
          )}
          {/* ── Location ── */}
          {activeTab === 'location' && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-2 gap-4">
                <Select label="City *" value={formData.city} onChange={e => set('city', e.target.value)}>
                  <option value="">Select city</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
                <Input label="Specific Address" value={formData.specific_address} onChange={e => set('specific_address', e.target.value)} />
                <Select label="Delivery" value={formData.delivery_available} onChange={e => set('delivery_available', e.target.value)}>
                  <option value="false">No — Pickup Only</option>
                  <option value="true">Yes — Delivery Available</option>
                </Select>
                <Input label="Delivery Radius (km)" type="number" value={formData.delivery_radius_km} onChange={e => set('delivery_radius_km', e.target.value)} />
              </div>
            </div>
          )}
          {/* ── Images ── */}
          {activeTab === 'images' && (
            <div className="animate-fade-in space-y-4">
              {existingImages.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Current Images ({existingImages.length})
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {existingImages.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-[var(--border)] group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                        <button type="button" onClick={() => removeExisting(i)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Dropzone */}
              <div {...getRootProps()}
                className={clsx(
                  'border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200',
                  isDragActive
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-[var(--border)] hover:border-brand-400 hover:bg-[var(--bg-secondary)]'
                )}>
                <input {...getInputProps()} />
                <div className="w-12 h-12 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mx-auto mb-3">
                  <Upload className={clsx('w-6 h-6', isDragActive ? 'text-brand-500' : 'text-[var(--text-muted)]')} />
                </div>
                <p className="text-sm font-medium text-[var(--text)]">
                  {isDragActive ? 'Drop images here' : 'Drag & drop new images'}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">JPEG, PNG, WebP — max 10 files</p>
              </div>
              {imagePreviews.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    New Images ({imagePreviews.length})
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {imagePreviews.map((url, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border-2 border-brand-300 group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all" />
                        <button type="button" onClick={() => removeNew(i)}
                          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {existingImages.length === 0 && imagePreviews.length === 0 && (
                <p className="text-center text-xs text-[var(--text-muted)] py-2">No images — equipment will be published without images.</p>
              )}
            </div>
          )}
        </div>
        {/* Footer */}
        <div className="border-t border-[var(--border)] p-5 flex items-center gap-3 bg-[var(--bg)]">
          <div className="flex-1 flex gap-1">
            {MODAL_TABS.map((tab, i) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={clsx('h-1.5 rounded-full transition-all', activeTab === tab.id ? 'bg-brand-500 w-6' : 'bg-[var(--border)] w-3')} />
            ))}
          </div>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading || uploading}
            className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2">
            {uploading ? 'Uploading…' : loading ? 'Approving…' : (
              <><CheckCircle className="w-4 h-4" /> Save & Approve</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════
// REJECT MODAL
// ═══════════════════════════════════════════════════════════
function RejectModal({ submission, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const handleReject = async () => {
    if (!reason.trim()) { toast.error('Rejection reason is required'); return; }
    setLoading(true);
    try {
      // ✅ Fixed: send { reason } not { rejection_reason, review_note }
      await ownerEquipmentService.reject(submission.id, reason);
      toast.success('Submission rejected');
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally { setLoading(false); }
  };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="card w-full max-w-md animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h3 className="font-bold text-[var(--text)] flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
            Reject Submission
          </h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg-secondary)]">
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="p-3 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)]">Equipment</p>
            <p className="text-sm font-semibold text-[var(--text)]">{submission.name}</p>
            <p className="text-xs text-[var(--text-muted)]">{submission.owner_name}</p>
          </div>
          <div>
            <label className="label">Rejection Reason *</label>
            <textarea
              value={reason} onChange={e => setReason(e.target.value)}
              placeholder="Explain why this submission is being rejected..."
              className="input-field w-full resize-none" rows={4}
              autoFocus
            />
            <p className="text-xs text-[var(--text-muted)] mt-1">This message will be sent to the owner.</p>
          </div>
        </div>
        <div className="flex gap-3 p-5 border-t border-[var(--border)]">
          <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="danger" onClick={handleReject} loading={loading} className="flex-1 flex items-center gap-2 justify-center">
            <XCircle className="w-4 h-4" /> Reject
          </Button>
        </div>
      </div>
    </div>
  );
}
// ═══════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════
export default function AdminSubmissions() {
  const { t } = useTranslation();
  const [submissions,        setSubmissions]        = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [tab,                setTab]                = useState('pending');
  const [search,             setSearch]             = useState('');
  const [page,               setPage]               = useState(1);
  const [total,              setTotal]              = useState(0);
  // Mini-page views (owner or equipment detail)
  const [view,               setView]               = useState(null); // { type: 'owner'|'equipment', ... }
  // Modals
  const [editApproveTarget,  setEditApproveTarget]  = useState(null);
  const [rejectTarget,       setRejectTarget]        = useState(null);
  const [deleteTarget,       setDeleteTarget]        = useState(null);
  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ownerEquipmentService.getAll({
        status: tab || undefined,
        search: search || undefined,
        page,
        limit: 15,
      });
      const data = response.data || response;
      setSubmissions(data.data || data || []);
      setTotal(data.total || 0);
    } catch {
      toast.error('Failed to load submissions');
    } finally { setLoading(false); }
  }, [tab, search, page]);
  useEffect(() => { fetchSubmissions(); }, [fetchSubmissions]);
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
  const TABS_CONFIG = TABS.map(tabItem => ({
    value: tabItem.value,
    label: t(`adminSubmissions.tabs.${tabItem.labelKey}`),
  }));
  // ── Mini-page views ──
  if (view?.type === 'owner') {
    return <OwnerDetailView ownerId={view.ownerId} onBack={() => setView(null)} />;
  }
  if (view?.type === 'equipment') {
    return <EquipmentDetailView submission={view.submission} onBack={() => setView(null)} />;
  }
  // ── Stats summary ──
  const stats = [
    { label: t('adminSubmissions.tabs.pending'),  value: submissions.filter(s => s.status === 'pending').length,  color: 'text-amber-500',  dot: 'bg-amber-400'  },
    { label: t('adminSubmissions.tabs.inReview'), value: submissions.filter(s => s.status === 'review').length,   color: 'text-blue-500',   dot: 'bg-blue-400'   },
    { label: t('adminSubmissions.tabs.approved'), value: submissions.filter(s => s.status === 'approved').length, color: 'text-green-500',  dot: 'bg-green-400'  },
    { label: t('adminSubmissions.tabs.rejected'), value: submissions.filter(s => s.status === 'rejected').length, color: 'text-red-500',    dot: 'bg-red-400'    },
  ];
  return (
    <div className="space-y-5">
      <SectionHeader
        title={t('adminSubmissions.pageTitle', { defaultValue: 'Equipment Submissions' })}
        subtitle={t('adminSubmissions.pageSubtitle', { count: total, defaultValue: `${total} total` })}
      />
      {/* Mini stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={clsx('w-2.5 h-2.5 rounded-full shrink-0', s.dot)} />
            <div className="min-w-0">
              <p className={clsx('text-lg font-bold leading-none', s.color)}>{s.value}</p>
              <p className="text-[10px] text-[var(--text-muted)] font-medium mt-0.5 truncate">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      {/* Table card */}
      <div className="card overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-[var(--border)] flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <Tabs tabs={TABS_CONFIG} active={tab} onChange={v => { setTab(v); setPage(1); }} />
          <SearchInput
            value={search}
            onChange={v => { setSearch(v); setPage(1); }}
            placeholder={t('adminSubmissions.searchPlaceholder', { defaultValue: 'Search submissions…' })}
            className="w-full sm:w-64"
          />
        </div>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('adminSubmissions.table.equipment',  { defaultValue: 'Equipment' })}</th>
                <th>{t('adminSubmissions.table.owner',      { defaultValue: 'Owner'     })}</th>
                <th>{t('adminSubmissions.table.pricePerDay',{ defaultValue: 'Price/Day' })}</th>
                <th>{t('adminSubmissions.table.status',     { defaultValue: 'Status'    })}</th>
                <th>{t('adminSubmissions.table.submitted',  { defaultValue: 'Submitted' })}</th>
                <th>{t('adminSubmissions.table.actions',    { defaultValue: 'Actions'   })}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j}><div className="skeleton h-4 w-3/4 rounded-lg" /></td>
                    ))}
                  </tr>
                ))
              ) : submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-[var(--text-muted)]">
                      <div className="w-14 h-14 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center">
                        <Layers className="w-7 h-7 opacity-40" />
                      </div>
                      <p className="text-sm font-medium">
                        {t('adminSubmissions.noSubmissions', { defaultValue: 'No submissions found' })}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                submissions.map(s => {
                  const sm2 = statusMeta(s.status);
                  return (
                    <tr key={s.id} className="group">
                      {/* Equipment */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] overflow-hidden shrink-0 flex items-center justify-center">
                            {Array.isArray(s.images) && s.images[0]
                              ? <img src={s.images[0]} alt="" className="w-full h-full object-cover" />
                              : <Package className="w-5 h-5 text-[var(--text-muted)] opacity-50" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-[var(--text)] truncate max-w-[140px]">{s.name || '—'}</p>
                            <p className="text-xs text-[var(--text-muted)]">{[s.brand, s.model].filter(Boolean).join(' · ') || '—'}</p>
                          </div>
                        </div>
                      </td>
                      {/* Owner */}
                      <td>
                        <div>
                          <p className="text-sm font-medium text-[var(--text)]">{s.owner_name || '—'}</p>
                          {s.owner_id && (
                            <button
                              onClick={() => setView({ type: 'owner', ownerId: s.owner_id })}
                              className="text-[10px] text-brand-500 hover:text-brand-600 flex items-center gap-0.5 mt-0.5 font-medium"
                            >
                              <User className="w-2.5 h-2.5" />
                              {t('adminSubmissions.viewOwner', { defaultValue: 'View profile' })} →
                            </button>
                          )}
                        </div>
                      </td>
                      {/* Price */}
                      <td>
                        <span className="font-bold text-sm text-brand-500">
                          {s.price_per_day ? `ETB ${Number(s.price_per_day).toLocaleString()}` : '—'}
                        </span>
                      </td>
                      {/* Status */}
                      <td>
                        <div className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold', sm2.bg, sm2.text)}>
                          <div className={clsx('w-1.5 h-1.5 rounded-full', sm2.dot)} />
                          {s.status}
                        </div>
                      </td>
                      {/* Date */}
                      <td>
                        <span className="text-xs text-[var(--text-muted)]">
                          {s.created_at ? format(new Date(s.created_at), 'dd MMM yy') : '—'}
                        </span>
                      </td>
                      {/* Actions */}
                      <td>
                        <div className="flex items-center gap-1">
                          {/* View detail */}
                          <button
                            onClick={() => setView({ type: 'equipment', submission: s })}
                            title="View Details"
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-brand-500 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* Edit & Approve — only pending */}
                          {s.status === 'pending' && (
                            <button
                              onClick={() => setEditApproveTarget(s)}
                              title="Edit & Approve"
                              className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Reject — only pending */}
                          {s.status === 'pending' && (
                            <button
                              onClick={() => setRejectTarget(s)}
                              title="Reject"
                              className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="p-4 border-t border-[var(--border)]">
          <Pagination page={page} totalPages={Math.ceil(total / 15)} onPageChange={setPage} />
        </div>
      </div>
      {/* ── Modals ── */}
      {editApproveTarget && (
        <EditAndApproveModal
          submission={editApproveTarget}
          onClose={() => setEditApproveTarget(null)}
          onDone={() => { setEditApproveTarget(null); fetchSubmissions(); }}
        />
      )}
      {rejectTarget && (
        <RejectModal
          submission={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onDone={() => { setRejectTarget(null); fetchSubmissions(); }}
        />
      )}
    </div>
  );
}