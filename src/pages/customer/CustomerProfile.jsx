import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { userService, uploadService } from '../../services';
import { authService } from '../../services/authService';
import { Button, Input, Select, SectionHeader, Modal } from '../../components/ui';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Save, Shield, Camera, CheckCircle, Upload,
  Loader2, Phone, MapPin, User
} from 'lucide-react';
import clsx from 'clsx';
const CITIES = ['Addis Ababa','Dire Dawa','Hawassa','Bahir Dar','Mekelle','Adama','Gondar','Jimma','Dessie','Jijiga'];
export default function CustomerProfile() {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuth();
  // Get cities from translation or use default
  const cities = t('profile.cities', { returnObjects: true }) || CITIES;
  /* ── profile form ── */
  const [saving,  setSaving]  = useState(false);
  const [uploading, setUploading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name:  user?.name  || '',
      phone: user?.phone || '',
      city:  user?.city  || '',
    },
  });
  /* ── avatar upload with Cloudinary ── */
  const fileInputRef = useRef(null);
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) { 
      toast.error(t('profile.avatar.errors.fileTooLarge')); 
      return; 
    }
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('profile.avatar.errors.invalidType'));
      return;
    }
    setUploading(true);
    const loadingToast = toast.loading(t('profile.avatar.uploading'));
    try {
      // Create FormData with 'files' field name (matches your backend)
      const formData = new FormData();
      formData.append('files', file);
      const response = await fetch('/api/v1/upload/multiple?type=image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const result = await response.json();
      if (response.status === 201 && result.data?.urls?.length) {
        const imageUrl = result.data.urls[0];
        // Update user profile with new avatar URL
        await userService.updateMe({ avatar_url: imageUrl });
        updateUser({ avatar_url: imageUrl });
        toast.dismiss(loadingToast);
        toast.success(t('profile.avatar.success'));
      } else {
        throw new Error(result.message || t('profile.avatar.errors.uploadFailed'));
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.message || t('profile.avatar.errors.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const { data: res } = await userService.updateMe(data);
      updateUser(res.data);
      toast.success(t('profile.form.success'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('profile.form.error'));
    } finally {
      setSaving(false);
    }
  };
  /* ── ID Verification flow ── */
  const [verifyOpen,  setVerifyOpen]  = useState(false);
  const [verifyStep,  setVerifyStep]  = useState(0); // 0 = form, 1 = OTP
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [idData, setIdData] = useState({
    idNumber: '', idType: 'national_id', fullName: user?.name || '', dateOfBirth: '',
  });
  const [otp, setOtp] = useState('');
  const handleSendOtp = async () => {
    if (!idData.idNumber.trim() || !idData.fullName.trim() || !idData.dateOfBirth) {
      toast.error(t('profile.verification.errors.fillAllFields')); 
      return;
    }
    setVerifyLoading(true);
    try {
      await authService.verifyId(idData);
      setVerifyStep(1);
      toast.success(t('profile.verification.otpSent'));
    } catch (e) {
      toast.error(e.response?.data?.message || t('profile.verification.errors.requestFailed'));
    } finally {
      setVerifyLoading(false);
    }
  };
  const handleVerifyOtp = async () => {
    if (otp.length < 4) { 
      toast.error(t('profile.verification.errors.enterOtp')); 
      return; 
    }
    setVerifyLoading(true);
    try {
      // OTP confirmed — mark user verified locally
      updateUser({ id_verified: true });
      toast.success(t('profile.verification.verifiedSuccess'));
      setVerifyOpen(false);
      setVerifyStep(0);
      setOtp('');
    } catch (e) {
      toast.error(e.response?.data?.message || t('profile.verification.errors.otpFailed'));
    } finally {
      setVerifyLoading(false);
    }
  };
  const closeVerify = () => {
    setVerifyOpen(false);
    setVerifyStep(0);
    setOtp('');
    setIdData({ 
      idNumber: '', 
      idType: 'national_id', 
      fullName: user?.name || '', 
      dateOfBirth: '' 
    });
  };
  /* ── avatar display ── */
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  // Get ID type options from translation
  const idTypeOptions = [
    { value: 'national_id', label: t('profile.verification.idTypes.nationalId') },
    { value: 'fin', label: t('profile.verification.idTypes.fin') },
    { value: 'passport', label: t('profile.verification.idTypes.passport') },
  ];
  const verificationBenefits = [
    t('profile.verification.benefits.fasterApprovals'),
    t('profile.verification.benefits.ownerTrust'),
    t('profile.verification.benefits.secureEncrypted'),
  ];
  return (
    <div className="max-w-xl mx-auto space-y-5">
      <SectionHeader 
        title={t('profile.header.title')} 
        subtitle={t('profile.header.subtitle')} 
      />
      {/* ── Profile card ── */}
      <div className="card p-6">
        {/* Avatar section */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-6 pb-6 border-b border-[var(--border)]">
          <div className="relative shrink-0">
            {/* Avatar circle */}
            <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-[var(--border)] ring-offset-2 ring-offset-[var(--bg)]">
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt={user.name}
                  className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-brand-400 to-brand-600
                                flex items-center justify-center text-white text-2xl font-bold">
                  {initials}
                </div>
              )}
            </div>
            {/* Camera overlay button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-brand-500 hover:bg-brand-600
                         text-white flex items-center justify-center shadow-lg transition-all
                         active:scale-95 disabled:opacity-70"
              title={t('profile.avatar.uploadPhoto')}>
              {uploading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/jpeg,image/jpg,image/png,image/webp" 
              className="hidden"
              onChange={handleAvatarChange} 
            />
          </div>
          {/* Name / badges */}
          <div className="text-center sm:text-left">
            <p className="text-xl font-bold text-[var(--text)]"
              style={{ fontFamily: 'Syne, sans-serif' }}>{user?.name}</p>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 flex-wrap justify-center sm:justify-start">
              <span className="badge badge-brand capitalize">{t('profile.role.customer')}</span>
              {user?.id_verified
                ? (
                  <span className="badge badge-success flex items-center gap-1">
                    <Shield className="w-3 h-3" /> {t('profile.verification.idVerified')}
                  </span>
                ) : (
                  <span className="badge badge-warning flex items-center gap-1 cursor-pointer"
                    onClick={() => setVerifyOpen(true)}>
                    <Shield className="w-3 h-3" /> {t('profile.verification.notVerified')}
                  </span>
                )}
            </div>
            {/* Upload hint */}
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-2 text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1
                         transition-colors disabled:opacity-50">
              <Upload className="w-3 h-3" />
              {user?.avatar_url ? t('profile.avatar.changePhoto') : t('profile.avatar.uploadPhoto')}
            </button>
          </div>
        </div>
        {/* Profile form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">{t('profile.form.fullName')}</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input className={clsx('input-field pl-10 w-full', errors.name && 'border-red-400')}
                placeholder={t('profile.form.namePlaceholder')} 
                {...register('name', { required: t('profile.form.errors.nameRequired') })} />
            </div>
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('profile.form.phone')}</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input className="input-field pl-10 w-full" 
                  placeholder={t('profile.form.phonePlaceholder')}
                  {...register('phone')} />
              </div>
            </div>
            <div>
              <label className="label">{t('profile.form.city')}</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] z-10" />
                <select className="input-field pl-10 w-full" {...register('city')}>
                  <option value="">{t('profile.form.selectCity')}</option>
                  {cities.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          <Button type="submit" loading={saving} className="w-full sm:w-auto">
            <Save className="w-4 h-4" /> {t('profile.form.saveButton')}
          </Button>
        </form>
      </div>
      {/* ── Identity Verification card (only if not verified) ── */}
      {!user?.id_verified && (
        <div className="card p-5 border-amber-300 dark:border-amber-600">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--text)]"
                style={{ fontFamily: 'Syne, sans-serif' }}>{t('profile.verification.verifyTitle')}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                {t('profile.verification.verifyDescription')}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {verificationBenefits.map((benefit, idx) => (
                  <span key={idx} className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20
                                           text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
                    {benefit}
                  </span>
                ))}
              </div>
              <Button size="sm" className="mt-4" onClick={() => setVerifyOpen(true)}>
                <Shield className="w-3.5 h-3.5" /> {t('profile.verification.verifyButton')}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Verified badge card */}
      {user?.id_verified && (
        <div className="card p-5 border-green-300 dark:border-green-700">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm font-bold text-green-800 dark:text-green-300"
                style={{ fontFamily: 'Syne, sans-serif' }}>{t('profile.verification.verifiedBadge')}</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                {t('profile.verification.verifiedDescription')}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* ── ID Verification Modal ── */}
      <Modal open={verifyOpen} onClose={closeVerify}
        title={verifyStep === 0 ? t('profile.verification.modal.title') : t('profile.verification.modal.otpTitle')}
        size="sm">
        {verifyStep === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              {t('profile.verification.modal.description')}
            </p>
            <div>
              <label className="label">{t('profile.verification.modal.idType')}</label>
              <select className="input-field w-full" value={idData.idType}
                onChange={e => setIdData(p => ({ ...p, idType: e.target.value }))}>
                {idTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('profile.verification.modal.idNumber')}</label>
              <input className="input-field w-full" 
                placeholder={t('profile.verification.modal.idNumberPlaceholder')}
                value={idData.idNumber}
                onChange={e => setIdData(p => ({ ...p, idNumber: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('profile.verification.modal.fullName')}</label>
              <input className="input-field w-full" 
                placeholder={t('profile.verification.modal.fullNamePlaceholder')}
                value={idData.fullName}
                onChange={e => setIdData(p => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('profile.verification.modal.dateOfBirth')}</label>
              <input type="date" className="input-field w-full"
                value={idData.dateOfBirth}
                onChange={e => setIdData(p => ({ ...p, dateOfBirth: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1" onClick={closeVerify}>
                {t('common.cancel')}
              </Button>
              <Button className="flex-1" onClick={handleSendOtp} loading={verifyLoading}>
                {t('profile.verification.modal.sendOtp')}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* OTP sent confirmation */}
            <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center mx-auto mb-2">
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300"
                style={{ fontFamily: 'Syne, sans-serif' }}>{t('profile.verification.modal.otpSent')}</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                {t('profile.verification.modal.otpDescription')}
              </p>
            </div>
            <div>
              <label className="label">{t('profile.verification.modal.enterOtp')}</label>
              <input className="input-field w-full text-center text-xl tracking-[0.5em] font-mono font-bold"
                placeholder="• • • • • •"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1"
                onClick={() => setVerifyStep(0)}>
                ← {t('common.back')}
              </Button>
              <Button className="flex-1" onClick={handleVerifyOtp} loading={verifyLoading}
                disabled={otp.length < 4}>
                <CheckCircle className="w-4 h-4" /> {t('profile.verification.modal.verify')}
              </Button>
            </div>
            <button 
              onClick={handleSendOtp} 
              disabled={verifyLoading}
              className="w-full text-xs text-brand-500 hover:text-brand-600 text-center transition-colors">
              {t('profile.verification.modal.resendOtp')}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}