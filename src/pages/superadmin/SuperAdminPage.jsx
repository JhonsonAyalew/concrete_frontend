import { Link } from 'react-router-dom';
import { Shield, Users, Settings, Trash2 } from 'lucide-react';
export default function SuperAdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]" style={{ fontFamily: 'Syne,sans-serif' }}>Super Admin Panel</h1>
          <p className="text-sm text-[var(--text-secondary)]">Full system control and management</p>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {[
          { to: '/admin/admins', icon: Users, title: 'Manage Admins', desc: 'Add or remove administrator accounts', color: 'purple' },
          { to: '/admin/settings', icon: Settings, title: 'Platform Settings', desc: 'Configure commission rates and features', color: 'blue' },
          { to: '/admin', icon: Shield, title: 'Admin Dashboard', desc: 'View full platform analytics', color: 'orange' },
        ].map(({ to, icon: Icon, title, desc, color }) => (
          <Link key={to} to={to} className="card p-6 hover:border-brand-500 transition-all hover:-translate-y-1 duration-200 group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-${color}-100 text-${color}-600 dark:bg-${color}-900/30 dark:text-${color}-400`}>
              <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-[var(--text)] mb-1 group-hover:text-brand-500 transition-colors" style={{ fontFamily: 'Syne,sans-serif' }}>{title}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}