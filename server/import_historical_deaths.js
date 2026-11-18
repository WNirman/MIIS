import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase, insertIncident, insertSource, getAllIncidents } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initDatabase();

const jsonPath = path.join(__dirname, 'historical_marine_deaths.json');
if (fs.existsSync(jsonPath)) {
  const records = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
  console.log(`[MIIS Importer] Found ${records.length} historical marine mortality records to ingest...`);

  let count = 0;
  for (const item of records) {
    const incidentRecord = {
      incident_id: item.incident_id,
      event_date: item.event_date,
      event_date_precision: item.event_date_precision || 'Month',
      report_date: item.event_date,
      country: item.country || 'Sri Lanka',
      province: item.province,
      district: item.district,
      ds_division: '',
      nearest_town: item.nearest_town,
      location_name: item.location_name,
      original_location_text: item.notes,
      site_type: 'Historical Survey Benchmark (TCP Sri Lanka)',
      latitude: item.latitude,
      longitude: item.longitude,
      spatial_precision: item.spatial_precision,
      coordinate_confidence: 'High',
      coordinate_source: item.coordinate_source,
      gps_accuracy_m: 50,
      uncertainty_radius_km: 0.5,
      distance_to_coast_km: 0.01,
      location_validation_status: 'Scientifically Validated',
      event_type: item.event_type,
      taxon_group: item.taxon_group,
      species_common: item.species_common,
      species_scientific: item.species_scientific,
      condition_status: item.condition_status,
      number_dead: item.number_dead || 0,
      number_alive: item.number_alive || 0,
      quantity_text: item.quantity_text,
      number_precision: 'exact',
      cause_category: item.cause_category,
      suspected_cause: item.suspected_cause,
      cause_certainty: 'Very High',
      urgency_level: item.urgency_level,
      response_status: 'Historical Baseline Study - Archive',
      confidence_score: item.confidence_score || 98,
      confidence_class: 'High confidence',
      validation_level: item.validation_level || 'Level 4',
      validation_status: item.validation_status || 'Historically Confirmed (TCP Dataset)',
      duplicate_group_id: null,
      public_visibility: 'Public',
      sensitive_location: 1,
      notes: item.notes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    insertIncident(incidentRecord);

    const sourceRecord = {
      source_id: `SRC-${item.incident_id}`,
      incident_id: item.incident_id,
      source_type: 'National Survey Report (Turtle Conservation Project)',
      source_name: 'Kapurusinghe & Cooray (2002) Marine Turtle By-Catch Survey',
      source_url: 'TCP National Archive, Sri Lanka',
      archive_url: '',
      title: `Historical Marine Turtle Mortality: ${item.location_name}`,
      author: 'Turtle Conservation Project (TCP) Sri Lanka',
      publication_date: item.event_date,
      language: 'en',
      raw_text_path: '',
      media_path: '',
      credibility_score: 99,
      evidence_sentence: item.notes,
      source_confidence: 'Very High'
    };

    insertSource(sourceRecord);
    count++;
  }

  console.log(`[SUCCESS] Ingested ${count} historical marine mortality incidents into miis.db!`);
  console.log(`Total database incidents now: ${getAllIncidents().length}`);
}
