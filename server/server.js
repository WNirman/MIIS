import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { 
  initDatabase, 
  clearDatabase,
  getAllIncidents, 
  insertIncident, 
  updateIncidentStatus,
  getAllSources,
  insertSource,
  getAllCitizenReports,
  insertCitizenReport,
  getAllRewards,
  insertReward,
  getBeaconByClientUuid,
  getAllMaritimeBeacons,
  insertMaritimeBeacon,
  attachMediaToBeacon,
  getUserByEmail,
  getUserById,
  createUser,
  logSecurityAudit,
  getRecentAuditLogs,
  getBeaconsByReporter
} from './db.js';
import fs from 'fs';
import { processWithGemini } from './ai_extractor.js';
import { calculateTurtleConfidenceScore, SRI_LANKA_SEA_TURTLE_SPECIES } from './species_data.js';
import smsGatewayRouter from './sms_gateway.js';
import {
  attachUser,
  requireAuth,
  requireRole,
  hashPassword,
  verifyPassword,
  signToken,
  redactIncidentForRole
} from './auth.js';

import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '6mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(attachUser);

// ============================================================================
// PORTAL AUTHENTICATION & ROLE-BASED ACCESS CONTROL (RBAC) ENDPOINTS
// Public reporting NEVER requires login; sensitive data & validation DO!
// ============================================================================
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = getUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ success: false, error: 'Invalid portal email or password.' });
    }
    const token = signToken(user);
    logSecurityAudit({
      user,
      action: 'PORTAL_LOGIN',
      resource: '/api/auth/login',
      details: `Authenticated ${user.role} portal session`,
      ip: req.ip,
    });
    const { password_hash, ...safeUser } = user;
    res.json({ success: true, token, user: safeUser });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, full_name, organization = '', district = 'Colombo' } = req.body || {};
    if (!email || !password || !full_name || String(password).length < 6) {
      return res.status(400).json({ success: false, error: 'Full name, email, and a password of at least 6 characters are required.' });
    }
    if (getUserByEmail(email)) {
      return res.status(409).json({ success: false, error: 'An account with this email already exists.' });
    }
    // Self-registration is strictly scoped to 'reporter' role (validator/admin elevation requires institutional approval)
    const created = createUser({
      user_id: `USR-REP-${Date.now()}`,
      email,
      full_name: String(full_name).trim(),
      organization: String(organization || 'Coastal Citizen Observer').trim(),
      role: 'reporter',
      district: String(district || 'Colombo').trim(),
      password_hash: hashPassword(password),
      verified_badge: 0,
    });
    const token = signToken(created);
    logSecurityAudit({
      user: created,
      action: 'REPORTER_REGISTER',
      resource: '/api/auth/register',
      details: `Registered coastal reporter (${created.district})`,
      ip: req.ip,
    });
    res.json({ success: true, token, user: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const fresh = getUserById(req.user.sub);
  res.json({ success: true, user: fresh || req.user });
});

app.get('/api/portal/my-reports', requireAuth, (req, res) => {
  try {
    const beacons = getBeaconsByReporter(req.user.sub);
    res.json({ success: true, count: beacons.length, data: beacons });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/audit-logs', requireRole('validator', 'admin'), (req, res) => {
  try {
    const logs = getRecentAuditLogs(40);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Protected full unredacted national dataset export (Validators & Admins only!)
app.get('/api/ministry-dataset', requireRole('validator', 'admin'), (req, res) => {
  try {
    const filePath = path.join(__dirname, '..', 'src', 'data', 'ministry_mortality_clean.json');
    const dataset = fs.existsSync(filePath) ? JSON.parse(fs.readFileSync(filePath, 'utf8')) : { records: [] };
    logSecurityAudit({
      user: req.user,
      action: 'SENSITIVE_DATASET_ACCESS',
      resource: '/api/ministry-dataset',
      details: `Accessed ${dataset.records?.length || 0} unredacted national records`,
      ip: req.ip,
    });
    res.json({ success: true, access_tier: req.user.role, ...dataset });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Mount multi-channel 2G GSM SMS gateway (Direct, Android SMS Forwarder, Twilio/Carrier, SIM800L)
app.use(smsGatewayRouter);

// Initialize SQLite database
initDatabase();

// Server-side Sri Lanka Maritime Geofence & District-Province Integrity Map
const SL_DISTRICT_TO_PROVINCE = {
  Colombo: 'Western',
  Gampaha: 'Western',
  Kalutara: 'Western',
  Puttalam: 'North Western',
  Mannar: 'Northern',
  Kilinochchi: 'Northern',
  Jaffna: 'Northern',
  Mullaitivu: 'Northern',
  Trincomalee: 'Eastern',
  Batticaloa: 'Eastern',
  Ampara: 'Eastern',
  Hambantota: 'Southern',
  Matara: 'Southern',
  Galle: 'Southern',
};

function haversineKmServer(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function validateMaritimeLatLon(lat, lon) {
  const nLat = Number(lat);
  const nLon = Number(lon);
  if (!Number.isFinite(nLat) || !Number.isFinite(nLon)) return { valid: false, reason: 'Non-numeric coordinates' };
  if (nLat < 4.5 || nLat > 10.6 || nLon < 78.2 || nLon > 83.4) {
    return { valid: false, reason: 'Coordinates outside Sri Lanka Maritime EEZ bounding box (4.5-10.6N, 78.2-83.4E)' };
  }
  return { valid: true, latitude: Number(nLat.toFixed(6)), longitude: Number(nLon.toFixed(6)) };
}

// Turtle Species AI & Computer Vision Classification Endpoint
app.post('/api/ai/classify-turtle', (req, res) => {
  try {
    const { image_url, notes, taxon_group, species_guess } = req.body;
    const pythonScript = path.join(__dirname, 'models', 'turtle_vision_service.py');
    const hintText = `${taxon_group || ''} ${species_guess || ''} ${notes || ''}`;
    const imgParam = image_url || '';

    execFile('python', [pythonScript, imgParam, hintText], { encoding: 'utf-8' }, (error, stdout, stderr) => {
      if (error || !stdout) {
        // Fallback to JS evaluator
        const evaluation = calculateTurtleConfidenceScore(req.body);
        return res.json({
          success: true,
          engine: "Rule & Taxonomy Fallback",
          predicted_species: evaluation.predicted_species,
          confidence_score: evaluation.confidence_score,
          evidence_points: evaluation.evidence_points
        });
      }

      try {
        const parsed = JSON.parse(stdout);
        res.json({
          success: true,
          ...parsed
        });
      } catch (parseErr) {
        const evaluation = calculateTurtleConfidenceScore(req.body);
        res.json({
          success: true,
          engine: "Taxonomy Engine",
          predicted_species: evaluation.predicted_species,
          confidence_score: evaluation.confidence_score
        });
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Turtle Species AI Verification & Confidence Assistant Endpoint
app.post('/api/ai/turtle-verify', async (req, res) => {
  try {
    const observationData = req.body;
    const evaluation = calculateTurtleConfidenceScore(observationData);
    res.json({
      success: true,
      species_catalog: SRI_LANKA_SEA_TURTLE_SPECIES,
      predicted_species: evaluation.predicted_species,
      confidence_score: evaluation.confidence_score,
      evidence_points: evaluation.evidence_points,
      morphological_key: evaluation.morphological_key
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Clear database endpoint (Admin only)
app.post('/api/clear', requireRole('admin'), (req, res) => {
  try {
    clearDatabase();
    logSecurityAudit({ user: req.user, action: 'DB_CLEAR', resource: '/api/clear', ip: req.ip });
    res.json({ success: true, message: 'Database cleared completely.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1. Get incidents — STRICT CONFIDENTIALITY: Validator / Admin access ONLY!
// Public visitors and reporters NEVER receive other observers' records or confidential data.
app.get('/api/incidents', (req, res) => {
  try {
    const isAuthorizedValidator = req.user && (req.user.role === 'validator' || req.user.role === 'admin');
    if (!isAuthorizedValidator) {
      return res.json({
        success: true,
        access_tier: req.user?.role || 'public',
        protection_active: true,
        confidential_locked: true,
        count: 0,
        data: [],
        message: 'Incident records are confidential and restricted to verified Validators.',
      });
    }
    const filters = {
      taxon: req.query.taxon || 'All',
      urgency: req.query.urgency || 'All',
      validation_status: req.query.validation_status || 'All'
    };
    const rawIncidents = getAllIncidents(filters);
    const incidents = rawIncidents.map((inc) => redactIncidentForRole(inc, req.user));
    res.json({
      success: true,
      access_tier: req.user.role,
      protection_active: false,
      confidential_locked: false,
      count: incidents.length,
      data: incidents
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Submit Citizen Report
app.post('/api/reports', async (req, res) => {
  try {
    const reportData = req.body;
    const reportId = `REP-${Date.now()}`;
    const userId = reportData.user_id || `USR-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const textContext = `${reportData.event_type} - ${reportData.taxon_group}. ${reportData.notes || ''} at ${reportData.location_name || 'Sri Lanka Coast'}`;
    const aiPrediction = await processWithGemini(textContext);

    let points = 5;
    if (reportData.photo_urls && reportData.photo_urls.length > 0) points += 10;
    if (reportData.latitude && reportData.photo_urls && reportData.condition_status) points += 15;

    const newReport = {
      report_id: reportId,
      user_id: userId,
      submitted_at: new Date().toISOString(),
      observed_at: reportData.observed_at || new Date().toISOString(),
      event_type: reportData.event_type,
      taxon_group: reportData.taxon_group,
      species_guess: reportData.species_guess || aiPrediction.species_common,
      condition_status: reportData.condition_status,
      quantity_range: reportData.quantity_range || '1',
      number_observed: reportData.number_observed || 1,
      latitude: reportData.latitude || aiPrediction.latitude,
      longitude: reportData.longitude || aiPrediction.longitude,
      gps_accuracy_m: reportData.gps_accuracy_m || 10,
      location_name: reportData.location_name || aiPrediction.location_name,
      photo_urls: JSON.stringify(reportData.photo_urls || []),
      video_urls: JSON.stringify(reportData.video_urls || []),
      notes: reportData.notes || '',
      pollution_oil: reportData.pollution_oil ? 1 : 0,
      pollution_plastic: reportData.pollution_plastic ? 1 : 0,
      pollution_nurdles: reportData.pollution_nurdles ? 1 : 0,
      pollution_net: reportData.pollution_net ? 1 : 0,
      pollution_chemical_smell: reportData.pollution_chemical_smell ? 1 : 0,
      injury_visible: reportData.injury_visible ? 1 : 0,
      ai_taxon_prediction: aiPrediction.taxon_group,
      ai_event_prediction: aiPrediction.event_type,
      ai_confidence: aiPrediction.confidence_score,
      duplicate_risk: 0.1,
      review_status: 'Under Review',
      expert_validation_status: 'Level 1 (AI Extracted)',
      final_incident_id: null,
      points_awarded: points,
      safety_warning_shown: 1,
      public_visibility: 'public'
    };

    insertCitizenReport(newReport);

    const incidentId = `INC-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newIncident = {
      incident_id: incidentId,
      event_date: new Date().toISOString().split('T')[0],
      event_date_precision: 'Exact',
      report_date: new Date().toISOString().split('T')[0],
      country: 'Sri Lanka',
      province: aiPrediction.province || 'Western Province',
      district: aiPrediction.district || 'Colombo',
      ds_division: '',
      nearest_town: aiPrediction.nearest_town || 'Colombo',
      location_name: reportData.location_name || aiPrediction.location_name,
      original_location_text: reportData.notes || '',
      site_type: 'Coastal Beach',
      latitude: reportData.latitude || aiPrediction.latitude,
      longitude: reportData.longitude || aiPrediction.longitude,
      spatial_precision: 'exact_site',
      coordinate_confidence: 'high',
      coordinate_source: 'Citizen Mobile/Web GPS',
      gps_accuracy_m: 10,
      uncertainty_radius_km: 0.1,
      distance_to_coast_km: 0.05,
      location_validation_status: 'Pending Verification',
      event_type: reportData.event_type,
      taxon_group: reportData.taxon_group,
      species_common: reportData.species_guess || aiPrediction.species_common,
      species_scientific: aiPrediction.species_scientific,
      condition_status: reportData.condition_status,
      number_dead: reportData.condition_status === 'Dead' ? (reportData.number_observed || 1) : 0,
      number_alive: reportData.condition_status === 'Alive' ? (reportData.number_observed || 1) : 0,
      quantity_text: `${reportData.number_observed || 1} observed`,
      number_precision: 'exact',
      cause_category: aiPrediction.cause_category,
      suspected_cause: aiPrediction.suspected_cause,
      cause_certainty: 'Medium',
      urgency_level: aiPrediction.urgency_level,
      response_status: 'Under Triage',
      confidence_score: aiPrediction.confidence_score,
      confidence_class: aiPrediction.confidence_score >= 80 ? 'High confidence' : 'Medium confidence',
      validation_level: 'Level 1',
      validation_status: 'AI Extracted',
      duplicate_group_id: null,
      public_visibility: 'Public',
      sensitive_location: reportData.taxon_group === 'Sea turtle' ? 1 : 0,
      notes: reportData.notes || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    insertIncident(newIncident);

    insertReward({
      reward_id: `REW-${Date.now()}`,
      user_id: userId,
      report_id: reportId,
      reward_type: 'Report Submission',
      points: points,
      badge_name: 'MIIS Beach Observer',
      reason: `Submitted incident report with verified GPS and AI triage checks (+${points} points).`
    });

    res.json({
      success: true,
      message: 'Citizen report submitted successfully.',
      report_id: reportId,
      incident_id: incidentId,
      points_earned: points,
      ai_triage: aiPrediction
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2B. Offshore Maritime Phase-1 Geo-Beacon Endpoint (Idempotent, <500 bytes, 2G-resilient)
app.post('/api/reports/beacon', (req, res) => {
  try {
    const b = req.body || {};
    const clientUuid = b.client_uuid || `miis-${Date.now()}`;

    // Strict idempotency: flaky sea connections retrying the same beacon NEVER duplicate records
    const existing = getBeaconByClientUuid(clientUuid);
    if (existing) {
      return res.json({
        success: true,
        deduplicated: true,
        message: 'Geo-beacon already synchronized (idempotent retry).',
        client_uuid: existing.client_uuid,
        report_id: existing.report_id,
        incident_id: existing.incident_id,
        media_status: existing.media_status,
        points_earned: 20,
      });
    }

    const coordCheck = validateMaritimeLatLon(b.latitude, b.longitude);
    if (!coordCheck.valid) {
      return res.status(400).json({ success: false, error: coordCheck.reason });
    }

    // Enforce Sri Lanka authoritative District -> Province integrity at ingest time
    const cleanDistrict = SL_DISTRICT_TO_PROVINCE[b.district] ? b.district : (b.district || 'Colombo');
    const authProvince = SL_DISTRICT_TO_PROVINCE[cleanDistrict] || b.province || 'Western';

    const reportId = `SEA-REP-${Date.now()}`;
    const incidentId = `INC-SEA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();
    const observedAt = b.observed_at || b.gps_locked_at || nowIso;
    const accM = Number(b.gps_accuracy_m) || 25;
    const isUrgent = b.condition_status === 'Alive' || b.condition_status === 'Entangled' || b.event_type === 'Oil pollution' || b.taxon_group === 'Dugong';

    const beaconRecord = {
      client_uuid: clientUuid,
      incident_id: incidentId,
      report_id: reportId,
      ingest_channel: b.ingest_channel || 'http_beacon',
      observed_at: observedAt,
      gps_locked_at: b.gps_locked_at || observedAt,
      beacon_received_at: nowIso,
      media_received_at: null,
      latitude: coordCheck.latitude,
      longitude: coordCheck.longitude,
      gps_accuracy_m: accM,
      fix_quality: b.fix_quality || (accM <= 15 ? 'EXCELLENT_GNSS' : accM <= 50 ? 'GOOD_GNSS' : 'DEGRADED_FIX'),
      location_source: b.location_source || 'Hardware GNSS (Offshore Beacon)',
      maritime_zone: b.maritime_zone || 'Coastal / Nearshore Sea',
      distance_to_coast_km: Number(b.distance_to_coast_km) || 0,
      province: authProvince,
      district: cleanDistrict,
      location_name: b.location_name || `${cleanDistrict} Coast (${coordCheck.latitude}, ${coordCheck.longitude})`,
      event_type: b.event_type || 'Washed-ashore animal',
      taxon_group: b.taxon_group || 'Sea turtle',
      condition_status: b.condition_status || 'Dead',
      number_observed: parseInt(b.number_observed, 10) || 1,
      reporter_role: b.reporter_role || 'Fisher / Sea Observer',
      vessel_id: b.vessel_id || '',
      beacon_status: 'synced',
      media_status: b.has_deferred_media ? 'deferred_for_harbour' : 'none',
      exif_latitude: null,
      exif_longitude: null,
      exif_captured_at: null,
      exif_drift_km: null,
      photo_filename: null,
      photo_kb: null,
      photo_data_url: null,
      sms_packet: b.sms_packet || null,
      reporter_user_id: req.user?.sub || b.reporter_user_id || null,
    };

    insertMaritimeBeacon(beaconRecord);

    insertCitizenReport({
      report_id: reportId,
      user_id: b.vessel_id ? `VESSEL-${b.vessel_id}` : `FISHER-${clientUuid.slice(0, 6).toUpperCase()}`,
      submitted_at: nowIso,
      observed_at: observedAt,
      event_type: beaconRecord.event_type,
      taxon_group: beaconRecord.taxon_group,
      species_guess: b.species_guess || beaconRecord.taxon_group,
      condition_status: beaconRecord.condition_status,
      quantity_range: String(beaconRecord.number_observed),
      number_observed: beaconRecord.number_observed,
      latitude: coordCheck.latitude,
      longitude: coordCheck.longitude,
      gps_accuracy_m: accM,
      location_name: beaconRecord.location_name,
      photo_urls: JSON.stringify([]),
      video_urls: JSON.stringify([]),
      notes: `${b.notes || ''} [Sea Beacon Sync | GNSS ±${accM}m | Zone: ${beaconRecord.maritime_zone}]`.trim(),
      pollution_oil: b.pollution_oil ? 1 : 0,
      pollution_plastic: b.pollution_plastic ? 1 : 0,
      pollution_nurdles: b.pollution_nurdles ? 1 : 0,
      pollution_net: b.pollution_net ? 1 : 0,
      pollution_chemical_smell: b.pollution_chemical_smell ? 1 : 0,
      injury_visible: b.injury_visible ? 1 : 0,
      ai_taxon_prediction: beaconRecord.taxon_group,
      ai_event_prediction: beaconRecord.event_type,
      ai_confidence: accM <= 50 ? 92 : 78,
      duplicate_risk: 0.0,
      review_status: b.has_deferred_media ? 'Geo-Synced (Awaiting Harbour Photo)' : 'Under Review',
      expert_validation_status: 'Level 1 (Offshore GNSS Beacon)',
      final_incident_id: incidentId,
      points_awarded: 20,
      safety_warning_shown: 1,
      public_visibility: 'public',
    });

    insertIncident({
      incident_id: incidentId,
      event_date: observedAt.split('T')[0],
      event_date_precision: 'Exact (GNSS UTC)',
      report_date: nowIso.split('T')[0],
      country: 'Sri Lanka',
      province: authProvince,
      district: cleanDistrict,
      ds_division: '',
      nearest_town: beaconRecord.location_name,
      location_name: beaconRecord.location_name,
      original_location_text: b.notes || `Fisher beacon (${beaconRecord.maritime_zone})`,
      site_type: beaconRecord.maritime_zone,
      latitude: coordCheck.latitude,
      longitude: coordCheck.longitude,
      spatial_precision: accM <= 50 ? 'exact_gnss' : 'degraded_gnss',
      coordinate_confidence: accM <= 15 ? 'high' : accM <= 50 ? 'medium' : 'low',
      coordinate_source: beaconRecord.location_source,
      gps_accuracy_m: accM,
      uncertainty_radius_km: Number((accM / 1000).toFixed(3)),
      distance_to_coast_km: beaconRecord.distance_to_coast_km,
      location_validation_status: 'EEZ Geofence Verified',
      event_type: beaconRecord.event_type,
      taxon_group: beaconRecord.taxon_group,
      species_common: b.species_guess || beaconRecord.taxon_group,
      species_scientific: b.species_scientific || 'Pending visual/expert ID',
      condition_status: beaconRecord.condition_status,
      number_dead: beaconRecord.condition_status === 'Dead' ? beaconRecord.number_observed : 0,
      number_alive: beaconRecord.condition_status === 'Alive' ? beaconRecord.number_observed : 0,
      quantity_text: `${beaconRecord.number_observed} observed`,
      number_precision: 'exact',
      cause_category: b.pollution_net ? 'Fisheries Interaction / Entanglement' : b.pollution_oil ? 'Oil / Chemical Pollution' : 'Maritime Observation',
      suspected_cause: b.pollution_net ? 'Fishing gear / ghost net' : b.notes || 'Reported via Offshore Fisher Beacon',
      cause_certainty: 'Medium',
      urgency_level: isUrgent ? 'critical' : 'high',
      response_status: b.has_deferred_media ? 'Geo-Locked (Media Pending)' : 'Under Triage',
      confidence_score: accM <= 50 ? 90 : 75,
      confidence_class: accM <= 50 ? 'High spatial confidence' : 'Medium spatial confidence',
      validation_level: 'Level 1',
      validation_status: 'Offshore GNSS Locked',
      duplicate_group_id: null,
      public_visibility: 'Public',
      sensitive_location: beaconRecord.taxon_group === 'Sea turtle' || beaconRecord.taxon_group === 'Dugong' ? 1 : 0,
      notes: `Offshore Beacon [${clientUuid.slice(0, 8)}] | Observed: ${observedAt} | GNSS ±${accM}m (${beaconRecord.fix_quality}) | ${b.notes || ''}`.trim(),
      created_at: nowIso,
      updated_at: nowIso,
    });

    insertReward({
      reward_id: `REW-SEA-${Date.now()}`,
      user_id: b.vessel_id || `FISHER-${clientUuid.slice(0, 6).toUpperCase()}`,
      report_id: reportId,
      reward_type: 'Offshore Geo-Beacon',
      points: 20,
      badge_name: 'MIIS Sea Sentinel',
      reason: `Locked verified GNSS (±${accM}m) in ${cleanDistrict} (${beaconRecord.maritime_zone}).`,
    });

    res.json({
      success: true,
      deduplicated: false,
      message: 'Phase 1 Geo-Beacon received and georeferenced immediately.',
      client_uuid: clientUuid,
      report_id: reportId,
      incident_id: incidentId,
      province: authProvince,
      district: cleanDistrict,
      media_status: beaconRecord.media_status,
      points_earned: 20,
      ai_triage: {
        taxon_group: beaconRecord.taxon_group,
        confidence_score: accM <= 50 ? 92 : 78,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2C. Offshore Maritime Phase-2 Deferred Harbour Photo Attachment + EXIF Drift Audit
app.post('/api/reports/:clientUuid/media', (req, res) => {
  try {
    const { clientUuid } = req.params;
    const beacon = getBeaconByClientUuid(clientUuid);
    if (!beacon) {
      return res.status(404).json({ success: false, error: 'Parent Geo-Beacon not found. Sync Phase 1 beacon first.' });
    }

    const { photo_data_url, photo_filename, photo_kb, exif_metadata } = req.body || {};
    if (!photo_data_url) {
      return res.status(400).json({ success: false, error: 'No photo payload supplied.' });
    }

    let exifDriftKm = null;
    const exifLat = exif_metadata?.latitude ?? null;
    const exifLon = exif_metadata?.longitude ?? null;
    if (exifLat !== null && exifLon !== null && beacon.latitude && beacon.longitude) {
      exifDriftKm = Number(haversineKmServer(beacon.latitude, beacon.longitude, exifLat, exifLon).toFixed(2));
    }

    attachMediaToBeacon(clientUuid, {
      media_received_at: new Date().toISOString(),
      exif_latitude: exifLat,
      exif_longitude: exifLon,
      exif_captured_at: exif_metadata?.captured_at || null,
      exif_drift_km: exifDriftKm,
      photo_filename: photo_filename || 'harbour_sync.jpg',
      photo_kb: photo_kb || Math.round((photo_data_url.length * 3) / 4 / 1024),
      photo_data_url: photo_data_url.slice(0, 1200000),
    });

    res.json({
      success: true,
      message: 'Phase 2 deferred photo attached to offshore beacon.',
      client_uuid: clientUuid,
      incident_id: beacon.incident_id,
      media_status: 'synced',
      exif_drift_km: exifDriftKm,
      drift_warning: exifDriftKm !== null && exifDriftKm > 0.5,
      bonus_points: 10,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2D. Multi-channel 2G GSM SMS routes mounted via server/sms_gateway.js
// (POST /api/reports/sms-ingest, /api/sms/webhook/android-forwarder, /api/sms/webhook/twilio, /api/sms/webhook/sim800l)

// 2E. List Maritime Beacons Telemetry (Validators/Admins only — contains exact GPS & vessel IDs)
app.get('/api/reports/beacons', requireRole('validator', 'admin'), (req, res) => {
  try {
    const beacons = getAllMaritimeBeacons();
    logSecurityAudit({ user: req.user, action: 'VIEW_OFFSHORE_BEACONS', resource: '/api/reports/beacons', details: `Viewed ${beacons.length} maritime beacons`, ip: req.ip });
    res.json({ success: true, count: beacons.length, data: beacons });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Protected national statistical trends & QA summary (Validators & Admins ONLY!)
app.get('/api/ministry-trends', requireRole('validator', 'admin'), (req, res) => {
  try {
    const trendPath = path.join(__dirname, '..', 'analysis', 'outputs', 'trend_summary.json');
    const fallbackTrendPath = path.join(__dirname, '..', 'src', 'data', 'ministry_trends_summary.json');
    const qaPath = path.join(__dirname, '..', 'data', 'processed', 'quality_summary.json');
    const trends = fs.existsSync(trendPath)
      ? JSON.parse(fs.readFileSync(trendPath, 'utf8'))
      : (fs.existsSync(fallbackTrendPath) ? JSON.parse(fs.readFileSync(fallbackTrendPath, 'utf8')) : null);
    const quality = fs.existsSync(qaPath) ? JSON.parse(fs.readFileSync(qaPath, 'utf8')) : null;
    logSecurityAudit({
      user: req.user,
      action: 'CONFIDENTIAL_TRENDS_ACCESS',
      resource: '/api/ministry-trends',
      details: 'Accessed confidential national trends summary',
      ip: req.ip,
    });
    res.json({ success: true, trends, quality });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Multi-Platform Social Media Harvester (Validators / Admins only)
app.post('/api/social/harvest', requireRole('validator', 'admin'), async (req, res) => {
  try {
    const { platform = 'All', keyword = 'marine wildlife Sri Lanka' } = req.body;
    const realFetchedPosts = [];

    // 1. Genuine Meta Graph API Search (If token configured)
    const metaToken = process.env.FACEBOOK_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
    if (metaToken && (platform === 'Facebook' || platform === 'Instagram' || platform === 'All')) {
      try {
        const pageId = '1290098300852019'; // Marine Incidents Page
        const metaUrl = `https://graph.facebook.com/v19.0/${pageId}/feed?fields=id,message,created_time,full_picture&access_token=${metaToken}&limit=5`;
        const metaResp = await fetch(metaUrl);
        if (metaResp.ok) {
          const metaJson = await metaResp.json();
          if (metaJson.data && metaJson.data.length > 0) {
            for (const item of metaJson.data) {
              if (item.message) {
                realFetchedPosts.push({
                  id: `meta_${item.id}`,
                  platform: 'Meta Facebook Page',
                  user: 'Marine Incidents',
                  text: item.message,
                  created_at: item.created_time || new Date().toISOString(),
                  url: `https://facebook.com/${item.id}`,
                  image: item.full_picture || ''
                });
              }
            }
          }
        }
      } catch (metaErr) {
        console.warn('[Meta API] Live query notice:', metaErr.message);
      }
    }

    // 2. Genuine Twitter / X API Search (If token configured)
    const twitterBearer = process.env.TWITTER_BEARER_TOKEN;
    if (twitterBearer && (platform === 'Twitter' || platform === 'All')) {
      try {
        const query = encodeURIComponent(`${keyword} Sri Lanka -is:retweet`);
        const twitterUrl = `https://api.twitter.com/2/tweets/search/recent?query=${query}&tweet.fields=created_at,author_id,text&max_results=10`;
        const twResp = await fetch(twitterUrl, {
          headers: { Authorization: `Bearer ${twitterBearer}` }
        });
        if (twResp.ok) {
          const twJson = await twResp.json();
          if (twJson.data && twJson.data.length > 0) {
            for (const tweet of twJson.data) {
              realFetchedPosts.push({
                id: `tw_${tweet.id}`,
                platform: 'Twitter / X',
                user: `@user_${tweet.author_id}`,
                text: tweet.text,
                created_at: tweet.created_at || new Date().toISOString(),
                url: `https://twitter.com/i/web/status/${tweet.id}`,
                image: ''
              });
            }
          }
        }
      } catch (twErr) {
        console.warn('[Twitter API] Live query notice:', twErr.message);
      }
    }

    // If zero real posts returned from live APIs, return genuine 0 result response (NO FAKE MOCK DATA)
    if (realFetchedPosts.length === 0) {
      return res.json({
        success: true,
        count: 0,
        message: `Live ${platform} API query executed for "${keyword}". No active live posts currently matched the keyword query stream. Zero mock data generated.`,
        data: []
      });
    }

    // Process only genuine fetched posts with Gemini AI
    const processedPosts = [];
    for (const post of realFetchedPosts) {
      const aiResult = await processWithGemini(post.text);
      const incidentId = `INC-SOCIAL-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      const incidentRecord = {
        incident_id: incidentId,
        event_date: new Date(post.created_at).toISOString().split('T')[0],
        event_date_precision: 'Exact',
        report_date: new Date().toISOString().split('T')[0],
        country: 'Sri Lanka',
        province: aiResult.province || 'Western Province',
        district: aiResult.district || 'Colombo',
        ds_division: '',
        nearest_town: aiResult.nearest_town || 'Coastal Zone',
        location_name: aiResult.location_name || 'Sri Lanka Coast',
        original_location_text: post.text,
        site_type: `Live Social Media Post (${post.platform})`,
        latitude: aiResult.latitude || 6.9271,
        longitude: aiResult.longitude || 79.8612,
        spatial_precision: aiResult.spatial_precision || 'Town Level Geocoded',
        coordinate_confidence: 'medium',
        coordinate_source: `${post.platform} + Gemini AI`,
        gps_accuracy_m: 50,
        uncertainty_radius_km: 0.5,
        distance_to_coast_km: 0.05,
        location_validation_status: 'AI Geocoded',
        event_type: aiResult.event_type || 'Stranding & Animal Death',
        taxon_group: aiResult.taxon_group || 'Marine Wildlife',
        species_common: aiResult.species_common || 'Marine Specimen',
        species_scientific: aiResult.species_scientific || 'Marine fauna',
        condition_status: aiResult.condition_status || 'Dead',
        number_dead: aiResult.number_dead || 1,
        number_alive: aiResult.number_alive || 0,
        quantity_text: `1 specimen`,
        number_precision: 'exact',
        cause_category: aiResult.cause_category || 'Marine Incident',
        suspected_cause: aiResult.suspected_cause || 'Social media reported incident',
        cause_certainty: 'Medium',
        urgency_level: aiResult.urgency_level || 'medium',
        response_status: 'Social Media Alert - Pending Dispatch',
        confidence_score: aiResult.confidence_score || 80,
        confidence_class: 'Medium confidence',
        validation_level: 'Level 1',
        validation_status: 'Pending Verification',
        duplicate_group_id: null,
        public_visibility: 'Public',
        sensitive_location: post.text.toLowerCase().includes('turtle') ? 1 : 0,
        notes: `Real live post from ${post.user}: ${post.text}`,
        created_at: post.created_at,
        updated_at: new Date().toISOString()
      };

      insertIncident(incidentRecord);

      const sourceRecord = {
        source_id: post.id,
        incident_id: incidentId,
        source_type: post.platform,
        source_name: post.user,
        source_url: post.url,
        archive_url: '',
        title: `Social Report: ${aiResult.taxon_group || 'Marine Incident'}`,
        author: post.user,
        publication_date: new Date(post.created_at).toISOString().split('T')[0],
        language: 'en',
        raw_text_path: '',
        media_path: post.image || '',
        credibility_score: 85,
        evidence_sentence: aiResult.evidence_sentence || post.text,
        source_confidence: 'Medium'
      };

      insertSource(sourceRecord);
      processedPosts.push(incidentRecord);
    }

    res.json({
      success: true,
      count: processedPosts.length,
      message: `Successfully harvested and AI-triaged ${processedPosts.length} real live social media incidents!`,
      data: processedPosts
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get media sources (Validators / Admins ONLY — confidential harvested posts)
app.get('/api/sources', requireRole('validator', 'admin'), (req, res) => {
  try {
    const sources = getAllSources();
    res.json({ success: true, count: sources.length, data: sources });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Expert Reviewer Validation Endpoint (STRICTLY Validator / Admin RBAC)
app.post('/api/validate/:id', requireRole('validator', 'admin'), (req, res) => {
  try {
    const { validation_status, validation_level, confidence_score } = req.body;

    updateIncidentStatus(
      req.params.id, 
      validation_status || 'Expert Verified', 
      validation_level || 'Level 3', 
      confidence_score || 95
    );

    logSecurityAudit({
      user: req.user,
      action: 'EXPERT_VALIDATE_INCIDENT',
      resource: `/api/validate/${req.params.id}`,
      details: `Set ${req.params.id} -> ${validation_status || 'Expert Verified'} (${validation_level || 'Level 3'}, ${confidence_score || 95}%)`,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: `Incident ${req.params.id} updated to status: ${validation_status} (Level ${validation_level}) by ${req.user.full_name}.`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Analytics & Indicator Stats (Validators / Admins ONLY — confidential aggregates)
app.get('/api/stats', requireRole('validator', 'admin'), (req, res) => {
  try {
    const incidents = getAllIncidents();
    const reports = getAllCitizenReports();
    const rewards = getAllRewards();
    const sources = getAllSources();

    const totalIncidents = incidents.length;
    const verifiedIncidents = incidents.filter(i => i.validation_status === 'Expert Verified' || i.validation_status === 'Officially Confirmed' || i.validation_status === 'Auto-validated').length;
    const criticalUrgent = incidents.filter(i => i.urgency_level === 'critical').length;
    const totalPointsAwarded = rewards.reduce((acc, r) => acc + (r.points || 0), 0);

    const taxonCounts = {};
    incidents.forEach(i => {
      taxonCounts[i.taxon_group] = (taxonCounts[i.taxon_group] || 0) + 1;
    });

    const districtCounts = {};
    incidents.forEach(i => {
      if (i.district) {
        districtCounts[i.district] = (districtCounts[i.district] || 0) + 1;
      }
    });

    res.json({
      success: true,
      summary: {
        totalIncidents,
        verifiedIncidents,
        criticalUrgent,
        totalReports: reports.length,
        totalSources: sources.length,
        totalPointsAwarded
      },
      taxonCounts,
      districtCounts
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` MIIS Backend REST API Server listening on port ${PORT}`);
  console.log(` Sri Lanka Marine Conservation Authority Harvester Active`);
  console.log(`=======================================================`);
});
