import React, { useState } from 'react';
import { Radio, Sparkles, Cpu, CheckCircle2, ArrowRight, ExternalLink, RefreshCw, Database, Share2, Layers } from 'lucide-react';

export default function SocialMediaHarvester({ sources, onHarvestCompleted }) {
  const [keyword, setKeyword] = useState('turtle stranding Sri Lanka');
  const [platform, setPlatform] = useState('All');
  const [loading, setLoading] = useState(false);
  const [harvestResult, setHarvestResult] = useState(null);

  const keywordsList = [
    'turtle stranding Sri Lanka',
    'whale dead beach Sri Lanka',
    'dolphin stranded Colombo',
    'oil spill Galle beach',
    'fish kill Negombo lagoon',
    'nurdle pollution Sri Lanka',
    'ghost net coral reef'
  ];

  const platforms = [
    { id: 'All', name: 'All Networks', icon: Share2, color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40' },
    { id: 'Twitter', name: 'Twitter / X', icon: Radio, color: 'bg-teal-500/20 text-teal-300 border-teal-500/40' },
    { id: 'Facebook', name: 'Facebook', icon: Layers, color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' },
    { id: 'Instagram', name: 'Instagram', icon: Sparkles, color: 'bg-purple-500/20 text-purple-300 border-purple-500/40' }
  ];

  const handleRunHarvest = async () => {
    setLoading(true);
    setHarvestResult(null);

    try {
      const res = await fetch('/api/social/harvest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, platform })
      });
      const data = await res.json();
      if (data.success) {
        setHarvestResult(data);
        if (onHarvestCompleted) onHarvestCompleted();
      } else {
        alert('Harvest error: ' + data.error);
      }
    } catch (err) {
      alert('Harvest request failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Harvester Header */}
      <div className="glass-panel p-6 rounded-3xl border border-teal-500/20 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-teal-400 text-xs font-bold uppercase tracking-wider">
            <Radio className="w-4 h-4 animate-pulse" />
            <span>Real-Time Multi-Platform Media Intelligence</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white">Social Media AI Harvester (Twitter, Facebook, Instagram)</h2>
          <p className="text-xs text-slate-300">Queries Twitter/X API, Facebook Graph API, and Instagram Hashtag feeds with Gemini AI extraction.</p>
        </div>

        <button
          onClick={handleRunHarvest}
          disabled={loading}
          className="flex items-center space-x-2 bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 px-6 py-3 rounded-xl font-extrabold shadow-lg shadow-teal-500/20 hover:brightness-110 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>{loading ? 'Harvesting & Running Gemini AI...' : `Trigger ${platform} Harvester`}</span>
        </button>
      </div>

      {/* Platform & Keyword Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Platform Selector */}
        <div className="glass-card p-4 rounded-2xl space-y-2">
          <span className="text-xs font-bold text-slate-300 block">1. Select Target Social Network:</span>
          <div className="grid grid-cols-2 gap-2">
            {platforms.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.id}
                  onClick={() => setPlatform(p.id)}
                  className={`p-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 border transition-all ${
                    platform === p.id ? p.color : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{p.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Keyword Selector */}
        <div className="md:col-span-2 glass-card p-4 rounded-2xl space-y-2">
          <span className="text-xs font-bold text-slate-300 block">2. Select Sri Lanka Monitoring Keywords:</span>
          <div className="flex flex-wrap gap-2">
            {keywordsList.map((kw) => (
              <button
                key={kw}
                onClick={() => setKeyword(kw)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  keyword === kw
                    ? 'bg-teal-500/20 border-teal-400 text-teal-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {kw}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Harvest Output Results */}
      {harvestResult && (
        <div className="glass-panel p-6 rounded-3xl border border-emerald-500/30 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Multi-Platform Harvest Complete: {harvestResult.data.length} Posts Ingested to Database</span>
            </div>
            <span className="text-xs text-slate-400 font-mono">Platform: {harvestResult.platform} | Query: '{harvestResult.query}'</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {harvestResult.data.map((item, idx) => (
              <div key={idx} className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      item.post.platform === 'Facebook' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                      item.post.platform === 'Instagram' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                    }`}>
                      {item.post.platform}
                    </span>
                    <span className="font-bold text-cyan-400">{item.post.user}</span>
                  </div>
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-mono text-[10px]">
                    Gemini Confidence: {item.aiResult.confidence_score}%
                  </span>
                </div>

                <p className="text-xs text-slate-200 bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono leading-relaxed">
                  "{item.post.text}"
                </p>

                {/* Gemini AI Extracted Fields Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3 rounded-xl text-[11px]">
                  <div>
                    <span className="text-slate-400 block">Event Type:</span>
                    <span className="font-bold text-white">{item.aiResult.event_type}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Predicted Taxon:</span>
                    <span className="font-bold text-teal-300">{item.aiResult.taxon_group}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Location Geocode:</span>
                    <span className="font-bold text-cyan-300">{item.aiResult.nearest_town}, {item.aiResult.district}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Coordinates:</span>
                    <span className="font-mono text-slate-300">{item.aiResult.latitude}, {item.aiResult.longitude}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                  <span>Evidence Quote: <strong className="text-slate-300">"{item.aiResult.evidence_sentence}"</strong></span>
                  <span className="font-mono text-xs text-emerald-400 font-bold">ID: {item.incidentId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Historical Media Sources Archive Table (Section 12 of PDF) */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-cyan-400" />
          <span>Multi-Platform Social Media Archive (Twitter, Facebook, Instagram)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
              <tr>
                <th className="p-3">Source ID</th>
                <th className="p-3">Platform</th>
                <th className="p-3">Author</th>
                <th className="p-3">Title / Extract</th>
                <th className="p-3">Credibility</th>
                <th className="p-3">Incident ID</th>
                <th className="p-3">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sources.map((src) => (
                <tr key={src.source_id} className="hover:bg-slate-900/40">
                  <td className="p-3 font-mono text-cyan-400">{src.source_id}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      (src.source_type || '').includes('Facebook') ? 'bg-blue-500/20 text-blue-300' :
                      (src.source_type || '').includes('Instagram') ? 'bg-purple-500/20 text-purple-300' :
                      'bg-teal-500/20 text-teal-300'
                    }`}>
                      {src.source_type || 'Twitter API'}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-200">{src.author}</td>
                  <td className="p-3 max-w-xs truncate text-slate-300">{src.evidence_sentence || src.title}</td>
                  <td className="p-3 font-bold text-emerald-400">{src.credibility_score}/100</td>
                  <td className="p-3 font-mono text-amber-400">{src.incident_id || 'INC-2026-001'}</td>
                  <td className="p-3">
                    <a href={src.source_url || '#'} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline flex items-center space-x-1">
                      <span>View</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
