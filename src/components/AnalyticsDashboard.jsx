import React from 'react';
import { BarChart3, Download, PieChart, TrendingUp, ShieldAlert, Award, FileSpreadsheet, MapPin } from 'lucide-react';

export default function AnalyticsDashboard({ stats, incidents }) {
  const handleExportCSV = () => {
    const headers = ['Incident ID', 'Event Date', 'District', 'Town', 'Taxon', 'Species', 'Condition', 'Latitude', 'Longitude', 'Urgency', 'Validation Status'];
    const rows = incidents.map(i => [
      i.incident_id, i.event_date, i.district, i.nearest_town, i.taxon_group, i.species_common, i.condition_status, i.latitude, i.longitude, i.urgency_level, i.validation_status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `miis_marine_incidents_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const taxonCounts = stats?.taxonCounts || { 'Sea turtle': 2, 'Whale': 1, 'Fish': 1, 'Dugong': 1 };
  const districtCounts = stats?.districtCounts || { 'Trincomalee': 1, 'Colombo': 1, 'Galle': 1 };

  return (
    <div className="space-y-8 pb-12">
      {/* Dashboard Header */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>National Scientific & Public Analytics Dashboard</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Marine Wildlife Incident Indicators</h2>
          <p className="text-xs text-slate-300">Spatial-temporal trends, taxon hotspots, cause breakdown, and open research data export.</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center space-x-2 bg-cyan-500 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-cyan-500/20 hover:brightness-110 transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export Dataset (CSV)</span>
        </button>
      </div>

      {/* Primary Key Performance Indicators (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Total Incidents</span>
          <div className="text-3xl font-black text-cyan-400 font-mono">{stats?.summary?.totalIncidents || 5}</div>
          <div className="text-[11px] text-slate-400">Validated Georeferenced Database</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Expert Verified</span>
          <div className="text-3xl font-black text-emerald-400 font-mono">{stats?.summary?.verifiedIncidents || 3}</div>
          <div className="text-[11px] text-emerald-400/80 font-bold">Level 3 / Level 4 Confirmed</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Critical Urgent Alerts</span>
          <div className="text-3xl font-black text-red-400 font-mono">{stats?.summary?.criticalUrgent || 2}</div>
          <div className="text-[11px] text-red-300">Live Strandings / Oil Spills</div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block">Social Media Ingested</span>
          <div className="text-3xl font-black text-purple-400 font-mono">{stats?.summary?.totalSources || 3}</div>
          <div className="text-[11px] text-purple-300">Twitter API Harvester Posts</div>
        </div>
      </div>

      {/* Taxon & District Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Taxon Composition */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
            <span>Taxon Breakdown</span>
            <PieChart className="w-5 h-5 text-teal-400" />
          </h3>

          <div className="space-y-3">
            {Object.entries(taxonCounts).map(([taxon, count]) => (
              <div key={taxon} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-200">{taxon}</span>
                  <span className="text-cyan-400 font-mono">{count} incidents</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-cyan-500 to-teal-400 h-full rounded-full"
                    style={{ width: `${Math.min((count / (stats?.summary?.totalIncidents || 5)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* District Hotspots */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
            <span>District Hotspots (Sri Lanka Coast)</span>
            <MapPin className="w-5 h-5 text-amber-400" />
          </h3>

          <div className="space-y-3">
            {Object.entries(districtCounts).map(([district, count]) => (
              <div key={district} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-200">{district} District</span>
                  <span className="text-amber-400 font-mono">{count} incidents</span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-amber-500 to-orange-400 h-full rounded-full"
                    style={{ width: `${Math.min((count / (stats?.summary?.totalIncidents || 5)) * 100, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
