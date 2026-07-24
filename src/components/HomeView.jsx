import React from 'react';
import { PlusCircle, MapPin, Radio, ShieldCheck, Sparkles, AlertTriangle, Cpu, Globe, Award, ArrowRight } from 'lucide-react';

export default function HomeView({ setActiveTab, stats }) {
  const incidentCategories = [
    { name: 'Strandings & Animal Deaths', desc: 'Sea turtles, whales, dolphins, dugongs washed ashore or trapped.', icon: '🐋', color: 'from-blue-500/20 to-cyan-500/20 border-cyan-500/30' },
    { name: 'Pollution & Oil Spills', desc: 'Bunker oil leaks, chemical runoff, black sludge on beaches.', icon: '🛢️', color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30' },
    { name: 'Plastic & Nurdle Disaster', desc: 'Pellet washes, microplastics, fishing net entanglements.', icon: '🌊', color: 'from-teal-500/20 to-emerald-500/20 border-teal-500/30' },
    { name: 'Fish Kills & Bleaching', desc: 'Mass fish mortality events, coral reef bleaching, algal blooms.', icon: '🐠', color: 'from-coral/20 to-red-500/20 border-coral/30' }
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl ocean-gradient border border-cyan-500/20 p-8 sm:p-12 lg:p-16">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full text-cyan-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sri Lanka National Marine Wildlife Intelligence Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-none">
            Report. Verify. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400">
              Protect Marine Life.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
            The <strong className="text-cyan-300">Marine Incident Intelligence System (MIIS)</strong> converts citizen reports, Twitter social media posts, and coastal surveillance into a validated, georeferenced research-grade database for conservation and response in Sri Lanka.
          </p>

          {/* Call-to-action buttons */}
          <div className="flex flex-wrap gap-4 pt-4">
            <button
              onClick={() => setActiveTab('report')}
              className="flex items-center space-x-2 bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 px-6 py-3.5 rounded-xl font-extrabold shadow-lg shadow-cyan-500/25 hover:brightness-110 transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Report an Incident</span>
            </button>

            <button
              onClick={() => setActiveTab('map')}
              className="flex items-center space-x-2 bg-slate-900/80 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 px-6 py-3.5 rounded-xl font-bold transition-all"
            >
              <MapPin className="w-5 h-5" />
              <span>View Live Incident Map</span>
            </button>

            <button
              onClick={() => setActiveTab('harvester')}
              className="flex items-center space-x-2 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700 px-6 py-3.5 rounded-xl font-semibold transition-all"
            >
              <Radio className="w-5 h-5 text-teal-400" />
              <span>Twitter AI Harvester</span>
            </button>
          </div>
        </div>

        {/* Live Indicator Counters Bar */}
        <div className="mt-10 pt-8 border-t border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="glass-card p-4 rounded-xl">
            <div className="text-2xl font-black text-cyan-400">{stats?.totalIncidents || 3}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Incidents</div>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <div className="text-2xl font-black text-emerald-400">{stats?.verifiedIncidents || 2}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Expert Verified</div>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <div className="text-2xl font-black text-amber-400">{stats?.totalSources || 2}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Twitter Media Sources</div>
          </div>
          <div className="glass-card p-4 rounded-xl">
            <div className="text-2xl font-black text-coral">{stats?.totalPointsAwarded || 25}</div>
            <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Citizen Points Awarded</div>
          </div>
        </div>
      </section>

      {/* Incident Categories Grid */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-extrabold text-white">What Incidents Can Be Reported</h2>
            <p className="text-xs sm:text-sm text-slate-400">Covers coastal Sri Lanka marine wildlife, habitats, and pollution events.</p>
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
          <h2 className="text-3xl font-extrabold text-white">MIIS Architecture Flow</h2>
          <p className="text-sm text-slate-400">From raw citizen inputs & Twitter scrapers to georeferenced scientific intelligence.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">1</div>
            <h4 className="text-sm font-bold text-white">Data Ingestion</h4>
            <p className="text-[11px] text-slate-400">Citizen web form, Twitter API search, news rss feeds.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">2</div>
            <h4 className="text-sm font-bold text-white">AI Triage Engine</h4>
            <p className="text-[11px] text-slate-400">Gemini AI relevance check, taxon & condition suggestion.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">3</div>
            <h4 className="text-sm font-bold text-white">Geolocation & GPS</h4>
            <p className="text-[11px] text-slate-400">Sri Lanka coastal geocoding, distance-to-coast checks.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">4</div>
            <h4 className="text-sm font-bold text-white">Expert Validation</h4>
            <p className="text-[11px] text-slate-400">Marine scientists verify species, counts, and cause.</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 text-center space-y-2">
            <div className="w-10 h-10 mx-auto rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">5</div>
            <h4 className="text-sm font-bold text-white">Research Database</h4>
            <p className="text-[11px] text-slate-400">Public dashboard map, trend analysis, policy outputs.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
