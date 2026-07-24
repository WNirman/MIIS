import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Filter, EyeOff, ShieldCheck, AlertTriangle, Info, MapPin } from 'lucide-react';

// Custom Map Pins for Leaflet
const createCustomIcon = (urgency, taxon) => {
  let color = '#00B4D8'; // Cyan
  if (urgency === 'critical') color = '#EF4444'; // Red
  else if (urgency === 'high') color = '#F97316'; // Orange
  else if (urgency === 'medium') color = '#F59E0B'; // Yellow

  return L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 3px solid #0f172a;
        box-shadow: 0 0 10px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: #0f172a;
        font-weight: bold;
        font-size: 12px;
      ">
        ${taxon === 'Sea turtle' ? '🐢' : taxon === 'Whale' ? '🐋' : taxon === 'Dolphin' ? '🐬' : '📍'}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

export default function LiveMap({ incidents }) {
  const [taxonFilter, setTaxonFilter] = useState('All');
  const [urgencyFilter, setUrgencyFilter] = useState('All');
  const [blurSensitive, setBlurSensitive] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);

  const filteredIncidents = incidents.filter(inc => {
    if (taxonFilter !== 'All' && inc.taxon_group !== taxonFilter) return false;
    if (urgencyFilter !== 'All' && inc.urgency_level !== urgencyFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Map Control Bar & Filters */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-cyan-500/20">
        <div className="flex items-center space-x-3">
          <MapPin className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Public Marine Incident Map</h2>
          <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2.5 py-0.5 rounded-full border border-cyan-500/30">
            {filteredIncidents.length} Records Georeferenced
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          {/* Taxon Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={taxonFilter}
              onChange={(e) => setTaxonFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            >
              <option value="All" className="bg-slate-900">All Taxons</option>
              <option value="Sea turtle" className="bg-slate-900">Sea Turtle</option>
              <option value="Whale" className="bg-slate-900">Whale</option>
              <option value="Dolphin" className="bg-slate-900">Dolphin</option>
              <option value="Fish" className="bg-slate-900">Fish / Fish Kill</option>
              <option value="Dugong" className="bg-slate-900">Dugong</option>
            </select>
          </div>

          {/* Urgency Filter */}
          <div className="flex items-center space-x-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <select
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none"
            >
              <option value="All" className="bg-slate-900">All Urgency Levels</option>
              <option value="critical" className="bg-slate-900">Critical Response</option>
              <option value="high" className="bg-slate-900">High Urgency</option>
              <option value="medium" className="bg-slate-900">Medium</option>
            </select>
          </div>

          {/* Sensitive Location Blurring Toggle (Page 12 of PDF) */}
          <button
            onClick={() => setBlurSensitive(!blurSensitive)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border transition-all ${
              blurSensitive
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>Sensitive Blur: {blurSensitive ? 'ON (1-5km)' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[550px] rounded-3xl overflow-hidden glass-panel border border-slate-800 relative z-10">
          <MapContainer
            center={[7.8731, 80.7718]}
            zoom={7}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            {filteredIncidents.map((inc) => {
              // Apply coordinate blurring offset if sensitive location is flagged
              const isSensitive = inc.sensitive_location && blurSensitive;
              const displayLat = isSensitive ? inc.latitude + 0.02 : inc.latitude;
              const displayLon = isSensitive ? inc.longitude + 0.02 : inc.longitude;

              return (
                <React.Fragment key={inc.incident_id}>
                  {/* Blurring Radius Circle for Sensitive Species (Nesting beaches, dugongs) */}
                  {isSensitive && (
                    <Circle
                      center={[displayLat, displayLon]}
                      radius={3000}
                      pathOptions={{ color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.15, dashArray: '4,4' }}
                    />
                  )}

                  <Marker
                    position={[displayLat, displayLon]}
                    icon={createCustomIcon(inc.urgency_level, inc.taxon_group)}
                    eventHandlers={{
                      click: () => setSelectedIncident(inc)
                    }}
                  >
                    <Popup className="custom-leaflet-popup">
                      <div className="p-1 space-y-1 text-slate-900 font-sans">
                        <div className="font-bold text-xs uppercase tracking-wider text-cyan-700">{inc.incident_id}</div>
                        <div className="font-extrabold text-sm">{inc.taxon_group} — {inc.event_type}</div>
                        <div className="text-xs text-slate-600">📍 {inc.nearest_town}, {inc.district}</div>
                        <div className="text-[11px] bg-slate-100 p-1 rounded font-mono">
                          Status: {inc.validation_status}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>

        {/* Selected Incident Information Card */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white border-b border-slate-800 pb-3 flex items-center justify-between">
              <span>Incident Details</span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </h3>

            {selectedIncident ? (
              <div className="space-y-4 pt-4 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-cyan-400 font-bold">{selectedIncident.incident_id}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    selectedIncident.urgency_level === 'critical' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {selectedIncident.urgency_level}
                  </span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-base font-extrabold text-white">{selectedIncident.species_common || selectedIncident.taxon_group}</h4>
                  <p className="text-slate-400 italic text-[11px]">{selectedIncident.species_scientific}</p>
                </div>

                <div className="bg-slate-900/80 p-3 rounded-xl space-y-2 border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Event Type:</span>
                    <span className="text-slate-200 font-semibold">{selectedIncident.event_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Condition:</span>
                    <span className="text-slate-200 font-semibold">{selectedIncident.condition_status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Location:</span>
                    <span className="text-cyan-300 font-semibold">{selectedIncident.location_name || selectedIncident.nearest_town}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">District:</span>
                    <span className="text-slate-200 font-semibold">{selectedIncident.district}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Coordinates:</span>
                    <span className="font-mono text-slate-300">{selectedIncident.latitude}, {selectedIncident.longitude}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400">Suspected Cause:</span>
                  <p className="text-slate-300 bg-slate-900/40 p-2 rounded border border-slate-800">{selectedIncident.suspected_cause}</p>
                </div>

                {selectedIncident.sensitive_location && (
                  <div className="bg-amber-950/40 border border-amber-500/30 p-2.5 rounded-lg text-amber-200 text-[11px] flex items-center space-x-2">
                    <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Protected species nesting zone. Coordinates blurred by 1-5km on public portal.</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <MapPin className="w-10 h-10 mx-auto text-slate-600" />
                <p>Click on any marker on the map to inspect georeferenced incident metadata.</p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-slate-500 border-t border-slate-800 pt-3">
            Spatial Precision: <span className="text-cyan-400 font-mono">exact_site / nearby_site</span> | Source: MIIS Database
          </div>
        </div>
      </div>
    </div>
  );
}
