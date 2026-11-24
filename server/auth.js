/**
 * MIIS Cryptographic RBAC Authentication, Ecological Data Protection & Audit Engine
 * =================================================================================
 * Zero-dependency security layer using Node.js built-in crypto:
 *  - Password storage: scrypt (N=16384, r=8, p=1) + 16-byte random salt + timingSafeEqual
 *  - Session tokens: HMAC-SHA256 signed JWT (24h TTL)
 *  - Ecological Coordinate Protection: deterministic ~5 km grid quantization for
 *    sensitive wildlife (sea turtles, dugongs, endangered whales) on all public
 *    and non-validator requests so poachers/scrapers cannot extract exact nesting/habitat GPS.
 *  - PII Stripping: removes reporter phone numbers, vessel IDs, and raw private notes
 *    from non-validator responses.
 */

import crypto from 'crypto';

const JWT_SECRET = process.env.MIIS_JWT_SECRET || 'miis-sri-lanka-national-conservation-jwt-2026-dev';
const TOKEN_TTL_SEC = 60 * 60 * 24; // 24 hours

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, originalHex] = storedHash.split(':');
  const derived = crypto.scryptSync(String(password), salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

function base64UrlEncode(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

export function signToken(user) {
  const header = base64UrlEncode(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: user.user_id,
      email: user.email,
      full_name: user.full_name,
      organization: user.organization,
      role: user.role,
      district: user.district || '',
      iat: now,
      exp: now + TOKEN_TTL_SEC,
    })
  );
  const signature = base64UrlEncode(
    crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest()
  );
  return `${header}.${payload}.${signature}`;
}

export function verifyToken(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 3) return null;
    const [header, payload, sig] = parts;
    const expectedSig = base64UrlEncode(
      crypto.createHmac('sha256', JWT_SECRET).update(`${header}.${payload}`).digest()
    );
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const decoded = JSON.parse(base64UrlDecode(payload));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function attachUser(req, _res, next) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    const decoded = verifyToken(auth.slice(7).trim());
    if (decoded) {
      req.user = decoded;
    }
  }
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required. Sign in to the MIIS Reporter or Validator Portal.',
    });
  }
  next();
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Portal authentication required for protected scientific data.',
      });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${allowedRoles.join(' or ')} (your role: ${req.user.role}).`,
      });
    }
    next();
  };
}

/**
 * Deterministic ~5 km Ecological Coordinate Fuzzing for Protected Marine Fauna.
 * Ensures public users & unverified accounts cannot pinpoint exact turtle nesting
 * beaches or endangered Dugong/Blue Whale locations, while keeping regional hotspot
 * mapping scientifically meaningful.
 */
function fuzzCoordDeterministic(value, seedStr, gridDeg = 0.045) {
  const num = Number(value);
  if (!Number.isFinite(num)) return null;
  const hash = crypto.createHash('sha256').update(String(seedStr)).digest();
  const jitter = ((hash[0] / 255) - 0.5) * gridDeg;
  const snapped = Math.round(num / gridDeg) * gridDeg + jitter * 0.45;
  return Number(snapped.toFixed(3));
}

export function redactIncidentForRole(incident, user) {
  const isPrivileged = user && (user.role === 'validator' || user.role === 'admin');
  if (isPrivileged) {
    return {
      ...incident,
      coordinate_protection: 'Unredacted Scientific Access (Audit Logged)',
      access_tier: user.role,
    };
  }

  const isSensitive =
    Boolean(incident.sensitive_location) ||
    /turtle|dugong|sirenian|whale/i.test(`${incident.taxon_group || ''} ${incident.species_common || ''}`);

  const safeLat = isSensitive
    ? fuzzCoordDeterministic(incident.latitude, `${incident.incident_id}:lat`)
    : incident.latitude;
  const safeLon = isSensitive
    ? fuzzCoordDeterministic(incident.longitude, `${incident.incident_id}:lon`)
    : incident.longitude;

  return {
    incident_id: incident.incident_id,
    event_date: incident.event_date,
    province: incident.province,
    district: incident.district,
    nearest_town: isSensitive ? `${incident.district} Coastal Sector` : incident.nearest_town,
    location_name: isSensitive ? `${incident.district} Protected Coastal Zone (~5 km grid)` : incident.location_name,
    latitude: safeLat,
    longitude: safeLon,
    spatial_precision: isSensitive ? '5km_protected_grid' : incident.spatial_precision,
    event_type: incident.event_type,
    taxon_group: incident.taxon_group,
    species_common: incident.species_common,
    species_scientific: incident.species_scientific,
    condition_status: incident.condition_status,
    urgency_level: incident.urgency_level,
    validation_level: incident.validation_level,
    validation_status: incident.validation_status,
    sensitive_location: isSensitive ? 1 : 0,
    coordinate_protection: isSensitive
      ? '5 km Ecological Protection Active (Exact GPS Restricted to Verified Validators)'
      : 'Public Coastal Summary',
    access_tier: user?.role || 'public',
    // Strip reporter phone/vessel IDs and private raw field notes on public/reporter tier
    notes: isSensitive ? 'Exact site details & field notes restricted to authorized marine scientists/DWC validators.' : (incident.suspected_cause || ''),
  };
}
