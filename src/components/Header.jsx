import React from 'react';
import { Anchor, ShieldAlert, Map, Radio, Award, BarChart3, PlusCircle, Home, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Header({ activeTab, setActiveTab, stats }) {
  const { language, setLanguage, t } = useLanguage();

  const tabs = [
    { id: 'home', label: t('navHome'), icon: Home },
    { id: 'report', label: t('navReport'), icon: PlusCircle, highlight: true },
    { id: 'map', label: t('navMap'), icon: Map },
    { id: 'harvester', label: t('navHarvester'), icon: Radio },
    { id: 'validation', label: t('navValidation'), icon: ShieldAlert, badge: stats?.criticalUrgent },
    { id: 'analytics', label: t('navAnalytics'), icon: BarChart3 },
    { id: 'rewards', label: t('navRewards'), icon: Award }
  ];

  const languages = [
    { code: 'en', label: 'English', short: 'EN', flag: '🇬🇧' },
    { code: 'si', label: 'සිංහල', short: 'සිං', flag: '🇱🇰' },
    { code: 'ta', label: 'தமிழ்', short: 'தமி', flag: '🇱🇰' }
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-cyan-500/20 shadow-lg">
      {/* Urgent Emergency Alert Ticker */}
      <div className="bg-red-950/80 border-b border-red-500/30 text-red-200 text-xs px-4 py-1.5 flex items-center justify-between gap-4 overflow-hidden">
        <div className="flex items-center space-x-2 animate-pulse min-w-0 truncate">
          <span className="h-2 w-2 rounded-full bg-red-500 shrink-0"></span>
          <span className="font-semibold uppercase tracking-wider shrink-0">{t('alertTitle')}</span>
          <span className="truncate">{t('alertMessage')}</span>
        </div>
        <div className="hidden md:block text-slate-400 shrink-0 whitespace-nowrap text-[11px]">
          {t('emergencyContact')} <span className="text-red-400 font-mono font-bold">+94 11 2888555</span>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center space-x-3 cursor-pointer group shrink-0 min-w-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform shrink-0">
            <Anchor className="w-6 h-6 text-slate-950" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              {t('appName')} <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30 font-medium">{t('countryTag')}</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium truncate max-w-[180px] sm:max-w-xs">{t('appSub')}</p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800 shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : tab.highlight
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge > 0 && (
                  <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Language Switcher & Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Tri-Language Toggle */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-cyan-500/30 shadow-inner">
            <Globe className="w-3.5 h-3.5 text-cyan-400 ml-1.5 mr-1 hidden sm:inline" />
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                title={lang.label}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  language === lang.code
                    ? 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.short}</span>
              </button>
            ))}
          </div>

          {/* Mobile Quick Action button */}
          <div className="flex lg:hidden items-center space-x-2">
            <button
              onClick={() => setActiveTab('report')}
              className="flex items-center space-x-1 bg-cyan-500 text-slate-950 text-xs px-3 py-2 rounded-lg font-bold shadow-md shadow-cyan-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t('reportBtn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="flex lg:hidden overflow-x-auto no-scrollbar border-t border-slate-800 px-2 py-1.5 space-x-1.5 bg-slate-950/95 backdrop-blur-md">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                isActive ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}

