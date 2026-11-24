import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, Polygon, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Filter, Shield, Lock, ShieldCheck, MapPin, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const SRI_LANKA_COAST_POLYGON = [
  [9.83, 80.22], [9.66, 80.42], [9.27, 80.82], [8.85, 81.10], [8.58, 81.23],
  [8.15, 81.44], [7.73, 81.70], [7.22, 81.86], [6.84, 81.84], [6.56, 81.74],
  [6.27, 81.40], [6.12, 81.12], [6.03, 80.82], [5.93, 80.52], [5.97, 80.36],
  [6.04, 80.21], [6.14, 80.10], [6.33, 80.02], [6.58, 79.96], [6.77, 79.88],
  [6.94, 79.84], [7.21, 79.83], [7.58, 79.79], [7.82, 79.78], [8.23, 79.71],
  [8.55, 79.88], [8.98, 79.90], [9.07, 79.72], [9.10, 79.92], [9.47, 80.08],
  [9.68, 79.95], [9.83, 80.22],
];

// Public non-confidential Sri Lanka marine resource sanctuaries shown to non-validator visitors
const PUBLIC_MARINE_SANCTUARIES = [
  {
    id: 'HAB-MIRISSA',
    titleKey: 'res1Title',
    regionKey: 'res1Region',
    metricKey: 'res1Metric',
    descKey: 'res1Desc',
    lat: 5.948,
    lon: 80.459,
    color: '#38BDF8',
  },
  {
    id: 'HAB-REKAWA',
    titleKey: 'res2Title',
    regionKey: 'res2Region',
    metricKey: 'res2Metric',
    descKey: 'res2Desc',
    lat: 6.044,
    lon: 80.861,
    color: '#10B981',
  },
  {
    id: 'HAB-PIGEON',
    titleKey: 'res3Title',
    regionKey: 'res3Region',
    metricKey: 'res3Metric',
    descKey: 'res3Desc',
    lat: 8.721,
    lon: 81.204,
    color: '#F5A623',
  },
  {
    id: 'HAB-MANNAR',
    titleKey: 'res4Title',
    regionKey: 'res4Region',
    metricKey: 'res4Metric',
    descKey: 'res4Desc',
    lat: 8.95,
    lon: 79.82,
    color: '#2DD4BF',
  },
  {
    id: 'HAB-NEGOMBO',
    titleKey: 'res5Title',
    regionKey: 'res5Region',
    metricKey: 'res5Metric',
    descKey: 'res5Desc',
    lat: 7.208,
    lon: 79.828,
    color: '#A78BFA',
  },
];

const BASEMAPS = {
  osm: {
    label: 'OpenStreetMap',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  },
  voyager: {
    label: 'Carto Ocean Light',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
  dark: {
    label: 'Carto Dark Marine',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO',
  },
  satellite: {
    label: 'Esri Satellite Ocean',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
  },
};

function MapAutoResize() {
  const map = useMap();
  useEffect(() => {
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 450);
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);
  return null;
}

function getMarkerColor(taxon, urgency) {
  const tx = (taxon || '').toLowerCase();
  if (tx.includes('sirenian') || tx.includes('dugong')) return '#F5A623';
  if (tx.includes('cetacean') || tx.includes('whale') || tx.includes('dolphin')) return '#38BDF8';
  if (tx.includes('turtle')) return '#10B981';
  if (urgency === 'critical') return '#EF4444';
  return '#A855F7';
}

export default function LiveMap({ incidents = [], ministryRecords = [], initialSearch = '', onOpenPortalLogin }) {
  const { isValidator, user } = useAuth();
  const { t } = useLanguage();
  const [layerMode, setLayerMode] = useState('ministry');
  const [yearFilter, setYearFilter] = useState('All');
  const [taxonFilter, setTaxonFilter] = useState('All');
  const [searchFilter, setSearchFilter] = useState(initialSearch);
  const [basemap, setBasemap] = useState('osm');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedHabitat, setSelectedHabitat] = useState(null);

  useEffect(() => {
    setSearchFilter(initialSearch);
  }, [initialSearch]);

  // Confidential incident layers are computed ONLY when authenticated as a Validator
  const activeDataset = useMemo(() => {
    if (!isValidator) return [];
    if (layerMode === 'ministry') {
      return ministryRecords.map((r) => ({
        incident_id: r.record_id,
        event_date: r.event_date,
        year: r.year,
        district: r.district_clean,
        province: r.province_clean,
        location_name: r.location_clean,
        latitude: r.latitude,
        longitude: r.longitude,
        taxon_group: r.taxon_group,
        species_common: r.species_common,
        species_scientific: r.species_scientific,
        iucn: r.iucn_global_status,
        validation_status: 'National Register Verified',
        flags: r.qa_flags,
        urgency_level: r.taxon_group === 'Sirenian' ? 'critical' : 'medium',
      }));
    }
    if (layerMode === 'live') return incidents;
    return [
      ...incidents,
      ...ministryRecords.map((r) => ({
        incident_id: r.record_id,
        event_date: r.event_date,
        year: r.year,
        district: r.district_clean,
        province: r.province_clean,
        location_name: r.location_clean,
        latitude: r.latitude,
        longitude: r.longitude,
        taxon_group: r.taxon_group,
        species_common: r.species_common,
        species_scientific: r.species_scientific,
        validation_status: 'National Register',
        urgency_level: 'medium',
      })),
    ];
  }, [isValidator, layerMode, incidents, ministryRecords]);

  const filteredIncidents = useMemo(() => {
    if (!isValidator) return [];
    const q = searchFilter.trim().toLowerCase();
    return activeDataset.filter((inc) => {
      if (inc.latitude == null || inc.longitude == null) return false;
      if (yearFilter !== 'All' && String(inc.year || inc.event_date?.slice(0, 4)) !== yearFilter) return false;
      if (taxonFilter !== 'All') {
        const tx = `${inc.taxon_group || ''} ${inc.species_common || ''}`.toLowerCase();
        if (!tx.includes(taxonFilter.toLowerCase())) return false;
      }
      if (q) {
        const hay = `${inc.district || ''} ${inc.province || ''} ${inc.location_name || ''} ${inc.species_common || ''} ${inc.taxon_group || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [isValidator, activeDataset, yearFilter, taxonFilter, searchFilter]);

  const filteredHabitats = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return PUBLIC_MARINE_SANCTUARIES;
    return PUBLIC_MARINE_SANCTUARIES.filter((h) => {
      const hay = `${t(h.titleKey)} ${t(h.regionKey)} ${t(h.descKey)}`.toLowerCase();
      return hay.includes(q);
    });
  }, [searchFilter, t]);

  return (
    <div className="space-y-5">
      {/* Confidentiality & Access Tier Banner */}
      <div
        className={`p-4 sm:p-5 rounded-xl border flex flex-wrap items-center justify-between gap-4 text-xs ${
          isValidator
            ? 'bg-emerald-950/35 border-emerald-500/35 text-emerald-100'
            : 'bg-[#041E2D] border-white/15 text-white/85'
        }`}
      >
        <div className="flex items-start sm:items-center gap-3">
          {isValidator ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5 sm:mt-0" />
          ) : (
            <Shield className="w-5 h-5 text-[#F5A623] shrink-0 mt-0.5 sm:mt-0" />
          )}
          <div className="space-y-0.5">
            <div className="font-semibold text-white text-xs sm:text-sm">
              {isValidator
                ? `${t('mapProtectValidatorTitle')} (${user.full_name})`
                : t('mapProtectPublicTitle')}
            </div>
            <div className="text-xs text-white/70">
              {isValidator ? t('mapProtectValidatorSub') : t('mapProtectPublicSub')}
            </div>
          </div>
        </div>

        {!isValidator && onOpenPortalLogin && (
          <button
            type="button"
            onClick={onOpenPortalLogin}
            className="flex items-center gap-1.5 bg-[#F5A623] hover:bg-[#fbba45] text-[#021520] font-semibold px-4 py-2 rounded-full transition-colors shrink-0"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{t('mapValidatorLoginBtn')}</span>
          </button>
        )}
      </div>

      {/* Clean Controls Bar */}
      <div className="bg-[#041E2D] border border-white/10 p-4 rounded-xl flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-2.5">
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-[#F5A623] shrink-0" />
            <h2 className="text-sm sm:text-base font-medium text-white">
              {isValidator ? t('mapHeading') : t('mapPublicHabitatsHeading')}
            </h2>
          </div>
          <span className="bg-white/10 text-white/85 text-[11px] px-2.5 py-0.5 rounded-full font-medium shrink-0">
            {isValidator
              ? `${filteredIncidents.length} ${t('mapPlotted')}`
              : `${filteredHabitats.length} ${t('mapPublicHabitatsCount')}`}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 text-xs">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={t('mapSearchPlaceholder')}
            className="col-span-2 sm:col-span-1 bg-[#021520] text-white placeholder-white/45 px-3 py-2 sm:py-1.5 rounded-lg border border-white/15 focus:border-[#F5A623] focus:outline-none sm:w-48 text-sm sm:text-xs"
          />

          {isValidator && (
            <>
              <div className="col-span-2 sm:col-span-1 flex items-center gap-1.5 bg-[#021520] px-2.5 py-2 sm:py-1.5 rounded-lg border border-white/15">
                <Layers className="w-3.5 h-3.5 text-[#F5A623] shrink-0" />
                <select value={layerMode} onChange={(e) => setLayerMode(e.target.value)} className="w-full bg-transparent text-white focus:outline-none">
                  <option value="ministry" className="bg-[#021520]">{t('mapLayerNational')} ({ministryRecords.length})</option>
                  <option value="live" className="bg-[#021520]">{t('mapLayerLive')} ({incidents.length})</option>
                  <option value="combined" className="bg-[#021520]">{t('mapLayerCombined')}</option>
                </select>
              </div>

              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="bg-[#021520] text-white px-2.5 py-2 sm:py-1.5 rounded-lg border border-white/15 focus:outline-none"
              >
                <option value="All">{t('mapAllYears')}</option>
                <option value="2021">2021</option>
                <option value="2022">2022</option>
                <option value="2023">2023</option>
                <option value="2025">2025</option>
                <option value="2026">2026</option>
              </select>

              <div className="flex items-center gap-1.5 bg-[#021520] px-2.5 py-2 sm:py-1.5 rounded-lg border border-white/15">
                <Filter className="w-3.5 h-3.5 text-white/50 shrink-0" />
                <select value={taxonFilter} onChange={(e) => setTaxonFilter(e.target.value)} className="w-full bg-transparent text-white focus:outline-none">
                  <option value="All" className="bg-[#021520]">{t('mapAllTaxa')}</option>
                  <option value="turtle" className="bg-[#021520]">{t('mapTaxaTurtles')}</option>
                  <option value="cetacean" className="bg-[#021520]">{t('mapTaxaCetaceans')}</option>
                  <option value="sirenian" className="bg-[#021520]">{t('mapTaxaDugong')}</option>
                </select>
              </div>
            </>
          )}

          <select
            value={basemap}
            onChange={(e) => setBasemap(e.target.value)}
            className="col-span-2 sm:col-span-1 bg-[#021520] text-white px-2.5 py-2 sm:py-1.5 rounded-lg border border-white/15 focus:outline-none"
          >
            {Object.entries(BASEMAPS).map(([k, cfg]) => (
              <option key={k} value={k} className="bg-[#021520]">{cfg.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Map + Clean Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 h-[380px] sm:h-[500px] lg:h-[560px] rounded-xl overflow-hidden border border-white/15 relative bg-[#021520]">
          <MapContainer
            center={[7.85, 80.72]}
            zoom={7}
            minZoom={6}
            maxZoom={16}
            preferCanvas={true}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', zIndex: 1 }}
          >
            <MapAutoResize />
            <TileLayer key={basemap} attribution={BASEMAPS[basemap].attribution} url={BASEMAPS[basemap].url} />

            <Polygon
              positions={SRI_LANKA_COAST_POLYGON}
              pathOptions={{
                color: '#F5A623',
                weight: 1.4,
                opacity: 0.6,
                fillColor: '#041E2D',
                fillOpacity: 0.14,
              }}
            />

            {isValidator
              ? filteredIncidents.map((inc) => {
                  const lat = Number(inc.latitude);
                  const lon = Number(inc.longitude);
                  const col = getMarkerColor(inc.taxon_group || inc.reported_category, inc.urgency_level);
                  return (
                    <CircleMarker
                      key={inc.incident_id}
                      center={[lat, lon]}
                      radius={selectedIncident?.incident_id === inc.incident_id ? 8 : 5.5}
                      pathOptions={{ color: '#021520', weight: 1.2, fillColor: col, fillOpacity: 0.88 }}
                      eventHandlers={{ click: () => setSelectedIncident(inc) }}
                    >
                      <Popup>
                        <div className="text-slate-900 text-xs space-y-1">
                          <div className="font-mono font-bold">{inc.incident_id} • {inc.event_date}</div>
                          <div className="font-bold">{inc.species_common || inc.taxon_group}</div>
                          <div className="italic text-slate-600">{inc.species_scientific}</div>
                          <div>{inc.location_name}, {inc.district}</div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })
              : filteredHabitats.map((hab) => (
                  <CircleMarker
                    key={hab.id}
                    center={[hab.lat, hab.lon]}
                    radius={selectedHabitat?.id === hab.id ? 11 : 8}
                    pathOptions={{ color: '#FFFFFF', weight: 2, fillColor: hab.color, fillOpacity: 0.9 }}
                    eventHandlers={{ click: () => setSelectedHabitat(hab) }}
                  >
                    <Popup>
                      <div className="text-slate-900 text-xs space-y-1">
                        <div className="font-bold">{t(hab.titleKey)}</div>
                        <div className="text-slate-600">{t(hab.regionKey)}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
          </MapContainer>

          {isValidator && (
            <div className="absolute bottom-3 left-3 right-3 sm:right-auto z-[400] bg-[#021520]/90 backdrop-blur-md border border-white/15 px-3 py-2 rounded-lg text-[11px] flex flex-wrap items-center gap-3 text-white/85">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> {t('mapLegendTurtle')}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> {t('mapLegendCetacean')}</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#F5A623] inline-block" /> {t('mapLegendDugong')}</span>
            </div>
          )}
        </div>

        {/* Right Details Panel */}
        <div className="bg-[#041E2D] p-5 sm:p-6 rounded-xl border border-white/10 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-base font-medium text-white border-b border-white/10 pb-3 flex items-center justify-between gap-2">
              <span>{t('mapInspectorTitle')}</span>
              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${isValidator ? 'bg-emerald-500/20 text-emerald-300' : 'bg-[#F5A623]/20 text-[#F5A623]'}`}>
                {isValidator ? t('mapTierValidator') : t('mapTierPublic')}
              </span>
            </h3>

            {isValidator ? (
              selectedIncident ? (
                <div className="space-y-4 pt-4 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[#F5A623] font-semibold">{selectedIncident.incident_id}</span>
                    <span className="font-mono text-white/75 bg-[#021520] px-2 py-0.5 rounded">{selectedIncident.event_date}</span>
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-white">{selectedIncident.species_common || selectedIncident.taxon_group}</h4>
                    <p className="text-white/65 italic">{selectedIncident.species_scientific}</p>
                  </div>
                  <div className="bg-[#021520] p-4 rounded-xl space-y-2 border border-white/10">
                    <div className="flex justify-between gap-2">
                      <span className="text-white/55">{t('mapFieldDistrict')}</span>
                      <span className="text-white font-medium text-right">{selectedIncident.district} ({selectedIncident.province})</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/55">{t('mapFieldLocation')}</span>
                      <span className="text-white text-right">{selectedIncident.location_name}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/55">{t('mapFieldCoords')}</span>
                      <span className="font-mono text-white/85">{selectedIncident.latitude}, {selectedIncident.longitude}</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span className="text-white/55">{t('mapFieldValidation')}</span>
                      <span className="text-emerald-300 font-medium">{selectedIncident.validation_status}</span>
                    </div>
                  </div>
                  {selectedIncident.flags && (
                    <div className="bg-[#021520] border border-white/10 p-3 rounded-lg text-[11px] text-white/80">
                      <strong>{t('mapQaFlags')}</strong> {selectedIncident.flags}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-14 text-center text-white/55 text-xs space-y-2">
                  <MapPin className="w-8 h-8 mx-auto text-white/30" />
                  <p>{t('mapClickPrompt')}</p>
                </div>
              )
            ) : selectedHabitat ? (
              <div className="space-y-4 pt-4 text-xs">
                <div className="text-[11px] text-[#F5A623] font-medium">{t(selectedHabitat.metricKey)}</div>
                <h4 className="text-lg font-medium text-white leading-snug">{t(selectedHabitat.titleKey)}</h4>
                <div className="text-white/65">{t(selectedHabitat.regionKey)}</div>
                <p className="text-white/80 leading-relaxed">{t(selectedHabitat.descKey)}</p>
              </div>
            ) : (
              <div className="py-12 text-center text-white/60 text-xs space-y-3">
                <MapPin className="w-8 h-8 mx-auto text-white/30" />
                <p>{t('mapHabitatClickPrompt')}</p>
                <p className="text-[11px] text-white/45 pt-2 border-t border-white/10">{t('mapProtectPublicSub')}</p>
              </div>
            )}
          </div>

          <div className="text-[11px] text-white/45 border-t border-white/10 pt-3">
            {t('mapFooterTech')}
          </div>
        </div>
      </div>
    </div>
  );
}
