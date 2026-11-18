import React from 'react';
import { PlusCircle, MapPin, Radio, ShieldCheck, Sparkles, AlertTriangle, Cpu, Globe, Award, ArrowRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function HomeView({ setActiveTab, stats }) {
  const { t } = useLanguage();

  const incidentCategories = [
    { name: t('cat1Title'), desc: t('cat1Desc'), icon: '🐋', color: 'from-blue-500/20 to-cyan-500/20 border-cyan-500/30' },
    { name: t('cat2Title'), desc: t('cat2Desc'), icon: '🛢️', color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30' },
    { name: t('cat3Title'), desc: t('cat3Desc'), icon: '🌊', color: 'from-teal-500/20 to-emerald-500/20 border-teal-500/30' },
    { name: t('cat4Title'), desc: t('cat4Desc'), icon: '🐠', color: 'from-coral/20 to-red-500/20 border-coral/30' }
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl ocean-gradient border border-cyan-500/20 p-8 sm:p-12 lg:p-16">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full text-cyan-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('heroBadge')}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-none">
            {t('heroTitle1')} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              {t('heroTitle2')}
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            {t('heroDesc')}
          </p>

          {/* Call-to-action buttons */}
          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={() => setActiveTab('report')}
              className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 px-6 py-3.5 rounded-xl font-extrabold shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              <span>{t('btnReportIncident')}</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className="flex items-center space-x-2 bg-slate-900/80 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 px-6 py-3.5 rounded-xl font-bold transition-all"
            >
              <MapPin className="w-5 h-5" />
              <span>{t('btnViewMap')}</span>
            </button>

            <button
              onClick={() => setActiveTab('harvester')}
              className="flex items-center space-x-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 px-6 py-3.5 rounded-xl font-semibold transition-all"
            >
              <Radio className="w-5 h-5 text-teal-400" />
              <span>{t('btnAiHarvester')}</span>
            </button>
          </div>
        </div>

        {/* Live Indicator Counters Bar */}
        <div className="mt-10 pt-8 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="glass-card p-4 rounded-xl">
            <div className="text-2xl font-black text-cyan-400">{stats?.totalIncidents || 3}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t('statTotalIncidents')}</div>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <div className="text-2xl font-black text-emerald-400">{stats?.verifiedIncidents || 2}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t('statVerified')}</div>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <div className="text-2xl font-black text-amber-400">{stats?.totalSources || 2}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t('statSources')}</div>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <div className="text-2xl font-black text-coral">{stats?.totalPointsAwarded || 25}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">{t('statPoints')}</div>
          </div>
        </div>
      </section>

      {/* Incident Categories Grid */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-extrabold text-white">{t('catTitle')}</h2>
            <p className="text-xs sm:text-sm text-slate-400">{t('catSub')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {incidentCategories.map((cat, idx) => (
            <div key={idx} className={`p-6 rounded-2xl bg-gradient-to-br ${cat.color} border backdrop-blur-md space-y-3`}>
              <div className="text-3xl">{cat.icon}</div>
              <h3 className="text-lg font-bold text-white">{cat.name}</h3>
              <p className="text-xs text-slate-300 leading-relaxed">{cat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* System Architecture Section (Matching Section 3 of PDF) */}
      <section className="glass-panel p-8 rounded-3xl space-y-8 border border-slate-800">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-3xl font-extrabold text-white">{t('archTitle')}</h2>
          <p className="text-sm text-slate-400">{t('archSub')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">1</div>
            <h4 className="text-sm font-bold text-white">{t('archStep1Title')}</h4>
            <p className="text-[11px] text-slate-400">{t('archStep1Desc')}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">2</div>
            <h4 className="text-sm font-bold text-white">{t('archStep2Title')}</h4>
            <p className="text-[11px] text-slate-400">{t('archStep2Desc')}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">3</div>
            <h4 className="text-sm font-bold text-white">{t('archStep3Title')}</h4>
            <p className="text-[11px] text-slate-400">{t('archStep3Desc')}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">4</div>
            <h4 className="text-sm font-bold text-white">{t('archStep4Title')}</h4>
            <p className="text-[11px] text-slate-400">{t('archStep4Desc')}</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">5</div>
            <h4 className="text-sm font-bold text-white">{t('archStep5Title')}</h4>
            <p className="text-[11px] text-slate-400">{t('archStep5Desc')}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
