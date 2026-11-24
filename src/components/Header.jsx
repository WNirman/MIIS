import React, { useState, useEffect } from 'react';
import { Menu, X, Map, User, ShieldCheck, LogOut, Globe, PlusCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';

/**
 * Original MIIS Sri Lanka Maritime Crest Emblem (NOT copied from any external site):
 * Minimalist Sri Lanka island silhouette centered inside a refined compass ring
 * with a clean Indian Ocean current arc beneath.
 */
function MiisSriLankaCrest() {
  return (
    <svg viewBox="0 0 40 40" className="w-8 h-8 sm:w-9 sm:h-9 shrink-0 transition-transform duration-500 group-hover:scale-105" fill="none" aria-hidden="true">
      <circle cx="20" cy="20" r="17.5" stroke="#FFFFFF" strokeWidth="1.1" strokeOpacity="0.35" />
      <path d="M20 2V5M20 35V38M2 20H5M35 20H38" stroke="#F5A623" strokeWidth="1.4" strokeLinecap="round" />
      <path
        d="M20.2 9.5 C22.5 13.2, 24.8 17.5, 24.5 22.8 C24.2 26.8, 22.1 29.8, 19.6 30.2 C17.1 29.9, 15.6 26.6, 15.8 22.2 C16.0 17.6, 18.2 13.0, 20.2 9.5 Z"
        fill="url(#miisCrestGrad)"
        stroke="#FFFFFF"
        strokeOpacity="0.85"
        strokeWidth="0.9"
      />
      <path d="M11.5 28.8 C15.2 32.2, 24.8 32.2, 28.5 28.8" stroke="#F5A623" strokeWidth="1.25" strokeLinecap="round" />
      <defs>
        <linearGradient id="miisCrestGrad" x1="16" y1="10" x2="24" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2DD4BF" stopOpacity="0.92" />
          <stop offset="1" stopColor="#0E7490" stopOpacity="0.72" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default function Header({
  activeTab,
  setActiveTab,
  onOpenAuth,
  onNavigateSection,
}) {
  const { language, setLanguage, t } = useLanguage();
  const { isAuthenticated, isValidator, user, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled((window.scrollY || 0) > 16);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const jumpToSection = (sectionId) => {
    setDrawerOpen(false);
    if (onNavigateSection) {
      onNavigateSection(sectionId);
    } else {
      setActiveTab('home');
      setTimeout(() => {
        document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
      }, 60);
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 border-b ${
        scrolled
          ? 'bg-[#021520]/96 backdrop-blur-xl border-white/10 shadow-[0_8px_28px_-12px_rgba(0,0,0,0.65)]'
          : 'bg-[#021520] border-white/10'
      }`}
    >
      <div className="max-w-[1440px] mx-auto flex items-stretch justify-between h-16 sm:h-[74px]">
        {/* Left: Clean Drawer Trigger + Original MIIS Sri Lanka Brand */}
        <div className="flex items-center min-w-0">
          <button
            type="button"
            onClick={() => setDrawerOpen(!drawerOpen)}
            aria-label="Toggle menu"
            className="h-full px-4 sm:px-6 flex items-center justify-center border-r border-white/10 text-white/90 hover:bg-white/[0.04] transition-colors shrink-0"
          >
            {drawerOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setDrawerOpen(false);
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-3 px-4 sm:px-6 text-left group min-w-0"
          >
            <MiisSriLankaCrest />
            <div className="leading-[1.15] min-w-0">
              <div className="font-brand text-[15px] sm:text-[17px] font-semibold text-white tracking-tight truncate">
                {t('appName')} {t('countryTag')}
              </div>
              <div className="text-[11px] text-white/60 font-normal hidden sm:block truncate max-w-[220px] xl:max-w-none">
                {t('appSub')}
              </div>
            </div>
          </button>
        </div>

        {/* Center: Spacious, Minimalist Editorial Navigation */}
        <nav className="hidden lg:flex items-center gap-7 xl:gap-9 text-[13.5px] font-normal text-white/85">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`miis-nav-link flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeTab === 'map' ? 'miis-nav-link-active text-white' : 'hover:text-white'
            }`}
          >
            <span>{t('navMap')}</span>
            <Map className="w-4 h-4 text-white/75" />
          </button>
          <button
            type="button"
            onClick={() => jumpToSection('resources')}
            className="miis-nav-link hover:text-white transition-colors whitespace-nowrap"
          >
            {t('navResources')}
          </button>
          <button
            type="button"
            onClick={() => jumpToSection('methodology')}
            className="miis-nav-link hover:text-white transition-colors whitespace-nowrap"
          >
            {t('navMethod')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`miis-nav-link transition-colors whitespace-nowrap ${
              activeTab === 'report' ? 'miis-nav-link-active text-[#F5A623]' : 'text-white hover:text-[#F5A623]'
            }`}
          >
            {t('navReport')}
          </button>
        </nav>

        {/* Right: Clean Language Selector + Crisp Auth Pills */}
        <div className="flex items-center gap-2.5 sm:gap-3 pr-3.5 sm:pr-6 shrink-0">
          {/* Minimal 3-Language Switcher */}
          <div
            role="group"
            aria-label={t('languageLabel')}
            className="hidden md:flex items-center gap-1 text-[11.5px] text-white/60 border border-white/15 rounded-full px-1 py-0.5"
          >
            {[
              { code: 'en', label: 'EN' },
              { code: 'si', label: 'සිං' },
              { code: 'ta', label: 'தமி' },
            ].map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => setLanguage(l.code)}
                className={`px-2 py-0.5 rounded-full transition-colors ${
                  language === l.code
                    ? 'bg-white/15 text-white font-medium'
                    : 'hover:text-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Quick Mobile Report Button */}
          <button
            type="button"
            onClick={() => { setDrawerOpen(false); setActiveTab('report'); }}
            className="lg:hidden px-3.5 py-1.5 rounded-full bg-[#F5A623] text-[#021520] text-xs font-semibold"
          >
            {t('reportBtn')}
          </button>

          {isAuthenticated ? (
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('portal')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  activeTab === 'portal'
                    ? 'bg-[#F5A623] text-[#021520] border-[#F5A623] font-semibold'
                    : 'border-white/35 text-white hover:border-white'
                }`}
              >
                {isValidator ? <ShieldCheck className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                <span>{isValidator ? t('portalValidator') : t('portalReporter')}</span>
              </button>
              <button
                type="button"
                onClick={() => { logout(); setActiveTab('home'); }}
                title={`${t('btnSignout')} (${user?.email})`}
                className="p-2 rounded-full border border-white/20 text-white/75 hover:text-white hover:border-white/50 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onOpenAuth('login')}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium text-white border border-white/35 hover:border-white transition-colors whitespace-nowrap"
              >
                <User className="w-3.5 h-3.5 text-white/80" />
                <span>{t('btnLogin')}</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#F5A623] hover:bg-[#fbba45] text-[#021520] transition-colors whitespace-nowrap"
              >
                {t('btnSignup')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Smooth Slide-Down Navigation & Language Drawer (Desktop & Mobile) */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          drawerOpen ? 'max-h-[480px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="bg-[#031A27] border-t border-white/10 px-5 sm:px-8 py-5 space-y-3 text-sm">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => { setDrawerOpen(false); setActiveTab('report'); }}
                className="w-full py-2.5 px-4 rounded-full bg-[#F5A623] text-[#021520] font-semibold text-xs flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{t('navReportNoLogin')}</span>
              </button>
              <button
                type="button"
                onClick={() => { setDrawerOpen(false); setActiveTab('map'); }}
                className="w-full py-2 px-3 rounded-lg text-left text-white/85 hover:bg-white/5 flex items-center gap-2 text-sm"
              >
                <Map className="w-4 h-4 text-[#F5A623]" />
                <span>{t('navMap')}</span>
              </button>
            </div>

            <div className="space-y-1">
              <button
                type="button"
                onClick={() => jumpToSection('resources')}
                className="w-full py-2 px-3 rounded-lg text-left text-white/85 hover:bg-white/5 block"
              >
                {t('navResources')}
              </button>
              <button
                type="button"
                onClick={() => jumpToSection('methodology')}
                className="w-full py-2 px-3 rounded-lg text-left text-white/85 hover:bg-white/5 block"
              >
                {t('navMethod')}
              </button>
            </div>

            <div className="space-y-3">
              {/* Clear 3-Language Switcher */}
              <div className="flex items-center justify-between border border-white/10 bg-[#021520] rounded-xl px-3.5 py-2 text-xs">
                <span className="flex items-center gap-1.5 text-white/70">
                  <Globe className="w-3.5 h-3.5 text-[#F5A623]" />
                  <span>{t('languageLabel')}</span>
                </span>
                <div className="flex gap-1.5">
                  {[
                    { c: 'en', l: 'English' },
                    { c: 'si', l: 'සිංහල' },
                    { c: 'ta', l: 'தமிழ்' },
                  ].map((x) => (
                    <button
                      key={x.c}
                      type="button"
                      onClick={() => setLanguage(x.c)}
                      className={`py-1 px-2.5 rounded-full transition-colors ${
                        language === x.c
                          ? 'bg-[#F5A623] text-[#021520] font-semibold'
                          : 'text-white/75 hover:text-white'
                      }`}
                    >
                      {x.l}
                    </button>
                  ))}
                </div>
              </div>

              {isAuthenticated ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setDrawerOpen(false); setActiveTab('portal'); }}
                    className="flex-1 py-2 px-3 rounded-full border border-white/30 text-xs font-medium text-white flex items-center justify-center gap-1.5"
                  >
                    {isValidator ? <ShieldCheck className="w-3.5 h-3.5 text-[#F5A623]" /> : <User className="w-3.5 h-3.5" />}
                    <span>{isValidator ? t('portalValidator') : t('portalReporter')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDrawerOpen(false); logout(); setActiveTab('home'); }}
                    className="px-4 py-2 rounded-full border border-white/20 text-xs text-white/75"
                  >
                    {t('btnSignout')}
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setDrawerOpen(false); onOpenAuth('login'); }}
                    className="flex-1 py-2 rounded-full border border-white/35 text-xs font-medium text-white"
                  >
                    {t('btnLogin')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDrawerOpen(false); onOpenAuth('register'); }}
                    className="flex-1 py-2 rounded-full bg-[#F5A623] text-[#021520] text-xs font-semibold"
                  >
                    {t('btnSignup')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
