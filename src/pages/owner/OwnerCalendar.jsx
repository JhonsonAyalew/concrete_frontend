import { useState, useEffect } from 'react';
import { ownerAnalyticsService } from '../../services';
import { SectionHeader } from '../../components/ui';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, parseISO, isWithinInterval } from 'date-fns';
import { ChevronLeft, ChevronRight, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import clsx from 'clsx';
export default function OwnerCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  useEffect(() => {
    setLoading(true);
    setError(null);
    // Call the calendar endpoint which returns bookings for the month
    ownerAnalyticsService.calendar(month, year)
      .then(response => {
        // The backend returns: { success: true, data: [...] }
        const data = response?.data?.data || response?.data || [];
        setBookings(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        if (err.response?.status === 404) {
          setError('Calendar endpoint not found. Please check backend routes.');
        } else if (err.response?.status === 401) {
          setError('Please login again to view calendar.');
        } else {
          setError('Could not load calendar data. Please try again.');
        }
        setBookings([]);
      })
      .finally(() => setLoading(false));
  }, [month, year]);
  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });
  const startPad = getDay(startOfMonth(currentDate)); // 0=Sun
  // Build a map of date -> array of bookings for that date
  const bookingMap = {};
  bookings.forEach(booking => {
    // Handle booking date range
    const startDate = parseISO(booking.start_date);
    const endDate = parseISO(booking.end_date);
    // Mark each day in the booking range
    let current = startDate;
    while (current <= endDate) {
      const dateStr = format(current, 'yyyy-MM-dd');
      if (!bookingMap[dateStr]) {
        bookingMap[dateStr] = [];
      }
      bookingMap[dateStr].push({
        id: booking.id,
        booking_ref: booking.booking_ref,
        status: booking.status,
        equipment_name: booking.equipment_name,
        equipment_id: booking.equipment_id,
        customer_name: booking.customer_name,
        start_time: booking.start_time,
        end_time: booking.end_time,
        start_date: booking.start_date,
        end_date: booking.end_date
      });
      current = new Date(current.setDate(current.getDate() + 1));
    }
  });
  // Get status color and text
  const getStatusInfo = (status) => {
    switch(status) {
      case 'confirmed':
        return { bg: 'bg-green-500', hover: 'hover:bg-green-600', text: 'Confirmed', textColor: 'text-green-300' };
      case 'pending':
        return { bg: 'bg-yellow-500', hover: 'hover:bg-yellow-600', text: 'Pending', textColor: 'text-yellow-300' };
      case 'completed':
        return { bg: 'bg-blue-500', hover: 'hover:bg-blue-600', text: 'Completed', textColor: 'text-blue-300' };
      case 'cancelled':
        return { bg: 'bg-red-500', hover: 'hover:bg-red-600', text: 'Cancelled', textColor: 'text-red-300' };
      default:
        return { bg: 'bg-brand-500', hover: 'hover:bg-brand-600', text: 'Booked', textColor: 'text-brand-300' };
    }
  };
  const prevMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  // Calculate summary stats
  const uniqueBookedDays = Object.keys(bookingMap).length;
  const totalBookings = bookings.length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <SectionHeader 
        title="Availability Calendar" 
        subtitle="See when your equipment is booked" 
      />
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">{error}</p>
        </div>
      )}
      <div className="card p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={prevMonth}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold text-[var(--text)]" style={{ fontFamily:'Syne,sans-serif' }}>
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          <button 
            onClick={nextMonth}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[var(--bg-secondary)] text-[var(--text-secondary)] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div 
              key={d} 
              className="text-center text-xs font-bold text-[var(--text-muted)] py-2" 
              style={{ fontFamily:'Syne,sans-serif' }}
            >
              {d}
            </div>
          ))}
        </div>
        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Padding for first week */}
          {Array.from({ length: startPad }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square" />
          ))}
          {days.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const dayBookings = bookingMap[dateStr] || [];
            const hasBookings = dayBookings.length > 0;
            const today = isToday(day);
            // Determine the primary status for coloring (highest priority: confirmed > pending > completed > cancelled)
            let primaryStatus = null;
            if (hasBookings) {
              if (dayBookings.some(b => b.status === 'confirmed')) primaryStatus = 'confirmed';
              else if (dayBookings.some(b => b.status === 'pending')) primaryStatus = 'pending';
              else if (dayBookings.some(b => b.status === 'completed')) primaryStatus = 'completed';
              else primaryStatus = dayBookings[0].status;
            }
            const statusInfo = primaryStatus ? getStatusInfo(primaryStatus) : null;
            return (
              <div
                key={dateStr}
                className={clsx(
                  'aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all relative group',
                  hasBookings && statusInfo.bg,
                  hasBookings && statusInfo.hover,
                  hasBookings && 'text-white shadow-sm cursor-pointer',
                  !hasBookings && today && 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 ring-2 ring-brand-500',
                  !hasBookings && !today && 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text)]'
                )}
                style={{ fontFamily: 'Syne, sans-serif' }}
              >
                <span className={clsx(
                  hasBookings && 'font-bold',
                  !hasBookings && today && 'font-bold'
                )}>
                  {format(day, 'd')}
                </span>
                {hasBookings && dayBookings.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayBookings.slice(0, 3).map((_, idx) => (
                      <div key={idx} className="w-1 h-1 rounded-full bg-white/70" />
                    ))}
                  </div>
                )}
                {/* Tooltip on hover */}
                {hasBookings && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 min-w-[180px] p-2 rounded-lg bg-gray-900 text-white text-xs shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                    <p className="font-semibold text-xs mb-1">
                      {dayBookings.length} booking{dayBookings.length > 1 ? 's' : ''}
                    </p>
                    {dayBookings.slice(0, 2).map((booking, idx) => {
                      const bookingStatusInfo = getStatusInfo(booking.status);
                      return (
                        <div key={idx} className="mt-1.5 pt-1.5 border-t border-gray-700 first:border-t-0 first:mt-0 first:pt-0">
                          <p className="font-semibold truncate text-xs">{booking.equipment_name}</p>
                          {booking.customer_name && (
                            <p className="text-gray-300 truncate text-[10px] mt-0.5">
                              {booking.customer_name}
                            </p>
                          )}
                          <p className={clsx('text-[10px] capitalize mt-0.5', bookingStatusInfo.textColor)}>
                            {bookingStatusInfo.text}
                          </p>
                          {booking.start_time && booking.end_time && (
                            <p className="text-gray-400 text-[9px] mt-0.5">
                              {booking.start_time} - {booking.end_time}
                            </p>
                          )}
                        </div>
                      );
                    })}
                    {dayBookings.length > 2 && (
                      <p className="text-gray-400 text-[10px] mt-1.5 pt-1.5 border-t border-gray-700">
                        +{dayBookings.length - 2} more
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-5 pt-4 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-lg bg-green-500" />
            <span className="text-xs text-[var(--text-secondary)]">Confirmed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-lg bg-yellow-500" />
            <span className="text-xs text-[var(--text-secondary)]">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-lg bg-blue-500" />
            <span className="text-xs text-[var(--text-secondary)]">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-lg bg-red-500" />
            <span className="text-xs text-[var(--text-secondary)]">Cancelled</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-lg bg-brand-100 dark:bg-brand-900/30 ring-2 ring-brand-500" />
            <span className="text-xs text-[var(--text-secondary)]">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)]" />
            <span className="text-xs text-[var(--text-secondary)]">Available</span>
          </div>
        </div>
        {/* Monthly summary stats */}
        {totalBookings > 0 && (
          <div className="mt-4 pt-4 border-t border-[var(--border)]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-brand-500">{uniqueBookedDays}</p>
                <p className="text-xs text-[var(--text-muted)]">Booked Days</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-brand-500">{totalBookings}</p>
                <p className="text-xs text-[var(--text-muted)]">Total Bookings</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-green-500">{confirmedBookings}</p>
                <p className="text-xs text-[var(--text-muted)]">Confirmed</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-yellow-500">{pendingBookings}</p>
                <p className="text-xs text-[var(--text-muted)]">Pending</p>
              </div>
            </div>
          </div>
        )}
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 rounded-xl bg-[var(--bg-card)]/80 flex items-center justify-center">
            <div className="w-6 h-6 border-3 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      {/* No data message */}
      {!loading && bookings.length === 0 && !error && (
        <div className="card p-12 text-center">
          <CalendarIcon className="w-12 h-12 mx-auto mb-3 text-[var(--text-muted)] opacity-30" />
          <p className="text-sm text-[var(--text-secondary)]">No bookings found for this month</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            When you receive bookings, they'll appear here
          </p>
        </div>
      )}
    </div>
  );
}