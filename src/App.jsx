import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HomeView from './components/HomeView';
import ReportForm from './components/ReportForm';
import LiveMap from './components/LiveMap';
import TwitterHarvester from './components/TwitterHarvester';
import ValidationDashboard from './components/ValidationDashboard';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import RewardsHub from './components/RewardsHub';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [incidents, setIncidents] = useState([]);
  const [sources, setSources] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAllData = async () => {
    try {
      const [incRes, srcRes, statRes] = await Promise.all([
        fetch('/api/incidents'),
        fetch('/api/sources'),
        fetch('/api/stats')
      ]);

      const incData = await incRes.json();
      const srcData = await srcRes.json();
      const statData = await statRes.json();

      if (incData.success) setIncidents(incData.data);
      if (srcData.success) setSources(srcData.data);
      if (statData.success) setStats(statData);
    } catch (e) {
      console.error('Error fetching MIIS backend data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="min-h-screen bg-[#0A192F] text-slate-100 flex flex-col font-sans">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} stats={stats?.summary} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
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
