import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Button, Input } from '../../components/ui';
import { Mail, Lock, Moon, Sun, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();
  const roleRoutes = { admin:'/admin', superadmin:'/admin', owner:'/owner', customer:'/customer' };
  const onSubmit = async ({ email, password }) => {
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(t('auth.loginSuccess', { name: user.name?.split(' ')[0] || user.name }));
      navigate(roleRoutes[user.role] || '/');
    } catch (err) {
      toast.error(err.response?.data?.message || t('auth.loginError'));
    } finally { setLoading(false); }
  };
  const stats = [
    { value: '500+', label: t('auth.stats.equipment') },
    { value: '200+', label: t('auth.stats.owners') },
    { value: '1K+', label: t('auth.stats.rentals') },
  ];
  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-[48%] bg-[#080808] p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-brand-500/8 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-brand-600/8 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full border border-white/[0.04]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[360px] rounded-full border border-white/[0.04]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-white/[0.04]" />
        </div>
         {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
              <img 
                src="/logo.png" 
                alt={t('nav.logoAlt')} 
                className="w-7 h-6 object-cover brightness-0 invert"
              />
            </div>
            <span className="font-bold text-xl text-[var(--text)] tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
              <span className="text-brand-500">C</span>oncrete
            </span>
          </Link>
        {/* Main copy */}
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/15 border border-brand-500/20 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-xs font-semibold text-brand-300" style={{ fontFamily:'Syne,sans-serif' }}>
              {t('auth.badge')}
            </span>
          </div>
          <h2 className="text-[2.6rem] font-bold text-white leading-[1.15] mb-5" style={{ fontFamily:'Syne,sans-serif' }}>
            {t('auth.leftPanel.titleLine1')}<br />
            <span className="text-gradient">{t('auth.leftPanel.titleLine2')}</span><br />
            {t('auth.leftPanel.titleLine3')}
          </h2>
          <p className="text-white/45 text-base leading-relaxed max-w-xs">
            {t('auth.leftPanel.description')}
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {stats.map(({ value, label }) => (
              <div key={label} className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-3 text-center">
                <p className="text-lg font-bold text-brand-400" style={{ fontFamily:'Syne,sans-serif' }}>{value}</p>
                <p className="text-[11px] text-white/35 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-white/20 text-xs">
          © {new Date().getFullYear()} {t('auth.footer.copyright')}
        </p>
      </div>
      {/* Right form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative">
        <button 
          onClick={toggle} 
          className="absolute top-5 right-5 p-2 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)] transition-colors"
          aria-label={dark ? t('common.lightMode') : t('common.darkMode')}
        >
          {dark ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}
        </button>
        <div className="w-full max-w-[400px] animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
             {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-10 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
              <img 
                src="/logo.png" 
                alt={t('nav.logoAlt')} 
                className="w-7 h-6 object-cover brightness-0 invert"
              />
            </div>
            <span className="font-bold text-xl text-[var(--text)] tracking-tight" style={{ fontFamily: 'Syne, sans-serif' }}>
              <span className="text-brand-500">C</span>oncrete
            </span>
          </Link>
          </div>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[var(--text)] mb-2" style={{ fontFamily:'Syne,sans-serif' }}>
              {t('auth.welcomeBack')}
            </h1>
            <p className="text-[var(--text-secondary)] text-sm">
              {t('auth.loginSubtitle')}
            </p>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input 
              label={t('auth.email')} 
              type="email" 
              placeholder={t('auth.emailPlaceholder')}
              leftIcon={<Mail className="w-4 h-4"/>} 
              error={errors.email?.message && t('auth.emailRequired')}
              {...register('email', { 
                required: true, 
                pattern: { value: /^\S+@\S+$/i, message: 'invalid' } 
              })} 
            />
            <Input 
              label={t('auth.password')} 
              type="password" 
              placeholder={t('auth.passwordPlaceholder')}
              leftIcon={<Lock className="w-4 h-4"/>} 
              error={errors.password?.message && (
                errors.password.type === 'required' 
                  ? t('auth.passwordRequired') 
                  : t('auth.passwordMinLength')
              )}
              {...register('password', { 
                required: true, 
                minLength: { value: 6, message: 'minLength' } 
              })} 
            />
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-brand-500 hover:text-brand-600 font-medium">
                {t('auth.forgotPassword')}
              </Link>
            </div>
            <Button type="submit" size="lg" loading={loading} className="w-full mt-2">
              {t('auth.signIn')} <ArrowRight className="w-4 h-4"/>
            </Button>
          </form>
          <p className="mt-5 text-center text-sm text-[var(--text-secondary)]">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="text-brand-500 hover:text-brand-600 font-semibold">
              {t('auth.createAccount')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}