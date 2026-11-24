import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  MapPin,
  CheckCircle2,
  Send,
  WifiOff,
  AlertTriangle,
  MessageSquare,
  UploadCloud,
  RefreshCw,
  Globe,
  HelpCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  acquireMaritimeGNSSFix,
  classifyGnssAccuracy,
  compressMarinePhoto,
  encodeSmsBeaconPacket,
  getMaritimeNetworkStatus,
  haversineKm,
  validateSriLankaMaritimeCoords,
} from '../utils/maritimeGeo';
import {
  flushMaritimeSyncQueue,
  generateClientUuid,
  getAllQueuedReports,
  saveQueuedReport,
  syncMediaPhase,
} from '../utils/offlineSyncQueue';

const LANGUAGE_CHOICES = [
  {
    code: 'en',
    nativeName: 'English',
    sub: 'Continue & fill the marine report in English with step-by-step guidance',
    badge: 'EN',
  },
  {
    code: 'si',
    nativeName: 'සිංහල',
    sub: 'සිංහල භාෂාවෙන් පහසු උපදෙස් සමඟ සාගර වාර්තාව පුරවන්න',
    badge: 'සිං',
  },
  {
    code: 'ta',
    nativeName: 'தமிழ்',
    sub: 'தமிழ் மொழியில் படிப்படியான வழிகாட்டுதலுடன் புகாரை நிரப்பவும்',
    badge: 'தமி',
  },
];

export default function ReportForm({ onReportSubmitted }) {
  const { user, authHeaders } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const fileInputRef = useRef(null);

  // ALWAYS prompt language preference first when entering Incident Reporting
  const [languageConfirmed, setLanguageConfirmed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [gnssLocking, setGnssLocking] = useState(false);
  const [gnssError, setGnssError] = useState('');
  const [receipt, setReceipt] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncingPending, setSyncingPending] = useState(false);

  const [photoPayload, setPhotoPayload] = useState(null);
  const [exifDriftAlert, setExifDriftAlert] = useState(null);
  const [netStatus, setNetStatus] = useState(() => getMaritimeNetworkStatus());

  const [form, setForm] = useState({
    taxon_group: 'Sea turtle',
    event_type: 'Entangled animal',
    condition_status: 'Alive',
    number_observed: 1,
    latitude: 7.1205,
    longitude: 79.8012,
    gps_accuracy_m: 15,
    fix_quality: 'GOOD_GNSS',
    location_source: 'Satellite GNSS / Manual Pin',
    gps_locked_at: new Date().toISOString(),
    notes: '',
    pollution_net: false,
    pollution_oil: false,
    pollution_plastic: false,
  });

  const geo = validateSriLankaMaritimeCoords(form.latitude, form.longitude);
  const acc = classifyGnssAccuracy(form.gps_accuracy_m);

  const refreshPending = async () => {
    const items = await getAllQueuedReports();
    const pending = items.filter(
      (i) => i.beacon_status !== 'synced' || (i.photo_data_url && i.media_status !== 'synced')
    ).length;
    setPendingCount(pending);
  };

  useEffect(() => {
    refreshPending();
    const onNet = async () => {
      const updated = getMaritimeNetworkStatus();
      setNetStatus(updated);
      if (updated.online) {
        await flushMaritimeSyncQueue({ forceMedia: false });
        await refreshPending();
      }
    };
    window.addEventListener('online', onNet);
    window.addEventListener('offline', onNet);
    return () => {
      window.removeEventListener('online', onNet);
      window.removeEventListener('offline', onNet);
    };
  }, []);

  const handleSelectLanguage = (code) => {
    setLanguage(code);
    setLanguageConfirmed(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLockGps = async () => {
    setGnssLocking(true);
    setGnssError('');
    try {
      const fix = await acquireMaritimeGNSSFix(null, { maxDurationMs: 8000, targetAccuracyM: 15 });
      setForm((prev) => ({
        ...prev,
        latitude: fix.latitude,
        longitude: fix.longitude,
        gps_accuracy_m: fix.gps_accuracy_m,
        fix_quality: fix.fix_quality,
        location_source: fix.location_source,
        gps_locked_at: fix.gps_locked_at,
      }));
      setExifDriftAlert(null);
    } catch (err) {
      setGnssError(err.message);
    } finally {
      setGnssLocking(false);
    }
  };

  const handlePhotoPick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressMarinePhoto(file, 1280, 0.72);
      setPhotoPayload(compressed);
      if (compressed.exif?.hasGps) {
        const drift = haversineKm(form.latitude, form.longitude, compressed.exif.latitude, compressed.exif.longitude);
        if (drift > 0.5) {
          setExifDriftAlert({
            driftKm: Number(drift.toFixed(2)),
            lat: compressed.exif.latitude,
            lon: compressed.exif.longitude,
            capturedAt: compressed.exif.captured_at,
          });
        } else {
          setExifDriftAlert(null);
        }
      }
    } catch (err) {
      alert('Photo read failed: ' + err.message);
    }
  };

  const useExifLocation = () => {
    if (!exifDriftAlert) return;
    setForm((prev) => ({
      ...prev,
      latitude: exifDriftAlert.lat,
      longitude: exifDriftAlert.lon,
      gps_accuracy_m: 15,
      location_source: 'Restored from Photo EXIF Sea GPS',
      gps_locked_at: exifDriftAlert.capturedAt || prev.gps_locked_at,
    }));
    setExifDriftAlert(null);
  };

  const appendQuickNote = (chipText) => {
    setForm((prev) => {
      const existing = prev.notes.trim();
      if (existing.includes(chipText)) return prev;
      return {
        ...prev,
        notes: existing ? `${existing}; ${chipText}` : chipText,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!geo.valid) {
      setGnssError(geo.message);
      return;
    }

    setSubmitting(true);
    const clientUuid = generateClientUuid();
    const sms = encodeSmsBeaconPacket({ ...form, client_uuid: clientUuid });

    let record = {
      client_uuid: clientUuid,
      created_at: new Date().toISOString(),
      observed_at: form.gps_locked_at,
      gps_locked_at: form.gps_locked_at,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      gps_accuracy_m: Number(form.gps_accuracy_m) || 15,
      fix_quality: form.fix_quality,
      location_source: form.location_source,
      maritime_zone: geo.zone,
      distance_to_coast_km: geo.distanceKm ?? 0,
      province: geo.province,
      district: geo.district,
      location_name: `${geo.distanceKm} km ${geo.bearingFromShore} of ${geo.nearestAnchor}`,
      event_type: form.event_type,
      taxon_group: form.taxon_group,
      condition_status: form.condition_status,
      number_observed: form.number_observed,
      pollution_net: form.pollution_net,
      pollution_oil: form.pollution_oil,
      pollution_plastic: form.pollution_plastic,
      notes: form.notes,
      reporter_language: language,
      reporter_user_id: user?.user_id || user?.sub || null,
      photo_data_url: photoPayload?.dataUrl || null,
      photo_filename: photoPayload?.fileName || null,
      photo_kb: photoPayload?.compressedKb || null,
      photo_exif: photoPayload?.exif || null,
      sms_packet: sms.packet,
      sms_uri: sms.smsUri,
      beacon_status: 'queued',
      media_status: photoPayload ? 'deferred_for_harbour' : 'none',
    };

    await saveQueuedReport(record);

    try {
      if (netStatus.online) {
        const beaconRes = await fetch('/api/reports/beacon', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify({
            client_uuid: record.client_uuid,
            observed_at: record.observed_at,
            gps_locked_at: record.gps_locked_at,
            latitude: record.latitude,
            longitude: record.longitude,
            gps_accuracy_m: record.gps_accuracy_m,
            fix_quality: record.fix_quality,
            location_source: record.location_source,
            maritime_zone: record.maritime_zone,
            distance_to_coast_km: record.distance_to_coast_km,
            province: record.province,
            district: record.district,
            location_name: record.location_name,
            event_type: record.event_type,
            taxon_group: record.taxon_group,
            condition_status: record.condition_status,
            number_observed: record.number_observed,
            pollution_net: record.pollution_net,
            pollution_oil: record.pollution_oil,
            pollution_plastic: record.pollution_plastic,
            notes: record.notes,
            has_deferred_media: Boolean(record.photo_data_url),
            reporter_user_id: record.reporter_user_id,
          }),
        });
        const data = await beaconRes.json();
        if (beaconRes.ok && data.success) {
          record = {
            ...record,
            beacon_status: 'synced',
            server_incident_id: data.incident_id,
            server_report_id: data.report_id,
          };
          await saveQueuedReport(record);

          if (record.photo_data_url && !netStatus.shouldDeferPhotos) {
            record = await syncMediaPhase(record);
          }
          if (onReportSubmitted) onReportSubmitted();
        }
      }
    } catch {
      // Safely stored in IndexedDB for auto-retry
    } finally {
      await refreshPending();
      setReceipt(record);
      setPhotoPayload(null);
      setSubmitting(false);
    }
  };

  const handleSyncPending = async () => {
    setSyncingPending(true);
    try {
      await flushMaritimeSyncQueue({ forceMedia: true });
      await refreshPending();
      if (onReportSubmitted) onReportSubmitted();
    } finally {
      setSyncingPending(false);
    }
  };

  // =========================================================================
  // STEP 0: CLEAN TRILINGUAL LANGUAGE PREFERENCE SELECTOR
  // =========================================================================
  if (!languageConfirmed) {
    return (
      <div className="max-w-lg mx-auto py-4 sm:py-10 miis-view-enter">
        <div className="bg-[#041E2D] border border-white/15 rounded-2xl p-6 sm:p-9 space-y-6">
          <div className="text-center space-y-2.5">
            <div className="inline-flex items-center gap-2 text-xs text-[#F5A623] font-medium">
              <Globe className="w-4 h-4" />
              <span>{t('repLangGateBadge')}</span>
            </div>

            <div className="space-y-1 pt-1">
              <h1 className="text-xl sm:text-2xl font-normal text-white">
                Select Your Preferred Language
              </h1>
              <p className="text-base sm:text-lg text-white/90 font-normal">
                ඔබ කැමති භාෂාව තෝරන්න
              </p>
              <p className="text-sm sm:text-base text-white/80 font-normal">
                உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கவும்
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {LANGUAGE_CHOICES.map((opt) => {
              const isCurrent = language === opt.code;
              return (
                <button
                  key={opt.code}
                  type="button"
                  onClick={() => handleSelectLanguage(opt.code)}
                  className={`group w-full text-left p-4 sm:p-5 rounded-xl border transition-all duration-300 flex items-center justify-between gap-4 ${
                    isCurrent
                      ? 'bg-[#021520] border-[#F5A623]'
                      : 'bg-[#021520]/80 border-white/15 hover:border-[#F5A623]/75'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 transition-colors ${
                        isCurrent
                          ? 'bg-[#F5A623] text-[#021520]'
                          : 'bg-white/10 text-white group-hover:bg-[#F5A623] group-hover:text-[#021520]'
                      }`}
                    >
                      {opt.badge}
                    </div>
                    <div className="min-w-0">
                      <div className="text-base font-medium text-white">{opt.nativeName}</div>
                      <div className="text-xs text-white/65 leading-snug mt-0.5">{opt.sub}</div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#F5A623] shrink-0 transition-transform group-hover:translate-x-1" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const taxa = [
    { key: 'Sea turtle', icon: '🐢', label: t('taxonTurtle') },
    { key: 'Dolphin', icon: '🐬', label: t('taxonDolphin') },
    { key: 'Whale', icon: '🐋', label: t('taxonWhale') },
    { key: 'Dugong', icon: '🦭', label: t('taxonDugong') },
    { key: 'Fish', icon: '🐟', label: t('taxonFish') },
    { key: 'Not animal-related', icon: '🛢️', label: t('taxonPollution') },
  ];

  const events = [
    { key: 'Live stranded animal', label: t('evLiveStranded') },
    { key: 'Entangled animal', label: t('evEntangled') },
    { key: 'Dead animal', label: t('evDead') },
    { key: 'Injured animal', label: t('evInjured') },
    { key: 'Oil pollution', label: t('evOil') },
    { key: 'Ghost net', label: t('evGhostNet') },
  ];

  const conditions = [
    { key: 'Alive', label: t('condAlive') },
    { key: 'Entangled', label: t('condEntangled') },
    { key: 'Injured', label: t('condInjured') },
    { key: 'Dead', label: t('condDead') },
  ];

  const quickNotes = [
    t('repQuickNote1'),
    t('repQuickNote2'),
    t('repQuickNote3'),
    t('repQuickNote4'),
    t('repQuickNote5'),
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4 miis-view-enter">
      {/* Clean Guided Language Strip */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#041E2D] border border-white/15 px-4 py-2.5 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-white/90 font-medium">
          <Globe className="w-4 h-4 text-[#F5A623] shrink-0" />
          <span>{t('repActiveLangBadge')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { code: 'en', label: 'EN' },
            { code: 'si', label: 'සිංහල' },
            { code: 'ta', label: 'தமிழ்' },
          ].map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                language === l.code
                  ? 'bg-[#F5A623] text-[#021520] font-semibold'
                  : 'bg-[#021520] text-white/75 border border-white/15 hover:border-white/40'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Slim Safety Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#041E2D]/70 border border-white/10 px-4 py-2.5 rounded-xl text-xs">
        <div className="text-white/75 leading-relaxed">
          <span className="text-[#F5A623] font-medium">{t('repSafetyBadge')}</span> • {t('repSafetyNote')}
        </div>
        {pendingCount > 0 && (
          <button
            type="button"
            disabled={syncingPending || !netStatus.online}
            onClick={handleSyncPending}
            className="flex items-center gap-1.5 bg-[#F5A623] text-[#021520] font-semibold px-3 py-1 rounded-full text-[11px]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingPending ? 'animate-spin' : ''}`} />
            <span>{t('repSyncQueued')} ({pendingCount})</span>
          </button>
        )}
      </div>

      {!netStatus.online && (
        <div className="bg-amber-950/40 border border-amber-500/40 text-amber-200 px-4 py-2.5 rounded-xl text-xs flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-[#F5A623] shrink-0" />
          <span>{t('repOfflineBanner')}</span>
        </div>
      )}

      {/* RECEIPT VIEW */}
      {receipt ? (
        <div className="bg-[#041E2D] border border-white/15 p-6 sm:p-8 rounded-2xl space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-lg font-medium text-white">
                {receipt.beacon_status === 'synced' ? t('repReceiptSyncedTitle') : t('repReceiptOfflineTitle')}
              </h2>
              <p className="text-xs text-white/70 mt-0.5">
                {receipt.beacon_status === 'synced'
                  ? `${t('repReceiptSyncedSub')} ${receipt.server_incident_id} • ${receipt.district} ${t('repReceiptCoast')} (${receipt.latitude.toFixed(4)}, ${receipt.longitude.toFixed(4)})`
                  : t('repReceiptOfflineSub')}
              </p>
            </div>
          </div>

          {receipt.media_status === 'deferred_for_harbour' && (
            <div className="text-xs bg-[#021520] border border-white/15 text-white/80 p-3 rounded-xl flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-[#F5A623] shrink-0" />
              <span>{t('repReceiptMediaDeferred')} ({receipt.photo_kb} KB)</span>
            </div>
          )}

          {receipt.beacon_status !== 'synced' && (
            <a
              href={receipt.sms_uri}
              className="flex items-center justify-center gap-2 w-full bg-[#F5A623] text-[#021520] font-semibold py-3 rounded-full text-xs"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{t('repSendSmsBtn')} ({receipt.sms_packet.length} {t('repChars')})</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => setReceipt(null)}
            className="w-full bg-[#F5A623] hover:bg-[#fbba45] text-[#021520] font-semibold py-3 rounded-full text-xs transition-colors"
          >
            {t('repAnotherBtn')}
          </button>
        </div>
      ) : (
        /* CLEAN GUIDED TRILINGUAL FORM */
        <form onSubmit={handleSubmit} className="bg-[#041E2D] border border-white/15 p-5 sm:p-7 rounded-2xl space-y-6">
          {/* STEP 1: LOCATION */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-sm font-medium text-white">{t('repStep1Title')}</label>
              <button
                type="button"
                disabled={gnssLocking}
                onClick={handleLockGps}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#F5A623] hover:bg-[#fbba45] text-[#021520] font-semibold px-4 py-2 rounded-full text-xs transition-colors"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>{gnssLocking ? t('repLockingGps') : t('repLockGpsBtn')}</span>
              </button>
            </div>

            <div className="flex items-start gap-2 text-xs text-white/70 bg-[#021520] border border-white/10 rounded-xl px-3.5 py-2.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#F5A623] shrink-0 mt-0.5" />
              <span>{t('repStep1Help')}</span>
            </div>

            {gnssError && (
              <div className="text-xs text-red-300 bg-red-950/40 border border-red-500/40 p-2.5 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{gnssError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-[11px] text-white/55 mb-1">{t('repLatLabel')}</span>
                <input
                  type="number"
                  step="0.00001"
                  value={form.latitude}
                  onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) })}
                  aria-label={t('repLatLabel')}
                  className="w-full bg-[#021520] border border-white/15 focus:border-[#F5A623] focus:outline-none rounded-lg px-3 py-2 font-mono text-sm sm:text-xs text-white"
                />
              </div>
              <div>
                <span className="block text-[11px] text-white/55 mb-1">{t('repLonLabel')}</span>
                <input
                  type="number"
                  step="0.00001"
                  value={form.longitude}
                  onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) })}
                  aria-label={t('repLonLabel')}
                  className="w-full bg-[#021520] border border-white/15 focus:border-[#F5A623] focus:outline-none rounded-lg px-3 py-2 font-mono text-sm sm:text-xs text-white"
                />
              </div>
            </div>

            <div className={`text-xs px-3 py-2 rounded-lg border ${geo.valid ? 'bg-[#021520] border-white/15 text-white/80' : 'bg-red-950/50 border-red-500/40 text-red-200'}`}>
              {geo.valid ? `${geo.district} (${geo.province}) • ${geo.zone} • ${acc.label}` : geo.message}
            </div>
          </div>

          {/* STEP 2: OBSERVATION */}
          <div className="space-y-3 pt-5 border-t border-white/10">
            <label className="text-sm font-medium text-white block">{t('repStep2Title')}</label>
            <div className="flex items-start gap-2 text-xs text-white/70 bg-[#021520] border border-white/10 rounded-xl px-3.5 py-2.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#F5A623] shrink-0 mt-0.5" />
              <span>{t('repStep2Help')}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {taxa.map((tx) => (
                <button
                  type="button"
                  key={tx.key}
                  onClick={() => setForm({ ...form, taxon_group: tx.key })}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-medium flex flex-col items-center gap-1 text-center transition-colors ${
                    form.taxon_group === tx.key
                      ? 'bg-[#F5A623]/15 border-[#F5A623] text-white'
                      : 'bg-[#021520] border-white/10 text-white/75 hover:border-white/30'
                  }`}
                >
                  <span className="text-lg">{tx.icon}</span>
                  <span>{tx.label}</span>
                </button>
              ))}
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-white/60 block">{t('repEventSubLabel')}</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {events.map((ev) => (
                  <button
                    type="button"
                    key={ev.key}
                    onClick={() => setForm({ ...form, event_type: ev.key })}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-medium text-left transition-colors ${
                      form.event_type === ev.key
                        ? 'bg-[#F5A623]/15 border-[#F5A623] text-white'
                        : 'bg-[#021520] border-white/10 text-white/75 hover:border-white/30'
                    }`}
                  >
                    {ev.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-white/60 block">{t('repCondSubLabel')}</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-center">
                {conditions.map((c) => (
                  <button
                    type="button"
                    key={c.key}
                    onClick={() => setForm({ ...form, condition_status: c.key })}
                    className={`py-2.5 px-2 rounded-xl border text-xs font-medium transition-colors ${
                      form.condition_status === c.key
                        ? 'bg-[#F5A623]/15 border-[#F5A623] text-white'
                        : 'bg-[#021520] border-white/10 text-white/75 hover:border-white/30'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
                <div className="col-span-2 sm:col-span-1 flex items-center justify-between sm:justify-center gap-2 bg-[#021520] border border-white/15 rounded-xl px-3 sm:px-2 py-2">
                  <span className="text-xs text-white/60 sm:hidden">{t('repCountLabel')}:</span>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={form.number_observed}
                    onChange={(e) => setForm({ ...form, number_observed: parseInt(e.target.value, 10) || 1 })}
                    aria-label={t('repCountLabel')}
                    className="w-20 sm:w-full bg-transparent text-right sm:text-center font-mono text-sm sm:text-xs text-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* STEP 3: PHOTO & GUIDED QUICK NOTES */}
          <div className="space-y-3 pt-5 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-sm font-medium text-white">{t('repStep3Title')}</label>
              <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handlePhotoPick} className="hidden" />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-[#021520] hover:border-white/50 text-white border border-white/25 px-4 py-2 rounded-full text-xs font-medium transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-[#F5A623]" />
                <span>{photoPayload ? `${t('repPhotoReady')} (${photoPayload.compressedKb} KB)` : t('repPhotoBtn')}</span>
              </button>
            </div>

            <div className="flex items-start gap-2 text-xs text-white/70 bg-[#021520] border border-white/10 rounded-xl px-3.5 py-2.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#F5A623] shrink-0 mt-0.5" />
              <span>{t('repStep3Help')}</span>
            </div>

            {exifDriftAlert && (
              <div className="bg-amber-950/40 border border-amber-400/50 p-3 rounded-xl text-xs text-amber-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>
                  {t('repExifPrompt')} <strong>{exifDriftAlert.driftKm}</strong> {t('repExifPromptEnd')}
                </span>
                <button type="button" onClick={useExifLocation} className="bg-[#F5A623] text-[#021520] font-semibold px-3 py-1.5 rounded-full shrink-0">
                  {t('repUsePhotoGps')}
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-white/60">
                <Sparkles className="w-3 h-3 text-[#F5A623]" />
                <span>{t('repQuickNotesLabel')}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {quickNotes.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => appendQuickNote(chip)}
                    className="text-[11px] bg-[#021520] hover:border-[#F5A623] border border-white/15 text-white/80 hover:text-white px-3 py-1.5 rounded-full transition-colors text-left"
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={2}
              placeholder={t('repNotesPlaceholder')}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full bg-[#021520] border border-white/15 focus:border-[#F5A623] focus:outline-none rounded-xl px-3.5 py-2.5 text-sm sm:text-xs text-white"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !geo.valid}
            className="w-full flex items-center justify-center gap-2 bg-[#F5A623] hover:bg-[#fbba45] disabled:opacity-40 text-[#021520] font-semibold py-3.5 rounded-full text-sm transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>{submitting ? t('repSubmittingBtn') : t('repSubmitBtn')}</span>
          </button>
        </form>
      )}
    </div>
  );
}
