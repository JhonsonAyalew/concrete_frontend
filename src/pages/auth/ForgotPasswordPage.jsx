import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/authService';
import { Button, Input } from '../../components/ui';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, getValues } = useForm();
  const onSubmit = async ({ email }) => {
    setLoading(true);
    try {
      await authService.forgotPassword(email);
      setSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || t('forgotPassword.errors.emailNotFound'));
    } finally { setLoading(false); }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm animate-fade-in">
       {/* Logo - Centered */}
          <div className="flex justify-center mb-6">
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
        <div className="card p-7">
          {!sent ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-[var(--text)] mb-2" style={{ fontFamily:'Syne,sans-serif' }}>
                  {t('forgotPassword.title')}
                </h1>
                <p className="text-sm text-[var(--text-secondary)]">
                  {t('forgotPassword.description')}
                </p>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input 
                  label={t('forgotPassword.emailLabel')} 
                  type="email" 
                  placeholder={t('forgotPassword.emailPlaceholder')}
                  leftIcon={<Mail className="w-4 h-4"/>} 
                  error={errors.email?.message && (
                    errors.email.type === 'required' 
                      ? t('forgotPassword.errors.emailRequired') 
                      : t('forgotPassword.errors.emailInvalid')
                  )}
                  {...register('email', { 
                    required: true, 
                    pattern: { value: /^\S+@\S+$/i, message: 'invalid' } 
                  })} 
                />
                <Button type="submit" size="lg" loading={loading} className="w-full">
                  {t('forgotPassword.resetButton')}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-500"/>
              </div>
              <h2 className="text-xl font-bold text-[var(--text)] mb-2" style={{ fontFamily:'Syne,sans-serif' }}>
                {t('forgotPassword.successTitle')}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                {t('forgotPassword.successMessage')}
              </p>
              <p className="text-sm font-semibold text-brand-500">{getValues('email')}</p>
              <p className="text-xs text-[var(--text-muted)] mt-3">
                {t('forgotPassword.spamHint')}
              </p>
            </div>
          )}
          <div className="mt-5 pt-4 border-t border-[var(--border)] text-center">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-brand-500 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5"/> {t('forgotPassword.backToLogin')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}