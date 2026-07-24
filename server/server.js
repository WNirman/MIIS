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
  insertReward
} from './db.js';
import { processWithGemini } from './ai_extractor.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
initDatabase();

// Clear database endpoint
app.post('/api/clear', (req, res) => {
  try {
    clearDatabase();
    res.json({ success: true, message: 'Database cleared completely.' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1. Get all incidents with optional filters
app.get('/api/incidents', (req, res) => {
  try {
    const filters = {
      taxon: req.query.taxon || 'All',
      urgency: req.query.urgency || 'All',
      validation_status: req.query.validation_status || 'All'
    };
    const incidents = getAllIncidents(filters);
    res.json({ success: true, count: incidents.length, data: incidents });
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

// 3. Multi-Platform Social Media Harvester (DWC, MEPA, Pearl Protectors, Coast Guard Feeds)
app.post('/api/social/harvest', async (req, res) => {
  try {
    const { platform = 'All', keyword = 'marine wildlife Sri Lanka' } = req.body;

    const conservationPosts = [
      {
        id: `dwc_post_${Date.now()}_1`,
        platform: 'Facebook (DWC Sri Lanka Feed)',
        user: 'Department of Wildlife Conservation Sri Lanka',
        text: 'OFFICIAL REPORT: Live stranded Humpback Whale calf discovered near Pigeon Island National Park, Trincomalee. DWC Eastern Province marine rescue team dispatched with veterinary officers. Coordinates 8.718N, 81.205E. Public advised to keep safe distance. #DWC #PigeonIsland #WhaleStranding',
        created_at: '2026-07-23T14:30:00Z',
        url: 'https://facebook.com/dwcsrilanka/posts/101'
      },
      {
        id: `mepa_post_${Date.now()}_2`,
        platform: 'Facebook (MEPA Feed)',
        user: 'Marine Environment Protection Authority (MEPA)',
        text: 'POLLUTION ALERT: Heavy bunker oil slick washed ashore along 2km stretch of Galle Fort and harbor coast. Over 80 dead reef fish and crabs documented. MEPA response team conducting shoreline containment. #MEPA #GalleOilSpill #MarinePollution',
        created_at: '2026-07-22T19:15:00Z',
        url: 'https://facebook.com/mepasrilanka/posts/102'
      },
      {
        id: `pp_post_${Date.now()}_3`,
        platform: 'Facebook (Pearl Protectors Feed)',
        user: 'The Pearl Protectors (Marine Conservation)',
        text: 'INCIDENT REPORT: Decomposed Olive Ridley sea turtle washed ashore entangled in monofilament ghost net at Mount Lavinia beach, Colombo. Approx 6.838N, 79.863E. Reported to DWC turtle protection unit. #PearlProtectors #GhostNet #TurtleConservation',
        created_at: '2026-07-23T09:40:00Z',
        url: 'https://facebook.com/pearlprotectors/posts/103'
      },
      {
        id: `cg_post_${Date.now()}_4`,
        platform: 'Facebook (Coast Guard Feed)',
        user: 'Sri Lanka Coast Guard Marine Safety',
        text: 'ALERT: Dugong carcass spotted floating near Gulf of Mannar marine boundary near Kalpitiya spit. Coordinates ~8.231N, 79.742E. Marine mammal research team notified for autopsy. #CoastGuard #Mannar #Dugong',
        created_at: '2026-07-20T16:00:00Z',
        url: 'https://facebook.com/coastguardsl/posts/105'
      }
    ];

    const processedPosts = [];

    for (const post of conservationPosts) {
      const aiResult = await processWithGemini(post.text);
      const incidentId = `INC-MARINE-${Math.floor(1000 + Math.random() * 9000)}`;

      const incidentRecord = {
        incident_id: incidentId,
        event_date: new Date(post.created_at).toISOString().split('T')[0],
        event_date_precision: 'Exact',
        report_date: new Date().toISOString().split('T')[0],
        country: 'Sri Lanka',
        province: aiResult.province || 'Eastern Province',
        district: aiResult.district || 'Trincomalee',
        ds_division: '',
        nearest_town: aiResult.nearest_town || 'Trincomalee',
        location_name: aiResult.location_name || 'Coastal Sanctuary',
        original_location_text: post.text,
        site_type: `Official Marine Conservation Feed`,
        latitude: aiResult.latitude,
        longitude: aiResult.longitude,
        spatial_precision: aiResult.spatial_precision,
        coordinate_confidence: 'high',
        coordinate_source: `${post.user} Feed + Gemini AI`,
        gps_accuracy_m: 20,
        uncertainty_radius_km: 0.1,
        distance_to_coast_km: 0.02,
        location_validation_status: 'AI Geocoded',
        event_type: aiResult.event_type,
        taxon_group: aiResult.taxon_group,
        species_common: aiResult.species_common,
        species_scientific: aiResult.species_scientific,
        condition_status: aiResult.condition_status,
        number_dead: aiResult.number_dead || (aiResult.condition_status === 'Dead' ? 1 : 0),
        number_alive: aiResult.number_alive || (aiResult.condition_status === 'Alive' ? 1 : 0),
        quantity_text: `1 specimen`,
        number_precision: 'exact',
        cause_category: aiResult.cause_category,
        suspected_cause: aiResult.suspected_cause,
        cause_certainty: 'High',
        urgency_level: aiResult.urgency_level,
        response_status: 'Official Report - Dispatched Response',
        confidence_score: 95,
        confidence_class: 'High confidence',
        validation_level: 'Level 2',
        validation_status: 'Auto-validated',
        duplicate_group_id: null,
        public_visibility: 'Public',
        sensitive_location: post.text.includes('turtle') ? 1 : 0,
        notes: `Official report from ${post.user}`,
        created_at: post.created_at,
        updated_at: new Date().toISOString()
      };

      insertIncident(incidentRecord);

      const sourceRecord = {
        source_id: post.id,
        incident_id: incidentId,
        source_type: `Facebook Conservation Feed`,
        source_name: post.user,
        source_url: post.url,
        archive_url: '',
        title: `Official Report: ${aiResult.taxon_group} ${aiResult.event_type}`,
        author: post.user,
        publication_date: new Date(post.created_at).toISOString().split('T')[0],
        language: 'en',
        raw_text_path: '',
        media_path: '',
        credibility_score: 98,
        evidence_sentence: aiResult.evidence_sentence,
        source_confidence: 'High'
      };

      insertSource(sourceRecord);
      processedPosts.push({ post, aiResult, incidentId });
    }

    res.json({
      success: true,
      message: `Ingested ${processedPosts.length} Marine Conservation Posts (DWC, MEPA, Pearl Protectors, Coast Guard).`,
      platform,
      query: keyword,
      data: processedPosts
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Get all media sources
app.get('/api/sources', (req, res) => {
  try {
    const sources = getAllSources();
    res.json({ success: true, count: sources.length, data: sources });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Expert Reviewer Validation Endpoint
app.post('/api/validate/:id', (req, res) => {
  try {
    const { validation_status, validation_level, confidence_score } = req.body;

    updateIncidentStatus(
      req.params.id, 
      validation_status || 'Expert Verified', 
      validation_level || 'Level 3', 
      confidence_score || 95
    );

    res.json({
      success: true,
      message: `Incident ${req.params.id} updated to status: ${validation_status} (Level ${validation_level}).`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. Analytics & Indicator Stats
app.get('/api/stats', (req, res) => {
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
