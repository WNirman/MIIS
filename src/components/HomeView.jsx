import React, { useState, useEffect } from 'react';
import {
  Map,
  ArrowDown,
  Shield,
  Smartphone,
  CheckCircle2,
  Waves,
  MapPin,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { Reveal, AnimatedCounter } from './MotionPrimitives';

const SRI_LANKA_HERO_SCENES = [
  { id: 'mirissa', locationKey: 'sceneMirissa', image: '/hero/sl_mirissa_bluewhale.jpg' },
  { id: 'rekawa', locationKey: 'sceneRekawa', image: '/hero/sl_rekawa_turtle.jpg' },
  { id: 'pigeon', locationKey: 'scenePigeon', image: '/hero/sl_pigeon_island_reef.jpg' },
  { id: 'negombo', locationKey: 'sceneNegombo', image: '/hero/sl_negombo_fishers.jpg' },
  { id: 'mannar', locationKey: 'sceneMannar', image: '/hero/sl_mannar_dugong_coast.jpg' },
];

export default function HomeView({ setActiveTab, onSearchMap }) {
  const { t } = useLanguage();
  const [sceneIdx, setSceneIdx] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [parallaxY, setParallaxY] = useState(0);

  // Purely automatic seamless background slideshow — zero manual prev/next controls
  useEffect(() => {
    const id = setInterval(() => {
      setSceneIdx((prev) => (prev + 1) % SRI_LANKA_HERO_SCENES.length);
    }, 6500);
    return () => clearInterval(id);
  }, []);

  // Gentle 60fps hero parallax
  useEffect(() => {
    if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }
    let rafId = null;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY || 0, 650);
        setParallaxY(y * 0.18);
        rafId = null;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  const marineResources = [
    {
      region: t('res1Region'),
      metric: t('res1Metric'),
      title: t('res1Title'),
      desc: t('res1Desc'),
      image: '/hero/sl_mirissa_bluewhale.jpg',
    },
    {
      region: t('res2Region'),
      metric: t('res2Metric'),
      title: t('res2Title'),
      desc: t('res2Desc'),
      image: '/hero/sl_rekawa_turtle.jpg',
    },
    {
      region: t('res3Region'),
      metric: t('res3Metric'),
      title: t('res3Title'),
      desc: t('res3Desc'),
      image: '/hero/sl_pigeon_island_reef.jpg',
    },
    {
      region: t('res4Region'),
      metric: t('res4Metric'),
      title: t('res4Title'),
      desc: t('res4Desc'),
      image: '/hero/sl_mannar_dugong_coast.jpg',
    },
    {
      region: t('res5Region'),
      metric: t('res5Metric'),
      title: t('res5Title'),
      desc: t('res5Desc'),
      image: '/hero/sl_negombo_fishers.jpg',
    },
  ];

  const monitoredThreats = [
    t('threatItem1'),
    t('threatItem2'),
    t('threatItem3'),
    t('threatItem4'),
    t('threatItem5'),
    t('threatItem6'),
    t('threatItem7'),
    t('threatItem8'),
  ];

  const fivePhases = [
    { num: '01', title: t('phase1Title'), desc: t('phase1Desc') },
    { num: '02', title: t('phase2Title'), desc: t('phase2Desc') },
    { num: '03', title: t('phase3Title'), desc: t('phase3Desc') },
    { num: '04', title: t('phase4Title'), desc: t('phase4Desc') },
    { num: '05', title: t('phase5Title'), desc: t('phase5Desc') },
  ];

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearchMap) onSearchMap(searchText.trim());
    else setActiveTab('map');
  };

  return (
    <div className="bg-[#021520] text-white overflow-x-hidden">
      {/* =====================================================================
          CLEAN, UNCLUTTERED HERO WITH FLOATING SEARCH & AUTOMATIC OCEAN SCENES
         ===================================================================== */}
      <section className="relative pt-4 sm:pt-6 pb-8 sm:pb-10 px-0 sm:px-6 lg:px-10 max-w-[1440px] mx-auto">
        {/* Centered Clean Pill Search Bar */}
        <div className="relative z-30 max-w-xl mx-auto px-4 sm:px-0 -mb-7">
          <form
            onSubmit={handleSearch}
            className="flex items-center bg-[#021520] border border-white/30 focus-within:border-[#F5A623] rounded-full shadow-2xl overflow-hidden transition-colors"
          >
            <div className="flex-1 min-w-0 px-5 py-2.5 sm:py-3">
              <label htmlFor="miis-hero-search" className="block text-[12px] font-semibold text-white leading-tight">
                {t('homeSearchHeading')}
              </label>
              <input
                id="miis-hero-search"
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder={t('homeSearchPlaceholder')}
                className="w-full bg-transparent text-xs text-white/75 placeholder-white/45 focus:outline-none mt-0.5"
              />
            </div>
            <button
              type="button"
              onClick={() => document.getElementById('resources')?.scrollIntoView({ behavior: 'smooth' })}
              aria-label={t('navResources')}
              className="px-3.5 sm:px-4 h-12 border-l border-white/15 text-white/75 hover:text-white transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
            <button
              type="submit"
              aria-label={t('navMap')}
              className="px-4 sm:px-5 h-12 border-l border-white/15 text-white/85 hover:text-[#F5A623] transition-colors"
            >
              <Map className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Framed Automatic Sri Lanka Marine Photography Canvas */}
        <div className="relative min-h-[72svh] sm:min-h-[540px] lg:min-h-[590px] sm:rounded-2xl overflow-hidden flex flex-col justify-center bg-[#031A27]">
          <div
            aria-hidden="true"
            className="absolute inset-0 will-change-transform"
            style={{ transform: `translate3d(0, ${parallaxY}px, 0)` }}
          >
            {SRI_LANKA_HERO_SCENES.map((scene, idx) => {
              const isActive = idx === sceneIdx;
              return (
                <div
                  key={scene.id}
                  className={`absolute inset-0 bg-cover bg-center transition-opacity duration-[1800ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isActive ? 'opacity-100 miis-hero-active' : 'opacity-0 pointer-events-none'
                  }`}
                  style={{
                    backgroundImage: `url('${scene.image}')`,
                  }}
                />
              );
            })}
          </div>

          {/* Calm Dark Ocean Gradient Wash */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#021520]/92 via-[#021520]/68 to-[#021520]/25" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#021520]/85 via-transparent to-[#021520]/45" />

          {/* Clean, Airy Left-Aligned Hero Typography */}
          <div className="relative z-20 max-w-6xl w-full mx-auto px-6 sm:px-12 lg:px-16 pt-16 pb-14">
            <div className="max-w-xl space-y-6">
              <h1 className="miis-enter miis-delay-1 text-3xl sm:text-5xl lg:text-[52px] font-normal text-white leading-[1.16] tracking-[-0.015em]">
                {t('homeHeroTitle')}
              </h1>

              <p className="miis-enter miis-delay-2 text-sm sm:text-base font-normal text-white/80 leading-relaxed max-w-lg">
                {t('homeHeroDescPrefix') ? `${t('homeHeroDescPrefix')} ` : ''}
                {t('homeHeroDescStrong')} {t('homeHeroDescRest')}
              </p>

              <div className="miis-enter miis-delay-3 flex flex-col sm:flex-row sm:items-center gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('report')}
                  className="w-full sm:w-auto justify-center bg-[#F5A623] hover:bg-[#fbba45] text-[#021520] font-semibold text-sm px-7 py-3 rounded-full transition-all duration-300 hover:-translate-y-0.5 flex items-center gap-2"
                >
                  <span>{t('homeCtaReport')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('map')}
                  className="w-full sm:w-auto justify-center text-white/85 hover:text-white text-sm font-normal px-4 py-2.5 flex items-center gap-1.5 transition-colors"
                >
                  <span>{t('homeCtaMap')}</span>
                  <ArrowRight className="w-4 h-4 text-[#F5A623]" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Clean Bottom Scroll Cue */}
        <div className="flex justify-center pt-6 sm:pt-7">
          <button
            type="button"
            onClick={() => document.getElementById('resources')?.scrollIntoView({ behavior: 'smooth' })}
            className="group inline-flex items-center gap-3 text-xs sm:text-sm text-white/75 hover:text-white transition-colors"
          >
            <span>{t('homeScrollExplore')}</span>
            <span className="w-9 h-9 rounded-full bg-[#F5A623] text-[#021520] flex items-center justify-center transition-transform duration-300 group-hover:translate-y-0.5">
              <ArrowDown className="w-4 h-4" />
            </span>
          </button>
        </div>
      </section>

      {/* =====================================================================
          SECTION 1: WHO WE ARE & SRI LANKA'S MARINE RESOURCES
         ===================================================================== */}
      <section id="resources" className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-24 border-t border-white/10 space-y-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <Reveal variant="left" className="lg:col-span-5 space-y-3">
            <div className="text-xs uppercase tracking-[0.14em] text-[#F5A623] font-medium">
              {t('whoEyebrow')}
            </div>
            <h2 className="text-2xl sm:text-4xl font-normal text-white leading-tight">
              {t('whoTitle')}
            </h2>
          </Reveal>
          <Reveal variant="right" delay={100} className="lg:col-span-7 space-y-4 text-sm sm:text-[15.5px] font-normal text-white/75 leading-relaxed">
            <p>
              {t('whoPara1Part1')}{' '}
              <span className="text-white font-medium">{t('whoPara1Strong1')}</span>{' '}
              {t('whoPara1Part2')}{' '}
              <span className="text-white font-medium">{t('whoPara1Strong2')}</span>{' '}
              {t('whoPara1Part3')}
            </p>
            <p>
              {t('whoPara2Part1') ? `${t('whoPara2Part1')} ` : ''}
              <span className="text-white font-medium">{t('whoPara2Strong1')}</span>{' '}
              {t('whoPara2Part2')}
            </p>
          </Reveal>
        </div>

        {/* Clean 4 Minimalist Ocean Indicators */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-y border-white/10 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
          {[
            { end: 1787, suffix: t('metricCoastSuffix'), label: t('metricCoastLabel'), sub: t('metricCoastSub') },
            { end: 517000, suffix: t('metricEezSuffix'), label: t('metricEezLabel'), sub: t('metricEezSub') },
            { end: 5, suffix: t('metricTurtleSuffix'), label: t('metricTurtleLabel'), sub: t('metricTurtleSub') },
            { end: 14, suffix: t('metricDistrictSuffix'), label: t('metricDistrictLabel'), sub: t('metricDistrictSub') },
          ].map((item, idx) => (
            <Reveal key={item.label} variant="up" delay={idx * 80} className="py-6 px-4 sm:px-6 space-y-1">
              <div className="text-2xl sm:text-3xl font-light text-white">
                <AnimatedCounter end={item.end} suffix={item.suffix} />
              </div>
              <div className="text-xs sm:text-sm font-medium text-white/90">{item.label}</div>
              <div className="text-xs text-white/50">{item.sub}</div>
            </Reveal>
          ))}
        </div>

        {/* Clean 5-Photo Sri Lanka Marine Resources Showcase */}
        <div className="space-y-7">
          <Reveal variant="up" className="max-w-2xl space-y-1.5">
            <h3 className="text-2xl sm:text-3xl font-normal text-white">{t('ecosystemsTitle')}</h3>
            <p className="text-sm text-white/65">{t('ecosystemsSub')}</p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            {marineResources.map((res, idx) => (
              <Reveal
                key={idx}
                as="article"
                variant="up"
                delay={(idx % 3) * 90}
                className={`group bg-[#041E2D] border border-white/10 hover:border-white/25 rounded-xl overflow-hidden flex flex-col transition-all duration-500 hover:-translate-y-1 ${
                  idx < 2 ? 'md:col-span-3' : 'md:col-span-2'
                }`}
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-[#021520]">
                  <img
                    src={res.image}
                    alt={res.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-105"
                  />
                </div>
                <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="text-[11px] text-[#F5A623] font-medium flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{res.region}</span>
                    </div>
                    <h4 className="text-lg font-medium text-white leading-snug">{res.title}</h4>
                    <p className="text-xs sm:text-[13.5px] text-white/70 leading-relaxed">
                      {res.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        {/* Clean Monitored Coastal Events Strip */}
        <Reveal variant="up" className="bg-[#041E2D] border border-white/10 rounded-xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-white">{t('threatsTitle')}</h3>
            <button
              type="button"
              onClick={() => setActiveTab('report')}
              className="text-xs text-[#F5A623] hover:underline flex items-center gap-1.5 font-medium self-start sm:self-auto"
            >
              <span>{t('threatsCta')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs sm:text-[13px] text-white/80">
            {monitoredThreats.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2.5 py-1.5">
                <Waves className="w-4 h-4 text-[#F5A623] shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* =====================================================================
          SECTION 2: FIVE-PHASE CITIZEN-SCIENCE METHODOLOGY
         ===================================================================== */}
      <section id="methodology" className="bg-[#031B29] border-t border-white/10 py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 space-y-12">
          <Reveal variant="up" className="max-w-2xl space-y-3">
            <div className="text-xs uppercase tracking-[0.14em] text-[#F5A623] font-medium">
              {t('methodEyebrow')}
            </div>
            <h2 className="text-2xl sm:text-4xl font-normal text-white">{t('methodTitle')}</h2>
            <p className="text-sm text-white/70 leading-relaxed">{t('methodSub')}</p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {fivePhases.map((ph, idx) => (
              <Reveal
                key={ph.num}
                variant="up"
                delay={idx * 80}
                className="bg-[#021520] border border-white/10 rounded-xl p-5 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2.5">
                  <div className="text-xs font-medium text-[#F5A623]">
                    {t('phaseLabel')} {ph.num}
                  </div>
                  <h3 className="text-base font-medium text-white leading-snug">{ph.title}</h3>
                  <p className="text-xs text-white/70 leading-relaxed">{ph.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          SECTION 3: FISHER MOBILE APP & VALIDATOR-ONLY DATA CONFIDENTIALITY
         ===================================================================== */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-16 sm:py-24 border-t border-white/10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Reveal variant="left" className="bg-[#041E2D] border border-white/10 rounded-xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-[#F5A623] shrink-0" />
              <h3 className="text-lg font-medium text-white">{t('flutterTitle')}</h3>
            </div>
            <p className="text-sm text-white/75 leading-relaxed">{t('flutterDesc')}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-white/80 pt-1">
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#F5A623] shrink-0" /> {t('flutterFeat1')}</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#F5A623] shrink-0" /> {t('flutterFeat2')}</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#F5A623] shrink-0" /> {t('flutterFeat3')}</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-[#F5A623] shrink-0" /> {t('flutterFeat4')}</div>
            </div>
          </Reveal>

          <Reveal variant="right" delay={100} className="bg-[#041E2D] border border-white/10 rounded-xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#F5A623] shrink-0" />
              <h3 className="text-lg font-medium text-white">{t('protectTitle')}</h3>
            </div>
            <p className="text-sm text-white/75 leading-relaxed">{t('protectDesc')}</p>
            <div className="space-y-2.5 text-xs pt-1">
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 border-b border-white/10 pb-2">
                <span className="text-white font-medium">{t('tierPublicTitle')}</span>
                <span className="text-white/65">{t('tierPublicDesc')}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 border-b border-white/10 pb-2">
                <span className="text-white font-medium">{t('tierReporterTitle')}</span>
                <span className="text-white/65">{t('tierReporterDesc')}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5">
                <span className="text-[#F5A623] font-medium">{t('tierValidatorTitle')}</span>
                <span className="text-white/65">{t('tierValidatorDesc')}</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
