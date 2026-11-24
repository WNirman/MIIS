import 'dart:math';

class CoastalAnchor {
  final String name;
  final String district;
  final String province;
  final double lat;
  final double lon;

  const CoastalAnchor(this.name, this.district, this.province, this.lat, this.lon);
}

class GeoValidationResult {
  final bool valid;
  final String zone;
  final String district;
  final String province;
  final String nearestAnchor;
  final double distanceKm;
  final String bearing;
  final String message;

  const GeoValidationResult({
    required this.valid,
    required this.zone,
    required this.district,
    required this.province,
    required this.nearestAnchor,
    required this.distanceKm,
    required this.bearing,
    required this.message,
  });
}

class MaritimeGeoService {
  // Official Sri Lanka 14 Coastal Districts & Reference Anchors (Offline Lookup)
  static const List<CoastalAnchor> anchors = [
    CoastalAnchor('Colombo / Galle Face', 'Colombo', 'Western', 6.927, 79.845),
    CoastalAnchor('Mount Lavinia / Moratuwa', 'Colombo', 'Western', 6.815, 79.870),
    CoastalAnchor('Wattala / Pamunugama', 'Gampaha', 'Western', 7.055, 79.852),
    CoastalAnchor('Negombo / Kepungoda', 'Gampaha', 'Western', 7.185, 79.832),
    CoastalAnchor('Panadura / Wadduwa', 'Kalutara', 'Western', 6.688, 79.914),
    CoastalAnchor('Kalutara / Beruwala / Aluthgama', 'Kalutara', 'Western', 6.510, 79.976),
    CoastalAnchor('Wennappuwa / Chilaw', 'Puttalam', 'North Western', 7.495, 79.808),
    CoastalAnchor('Mundalama / Kalpitiya', 'Puttalam', 'North Western', 8.180, 79.720),
    CoastalAnchor('Mannar Island / Vankalai', 'Mannar', 'Northern', 8.980, 79.885),
    CoastalAnchor('Valaipadu / Poonakary', 'Kilinochchi', 'Northern', 9.470, 80.080),
    CoastalAnchor('Delft / Kayts / Jaffna', 'Jaffna', 'Northern', 9.640, 79.860),
    CoastalAnchor('Mullaitivu Coast', 'Mullaitivu', 'Northern', 9.267, 80.814),
    CoastalAnchor('Trincomalee / Pigeon Island', 'Trincomalee', 'Eastern', 8.610, 81.225),
    CoastalAnchor('Vakarai / Batticaloa', 'Batticaloa', 'Eastern', 7.750, 81.690),
    CoastalAnchor('Kalmunai / Arugam Bay / Pottuvil', 'Ampara', 'Eastern', 7.040, 81.845),
    CoastalAnchor('Palatupana / Hambantota / Kudawella', 'Hambantota', 'Southern', 6.124, 81.119),
    CoastalAnchor('Dikwella / Matara / Mirissa / Weligama', 'Matara', 'Southern', 5.950, 80.520),
    CoastalAnchor('Galle / Hikkaduwa / Kosgoda / Bentota', 'Galle', 'Southern', 6.160, 80.105),
  ];

  static double haversineKm(double lat1, double lon1, double lat2, double lon2) {
    const r = 6371.0;
    final dLat = (lat2 - lat1) * pi / 180.0;
    final dLon = (lon2 - lon1) * pi / 180.0;
    final a = sin(dLat / 2) * sin(dLat / 2) +
        cos(lat1 * pi / 180.0) * cos(lat2 * pi / 180.0) * sin(dLon / 2) * sin(dLon / 2);
    return 2 * r * atan2(sqrt(a), sqrt(1 - a));
  }

  static String compassBearing(double lat1, double lon1, double lat2, double lon2) {
    final rLat1 = lat1 * pi / 180.0;
    final rLat2 = lat2 * pi / 180.0;
    final dLon = (lon2 - lon1) * pi / 180.0;
    final y = sin(dLon) * cos(rLat2);
    final x = cos(rLat1) * sin(rLat2) - sin(rLat1) * cos(rLat2) * cos(dLon);
    final deg = ((atan2(y, x) * 180.0 / pi) + 360.0) % 360.0;
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[((deg / 45.0).round()) % 8];
  }

  static GeoValidationResult validateSriLankaCoords(double lat, double lon) {
    final inBounds = lat >= 4.5 && lat <= 10.6 && lon >= 78.2 && lon <= 83.4;
    var nearest = anchors.first;
    var minDist = double.infinity;

    for (final a in anchors) {
      final d = haversineKm(lat, lon, a.lat, a.lon);
      if (d < minDist) {
        minDist = d;
        nearest = a;
      }
    }

    final distRounded = double.parse(minDist.toStringAsFixed(2));
    final bearing = compassBearing(nearest.lat, nearest.lon, lat, lon);

    if (!inBounds) {
      return GeoValidationResult(
        valid: false,
        zone: 'Outside Sri Lanka EEZ',
        district: nearest.district,
        province: nearest.province,
        nearestAnchor: nearest.name,
        distanceKm: distRounded,
        bearing: bearing,
        message: 'GPS outside Sri Lanka sea bounds. Retry in open sky.',
      );
    }

    final zone = minDist > 22.2
        ? 'Offshore EEZ (>12 NM)'
        : (minDist > 3.0 ? 'Nearshore Fishing Sea (0–12 NM)' : 'Coastal / Beach');

    return GeoValidationResult(
      valid: true,
      zone: zone,
      district: nearest.district,
      province: nearest.province,
      nearestAnchor: nearest.name,
      distanceKm: distRounded,
      bearing: bearing,
      message: '${nearest.district} (${nearest.province}) • $distRounded km $bearing of ${nearest.name}',
    );
  }

  static String accuracyLabel(double accMeters) {
    if (accMeters <= 15) return 'Excellent Satellite GPS (±${accMeters.round()}m)';
    if (accMeters <= 50) return 'Good Sea GPS (±${accMeters.round()}m)';
    if (accMeters <= 250) return 'Moderate Fix (±${accMeters.round()}m)';
    return 'Coarse Tower Fix (±${accMeters.round()}m) — Move to Open Deck';
  }

  static String encodeSmsBeacon({
    required String clientUuid,
    required double lat,
    required double lon,
    required double accuracyM,
    required DateTime observedUtc,
    required String eventType,
    required String taxonGroup,
    required String conditionStatus,
    required int count,
    bool netHazard = false,
    bool oilHazard = false,
    bool plasticHazard = false,
  }) {
    const evtMap = {
      'Live stranded animal': 'LIVE',
      'Entangled animal': 'ENT',
      'Dead animal': 'DEAD',
      'Injured animal': 'INJ',
      'Oil pollution': 'OIL',
      'Ghost net': 'NET',
    };
    const taxMap = {
      'Sea turtle': 'TRT',
      'Dolphin': 'DLP',
      'Whale': 'WHL',
      'Dugong': 'DUG',
      'Fish': 'FSH',
      'Not animal-related': 'ENV',
    };
    const condMap = {
      'Alive': 'A',
      'Entangled': 'E',
      'Injured': 'I',
      'Dead': 'D',
    };

    final id8 = clientUuid.replaceAll('-', '').substring(0, 8).toUpperCase();
    String p2(int v) => v.toString().padLeft(2, '0');
    final ts =
        '${observedUtc.year.toString().substring(2)}${p2(observedUtc.month)}${p2(observedUtc.day)}${p2(observedUtc.hour)}${p2(observedUtc.minute)}Z';
    final flags = '${netHazard ? 'N' : ''}${oilHazard ? 'O' : ''}${plasticHazard ? 'P' : ''}';
    final fStr = flags.isEmpty ? '0' : flags;

    return 'MIIS1|$id8|${lat.toStringAsFixed(5)},${lon.toStringAsFixed(5)}|A${accuracyM.round()}|$ts|${evtMap[eventType] ?? 'OTH'}|${taxMap[taxonGroup] ?? 'UNK'}|${condMap[conditionStatus] ?? 'U'}|Q$count|F$fStr';
  }
}
