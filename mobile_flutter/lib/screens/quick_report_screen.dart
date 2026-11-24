import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/maritime_geo.dart';
import '../services/offline_sync_service.dart';

class QuickReportScreen extends StatefulWidget {
  final VoidCallback onQueueUpdated;
  const QuickReportScreen({super.key, required this.onQueueUpdated});

  @override
  State<QuickReportScreen> createState() => _QuickReportScreenState();
}

class _QuickReportScreenState extends State<QuickReportScreen> {
  double _lat = 7.1205;
  double _lon = 79.8012;
  double _accM = 15.0;
  DateTime _gpsLockedAt = DateTime.now().toUtc();
  bool _lockingGps = false;
  bool _submitting = false;
  bool _deferPhotoForHarbour = true;

  String _taxon = 'Sea turtle';
  String _event = 'Entangled animal';
  String _condition = 'Alive';
  int _count = 1;
  bool _netHazard = true;
  bool _oilHazard = false;
  bool _plasticHazard = false;
  final _notesCtrl = TextEditingController();

  String? _photoBase64;
  String? _photoName;
  int? _photoKb;
  QueuedMaritimeReport? _lastReceipt;

  static const _taxa = [
    ('Sea turtle', '🐢', 'Turtle'),
    ('Dolphin', '🐬', 'Dolphin'),
    ('Whale', '🐋', 'Whale'),
    ('Dugong', '🦭', 'Dugong'),
    ('Fish', '🐟', 'Fish Kill'),
    ('Not animal-related', '🛢️', 'Oil / Net'),
  ];

  static const _events = [
    'Live stranded animal',
    'Entangled animal',
    'Dead animal',
    'Injured animal',
    'Oil pollution',
    'Ghost net',
  ];

  static const _conditions = ['Alive', 'Entangled', 'Injured', 'Dead'];

  Future<void> _lockSatelliteGps() async {
    setState(() => _lockingGps = true);
    try {
      final serviceOn = await Geolocator.isLocationServiceEnabled();
      if (!serviceOn) {
        _showSnack('Turn on phone GPS / Location in settings (works offline at sea!).');
        return;
      }
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        _showSnack('GPS permission required to lock exact sea coordinates.');
        return;
      }

      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.bestForNavigation,
          timeLimit: Duration(seconds: 12),
        ),
      );
      setState(() {
        _lat = double.parse(pos.latitude.toStringAsFixed(6));
        _lon = double.parse(pos.longitude.toStringAsFixed(6));
        _accM = pos.accuracy;
        _gpsLockedAt = DateTime.now().toUtc();
      });
      _showSnack('Satellite GPS locked (±${pos.accuracy.round()} m)');
    } catch (e) {
      _showSnack('GPS fix timeout — step onto open deck & retry.');
    } finally {
      if (mounted) setState(() => _lockingGps = false);
    }
  }

  Future<void> _capturePhoto() async {
    final picker = ImagePicker();
    final xfile = await picker.pickImage(
      source: ImageSource.camera,
      maxWidth: 1280,
      imageQuality: 72,
    );
    if (xfile == null) return;
    final bytes = await xfile.readAsBytes();
    setState(() {
      _photoBase64 = base64Encode(bytes);
      _photoName = xfile.name;
      _photoKb = (bytes.length / 1024).round();
    });
  }

  Future<void> _submitReport() async {
    final geo = MaritimeGeoService.validateSriLankaCoords(_lat, _lon);
    if (!geo.valid) {
      _showSnack(geo.message);
      return;
    }

    setState(() => _submitting = true);
    final uuid = OfflineSyncService.generateUuid();
    final smsPacket = MaritimeGeoService.encodeSmsBeacon(
      clientUuid: uuid,
      lat: _lat,
      lon: _lon,
      accuracyM: _accM,
      observedUtc: _gpsLockedAt,
      eventType: _event,
      taxonGroup: _taxon,
      conditionStatus: _condition,
      count: _count,
      netHazard: _netHazard,
      oilHazard: _oilHazard,
      plasticHazard: _plasticHazard,
    );

    final report = QueuedMaritimeReport(
      clientUuid: uuid,
      observedAt: _gpsLockedAt.toIso8601String(),
      latitude: _lat,
      longitude: _lon,
      gpsAccuracyM: _accM,
      province: geo.province,
      district: geo.district,
      maritimeZone: geo.zone,
      distanceKm: geo.distanceKm,
      locationName: '${geo.distanceKm} km ${geo.bearing} of ${geo.nearestAnchor}',
      eventType: _event,
      taxonGroup: _taxon,
      conditionStatus: _condition,
      numberObserved: _count,
      pollutionNet: _netHazard,
      pollutionOil: _oilHazard,
      pollutionPlastic: _plasticHazard,
      notes: _notesCtrl.text.trim(),
      smsPacket: smsPacket,
      photoBase64: _photoBase64,
      photoFilename: _photoName,
      photoKb: _photoKb,
      beaconStatus: 'queued',
      mediaStatus: _photoBase64 != null ? 'deferred_for_harbour' : 'none',
    );

    // 1. Always persist offline first so sea sighting is NEVER lost
    await OfflineSyncService.upsertReport(report);

    // 2. Phase 1: Send tiny <500 B Geo-Beacon immediately
    final beaconOk = await OfflineSyncService.syncBeaconPhase(report);

    // 3. Phase 2: Send photo now only if user unchecked "Hold photo for harbour"
    if (beaconOk && report.photoBase64 != null && !_deferPhotoForHarbour) {
      await OfflineSyncService.syncMediaPhase(report);
    }

    widget.onQueueUpdated();
    setState(() {
      _lastReceipt = report;
      _photoBase64 = null;
      _photoName = null;
      _photoKb = null;
      _notesCtrl.clear();
      _submitting = false;
    });
  }

  Future<void> _launchSmsFallback(String packet) async {
    final uri = Uri(scheme: 'sms', path: '+94112888555', queryParameters: {'body': packet});
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      _showSnack('SMS app unavailable. Packet copied in Outbox.');
    }
  }

  void _showSnack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    final geo = MaritimeGeoService.validateSriLankaCoords(_lat, _lon);

    if (_lastReceipt != null) {
      final r = _lastReceipt!;
      return ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            color: const Color(0xFF0E233A),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(20),
              side: const BorderSide(color: Color(0xFF10B981), width: 1.5),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.check_circle, color: Color(0xFF10B981), size: 36),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          r.beaconStatus == 'synced'
                              ? 'GPS Geo-Beacon Sent!'
                              : 'Saved Safely Offline!',
                          style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    r.beaconStatus == 'synced'
                        ? 'Ref: ${r.serverIncidentId}\n${r.district} (${r.province}) • ${r.latitude.toStringAsFixed(5)}, ${r.longitude.toStringAsFixed(5)}'
                        : 'No internet detected. Your GPS & timestamp are saved locally and can be sent right now via 2G SMS.',
                    style: const TextStyle(color: Colors.white70, height: 1.4),
                  ),
                  if (r.mediaStatus == 'deferred_for_harbour') ...[
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF2E1A47),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'Photo (${r.photoKb} KB) is held safely on-device. Open the Outbox tab at harbour Wi-Fi/4G to upload.',
                        style: const TextStyle(color: Color(0xFFD8B4FE), fontSize: 12),
                      ),
                    ),
                  ],
                  const SizedBox(height: 16),
                  if (r.beaconStatus != 'synced')
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFF59E0B),
                          foregroundColor: Colors.black,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                        onPressed: () => _launchSmsFallback(r.smsPacket),
                        icon: const Icon(Icons.sms),
                        label: Text('Send 2G SMS Beacon (${r.smsPacket.length} chars)'),
                      ),
                    ),
                  const SizedBox(height: 10),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF22D3EE),
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                      onPressed: () => setState(() => _lastReceipt = null),
                      child: const Text('Report Another Incident', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(14, 12, 14, 24),
      children: [
        // 1. SATELLITE GPS LOCK CARD
        Card(
          color: const Color(0xFF0D2036),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(18),
            side: BorderSide(color: geo.valid ? const Color(0xFF14B8A6) : Colors.redAccent),
          ),
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.satellite_alt, color: Color(0xFF22D3EE), size: 20),
                    const SizedBox(width: 8),
                    const Expanded(
                      child: Text(
                        '1. Lock Sea / Beach GPS (Offline OK)',
                        style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF22D3EE),
                      foregroundColor: Colors.black,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    onPressed: _lockingGps ? null : _lockSatelliteGps,
                    icon: const Icon(Icons.my_location),
                    label: Text(
                      _lockingGps ? 'LOCKING SATELLITES...' : 'DROP GPS PIN NOW',
                      style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  '${_lat.toStringAsFixed(5)}°N, ${_lon.toStringAsFixed(5)}°E • ${MaritimeGeoService.accuracyLabel(_accM)}',
                  style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: Color(0xFF5EEAD4)),
                ),
                const SizedBox(height: 4),
                Text(geo.message, style: const TextStyle(fontSize: 12, color: Colors.white70)),
              ],
            ),
          ),
        ),

        const SizedBox(height: 12),

        // 2. ANIMAL & INCIDENT BIG TAP GRID
        const Text('2. What Did You See?', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
        const SizedBox(height: 8),
        GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          childAspectRatio: 1.25,
          children: _taxa.map((item) {
            final selected = _taxon == item.$1;
            return InkWell(
              onTap: () => setState(() => _taxon = item.$1),
              borderRadius: BorderRadius.circular(14),
              child: Container(
                decoration: BoxDecoration(
                  color: selected ? const Color(0xFF134E4A) : const Color(0xFF0D2036),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: selected ? const Color(0xFF2DD4BF) : Colors.white12, width: 1.5),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(item.$2, style: const TextStyle(fontSize: 26)),
                    const SizedBox(height: 4),
                    Text(item.$3, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            );
          }).toList(),
        ),

        const SizedBox(height: 12),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: _events.map((ev) {
            final sel = _event == ev;
            return ChoiceChip(
              label: Text(ev, style: TextStyle(fontSize: 12, color: sel ? Colors.black : Colors.white)),
              selected: sel,
              selectedColor: const Color(0xFF22D3EE),
              backgroundColor: const Color(0xFF0D2036),
              onSelected: (_) => setState(() => _event = ev),
            );
          }).toList(),
        ),

        const SizedBox(height: 10),
        Row(
          children: _conditions.map((c) {
            final sel = _condition == c;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 3),
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    backgroundColor: sel ? const Color(0xFFF59E0B) : const Color(0xFF0D2036),
                    foregroundColor: sel ? Colors.black : Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  onPressed: () => setState(() => _condition = c),
                  child: Text(c, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800)),
                ),
              ),
            );
          }).toList(),
        ),

        const SizedBox(height: 12),

        // 3. OPTIONAL PHOTO (DEFERRED FOR HARBOUR)
        Card(
          color: const Color(0xFF0D2036),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: Text('3. Photo (Sent Later at Harbour)', style: TextStyle(fontWeight: FontWeight.w800)),
                    ),
                    ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1E293B),
                        foregroundColor: const Color(0xFF22D3EE),
                      ),
                      onPressed: _capturePhoto,
                      icon: const Icon(Icons.camera_alt, size: 18),
                      label: Text(_photoKb != null ? '${_photoKb} KB ✓' : 'Camera'),
                    ),
                  ],
                ),
                SwitchListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  title: const Text('Hold photo until harbour Wi-Fi/4G', style: TextStyle(fontSize: 12)),
                  subtitle: const Text('Sends tiny <500 B GPS beacon first on weak sea signal', style: TextStyle(fontSize: 11, color: Colors.white54)),
                  value: _deferPhotoForHarbour,
                  activeColor: const Color(0xFF22D3EE),
                  onChanged: (v) => setState(() => _deferPhotoForHarbour = v),
                ),
                TextField(
                  controller: _notesCtrl,
                  decoration: InputDecoration(
                    hintText: 'Optional note (e.g. gillnet wrapped on flipper)',
                    filled: true,
                    fillColor: const Color(0xFF061120),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                    isDense: true,
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // 4. BIG SUBMIT BUTTON
        SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            onPressed: _submitting ? null : _submitReport,
            icon: const Icon(Icons.send),
            label: Text(
              _submitting ? 'SENDING GPS BEACON...' : 'SEND GPS REPORT NOW (NO LOGIN)',
              style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15),
            ),
          ),
        ),
      ],
    );
  }
}
