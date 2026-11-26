import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPassword } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IS_VERCEL = Boolean(process.env.VERCEL);

let db = null;
let isNativeSqlite = false;

try {
  const Database = (await import('better-sqlite3')).default;
  const bundledDbPath = path.join(__dirname, 'miis.db');
  let activeDbPath = bundledDbPath;
  if (IS_VERCEL) {
    // Vercel serverless filesystem is read-only outside /tmp; copy bundled SQLite DB to /tmp
    activeDbPath = path.join(os.tmpdir(), 'miis.db');
    if (!fs.existsSync(activeDbPath) && fs.existsSync(bundledDbPath)) {
      fs.copyFileSync(bundledDbPath, activeDbPath);
    }
  }
  db = new Database(activeDbPath);
  isNativeSqlite = true;
  console.log('[MIIS DB] Connected to SQLite database:', activeDbPath);
} catch (err) {
  console.warn('[MIIS DB] SQLite native module unavailable. Operating in lightweight file-backed database mode.', err.message);
}

// In-Memory / File-backed Fallback DB Store when native SQLite isn't compiled (e.g. serverless Linux)
const DATA_FILE = IS_VERCEL
  ? path.join(os.tmpdir(), 'miis_db_data.json')
  : path.join(__dirname, 'db_data.json');

let memoryData = {
  miis_incidents: [],
  miis_citizen_reports: [],
  miis_sources: [],
  miis_rewards: [],
  miis_maritime_beacons: [],
  miis_users: [],
  miis_access_audit_log: [],
};

if (fs.existsSync(DATA_FILE)) {
  try {
    memoryData = { ...memoryData, ...JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) };
  } catch (e) {
    console.error('Error loading fallback db data:', e);
  }
} else if (!isNativeSqlite) {
  // Seed initial verified incidents & sources from JSON when running in fallback mode
  try {
    const seedJsonPath = path.join(__dirname, '..', 'src', 'data', 'real_incidents_data.json');
    if (fs.existsSync(seedJsonPath)) {
      const seed = JSON.parse(fs.readFileSync(seedJsonPath, 'utf8'));
      memoryData.miis_incidents = seed.incidents || [];
      memoryData.miis_sources = seed.sources || [];
    }
  } catch {
    // Ignore optional seed error
  }
}

function saveMemoryData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(memoryData, null, 2), 'utf8');
  } catch {
    // Keep operating in-memory if filesystem is read-only
  }
}

export function initDatabase() {
  if (isNativeSqlite) {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    db.exec(schemaSql);
    // Safe additive migration for existing SQLite files
    try {
      db.exec('ALTER TABLE miis_maritime_beacons ADD COLUMN reporter_user_id TEXT');
    } catch {
      // Column already exists
    }
  }
  seedDefaultPortalUsers();
}

export function seedDefaultPortalUsers() {
  const defaults = [
    {
      user_id: 'USR-ADMIN-01',
      email: 'admin@miis.lk',
      full_name: 'Wanith Nirman',
      organization: 'MIIS National Coordinator — University of Jaffna',
      role: 'admin',
      district: 'Jaffna',
      password_hash: hashPassword('MiisAdmin#2026'),
      verified_badge: 1,
    },
    {
      user_id: 'USR-VAL-01',
      email: 'validator@miis.lk',
      full_name: 'Dr. Marine Conservation Validator',
      organization: 'DWC / NARA Scientific Validation Unit',
      role: 'validator',
      district: 'Colombo',
      password_hash: hashPassword('MiisValidator#2026'),
      verified_badge: 1,
    },
    {
      user_id: 'USR-VAL-YUHUNI',
      email: 'yuhuni@miis.lk',
      full_name: 'Yuhuni',
      organization: 'MIIS Scientific Validation Team — Sri Lanka',
      role: 'validator',
      district: 'Jaffna',
      password_hash: hashPassword('Yuhuni#MIIS2026'),
      verified_badge: 1,
    },
    {
      user_id: 'USR-VAL-GUNAKAN',
      email: 'gunakan@miis.lk',
      full_name: 'Dr. Gunakan',
      organization: 'MIIS Senior Research Validator — University of Jaffna',
      role: 'validator',
      district: 'Jaffna',
      password_hash: hashPassword('DrGunakan#MIIS2026'),
      verified_badge: 1,
    },
    {
      user_id: 'USR-REP-01',
      email: 'reporter@miis.lk',
      full_name: 'Negombo Coastal Fisher Observer',
      organization: 'Western Fisheries Citizen-Science Network',
      role: 'reporter',
      district: 'Gampaha',
      password_hash: hashPassword('MiisFisher#2026'),
      verified_badge: 1,
    },
  ];

  for (const u of defaults) {
    if (!getUserByEmail(u.email)) {
      createUser(u);
    }
  }
}

export function getUserByEmail(email) {
  const norm = String(email || '').trim().toLowerCase();
  if (isNativeSqlite) {
    return db.prepare('SELECT * FROM miis_users WHERE lower(email) = ?').get(norm) || null;
  }
  return (memoryData.miis_users || []).find((u) => u.email.toLowerCase() === norm) || null;
}

export function getUserById(userId) {
  if (isNativeSqlite) {
    return db.prepare('SELECT user_id, email, full_name, organization, role, district, verified_badge, created_at FROM miis_users WHERE user_id = ?').get(userId) || null;
  }
  const u = (memoryData.miis_users || []).find((x) => x.user_id === userId);
  if (!u) return null;
  const { password_hash, ...safe } = u;
  return safe;
}

export function createUser(user) {
  const rec = { ...user, email: user.email.trim().toLowerCase() };
  if (isNativeSqlite) {
    db.prepare(`
      INSERT INTO miis_users (user_id, email, full_name, organization, role, district, password_hash, verified_badge)
      VALUES (@user_id, @email, @full_name, @organization, @role, @district, @password_hash, @verified_badge)
    `).run(rec);
  } else {
    if (!memoryData.miis_users) memoryData.miis_users = [];
    memoryData.miis_users.push(rec);
    saveMemoryData();
  }
  const { password_hash, ...safe } = rec;
  return safe;
}

export function logSecurityAudit({ user, action, resource, details = '', ip = '' }) {
  const entry = {
    log_id: `AUD-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
    user_id: user?.sub || user?.user_id || 'ANONYMOUS',
    user_email: user?.email || 'public',
    user_role: user?.role || 'public',
    action,
    resource,
    details,
    ip_address: ip || '',
    created_at: new Date().toISOString(),
  };
  if (isNativeSqlite) {
    db.prepare(`
      INSERT INTO miis_access_audit_log (log_id, user_id, user_email, user_role, action, resource, details, ip_address, created_at)
      VALUES (@log_id, @user_id, @user_email, @user_role, @action, @resource, @details, @ip_address, @created_at)
    `).run(entry);
  } else {
    if (!memoryData.miis_access_audit_log) memoryData.miis_access_audit_log = [];
    memoryData.miis_access_audit_log.unshift(entry);
    saveMemoryData();
  }
  return entry;
}

export function getRecentAuditLogs(limit = 40) {
  if (isNativeSqlite) {
    return db.prepare('SELECT * FROM miis_access_audit_log ORDER BY created_at DESC LIMIT ?').all(limit);
  }
  return (memoryData.miis_access_audit_log || []).slice(0, limit);
}

export function getBeaconsByReporter(userId) {
  if (isNativeSqlite) {
    return db.prepare(`
      SELECT client_uuid, incident_id, report_id, ingest_channel, observed_at, beacon_received_at,
             latitude, longitude, gps_accuracy_m, maritime_zone, province, district, location_name,
             event_type, taxon_group, condition_status, number_observed, beacon_status, media_status, exif_drift_km
      FROM miis_maritime_beacons
      WHERE reporter_user_id = ?
      ORDER BY beacon_received_at DESC
    `).all(userId);
  }
  return (memoryData.miis_maritime_beacons || []).filter((b) => b.reporter_user_id === userId);
}

export function clearDatabase() {
  if (isNativeSqlite) {
    db.exec('DELETE FROM miis_incidents; DELETE FROM miis_sources; DELETE FROM miis_citizen_reports; DELETE FROM miis_rewards;');
  } else {
    memoryData = { miis_incidents: [], miis_citizen_reports: [], miis_sources: [], miis_rewards: [] };
    saveMemoryData();
  }
}

export function getAllIncidents(filters = {}) {
  if (isNativeSqlite) {
    let sql = 'SELECT * FROM miis_incidents WHERE 1=1';
    const params = [];
    if (filters.taxon && filters.taxon !== 'All') {
      sql += ' AND taxon_group = ?';
      params.push(filters.taxon);
    }
    if (filters.urgency && filters.urgency !== 'All') {
      sql += ' AND urgency_level = ?';
      params.push(filters.urgency);
    }
    if (filters.validation_status && filters.validation_status !== 'All') {
      sql += ' AND validation_status = ?';
      params.push(filters.validation_status);
    }
    sql += ' ORDER BY created_at DESC';
    return db.prepare(sql).all(...params);
  } else {
    return memoryData.miis_incidents.filter(inc => {
      if (filters.taxon && filters.taxon !== 'All' && inc.taxon_group !== filters.taxon) return false;
      if (filters.urgency && filters.urgency !== 'All' && inc.urgency_level !== filters.urgency) return false;
      if (filters.validation_status && filters.validation_status !== 'All' && inc.validation_status !== filters.validation_status) return false;
      return true;
    });
  }
}

export function insertIncident(inc) {
  if (isNativeSqlite) {
    const stmt = db.prepare(`
      INSERT INTO miis_incidents (
        incident_id, event_date, event_date_precision, report_date, country, province, district,
        ds_division, nearest_town, location_name, original_location_text, site_type, latitude, longitude,
        spatial_precision, coordinate_confidence, coordinate_source, gps_accuracy_m, uncertainty_radius_km,
        distance_to_coast_km, location_validation_status, event_type, taxon_group, species_common,
        species_scientific, condition_status, number_dead, number_alive, quantity_text, number_precision,
        cause_category, suspected_cause, cause_certainty, urgency_level, response_status, confidence_score,
        confidence_class, validation_level, validation_status, duplicate_group_id, public_visibility,
        sensitive_location, notes, created_at, updated_at
      ) VALUES (
        @incident_id, @event_date, @event_date_precision, @report_date, @country, @province, @district,
        @ds_division, @nearest_town, @location_name, @original_location_text, @site_type, @latitude, @longitude,
        @spatial_precision, @coordinate_confidence, @coordinate_source, @gps_accuracy_m, @uncertainty_radius_km,
        @distance_to_coast_km, @location_validation_status, @event_type, @taxon_group, @species_common,
        @species_scientific, @condition_status, @number_dead, @number_alive, @quantity_text, @number_precision,
        @cause_category, @suspected_cause, @cause_certainty, @urgency_level, @response_status, @confidence_score,
        @confidence_class, @validation_level, @validation_status, @duplicate_group_id, @public_visibility,
        @sensitive_location, @notes, @created_at, @updated_at
      )
    `);
    stmt.run(inc);
  } else {
    memoryData.miis_incidents.unshift(inc);
    saveMemoryData();
  }
  return inc;
}

export function updateIncidentStatus(incidentId, validationStatus, validationLevel, confidenceScore) {
  if (isNativeSqlite) {
    const stmt = db.prepare(`
      UPDATE miis_incidents 
      SET validation_status = ?, validation_level = ?, confidence_score = ?, updated_at = CURRENT_TIMESTAMP
      WHERE incident_id = ?
    `);
    stmt.run(validationStatus, validationLevel, confidenceScore, incidentId);
  } else {
    const idx = memoryData.miis_incidents.findIndex(i => i.incident_id === incidentId);
    if (idx !== -1) {
      memoryData.miis_incidents[idx].validation_status = validationStatus;
      memoryData.miis_incidents[idx].validation_level = validationLevel;
      memoryData.miis_incidents[idx].confidence_score = confidenceScore;
      memoryData.miis_incidents[idx].updated_at = new Date().toISOString();
      saveMemoryData();
    }
  }
}

export function getAllSources() {
  if (isNativeSqlite) {
    return db.prepare('SELECT * FROM miis_sources ORDER BY collection_date DESC').all();
  } else {
    return memoryData.miis_sources;
  }
}

export function insertSource(source) {
  if (isNativeSqlite) {
    const stmt = db.prepare(`
      INSERT INTO miis_sources (
        source_id, incident_id, source_type, source_name, source_url, archive_url, title, author,
        publication_date, language, raw_text_path, media_path, credibility_score, evidence_sentence, source_confidence
      ) VALUES (
        @source_id, @incident_id, @source_type, @source_name, @source_url, @archive_url, @title, @author,
        @publication_date, @language, @raw_text_path, @media_path, @credibility_score, @evidence_sentence, @source_confidence
      )
    `);
    stmt.run(source);
  } else {
    memoryData.miis_sources.unshift(source);
    saveMemoryData();
  }
}

export function insertCitizenReport(report) {
  if (isNativeSqlite) {
    const stmt = db.prepare(`
      INSERT INTO miis_citizen_reports (
        report_id, user_id, submitted_at, observed_at, event_type, taxon_group, species_guess,
        condition_status, quantity_range, number_observed, latitude, longitude, gps_accuracy_m,
        location_name, photo_urls, video_urls, notes, pollution_oil, pollution_plastic,
        pollution_nurdles, pollution_net, pollution_chemical_smell, injury_visible, ai_taxon_prediction,
        ai_event_prediction, ai_confidence, duplicate_risk, review_status, expert_validation_status,
        final_incident_id, points_awarded, safety_warning_shown, public_visibility
      ) VALUES (
        @report_id, @user_id, @submitted_at, @observed_at, @event_type, @taxon_group, @species_guess,
        @condition_status, @quantity_range, @number_observed, @latitude, @longitude, @gps_accuracy_m,
        @location_name, @photo_urls, @video_urls, @notes, @pollution_oil, @pollution_plastic,
        @pollution_nurdles, @pollution_net, @pollution_chemical_smell, @injury_visible, @ai_taxon_prediction,
        @ai_event_prediction, @ai_confidence, @duplicate_risk, @review_status, @expert_validation_status,
        @final_incident_id, @points_awarded, @safety_warning_shown, @public_visibility
      )
    `);
    stmt.run(report);
  } else {
    memoryData.miis_citizen_reports.unshift(report);
    saveMemoryData();
  }
}

export function getAllCitizenReports() {
  if (isNativeSqlite) {
    return db.prepare('SELECT * FROM miis_citizen_reports ORDER BY submitted_at DESC').all();
  } else {
    return memoryData.miis_citizen_reports;
  }
}

export function getAllRewards() {
  if (isNativeSqlite) {
    return db.prepare('SELECT * FROM miis_rewards ORDER BY awarded_at DESC').all();
  } else {
    return memoryData.miis_rewards;
  }
}

export function insertReward(reward) {
  if (isNativeSqlite) {
    const stmt = db.prepare(`
      INSERT INTO miis_rewards (reward_id, user_id, report_id, reward_type, points, badge_name, reason)
      VALUES (@reward_id, @user_id, @report_id, @reward_type, @points, @badge_name, @reason)
    `);
    stmt.run(reward);
  } else {
    memoryData.miis_rewards.unshift(reward);
    saveMemoryData();
  }
}

export function getBeaconByClientUuid(clientUuid) {
  if (isNativeSqlite) {
    return db.prepare('SELECT * FROM miis_maritime_beacons WHERE client_uuid = ?').get(clientUuid) || null;
  }
  const list = memoryData.miis_maritime_beacons || [];
  return list.find(b => b.client_uuid === clientUuid) || null;
}

export function getAllMaritimeBeacons() {
  if (isNativeSqlite) {
    return db.prepare('SELECT client_uuid, incident_id, report_id, ingest_channel, observed_at, gps_locked_at, beacon_received_at, media_received_at, latitude, longitude, gps_accuracy_m, fix_quality, location_source, maritime_zone, distance_to_coast_km, province, district, location_name, event_type, taxon_group, condition_status, number_observed, reporter_role, vessel_id, beacon_status, media_status, exif_latitude, exif_longitude, exif_drift_km, photo_filename, photo_kb FROM miis_maritime_beacons ORDER BY beacon_received_at DESC').all();
  }
  return (memoryData.miis_maritime_beacons || []).map(({ photo_data_url, ...rest }) => rest);
}

export function insertMaritimeBeacon(beacon) {
  const row = { reporter_user_id: null, ...beacon };
  if (isNativeSqlite) {
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO miis_maritime_beacons (
        client_uuid, incident_id, report_id, ingest_channel, observed_at, gps_locked_at,
        beacon_received_at, media_received_at, latitude, longitude, gps_accuracy_m,
        fix_quality, location_source, maritime_zone, distance_to_coast_km, province, district,
        location_name, event_type, taxon_group, condition_status, number_observed,
        reporter_role, vessel_id, beacon_status, media_status, exif_latitude, exif_longitude,
        exif_captured_at, exif_drift_km, photo_filename, photo_kb, photo_data_url, sms_packet, reporter_user_id
      ) VALUES (
        @client_uuid, @incident_id, @report_id, @ingest_channel, @observed_at, @gps_locked_at,
        @beacon_received_at, @media_received_at, @latitude, @longitude, @gps_accuracy_m,
        @fix_quality, @location_source, @maritime_zone, @distance_to_coast_km, @province, @district,
        @location_name, @event_type, @taxon_group, @condition_status, @number_observed,
        @reporter_role, @vessel_id, @beacon_status, @media_status, @exif_latitude, @exif_longitude,
        @exif_captured_at, @exif_drift_km, @photo_filename, @photo_kb, @photo_data_url, @sms_packet, @reporter_user_id
      )
    `);
    stmt.run(row);
  } else {
    if (!memoryData.miis_maritime_beacons) memoryData.miis_maritime_beacons = [];
    const idx = memoryData.miis_maritime_beacons.findIndex(b => b.client_uuid === row.client_uuid);
    if (idx >= 0) memoryData.miis_maritime_beacons[idx] = row;
    else memoryData.miis_maritime_beacons.unshift(row);
    saveMemoryData();
  }
  return row;
}

export function attachMediaToBeacon(clientUuid, mediaUpdate) {
  if (isNativeSqlite) {
    db.prepare(`
      UPDATE miis_maritime_beacons
      SET media_status = 'synced',
          media_received_at = @media_received_at,
          exif_latitude = @exif_latitude,
          exif_longitude = @exif_longitude,
          exif_captured_at = @exif_captured_at,
          exif_drift_km = @exif_drift_km,
          photo_filename = @photo_filename,
          photo_kb = @photo_kb,
          photo_data_url = @photo_data_url
      WHERE client_uuid = @client_uuid
    `).run({ client_uuid: clientUuid, ...mediaUpdate });

    const beacon = getBeaconByClientUuid(clientUuid);
    if (beacon?.report_id) {
      db.prepare(`UPDATE miis_citizen_reports SET photo_urls = ? WHERE report_id = ?`)
        .run(JSON.stringify([mediaUpdate.photo_filename || 'deferred_harbour_upload.jpg']), beacon.report_id);
    }
    if (beacon?.incident_id) {
      const driftNote = mediaUpdate.exif_drift_km !== null && mediaUpdate.exif_drift_km > 0.5
        ? ` [EXIF Drift Notice: photo GPS is ${mediaUpdate.exif_drift_km} km from beacon]`
        : ' [Deferred Harbour Photo Verified & Attached]';
      db.prepare(`UPDATE miis_incidents SET notes = COALESCE(notes, '') || ?, updated_at = CURRENT_TIMESTAMP WHERE incident_id = ?`)
        .run(driftNote, beacon.incident_id);
    }
    return beacon;
  } else {
    if (!memoryData.miis_maritime_beacons) memoryData.miis_maritime_beacons = [];
    const idx = memoryData.miis_maritime_beacons.findIndex(b => b.client_uuid === clientUuid);
    if (idx >= 0) {
      memoryData.miis_maritime_beacons[idx] = {
        ...memoryData.miis_maritime_beacons[idx],
        media_status: 'synced',
        ...mediaUpdate
      };
      saveMemoryData();
      return memoryData.miis_maritime_beacons[idx];
    }
    return null;
  }
}

function seedInitialData() {
  const sampleIncidents = [
    {
      incident_id: 'INC-2026-001',
      event_date: '2026-07-23',
      event_date_precision: 'Exact',
      report_date: '2026-07-23',
      country: 'Sri Lanka',
      province: 'Eastern Province',
      district: 'Trincomalee',
      ds_division: 'Town and Gravets',
      nearest_town: 'Trincomalee',
      location_name: 'Pigeon Island Marine Sanctuary',
      original_location_text: 'Live stranded humpback whale calf near Pigeon Island reef',
      site_type: 'Reef / Coastal Beach',
      latitude: 8.718,
      longitude: 81.205,
      spatial_precision: 'exact_site',
      coordinate_confidence: 'high',
      coordinate_source: 'GPS / Twitter Scraper',
      gps_accuracy_m: 10,
      uncertainty_radius_km: 0.1,
      distance_to_coast_km: 0.2,
      location_validation_status: 'Verified',
      event_type: 'Live stranded animal',
      taxon_group: 'Whale',
      species_common: 'Humpback Whale',
      species_scientific: 'Megaptera novaeangliae',
      condition_status: 'Alive',
      number_dead: 0,
      number_alive: 1,
      quantity_text: '1 juvenile',
      number_precision: 'exact',
      cause_category: 'Stranding',
      suspected_cause: 'Shallow navigational disorient',
      cause_certainty: 'Medium',
      urgency_level: 'critical',
      response_status: 'Dispatched Response Team',
      confidence_score: 92,
      confidence_class: 'High confidence',
      validation_level: 'Level 3',
      validation_status: 'Expert Verified',
      duplicate_group_id: null,
      public_visibility: 'Public',
      sensitive_location: 0,
      notes: 'Urgent rescue response dispatched by DWC Trincomalee office.',
      created_at: '2026-07-23T14:30:00Z',
      updated_at: '2026-07-23T14:35:00Z'
    },
    {
      incident_id: 'INC-2026-002',
      event_date: '2026-07-23',
      event_date_precision: 'Exact',
      report_date: '2026-07-23',
      country: 'Sri Lanka',
      province: 'Western Province',
      district: 'Colombo',
      ds_division: 'Thimbirigasyaya',
      nearest_town: 'Mount Lavinia',
      location_name: 'Mount Lavinia Beach South',
      original_location_text: 'Olive Ridley sea turtle washed ashore with monofilament fishing net',
      site_type: 'Sandy Beach',
      latitude: 6.838,
      longitude: 79.863,
      spatial_precision: 'exact_site',
      coordinate_confidence: 'high',
      coordinate_source: 'Citizen Mobile App GPS',
      gps_accuracy_m: 5,
      uncertainty_radius_km: 0.05,
      distance_to_coast_km: 0.01,
      location_validation_status: 'Verified',
      event_type: 'Entangled animal',
      taxon_group: 'Sea turtle',
      species_common: 'Olive Ridley Sea Turtle',
      species_scientific: 'Lepidochelys olivacea',
      condition_status: 'Entangled',
      number_dead: 1,
      number_alive: 0,
      quantity_text: '1 adult female',
      number_precision: 'exact',
      cause_category: 'Fisheries Interaction',
      suspected_cause: 'Ghost net entanglement',
      cause_certainty: 'High',
      urgency_level: 'high',
      response_status: 'Under Evaluation',
      confidence_score: 85,
      confidence_class: 'High confidence',
      validation_level: 'Level 2',
      validation_status: 'Auto-validated',
      duplicate_group_id: null,
      public_visibility: 'Public',
      sensitive_location: 1,
      notes: 'Location blurred on public map to protect sea turtle nesting zone.',
      created_at: '2026-07-23T10:15:00Z',
      updated_at: '2026-07-23T10:20:00Z'
    },
    {
      incident_id: 'INC-2026-003',
      event_date: '2026-07-22',
      event_date_precision: 'Exact',
      report_date: '2026-07-22',
      country: 'Sri Lanka',
      province: 'Southern Province',
      district: 'Galle',
      ds_division: 'Galle Four Gravets',
      nearest_town: 'Galle Fort',
      location_name: 'Galle Harbor Coast',
      original_location_text: 'Black oil sludge on beach, over 50 dead reef fish',
      site_type: 'Harbour / Rocky Shore',
      latitude: 6.0535,
      longitude: 80.2210,
      spatial_precision: 'nearby_site',
      coordinate_confidence: 'high',
      coordinate_source: 'Twitter Search API',
      gps_accuracy_m: 50,
      uncertainty_radius_km: 0.5,
      distance_to_coast_km: 0.02,
      location_validation_status: 'Verified',
      event_type: 'Oil pollution',
      taxon_group: 'Fish',
      species_common: 'Mixed Coastal Fish & Corals',
      species_scientific: 'Actinopterygii spp.',
      condition_status: 'Dead',
      number_dead: 55,
      number_alive: 0,
      quantity_text: '50-100 items',
      number_precision: 'range',
      cause_category: 'Chemical / Oil Spill',
      suspected_cause: 'Bunker fuel release from passing vessel',
      cause_certainty: 'High',
      urgency_level: 'critical',
      response_status: 'MEPA & Coast Guard Notified',
      confidence_score: 90,
      confidence_class: 'High confidence',
      validation_level: 'Level 3',
      validation_status: 'Expert Verified',
      duplicate_group_id: null,
      public_visibility: 'Public',
      sensitive_location: 0,
      notes: 'Marine Environment Protection Authority (MEPA) notified.',
      created_at: '2026-07-22T18:45:00Z',
      updated_at: '2026-07-22T19:00:00Z'
    }
  ];

  sampleIncidents.forEach(inc => insertIncident(inc));

  // Seed sample sources
  insertSource({
    source_id: 'src_tw_01',
    incident_id: 'INC-2026-001',
    source_type: 'Twitter / Social Media',
    source_name: 'Twitter API Search',
    source_url: 'https://x.com/CoastGuard_SL/status/1829301',
    archive_url: '',
    title: 'Live stranded humpback whale calf near Pigeon Island',
    author: '@CoastGuard_SL',
    publication_date: '2026-07-23',
    language: 'en',
    raw_text_path: '',
    media_path: '',
    credibility_score: 95,
    evidence_sentence: 'CRITICAL: Live stranded humpback whale calf spotted near Pigeon Island, Trincomalee. Coordinates ~8.718, 81.205.',
    source_confidence: 'High'
  });

  insertSource({
    source_id: 'src_tw_02',
    incident_id: 'INC-2026-003',
    source_type: 'Twitter / Social Media',
    source_name: 'Twitter API Search',
    source_url: 'https://x.com/SouthernDiver/status/1829303',
    archive_url: '',
    title: 'Oil spill and dead fish at Galle Harbor',
    author: '@SouthernDiver',
    publication_date: '2026-07-22',
    language: 'en',
    raw_text_path: '',
    media_path: '',
    credibility_score: 88,
    evidence_sentence: 'Severe oil slick smell and black oil sludge washed onto the beach near Galle Harbour fort wall.',
    source_confidence: 'High'
  });

  // Seed initial rewards
  insertReward({
    reward_id: 'rew_01',
    user_id: 'USR-8821',
    report_id: 'REP-2026-01',
    reward_type: 'Badge & Points',
    points: 25,
    badge_name: 'MIIS Beach Observer',
    reason: 'First expert-verified report with GPS and clear photo evidence.'
  });
}
