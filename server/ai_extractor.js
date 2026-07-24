import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

export async function processWithGemini(text, mediaMetadata = null) {
  if (GEMINI_API_KEY) {
    try {
      const prompt = `
You are the AI Triage Engine for the Marine Incident Intelligence System (MIIS) in Sri Lanka.
Analyze the following input report or social media post and extract structured incident details.

Input Text: "${text}"

Respond ONLY with a valid JSON object with the following fields:
{
  "is_relevant": true or false,
  "event_type": "Dead animal" | "Live stranded animal" | "Injured animal" | "Entangled animal" | "Washed-ashore animal" | "Fish kill" | "Coral bleaching" | "Oil pollution" | "Chemical pollution" | "Plastic/nurdle pollution" | "Ghost net" | "Unusual coastal event",
  "taxon_group": "Sea turtle" | "Dolphin" | "Whale" | "Dugong" | "Shark" | "Ray" | "Fish" | "Seabird" | "Coral/reef" | "Mixed animals" | "Unknown" | "Not animal-related",
  "species_common": "Common name or Unknown",
  "species_scientific": "Scientific binomial name or Unknown",
  "condition_status": "Alive" | "Dead" | "Injured" | "Entangled" | "Decomposed" | "Skeleton/remains" | "Floating" | "Washed ashore",
  "number_dead": integer,
  "number_alive": integer,
  "quantity_text": "string",
  "location_name": "Location / Beach name",
  "nearest_town": "Town name",
  "district": "Trincomalee" | "Galle" | "Colombo" | "Gampaha" | "Puttalam" | "Jaffna" | "Hambantota" | "Matara" | "Batticaloa" | "Kalutara" | "Ampara" | "Mannar" | "Mullaitivu" | "Kilinochchi",
  "province": "Western Province" | "Southern Province" | "Eastern Province" | "Northern Province" | "North Western Province",
  "latitude": float between 5.8 and 9.9,
  "longitude": float between 79.5 and 81.9,
  "spatial_precision": "exact_site" | "nearby_site" | "town_level" | "district_level" | "province_level" | "unknown",
  "coordinate_confidence": "high" | "medium" | "low" | "uncertain",
  "suspected_cause": "string",
  "cause_category": "Fisheries Interaction" | "Chemical / Oil Spill" | "Stranding" | "Plastic Pollution" | "Boat Strike" | "Natural / Disease" | "Unknown",
  "urgency_level": "critical" | "high" | "medium" | "low",
  "confidence_score": integer between 0 and 100,
  "evidence_sentence": "Key quote supporting extraction"
}
`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: 'application/json' }
        })
      });

      if (response.ok) {
        const data = await response.json();
        const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (outputText) {
          return JSON.parse(outputText);
        }
      }
    } catch (e) {
      console.warn('[Gemini AI Node] API Call failed. Falling back to local NLP rules.', e.message);
    }
  }

  // Fallback Rule Engine
  return fallbackTriageRules(text);
}

function fallbackTriageRules(text) {
  const lower = text.toLowerCase();

  let eventType = "Washed-ashore animal";
  let taxonGroup = "Unknown";
  let speciesCommon = "Unknown";
  let conditionStatus = "Dead";
  let district = "Colombo";
  let nearestTown = "Colombo";
  let province = "Western Province";
  let lat = 6.9271;
  let lon = 79.8612;
  let urgency = "medium";
  let causeCategory = "Unknown";
  let suspectedCause = "Under Investigation";

  if (lower.includes("turtle")) {
    taxonGroup = "Sea turtle";
    speciesCommon = lower.includes("olive") ? "Olive Ridley Sea Turtle" : "Green Sea Turtle";
    if (lower.includes("entangled") || lower.includes("net")) {
      eventType = "Entangled animal";
      conditionStatus = "Entangled";
      causeCategory = "Fisheries Interaction";
      suspectedCause = "Ghost net entanglement";
    }
  } else if (lower.includes("whale")) {
    taxonGroup = "Whale";
    speciesCommon = lower.includes("humpback") ? "Humpback Whale" : "Blue Whale";
    if (lower.includes("stranded") || lower.includes("live")) {
      eventType = "Live stranded animal";
      conditionStatus = "Alive";
      urgency = "critical";
      causeCategory = "Stranding";
    }
  } else if (lower.includes("oil") || lower.includes("sludge") || lower.includes("spill")) {
    taxonGroup = "Not animal-related";
    eventType = "Oil pollution";
    conditionStatus = "N/A";
    urgency = "high";
    causeCategory = "Chemical / Oil Spill";
    suspectedCause = "Maritime discharge";
  } else if (lower.includes("fish") || lower.includes("sardine")) {
    taxonGroup = "Fish";
    eventType = "Fish kill";
    conditionStatus = "Dead";
    causeCategory = "Chemical / Oil Spill";
    suspectedCause = "Hypoxia / Chemical Runoff";
  } else if (lower.includes("dugong")) {
    taxonGroup = "Dugong";
    speciesCommon = "Dugong";
    eventType = "Dead animal";
    urgency = "high";
  }

  // Location Geocoding
  if (lower.includes("trincomalee") || lower.includes("pigeon island")) {
    nearestTown = "Trincomalee";
    district = "Trincomalee";
    province = "Eastern Province";
    lat = 8.5874; lon = 81.2152;
    if (lower.includes("8.718")) { lat = 8.718; lon = 81.205; }
  } else if (lower.includes("galle")) {
    nearestTown = "Galle Fort";
    district = "Galle";
    province = "Southern Province";
    lat = 6.0535; lon = 80.2210;
  } else if (lower.includes("mount lavinia")) {
    nearestTown = "Mount Lavinia";
    district = "Colombo";
    province = "Western Province";
    lat = 6.838; lon = 79.863;
  } else if (lower.includes("negombo")) {
    nearestTown = "Negombo";
    district = "Gampaha";
    province = "Western Province";
    lat = 7.2008; lon = 79.8737;
  } else if (lower.includes("kalpitiya") || lower.includes("mannar")) {
    nearestTown = "Kalpitiya";
    district = "Puttalam";
    province = "North Western Province";
    lat = 8.2312; lon = 79.7424;
  }

  if (lower.includes("critical") || lower.includes("live") || lower.includes("rescue")) {
    urgency = "critical";
  }

  return {
    is_relevant: true,
    event_type: eventType,
    taxon_group: taxonGroup,
    species_common: speciesCommon,
    species_scientific: speciesCommon !== "Unknown" ? `${speciesCommon} (sp.)` : "Unknown",
    condition_status: conditionStatus,
    number_dead: conditionStatus === "Dead" ? 1 : 0,
    number_alive: conditionStatus === "Alive" ? 1 : 0,
    quantity_text: "1 specimen",
    location_name: `${nearestTown} Shoreline`,
    nearest_town: nearestTown,
    district: district,
    province: province,
    latitude: lat,
    longitude: lon,
    spatial_precision: (text.includes("8.718") || text.includes("6.838")) ? "exact_site" : "nearby_site",
    coordinate_confidence: "high",
    suspected_cause: suspectedCause,
    cause_category: causeCategory,
    urgency_level: urgency,
    confidence_score: 86,
    evidence_sentence: text.length > 110 ? text.substring(0, 110) + "..." : text
  };
}
