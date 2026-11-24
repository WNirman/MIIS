import 'package:flutter_test/flutter_test.dart';
import 'package:miis_fisher_app/services/maritime_geo.dart';

void main() {
  test('Sri Lanka EEZ geofence resolves district and encodes <130-char 2G SMS', () {
    final geo = MaritimeGeoService.validateSriLankaCoords(7.1205, 79.8012);
    expect(geo.valid, true);
    expect(geo.district, 'Gampaha');
    expect(geo.province, 'Western');

    final sms = MaritimeGeoService.encodeSmsBeacon(
      clientUuid: 'a4f91c02-0000-4000-8000-000000000000',
      lat: 7.1205,
      lon: 79.8012,
      accuracyM: 12,
      observedUtc: DateTime.utc(2026, 11, 24, 8, 15),
      eventType: 'Entangled animal',
      taxonGroup: 'Sea turtle',
      conditionStatus: 'Entangled',
      count: 1,
      netHazard: true,
    );
    expect(sms.length < 130, true);
    expect(sms.startsWith('MIIS1|A4F91C02|7.12050,79.80120|'), true);
  });
}
