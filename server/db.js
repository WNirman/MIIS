import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let db = null;
let isNativeSqlite = false;

try {
  const Database = (await import('better-sqlite3')).default;
  const dbPath = path.join(__dirname, 'miis.db');
  db = new Database(dbPath);
  isNativeSqlite = true;
  console.log('[MIIS DB] Connected to SQLite database:', dbPath);
} catch (err) {
  console.warn('[MIIS DB] SQLite native module unavailable. Operating in lightweight file-backed database mode.', err.message);
}

// In-Memory / File-backed Fallback DB Store if SQLite driver isn't precompiled
const DATA_FILE = path.join(__dirname, 'db_data.json');
let memoryData = {
  miis_incidents: [],
  miis_citizen_reports: [],
  miis_sources: [],
  miis_rewards: []
};

if (fs.existsSync(DATA_FILE)) {
  try {
    memoryData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch (e) {
    console.error('Error loading fallback db data:', e);
  }
}

function saveMemoryData() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(memoryData, null, 2), 'utf8');
}

export function initDatabase() {
  if (isNativeSqlite) {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    db.exec(schemaSql);
  }
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
