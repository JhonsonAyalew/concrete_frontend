import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { equipmentService } from '../../services/equipmentService';
import { categoryService, reviewService } from '../../services/index';
import { StarRating } from '../../components/ui';
import { 
  ArrowRight, 
  CheckCircle, 
  Shield, 
  Zap, 
  Users, 
  MapPin, 
  Star, 
  ChevronRight, 
  Search,
  Package,
  Calendar,
  Check,
  Truck,
  Wrench,
  HardHat,
  Building2,
  Gauge,
  Factory,
  Quote,
  ChevronLeft,
  TrendingUp,
  Clock,
  Award
} from 'lucide-react';
// Ticker items are now managed via i18n - will be passed as prop or use t()
function Marquee({ items }) {
  const doubled = [...items, ...items];
  return (
    <div className="relative overflow-hidden py-3 border-t border-white/8 bg-black/40 backdrop-blur-sm">
      <div className="flex gap-8 whitespace-nowrap animate-marquee">
        {doubled.map((item, i) => (
          <Link 
            key={i} 
            to={`/equipment?category=${item.toLowerCase().replace(' ', '-')}`}
            className="inline-flex items-center gap-2 px-4 text-white/50 hover:text-brand-400 text-sm font-medium transition-colors duration-300"
          >
            <span className="text-brand-500 text-base">✦</span>
            {item}
          </Link>
        ))}
      </div>
    </div>
  );
}
const EQUIPMENT_CATEGORIES = [
];
// TRUST_FEATURES data moved to static array but text will use t() with keys
const TRUST_FEATURES = [
  { icon: Shield, key: 'verifiedOwners' },
  { icon: Zap, key: 'fastBooking' },
  { icon: Users, key: 'support' },
  { icon: CheckCircle, key: 'securePayments' },
];
const getIconComponent = (iconName) => {
  const icons = {
    Wrench: Wrench,
    Truck: Truck,
    HardHat: HardHat,
    Building2: Building2,
    Gauge: Gauge,
    Factory: Factory,
    Zap: Zap,
    Package: Package
  };
  return icons[iconName] || Package;
};
// CountUp Component for animated numbers
function CountUp({ end, suffix = '', duration = 2000 }) {
  const [val, setVal] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  useEffect(() => {
    if (hasAnimated) return;
    setHasAnimated(true);
    let start = 0;
    const increment = end / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setVal(end);
        clearInterval(timer);
      } else {
        setVal(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [end, duration, hasAnimated]);
  return <span>{val.toLocaleString()}{suffix}</span>;
}
export default function LandingPage() {
  const { t } = useTranslation();
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState(EQUIPMENT_CATEGORIES);
  const [search, setSearch] = useState('');
  const [testimonials, setTestimonials] = useState([]);
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  // Get ticker items from translation
  const tickerItems = t('landing.tickerItems', { returnObjects: true }) || [
    'Excavator', 'Loader', 'Bulldozer', 'Crane', 'Grader', 
    'Compactor', 'Dump Truck', 'Generator', 'Backhoe', 
    'Forklift', 'Scraper', 'Paver', 'Roller', 'Drill Rig'
  ];
  // Get how it works data from translation
  const howItWorksSteps = [
    {
      step: '01',
      key: 'step1',
      icon: Search,
      title: t('landing.howItWorks.step1.title'),
      desc: t('landing.howItWorks.step1.description')
    },
    {
      step: '02',
      key: 'step2',
      icon: Calendar,
      title: t('landing.howItWorks.step2.title'),
      desc: t('landing.howItWorks.step2.description')
    },
    {
      step: '03',
      key: 'step3',
      icon: Check,
      title: t('landing.howItWorks.step3.title'),
      desc: t('landing.howItWorks.step3.description')
    }
  ];
  useEffect(() => {
    equipmentService.getFeatured().then(r => setFeatured(r.data.data?.slice(0,6) || [])).catch(() => {});
    categoryService.getAll({ active: true }).then(r => {
      const cats = r.data.data;
      if (cats?.length) {
        setCategories(cats.map(c => ({ 
          name: c.name, 
          icon: c.icon || getIconForCategory(c.slug),
          slug: c.slug, 
          count: c.equipment_count || 0 
        })));
      }
    }).catch(() => {});
    // Fetch real testimonials from API (reviews with rating >= 4)
    const fetchTestimonials = async () => {
      try {
        // Get all equipment first
        const equipRes = await equipmentService.getAll({ limit: 50 });
        const equipment = equipRes.data.data || [];
        if (equipment.length === 0) {
          setTestimonials(getFallbackTestimonials());
          return;
        }
        const allReviews = [];
        // Fetch reviews for each equipment
        for (const eq of equipment.slice(0, 10)) { // Check first 10 equipment
          try {
            const reviewRes = await reviewService.getAll({ equipment_id: eq.id, limit: 10 });
            const reviews = reviewRes.data.data || [];
            reviews.forEach(review => {
              // Only include reviews with rating >= 4 and has comment
              if (review.rating >= 4 && review.comment && review.comment.trim()) {
                allReviews.push({
                  id: review.id,
                  name: review.reviewer_name || t('landing.testimonials.customer'),
                  company: eq.name,
                  rating: review.rating,
                  comment: review.comment,
                  avatar_url: review.reviewer_avatar_url || review.reviewer_avatar || null,
                  equipment_id: eq.id
                });
              }
            });
          } catch (err) {
          }
        }
        if (allReviews.length > 0) {
          // Sort by rating (highest first) and take top 6
          const sortedReviews = allReviews.sort((a, b) => b.rating - a.rating).slice(0, 6);
          setTestimonials(sortedReviews);
        } else {
          setTestimonials(getFallbackTestimonials());
        }
      } catch (err) {
        setTestimonials(getFallbackTestimonials());
      }
    };
    fetchTestimonials();
  }, [t]);
  const getFallbackTestimonials = () => {
    return [
    ];
  };
  // Auto-slide testimonials
  useEffect(() => {
    if (!isAutoPlaying || testimonials.length === 0) return;
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, testimonials.length]);
  const getIconForCategory = (slug) => {
    const iconMap = {
      excavator: Wrench,
      loader: Truck,
      bulldozer: HardHat,
      crane: Building2,
      grader: Gauge,
      compactor: Factory,
      'dump-truck': Truck,
      generator: Zap,
    };
    return iconMap[slug] || Package;
  };
  const nextTestimonial = () => {
    setIsAutoPlaying(false);
    setCurrentTestimonialIndex((prev) => (prev + 1) % testimonials.length);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };
  const prevTestimonial = () => {
    setIsAutoPlaying(false);
    setCurrentTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };
  // Helper function to get avatar or initials
  const getInitials = (name) => {
    return name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  };
  return (
    <div className="bg-[var(--bg)]">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* HERO SECTION - Grid Lines + Glow Effects + Centered Content */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex flex-col justify-between overflow-hidden bg-[var(--bg)]">
      {/* ===== BACKGROUND LAYERS ===== */}
      {/* Base dark background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--bg)] via-[var(--bg-secondary)] to-[var(--bg)]" />
      {/* Gradient glow orbs using brand color */}
      <div className="absolute top-[-20%] left-[50%] -translate-x-1/2 w-[800px] h-[600px] rounded-full blur-[130px] opacity-25"
        style={{ background: `radial-gradient(circle, var(--brand-500) 0%, transparent 70%)` }} />
      <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[110px] opacity-15"
        style={{ background: `radial-gradient(circle, var(--brand-500) 0%, transparent 70%)` }} />
      <div className="absolute top-[30%] left-[-15%] w-[400px] h-[400px] rounded-full blur-[90px] opacity-10"
        style={{ background: `radial-gradient(circle, var(--brand-500) 0%, transparent 70%)` }} />
      {/* Grid lines overlay */}
      <div className="absolute inset-0 opacity-[0.03]" 
        style={{ 
          backgroundImage: `linear-gradient(var(--brand-500) 1px, transparent 1px),
                            linear-gradient(90deg, var(--brand-500) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} 
      />
      {/* Floating dots decoration */}
      <div className="absolute top-[15%] left-[8%] w-1.5 h-1.5 rounded-full bg-brand-500/40 animate-pulse-slow" />
      <div className="absolute top-[70%] left-[88%] w-2 h-2 rounded-full bg-brand-500/30 animate-pulse-slow" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[45%] right-[5%] w-1 h-1 rounded-full bg-brand-500/50 animate-pulse-slow" style={{ animationDelay: '0.5s' }} />
      <div className="absolute bottom-[25%] left-[12%] w-1.5 h-1.5 rounded-full bg-brand-500/35 animate-pulse-slow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[25%] right-[15%] w-1 h-1 rounded-full bg-brand-500/25 animate-pulse-slow" style={{ animationDelay: '1.5s' }} />
      {/* ===== MAIN CONTENT (Centered) ===== */}
      <div className="relative z-10 flex-1 flex items-center justify-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight text-[var(--text)] mb-6 animate-fade-in-up" style={{ fontFamily: 'Syne, sans-serif' }}>
            {t('landing.hero.titleLine1')}{' '}
            <span className="relative inline-block">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 via-brand-400 to-amber-500">
                {t('landing.hero.titleLine2')}
              </span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 100 6" preserveAspectRatio="none">
                <path d="M0 3 Q25 0.5 50 3 Q75 5.5 100 3" stroke="var(--brand-500)" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
              </svg>
            </span>
            <br />
            <span className="text-[var(--text-secondary)]">{t('landing.hero.titleLine3')}</span>
          </h1>
          {/* Description */}
          <p className="text-base sm:text-lg text-[var(--text-secondary)] max-w-2xl mx-auto mb-8 leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            {t('landing.hero.description')}
          </p>
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex gap-2 p-2 rounded-2xl bg-[var(--bg-card)]/50 border border-[var(--border)] backdrop-blur-sm hover:border-brand-500/40 transition-all duration-300">
              <div className="flex-1 flex items-center gap-2 px-3">
                <Search className="w-4 h-4 text-[var(--text-muted)]" />
                <input 
                  value={search} 
                  onChange={e => setSearch(e.target.value)} 
                  placeholder={t('landing.hero.searchPlaceholder')}
                  className="flex-1 bg-transparent text-[var(--text)] placeholder-[var(--text-muted)] text-sm outline-none"
                  onKeyDown={e => e.key === 'Enter' && (window.location.href = `/equipment?search=${search}`)}
                />
              </div>
              <Link 
                to={`/equipment?search=${search}`} 
                className="px-6 py-2.5 rounded-xl text-sm font-black text-white transition-all duration-200 hover:opacity-90 active:scale-95 bg-gradient-to-r from-brand-500 to-brand-600"
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                {t('landing.hero.searchButton')}
              </Link>
            </div>
          </div>
          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            <Link 
              to="/register" 
              className="group inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-black text-white transition-all duration-300 hover:scale-105 active:scale-95 bg-gradient-to-r from-brand-500 to-brand-600 shadow-lg shadow-brand-500/25"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              {t('landing.hero.getStartedButton')}
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link 
              to="/equipment" 
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-[var(--text-secondary)] border border-[var(--border)] hover:border-brand-500/50 hover:text-[var(--text)] transition-all duration-200"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              {t('landing.hero.browseButton')}
            </Link>
          </div>
          {/* Trust & Rating Badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 pt-4 border-t border-[var(--border)]/50 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            {/* Rating Stars with Avatars */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['BK', 'MA', 'DH', 'ST', 'YG'].map((init, i) => (
                  <div 
                    key={i} 
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-amber-600 border-2 border-[var(--bg)] flex items-center justify-center text-[10px] font-black text-white"
                  >
                    {init}
                  </div>
                ))}
              </div>
              <div className="text-left">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />)}
                </div>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{t('landing.hero.successfulRentals')}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-[var(--border)]" />
            {/* Verified Badge */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-3.5 h-3.5 text-green-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--text)]">{t('landing.hero.verifiedOwners')}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-[var(--border)]" />
            {/* TrustScore Badge */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Award className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--text)]">{t('landing.hero.trustScore')}</p>
              </div>
            </div>
            <div className="w-px h-8 bg-[var(--border)]" />
            {/* Fast Booking */}
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-brand-500/10 flex items-center justify-center">
                <Clock className="w-3.5 h-3.5 text-brand-400" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-[var(--text)]">{t('landing.hero.confirmationTime')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* ===== BOTTOM TICKER (Sliding Categories) ===== */}
      <div className="relative z-10 w-full">
        <Marquee items={tickerItems} />
      </div>
      {/* ===== ANIMATION STYLES ===== */}
      <style jsx>{`
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
        }
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
          opacity: 0;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-marquee {
          animation: marquee 25s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </section>
      {/* ─── CATEGORIES ───────────────────────────────────────── */}
      <section className="py-20 bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-sm font-semibold text-brand-500 uppercase tracking-wider" style={{ fontFamily:'Syne,sans-serif' }}>{t('landing.categories.sectionBadge')}</span>
            <h2 className="text-4xl font-bold text-[var(--text)] mt-2" style={{ fontFamily:'Syne,sans-serif' }}>{t('landing.categories.title')}</h2>
            <p className="text-[var(--text-secondary)] mt-3 max-w-lg mx-auto">{t('landing.categories.description')}</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {categories.map((cat) => {
              const IconComponent = typeof cat.icon === 'string' ? getIconComponent(cat.icon) : (cat.icon || Package);
              return (
                <Link key={cat.slug} to={`/equipment?category=${cat.slug}`}
                  className="card-hover p-5 flex flex-col items-center text-center gap-3 group cursor-pointer">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <IconComponent className="w-7 h-7 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-[var(--text)] text-sm" style={{ fontFamily:'Syne,sans-serif' }}>{cat.name}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{cat.count} {t('landing.categories.available')}</p>
                  </div>
                </Link>
              );
            })}
          </div>
          <div className="text-center mt-8">
            <Link to="/equipment" className="btn-secondary px-6 py-2.5 text-sm inline-flex items-center gap-2">
              {t('landing.categories.viewAllButton')} <ChevronRight className="w-4 h-4"/>
            </Link>
          </div>
        </div>
      </section>
      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="py-20 bg-[var(--bg)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-brand-500 uppercase tracking-wider" style={{ fontFamily:'Syne,sans-serif' }}>{t('landing.howItWorks.sectionBadge')}</span>
            <h2 className="text-4xl font-bold text-[var(--text)] mt-2" style={{ fontFamily:'Syne,sans-serif' }}>{t('landing.howItWorks.title')}</h2>
            <p className="text-[var(--text-secondary)] mt-3 max-w-lg mx-auto">{t('landing.howItWorks.description')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-brand-500/30 to-brand-500/30 via-brand-500" />
            {howItWorksSteps.map(({ step, title, desc, icon: Icon }) => (
              <div key={step} className="relative text-center group">
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-brand-500 text-white mb-5 shadow-glow group-hover:shadow-glow-lg transition-all duration-300 group-hover:scale-105">
                  <Icon className="w-8 h-8" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[var(--bg)] border-2 border-brand-500 text-brand-500 text-xs font-bold flex items-center justify-center" style={{ fontFamily:'Syne,sans-serif' }}>{step}</span>
                </div>
                <h3 className="text-xl font-bold text-[var(--text)] mb-3" style={{ fontFamily:'Syne,sans-serif' }}>{title}</h3>
                <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-xs mx-auto">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ─── FEATURED EQUIPMENT ───────────────────────────────── */}
      {featured.length > 0 && (
        <section className="py-20 bg-[var(--bg-secondary)]">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="text-sm font-semibold text-brand-500 uppercase tracking-wider" style={{ fontFamily:'Syne,sans-serif' }}>{t('landing.featured.sectionBadge')}</span>
                <h2 className="text-4xl font-bold text-[var(--text)] mt-2" style={{ fontFamily:'Syne,sans-serif' }}>{t('landing.featured.title')}</h2>
              </div>
              <Link to="/equipment" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-brand-500 hover:text-brand-600 transition-colors">
                {t('landing.featured.viewAllButton')} <ArrowRight className="w-4 h-4"/>
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map(eq => <EquipmentCard key={eq.id} eq={eq} />)}
            </div>
          </div>
        </section>
      )}
      {/* ─── TESTIMONIALS SECTION - CREATIVE CAROUSEL WITH AVATARS ──────────────────── */}
      {testimonials.length > 0 && (
        <section className="py-20 bg-gradient-to-br from-[var(--bg)] via-[var(--bg-secondary)] to-[var(--bg)] relative overflow-hidden">
          {/* Background decoration - creative elements */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-brand-500/5 blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-brand-400/5 blur-3xl animate-pulse delay-1000" />
          </div>
          <div className="relative max-w-7xl mx-auto px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse"></span>
                <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider" style={{ fontFamily:'Syne,sans-serif' }}>
                  {t('landing.testimonials.sectionBadge')}
                </span>
              </div>
              <h2 className="text-4xl md:text-5xl font-bold text-[var(--text)] mt-2" style={{ fontFamily:'Syne,sans-serif' }}>
                {t('landing.testimonials.title')}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-500 to-brand-600">
                  {t('landing.testimonials.titleHighlight')}
                </span>
              </h2>
              <p className="text-[var(--text-secondary)] mt-3 max-w-lg mx-auto">
                {t('landing.testimonials.description')}
              </p>
            </div>
            {/* Carousel Container */}
            <div className="relative">
              {/* Navigation Buttons - Creative */}
              {testimonials.length > 3 && (
                <>
                  <button
                    onClick={prevTestimonial}
                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 lg:-translate-x-6 z-10 w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] hover:border-brand-500 hover:bg-brand-500/10 flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl group"
                  >
                    <ChevronLeft className="w-5 h-5 text-[var(--text)] group-hover:text-brand-500 transition-colors" />
                  </button>
                  <button
                    onClick={nextTestimonial}
                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 lg:translate-x-6 z-10 w-10 h-10 rounded-full bg-[var(--bg-card)] border border-[var(--border)] hover:border-brand-500 hover:bg-brand-500/10 flex items-center justify-center transition-all duration-300 shadow-lg hover:shadow-xl group"
                  >
                    <ChevronRight className="w-5 h-5 text-[var(--text)] group-hover:text-brand-500 transition-colors" />
                  </button>
                </>
              )}
              {/* Cards Container - 3 visible at once */}
              <div className="overflow-hidden px-2">
                <div 
                  className="flex gap-6 transition-transform duration-500 ease-out"
                  style={{ 
                    transform: `translateX(-${currentTestimonialIndex * (100 / Math.min(testimonials.length, 3))}%)`,
                  }}
                >
                  {testimonials.map((testimonial, idx) => {
                    const initials = getInitials(testimonial.name);
                    return (
                      <div
                        key={testimonial.id}
                        className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] group"
                      >
                        <div className="card p-6 h-full relative overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 cursor-pointer border border-[var(--border)] hover:border-brand-500/50 bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-secondary)]">
                          {/* Decorative gradient bar */}
                          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-500 via-brand-600 to-brand-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                          {/* Quote icon */}
                          <div className="absolute -top-3 -right-3 opacity-10 group-hover:opacity-20 transition-opacity duration-300">
                            <Quote className="w-20 h-20 text-brand-500" />
                          </div>
                          {/* Rating stars */}
                          <div className="flex gap-0.5 mb-4 relative z-10">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-4 h-4 transition-all duration-300 ${
                                  i < testimonial.rating
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }`}
                              />
                            ))}
                          </div>
                          {/* Testimonial text */}
                          <p className="text-[var(--text-secondary)] text-sm leading-relaxed mb-5 relative z-10 line-clamp-4">
                            "{testimonial.comment}"
                          </p>
                          {/* Author section with avatar */}
                          <div className="flex items-center gap-3 pt-3 border-t border-[var(--border)] relative z-10">
                            <div className="relative">
                              {testimonial.avatar_url ? (
                                <img 
                                  src={testimonial.avatar_url} 
                                  alt={testimonial.name}
                                  className="w-10 h-10 rounded-full object-cover ring-2 ring-[var(--border)]"
                                  onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.style.display = 'none';
                                    const fallbackDiv = document.createElement('div');
                                    fallbackDiv.className = 'w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold';
                                    fallbackDiv.textContent = initials;
                                    e.target.parentNode.appendChild(fallbackDiv);
                                  }}
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                                  {initials}
                                </div>
                              )}
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-[var(--bg-card)]"></div>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-[var(--text)] text-sm" style={{ fontFamily:'Syne,sans-serif' }}>
                                {testimonial.name}
                              </h4>
                              <div className="flex items-center gap-1">
                                <p className="text-xs text-brand-500 font-medium">
                                  {testimonial.company}
                                </p>
                              </div>
                            </div>
                            {/* Verified badge */}
                            <div className="w-6 h-6 rounded-full bg-brand-500/10 flex items-center justify-center">
                              <Check className="w-3 h-3 text-brand-500" />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            {/* Dot indicators - Creative */}
            {testimonials.length > 3 && (
              <div className="flex justify-center gap-2 mt-10">
                {Array.from({ length: Math.min(Math.ceil(testimonials.length / 3), 5) }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setIsAutoPlaying(false);
                      setCurrentTestimonialIndex(Math.min(idx * 3, testimonials.length - 3));
                      setTimeout(() => setIsAutoPlaying(true), 10000);
                    }}
                    className={`transition-all duration-300 rounded-full ${
                      Math.floor(currentTestimonialIndex / 3) === idx
                        ? 'w-8 h-2 bg-brand-500'
                        : 'w-2 h-2 bg-[var(--text-muted)] hover:bg-brand-400'
                    }`}
                  />
                ))}
              </div>
            )}
            {/* View All Button */}
            <div className="text-center mt-12">
              <Link 
                to="/equipment" 
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-brand-500/30 hover:border-brand-500 hover:bg-brand-500/10 text-[var(--text)] text-sm font-medium transition-all duration-300 group"
              >
                {t('landing.testimonials.readMoreButton')}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
          <style jsx>{`
            .line-clamp-4 {
              display: -webkit-box;
              -webkit-line-clamp: 4;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }
            @keyframes pulse {
              0%, 100% { opacity: 0.3; transform: scale(1); }
              50% { opacity: 0.6; transform: scale(1.1); }
            }
            .animate-pulse {
              animation: pulse 4s ease-in-out infinite;
            }
            .delay-1000 {
              animation-delay: 2s;
            }
          `}</style>
        </section>
      )}
      {/* ─── TRUST SECTION ────────────────────────────────────── */}
      <section className="py-20 bg-[var(--bg)]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-brand-500 uppercase tracking-wider" style={{ fontFamily:'Syne,sans-serif' }}>{t('landing.trustSection.sectionBadge')}</span>
            <h2 className="text-4xl font-bold text-[var(--text)] mt-2" style={{ fontFamily:'Syne,sans-serif' }}>{t('landing.trustSection.title')}</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRUST_FEATURES.map(({ icon: Icon, key }) => (
              <div key={key} className="card p-6 group hover:border-brand-500 transition-all duration-300 hover:-translate-y-1">
                <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-500 mb-4 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
                  <Icon className="w-5 h-5"/>
                </div>
                <h3 className="font-bold text-[var(--text)] mb-2" style={{ fontFamily:'Syne,sans-serif' }}>{t(`landing.trustSection.features.${key}.title`)}</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{t(`landing.trustSection.features.${key}.description`)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* ─── CTA BANNER ───────────────────────────────────────── */}
      <section className="py-20 bg-brand-500 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 rounded-full bg-black/10" />
        </div>
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4" style={{ fontFamily:'Syne,sans-serif' }}>
            {t('landing.ctaBanner.title')}
          </h2>
          <p className="text-lg text-white/75 mb-8 max-w-xl mx-auto">
            {t('landing.ctaBanner.description')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register?role=customer" className="px-8 py-4 rounded-xl bg-white text-brand-600 font-bold text-base hover:bg-brand-50 transition-colors shadow-lg" style={{ fontFamily:'Syne,sans-serif' }}>
              {t('landing.ctaBanner.rentButton')}
            </Link>
            <Link to="/register?role=owner" className="px-8 py-4 rounded-xl border-2 border-white text-white font-bold text-base hover:bg-white/10 transition-colors" style={{ fontFamily:'Syne,sans-serif' }}>
              {t('landing.ctaBanner.listButton')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
function EquipmentCard({ eq }) {
  const { t } = useTranslation();
  return (
    <div className="card-hover overflow-hidden group">
      <div className="aspect-[16/10] bg-[var(--bg-secondary)] relative overflow-hidden">
        {eq.images?.[0] ? (
          <img src={eq.images[0]} alt={eq.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Wrench className="w-16 h-16 text-[var(--text-muted)]" />
          </div>
        )}
        <div className="absolute top-3 left-3">
          <span className="badge badge-brand text-xs">{eq.category_name}</span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-bold" style={{ fontFamily:'Syne,sans-serif' }}>
            ETB {Number(eq.price_per_day).toLocaleString()}{t('landing.equipmentCard.perDay')}
          </span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-[var(--text)] text-sm leading-tight" style={{ fontFamily:'Syne,sans-serif' }}>{eq.name}</h3>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-xs font-semibold text-[var(--text)]">{Number(eq.avg_rating || 0).toFixed(1)}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mb-4">
          <MapPin className="w-3 h-3" />
          <span>{eq.city}</span>
          <span className="mx-1">·</span>
          <span>{eq.owner_company || eq.owner_name}</span>
        </div>
        <Link to={`/equipment/${eq.id}`} className="btn-primary w-full text-sm py-2 justify-center">
          {t('landing.equipmentCard.viewDetails')} <ArrowRight className="w-3.5 h-3.5"/>
        </Link>
      </div>
    </div>
  );
}