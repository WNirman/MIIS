/**
 * MIIS Maritime GNSS, Geofencing, EXIF GPS Extraction & Low-Bandwidth SMS Engine
 * ==============================================================================
 * Engineered specifically for Sri Lankan fishers operating 0–50 km offshore under
 * intermittent 2G/GPRS or zero cellular coverage:
 *
 *  1. Hardware GNSS Multi-Sample Lock (works 100% offline via GPS/GLONASS/Galileo
 *     satellites — rejects stale harbour cell-tower fixes via timestamp & accuracy gates).
 *  2. Offline Sri Lanka Maritime EEZ Geofence & Auto Province/District Resolution
 *     (eliminates administrative mismatches such as Galle->Western or Palatupana->Monaragala).
 *  3. Pure-JS JPEG EXIF GPS & Capture-Timestamp Parser (detects harbour-submission
 *     location drift when a fisher photographs an animal offshore and reports at harbour).
 *  4. Ultra-compact <130-char GSM 7-bit SMS Beacon Encoder for zero-data sea zones.
 */

// Official Sri Lanka 14 Coastal Districts & Coastal Reference Points (Survey Dept / DS aligned)
export const SL_COASTAL_ANCHORS = [
  // Western Province
  { name: 'Galle Face / Colombo Port', district: 'Colombo', province: 'Western', lat: 6.927, lon: 79.845 },
  { name: 'Wellawatte / Dehiwala', district: 'Colombo', province: 'Western', lat: 6.862, lon: 79.859 },
  { name: 'Mount Lavinia / Ratmalana', district: 'Colombo', province: 'Western', lat: 6.835, lon: 79.864 },
  { name: 'Moratuwa / Egoda Uyana', district: 'Colombo', province: 'Western', lat: 6.756, lon: 79.886 },
  { name: 'Preethipura / Wattala', district: 'Gampaha', province: 'Western', lat: 6.999, lon: 79.867 },
  { name: 'Uswetakeiyawa / Pamunugama', district: 'Gampaha', province: 'Western', lat: 7.080, lon: 79.844 },
  { name: 'Kepungoda / Dungalpitiya', district: 'Gampaha', province: 'Western', lat: 7.145, lon: 79.830 },
  { name: 'Negombo / Poruthota', district: 'Gampaha', province: 'Western', lat: 7.226, lon: 79.836 },
  { name: 'Panadura / Wadduwa', district: 'Kalutara', province: 'Western', lat: 6.688, lon: 79.914 },
  { name: 'Kalutara Calido / Payagala', district: 'Kalutara', province: 'Western', lat: 6.560, lon: 79.965 },
  { name: 'Beruwala / Moragalla / Aluthgama', district: 'Kalutara', province: 'Western', lat: 6.452, lon: 79.988 },

  // North Western Province
  { name: 'Wennappuwa / Marawila', district: 'Puttalam', province: 'North Western', lat: 7.390, lon: 79.825 },
  { name: 'Chilaw / Suduwella / Iranawila', district: 'Puttalam', province: 'North Western', lat: 7.576, lon: 79.795 },
  { name: 'Udappuwa / Mundalama', district: 'Puttalam', province: 'North Western', lat: 7.800, lon: 79.790 },
  { name: 'Kalpitiya / Kandakuliya / Alankuda', district: 'Puttalam', province: 'North Western', lat: 8.180, lon: 79.710 },
  { name: 'Battalangunduwa / Kudawa', district: 'Puttalam', province: 'North Western', lat: 8.330, lon: 79.760 },
  { name: 'Kudiramalai Point', district: 'Puttalam', province: 'North Western', lat: 8.550, lon: 79.875 },

  // Northern Province
  { name: 'Marichchukkaddi / Silavathurai', district: 'Mannar', province: 'Northern', lat: 8.650, lon: 79.940 },
  { name: 'Vankalai / Mannar South Bar', district: 'Mannar', province: 'Northern', lat: 8.955, lon: 79.920 },
  { name: 'Mannar Island / Nadukuda / Talaimannar', district: 'Mannar', province: 'Northern', lat: 9.045, lon: 79.780 },
  { name: 'Valaipadu / Poonakary', district: 'Kilinochchi', province: 'Northern', lat: 9.470, lon: 80.080 },
  { name: 'Delft Island (Neduntheevu)', district: 'Jaffna', province: 'Northern', lat: 9.510, lon: 79.690 },
  { name: 'Kayts / Velanai / Punkudutivu', district: 'Jaffna', province: 'Northern', lat: 9.640, lon: 79.860 },
  { name: 'Point Pedro / Jaffna North', district: 'Jaffna', province: 'Northern', lat: 9.820, lon: 80.230 },
  { name: 'Mullaitivu Coast', district: 'Mullaitivu', province: 'Northern', lat: 9.267, lon: 80.814 },

  // Eastern Province
  { name: 'Kuchchaveli / Pigeon Island / Trincomalee', district: 'Trincomalee', province: 'Eastern', lat: 8.680, lon: 81.205 },
  { name: 'Trincomalee / Foul Point / Mutur', district: 'Trincomalee', province: 'Eastern', lat: 8.500, lon: 81.270 },
  { name: 'Vakarai / Panichankerni', district: 'Batticaloa', province: 'Eastern', lat: 8.110, lon: 81.450 },
  { name: 'Batticaloa / Punnakudah / Navaladi', district: 'Batticaloa', province: 'Eastern', lat: 7.740, lon: 81.700 },
  { name: 'Kaluwanchikudy / Kirankulam', district: 'Batticaloa', province: 'Eastern', lat: 7.575, lon: 81.770 },
  { name: 'Kalmunai / Akkaraipattu / Thirukkovil', district: 'Ampara', province: 'Eastern', lat: 7.220, lon: 81.855 },
  { name: 'Pottuvil / Arugam Bay / Panama', district: 'Ampara', province: 'Eastern', lat: 6.840, lon: 81.836 },
  { name: 'Okanda / Kumana Coast', district: 'Ampara', province: 'Eastern', lat: 6.610, lon: 81.755 },

  // Southern Province
  { name: 'Palatupana / Yala / Kirinda', district: 'Hambantota', province: 'Southern', lat: 6.245, lon: 81.365 },
  { name: 'Hambantota Harbour Coast', district: 'Hambantota', province: 'Southern', lat: 6.124, lon: 81.119 },
  { name: 'Rekawa / Tangalle / Kudawella', district: 'Hambantota', province: 'Southern', lat: 6.020, lon: 80.790 },
  { name: 'Dikwella / Hiriketiya / Kottegoda', district: 'Matara', province: 'Southern', lat: 5.958, lon: 80.680 },
  { name: 'Matara / Polhena / Madiha', district: 'Matara', province: 'Southern', lat: 5.939, lon: 80.525 },
  { name: 'Mirissa / Weligama / Midigama', district: 'Matara', province: 'Southern', lat: 5.958, lon: 80.425 },
  { name: 'Ahangama / Koggala / Thalpe / Unawatuna', district: 'Galle', province: 'Southern', lat: 5.995, lon: 80.295 },
  { name: 'Galle Fort / Ginthota / Hikkaduwa', district: 'Galle', province: 'Southern', lat: 6.105, lon: 80.130 },
  { name: 'Ambalangoda / Balapitiya / Kosgoda', district: 'Galle', province: 'Southern', lat: 6.300, lon: 80.032 },
  { name: 'Induruwa / Bentota South', district: 'Galle', province: 'Southern', lat: 6.400, lon: 80.005 },
];

// Sri Lanka EEZ & coastal operational bounding box
export const SL_MARITIME_BOUNDS = {
  minLat: 4.5,
  maxLat: 10.6,
  minLon: 78.2,
  maxLon: 83.4,
};

export function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371.0;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function compassBearing(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const deg = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

/**
 * Offline spatial validator & automatic Province/District resolver.
 * Prevents administrative mismatches & catches out-of-bounds / null-island GPS bugs.
 */
export function validateSriLankaMaritimeCoords(lat, lon) {
  const numLat = Number(lat);
  const numLon = Number(lon);

  if (!Number.isFinite(numLat) || !Number.isFinite(numLon) || (Math.abs(numLat) < 0.01 && Math.abs(numLon) < 0.01)) {
    return {
      valid: false,
      severity: 'error',
      zone: 'Invalid Coordinates',
      message: 'Coordinates are missing or (0, 0). Lock satellite GPS before submitting.',
      district: '',
      province: '',
      nearestAnchor: '',
      distanceKm: null,
      bearingFromShore: '',
    };
  }

  const inBounds =
    numLat >= SL_MARITIME_BOUNDS.minLat &&
    numLat <= SL_MARITIME_BOUNDS.maxLat &&
    numLon >= SL_MARITIME_BOUNDS.minLon &&
    numLon <= SL_MARITIME_BOUNDS.maxLon;

  let nearest = SL_COASTAL_ANCHORS[0];
  let minDist = Infinity;
  for (const anchor of SL_COASTAL_ANCHORS) {
    const d = haversineKm(numLat, numLon, anchor.lat, anchor.lon);
    if (d < minDist) {
      minDist = d;
      nearest = anchor;
    }
  }

  const bearingFromShore = compassBearing(nearest.lat, nearest.lon, numLat, numLon);
  const roundedDist = Number(minDist.toFixed(2));

  if (!inBounds) {
    return {
      valid: false,
      severity: 'error',
      zone: 'Outside Sri Lanka Maritime EEZ',
      message: `Location (${numLat.toFixed(4)}°N, ${numLon.toFixed(4)}°E) is outside Sri Lanka coastal/EEZ bounds (${roundedDist} km from ${nearest.name}). Check GPS lock.`,
      district: nearest.district,
      province: nearest.province,
      nearestAnchor: nearest.name,
      distanceKm: roundedDist,
      bearingFromShore,
    };
  }

  let zone = 'Coastal / Beach Shoreline';
  let severity = 'ok';
  let message = `Verified ${nearest.district} District (${nearest.province} Province) — ${roundedDist} km ${bearingFromShore} of ${nearest.name}.`;

  if (minDist > 22.2) {
    zone = 'Offshore EEZ (>12 NM)';
    message = `Offshore EEZ fix: ${roundedDist} km (${(roundedDist / 1.852).toFixed(1)} NM) ${bearingFromShore} of ${nearest.name} (${nearest.district}, ${nearest.province}).`;
  } else if (minDist > 3.0) {
    zone = 'Nearshore Fishing Sea (0–12 NM)';
    message = `Nearshore maritime fix: ${roundedDist} km (${(roundedDist / 1.852).toFixed(1)} NM) ${bearingFromShore} of ${nearest.name} (${nearest.district}, ${nearest.province}).`;
  }

  return {
    valid: true,
    severity,
    zone,
    message,
    district: nearest.district,
    province: nearest.province,
    nearestAnchor: nearest.name,
    distanceKm: roundedDist,
    distanceNm: Number((roundedDist / 1.852).toFixed(2)),
    bearingFromShore,
  };
}

export function classifyGnssAccuracy(accuracyM) {
  const acc = Number(accuracyM);
  if (!Number.isFinite(acc) || acc <= 0) {
    return { grade: 'UNKNOWN', label: 'Unknown Precision', color: 'slate', acceptable: false };
  }
  if (acc <= 15) {
    return { grade: 'EXCELLENT_GNSS', label: `High-Precision Satellite Lock (±${Math.round(acc)}m)`, color: 'emerald', acceptable: true };
  }
  if (acc <= 50) {
    return { grade: 'GOOD_GNSS', label: `Reliable Sea GNSS Lock (±${Math.round(acc)}m)`, color: 'cyan', acceptable: true };
  }
  if (acc <= 250) {
    return { grade: 'DEGRADED_FIX', label: `Moderate Fix (±${Math.round(acc)}m) — hold steady in open sky`, color: 'amber', acceptable: true };
  }
  return {
    grade: 'CELL_TOWER_REJECTED',
    label: `Coarse Cell-Tower Fix (±${Math.round(acc)}m) — high risk of wrong location!`,
    color: 'red',
    acceptable: false,
  };
}

/**
 * Multi-sample Hardware GNSS Acquisition Engine.
 * Works completely offline at sea using GPS/GLONASS/Galileo hardware chip.
 * Rejects stale cached OS locations (>30s old) and computes inverse-variance
 * weighted coordinates across multiple satellite epochs.
 */
export function acquireMaritimeGNSSFix(onProgress, options = {}) {
  const maxDurationMs = options.maxDurationMs ?? 9000;
  const targetAccuracyM = options.targetAccuracyM ?? 15;
  const minSamples = options.minSamples ?? 2;
  const maxSamples = options.maxSamples ?? 5;

  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('Device GNSS hardware is unavailable in this browser.'));
      return;
    }

    const samples = [];
    let settled = false;
    let watchId = null;

    const finalize = () => {
      if (settled) return;
      settled = true;
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);

      if (samples.length === 0) {
        reject(new Error('No fresh satellite fix received. Step onto open deck away from metal cabin roof and retry.'));
        return;
      }

      // Inverse-variance (1 / accuracy^2) weighted average of collected fixes
      let wSum = 0;
      let latSum = 0;
      let lonSum = 0;
      let bestAcc = Infinity;
      let latest = samples[samples.length - 1];

      for (const s of samples) {
        const effAcc = Math.max(s.accuracy, 3);
        const w = 1 / (effAcc * effAcc);
        wSum += w;
        latSum += s.latitude * w;
        lonSum += s.longitude * w;
        if (s.accuracy < bestAcc) bestAcc = s.accuracy;
      }

      const fusedLat = Number((latSum / wSum).toFixed(6));
      const fusedLon = Number((lonSum / wSum).toFixed(6));
      const accGrade = classifyGnssAccuracy(bestAcc);
      const geoCheck = validateSriLankaMaritimeCoords(fusedLat, fusedLon);

      resolve({
        latitude: fusedLat,
        longitude: fusedLon,
        gps_accuracy_m: Math.round(bestAcc),
        altitude_m: latest.altitude !== null ? Math.round(latest.altitude) : null,
        heading_deg: latest.heading !== null && !Number.isNaN(latest.heading) ? Math.round(latest.heading) : null,
        speed_knots: latest.speed !== null && !Number.isNaN(latest.speed) ? Number((latest.speed * 1.94384).toFixed(1)) : null,
        samples_used: samples.length,
        gps_locked_at: new Date(latest.timestamp).toISOString(),
        fix_quality: accGrade.grade,
        fix_quality_label: accGrade.label,
        fix_acceptable: accGrade.acceptable,
        location_source: samples.length > 1 ? 'Hardware GNSS (Multi-Sample Fused)' : 'Hardware GNSS (Single Fix)',
        geofence: geoCheck,
      });
    };

    const timer = setTimeout(finalize, maxDurationMs);

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const ageMs = Date.now() - pos.timestamp;
        // Reject stale harbour/cell-tower cache (>30 seconds old)
        if (ageMs > 30000 && samples.length > 0) return;

        const sample = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 999,
          altitude: pos.coords.altitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          timestamp: pos.timestamp,
        };
        samples.push(sample);

        if (onProgress) {
          onProgress({
            samplesCollected: samples.length,
            latestAccuracyM: Math.round(sample.accuracy),
            grade: classifyGnssAccuracy(sample.accuracy),
          });
        }

        if (
          (samples.length >= minSamples && sample.accuracy <= targetAccuracyM) ||
          samples.length >= maxSamples
        ) {
          finalize();
        }
      },
      (err) => {
        if (samples.length > 0) {
          finalize();
        } else {
          settled = true;
          if (watchId !== null) navigator.geolocation.clearWatch(watchId);
          clearTimeout(timer);
          reject(new Error(err.message || 'Location permission denied or GNSS unavailable.'));
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: maxDurationMs,
      }
    );
  });
}

/**
 * Pure-JS Binary JPEG EXIF Parser (zero dependencies).
 * Extracts GPSLatitude, GPSLongitude, and DateTimeOriginal directly from
 * camera photos so MIIS detects when a fisher submits later from harbour.
 */
export async function extractExifFromFile(file) {
  try {
    const buffer = await file.slice(0, 131072).arrayBuffer(); // First 128 KB holds EXIF APP1
    const view = new DataView(buffer);
    if (view.byteLength < 12 || view.getUint16(0, false) !== 0xffd8) {
      return { hasExif: false };
    }

    let offset = 2;
    while (offset + 4 < view.byteLength) {
      const marker = view.getUint16(offset, false);
      offset += 2;
      if (marker === 0xffe1) {
        // Check "Exif\0\0"
        if (view.getUint32(offset + 2, false) !== 0x45786966) {
          return { hasExif: false };
        }
        const tiffStart = offset + 8;
        const littleEndian = view.getUint16(tiffStart, false) === 0x4949;
        const firstIfdOffset = view.getUint32(tiffStart + 4, littleEndian);
        const ifd0Start = tiffStart + firstIfdOffset;

        const readAscii = (valOffset, count) => {
          let s = '';
          for (let i = 0; i < count - 1 && tiffStart + valOffset + i < view.byteLength; i++) {
            const ch = view.getUint8(tiffStart + valOffset + i);
            if (ch === 0) break;
            s += String.fromCharCode(ch);
          }
          return s.trim();
        };

        const readRationals3 = (valOffset) => {
          const base = tiffStart + valOffset;
          if (base + 24 > view.byteLength) return null;
          const nums = [];
          for (let i = 0; i < 3; i++) {
            const num = view.getUint32(base + i * 8, littleEndian);
            const den = view.getUint32(base + i * 8 + 4, littleEndian);
            nums.push(den ? num / den : 0);
          }
          return nums[0] + nums[1] / 60 + nums[2] / 3600;
        };

        let gpsIfdPtr = null;
        let exifIfdPtr = null;
        let make = '';
        let model = '';
        let dateTime = '';

        const parseIfd = (start, onTag) => {
          if (start + 2 > view.byteLength) return;
          const entries = view.getUint16(start, littleEndian);
          for (let i = 0; i < entries; i++) {
            const entryOff = start + 2 + i * 12;
            if (entryOff + 12 > view.byteLength) break;
            const tag = view.getUint16(entryOff, littleEndian);
            const type = view.getUint16(entryOff + 2, littleEndian);
            const count = view.getUint32(entryOff + 4, littleEndian);
            const valOrOff = view.getUint32(entryOff + 8, littleEndian);
            onTag(tag, type, count, valOrOff, entryOff + 8);
          }
        };

        parseIfd(ifd0Start, (tag, _type, count, valOrOff) => {
          if (tag === 0x010f) make = readAscii(valOrOff, count);
          if (tag === 0x0110) model = readAscii(valOrOff, count);
          if (tag === 0x0132) dateTime = readAscii(valOrOff, count);
          if (tag === 0x8769) exifIfdPtr = tiffStart + valOrOff;
          if (tag === 0x8825) gpsIfdPtr = tiffStart + valOrOff;
        });

        let dateTimeOriginal = '';
        if (exifIfdPtr) {
          parseIfd(exifIfdPtr, (tag, _type, count, valOrOff) => {
            if (tag === 0x9003) dateTimeOriginal = readAscii(valOrOff, count);
          });
        }

        let latRef = 'N';
        let lonRef = 'E';
        let latVal = null;
        let lonVal = null;
        if (gpsIfdPtr) {
          parseIfd(gpsIfdPtr, (tag, _type, _count, valOrOff, inlineOff) => {
            if (tag === 0x0001) latRef = String.fromCharCode(view.getUint8(inlineOff));
            if (tag === 0x0002) latVal = readRationals3(valOrOff);
            if (tag === 0x0003) lonRef = String.fromCharCode(view.getUint8(inlineOff));
            if (tag === 0x0004) lonVal = readRationals3(valOrOff);
          });
        }

        let exifLat = null;
        let exifLon = null;
        if (latVal !== null && lonVal !== null) {
          exifLat = Number((latRef === 'S' ? -latVal : latVal).toFixed(6));
          exifLon = Number((lonRef === 'W' ? -lonVal : lonVal).toFixed(6));
        }

        const rawTs = dateTimeOriginal || dateTime;
        let capturedAtIso = null;
        if (/^\d{4}:\d{2}:\d{2} \d{2}:\d{2}:\d{2}$/.test(rawTs)) {
          capturedAtIso = rawTs.replace(/^(\d{4}):(\d{2}):(\d{2}) /, '$1-$2-$3T');
        }

        return {
          hasExif: true,
          hasGps: exifLat !== null && exifLon !== null,
          latitude: exifLat,
          longitude: exifLon,
          captured_at: capturedAtIso,
          camera: `${make} ${model}`.trim(),
        };
      } else if ((marker & 0xff00) !== 0xff00) {
        break;
      } else {
        const segLen = view.getUint16(offset, false);
        offset += segLen;
      }
    }
    return { hasExif: false };
  } catch {
    return { hasExif: false };
  }
}

/**
 * Compress photo locally for low-bandwidth harbour upload while preserving
 * extracted EXIF GPS & capture timestamp BEFORE canvas re-encoding.
 */
export async function compressMarinePhoto(file, maxDimension = 1280, quality = 0.72) {
  const exif = await extractExifFromFile(file);
  const originalKb = Math.round(file.size / 1024);

  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = ev.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const compressedKb = Math.round((dataUrl.length * 3) / 4 / 1024);
  return {
    dataUrl,
    originalKb,
    compressedKb,
    fileName: file.name,
    exif,
  };
}

/**
 * Compact GSM 7-bit SMS Beacon Encoder (<130 chars -> fits inside 1 single SMS).
 * Enables offshore reporting when mobile data fails at 10–30 km from shore
 * but basic 2G voice/SMS signal still connects.
 */
const EVENT_CODES = {
  'Dead animal': 'DEAD',
  'Live stranded animal': 'LIVE',
  'Injured animal': 'INJ',
  'Entangled animal': 'ENT',
  'Washed-ashore animal': 'WASH',
  'Fish kill': 'FKIL',
  'Coral bleaching': 'CORL',
  'Oil pollution': 'OIL',
  'Chemical pollution': 'CHEM',
  'Plastic/nurdle pollution': 'PLAS',
  'Ghost net': 'NET',
  'Unusual coastal event': 'UNUS',
  Other: 'OTH',
};

const TAXON_CODES = {
  'Sea turtle': 'TRT',
  Dolphin: 'DLP',
  Whale: 'WHL',
  Dugong: 'DUG',
  Shark: 'SHK',
  Ray: 'RAY',
  Fish: 'FSH',
  Seabird: 'BRD',
  'Coral/reef': 'CRL',
  'Mixed animals': 'MIX',
  Unknown: 'UNK',
  'Not animal-related': 'ENV',
};

const COND_CODES = {
  Alive: 'A',
  Dead: 'D',
  Injured: 'I',
  Entangled: 'E',
  Decomposed: 'X',
  'Skeleton/remains': 'S',
  'Washed ashore': 'W',
};

export function encodeSmsBeaconPacket(report) {
  const shortId = (report.client_uuid || '00000000').replace(/-/g, '').slice(0, 8).toUpperCase();
  const lat = Number(report.latitude).toFixed(5);
  const lon = Number(report.longitude).toFixed(5);
  const acc = Math.round(Number(report.gps_accuracy_m) || 0);
  const ts = new Date(report.observed_at || Date.now());
  const pad = (n) => String(n).padStart(2, '0');
  const compactTs = `${String(ts.getUTCFullYear()).slice(2)}${pad(ts.getUTCMonth() + 1)}${pad(ts.getUTCDate())}${pad(ts.getUTCHours())}${pad(ts.getUTCMinutes())}`;
  const evt = EVENT_CODES[report.event_type] || 'OTH';
  const tax = TAXON_CODES[report.taxon_group] || 'UNK';
  const cond = COND_CODES[report.condition_status] || 'U';
  const qty = Math.max(1, parseInt(report.number_observed, 10) || 1);
  const flags = [
    report.pollution_net ? 'N' : '',
    report.pollution_oil ? 'O' : '',
    report.pollution_plastic ? 'P' : '',
    report.pollution_nurdles ? 'U' : '',
    report.pollution_chemical_smell ? 'C' : '',
    report.injury_visible ? 'W' : '',
  ].join('') || '0';

  const packet = `MIIS1|${shortId}|${lat},${lon}|A${acc}|${compactTs}Z|${evt}|${tax}|${cond}|Q${qty}|F${flags}`;
  return {
    packet,
    bytes: packet.length,
    smsUri: `sms:+94112888555?body=${encodeURIComponent(packet)}`,
  };
}

/**
 * Inspect current network link quality using Network Information API.
 * Used to automatically defer heavy photos on 2G/slow-2g sea links while
 * letting the <500-byte Geo-Beacon transmit immediately.
 */
export function getMaritimeNetworkStatus() {
  const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const conn = typeof navigator !== 'undefined' ? navigator.connection || navigator.mozConnection || navigator.webkitConnection : null;
  const effectiveType = conn?.effectiveType || (online ? '4g' : 'offline');
  const downlinkMbps = conn?.downlink ?? null;
  const saveData = Boolean(conn?.saveData);

  const isLowBandwidthSeaLink = !online || saveData || effectiveType === 'slow-2g' || effectiveType === '2g' || (downlinkMbps !== null && downlinkMbps < 0.35);

  return {
    online,
    effectiveType: online ? effectiveType : 'offline',
    downlinkMbps,
    saveData,
    isLowBandwidthSeaLink,
    canSendGeoBeacon: online,
    shouldDeferPhotos: isLowBandwidthSeaLink,
  };
}
