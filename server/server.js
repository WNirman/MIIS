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
import { calculateTurtleConfidenceScore, SRI_LANKA_SEA_TURTLE_SPECIES } from './species_data.js';

import { execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize SQLite database
initDatabase();

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

// 3. Multi-Platform Social Media Harvester (Real Meta Graph API & Twitter API)
app.post('/api/social/harvest', async (req, res) => {
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
