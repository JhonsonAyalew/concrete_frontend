import { useTranslation } from 'react-i18next';
import { Shield, Users, Zap, Award, MapPin, TrendingUp } from 'lucide-react';
export default function AboutPage() {
  const { t } = useTranslation();
  const values = [
    { icon: Shield, key: 'trustAndSafety' },
    { icon: Users, key: 'communityFirst' },
    { icon: Zap, key: 'fastAndReliable' },
    { icon: Award, key: 'qualityAssurance' },
  ];
  const stats = [
    { icon: MapPin, key: 'citiesCovered' },
    { icon: Users, key: 'verifiedOwners' },
    { icon: TrendingUp, key: 'jobsCompleted' },
    { icon: Award, key: 'averageRating' },
  ];
  return (
    <div className="bg-[var(--bg)]">
      {/* Hero */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <span className="text-sm font-semibold text-brand-500 uppercase tracking-wider" style={{ fontFamily:'Syne,sans-serif' }}>
            {t('about.hero.badge')}
          </span>
          <h1 className="text-5xl font-bold text-[var(--text)] mt-3 mb-6" style={{ fontFamily:'Syne,sans-serif' }}>
            {t('about.hero.titleLine1')}<br />
            <span className="text-gradient">{t('about.hero.titleLine2')}</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
            {t('about.hero.description')}
          </p>
        </div>
      </section>
      {/* Stats */}
      <section className="py-16 bg-[var(--bg-secondary)]">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map(({ icon: Icon, key }) => (
            <div key={key} className="card p-6 text-center">
              <Icon className="w-6 h-6 text-brand-500 mx-auto mb-3" />
              <p className="text-3xl font-bold text-[var(--text)]" style={{ fontFamily:'Syne,sans-serif' }}>
                {t(`about.stats.${key}.value`)}
              </p>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {t(`about.stats.${key}.label`)}
              </p>
            </div>
          ))}
        </div>
      </section>
      {/* Mission */}
      <section className="py-20 max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-14 items-center">
          <div>
            <span className="text-sm font-semibold text-brand-500 uppercase tracking-wider" style={{ fontFamily:'Syne,sans-serif' }}>
              {t('about.mission.badge')}
            </span>
            <h2 className="text-3xl font-bold text-[var(--text)] mt-2 mb-5" style={{ fontFamily:'Syne,sans-serif' }}>
              {t('about.mission.title')}
            </h2>
            <div className="space-y-4 text-[var(--text-secondary)] leading-relaxed text-sm">
              <p>{t('about.mission.paragraph1')}</p>
              <p>{t('about.mission.paragraph2')}</p>
              <p>{t('about.mission.paragraph3')}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {values.map(({ icon: Icon, key }) => (
              <div key={key} className="card p-5 hover:border-brand-500 transition-all duration-300 hover:-translate-y-1">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center text-brand-500 mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-[var(--text)] text-sm mb-1" style={{ fontFamily:'Syne,sans-serif' }}>
                  {t(`about.values.${key}.title`)}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {t(`about.values.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
      {/* Team note */}
      <section className="py-16 bg-[var(--bg-secondary)]">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-[var(--text)] mb-4" style={{ fontFamily:'Syne,sans-serif' }}>
            {t('about.team.title')}
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            {t('about.team.description')}
          </p>
        </div>
      </section>
    </div>
  );
}