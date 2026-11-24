import React, { useState, useEffect, Suspense, lazy } from 'react';
import Header from './components/Header';
import HomeView from './components/HomeView';
import ReportForm from './components/ReportForm';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';

const LiveMap = lazy(() => import('./components/LiveMap'));
const PortalView = lazy(() => import('./components/PortalView'));

/**
 * STRICT CONFIDENTIALITY ARCHITECTURE:
 * - Zero confidential mortality datasets or incident records are bundled statically in the public client.
 * - Confidential records (/api/incidents, /api/ministry-dataset, /api/ministry-trends, /api/sources, /api/stats)
 *   are fetched exclusively from the RBAC backend AFTER verified Validator/Admin authentication.
 * - Public citizens can ALWAYS submit observations via ReportForm with zero login (language selector shown first).
 */
function MIISApp() {
  const { authHeaders, token, isValidator } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('home');
  const [reportSessionKey, setReportSessionKey] = useState(0);
  const [portalAuthMode, setPortalAuthMode] = useState('login');
  const [mapSearchQuery, setMapSearchQuery] = useState('');

  // Confidential scientific state — strictly empty unless authenticated as Validator/Admin
  const [incidents, setIncidents] = useState([]);
  const [sources, setSources] = useState([]);
  const [stats, setStats] = useState({ summary: {}, taxonCounts: {}, districtCounts: {} });
  const [ministryDataset, setMinistryDataset] = useState({ records: [] });
  const [ministryTrends, setMinistryTrends] = useState(null);

  const fetchConfidentialValidatorData = async () => {
    if (!token || !isValidator) {
      setIncidents([]);
      setSources([]);
      setStats({ summary: {}, taxonCounts: {}, districtCounts: {} });
      setMinistryDataset({ records: [] });
      setMinistryTrends(null);
      return;
    }

    try {
      const [incRes, srcRes, statRes, dsRes, trendRes] = await Promise.all([
        fetch('/api/incidents', { headers: authHeaders }),
        fetch('/api/sources', { headers: authHeaders }),
        fetch('/api/stats', { headers: authHeaders }),
        fetch('/api/ministry-dataset', { headers: authHeaders }),
        fetch('/api/ministry-trends', { headers: authHeaders }),
      ]);

      if (incRes.ok) {
        const incData = await incRes.json();
        if (incData.success && !incData.confidential_locked) setIncidents(incData.data || []);
      }
      if (srcRes.ok) {
        const srcData = await srcRes.json();
        if (srcData.success) setSources(srcData.data || []);
      }
      if (statRes.ok) {
        const statData = await statRes.json();
        if (statData.success) setStats(statData);
      }
      if (dsRes.ok) {
        const dsData = await dsRes.json();
        if (dsData.success) setMinistryDataset(dsData);
      }
      if (trendRes.ok) {
        const tData = await trendRes.json();
        if (tData.success) setMinistryTrends(tData.trends || null);
      }
    } catch {
      // Keep confidential containers empty on auth/network failure
    }
  };

  useEffect(() => {
    fetchConfidentialValidatorData();
  }, [token, isValidator]);

  const handleSetTab = (tab) => {
    if (tab === 'report') {
      // Always start at the trilingual language preference prompt whenever entering Incident Reporting
      setReportSessionKey((k) => k + 1);
    }
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenAuth = (mode) => {
    setPortalAuthMode(mode);
    setActiveTab('portal');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchMap = (query) => {
    setMapSearchQuery(query);
    setActiveTab('map');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateSection = (sectionId) => {
    setActiveTab('home');
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
    }, 80);
  };

  return (
    <div className="min-h-screen bg-[#021520] text-white flex flex-col font-sans overflow-x-hidden">
      <Header
        activeTab={activeTab}
        setActiveTab={handleSetTab}
        onOpenAuth={handleOpenAuth}
        onNavigateSection={handleNavigateSection}
      />

      <main className="flex-1 w-full">
        {activeTab === 'home' && (
          <div key="tab-home" className="miis-view-enter">
            <HomeView setActiveTab={handleSetTab} onSearchMap={handleSearchMap} />
          </div>
        )}

        {activeTab === 'report' && (
          <div key={`tab-report-${reportSessionKey}`} className="miis-view-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
            <ReportForm onReportSubmitted={fetchConfidentialValidatorData} />
          </div>
        )}

        <Suspense
          fallback={
            <div className="py-24 text-center text-sm text-white/65 font-light">
              {t('loadingModule')}
            </div>
          }
        >
          {activeTab === 'map' && (
            <div key="tab-map" className="miis-view-enter max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16">
              <LiveMap
                incidents={incidents}
                ministryRecords={ministryDataset.records || []}
                initialSearch={mapSearchQuery}
                onOpenPortalLogin={() => handleOpenAuth('login')}
              />
            </div>
          )}

          {activeTab === 'portal' && (
            <div key="tab-portal" className="miis-view-enter">
              <PortalView
                initialAuthMode={portalAuthMode}
                incidents={incidents}
                sources={sources}
                stats={stats}
                ministryDataset={ministryDataset}
                ministryTrends={ministryTrends}
                onDataChanged={fetchConfidentialValidatorData}
                onGoReport={() => handleSetTab('report')}
              />
            </div>
          )}
        </Suspense>
      </main>

      <footer className="border-t border-white/10 bg-[#010F18] py-7 text-xs text-white/55">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            <strong className="text-white/90 font-medium">{t('footerOrg')}</strong> — {t('footerInst')}
          </div>
          <div className="text-[11px] text-white/45">
            {t('footerTagline')}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MIISApp />
      </LanguageProvider>
    </AuthProvider>
  );
}
