/**
 * MIIS Multi-Channel 2G Offshore GSM SMS Gateway Router
 * ======================================================
 * Receives compact <130-char MIIS1 SMS beacons sent by coastal fishers operating
 * 10–35 km offshore where mobile data drops out but 2G GSM voice/SMS persists.
 *
 * Supported zero-cost & carrier-grade Sri Lanka ingestion channels:
 *   1. POST /api/reports/sms-ingest             — Direct JSON / App Simulator
 *   2. POST /api/sms/webhook/android-forwarder  — Free Android SMS Forwarder app (Dialog/Mobitel SIM)
 *   3. POST /api/sms/webhook/twilio             — Cloud SMS Webhook (Twilio / Dialog Ideamart / Mobitel)
 *   4. POST /api/sms/webhook/sim800l            — Local Raspberry Pi / USB SIM800L GSM Modem Bridge
 */

import express from 'express';
import { getBeaconByClientUuid, insertMaritimeBeacon, insertIncident, insertReward } from './db.js';

const router = express.Router();

// Authoritative Sri Lanka Coastal Anchors (14 Coastal Districts) for server-side SMS reverse geocoding
const SL_COASTAL_ANCHORS = [
  { name: 'Colombo / Galle Face', district: 'Colombo', province: 'Western', lat: 6.927, lon: 79.845 },
  { name: 'Mount Lavinia / Moratuwa', district: 'Colombo', province: 'Western', lat: 6.815, lon: 79.870 },
  { name: 'Wattala / Preethipura / Pamunugama', district: 'Gampaha', province: 'Western', lat: 7.055, lon: 79.852 },
  { name: 'Kepungoda / Negombo', district: 'Gampaha', province: 'Western', lat: 7.185, lon: 79.832 },
  { name: 'Panadura / Wadduwa', district: 'Kalutara', province: 'Western', lat: 6.688, lon: 79.914 },
  { name: 'Kalutara / Beruwala / Aluthgama', district: 'Kalutara', province: 'Western', lat: 6.510, lon: 79.976 },
  { name: 'Wennappuwa / Chilaw', district: 'Puttalam', province: 'North Western', lat: 7.495, lon: 79.808 },
  { name: 'Mundalama / Kalpitiya / Kudiramalai', district: 'Puttalam', province: 'North Western', lat: 8.180, lon: 79.720 },
  { name: 'Mannar Island / Vankalai', district: 'Mannar', province: 'Northern', lat: 8.980, lon: 79.885 },
  { name: 'Valaipadu / Poonakary', district: 'Kilinochchi', province: 'Northern', lat: 9.470, lon: 80.080 },
  { name: 'Delft / Kayts / Jaffna Coast', district: 'Jaffna', province: 'Northern', lat: 9.640, lon: 79.860 },
  { name: 'Mullaitivu Coast', district: 'Mullaitivu', province: 'Northern', lat: 9.267, lon: 80.814 },
  { name: 'Trincomalee / Pigeon Island', district: 'Trincomalee', province: 'Eastern', lat: 8.610, lon: 81.225 },
  { name: 'Vakarai / Batticaloa / Kaluwanchikudy', district: 'Batticaloa', province: 'Eastern', lat: 7.750, lon: 81.690 },
  { name: 'Kalmunai / Pottuvil / Arugam Bay', district: 'Ampara', province: 'Eastern', lat: 7.040, lon: 81.845 },
  { name: 'Palatupana / Hambantota / Rekawa / Kudawella', district: 'Hambantota', province: 'Southern', lat: 6.124, lon: 81.119 },
  { name: 'Dikwella / Matara / Mirissa / Weligama', district: 'Matara', province: 'Southern', lat: 5.950, lon: 80.520 },
  { name: 'Ahangama / Galle / Hikkaduwa / Kosgoda / Bentota', district: 'Galle', province: 'Southern', lat: 6.160, lon: 80.105 },
];

const EVT_DEC = {
  DEAD: 'Dead animal',
  LIVE: 'Live stranded animal',
  INJ: 'Injured animal',
  ENT: 'Entangled animal',
  WASH: 'Washed-ashore animal',
  FKIL: 'Fish kill',
  CORL: 'Coral bleaching',
  OIL: 'Oil pollution',
  CHEM: 'Chemical pollution',
  PLAS: 'Plastic/nurdle pollution',
  NET: 'Ghost net',
  UNUS: 'Unusual coastal event',
  OTH: 'Other',
};

const TAX_DEC = {
  TRT: 'Sea turtle',
  DLP: 'Dolphin',
  WHL: 'Whale',
  DUG: 'Dugong',
  SHK: 'Shark',
  RAY: 'Ray',
  FSH: 'Fish',
  BRD: 'Seabird',
  CRL: 'Coral/reef',
  MIX: 'Mixed animals',
  UNK: 'Unknown',
  ENV: 'Not animal-related',
};

const COND_DEC = {
  A: 'Alive',
  D: 'Dead',
  I: 'Injured',
  E: 'Entangled',
  X: 'Decomposed',
  S: 'Skeleton/remains',
  W: 'Washed ashore',
};

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function resolveSriLankaAnchor(lat, lon) {
  let nearest = SL_COASTAL_ANCHORS[0];
  let minKm = Infinity;
  for (const a of SL_COASTAL_ANCHORS) {
    const d = haversineKm(lat, lon, a.lat, a.lon);
    if (d < minKm) {
      minKm = d;
      nearest = a;
    }
  }
  const distKm = Number(minKm.toFixed(2));
  const zone =
    distKm > 22.2
      ? 'Offshore EEZ (>12 NM)'
      : distKm > 3.0
      ? 'Nearshore Fishing Sea (0–12 NM)'
      : 'Coastal / Beach Shoreline';
  return { ...nearest, distance_to_coast_km: distKm, maritime_zone: zone };
}

function verifyWebhookSecret(req) {
  const configured = process.env.MIIS_SMS_WEBHOOK_SECRET;
  if (!configured) return true; // Open in local dev when secret not configured
  const supplied = req.headers['x-miis-sms-secret'] || req.query.secret || req.body?.secret;
  return supplied === configured;
}

/**
 * Core MIIS1 Compact SMS Parser & Database Ingestion Pipeline.
 * Extracts the first MIIS1|... line even if carrier/forwarder prepends extra text.
 */
export function ingestCompactSmsBeacon({ rawMessage, senderMsisdn = '', channel = 'gsm_sms_fallback' }) {
  const text = String(rawMessage || '').trim();
  const match = text.match(/MIIS1\|[^\r\n\s]+/i);
  if (!match) {
    return { ok: false, status: 400, error: 'No valid MIIS1|... compact beacon found in SMS body.' };
  }

  const packet = match[0].trim();
  const parts = packet.split('|');
  if (parts.length < 9) {
    return { ok: false, status: 400, error: 'Incomplete MIIS1 compact SMS fields (expected >= 9 pipe-delimited tokens).' };
  }

  const [, shortId, latLon, accStr, tsStr, evtCode, taxCode, condCode, qtyStr, flagStr = 'F0'] = parts;
  const [latRaw, lonRaw] = (latLon || '').split(',');
  const lat = Number(latRaw);
  const lon = Number(lonRaw);

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < 4.5 || lat > 10.6 || lon < 78.2 || lon > 83.4) {
    return {
      ok: false,
      status: 400,
      error: `SMS coordinates (${latRaw}, ${lonRaw}) outside Sri Lanka Maritime EEZ bounds (4.5-10.6N, 78.2-83.4E).`,
    };
  }

  const clientUuid = `sms-${shortId.toUpperCase()}`;
  const existing = getBeaconByClientUuid(clientUuid);
  if (existing) {
    return {
      ok: true,
      deduplicated: true,
      client_uuid: clientUuid,
      incident_id: existing.incident_id,
      report_id: existing.report_id,
      district: existing.district,
      province: existing.province,
      message: 'SMS beacon already ingested (idempotent duplicate).',
    };
  }

  const accM = parseInt(accStr.replace(/^A/i, ''), 10) || 25;
  const qty = Math.max(1, parseInt(qtyStr.replace(/^Q/i, ''), 10) || 1);
  const observedAt = /^\d{10}Z$/i.test(tsStr)
    ? `20${tsStr.slice(0, 2)}-${tsStr.slice(2, 4)}-${tsStr.slice(4, 6)}T${tsStr.slice(6, 8)}:${tsStr.slice(8, 10)}:00Z`
    : new Date().toISOString();

  const eventType = EVT_DEC[evtCode?.toUpperCase()] || 'Other';
  const taxonGroup = TAX_DEC[taxCode?.toUpperCase()] || 'Unknown';
  const conditionStatus = COND_DEC[condCode?.toUpperCase()] || 'Unknown';
  const anchor = resolveSriLankaAnchor(lat, lon);
  const incidentId = `INC-SMS-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const reportId = `SMS-REP-${Date.now()}`;
  const nowIso = new Date().toISOString();
  const isUrgent =
    conditionStatus === 'Alive' ||
    conditionStatus === 'Entangled' ||
    eventType === 'Oil pollution' ||
    taxonGroup === 'Dugong';

  const hazards = [];
  const fUp = flagStr.toUpperCase();
  if (fUp.includes('N')) hazards.push('Fishing net/gear');
  if (fUp.includes('O')) hazards.push('Oil slick');
  if (fUp.includes('P')) hazards.push('Plastic debris');
  if (fUp.includes('U')) hazards.push('Plastic nurdles');
  if (fUp.includes('C')) hazards.push('Chemical odor');
  if (fUp.includes('W')) hazards.push('Visible wound');

  const locationLabel = `${anchor.distance_to_coast_km} km off ${anchor.name} (2G SMS GNSS)`;

  insertMaritimeBeacon({
    client_uuid: clientUuid,
    incident_id: incidentId,
    report_id: reportId,
    ingest_channel: channel,
    observed_at: observedAt,
    gps_locked_at: observedAt,
    beacon_received_at: nowIso,
    media_received_at: null,
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lon.toFixed(6)),
    gps_accuracy_m: accM,
    fix_quality: accM <= 15 ? 'EXCELLENT_GNSS' : accM <= 50 ? 'GOOD_GNSS' : 'DEGRADED_FIX',
    location_source: `Offshore Hardware GNSS via ${channel}`,
    maritime_zone: anchor.maritime_zone,
    distance_to_coast_km: anchor.distance_to_coast_km,
    province: anchor.province,
    district: anchor.district,
    location_name: locationLabel,
    event_type: eventType,
    taxon_group: taxonGroup,
    condition_status: conditionStatus,
    number_observed: qty,
    reporter_role: 'Fisher (2G SMS Beacon)',
    vessel_id: senderMsisdn || '',
    beacon_status: 'synced',
    media_status: 'none',
    exif_latitude: null,
    exif_longitude: null,
    exif_captured_at: null,
    exif_drift_km: null,
    photo_filename: null,
    photo_kb: null,
    photo_data_url: null,
    sms_packet: packet,
  });

  // Also publish straight into miis_incidents so SMS offshore alerts appear live on the Map & Validation Console
  insertIncident({
    incident_id: incidentId,
    event_date: observedAt.split('T')[0],
    event_date_precision: 'Exact (GNSS UTC via 2G SMS)',
    report_date: nowIso.split('T')[0],
    country: 'Sri Lanka',
    province: anchor.province,
    district: anchor.district,
    ds_division: '',
    nearest_town: anchor.name,
    location_name: locationLabel,
    original_location_text: packet,
    site_type: anchor.maritime_zone,
    latitude: Number(lat.toFixed(6)),
    longitude: Number(lon.toFixed(6)),
    spatial_precision: accM <= 50 ? 'exact_gnss' : 'degraded_gnss',
    coordinate_confidence: accM <= 15 ? 'high' : accM <= 50 ? 'medium' : 'low',
    coordinate_source: `2G GSM SMS Fallback (${channel})`,
    gps_accuracy_m: accM,
    uncertainty_radius_km: Number((accM / 1000).toFixed(3)),
    distance_to_coast_km: anchor.distance_to_coast_km,
    location_validation_status: 'EEZ Geofence Verified (SMS)',
    event_type: eventType,
    taxon_group: taxonGroup,
    species_common: taxonGroup,
    species_scientific: 'Pending visual/expert ID (SMS beacon)',
    condition_status: conditionStatus,
    number_dead: conditionStatus === 'Dead' ? qty : 0,
    number_alive: conditionStatus === 'Alive' ? qty : 0,
    quantity_text: `${qty} observed via 2G SMS`,
    number_precision: 'exact',
    cause_category: hazards.length ? hazards.join(', ') : 'Offshore Maritime Sighting',
    suspected_cause: hazards.length ? hazards.join('; ') : 'Reported via offshore 2G SMS beacon',
    cause_certainty: 'Medium',
    urgency_level: isUrgent ? 'critical' : 'high',
    response_status: '2G SMS Alert Received — Awaiting Harbour Photo/Validation',
    confidence_score: accM <= 50 ? 88 : 74,
    confidence_class: accM <= 50 ? 'High spatial confidence' : 'Medium spatial confidence',
    validation_level: 'Level 1',
    validation_status: '2G SMS GNSS Locked',
    duplicate_group_id: null,
    public_visibility: 'Public',
    sensitive_location: taxonGroup === 'Sea turtle' || taxonGroup === 'Dugong' ? 1 : 0,
    notes: `Ingested via ${channel}${senderMsisdn ? ` (${senderMsisdn})` : ''} | Packet: ${packet}${hazards.length ? ` | Hazards: ${hazards.join(', ')}` : ''}`,
    created_at: nowIso,
    updated_at: nowIso,
  });

  insertReward({
    reward_id: `REW-SMS-${Date.now()}`,
    user_id: senderMsisdn || `FISHER-${shortId}`,
    report_id: reportId,
    reward_type: '2G Offshore SMS Beacon',
    points: 25,
    badge_name: 'MIIS Offshore Radio Sentinel',
    reason: `Transmitted verified 2G SMS GNSS fix (±${accM}m) off ${anchor.district}.`,
  });

  return {
    ok: true,
    deduplicated: false,
    message: `2G SMS beacon decoded (${anchor.district}, ${anchor.province}) and plotted on Live Map.`,
    client_uuid: clientUuid,
    incident_id: incidentId,
    report_id: reportId,
    decoded: {
      latitude: Number(lat.toFixed(6)),
      longitude: Number(lon.toFixed(6)),
      gps_accuracy_m: accM,
      observed_at: observedAt,
      district: anchor.district,
      province: anchor.province,
      maritime_zone: anchor.maritime_zone,
      distance_to_coast_km: anchor.distance_to_coast_km,
      event_type: eventType,
      taxon_group: taxonGroup,
      condition_status: conditionStatus,
      quantity: qty,
      hazards,
      flags: flagStr,
    },
  };
}

// 1. Direct JSON SMS Ingest (used by MIIS app simulator & internal tools)
router.post('/api/reports/sms-ingest', (req, res) => {
  const result = ingestCompactSmsBeacon({
    rawMessage: req.body?.sms_packet || req.body?.message,
    senderMsisdn: req.body?.sender_msisdn || req.body?.from || '',
    channel: 'direct_sms_ingest',
  });
  if (!result.ok) return res.status(result.status || 400).json({ success: false, error: result.error });
  res.json({ success: true, ...result });
});

// 2. Free Sri Lanka Harbour Setup: Android "SMS Forwarder" App Webhook (Dialog/Mobitel SIM)
router.post('/api/sms/webhook/android-forwarder', (req, res) => {
  if (!verifyWebhookSecret(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized SMS forwarder secret.' });
  }
  const msg = req.body?.message || req.body?.text || req.body?.msg || req.body?.content || '';
  const from = req.body?.from || req.body?.sender || req.body?.phone || '';
  const result = ingestCompactSmsBeacon({
    rawMessage: msg,
    senderMsisdn: from,
    channel: 'android_sms_forwarder',
  });
  if (!result.ok) return res.status(result.status || 400).json({ success: false, error: result.error });
  res.json({ success: true, ...result });
});

// 3. Cloud Carrier / Twilio Webhook (returns TwiML confirmation SMS back to fisher!)
router.post('/api/sms/webhook/twilio', (req, res) => {
  if (!verifyWebhookSecret(req)) {
    return res.status(401).send('<Response><Message>MIIS Auth Error</Message></Response>');
  }
  const msg = req.body?.Body || req.body?.message || '';
  const from = req.body?.From || req.body?.sender || '';
  const result = ingestCompactSmsBeacon({
    rawMessage: msg,
    senderMsisdn: from,
    channel: 'twilio_carrier_sms',
  });

  if (!result.ok) {
    res.type('text/xml').status(200).send(
      `<?xml version="1.0" encoding="UTF-8"?><Response><Message>MIIS Notice: ${result.error}</Message></Response>`
    );
    return;
  }

  const replyText = result.deduplicated
    ? `MIIS: Report ${result.incident_id} already received. Thank you!`
    : `MIIS OK: ${result.incident_id} logged (${result.decoded.district} Coast, +/-${result.decoded.gps_accuracy_m}m). Upload photo at harbour.`;

  res.type('text/xml').status(200).send(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${replyText}</Message></Response>`
  );
});

// 4. Local Raspberry Pi / USB SIM800L GSM Modem Bridge Webhook
router.post('/api/sms/webhook/sim800l', (req, res) => {
  if (!verifyWebhookSecret(req)) {
    return res.status(401).json({ success: false, error: 'Unauthorized SIM800L bridge secret.' });
  }
  const result = ingestCompactSmsBeacon({
    rawMessage: req.body?.sms_packet || req.body?.body || '',
    senderMsisdn: req.body?.sender_msisdn || '',
    channel: 'sim800l_gsm_modem',
  });
  if (!result.ok) return res.status(result.status || 400).json({ success: false, error: result.error });
  res.json({ success: true, ...result });
});

export default router;
