import React from 'react';
import { Anchor, ShieldAlert, Map, Radio, Award, BarChart3, PlusCircle, Home } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, stats }) {
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'report', label: 'Report Incident', icon: PlusCircle, highlight: true },
    { id: 'map', label: 'Live Map', icon: Map },
    { id: 'harvester', label: 'Social Media AI Harvester', icon: Radio },
    { id: 'validation', label: 'Expert Validation', icon: ShieldAlert, badge: stats?.criticalUrgent },
    { id: 'analytics', label: 'Dashboards', icon: BarChart3 },
    { id: 'rewards', label: 'Citizen Rewards', icon: Award }
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-cyan-500/20">
      {/* Urgent Emergency Alert Ticker */}
      <div className="bg-red-950/80 border-b border-red-500/30 text-red-200 text-xs px-4 py-1.5 flex items-center justify-between">
        <div className="flex items-center space-x-2 animate-pulse">
          <span className="h-2 w-2 rounded-full bg-red-500"></span>
          <span className="font-semibold uppercase tracking-wider">LIVE ALERT NETWORK:</span>
          <span>Critical stranding active near Pigeon Island, Trincomalee (Response Team Dispatched)</span>
        </div>
        <div className="hidden md:block text-slate-400">
          Emergency Contact DWC: <span className="text-red-400 font-mono font-bold">+94 11 2888555</span>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Anchor className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              MIIS <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/30 font-medium">Sri Lanka</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Marine Incident Intelligence System</p>
          </div>
        </div>

        {/* Desktop Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                    : tab.highlight
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
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

        {/* Mobile Quick Action button */}
        <div className="flex lg:hidden items-center space-x-2">
          <button
            onClick={() => setActiveTab('report')}
            className="flex items-center space-x-1 bg-cyan-500 text-slate-950 text-xs px-3 py-2 rounded-lg font-bold"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report</span>
          </button>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      <div className="flex lg:hidden overflow-x-auto border-t border-slate-800 px-2 py-1.5 space-x-1 bg-slate-950">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                isActive ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
