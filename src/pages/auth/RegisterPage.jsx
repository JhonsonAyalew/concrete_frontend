import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { authService } from '../../services/authService';
import { Button, Input, Select } from '../../components/ui';
import { Mail, Lock, User, Phone, MapPin, Building, ArrowRight, ArrowLeft, CheckCircle, Wrench, HardHat } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [registered, setRegistered] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  const [idData, setIdData] = useState({ idNumber: '', idType: 'national_id', fullName: '', dateOfBirth: '' });
  
  // Get cities from translation
  const CITIES = t('register.cities', { returnObjects: true }) || [
    'Addis Ababa', 'Dire Dawa', 'Hawassa', 'Bahir Dar', 
    'Mekelle', 'Adama', 'Gondar', 'Jimma', 'Dessie', 'Jijiga'
  ];
  
  const onDetails = async (data) => {
    setLoading(true);
    
    try {
      // Make the API call
      const response = await authService.register({ ...data, role });
      
      // Check if response exists and was successful
      if (response && response.status === 201) {
        toast.success('Account created successfully!');
        setStep(2);
      } else if (response && response.data && response.data.success === true) {
        toast.success('Account created successfully!');
        setStep(2);
      } else {
        // Response came back but wasn't successful
        const errorMessage = response?.data?.message || 'Registration failed';
        toast.error(errorMessage);
      }
      
    } catch (error) {
      // This is where the 409 error will be caught
      console.log('Full error object:', error);
      
      // Check if error has response property (axios error)
      if (error.response) {
        const statusCode = error.response.status;
        const errorMessage = error.response.data?.message;
        
        console.log('Status code:', statusCode);
        console.log('Error message:', errorMessage);
        
        // Handle different status codes
        if (statusCode === 409) {
          toast.error('This email is already registered. Please login instead.');
        } else if (statusCode === 400) {
          toast.error(errorMessage || 'Please check your information and try again.');
        } else if (statusCode === 422) {
          toast.error('Validation failed. Please check all fields.');
        } else if (statusCode === 500) {
          toast.error('Server error. Please try again later.');
        } else {
          toast.error(errorMessage || 'Registration failed. Please try again.');
        }
      } else if (error.request) {
        // Request was made but no response received
        toast.error('Network error. Please check your connection.');
      } else {
        // Something else happened
        toast.error(error.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const sendOtp = async () => {
    if (!idData.idNumber || !idData.fullName) { 
      toast.error(t('register.messages.fillIdFields')); 
      return; 
    }
    setLoading(true);
    try {
      await authService.verifyId({ ...idData });
      setOtpSent(true);
      toast.success(t('register.messages.otpSent'));
    } catch (err) {
      toast.error(err.response?.data?.message || t('register.messages.verificationFailed'));
    } finally { setLoading(false); }
  };
  
  const finishVerify = async (e) => {
    e.preventDefault();
    setRegistered(true);
    toast.success(t('register.messages.idVerified'));
    setTimeout(() => navigate('/login'), 1500);
  };
  
  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="text-center animate-scale-in">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-[var(--text)] mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
            {t('register.messages.completionTitle')}
          </h2>
          <p className="text-[var(--text-secondary)]">{t('register.messages.redirecting')}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] px-4 py-12">
      <div className="w-full max-w-lg animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
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
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={clsx('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all', 
                  i < step ? 'bg-green-500 text-white' : 
                  i === step ? 'bg-brand-500 text-white' : 
                  'bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border)]')} 
                  style={{ fontFamily: 'Syne, sans-serif' }}>
                  {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={clsx('text-xs font-medium hidden sm:block', 
                  i === step ? 'text-[var(--text)]' : 'text-[var(--text-muted)]')} 
                  style={{ fontFamily: 'Syne, sans-serif' }}>
                  {i === 0 && t('register.steps.role')}
                  {i === 1 && t('register.steps.details')}
                  {i === 2 && t('register.steps.verifyId')}
                </span>
                {i < 2 && <div className={clsx('w-8 h-0.5 mx-1', i < step ? 'bg-green-500' : 'bg-[var(--border)]')} />}
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6 sm:p-8">
          {/* Step 0 — Choose Role */}
          {step === 0 && (
            <div className="animate-fade-in">
              <h1 className="text-2xl font-bold text-[var(--text)] mb-2" style={{ fontFamily: 'Syne, sans-serif' }}>
                {t('register.role.title')}
              </h1>
              <p className="text-[var(--text-secondary)] text-sm mb-7">
                {t('register.role.subtitle')}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7">
                {[
                  { value: 'customer', Icon: HardHat, title: t('register.role.customerTitle'), desc: t('register.role.customerDesc') },
                  { value: 'owner', Icon: Wrench, title: t('register.role.ownerTitle'), desc: t('register.role.ownerDesc') },
                ].map(({ value, Icon, title, desc }) => (
                  <button key={value} onClick={() => setRole(value)}
                    className={clsx('p-5 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-md',
                      role === value ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-[var(--border)] hover:border-brand-300 bg-[var(--bg-secondary)]')}>
                    <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center mb-3', 
                      role === value ? 'bg-brand-500 text-white' : 'bg-[var(--bg-card)] text-[var(--text-muted)]')}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className="font-semibold text-[var(--text)] text-sm" style={{ fontFamily: 'Syne, sans-serif' }}>{title}</p>
                    <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{desc}</p>
                  </button>
                ))}
              </div>
              <Button className="w-full" size="lg" disabled={!role} onClick={() => setStep(1)}>
                {t('register.buttons.continue')} <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
                {t('register.role.hasAccount')} <Link to="/login" className="text-brand-500 font-semibold">{t('register.role.signIn')}</Link>
              </p>
            </div>
          )}
          {/* Step 1 — Account Details */}
          {step === 1 && (
            <form onSubmit={handleSubmit(onDetails)} className="animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <button type="button" onClick={() => setStep(0)} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h1 className="text-xl font-bold text-[var(--text)]" style={{ fontFamily: 'Syne, sans-serif' }}>
                    {role === 'owner' ? t('register.details.ownerTitle') : t('register.details.customerTitle')}
                  </h1>
                  <p className="text-xs text-[var(--text-secondary)]">{t('register.details.subtitle')}</p>
                </div>
              </div>
              <div className="space-y-4">
                <Input 
                  label={t('register.details.fullName')} 
                  placeholder={t('register.details.fullNamePlaceholder')} 
                  leftIcon={<User className="w-4 h-4" />}
                  error={errors.name?.message && t('register.validation.nameRequired')} 
                  {...register('name', { required: true, minLength: { value: 2, message: 'too short' } })} 
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input 
                    label={t('register.details.email')} 
                    type="email" 
                    placeholder={t('register.details.emailPlaceholder')} 
                    leftIcon={<Mail className="w-4 h-4" />}
                    error={errors.email?.message && (errors.email.type === 'required' ? t('register.validation.emailRequired') : t('register.validation.emailInvalid'))}
                    {...register('email', { required: true, pattern: { value: /^\S+@\S+$/i, message: 'invalid' } })} 
                  />
                  <Input 
                    label={t('register.details.phone')} 
                    placeholder={t('register.details.phonePlaceholder')} 
                    leftIcon={<Phone className="w-4 h-4" />}
                    error={errors.phone?.message && t('register.validation.phoneRequired')} 
                    {...register('phone', { required: true })} 
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input 
                    label={t('register.details.password')} 
                    type="password" 
                    placeholder={t('register.details.passwordPlaceholder')} 
                    leftIcon={<Lock className="w-4 h-4" />}
                    error={errors.password?.message && (errors.password.type === 'required' ? t('register.validation.passwordRequired') : t('register.validation.passwordMin'))}
                    {...register('password', { required: true, minLength: { value: 8, message: 'min 8' } })} 
                  />
                  <Input 
                    label={t('register.details.confirmPassword')} 
                    type="password" 
                    placeholder={t('register.details.confirmPasswordPlaceholder')} 
                    leftIcon={<Lock className="w-4 h-4" />}
                    error={errors.confirmPassword?.message && t('register.validation.passwordMismatch')}
                    {...register('confirmPassword', { required: true, validate: v => v === watch('password') || 'mismatch' })} 
                  />
                </div>
                <Select 
                  label={t('register.details.city')} 
                  error={errors.city?.message && t('register.validation.cityRequired')} 
                  {...register('city', { required: true })}
                >
                  <option value="">{t('register.details.selectCity')}</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </Select>
                {role === 'owner' && (
                  <Input 
                    label={t('register.details.companyName')} 
                    placeholder={t('register.details.companyPlaceholder')} 
                    leftIcon={<Building className="w-4 h-4" />}
                    error={errors.company_name?.message && t('register.validation.companyRequired')} 
                    {...register('company_name', { required: true })} 
                  />
                )}
              </div>
              <Button type="submit" size="lg" loading={loading} className="w-full mt-6">
                {t('register.buttons.createAccount')} <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}
          {/* Step 2 — ID Verification */}
          {step === 2 && (
            <div className="animate-fade-in">
              <h1 className="text-xl font-bold text-[var(--text)] mb-1" style={{ fontFamily: 'Syne, sans-serif' }}>
                {t('register.verify.title')}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mb-6">
                {t('register.verify.subtitle')}
              </p>
              {!otpSent ? (
                <div className="space-y-4">
                  <Select 
                    label={t('register.verify.idType')} 
                    value={idData.idType} 
                    onChange={e => setIdData(p => ({ ...p, idType: e.target.value }))}
                  >
                    <option value="national_id">{t('register.verify.nationalId')}</option>
                    <option value="fin">{t('register.verify.fin')}</option>
                    <option value="passport">{t('register.verify.passport')}</option>
                  </Select>
                  <Input 
                    label={t('register.verify.idNumber')} 
                    placeholder={t('register.verify.idNumberPlaceholder')} 
                    value={idData.idNumber}
                    onChange={e => setIdData(p => ({ ...p, idNumber: e.target.value }))} 
                  />
                  <Input 
                    label={t('register.verify.fullName')} 
                    placeholder={t('register.verify.fullNamePlaceholder')} 
                    value={idData.fullName}
                    onChange={e => setIdData(p => ({ ...p, fullName: e.target.value }))} 
                  />
                  <Input 
                    label={t('register.verify.dateOfBirth')} 
                    type="date" 
                    value={idData.dateOfBirth}
                    onChange={e => setIdData(p => ({ ...p, dateOfBirth: e.target.value }))} 
                  />
                  <Button className="w-full" size="lg" loading={loading} onClick={sendOtp}>
                    {t('register.verify.sendOtp')}
                  </Button>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="w-full text-center text-sm text-[var(--text-muted)] hover:text-[var(--text)] transition-colors py-2"
                  >
                    {t('register.verify.skipLater')}
                  </button>
                </div>
              ) : (
                <form onSubmit={finishVerify} className="space-y-4">
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">
                      {t('register.verify.otpSentMessage')}
                    </p>
                  </div>
                  <Input 
                    label={t('register.verify.otpCode')} 
                    placeholder={t('register.verify.otpPlaceholder')} 
                    maxLength={6} 
                    required 
                  />
                  <Button type="submit" size="lg" loading={loading} className="w-full">
                    <CheckCircle className="w-4 h-4" /> {t('register.verify.verifyButton')}
                  </Button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
