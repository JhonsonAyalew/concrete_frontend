import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { equipmentService } from '../../services/equipmentService';
import { bookingService } from '../../services';
import { Button, Input, Select, PageLoader } from '../../components/ui';
import { Calendar, MapPin, Clock, DollarSign, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { differenceInDays, differenceInHours, format, parseISO, addDays } from 'date-fns';
import clsx from 'clsx';
export default function BookEquipmentPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [eq, setEq] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mode, setMode] = useState('daily');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [notes, setNotes] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [done, setDone] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const PRICING_MODES = [
    { value: 'daily', label: t('bookEquipment.pricingModes.daily'), field: 'price_per_day' },
    { value: 'hourly', label: t('bookEquipment.pricingModes.hourly'), field: 'price_per_hour' },
    { value: 'weekly', label: t('bookEquipment.pricingModes.weekly'), field: 'price_per_week' },
    { value: 'monthly', label: t('bookEquipment.pricingModes.monthly'), field: 'price_per_month' },
  ];
  useEffect(() => {
    equipmentService.getById(id)
      .then(r => { setEq(r.data.data); })
      .catch(() => toast.error(t('bookEquipment.errors.notFound')))
      .finally(() => setLoading(false));
  }, [id, t]);
  // CORRECT: Calculate number of rental days (excludes end date, min 1)
  const getRentalDays = () => {
    if (!startDate || !endDate) return 0;
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    // Difference in days, minimum 1 day
    const days = differenceInDays(end, start);
    return days < 1 ? 1 : days;
  };
  const rentalDays = getRentalDays();
  // CORRECT: Calculate total hours for hourly mode
  const getTotalHours = () => {
    if (!startDate || !endDate || mode !== 'hourly') return 0;
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const daysDiff = differenceInDays(end, start);
    // If same day or multiple days
    if (daysDiff === 0) {
      // Same day: just hours difference
      if (!startTime || !endTime) return 8;
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      const hours = differenceInHours(endDateTime, startDateTime);
      return hours < 1 ? 1 : hours;
    } else {
      // Multiple days: hours per day × number of days
      if (!startTime || !endTime) return 8 * (daysDiff + 1);
      const hoursPerDay = differenceInHours(
        new Date(`2000-01-01T${endTime}`),
        new Date(`2000-01-01T${startTime}`)
      );
      const totalHours = hoursPerDay * (daysDiff + 1);
      return totalHours < 1 ? 1 : totalHours;
    }
  };
  // CORRECT: Get unit price based on selected mode
  const getUnitPrice = () => {
    if (!eq) return 0;
    const modeConfig = PRICING_MODES.find(m => m.value === mode);
    if (!modeConfig) return 0;
    let price = Number(eq[modeConfig.field] || 0);
    // Fallback calculations
    if (price === 0 && eq.price_per_day) {
      switch (mode) {
        case 'hourly':
          price = eq.price_per_day / 8;
          break;
        case 'weekly':
          price = eq.price_per_day * 7;
          break;
        case 'monthly':
          price = eq.price_per_day * 30;
          break;
        default:
          price = eq.price_per_day;
      }
    }
    return price;
  };
  // CORRECT: Calculate total amount based on pricing mode
  const calculateTotalAmount = () => {
    const unitPrice = getUnitPrice();
    if (unitPrice === 0 || rentalDays === 0) return 0;
    switch (mode) {
      case 'hourly': {
        const totalHours = getTotalHours();
        return unitPrice * totalHours;
      }
      case 'daily': {
        return unitPrice * rentalDays;
      }
      case 'weekly': {
        const weeks = Math.ceil(rentalDays / 7);
        return unitPrice * weeks;
      }
      case 'monthly': {
        const months = Math.ceil(rentalDays / 30);
        return unitPrice * months;
      }
      default:
        return unitPrice * rentalDays;
    }
  };
  // CORRECT: Get display text for duration breakdown
  const getDurationBreakdown = () => {
    switch (mode) {
      case 'hourly': {
        const totalHours = getTotalHours();
        return {
          label: `${totalHours} ${t('bookEquipment.summary.hours')}`,
          multiplier: totalHours
        };
      }
      case 'daily': {
        return {
          label: `${rentalDays} ${t('bookEquipment.summary.days')}`,
          multiplier: rentalDays
        };
      }
      case 'weekly': {
        const weeks = Math.ceil(rentalDays / 7);
        return {
          label: `${weeks} ${t('bookEquipment.summary.weeks')} (${rentalDays} days)`,
          multiplier: weeks
        };
      }
      case 'monthly': {
        const months = Math.ceil(rentalDays / 30);
        return {
          label: `${months} ${t('bookEquipment.summary.months')} (${rentalDays} days)`,
          multiplier: months
        };
      }
      default:
        return {
          label: `${rentalDays} ${t('bookEquipment.summary.days')}`,
          multiplier: rentalDays
        };
    }
  };
  const unitPrice = getUnitPrice();
  const totalAmount = calculateTotalAmount();
  const deposit = Number(eq?.deposit_required || 0);
  const durationBreakdown = getDurationBreakdown();
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Validation
    if (!startDate || !endDate) { 
      toast.error(t('bookEquipment.errors.selectDates')); 
      return; 
    }
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (end <= start) { 
      toast.error(t('bookEquipment.errors.invalidDates')); 
      return; 
    }
    // For hourly bookings, validate times
    if (mode === 'hourly') {
      if (!startTime || !endTime) {
        toast.error(t('bookEquipment.errors.selectTimes'));
        return;
      }
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(`${endDate}T${endTime}`);
      if (endDateTime <= startDateTime) {
        toast.error(t('bookEquipment.errors.invalidTimes'));
        return;
      }
    }
    setSubmitting(true);
    try {
      const payload = {
        equipment_id: id,
        pricing_mode: mode,
        start_date: startDate,
        end_date: endDate,
        time_slot_id: selectedSlot || null,
        notes: notes || null,
        delivery_address: deliveryAddress || null,
      };
      // Add time fields for hourly bookings
      if (mode === 'hourly') {
        payload.start_time = startTime;
        payload.end_time = endTime;
      }
      const { data } = await bookingService.create(payload);
      setBookingRef(data.data?.booking_ref || 'BK-XXXXX');
      setDone(true);
      toast.success(t('bookEquipment.success.bookingSent'));
    } catch (err) {
      const errorMessage = err.response?.data?.message || t('bookEquipment.errors.bookingFailed');
      toast.error(errorMessage);
    } finally { 
      setSubmitting(false); 
    }
  };
  if (loading) return <PageLoader />;
  if (!eq) return <div className="py-20 text-center text-[var(--text-muted)]">{t('bookEquipment.errors.equipmentNotFound')}</div>;
  if (done) {
    return (
      <div className="max-w-md mx-auto py-16 text-center animate-scale-in">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text)] mb-2" style={{ fontFamily: 'Syne,sans-serif' }}>
          {t('bookEquipment.success.title')}
        </h2>
        <p className="text-[var(--text-secondary)] mb-2">{t('bookEquipment.success.referenceLabel')}</p>
        <p className="text-2xl font-bold text-brand-500 font-mono mb-5">{bookingRef}</p>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          {t('bookEquipment.success.message')}
        </p>
        <Button onClick={() => navigate('/customer/bookings')} className="w-full">
          {t('bookEquipment.success.viewBookingsButton')}
        </Button>
      </div>
    );
  }
  const availableModes = PRICING_MODES.filter(m => {
    if (eq[m.field] && Number(eq[m.field]) > 0) return true;
    if (m.value === 'hourly' && eq.price_per_day) return true;
    if (m.value === 'weekly' && eq.price_per_day) return true;
    if (m.value === 'monthly' && eq.price_per_day) return true;
    return false;
  });
  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return format(parseISO(dateStr), 'MM/dd/yyyy');
  };
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <button 
        onClick={() => navigate(-1)} 
        className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-brand-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> {t('bookEquipment.backButton')}
      </button>
      <div className="card p-5">
        <div className="flex items-start gap-4 mb-1">
          {eq.images?.[0] && (
            <img src={eq.images[0]} alt={eq.name} className="w-20 h-20 rounded-xl object-cover shrink-0" />
          )}
          <div>
            <h1 className="text-xl font-bold text-[var(--text)]" style={{ fontFamily: 'Syne,sans-serif' }}>{eq.name}</h1>
            <p className="text-sm text-[var(--text-muted)]">{eq.brand} {eq.model} {eq.year && `· ${eq.year}`}</p>
            <div className="flex items-center gap-1 text-xs text-[var(--text-muted)] mt-1">
              <MapPin className="w-3 h-3" /> {eq.city}
              {eq.owner_company && <><span className="mx-1">·</span>{eq.owner_company}</>}
            </div>
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <h2 className="section-title">{t('bookEquipment.form.title')}</h2>
        {/* Pricing mode */}
        <div>
          <label className="label">{t('bookEquipment.form.pricingModeLabel')}</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {availableModes.map(m => {
              let displayPrice = Number(eq[m.field] || 0);
              if (displayPrice === 0 && m.value === 'hourly' && eq.price_per_day) {
                displayPrice = eq.price_per_day / 8;
              }
              if (displayPrice === 0 && m.value === 'weekly' && eq.price_per_day) {
                displayPrice = eq.price_per_day * 7;
              }
              if (displayPrice === 0 && m.value === 'monthly' && eq.price_per_day) {
                displayPrice = eq.price_per_day * 30;
              }
              return (
                <button 
                  key={m.value} 
                  type="button" 
                  onClick={() => setMode(m.value)}
                  className={clsx('p-3 rounded-xl border-2 text-center transition-all',
                    mode === m.value ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-[var(--border)] hover:border-brand-300'
                  )}
                >
                  <p className="text-xs font-bold text-[var(--text)]" style={{ fontFamily: 'Syne,sans-serif' }}>{m.label}</p>
                  <p className="text-xs text-brand-500 mt-0.5">ETB {displayPrice.toLocaleString()}</p>
                </button>
              );
            })}
          </div>
        </div>
        {/* Time selection for hourly mode */}
        {mode === 'hourly' && (
          <div className="grid grid-cols-2 gap-4">
            <Input 
              label={t('bookEquipment.form.startTimeLabel')} 
              type="time" 
              value={startTime} 
              onChange={e => setStartTime(e.target.value)}
              leftIcon={<Clock className="w-4 h-4" />} 
              required 
            />
            <Input 
              label={t('bookEquipment.form.endTimeLabel')} 
              type="time" 
              value={endTime} 
              onChange={e => setEndTime(e.target.value)}
              leftIcon={<Clock className="w-4 h-4" />} 
              required 
            />
          </div>
        )}
        {/* Dates */}
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label={t('bookEquipment.form.startDateLabel')} 
            type="date" 
            value={startDate} 
            onChange={e => setStartDate(e.target.value)}
            min={format(new Date(), 'yyyy-MM-dd')} 
            required 
            leftIcon={<Calendar className="w-4 h-4" />} 
          />
          <Input 
            label={t('bookEquipment.form.endDateLabel')} 
            type="date" 
            value={endDate} 
            onChange={e => setEndDate(e.target.value)}
            min={startDate || format(new Date(), 'yyyy-MM-dd')} 
            required 
            leftIcon={<Calendar className="w-4 h-4" />} 
          />
        </div>
        {/* Time slot (if equipment has time slots) */}
        {eq.time_slots?.filter(s => s.is_active).length > 0 && (
          <div>
            <label className="label">{t('bookEquipment.form.timeSlotLabel')}</label>
            <select 
              value={selectedSlot} 
              onChange={e => setSelectedSlot(e.target.value)} 
              className="input-field w-full"
            >
              <option value="">{t('bookEquipment.form.timeSlotNoPreference')}</option>
              {eq.time_slots.filter(s => s.is_active).map(slot => (
                <option key={slot.id} value={slot.id}>
                  {slot.name} — {slot.day_of_week} {slot.start_time}–{slot.end_time}
                  {slot.price_override ? ` (ETB ${Number(slot.price_override).toLocaleString()}/hr)` : ''}
                </option>
              ))}
            </select>
          </div>
        )}
        {/* Delivery */}
        {eq.delivery_available && (
          <Input 
            label={t('bookEquipment.form.deliveryAddressLabel')} 
            placeholder={t('bookEquipment.form.deliveryAddressPlaceholder', { radius: eq.delivery_radius_km, city: eq.city })}
            value={deliveryAddress} 
            onChange={e => setDeliveryAddress(e.target.value)} 
            leftIcon={<MapPin className="w-4 h-4" />} 
          />
        )}
        {/* Notes */}
        <div>
          <label className="label">{t('bookEquipment.form.notesLabel')}</label>
          <textarea 
            value={notes} 
            onChange={e => setNotes(e.target.value)} 
            rows={3}
            placeholder={t('bookEquipment.form.notesPlaceholder')} 
            className="input-field w-full resize-none" 
          />
        </div>
        {/* Price summary - CORRECTED CALCULATIONS */}
        {startDate && endDate && rentalDays > 0 && (
          <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)] space-y-2">
            <p className="text-sm font-semibold text-[var(--text)] mb-3" style={{ fontFamily: 'Syne,sans-serif' }}>
              {t('bookEquipment.summary.title')}
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">
                ETB {unitPrice.toLocaleString()} × {durationBreakdown.label}
              </span>
              <span className="font-semibold text-[var(--text)]">ETB {totalAmount.toLocaleString()}</span>
            </div>
            {/* Show breakdown for weekly/monthly */}
            {(mode === 'weekly' || mode === 'monthly') && rentalDays > 0 && (
              <div className="flex justify-between text-xs text-[var(--text-muted)] pt-1">
                <span>{rentalDays} days total</span>
                <span>ETB {(totalAmount / durationBreakdown.multiplier).toLocaleString()} per {mode === 'weekly' ? 'week' : 'month'}</span>
              </div>
            )}
            {/* NO PLATFORM FEE */}
            {deposit > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">{t('bookEquipment.summary.deposit')}</span>
                <span className="text-amber-500 font-semibold">ETB {deposit.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold pt-2 border-t border-[var(--border)]">
              <span className="text-[var(--text)]">{t('bookEquipment.summary.total')}</span>
              <span className="text-brand-500" style={{ fontFamily: 'Syne,sans-serif' }}>
                ETB {(totalAmount + deposit).toLocaleString()}
              </span>
            </div>
          </div>
        )}
        {/* Date range display */}
        {startDate && endDate && rentalDays > 0 && (
          <div className="text-center text-xs text-[var(--text-muted)]">
            {formatDate(startDate)} - {formatDate(endDate)} • {rentalDays} day{rentalDays !== 1 ? 's' : ''}
          </div>
        )}
        <Button type="submit" size="lg" className="w-full" loading={submitting}>
          <Calendar className="w-4 h-4" /> {t('bookEquipment.form.submitButton')}
        </Button>
      </form>
    </div>
  );
}