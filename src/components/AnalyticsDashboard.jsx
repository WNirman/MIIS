import React, { useState } from 'react';
import {
  BarChart3,
  FileSpreadsheet,
  MapPin,
  TrendingDown,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  Waves,
  Database,
  CheckCircle2,
  Compass,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const IUCN_COLORS = {
  CR: 'bg-red-500/20 text-red-300 border-red-500/40',
  EN: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  'EN*': 'bg-orange-500/20 text-orange-300 border-orange-500/40',
  VU: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  NT: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/40',
  LC: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
};

export default function AnalyticsDashboard({ stats, incidents, ministryDataset, ministryTrends }) {
  const { t } = useLanguage();
  const [activePanel, setActivePanel] = useState('trends'); // 'trends' | 'spatial' | 'taxonomy' | 'qa'

  const records = ministryDataset?.records || [];
  const qa = ministryDataset?.quality_summary || {};
  const trends = ministryTrends || {};
  const weekly2021 = trends.weekly_2021 || [];
  const decayFit = trends.decay_fit || {};
  const districtSummary = trends.district_summary || [];
  const speciesSummary = (trends.species_summary || []).filter((s) => s.n > 0);
  const yearQuality = (trends.data_quality_by_year || []).filter((y) => y.year > 0);
  const topLocalities = trends.top_localities || [];
  const seasonsAll = trends.seasonality_test?.all_years_counts || {};
  const seasonsPost21 = trends.seasonality_test?.post_2021_counts || {};

  const handleExportCleanCSV = () => {
    const headers = [
      'record_id',
      'event_date',
      'province',
      'district',
      'location_name',
      'latitude',
      'longitude',
      'spatial_precision',
      'taxon_group',
      'species_common',
      'species_scientific',
      'iucn_status',
      'season',
      'qc_status',
      'completeness',
      'flags',
    ];
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = records.map((r) => headers.map((h) => esc(r[h])).join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `miis_sri_lanka_wildlife_mortality_clean_2021_2026.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportGeoJSON = () => {
    const features = records
      .filter((r) => r.latitude != null && r.longitude != null)
      .map((r) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [r.longitude, r.latitude] },
        properties: { ...r },
      }));
    const blob = new Blob([JSON.stringify({ type: 'FeatureCollection', features }, null, 2)], {
      type: 'application/geo+json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `miis_sri_lanka_wildlife_mortality_clean_2021_2026.geojson`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Compute SVG coordinates for the 2021 weekly surge + Poisson decay chart
  const maxWeekly = Math.max(...weekly2021.map((w) => w.total), 1);
  const peakIdx = weekly2021.findIndex((w) => w.week_start === trends.peak_week_start);
  const decayCounts = decayFit.fitted_counts || [];

  return (
    <div className="space-y-7 pb-12">
      {/* Header & Exports */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/25 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-cyan-400 text-xs font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>National Marine Wildlife Mortality Intelligence (2021–2026)</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">{t('analyticsTitle')}</h2>
          <p className="text-xs text-slate-300 max-w-2xl">
            Cleaned &amp; forensically audited Sri Lanka Ministry Register (n = {trends.n_records || 516} records; 669 audited QA corrections; 100% named beaches geocoded) integrated with live MIIS citizen reporting.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportCleanCSV}
            className="flex items-center space-x-2 bg-cyan-500 text-slate-950 px-4 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-cyan-500/20 hover:brightness-110"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Clean CSV ({records.length})</span>
          </button>
          <button
            onClick={handleExportGeoJSON}
            className="flex items-center space-x-2 bg-slate-900 text-cyan-300 border border-cyan-500/40 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-800"
          >
            <Compass className="w-4 h-4" />
            <span>Export GeoJSON</span>
          </button>
        </div>
      </div>

      {/* Primary Scientific KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1.5">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">Cleaned National Records</span>
          <div className="text-3xl font-black text-cyan-400 font-mono">{trends.n_records || 516}</div>
          <div className="text-[11px] text-slate-300">
            {trends.share_2021_pct}% in 2021 • <strong>0 records in 2024</strong>
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1.5">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">2021 Surge Decay Half-Life</span>
          <div className="text-3xl font-black text-rose-400 font-mono">{decayFit.half_life_weeks || 3.96} wk</div>
          <div className="text-[11px] text-rose-200/80">
            Peak {trends.peak_week_records} / wk ({trends.peak_week_start}) • 95% CI {decayFit.half_life_95ci_weeks?.[0]}–{decayFit.half_life_95ci_weeks?.[1]} wk
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1.5">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">SW Monsoon Dominance</span>
          <div className="text-3xl font-black text-teal-400 font-mono">
            {trends.n_dated ? ((seasonsAll['SW monsoon (May-Sep)'] / trends.n_dated) * 100).toFixed(1) : '90.5'}%
          </div>
          <div className="text-[11px] text-teal-300/90">
            Post-2021 baseline: <strong>65.8%</strong> (p = 2.85×10⁻⁴)
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-1.5">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider font-bold block">Forensic QA Repairs</span>
          <div className="text-3xl font-black text-amber-400 font-mono">{trends.qa_highlights?.total_audit_log_edits || 669}</div>
          <div className="text-[11px] text-amber-200/90">
            167 date swaps • {trends.qa_highlights?.locality_geocoded_pct || 93.8}% locality geocoded
          </div>
        </div>
      </div>

      {/* Sub-Section Navigation Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-900/70 p-1.5 rounded-2xl border border-slate-800">
        {[
          { id: 'trends', label: 'Temporal Trends & Seasonality', icon: TrendingDown },
          { id: 'spatial', label: 'District Hotspots & Gaps', icon: MapPin },
          { id: 'taxonomy', label: 'Species & IUCN Status', icon: Waves },
          { id: 'qa', label: 'Forensic Data Audit (Paper Justification)', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activePanel === tab.id ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* PANEL 1: TEMPORAL TRENDS & SEASONALITY */}
      {activePanel === 'trends' && (
        <div className="space-y-6">
          {/* Interactive Weekly 2021 Surge + Exponential Decay SVG Chart */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-white">
                  2021 Acute Coastal Mortality Wave &amp; Poisson Exponential Decay (n = 442)
                </h3>
                <p className="text-xs text-slate-400">
                  Recovered after repairing 167 Excel DD/MM↔MM/DD date-swap errors. Deviance explained R² = {decayFit.deviance_explained_pct}%.
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px]">
                <span className="flex items-center gap-1.5 text-teal-300"><span className="w-3 h-3 rounded bg-teal-500 inline-block" /> Sea Turtles</span>
                <span className="flex items-center gap-1.5 text-blue-300"><span className="w-3 h-3 rounded bg-blue-500 inline-block" /> Cetaceans</span>
                <span className="flex items-center gap-1.5 text-rose-300"><span className="w-4 h-0.5 bg-rose-500 inline-block" /> Decay Curve</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <svg viewBox="0 0 820 260" className="w-full min-w-[600px] h-64">
                {/* Horizontal Grid */}
                {[0, 20, 40, 60, 75].map((tick) => {
                  const y = 220 - (tick / maxWeekly) * 185;
                  return (
                    <g key={tick}>
                      <line x1="45" y1={y} x2="800" y2={y} stroke="#1E293B" strokeDasharray="3,3" />
                      <text x="36" y={y + 4} textAnchor="end" fill="#94A3B8" fontSize="10" fontFamily="monospace">{tick}</text>
                    </g>
                  );
                })}

                {/* Stacked Bars per Week */}
                {weekly2021.map((w, idx) => {
                  const barW = 735 / Math.max(weekly2021.length, 1);
                  const x = 50 + idx * barW;
                  const turtleH = (w.sea_turtle / maxWeekly) * 185;
                  const cetH = (w.cetacean / maxWeekly) * 185;
                  return (
                    <g key={w.week_start}>
                      <rect
                        x={x + 2}
                        y={220 - turtleH}
                        width={Math.max(barW - 5, 4)}
                        height={turtleH}
                        fill="#14B8A6"
                        rx="2"
                      >
                        <title>{`${w.week_start}: ${w.sea_turtle} Sea turtles, ${w.cetacean} Cetaceans (Total ${w.total})`}</title>
                      </rect>
                      {cetH > 0 && (
                        <rect
                          x={x + 2}
                          y={220 - turtleH - cetH}
                          width={Math.max(barW - 5, 4)}
                          height={cetH}
                          fill="#3B82F6"
                          rx="2"
                        >
                          <title>{`${w.week_start}: ${w.cetacean} Cetaceans`}</title>
                        </rect>
                      )}
                      {idx % 4 === 0 && (
                        <text x={x + barW / 2} y="238" textAnchor="middle" fill="#94A3B8" fontSize="9.5" fontFamily="monospace">
                          {w.week_start.slice(5)}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Poisson Exponential Decay Fit Polyline */}
                {peakIdx >= 0 && decayCounts.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#F43F5E"
                    strokeWidth="2.5"
                    strokeDasharray="6,3"
                    points={decayCounts
                      .map((val, i) => {
                        const barW = 735 / Math.max(weekly2021.length, 1);
                        const x = 50 + (peakIdx + i) * barW + barW / 2;
                        const y = 220 - (val / maxWeekly) * 185;
                        return `${x},${y}`;
                      })
                      .join(' ')}
                  />
                )}
              </svg>
            </div>
          </div>

          {/* Multi-Year Breakdown & Seasonality Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Multi-Year Table with 2024 Gap */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
                <span>Annual Mortality Records &amp; 2024 Gap</span>
                <Calendar className="w-4 h-4 text-cyan-400" />
              </h3>
              <div className="space-y-2.5">
                {Object.entries(trends.records_by_year || {}).map(([yr, count]) => {
                  const pct = Math.min((count / 450) * 100, 100);
                  const isGap = count === 0;
                  return (
                    <div key={yr} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-mono font-bold text-white">
                          {yr} {isGap && <span className="ml-2 text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-2 py-0.5 rounded">INSTITUTIONAL REPORTING GAP</span>}
                        </span>
                        <span className="font-mono text-cyan-300 font-bold">{count} records</span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isGap ? 'bg-red-500/40' : yr === '2021' ? 'bg-gradient-to-r from-cyan-500 to-teal-400' : 'bg-blue-500'}`}
                          style={{ width: isGap ? '100%' : `${Math.max(pct, 2)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                Zero records in 2024 and sparse entries in 2023/2025/2026 reflect ad-hoc institutional logging rather than zero marine mortality — underscoring the need for continuous citizen-science reporting.
              </p>
            </div>

            {/* Monsoonal Seasonality (All Years vs Post-2021 Baseline) */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center justify-between border-b border-slate-800 pb-3">
                <span>Monsoonal Seasonality (All Years vs Post-2021)</span>
                <Waves className="w-4 h-4 text-teal-400" />
              </h3>
              <div className="space-y-3 text-xs">
                {Object.entries(seasonsAll).map(([season, count]) => {
                  const postCount = seasonsPost21[season] || 0;
                  const allPct = trends.n_dated ? ((count / trends.n_dated) * 100).toFixed(1) : 0;
                  const postPct = ((postCount / 73) * 100).toFixed(1);
                  return (
                    <div key={season} className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1.5">
                      <div className="flex justify-between font-bold">
                        <span className="text-white">{season}</span>
                        <span className="font-mono text-teal-300">{count} ({allPct}%)</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Post-2021 baseline (2022–2026, n=73):</span>
                        <span className="font-mono text-cyan-300 font-bold">{postCount} ({postPct}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-[11px] text-emerald-300 bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-xl">
                Chi-square goodness-of-fit confirms SW monsoon concentration persists independently after 2021 (χ² = {trends.seasonality_test?.post_2021_chi2}, p = {trends.seasonality_test?.post_2021_p}).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PANEL 2: SPATIAL HOTSPOTS & UNREPORTED DISTRICTS */}
      {activePanel === 'spatial' && (
        <div className="space-y-6">
          {(trends.unreported_coastal_districts || []).length > 0 && (
            <div className="bg-red-950/40 border border-red-500/40 p-4 rounded-2xl flex items-start gap-3 text-xs text-red-100">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-extrabold text-red-300">National Surveillance Blind Spots Identified (0 Records Across 2021–2026)</div>
                <p className="mt-1">
                  Coastal districts with <strong>zero ministry records</strong> across the entire 5-year span:{' '}
                  <span className="font-mono font-bold text-white">{trends.unreported_coastal_districts.join(', ')}</span>{' '}
                  (representing ~282 km of coastline including Sri Lanka&apos;s prime Trincomalee whale canyon). Expanding MIIS to Northeast fishing harbours directly closes this gap.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                Coastal District Burden &amp; Coastline Density (per 100 km)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-400 border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-2">District (Province)</th>
                      <th className="py-2 text-right">Turtles</th>
                      <th className="py-2 text-right">Cetaceans</th>
                      <th className="py-2 text-right">Total</th>
                      <th className="py-2 text-right">/100km</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {districtSummary.map((d) => (
                      <tr key={d.district} className="hover:bg-slate-900/50">
                        <td className="py-2 font-semibold text-white">
                          {d.district} <span className="text-[10px] text-slate-400">({d.province})</span>
                        </td>
                        <td className="py-2 text-right font-mono text-teal-300">{d['Sea turtle']}</td>
                        <td className="py-2 text-right font-mono text-blue-300">{d.Cetacean}</td>
                        <td className="py-2 text-right font-mono font-bold text-white">{d.Total}</td>
                        <td className="py-2 text-right font-mono text-amber-300">{d.records_per_100km_coast}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white border-b border-slate-800 pb-3">
                Top 15 Stranding Beach Hotspots (100% Named Localities Geocoded)
              </h3>
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {topLocalities.map((loc, i) => (
                  <div key={`${loc.district}-${loc.locality_std}`} className="flex items-center justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-500 font-mono mr-2">#{i + 1}</span>
                      <span className="font-bold text-white">{loc.locality_std}</span>
                      <span className="text-[11px] text-slate-400 ml-2">({loc.district})</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-teal-300 font-bold">{loc.n}</span>
                      <span className="text-[10px] text-slate-500">{loc.first?.slice(0, 7)}→{loc.last?.slice(0, 7)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PANEL 3: SPECIES & IUCN RED LIST COMPOSITION */}
      {activePanel === 'taxonomy' && (
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Complete Taxonomic Composition &amp; IUCN Global Red List Status (2025/2026)</h3>
              <p className="text-xs text-slate-400">
                Includes all 5 Sri Lankan sea turtle species, 14+ cetacean taxa (incl. Blue whale &amp; Dwarf sperm whale), and 1 Dugong (VU globally / CR locally). Note: <em>Chelonia mydas</em> downlisted globally to LC in Oct 2025 (EN nationally).
              </p>
            </div>
            <span className="text-xs font-mono bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-xl font-bold">
              Olive Ridley = {trends.olive_ridley_share_of_identified_turtles_pct}% of ID&apos;d turtles
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-slate-400 border-b border-slate-800 text-[11px]">
                <tr>
                  <th className="py-2">Taxon Group</th>
                  <th className="py-2">Common Name</th>
                  <th className="py-2">Scientific Name (WoRMS)</th>
                  <th className="py-2 text-center">IUCN Status</th>
                  <th className="py-2 text-right">Records</th>
                  <th className="py-2 text-right">Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {speciesSummary.map((sp) => (
                  <tr key={`${sp.taxon_group}-${sp.scientific_name}`} className="hover:bg-slate-900/50">
                    <td className="py-2 text-slate-300">{sp.taxon_group}</td>
                    <td className="py-2 font-bold text-white">{sp.common_name}</td>
                    <td className="py-2 italic text-cyan-300">{sp.scientific_name}</td>
                    <td className="py-2 text-center">
                      {sp.iucn_global_status ? (
                        <span className={`px-2 py-0.5 rounded border text-[10px] font-black font-mono ${IUCN_COLORS[sp.iucn_global_status] || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                          {sp.iucn_global_status}
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[10px]">—</span>
                      )}
                    </td>
                    <td className="py-2 text-right font-mono font-bold text-white">{sp.n}</td>
                    <td className="py-2 text-right font-mono text-slate-400">{sp.pct_of_all_records}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PANEL 4: FORENSIC DATA QUALITY AUDIT (EMPIRICAL EVIDENCE FOR MIIS PAPER) */}
      {activePanel === 'qa' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-3xl border border-amber-500/30 space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Database className="w-4 h-4 text-amber-400" />
                <span>Systemic Defects Detected in Raw Ministry Register</span>
              </h3>
              <ul className="space-y-2.5 text-xs text-slate-200">
                <li className="flex justify-between bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                  <span>1. US-locale Excel DD/MM↔MM/DD date swaps</span>
                  <span className="font-mono font-black text-rose-400">{qa.dates?.day_month_swapped_and_fixed} rows</span>
                </li>
                <li className="flex justify-between bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                  <span>2. Province–District mismatches &amp; place-in-Province</span>
                  <span className="font-mono font-black text-amber-300">
                    {(qa.location?.province_district_mismatch_corrected || 0) + (qa.location?.province_contains_place_name || 0)} rows
                  </span>
                </li>
                <li className="flex justify-between bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                  <span>3. District boundary errors (Midigama, Kudawella, Delft, Palatupana/Monaragala, etc.)</span>
                  <span className="font-mono font-black text-amber-300">{qa.location?.district_corrected_from_place} rows</span>
                </li>
                <li className="flex justify-between bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                  <span>4. Missing species-level ID / blank taxon</span>
                  <span className="font-mono font-black text-cyan-300">{qa.taxonomy?.species_not_identified} / {qa.taxonomy?.taxon_missing} rows</span>
                </li>
                <li className="flex justify-between bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                  <span>5. Missing locality text (unmappable below district)</span>
                  <span className="font-mono font-black text-purple-300">
                    {(qa.location?.place_missing || 0) + (qa.location?.no_location_at_all || 0)} rows
                  </span>
                </li>
                <li className="flex justify-between bg-slate-900/70 p-2.5 rounded-xl border border-slate-800">
                  <span>6. Same-day/site/species clusters (no carcass ID/GPS)</span>
                  <span className="font-mono font-black text-teal-300">
                    {qa.duplicates?.records_in_same_day_site_species_groups} rows ({qa.duplicates?.review_groups} groups)
                  </span>
                </li>
              </ul>
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 space-y-4">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Year-by-Year Completeness Degradation (2021 vs 2022–2026)</span>
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-slate-400 border-b border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-2">Year</th>
                      <th className="py-2 text-right">n</th>
                      <th className="py-2 text-right">Locality GPS</th>
                      <th className="py-2 text-right">Species ID</th>
                      <th className="py-2 text-right">Completeness</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {yearQuality.map((yq) => (
                      <tr key={yq.year}>
                        <td className="py-2 font-bold text-white">{yq.year}</td>
                        <td className="py-2 text-right text-slate-300">{yq.n}</td>
                        <td className="py-2 text-right text-teal-300">{yq.locality_geocoded_pct}%</td>
                        <td className="py-2 text-right text-cyan-300">{yq.species_level_id_pct}%</td>
                        <td className="py-2 text-right font-bold text-amber-300">{Math.round(yq.mean_completeness * 100)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-[11px] bg-emerald-950/30 border border-emerald-500/30 p-3 rounded-xl text-emerald-200 space-y-1">
                <div>
                  <strong>Statistical proof of post-crisis decay:</strong> Mean record completeness fell from{' '}
                  <strong>{Math.round((trends.completeness_degradation_test?.mean_2021 || 0.99) * 100)}%</strong> in 2021 to{' '}
                  <strong>{Math.round((trends.completeness_degradation_test?.mean_2022_2026 || 0.80) * 100)}%</strong> in 2022–2026 (Mann–Whitney U, p = {trends.completeness_degradation_test?.p_value}).
                </div>
                <div className="text-slate-300">
                  MIIS directly eliminates every defect above via ISO-8601 UTC locking, hardware satellite GNSS + offline Sri Lanka geofencing, EXIF anti-drift verification, and decoupled 2G Geo-Beacon / harbour Photo sync.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
