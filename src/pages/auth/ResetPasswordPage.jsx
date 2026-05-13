import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/authService';
import { Button, Input } from '../../components/ui';
import { Lock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const token = params.get('token');
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const onSubmit = async ({ password }) => {
    if (!token) { 
      toast.error(t('resetPassword.errors.invalidLink')); 
      return; 
    }
    setLoading(true);
    try {
      await authService.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || t('resetPassword.errors.resetFailed'));
    } finally { 
      setLoading(false); 
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
              </svg>
            </div>
            <span className="font-bold text-lg text-[var(--text)]" style={{ fontFamily:'Syne,sans-serif' }}>
              Equip<span className="text-brand-500">Rent</span>
            </span>
          </Link>
        </div>
        <div className="card p-7">
          {!done ? (
            <>
              <h1 className="text-2xl font-bold text-[var(--text)] mb-1" style={{ fontFamily:'Syne,sans-serif' }}>
                {t('resetPassword.title')}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {t('resetPassword.subtitle')}
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <Input 
                  label={t('resetPassword.newPasswordLabel')} 
                  type="password" 
                  placeholder={t('resetPassword.newPasswordPlaceholder')} 
                  leftIcon={<Lock className="w-4 h-4"/>}
                  error={errors.password?.message && t('resetPassword.errors.passwordRequired')}
                  {...register('password', { 
                    required: true, 
                    minLength: { value: 8, message: 'min' } 
                  })} 
                />
                <Input 
                  label={t('resetPassword.confirmPasswordLabel')} 
                  type="password" 
                  placeholder={t('resetPassword.confirmPasswordPlaceholder')} 
                  leftIcon={<Lock className="w-4 h-4"/>}
                  error={errors.confirmPassword?.message && (
                    errors.confirmPassword.type === 'required' 
                      ? t('resetPassword.errors.confirmRequired')
                      : t('resetPassword.errors.passwordMismatch')
                  )}
                  {...register('confirmPassword', { 
                    required: true, 
                    validate: v => v === watch('password') || 'mismatch' 
                  })} 
                />
                <Button type="submit" size="lg" loading={loading} className="w-full">
                  {t('resetPassword.submitButton')}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-7 h-7 text-green-500"/>
              </div>
              <h2 className="text-xl font-bold text-[var(--text)] mb-2" style={{ fontFamily:'Syne,sans-serif' }}>
                {t('resetPassword.successTitle')}
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {t('resetPassword.successMessage')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}