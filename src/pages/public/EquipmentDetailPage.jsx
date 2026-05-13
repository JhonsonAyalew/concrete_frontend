import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { equipmentService } from '../../services/equipmentService';
import { reviewService } from '../../services';
import { useAuth } from '../../context/AuthContext';
import { PageLoader, StarRating, StatusBadge, Button } from '../../components/ui';
import { MapPin, Star, Calendar, Clock, Truck, Shield, ChevronLeft, ChevronRight, User, Building } from 'lucide-react';
import clsx from 'clsx';
export default function EquipmentDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [eq, setEq] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imgIdx, setImgIdx] = useState(0);
  const [tab, setTab] = useState('overview');
  useEffect(() => {
    Promise.all([
      equipmentService.getById(id),
      reviewService.getAll({ equipment_id: id, limit: 10 }),
    ]).then(([eqRes, revRes]) => {
      setEq(eqRes.data.data);
      setReviews(revRes.data.data || []);
    }).catch(error => {
    }).finally(() => setLoading(false));
  }, [id]);
  if (loading) return <div className="pt-20"><PageLoader /></div>;
  if (!eq) return <div className="pt-24 text-center"><p>{t('equipmentDetail.notFound')}</p></div>;
  const images = eq.images?.length ? eq.images : [];
  const conditionColor = { 
    excellent: 'badge-success', 
    good: 'badge-info', 
    fair: 'badge-warning' 
  };
  const getConditionLabel = (condition) => {
    const labels = {
      excellent: t('equipmentDetail.conditions.excellent'),
      good: t('equipmentDetail.conditions.good'),
      fair: t('equipmentDetail.conditions.fair'),
    };
    return labels[condition] || condition;
  };
  const handleBook = () => {
    if (!user) { 
      navigate('/login'); 
      return; 
    }
    if (user.role === 'customer') {
      navigate(`/customer/book/${id}`);
    }
  };
  const TABS = [
    { key: 'overview', label: t('equipmentDetail.tabs.overview') },
    { key: 'specs', label: t('equipmentDetail.tabs.specs') },
    { key: 'reviews', label: t('equipmentDetail.tabs.reviews') },
    { key: 'time_slots', label: t('equipmentDetail.tabs.timeSlots') },
  ];
  // Helper function to get avatar URL or fallback to initials
  const getReviewerAvatar = (review) => {
    if (review.reviewer_avatar_url || review.reviewer_avatar) {
      return review.reviewer_avatar_url || review.reviewer_avatar;
    }
    return null;
  };
  // Safe date formatter
  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return '';
    }
  };
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-[var(--text-muted)] mb-6">
        <Link to="/" className="hover:text-brand-500 transition-colors">{t('equipmentDetail.breadcrumb.home')}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/equipment" className="hover:text-brand-500 transition-colors">{t('equipmentDetail.breadcrumb.equipment')}</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-[var(--text)] truncate max-w-[200px]">{eq.name}</span>
      </nav>
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left — images + details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image gallery */}
          <div className="card overflow-hidden">
            <div className="relative aspect-[16/9] bg-[var(--bg-secondary)]">
              {images[imgIdx] ? (
                <img 
                  src={images[imgIdx]} 
                  alt={eq.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">⚙️</div>
              )}
              {images.length > 1 && (
                <>
                  <button 
                    onClick={() => setImgIdx(i => (i - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setImgIdx(i => (i + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <div 
                        key={i} 
                        className={clsx('w-2 h-2 rounded-full transition-colors', 
                          i === imgIdx ? 'bg-white' : 'bg-white/40'
                        )} 
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="p-3 flex gap-2 overflow-x-auto">
                {images.map((img, i) => (
                  <button 
                    key={i} 
                    onClick={() => setImgIdx(i)}
                    className={clsx('w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-colors', 
                      i === imgIdx ? 'border-brand-500' : 'border-transparent'
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] w-full overflow-x-auto">
            {TABS.map(tabItem => (
              <button 
                key={tabItem.key} 
                onClick={() => setTab(tabItem.key)}
                className={clsx('flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize whitespace-nowrap',
                  tab === tabItem.key ? 'bg-[var(--bg-card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                )}
                style={{ fontFamily:'Syne,sans-serif' }}
              >
                {tabItem.label}
              </button>
            ))}
          </div>
          {/* Tab content */}
          <div className="card p-5">
            {tab === 'overview' && (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-[var(--text)] mb-2" style={{ fontFamily:'Syne,sans-serif' }}>
                    {t('equipmentDetail.overview.description')}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    {eq.description || t('equipmentDetail.overview.noDescription')}
                  </p>
                </div>
                {eq.attachments?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-[var(--text)] mb-2" style={{ fontFamily:'Syne,sans-serif' }}>
                      {t('equipmentDetail.overview.attachments')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {eq.attachments.map(a => (
                        <span key={a} className="badge badge-neutral">{a}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {[
                    [t('equipmentDetail.overview.brand'), eq.brand],
                    [t('equipmentDetail.overview.model'), eq.model],
                    [t('equipmentDetail.overview.year'), eq.year],
                    [t('equipmentDetail.overview.condition'), eq.condition ? getConditionLabel(eq.condition) : null],
                    [t('equipmentDetail.overview.city'), eq.city],
                    [t('equipmentDetail.overview.minRental'), `${eq.min_rental_days || 1} ${t('equipmentDetail.overview.days')}`],
                  ].filter(([,v]) => v).map(([k, v]) => (
                    <div key={k} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                      <p className="text-xs text-[var(--text-muted)]" style={{ fontFamily:'Syne,sans-serif' }}>{k}</p>
                      <p className="text-sm font-semibold text-[var(--text)] capitalize mt-0.5">{v}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {tab === 'specs' && (
              <div>
                <h3 className="font-semibold text-[var(--text)] mb-4" style={{ fontFamily:'Syne,sans-serif' }}>
                  {t('equipmentDetail.specs.title')}
                </h3>
                {eq.specifications && Object.keys(eq.specifications).length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(eq.specifications).map(([k, v]) => (
                      <div key={k} className="p-3 rounded-xl bg-[var(--bg-secondary)]">
                        <p className="text-xs text-[var(--text-muted)] capitalize" style={{ fontFamily:'Syne,sans-serif' }}>{k}</p>
                        <p className="text-sm font-semibold text-[var(--text)] mt-0.5">{v}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">{t('equipmentDetail.specs.noSpecs')}</p>
                )}
              </div>
            )}
            {tab === 'reviews' && (
              <div>
                <div className="flex items-center gap-4 mb-5 pb-4 border-b border-[var(--border)]">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-[var(--text)]" style={{ fontFamily:'Syne,sans-serif' }}>
                      {Number(eq.avg_rating || 0).toFixed(1)}
                    </p>
                    <StarRating value={Math.round(eq.avg_rating || 0)} size="md" />
                    <p className="text-xs text-[var(--text-muted)] mt-1">
                      {eq.review_count || 0} {t('equipmentDetail.reviews.reviewCount')}
                    </p>
                  </div>
                </div>
                {reviews.length === 0 ? (
                  <p className="text-sm text-[var(--text-muted)] py-6 text-center">
                    {t('equipmentDetail.reviews.noReviews')}
                  </p>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(r => {
                      const reviewerAvatar = getReviewerAvatar(r);
                      const reviewerInitials = r.reviewer_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
                      return (
                        <div key={r.id} className="py-4 border-b border-[var(--border)] last:border-0">
                          <div className="flex items-center gap-3 mb-2">
                            {reviewerAvatar ? (
                              <img 
                                src={reviewerAvatar} 
                                alt={r.reviewer_name}
                                className="w-10 h-10 rounded-full object-cover ring-2 ring-[var(--border)]"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  const parent = e.target.parentNode;
                                  const fallbackDiv = document.createElement('div');
                                  fallbackDiv.className = 'w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold';
                                  fallbackDiv.textContent = reviewerInitials;
                                  parent.appendChild(fallbackDiv);
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 
                                          flex items-center justify-center text-white text-sm font-bold">
                                {reviewerInitials}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-[var(--text)]">{r.reviewer_name || t('equipmentDetail.reviews.anonymous')}</p>
                              <StarRating value={r.rating} size="sm" />
                            </div>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)] ml-12">{r.comment}</p>
                          {r.created_at && (
                            <p className="text-xs text-[var(--text-muted)] ml-12 mt-1">
                              {formatDate(r.created_at)}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {tab === 'time_slots' && (
              <div>
                <h3 className="font-semibold text-[var(--text)] mb-4" style={{ fontFamily:'Syne,sans-serif' }}>
                  {t('equipmentDetail.timeSlots.title')}
                </h3>
                {eq.time_slots?.length > 0 ? (
                  <div className="space-y-2">
                    {eq.time_slots.filter(s => s.is_active).map(slot => (
                      <div key={slot.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
                        <div>
                          <p className="text-sm font-semibold text-[var(--text)]">{slot.name}</p>
                          <p className="text-xs text-[var(--text-muted)] capitalize">
                            {t(`equipmentDetail.timeSlots.days.${slot.day_of_week?.toLowerCase()}`) || slot.day_of_week} · {slot.start_time} – {slot.end_time}
                          </p>
                        </div>
                        {slot.price_override && (
                          <span className="text-sm font-bold text-brand-500">
                            ETB {Number(slot.price_override).toLocaleString()}/hr
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">{t('equipmentDetail.timeSlots.noSlots')}</p>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Right — booking card */}
        <div className="space-y-4">
          <div className="card p-5 sticky top-20">
            <div className="mb-4">
              <h1 className="text-xl font-bold text-[var(--text)] leading-snug mb-1" style={{ fontFamily:'Syne,sans-serif' }}>
                {eq.name}
              </h1>
              <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]">
                <MapPin className="w-3.5 h-3.5" /> {eq.city}
                {eq.specific_address && <span>· {eq.specific_address}</span>}
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={clsx('badge', conditionColor[eq.condition] || 'badge-neutral')}>
                  {getConditionLabel(eq.condition)}
                </span>
                {eq.delivery_available && (
                  <span className="badge badge-brand">🚚 {t('equipmentDetail.deliveryBadge')}</span>
                )}
                <StatusBadge status={eq.status} />
              </div>
            </div>
            {/* Ratings */}
            <div className="flex items-center gap-2 mb-5 p-3 rounded-xl bg-[var(--bg-secondary)]">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-bold text-[var(--text)] text-sm">
                {Number(eq.avg_rating || 0).toFixed(1)}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                ({eq.review_count || 0} {t('equipmentDetail.reviews.reviewCount')}) · {eq.total_bookings || 0} {t('equipmentDetail.rentals')}
              </span>
            </div>
            {/* Pricing */}
            <div className="space-y-2 mb-5">
              <p className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider" style={{ fontFamily:'Syne,sans-serif' }}>
                {t('equipmentDetail.pricing.title')}
              </p>
              {[
                [t('equipmentDetail.pricing.perHour'), eq.price_per_hour],
                [t('equipmentDetail.pricing.perDay'), eq.price_per_day],
                [t('equipmentDetail.pricing.perWeek'), eq.price_per_week],
                [t('equipmentDetail.pricing.perMonth'), eq.price_per_month],
              ].filter(([,v]) => v).map(([label, val]) => (
                <div key={label} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                  <span className="text-sm text-[var(--text-secondary)]">{label}</span>
                  <span className="font-bold text-[var(--text)] text-sm" style={{ fontFamily:'Syne,sans-serif' }}>
                    ETB {Number(val).toLocaleString()}
                  </span>
                </div>
              ))}
              {eq.deposit_required && (
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-[var(--text-secondary)]">{t('equipmentDetail.pricing.deposit')}</span>
                  <span className="font-bold text-amber-500 text-sm">
                    ETB {Number(eq.deposit_required).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
            {/* Owner */}
            <div className="p-3 rounded-xl bg-[var(--bg-secondary)] mb-5">
              <p className="text-xs text-[var(--text-muted)] mb-2" style={{ fontFamily:'Syne,sans-serif' }}>
                {t('equipmentDetail.owner.title')}
              </p>
              <div className="flex items-center gap-2">
                {eq.owner_avatar ? (
                  <img 
                    src={eq.owner_avatar} 
                    alt={eq.owner_name}
                    className="w-8 h-8 rounded-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      const parent = e.target.parentNode;
                      const fallbackDiv = document.createElement('div');
                      fallbackDiv.className = 'w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-xs font-bold';
                      fallbackDiv.textContent = eq.owner_name?.charAt(0) || '?';
                      parent.appendChild(fallbackDiv);
                    }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 
                              flex items-center justify-center text-white text-xs font-bold">
                    {eq.owner_name?.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-[var(--text)]">{eq.owner_name}</p>
                  {eq.owner_company && (
                    <p className="text-xs text-[var(--text-muted)]">{eq.owner_company}</p>
                  )}
                </div>
              </div>
            </div>
            {/* Book CTA */}
            {user?.role === 'customer' ? (
              <Button className="w-full" size="lg" onClick={handleBook}>
                <Calendar className="w-4 h-4" /> {t('equipmentDetail.bookButton.request')}
              </Button>
            ) : !user ? (
              <div className="space-y-2">
                <Button className="w-full" size="lg" onClick={() => navigate('/login')}>
                  {t('equipmentDetail.bookButton.loginToBook')}
                </Button>
                <Link to="/register" className="btn-secondary w-full text-sm py-2.5 text-center block">
                  {t('equipmentDetail.bookButton.createAccount')}
                </Link>
              </div>
            ) : (
              <p className="text-xs text-center text-[var(--text-muted)] py-2">
                {t('equipmentDetail.bookButton.customersOnly')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}