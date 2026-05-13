import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services';
import { Button, SectionHeader } from '../../components/ui';
import toast from 'react-hot-toast';
import { Save, Bell, CreditCard, Loader2 } from 'lucide-react';
export default function OwnerSettings() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  // Get settings from user object (from AuthContext)
  const [notif, setNotif] = useState({
    email: user?.notification_settings?.email ?? true,
    sms: user?.notification_settings?.sms ?? true,
    new_booking: user?.notification_settings?.new_booking ?? true,
    booking_cancelled: user?.notification_settings?.booking_cancelled ?? true,
  });
  const [payout, setPayout] = useState({
    bank_name: user?.payout_settings?.bank_name || '',
    account_number: user?.payout_settings?.account_number || '',
    account_name: user?.payout_settings?.account_name || ''
  });
  // No need to fetch - settings already in user object from AuthContext
  const saveSettings = async () => {
    setSaving(true);
    try {
      // Update settings via API
      const response = await userService.updateSettings({
        notification_settings: notif,
        payout_settings: payout
      });
      // Update local user in AuthContext
      if (updateUser) {
        await updateUser({
          ...user,
          notification_settings: notif,
          payout_settings: payout
        });
      }
      toast.success(t('ownerSettings.saveSuccess'));
    } catch (error) {
      toast.error(t('ownerSettings.saveError'));
    }
    setSaving(false);
  };
  const toggleNotification = (key) => {
    setNotif(prev => ({ ...prev, [key]: !prev[key] }));
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
      </div>
    );
  }
  return (
    <div className="space-y-5 max-w-2xl">
      <SectionHeader 
        title={t('ownerSettings.title')}
        action={
          <Button onClick={saveSettings} loading={saving}>
            <Save className="w-4 h-4" />
            {t('ownerSettings.saveChanges')}
          </Button>
        } 
      />
      {/* Notifications Section */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Bell className="w-4 h-4 text-brand-500" />
          <h2 className="section-title">{t('ownerSettings.notifications.title')}</h2>
        </div>
        {[
          { key: 'email', label: t('ownerSettings.notifications.emailLabel'), desc: t('ownerSettings.notifications.emailDesc') },
          { key: 'sms', label: t('ownerSettings.notifications.smsLabel'), desc: t('ownerSettings.notifications.smsDesc') },
          { key: 'new_booking', label: t('ownerSettings.notifications.newBookingLabel'), desc: t('ownerSettings.notifications.newBookingDesc') },
          { key: 'booking_cancelled', label: t('ownerSettings.notifications.bookingCancelledLabel'), desc: t('ownerSettings.notifications.bookingCancelledDesc') },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-secondary)]">
            <div>
              <p className="text-sm font-semibold text-[var(--text)]" style={{ fontFamily: 'Syne, sans-serif' }}>
                {label}
              </p>
              <p className="text-xs text-[var(--text-muted)]">{desc}</p>
            </div>
            <button
              onClick={() => toggleNotification(key)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                notif[key] ? 'bg-brand-500' : 'bg-[var(--border)]'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  notif[key] ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
      {/* Payout Settings Section */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <CreditCard className="w-4 h-4 text-brand-500" />
          <h2 className="section-title">{t('ownerSettings.payout.title')}</h2>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          {t('ownerSettings.payout.description')}
        </p>
        <div className="space-y-3">
          <div>
            <label className="label">{t('ownerSettings.payout.bankNameLabel')}</label>
            <input
              className="input-field w-full"
              placeholder={t('ownerSettings.payout.bankNamePlaceholder')}
              value={payout.bank_name || ''}
              onChange={(e) => setPayout(prev => ({ ...prev, bank_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">{t('ownerSettings.payout.accountNumberLabel')}</label>
            <input
              className="input-field w-full"
              placeholder={t('ownerSettings.payout.accountNumberPlaceholder')}
              value={payout.account_number || ''}
              onChange={(e) => setPayout(prev => ({ ...prev, account_number: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">{t('ownerSettings.payout.accountNameLabel')}</label>
            <input
              className="input-field w-full"
              placeholder={t('ownerSettings.payout.accountNamePlaceholder')}
              value={payout.account_name || ''}
              onChange={(e) => setPayout(prev => ({ ...prev, account_name: e.target.value }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}