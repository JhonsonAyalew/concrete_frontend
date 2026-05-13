import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services';
import { Button, Input, Textarea, Avatar, SectionHeader } from '../../components/ui';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Save, Camera, Upload, Loader2 } from 'lucide-react';
export default function AdminProfile() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const { register, handleSubmit, formState:{errors} } = useForm({ 
    defaultValues: { 
      name: user?.name || '', 
      phone: user?.phone || '', 
      city: user?.city || '', 
      bio: user?.bio || '' 
    } 
  });
  // Avatar upload handler
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) { 
      toast.error(t('adminProfile.avatar.errors.fileTooLarge')); 
      return; 
    }
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('adminProfile.avatar.errors.invalidType'));
      return;
    }
    setUploading(true);
    const loadingToast = toast.loading(t('adminProfile.avatar.uploading'));
    try {
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
        toast.success(t('adminProfile.avatar.success'));
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(error.message || t('adminProfile.avatar.errors.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };
  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const { data: res } = await userService.updateMe(data);
      updateUser(res.data);
      toast.success(t('adminProfile.form.successMessage'));
    } catch { 
      toast.error(t('adminProfile.form.errorMessage')); 
    }
    setSaving(false);
  };
  // Get initials for avatar fallback
  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  return (
    <div className="space-y-5 max-w-2xl">
      <SectionHeader title={t('adminProfile.title')} />
      <div className="card p-6">
        {/* Avatar section with upload functionality */}
        <div className="flex items-center gap-4 mb-6 pb-5 border-b border-[var(--border)]">
          <div className="relative shrink-0">
            <Avatar 
              src={user?.avatar_url} 
              name={user?.name} 
              size="xl" 
            />
            {/* Camera overlay button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-brand-500 hover:bg-brand-600
                         text-white flex items-center justify-center shadow-lg transition-all
                         active:scale-95 disabled:opacity-70"
              title={t('adminProfile.avatar.uploadTitle')}>
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
          <div>
            <p className="text-xl font-bold text-[var(--text)]" style={{fontFamily:'Syne,sans-serif'}}>{user?.name}</p>
            <p className="text-[var(--text-muted)]">{user?.email}</p>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="badge badge-brand mt-1 capitalize">{user?.role}</span>
            </div>
            {/* Upload hint link */}
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="mt-2 text-xs text-brand-500 hover:text-brand-600 font-medium flex items-center gap-1
                         transition-colors disabled:opacity-50">
              <Upload className="w-3 h-3" />
              {user?.avatar_url ? t('adminProfile.avatar.changePhoto') : t('adminProfile.avatar.uploadPhoto')}
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input 
            label={t('adminProfile.form.fullName')} 
            error={errors.name?.message && t('adminProfile.form.nameRequired')} 
            {...register('name', { required: true })} 
          />
          <Input 
            label={t('adminProfile.form.phone')} 
            {...register('phone')} 
          />
          <Input 
            label={t('adminProfile.form.city')} 
            {...register('city')} 
          />
          <Textarea 
            label={t('adminProfile.form.bio')} 
            rows={3} 
            {...register('bio')} 
          />
          <Button type="submit" loading={saving}>
            <Save className="w-4 h-4"/>{t('adminProfile.form.submitButton')}
          </Button>
        </form>
      </div>
    </div>
  );
}