import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class QueuedMaritimeReport {
  final String clientUuid;
  final String observedAt;
  final double latitude;
  final double longitude;
  final double gpsAccuracyM;
  final String province;
  final String district;
  final String maritimeZone;
  final double distanceKm;
  final String locationName;
  final String eventType;
  final String taxonGroup;
  final String conditionStatus;
  final int numberObserved;
  final bool pollutionNet;
  final bool pollutionOil;
  final bool pollutionPlastic;
  final String notes;
  final String smsPacket;
  final String? photoBase64;
  final String? photoFilename;
  final int? photoKb;

  String beaconStatus; // 'queued' | 'synced'
  String mediaStatus; // 'none' | 'deferred_for_harbour' | 'synced'
  String? serverIncidentId;
  String? lastError;

  QueuedMaritimeReport({
    required this.clientUuid,
    required this.observedAt,
    required this.latitude,
    required this.longitude,
    required this.gpsAccuracyM,
    required this.province,
    required this.district,
    required this.maritimeZone,
    required this.distanceKm,
    required this.locationName,
    required this.eventType,
    required this.taxonGroup,
    required this.conditionStatus,
    required this.numberObserved,
    required this.pollutionNet,
    required this.pollutionOil,
    required this.pollutionPlastic,
    required this.notes,
    required this.smsPacket,
    this.photoBase64,
    this.photoFilename,
    this.photoKb,
    this.beaconStatus = 'queued',
    this.mediaStatus = 'none',
    this.serverIncidentId,
    this.lastError,
  });

  Map<String, dynamic> toJson() => {
        'client_uuid': clientUuid,
        'observed_at': observedAt,
        'latitude': latitude,
        'longitude': longitude,
        'gps_accuracy_m': gpsAccuracyM,
        'province': province,
        'district': district,
        'maritime_zone': maritimeZone,
        'distance_to_coast_km': distanceKm,
        'location_name': locationName,
        'event_type': eventType,
        'taxon_group': taxonGroup,
        'condition_status': conditionStatus,
        'number_observed': numberObserved,
        'pollution_net': pollutionNet,
        'pollution_oil': pollutionOil,
        'pollution_plastic': pollutionPlastic,
        'notes': notes,
        'sms_packet': smsPacket,
        'photo_base64': photoBase64,
        'photo_filename': photoFilename,
        'photo_kb': photoKb,
        'beacon_status': beaconStatus,
        'media_status': mediaStatus,
        'server_incident_id': serverIncidentId,
        'last_error': lastError,
      };

  factory QueuedMaritimeReport.fromJson(Map<String, dynamic> j) => QueuedMaritimeReport(
        clientUuid: j['client_uuid'],
        observedAt: j['observed_at'],
        latitude: (j['latitude'] as num).toDouble(),
        longitude: (j['longitude'] as num).toDouble(),
        gpsAccuracyM: (j['gps_accuracy_m'] as num).toDouble(),
        province: j['province'] ?? 'Western',
        district: j['district'] ?? 'Colombo',
        maritimeZone: j['maritime_zone'] ?? 'Coastal',
        distanceKm: (j['distance_to_coast_km'] as num?)?.toDouble() ?? 0,
        locationName: j['location_name'] ?? '',
        eventType: j['event_type'] ?? 'Entangled animal',
        taxonGroup: j['taxon_group'] ?? 'Sea turtle',
        conditionStatus: j['condition_status'] ?? 'Alive',
        numberObserved: j['number_observed'] ?? 1,
        pollutionNet: j['pollution_net'] ?? false,
        pollutionOil: j['pollution_oil'] ?? false,
        pollutionPlastic: j['pollution_plastic'] ?? false,
        notes: j['notes'] ?? '',
        smsPacket: j['sms_packet'] ?? '',
        photoBase64: j['photo_base64'],
        photoFilename: j['photo_filename'],
        photoKb: j['photo_kb'],
        beaconStatus: j['beacon_status'] ?? 'queued',
        mediaStatus: j['media_status'] ?? 'none',
        serverIncidentId: j['server_incident_id'],
        lastError: j['last_error'],
      );
}

class OfflineSyncService {
  static const _queueKey = 'miis_flutter_sea_queue_v1';
  static const _serverUrlKey = 'miis_flutter_server_url_v1';
  static String get defaultServerUrl => kIsWeb ? 'http://localhost:5000' : 'http://172.26.102.34:5000';

  static String generateUuid() {
    final rng = Random.secure();
    String hex(int n) => List.generate(n, (_) => rng.nextInt(16).toRadixString(16)).join();
    return '${hex(8)}-${hex(4)}-4${hex(3)}-${hex(4)}-${hex(12)}';
  }

  static Future<String> getServerUrl() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_serverUrlKey) ?? defaultServerUrl;
  }

  static Future<void> setServerUrl(String url) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_serverUrlKey, url.trim().replaceAll(RegExp(r'/+$'), ''));
  }

  static Future<List<QueuedMaritimeReport>> loadQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_queueKey);
    if (raw == null || raw.isEmpty) return [];
    final List decoded = jsonDecode(raw);
    return decoded.map((e) => QueuedMaritimeReport.fromJson(e)).toList();
  }

  static Future<void> _saveQueue(List<QueuedMaritimeReport> list) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_queueKey, jsonEncode(list.map((e) => e.toJson()).toList()));
  }

  static Future<void> upsertReport(QueuedMaritimeReport report) async {
    final list = await loadQueue();
    final idx = list.indexWhere((r) => r.clientUuid == report.clientUuid);
    if (idx >= 0) {
      list[idx] = report;
    } else {
      list.insert(0, report);
    }
    await _saveQueue(list);
  }

  static Future<void> removeReport(String clientUuid) async {
    final list = await loadQueue();
    list.removeWhere((r) => r.clientUuid == clientUuid);
    await _saveQueue(list);
  }

  /// Phase 1: Ultra-lightweight <500 B Geo-Beacon over marginal 2G sea link.
  static Future<bool> syncBeaconPhase(QueuedMaritimeReport report) async {
    final baseUrl = await getServerUrl();
    final payload = {
      'client_uuid': report.clientUuid,
      'observed_at': report.observedAt,
      'gps_locked_at': report.observedAt,
      'latitude': report.latitude,
      'longitude': report.longitude,
      'gps_accuracy_m': report.gpsAccuracyM,
      'province': report.province,
      'district': report.district,
      'maritime_zone': report.maritimeZone,
      'distance_to_coast_km': report.distanceKm,
      'location_name': report.locationName,
      'event_type': report.eventType,
      'taxon_group': report.taxonGroup,
      'condition_status': report.conditionStatus,
      'number_observed': report.numberObserved,
      'pollution_net': report.pollutionNet,
      'pollution_oil': report.pollutionOil,
      'pollution_plastic': report.pollutionPlastic,
      'notes': report.notes,
      'has_deferred_media': report.photoBase64 != null,
      'location_source': 'Flutter Native Hardware GNSS',
      'reporter_role': 'Fisher (Flutter Mobile App)',
    };

    try {
      final resp = await http
          .post(
            Uri.parse('$baseUrl/api/reports/beacon'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(payload),
          )
          .timeout(const Duration(seconds: 8));

      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body);
        if (data['success'] == true) {
          report.beaconStatus = 'synced';
          report.serverIncidentId = data['incident_id'];
          report.lastError = null;
          await upsertReport(report);
          return true;
        }
      }
      report.lastError = 'HTTP ${resp.statusCode}';
      await upsertReport(report);
      return false;
    } catch (e) {
      report.lastError = 'Weak/No Signal (Saved Offline)';
      await upsertReport(report);
      return false;
    }
  }

  /// Phase 2: Upload compressed photo once back in harbour Wi-Fi / 4G.
  static Future<bool> syncMediaPhase(QueuedMaritimeReport report) async {
    if (report.photoBase64 == null) return true;
    final baseUrl = await getServerUrl();

    try {
      final resp = await http
          .post(
            Uri.parse('$baseUrl/api/reports/${report.clientUuid}/media'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'client_uuid': report.clientUuid,
              'photo_data_url': 'data:image/jpeg;base64,${report.photoBase64}',
              'photo_filename': report.photoFilename ?? 'sea_capture.jpg',
              'photo_kb': report.photoKb,
            }),
          )
          .timeout(const Duration(seconds: 20));

      if (resp.statusCode == 200) {
        final data = jsonDecode(resp.body);
        if (data['success'] == true) {
          report.mediaStatus = 'synced';
          report.lastError = null;
          await upsertReport(report);
          return true;
        }
      }
      return false;
    } catch (_) {
      return false;
    }
  }

  /// Sync all queued beacons (always) and deferred photos (when on Wi-Fi or forced).
  static Future<Map<String, int>> flushQueue({bool includePhotos = true}) async {
    final list = await loadQueue();
    int beacons = 0;
    int photos = 0;
    for (final item in list) {
      if (item.beaconStatus != 'synced') {
        if (await syncBeaconPhase(item)) beacons++;
      }
      if (includePhotos &&
          item.beaconStatus == 'synced' &&
          item.photoBase64 != null &&
          item.mediaStatus != 'synced') {
        if (await syncMediaPhase(item)) photos++;
      }
    }
    return {'beacons': beacons, 'photos': photos};
  }
}
