import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { equipmentService } from '../../services/equipmentService';
import { categoryService } from '../../services';
import { Button, Pagination, Spinner, StarRating, Select } from '../../components/ui';
import { Filter, MapPin, Star, ArrowRight, SlidersHorizontal, X } from 'lucide-react';
import clsx from 'clsx';
const CONDITIONS = ['excellent', 'good', 'fair'];
export default function SearchPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const [equipment, setEquipment] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Get cities from translation
  const CITIES = t('equipment.cities', { returnObjects: true }) || [
    'Addis Ababa', 'Dire Dawa', 'Hawassa', 'Bahir Dar', 
    'Mekelle', 'Adama', 'Gondar', 'Jimma'
  ];
  // Get sort options from translation
  const SORT_OPTIONS = [
    { value: 'created_at:desc', label: t('equipment.sort.newestFirst') },
    { value: 'price_per_day:asc', label: t('equipment.sort.priceLowToHigh') },
    { value: 'price_per_day:desc', label: t('equipment.sort.priceHighToLow') },
    { value: 'avg_rating:desc', label: t('equipment.sort.topRated') },
  ];
  const [filters, setFilters] = useState({
    search: params.get('search') || '',
    category: params.get('category') || '',
    city: params.get('city') || '',
    condition: '',
    min_price: '',
    max_price: '',
    sort: 'created_at:desc',
  });
  useEffect(() => {
    categoryService.getAll({ active: true }).then(r => setCategories(r.data.data || [])).catch(() => {});
  }, []);
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [sortField, sortOrder] = filters.sort.split(':');
        const { data } = await equipmentService.getAll({
          ...filters, sort: sortField, order: sortOrder, page, limit: 12,
        });
        setEquipment(data.data || []);
        setTotal(data.total || 0);
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, [filters, page]);
  const setFilter = (key, val) => { setFilters(p => ({ ...p, [key]: val })); setPage(1); };
  const clearFilters = () => { setFilters({ search:'', category:'', city:'', condition:'', min_price:'', max_price:'', sort:'created_at:desc' }); setPage(1); };
  const hasActiveFilters = filters.category || filters.city || filters.condition || filters.min_price || filters.max_price;
  // Get condition labels from translation
  const getConditionLabel = (condition) => {
    const labels = {
      excellent: t('equipment.conditions.excellent'),
      good: t('equipment.conditions.good'),
      fair: t('equipment.conditions.fair'),
    };
    return labels[condition] || condition;
  };
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[var(--text)]" style={{ fontFamily:'Syne,sans-serif' }}>
          {t('equipment.header.title')}
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          {t('equipment.header.subtitle', { count: total })}
        </p>
      </div>
      {/* Top search + controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
          <input 
            value={filters.search} 
            onChange={e => setFilter('search', e.target.value)}
            placeholder={t('equipment.searchPlaceholder')} 
            className="input-field pl-10 w-full" 
          />
        </div>
        <select 
          value={filters.sort} 
          onChange={e => setFilter('sort', e.target.value)} 
          className="input-field w-auto min-w-[180px]"
        >
          {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button 
          onClick={() => setFiltersOpen(v => !v)}
          className={clsx('btn-secondary flex items-center gap-2 px-4 py-2.5 text-sm shrink-0', hasActiveFilters && 'border-brand-500 text-brand-500')}
        >
          <SlidersHorizontal className="w-4 h-4"/>
          {t('equipment.filtersButton')}
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-brand-500" />}
        </button>
      </div>
      {/* Filter panel */}
      {filtersOpen && (
        <div className="card p-5 mb-6 animate-slide-down">
          <div className="flex items-center justify-between mb-4">
            <span className="font-semibold text-[var(--text)] text-sm" style={{ fontFamily:'Syne,sans-serif' }}>
              {t('equipment.filtersPanel.title')}
            </span>
            <div className="flex items-center gap-3">
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1">
                  <X className="w-3 h-3"/>{t('equipment.filtersPanel.clear')}
                </button>
              )}
              <button onClick={() => setFiltersOpen(false)} className="text-[var(--text-muted)] hover:text-[var(--text)]">
                <X className="w-4 h-4"/>
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <select value={filters.category} onChange={e => setFilter('category', e.target.value)} className="input-field">
              <option value="">{t('equipment.filtersPanel.allCategories')}</option>
              {categories.map(c => <option key={c.id} value={c.slug}>{c.icon} {c.name}</option>)}
            </select>
            <select value={filters.city} onChange={e => setFilter('city', e.target.value)} className="input-field">
              <option value="">{t('equipment.filtersPanel.allCities')}</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={filters.condition} onChange={e => setFilter('condition', e.target.value)} className="input-field">
              <option value="">{t('equipment.filtersPanel.anyCondition')}</option>
              {CONDITIONS.map(c => (
                <option key={c} value={c} className="capitalize">
                  {getConditionLabel(c)}
                </option>
              ))}
            </select>
            <input 
              type="number" 
              placeholder={t('equipment.filtersPanel.minPrice')} 
              value={filters.min_price} 
              onChange={e => setFilter('min_price', e.target.value)} 
              className="input-field" 
            />
            <input 
              type="number" 
              placeholder={t('equipment.filtersPanel.maxPrice')} 
              value={filters.max_price} 
              onChange={e => setFilter('max_price', e.target.value)} 
              className="input-field" 
            />
          </div>
        </div>
      )}
      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="skeleton aspect-[16/10]" />
              <div className="p-4 space-y-2">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-3 w-1/2" />
                <div className="skeleton h-8 w-full mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : equipment.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold text-[var(--text)] mb-2" style={{ fontFamily:'Syne,sans-serif' }}>
            {t('equipment.emptyState.title')}
          </h3>
          <p className="text-[var(--text-secondary)] mb-5">
            {t('equipment.emptyState.description')}
          </p>
          <button onClick={clearFilters} className="btn-secondary px-5 py-2.5 text-sm">
            {t('equipment.emptyState.clearButton')}
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {equipment.map(eq => <EquipmentCard key={eq.id} eq={eq} />)}
        </div>
      )}
      <Pagination page={page} totalPages={Math.ceil(total / 12)} onPageChange={setPage} />
    </div>
  );
}
function EquipmentCard({ eq }) {
  const { t } = useTranslation();
  const conditionColor = { 
    excellent: 'badge-success', 
    good: 'badge-info', 
    fair: 'badge-warning' 
  };
  const getConditionLabel = (condition) => {
    const labels = {
      excellent: t('equipment.conditions.excellent'),
      good: t('equipment.conditions.good'),
      fair: t('equipment.conditions.fair'),
    };
    return labels[condition] || condition;
  };
  return (
    <div className="card-hover overflow-hidden group">
      <div className="relative aspect-[16/10] bg-[var(--bg-secondary)] overflow-hidden">
        {eq.images?.[0]
          ? <img src={eq.images[0]} alt={eq.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          : <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">⚙️</div>}
        <span className={clsx('absolute top-2.5 left-2.5 badge', conditionColor[eq.condition] || 'badge-neutral')}>
          {getConditionLabel(eq.condition)}
        </span>
        {eq.delivery_available && (
          <span className="absolute bottom-2.5 left-2.5 badge badge-brand">
            🚚 {t('equipment.deliveryBadge')}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-bold text-[var(--text)] text-sm leading-snug mb-1 truncate" style={{ fontFamily:'Syne,sans-serif' }}>
          {eq.name}
        </h3>
        <p className="text-xs text-[var(--text-muted)] mb-0.5">
          {eq.brand} {eq.model} {eq.year && `· ${eq.year}`}
        </p>
        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mb-3">
          <MapPin className="w-3 h-3"/>{eq.city}
          <span className="mx-1">·</span>
          <Star className="w-3 h-3 text-amber-400 fill-amber-400"/>
          <span>{Number(eq.avg_rating||0).toFixed(1)} ({eq.review_count||0})</span>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-base font-bold text-brand-500" style={{ fontFamily:'Syne,sans-serif' }}>
              ETB {Number(eq.price_per_day).toLocaleString()}
            </span>
            <span className="text-xs text-[var(--text-muted)]">{t('equipment.perDay')}</span>
          </div>
          {eq.price_per_hour && (
            <span className="text-xs text-[var(--text-muted)]">
              ETB {Number(eq.price_per_hour).toLocaleString()}{t('equipment.perHour')}
            </span>
          )}
        </div>
        <Link to={`/equipment/${eq.id}`} className="btn-primary w-full text-xs py-2 justify-center">
          {t('equipment.viewDetails')} <ArrowRight className="w-3.5 h-3.5"/>
        </Link>
      </div>
    </div>
  );
}