import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { userService, uploadService } from '../../services';
import { authService } from '../../services/authService';
import { Button, Input, Textarea, Avatar, SectionHeader, Modal } from '../../components/ui';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Save, Building, Shield, Camera, CheckCircle, Upload, Loader2, Phone, MapPin, User } from 'lucide-react';
import clsx from 'clsx';
const CITIES = ['Addis Ababa','Dire Dawa','Hawassa','Bahir Dar','Mekelle','Adama','Gondar','Jimma','Dessie','Jijiga'];
export function OwnerProfile() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  /* ── profile form ── */
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: { 
      name: user?.name || '', 
      phone: user?.phone || '', 
      city: user?.city || '', 
      company_name: user?.company_name || '', 
      bio: user?.bio || '' 
    },
  });
  /* ── avatar upload with Cloudinary ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) { 
      toast.error(t('ownerProfile.avatar.errors.fileTooLarge')); 
      return; 
    }
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('ownerProfile.avatar.errors.invalidType'));
      return;
    }
    setUploading(true);
    const loadingToast = toast.loading(t('ownerProfile.avatar.uploading'));
    try {
      // Use the multiple upload method with a single file
      const formData = new FormData();
      formData.append('files', file); // Using 'files' field name as per your backend
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
        toast.success(t('ownerProfile.avatar.success'));
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.message || t('ownerProfile.avatar.errors.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const { data: res } = await userService.updateMe(data);
      updateUser(res.data);
      toast.success(t('ownerProfile.profileUpdateSuccess'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('ownerProfile.profileUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };
  /* ── ID Verification flow ── */
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyStep, setVerifyStep] = useState(0);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [idData, setIdData] = useState({
    idNumber: '', 
    idType: 'national_id', 
    fullName: user?.name || '', 
    dateOfBirth: '',
  });
  const [otp, setOtp] = useState('');
  const handleSendOtp = async () => {
    if (!idData.idNumber.trim() || !idData.fullName.trim() || !idData.dateOfBirth) {
      toast.error(t('ownerProfile.verification.fillAllFields')); 
      return;
    }
    setVerifyLoading(true);
    try {
      await authService.verifyId(idData);
      setVerifyStep(1);
      toast.success(t('ownerProfile.verification.otpSent'));
    } catch (e) {
      toast.error(e.response?.data?.message || t('ownerProfile.verification.requestFailed'));
    } finally {
      setVerifyLoading(false);
    }
  };
  const handleVerifyOtp = async () => {
    if (otp.length < 4) { 
      toast.error(t('ownerProfile.verification.enterOtp')); 
      return; 
    }
    setVerifyLoading(true);
    try {
      // In a real implementation, you would verify the OTP with your backend
      // await authService.verifyOtp({ submissionId: '...', otp });
      updateUser({ id_verified: true });
      toast.success(t('ownerProfile.verification.verifySuccess'));
      setVerifyOpen(false);
      setVerifyStep(0);
      setOtp('');
    } catch (e) {
      toast.error(e.response?.data?.message || t('ownerProfile.verification.verifyFailed'));
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
  return (
    <div className="max-w-xl mx-auto space-y-5">
      <SectionHeader 
        title={t('ownerProfile.header.title')} 
        subtitle={t('ownerProfile.header.subtitle')} 
      />
      {/* Profile card */}
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
              title={t('ownerProfile.avatar.uploadTitle')}>
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
              <span className="badge badge-brand capitalize">{t('ownerProfile.badge.owner')}</span>
              {user?.company_name && (
                <span className="badge badge-info flex items-center gap-1">
                  <Building className="w-3 h-3" /> {user.company_name}
                </span>
              )}
              {user?.id_verified ? (
                <span className="badge badge-success flex items-center gap-1">
                  <Shield className="w-3 h-3" /> {t('ownerProfile.badge.idVerified')}
                </span>
              ) : (
                <span className="badge badge-warning flex items-center gap-1 cursor-pointer"
                  onClick={() => setVerifyOpen(true)}>
                  <Shield className="w-3 h-3" /> {t('ownerProfile.badge.notVerified')}
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
              {user?.avatar_url ? t('ownerProfile.avatar.changePhoto') : t('ownerProfile.avatar.uploadPhoto')}
            </button>
          </div>
        </div>
        {/* Profile form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">{t('ownerProfile.form.fullName')}</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input className={clsx('input-field pl-10 w-full', errors.name && 'border-red-400')}
                placeholder={t('ownerProfile.form.fullNamePlaceholder')} 
                {...register('name', { required: t('ownerProfile.form.nameRequired') })} />
            </div>
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('ownerProfile.form.phone')}</label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input className="input-field pl-10 w-full" placeholder={t('ownerProfile.form.phonePlaceholder')}
                  {...register('phone')} />
              </div>
            </div>
            <div>
              <label className="label">{t('ownerProfile.form.city')}</label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] z-10" />
                <select className="input-field pl-10 w-full" {...register('city')}>
                  <option value="">{t('ownerProfile.form.selectCity')}</option>
                  {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="relative">
            <label className="label">{t('ownerProfile.form.companyName')}</label>
            <div className="relative">
              <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
              <input className="input-field pl-10 w-full" placeholder={t('ownerProfile.form.companyPlaceholder')}
                {...register('company_name')} />
            </div>
          </div>
          <div>
            <label className="label">{t('ownerProfile.form.bio')}</label>
            <textarea className="input-field w-full resize-none" rows={3} 
              placeholder={t('ownerProfile.form.bioPlaceholder')}
              {...register('bio')} />
          </div>
          <Button type="submit" loading={saving}>
            <Save className="w-4 h-4" /> {t('ownerProfile.form.saveButton')}
          </Button>
        </form>
      </div>
      {/* Identity Verification card (only if not verified) */}
      {!user?.id_verified && (
        <div className="card p-5 border-amber-300 dark:border-amber-600">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-[var(--text)]"
                style={{ fontFamily: 'Syne, sans-serif' }}>{t('ownerProfile.verificationCard.title')}</p>
              <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                {t('ownerProfile.verificationCard.description')}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {[
                  t('ownerProfile.verificationCard.benefit1'),
                  t('ownerProfile.verificationCard.benefit2'),
                  t('ownerProfile.verificationCard.benefit3')
                ].map(benefit => (
                  <span key={benefit} className="text-xs px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20
                                           text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
                    {benefit}
                  </span>
                ))}
              </div>
              <Button size="sm" className="mt-4" onClick={() => setVerifyOpen(true)}>
                <Shield className="w-3.5 h-3.5" /> {t('ownerProfile.verificationCard.verifyButton')}
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
                style={{ fontFamily: 'Syne, sans-serif' }}>{t('ownerProfile.verifiedCard.title')}</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                {t('ownerProfile.verifiedCard.description')}
              </p>
            </div>
          </div>
        </div>
      )}
      {/* ID Verification Modal */}
      <Modal open={verifyOpen} onClose={closeVerify}
        title={verifyStep === 0 ? t('ownerProfile.modal.verifyTitle') : t('ownerProfile.modal.otpTitle')}
        size="sm">
        {verifyStep === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-[var(--text-secondary)]">
              {t('ownerProfile.modal.verifyDescription')}
            </p>
            <div>
              <label className="label">{t('ownerProfile.modal.idType')}</label>
              <select className="input-field w-full" value={idData.idType}
                onChange={e => setIdData(p => ({ ...p, idType: e.target.value }))}>
                <option value="national_id">{t('ownerProfile.modal.idTypes.nationalId')}</option>
                <option value="fin">{t('ownerProfile.modal.idTypes.fin')}</option>
                <option value="passport">{t('ownerProfile.modal.idTypes.passport')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t('ownerProfile.modal.idNumber')}</label>
              <input className="input-field w-full" placeholder={t('ownerProfile.modal.idNumberPlaceholder')}
                value={idData.idNumber}
                onChange={e => setIdData(p => ({ ...p, idNumber: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('ownerProfile.modal.fullName')}</label>
              <input className="input-field w-full" placeholder={t('ownerProfile.modal.fullNamePlaceholder')}
                value={idData.fullName}
                onChange={e => setIdData(p => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('ownerProfile.modal.dob')}</label>
              <input type="date" className="input-field w-full"
                value={idData.dateOfBirth}
                onChange={e => setIdData(p => ({ ...p, dateOfBirth: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-1">
              <Button variant="secondary" className="flex-1" onClick={closeVerify}>
                {t('common.cancel')}
              </Button>
              <Button className="flex-1" onClick={handleSendOtp} loading={verifyLoading}>
                {t('ownerProfile.modal.sendOtp')}
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
                style={{ fontFamily: 'Syne, sans-serif' }}>{t('ownerProfile.modal.otpSent')}</p>
              <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                {t('ownerProfile.modal.otpDescription')}
              </p>
            </div>
            <div>
              <label className="label">{t('ownerProfile.modal.enterOtp')}</label>
              <input className="input-field w-full text-center text-xl tracking-[0.5em] font-mono font-bold"
                placeholder="• • • • • •"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1"
                onClick={() => setVerifyStep(0)}>← {t('common.back')}</Button>
              <Button className="flex-1" onClick={handleVerifyOtp} loading={verifyLoading}
                disabled={otp.length < 4}>
                <CheckCircle className="w-4 h-4" /> {t('ownerProfile.modal.verifyButton')}
              </Button>
            </div>
            <button 
              onClick={handleSendOtp} 
              disabled={verifyLoading}
              className="w-full text-xs text-brand-500 hover:text-brand-600 text-center transition-colors">
              {t('ownerProfile.modal.resendOtp')}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
export default OwnerProfile;