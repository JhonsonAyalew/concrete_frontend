import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService } from '../../services';
import { Button, Input, Textarea } from '../../components/ui';
import { Mail, Phone, MapPin, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
export default function ContactPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();
  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await adminService.contact(data);
      setSent(true);
      reset();
    } catch {
      toast.error(t('contact.form.errorMessage'));
    } finally { setLoading(false); }
  };
  const contacts = [
    { icon: Phone, key: 'phone' },
    { icon: Mail, key: 'email' },
    { icon: MapPin, key: 'address' },
    { icon: Clock, key: 'hours' },
  ];
  return (
    <div className="bg-[var(--bg)] py-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-14">
          <span className="text-sm font-semibold text-brand-500 uppercase tracking-wider" style={{ fontFamily:'Syne,sans-serif' }}>
            {t('contact.header.badge')}
          </span>
          <h1 className="text-4xl font-bold text-[var(--text)] mt-2 mb-4" style={{ fontFamily:'Syne,sans-serif' }}>
            {t('contact.header.title')}
          </h1>
          <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
            {t('contact.header.description')}
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-10">
          {/* Contact form */}
          <div className="card p-7">
            {sent ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text)] mb-2" style={{ fontFamily:'Syne,sans-serif' }}>
                  {t('contact.form.successTitle')}
                </h3>
                <p className="text-[var(--text-secondary)] text-sm">
                  {t('contact.form.successMessage')}
                </p>
                <button 
                  onClick={() => setSent(false)} 
                  className="mt-4 text-sm text-brand-500 hover:text-brand-600 font-medium"
                >
                  {t('contact.form.sendAnother')}
                </button>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-[var(--text)] mb-5" style={{ fontFamily:'Syne,sans-serif' }}>
                  {t('contact.form.title')}
                </h2>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label={t('contact.form.fullNameLabel')} 
                      placeholder={t('contact.form.fullNamePlaceholder')} 
                      error={errors.name?.message && t('contact.form.nameRequired')}
                      {...register('name', { required: true })} 
                    />
                    <Input 
                      label={t('contact.form.emailLabel')} 
                      type="email" 
                      placeholder={t('contact.form.emailPlaceholder')} 
                      error={errors.email?.message && (
                        errors.email.type === 'required' 
                          ? t('contact.form.emailRequired') 
                          : t('contact.form.emailInvalid')
                      )}
                      {...register('email', { 
                        required: true, 
                        pattern: { value: /^\S+@\S+$/i, message: 'invalid' } 
                      })} 
                    />
                  </div>
                  <Input 
                    label={t('contact.form.phoneLabel')} 
                    placeholder={t('contact.form.phonePlaceholder')}
                    {...register('phone')} 
                  />
                  <Input 
                    label={t('contact.form.subjectLabel')} 
                    placeholder={t('contact.form.subjectPlaceholder')} 
                    error={errors.subject?.message && t('contact.form.subjectRequired')}
                    {...register('subject', { required: true })} 
                  />
                  <Textarea 
                    label={t('contact.form.messageLabel')} 
                    placeholder={t('contact.form.messagePlaceholder')} 
                    rows={5} 
                    error={errors.message?.message && (
                      errors.message.type === 'required' 
                        ? t('contact.form.messageRequired') 
                        : t('contact.form.messageTooShort')
                    )}
                    {...register('message', { 
                      required: true, 
                      minLength: { value: 20, message: 'too short' } 
                    })} 
                  />
                  <Button type="submit" size="lg" loading={loading} className="w-full">
                    {t('contact.form.submitButton')}
                  </Button>
                </form>
              </>
            )}
          </div>
          {/* Contact info */}
          <div className="space-y-5">
            <div className="card p-6">
              <h2 className="text-xl font-bold text-[var(--text)] mb-5" style={{ fontFamily:'Syne,sans-serif' }}>
                {t('contact.info.title')}
              </h2>
              <div className="space-y-4">
                {contacts.map(({ icon: Icon, key }) => (
                  <div key={key} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-500 shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-muted)] uppercase" style={{ fontFamily:'Syne,sans-serif' }}>
                        {t(`contact.info.${key}.label`)}
                      </p>
                      <p className="text-sm font-semibold text-[var(--text)]">
                        {t(`contact.info.${key}.value`)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {t(`contact.info.${key}.sub`)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-6 bg-brand-500 border-brand-500">
              <h3 className="font-bold text-white mb-2" style={{ fontFamily:'Syne,sans-serif' }}>
                {t('contact.cta.title')}
              </h3>
              <p className="text-white/80 text-sm mb-4">
                {t('contact.cta.description')}
              </p>
              <a 
                href="/register" 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-brand-600 text-sm font-bold hover:bg-brand-50 transition-colors" 
                style={{ fontFamily:'Syne,sans-serif' }}
              >
                {t('contact.cta.button')} →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}