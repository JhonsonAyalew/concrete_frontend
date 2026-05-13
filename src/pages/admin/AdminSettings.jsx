import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { settingsService } from '../../services';
import { Button, Input, SectionHeader } from '../../components/ui';
import toast from 'react-hot-toast';
import { Save } from 'lucide-react';
export default function AdminSettings() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    settingsService.getAll()
      .then(r => {
        // Extract the actual values from the nested structure
        const settingsData = r.data.data?.settings || {};
        const flatSettings = {};
        // Convert from { key: { value, type, ... } } to { key: value }
        Object.keys(settingsData).forEach(key => {
          flatSettings[key] = settingsData[key]?.value;
        });
        setSettings(flatSettings);
      })
      .catch(() => {
        // Default settings
        setSettings({ 
          commission_rate: 0.12, 
          platform_name: 'EquipRent Ethiopia', 
          maintenance_mode: false, 
          max_images_per_equipment: 10 
        });
      })
      .finally(() => setLoading(false));
  }, []);
  const handleSave = async () => {
    setSaving(true);
    try {
      // Prepare the data for update - send only the values
      const updateData = {};
      Object.keys(settings).forEach(key => {
        let value = settings[key];
        // Convert boolean to string 'true'/'false' if your backend expects string
        if (typeof value === 'boolean') {
          value = value.toString();
        }
        updateData[key] = value;
      });
      await settingsService.update(updateData);
      toast.success(t('adminSettings.saveSuccess'));
    } catch (error) { 
      toast.error(t('adminSettings.saveError')); 
    }
    setSaving(false);
  };
  const handleInputChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };
  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"/></div>;
  return (
    <div className="space-y-5 max-w-2xl">
      <SectionHeader 
        title={t('adminSettings.title')} 
        subtitle={t('adminSettings.subtitle')} 
        action={
          <Button onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4"/>{t('adminSettings.saveButton')}
          </Button>
        } 
      />
      <div className="card p-6 space-y-5">
        <h2 className="section-title">{t('adminSettings.general.title')}</h2>
        {[
          { key:'platform_name', label: t('adminSettings.general.platformName'), placeholder: 'EquipRent Ethiopia', type: 'text' },
          { key:'max_images_per_equipment', label: t('adminSettings.general.maxImages'), placeholder: '10', type: 'number' },
        ].map(({ key, label, placeholder, type }) => (
          <Input 
            key={key} 
            label={label} 
            type={type}
            placeholder={placeholder} 
            value={settings[key] || ''} 
            onChange={e => handleInputChange(key, type === 'number' ? Number(e.target.value) : e.target.value)} 
          />
        ))}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-secondary)]">
          <div>
            <p className="text-sm font-semibold text-[var(--text)]" style={{fontFamily:'Syne,sans-serif'}}>
              {t('adminSettings.general.maintenanceMode.title')}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {t('adminSettings.general.maintenanceMode.description')}
            </p>
          </div>
          <button 
            type="button"
            onClick={() => handleInputChange('maintenance_mode', !settings.maintenance_mode)}
            className={`w-11 h-6 rounded-full transition-colors ${settings.maintenance_mode ? 'bg-brand-500' : 'bg-[var(--border)]'}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white shadow mx-1 transition-transform ${settings.maintenance_mode ? 'translate-x-5' : ''}`}/>
          </button>
        </div>
      </div>
    </div>
  );
}