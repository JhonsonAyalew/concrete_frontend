import { forwardRef, useState } from 'react';
import { X, AlertTriangle, Loader2, ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import clsx from 'clsx';
/* ─── Button ─────────────────────────────── */
export function Button({ children, variant = 'primary', size = 'md', loading, className, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed select-none';
  const variants = {
    primary:   'bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow-glow',
    secondary: 'border border-[var(--border)] text-[var(--text)] hover:border-brand-500 hover:text-brand-500 bg-transparent',
    ghost:     'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)]',
    danger:    'bg-red-500 hover:bg-red-600 text-white',
    success:   'bg-green-500 hover:bg-green-600 text-white',
    outline:   'border border-brand-500 text-brand-500 hover:bg-brand-500 hover:text-white',
  };
  const sizes = { sm:'px-3 py-1.5 text-xs', md:'px-5 py-2.5 text-sm', lg:'px-7 py-3.5 text-base', xl:'px-8 py-4 text-lg', icon:'p-2 text-sm' };
  return (
    <button className={clsx(base, variants[variant], sizes[size], className)}
      style={{ fontFamily: 'Syne, sans-serif' }} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}
/* ─── Input ──────────────────────────────── */
export const Input = forwardRef(function Input({ label, error, hint, leftIcon: L, rightIcon: R, className, type, ...props }, ref) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <div className="relative">
        {L && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{L}</span>}
        <input ref={ref} type={isPassword ? (show ? 'text' : 'password') : type}
          className={clsx('input-field', L && 'pl-10', (R || isPassword) && 'pr-10', error && 'border-red-400 focus:border-red-400', className)} {...props} />
        {isPassword && (
          <button type="button" onClick={() => setShow(s => !s)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text)]">
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        {R && !isPassword && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{R}</span>}
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
});
/* ─── Textarea ───────────────────────────── */
export const Textarea = forwardRef(function Textarea({ label, error, hint, className, rows = 4, ...props }, ref) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <textarea ref={ref} rows={rows} className={clsx('input-field resize-none', error && 'border-red-400', className)} {...props} />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="mt-1 text-xs text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
});
/* ─── Select ─────────────────────────────── */
export const Select = forwardRef(function Select({ label, error, children, className, ...props }, ref) {
  return (
    <div className="w-full">
      {label && <label className="label">{label}</label>}
      <select ref={ref} className={clsx('input-field', error && 'border-red-400', className)} {...props}>{children}</select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
});
/* ─── Modal ──────────────────────────────── */
export function Modal({ open, onClose, title, children, size = 'md', footer }) {
  if (!open) return null;
  const sizes = { sm:'max-w-sm', md:'max-w-lg', lg:'max-w-2xl', xl:'max-w-4xl', full:'max-w-6xl' };
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={clsx('modal-content w-full', sizes[size])}>
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <h3 className="section-title">{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--border)]">{footer}</div>}
      </div>
    </div>
  );
}
/* ─── ConfirmDialog ──────────────────────── */
export function ConfirmDialog({ open, onClose, onConfirm, title, message, type = 'danger', loading }) {
  if (!open) return null;
  return (
    <div className="modal-overlay">
      <div className="card w-full max-w-sm p-6 text-center animate-scale-in">
        <div className={clsx('w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4', type === 'danger' ? 'bg-red-100 dark:bg-red-900/30' : 'bg-amber-100 dark:bg-amber-900/30')}>
          <AlertTriangle className={clsx('w-7 h-7', type === 'danger' ? 'text-red-500' : 'text-amber-500')} />
        </div>
        <h3 className="text-lg font-bold mb-2" style={{ fontFamily:'Syne,sans-serif' }}>{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-6">{message}</p>
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button variant={type === 'danger' ? 'danger' : 'primary'} className="flex-1" onClick={onConfirm} loading={loading}>Confirm</Button>
        </div>
      </div>
    </div>
  );
}
/* ─── Spinner / Loader ───────────────────── */
export function Spinner({ size = 'md', className }) {
  const sizes = { sm:'w-4 h-4', md:'w-7 h-7', lg:'w-10 h-10' };
  return <div className={clsx('border-4 border-[var(--border)] border-t-brand-500 rounded-full animate-spin', sizes[size], className)} />;
}
export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center"><Spinner size="lg" className="mx-auto mb-3" /><p className="text-sm text-[var(--text-muted)]">Loading…</p></div>
    </div>
  );
}
/* ─── Pagination ─────────────────────────── */
export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pages.push(i);
  return (
    <div className="flex items-center justify-center gap-1.5 py-4">
      <PgBtn icon={<ChevronLeft className="w-4 h-4" />} onClick={() => onPageChange(page - 1)} disabled={page === 1} />
      {pages[0] > 1 && <><PgNum n={1} cur={page} onClick={onPageChange} />{pages[0] > 2 && <span className="text-[var(--text-muted)] px-1">…</span>}</>}
      {pages.map(n => <PgNum key={n} n={n} cur={page} onClick={onPageChange} />)}
      {pages[pages.length-1] < totalPages && <>{pages[pages.length-1] < totalPages-1 && <span className="text-[var(--text-muted)] px-1">…</span>}<PgNum n={totalPages} cur={page} onClick={onPageChange} /></>}
      <PgBtn icon={<ChevronRight className="w-4 h-4" />} onClick={() => onPageChange(page + 1)} disabled={page === totalPages} />
    </div>
  );
}
function PgBtn({ icon, onClick, disabled }) {
  return <button onClick={onClick} disabled={disabled} className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">{icon}</button>;
}
function PgNum({ n, cur, onClick }) {
  return (
    <button onClick={() => onClick(n)} className={clsx('w-9 h-9 rounded-lg text-sm font-medium transition-all', n === cur ? 'bg-brand-500 text-white' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]')} style={{ fontFamily:'Syne,sans-serif' }}>{n}</button>
  );
}
/* ─── EmptyState ─────────────────────────── */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center px-4">
      {Icon && <div className="w-16 h-16 rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center mb-4"><Icon className="w-8 h-8 text-[var(--text-muted)]" /></div>}
      <h3 className="text-base font-semibold text-[var(--text)] mb-2" style={{ fontFamily:'Syne,sans-serif' }}>{title}</h3>
      {description && <p className="text-sm text-[var(--text-muted)] max-w-xs mb-5">{description}</p>}
      {action}
    </div>
  );
}
/* ─── StatusBadge ────────────────────────── */
export function StatusBadge({ status }) {
  const map = { active:'badge-success', approved:'badge-success', confirmed:'badge-success', completed:'badge-info', pending:'badge-warning', review:'badge-warning', suspended:'badge-danger', rejected:'badge-danger', cancelled:'badge-danger', inactive:'badge-neutral', draft:'badge-neutral', deactivated:'badge-neutral' };
  return <span className={clsx('badge', map[status] || 'badge-neutral')}>{status}</span>;
}
/* ─── Card ───────────────────────────────── */
export function Card({ children, className, ...props }) {
  return <div className={clsx('card p-5', className)} {...props}>{children}</div>;
}
/* ─── StatCard ───────────────────────────── */
export function StatCard({ title, value, change, icon: Icon, color = 'orange', prefix = '', suffix = '' }) {
  const colors = { orange:'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400', blue:'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', green:'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400', purple:'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400', red:'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', cyan:'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' };
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]" style={{ fontFamily:'Syne,sans-serif' }}>{title}</p>
        {Icon && <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', colors[color])}><Icon className="w-5 h-5" /></div>}
      </div>
      <p className="text-2xl font-bold text-[var(--text)]" style={{ fontFamily:'Syne,sans-serif' }}>{prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}</p>
      {change !== undefined && <p className={clsx('text-xs font-medium', change >= 0 ? 'text-green-500' : 'text-red-500')}>{change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last month</p>}
    </div>
  );
}
/* ─── SearchInput ────────────────────────── */
export function SearchInput({ value, onChange, placeholder, className }) {
  return (
    <div className={clsx('relative', className)}>
      <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder || 'Search…'} className="input-field pl-10" />
    </div>
  );
}
/* ─── Table ──────────────────────────────── */
export function Table({ columns, data, loading, emptyText = 'No data found' }) {
  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead><tr>{columns.map(col => <th key={col.key} style={{ width: col.width }}>{col.label}</th>)}</tr></thead>
        <tbody>
          {loading ? Array.from({ length: 5 }).map((_, i) => (
            <tr key={i}>{columns.map(col => <td key={col.key}><div className="skeleton h-4 w-3/4" /></td>)}</tr>
          )) : data.length === 0 ? (
            <tr><td colSpan={columns.length} className="text-center py-12 text-[var(--text-muted)]">{emptyText}</td></tr>
          ) : data.map((row, i) => (
            <tr key={row.id || i}>{columns.map(col => <td key={col.key}>{col.render ? col.render(row[col.key], row) : row[col.key]}</td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
/* ─── Avatar ─────────────────────────────── */
export function Avatar({ src, name, size = 'md' }) {
  const sizes = { sm:'w-7 h-7 text-xs', md:'w-9 h-9 text-sm', lg:'w-12 h-12 text-base', xl:'w-16 h-16 text-xl' };
  const initials = name?.split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase() || '?';
  if (src) return <img src={src} alt={name} className={clsx('rounded-full object-cover', sizes[size])} />;
  return <div className={clsx('rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold', sizes[size])}>{initials}</div>;
}
/* ─── Tabs ───────────────────────────────── */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-secondary)] w-fit flex-wrap">
      {tabs.map(tab => (
        <button key={tab.value} onClick={() => onChange(tab.value)}
          className={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200', active === tab.value ? 'bg-[var(--bg-card)] text-[var(--text)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]')}
          style={{ fontFamily:'Syne,sans-serif' }}>
          {tab.label}
          {tab.count !== undefined && <span className={clsx('ml-1.5 px-1.5 py-0.5 rounded-full text-xs', active === tab.value ? 'bg-brand-500 text-white' : 'bg-[var(--border)] text-[var(--text-muted)]')}>{tab.count}</span>}
        </button>
      ))}
    </div>
  );
}
/* ─── FormRow ────────────────────────────── */
export function FormRow({ children, cols = 2 }) {
  return <div className={clsx('grid gap-4', cols === 2 && 'grid-cols-1 sm:grid-cols-2', cols === 3 && 'grid-cols-1 sm:grid-cols-3')}>{children}</div>;
}
/* ─── SectionHeader ──────────────────────── */
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
      <div><h1 className="page-title">{title}</h1>{subtitle && <p className="mt-1 text-sm text-[var(--text-secondary)]">{subtitle}</p>}</div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
/* ─── StarRating ─────────────────────────── */
export function StarRating({ value, max = 5, size = 'sm', onChange }) {
  const sizes = { sm:'w-4 h-4', md:'w-5 h-5', lg:'w-6 h-6' };
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <svg key={i} onClick={() => onChange?.(i+1)} className={clsx(sizes[size], i < value ? 'text-amber-400' : 'text-[var(--border)]', onChange && 'cursor-pointer hover:text-amber-300 transition-colors')} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
        </svg>
      ))}
    </div>
  );
}