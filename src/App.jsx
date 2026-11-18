import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomeView from './components/HomeView';
import ReportForm from './components/ReportForm';
import LiveMap from './components/LiveMap';
import TwitterHarvester from './components/TwitterHarvester';
import ValidationDashboard from './components/ValidationDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import RewardsHub from './components/RewardsHub';
import { LanguageProvider } from './context/LanguageContext';
import realDataset from './data/real_incidents_data.json';

function computeDefaultStats(incidentsList, sourcesList) {
  const total = incidentsList.length;
  const verified = incidentsList.filter(i => 
    i.validation_status?.includes('Verified') || 
    i.validation_status?.includes('Confirmed') ||
    i.validation_status?.includes('Validated')
  ).length;
  const critical = incidentsList.filter(i => i.urgency_level === 'critical').length;

  const taxonCounts = {};
  incidentsList.forEach(i => {
    taxonCounts[i.taxon_group] = (taxonCounts[i.taxon_group] || 0) + 1;
  });

  const districtCounts = {};
  incidentsList.forEach(i => {
    if (i.district) {
      districtCounts[i.district] = (districtCounts[i.district] || 0) + 1;
    }
  });

  return {
    summary: {
      totalIncidents: total,
      verifiedIncidents: verified,
      criticalUrgent: critical,
      totalReports: 12,
      totalSources: sourcesList.length,
      totalPointsAwarded: 245
    },
    taxonCounts,
    districtCounts
  };
}

function MIISApp() {
  const [activeTab, setActiveTab] = useState('home');
  const [incidents, setIncidents] = useState(realDataset.incidents || []);
  const [sources, setSources] = useState(realDataset.sources || []);
  const [stats, setStats] = useState(computeDefaultStats(realDataset.incidents || [], realDataset.sources || []));
  const [loading, setLoading] = useState(false);

  const fetchAllData = async () => {
    try {
      const [incRes, srcRes, statRes] = await Promise.all([
        fetch('/api/incidents'),
        fetch('/api/sources'),
        fetch('/api/stats')
      ]);

      if (incRes.ok) {
        const incData = await incRes.json();
        if (incData.success && incData.data?.length > 0) setIncidents(incData.data);
      }

      if (srcRes.ok) {
        const srcData = await srcRes.json();
        if (srcData.success && srcData.data?.length > 0) setSources(srcData.data);
      }

      if (statRes.ok) {
        const statData = await statRes.json();
        if (statData.success) setStats(statData);
      }
    } catch (e) {
      console.warn('API sync fallback active (using verified database dataset):', e.message);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A192F] text-slate-100 flex flex-col font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} stats={stats?.summary} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        {activeTab === 'home' && (
          <HomeView setActiveTab={setActiveTab} stats={stats?.summary} />
        )}

        {activeTab === 'report' && (
          <ReportForm onReportSubmitted={fetchAllData} />
        )}

        {activeTab === 'map' && (
          <LiveMap incidents={incidents} />
        )}

        {activeTab === 'harvester' && (
          <TwitterHarvester sources={sources} onHarvestCompleted={fetchAllData} />
        )}

        {activeTab === 'validation' && (
          <ValidationDashboard incidents={incidents} onValidate={fetchAllData} />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsDashboard stats={stats} incidents={incidents} />
        )}

        {activeTab === 'rewards' && (
          <RewardsHub 
            rewards={[
              { reward_id: 'R1', badge_name: 'MIIS Beach Observer', reason: 'Submitted report with verified GPS & clear photos.', points: 15 },
              { reward_id: 'R2', badge_name: 'Twitter AI Harvester Trigger', reason: 'Triggered Gemini AI social media extraction on Sri Lanka keywords.', points: 10 }
            ]} 
            stats={stats} 
          />
        )}
      </main>

      <footer className="border-t border-slate-800 bg-slate-950 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>MIIS: Marine Incident Intelligence System</strong> — Sri Lanka Citizen Science Platform
          </div>
          <div className="text-slate-400 font-mono">
            National Marine Conservation & Intelligence Platform
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <MIISApp />
    </LanguageProvider>
  );
}

