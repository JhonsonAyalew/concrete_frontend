import { Outlet } from 'react-router-dom';
import PublicNavbar from '../components/common/PublicNavbar';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
export default function PublicLayout() {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const cities = [
    'addisAbaba', 'direDawa', 'hawassa', 'bahirDar', 'mekelle', 'otherCities'
  ];
  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)]">
      <PublicNavbar />
      <main className="flex-1 pt-16">
        <Outlet />
      </main>
      {/* Professional Footer */}
      <footer className="border-t border-[var(--border)] bg-[var(--bg-secondary)] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
          {/* Main footer grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Column */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
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
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {t('footer.description')}
              </p>
            </div>
            {/* Platform Links */}
            <div>
              <h4 className="font-semibold text-[var(--text)] mb-4 text-sm uppercase tracking-wider" style={{ fontFamily: 'Syne, sans-serif' }}>
                {t('footer.platform')}
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/equipment" className="text-sm text-[var(--text-secondary)] hover:text-brand-500 transition-colors duration-200">
                    {t('footer.browseEquipment')}
                  </Link>
                </li>
                <li>
                  <Link to="/register?role=owner" className="text-sm text-[var(--text-secondary)] hover:text-brand-500 transition-colors duration-200">
                    {t('footer.listEquipment')}
                  </Link>
                </li>
                <li>
                  <Link to="/about" className="text-sm text-[var(--text-secondary)] hover:text-brand-500 transition-colors duration-200">
                    {t('footer.aboutUs')}
                  </Link>
                </li>
              </ul>
            </div>
            {/* Support Links */}
            <div>
              <h4 className="font-semibold text-[var(--text)] mb-4 text-sm uppercase tracking-wider" style={{ fontFamily: 'Syne, sans-serif' }}>
                {t('footer.support')}
              </h4>
              <ul className="space-y-2.5">
                <li>
                  <Link to="/contact" className="text-sm text-[var(--text-secondary)] hover:text-brand-500 transition-colors duration-200">
                    {t('footer.contactUs')}
                  </Link>
                </li>
                <li>
                  <a href="tel:+251911000000" className="text-sm text-[var(--text-secondary)] hover:text-brand-500 transition-colors duration-200">
                    {t('footer.phone')}
                  </a>
                </li>
                <li>
                  <a href="mailto:info@equiprent.et" className="text-sm text-[var(--text-secondary)] hover:text-brand-500 transition-colors duration-200">
                    {t('footer.email')}
                  </a>
                </li>
              </ul>
            </div>
            {/* Cities Column */}
            <div>
              <h4 className="font-semibold text-[var(--text)] mb-4 text-sm uppercase tracking-wider" style={{ fontFamily: 'Syne, sans-serif' }}>
                {t('footer.cities')}
              </h4>
              <ul className="space-y-2">
                {cities.map((cityKey) => (
                  <li key={cityKey}>
                    <Link 
                      to={`/equipment?city=${t(`cities.${cityKey}`)}`}
                      className="text-sm text-[var(--text-secondary)] hover:text-brand-500 transition-colors duration-200"
                    >
                      {t(`cities.${cityKey}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* Bottom Bar */}
<div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-col items-center justify-center gap-3">
  <p className="text-xs text-[var(--text-muted)] text-center">
    © {currentYear} Concrete Ethiopia. {t('footer.allRightsReserved')}
  </p>
  <p className="text-xs text-[var(--text-muted)] text-center">
    Developed by{' '}
    <a 
      href="https://hurunguu.com" 
      target="_blank" 
      rel="noopener noreferrer"
      className="text-brand-500 font-medium hover:text-brand-600 hover:underline transition-all duration-200"
    >
      Hurunguu
    </a>
  </p>
  <div className="flex items-center gap-2">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
    </span>
    <span className="text-xs text-[var(--text-muted)]">{t('footer.operational')}</span>
  </div>
</div>
        </div>
      </footer>
    </div>
  );
}
