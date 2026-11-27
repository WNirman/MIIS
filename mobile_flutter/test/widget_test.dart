import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:miis_fisher_app/l10n/app_strings.dart';
import 'package:miis_fisher_app/main.dart';
import 'package:miis_fisher_app/services/maritime_geo.dart';
import 'package:miis_fisher_app/state/app_state.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  setUpAll(() {
    GoogleFonts.config.allowRuntimeFetching = false;
  });

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

  test('All AppStrings keys provide non-empty English, Sinhala, and Tamil values', () {
    expect(AppStrings.keys.length, greaterThan(100));
    for (final key in AppStrings.keys) {
      final entry = AppStrings.entry(key)!;
      expect(entry.length, 3, reason: 'Key "$key" must have 3 language entries');
      for (var i = 0; i < 3; i++) {
        expect(entry[i].trim().isNotEmpty, true, reason: 'Empty translation for "$key" lang=$i');
      }
    }
  });

  testWidgets('First launch asks preferred language and enters Join screen', (tester) async {
    tester.view.physicalSize = const Size(412, 915);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    SharedPreferences.setMockInitialValues({});
    final state = AppState()..ready = true;
    await tester.pumpWidget(MiisMobileApp(initialState: state));
    await tester.pump();

    expect(find.text('Select your preferred language'), findsOneWidget);
    expect(find.text('සිංහල'), findsOneWidget);
    expect(find.text('தமிழ்'), findsOneWidget);

    await tester.tap(find.text('English'));
    await tester.pump();
    expect(find.text('Join MIIS Sri Lanka'), findsOneWidget);

    await tester.ensureVisible(find.text('Report without an account'));
    await tester.pump();
    await tester.tap(find.text('Report without an account'));
    await tester.pump();
    expect(find.byType(NavigationBar), findsOneWidget);
  });
}
