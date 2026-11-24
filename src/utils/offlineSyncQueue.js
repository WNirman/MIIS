/**
 * MIIS Two-Phase Decoupled Maritime Offline Sync Queue (IndexedDB)
 * ================================================================
 * Solves the #1 failure mode of citizen-science apps at sea:
 *   - Phase 1 (Geo-Beacon): Ultra-lightweight JSON (<500 bytes) containing
 *     idempotent client_uuid, GNSS coordinates, accuracy, capture timestamp,
 *     auto-resolved district/province, and incident codes. Transmits instantly
 *     even on marginal 2G/GPRS offshore coverage.
 *   - Phase 2 (Deferred Photo Media): High-resolution evidence photos (with
 *     preserved EXIF GPS/timestamp) stay safely in IndexedDB and auto-upload
 *     when returning to harbour 4G/Wi-Fi — never blocking or losing GPS fixes!
 */

import { getMaritimeNetworkStatus } from './maritimeGeo';

const DB_NAME = 'miis_maritime_offline_v1';
const DB_VERSION = 1;
const STORE_NAME = 'pending_reports';
const LS_FALLBACK_KEY = 'miis_maritime_queue_fallback';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'client_uuid' });
        store.createIndex('beacon_status', 'beacon_status', { unique: false });
        store.createIndex('media_status', 'media_status', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function generateClientUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `miis-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export async function saveQueuedReport(record) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
      tx.oncomplete = () => resolve(record);
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const list = JSON.parse(localStorage.getItem(LS_FALLBACK_KEY) || '[]');
    const idx = list.findIndex((r) => r.client_uuid === record.client_uuid);
    if (idx >= 0) list[idx] = record;
    else list.unshift(record);
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(list.slice(0, 30)));
    return record;
  }
}

export async function getAllQueuedReports() {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).getAll();
      req.onsuccess = () => {
        const items = req.result || [];
        items.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return JSON.parse(localStorage.getItem(LS_FALLBACK_KEY) || '[]');
  }
}

export async function deleteQueuedReport(clientUuid) {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(clientUuid);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    const list = JSON.parse(localStorage.getItem(LS_FALLBACK_KEY) || '[]').filter(
      (r) => r.client_uuid !== clientUuid
    );
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(list));
    return true;
  }
}

/**
 * Fetch helper with sea-resilient timeout so weak cellular links never hang UI.
 */
async function fetchWithTimeout(url, options, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Phase 1: Transmit tiny Geo-Beacon (<500 bytes) to /api/reports/beacon
 */
export async function syncBeaconPhase(record) {
  const beaconPayload = {
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
    species_guess: record.species_guess,
    condition_status: record.condition_status,
    number_observed: record.number_observed,
    pollution_oil: record.pollution_oil,
    pollution_plastic: record.pollution_plastic,
    pollution_nurdles: record.pollution_nurdles,
    pollution_net: record.pollution_net,
    pollution_chemical_smell: record.pollution_chemical_smell,
    injury_visible: record.injury_visible,
    notes: record.notes,
    has_deferred_media: Boolean(record.photo_data_url),
    reporter_role: record.reporter_role || 'Fisher / Sea Observer',
    vessel_id: record.vessel_id || '',
  };

  const payloadBytes = new Blob([JSON.stringify(beaconPayload)]).size;

  const res = await fetchWithTimeout(
    '/api/reports/beacon',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(beaconPayload),
    },
    8000
  );

  if (!res.ok) {
    throw new Error(`Beacon HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Beacon sync rejected');
  }

  const updated = {
    ...record,
    beacon_status: 'synced',
    beacon_bytes: payloadBytes,
    beacon_synced_at: new Date().toISOString(),
    server_report_id: data.report_id,
    server_incident_id: data.incident_id,
    points_earned: data.points_earned || 15,
    ai_triage: data.ai_triage || null,
    last_error: null,
  };
  await saveQueuedReport(updated);
  return updated;
}

/**
 * Phase 2: Transmit deferred compressed photo + preserved EXIF metadata
 * to /api/reports/:clientUuid/media once vessel has harbour 4G/Wi-Fi.
 */
export async function syncMediaPhase(record) {
  if (!record.photo_data_url) {
    const updated = { ...record, media_status: 'none' };
    await saveQueuedReport(updated);
    return updated;
  }

  const res = await fetchWithTimeout(
    `/api/reports/${encodeURIComponent(record.client_uuid)}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_uuid: record.client_uuid,
        photo_data_url: record.photo_data_url,
        photo_filename: record.photo_filename || 'sea_capture.jpg',
        photo_kb: record.photo_kb || null,
        exif_metadata: record.photo_exif || null,
      }),
    },
    20000
  );

  if (!res.ok) {
    throw new Error(`Media HTTP ${res.status}`);
  }
  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Media upload rejected');
  }

  const updated = {
    ...record,
    media_status: 'synced',
    media_synced_at: new Date().toISOString(),
    exif_drift_km: data.exif_drift_km ?? null,
    points_earned: (record.points_earned || 15) + (data.bonus_points || 10),
    last_error: null,
  };
  await saveQueuedReport(updated);
  return updated;
}

/**
 * Smart Two-Phase Flush:
 *  - Always attempts Phase 1 (tiny Geo-Beacon) whenever online (even on 2G!).
 *  - Attempts Phase 2 (Deferred Photo) ONLY if `forceMedia === true` OR network
 *    is not a low-bandwidth sea link (i.e., harbour 3G/4G/Wi-Fi).
 */
export async function flushMaritimeSyncQueue({ forceMedia = false, simulateOffline = false } = {}) {
  const net = getMaritimeNetworkStatus();
  const items = await getAllQueuedReports();
  const results = { beaconsSynced: 0, mediaSynced: 0, stillQueued: 0, errors: [] };

  if (simulateOffline || !net.online) {
    results.stillQueued = items.filter(
      (i) => i.beacon_status !== 'synced' || (i.media_status && i.media_status !== 'synced' && i.media_status !== 'none')
    ).length;
    return results;
  }

  for (let item of items) {
    try {
      if (item.beacon_status !== 'synced') {
        item = await syncBeaconPhase(item);
        results.beaconsSynced += 1;
      }

      const hasPendingPhoto = item.photo_data_url && item.media_status !== 'synced';
      if (item.beacon_status === 'synced' && hasPendingPhoto) {
        if (forceMedia || !net.shouldDeferPhotos) {
          item = await syncMediaPhase(item);
          results.mediaSynced += 1;
        } else {
          results.stillQueued += 1;
        }
      }
    } catch (err) {
      results.errors.push(`${item.client_uuid.slice(0, 8)}: ${err.message}`);
      await saveQueuedReport({ ...item, last_error: err.message });
      results.stillQueued += 1;
    }
  }

  return results;
}
