import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';
import '../data/constants.dart';
import '../services/maritime_geo.dart';
import '../services/offline_sync_service.dart';
import '../state/app_scope.dart';
import '../theme/miis_theme.dart';
import '../widgets/miis_widgets.dart';
import 'join_screen.dart';

/// Offline-first, trilingual, zero-login incident reporter aligned to the MIIS web palette.
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
  final bool _plasticHazard = false;
  final _notesCtrl = TextEditingController();

  String? _photoBase64;
  String? _photoName;
  int? _photoKb;
  QueuedMaritimeReport? _lastReceipt;

  static const _taxa = [
    ('Sea turtle', '🐢', 'tax.turtle'),
    ('Dolphin', '🐬', 'tax.dolphin'),
    ('Whale', '🐋', 'tax.whale'),
    ('Dugong', '🦭', 'tax.dugong'),
    ('Fish', '🐟', 'tax.fish'),
    ('Not animal-related', '🛢️', 'tax.pollution'),
  ];

  static const _events = [
    ('Live stranded animal', 'ev.liveStranded'),
    ('Entangled animal', 'ev.entangled'),
    ('Dead animal', 'ev.dead'),
    ('Injured animal', 'ev.injured'),
    ('Oil pollution', 'ev.oil'),
    ('Ghost net', 'ev.ghost'),
  ];

  static const _conditions = [
    ('Alive', 'cond.alive'),
    ('Entangled', 'cond.entangled'),
    ('Injured', 'cond.injured'),
    ('Dead', 'cond.dead'),
  ];

  static const _quickKeys = [
    'rep.quick1',
    'rep.quick2',
    'rep.quick3',
    'rep.quick4',
    'rep.quick5',
  ];

  @override
  void dispose() {
    _notesCtrl.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final pre = context.app.takePrefill();
    if (pre != null && pre.isNotEmpty) {
      _taxon = pre;
      _lastReceipt = null;
    }
  }

  Future<void> _lockSatelliteGps() async {
    final app = context.app;
    setState(() => _lockingGps = true);
    try {
      final serviceOn = await Geolocator.isLocationServiceEnabled();
      if (!serviceOn) {
        _showSnack(app.t('rep.gpsOff'));
        return;
      }
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) {
        _showSnack(app.t('rep.gpsPerm'));
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
      _showSnack('${app.t('rep.gpsLocked')} (±${pos.accuracy.round()} m)');
    } catch (_) {
      _showSnack(app.t('rep.gpsTimeout'));
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

  void _appendNote(String chip) {
    final cur = _notesCtrl.text.trim();
    if (cur.contains(chip)) return;
    _notesCtrl.text = cur.isEmpty ? chip : '$cur; $chip';
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

    await OfflineSyncService.upsertReport(report);
    final beaconOk = await OfflineSyncService.syncBeaconPhase(report);
    if (beaconOk && report.photoBase64 != null && !_deferPhotoForHarbour) {
      await OfflineSyncService.syncMediaPhase(report);
    }

    widget.onQueueUpdated();
    if (!mounted) return;
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
    final uri = Uri(scheme: 'sms', path: kSmsGateway, queryParameters: {'body': packet});
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else {
      _showSnack('SMS app unavailable. Packet saved in Outbox.');
    }
  }

  void _showSnack(String msg) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final geo = MaritimeGeoService.validateSriLankaCoords(_lat, _lon);

    if (_lastReceipt != null) {
      final r = _lastReceipt!;
      final synced = r.beaconStatus == 'synced';
      return ListView(
        padding: const EdgeInsets.all(16),
        children: [
          MiisCard(
            borderColor: synced ? MiisColors.emerald : MiisColors.amber,
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      synced ? Icons.check_circle : Icons.offline_pin,
                      color: synced ? MiisColors.emerald : MiisColors.amber,
                      size: 36,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        synced ? app.t('rep.sent') : app.t('rep.saved'),
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  synced
                      ? '${app.t('rep.ref')}: ${r.serverIncidentId}\n${r.district} (${r.province}) • ${r.latitude.toStringAsFixed(5)}, ${r.longitude.toStringAsFixed(5)}'
                      : app.t('rep.savedSub'),
                  style: const TextStyle(color: MiisColors.muted, height: 1.45),
                ),
                if (r.mediaStatus == 'deferred_for_harbour') ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: MiisColors.bg,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: MiisColors.line),
                    ),
                    child: Text(
                      '${app.t('rep.photoHeld')} (${r.photoKb ?? 0} KB)',
                      style: const TextStyle(color: MiisColors.amberSoft, fontSize: 12.5),
                    ),
                  ),
                ],
                const SizedBox(height: 18),
                if (!synced) ...[
                  MiisButton(
                    label: '${app.t('rep.sms')} (${r.smsPacket.length})',
                    icon: Icons.sms_outlined,
                    onPressed: () => _launchSmsFallback(r.smsPacket),
                  ),
                  const SizedBox(height: 10),
                ],
                MiisButton(
                  label: app.t('rep.another'),
                  outlined: !synced,
                  onPressed: () => setState(() => _lastReceipt = null),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return ListView(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
      children: [
        // Guided language bar + safety notice
        MiisCard(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(
            children: [
              const Icon(Icons.language, size: 18, color: MiisColors.amber),
              const SizedBox(width: 8),
              Expanded(
                child: Text(app.t('rep.guided'),
                    style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
              ),
              const LanguageChips(),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4),
          child: Text(app.t('rep.safety'),
              style: const TextStyle(fontSize: 12, color: MiisColors.muted, height: 1.35)),
        ),
        const SizedBox(height: 14),

        // 1. SATELLITE GPS CARD
        MiisCard(
          borderColor: geo.valid ? MiisColors.line : Colors.redAccent,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(Icons.satellite_alt, color: MiisColors.amber, size: 20),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(app.t('rep.step1'),
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15.5)),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(app.t('rep.step1Help'),
                  style: const TextStyle(fontSize: 12.5, color: MiisColors.muted, height: 1.4)),
              const SizedBox(height: 12),
              MiisButton(
                label: _lockingGps ? app.t('rep.locking') : app.t('rep.lock'),
                icon: Icons.my_location,
                dense: true,
                onPressed: _lockingGps ? null : _lockSatelliteGps,
              ),
              const SizedBox(height: 10),
              Text(
                '${_lat.toStringAsFixed(5)}°N, ${_lon.toStringAsFixed(5)}°E • ${MaritimeGeoService.accuracyLabel(_accM)}',
                style: const TextStyle(fontFamily: 'monospace', fontSize: 12, color: MiisColors.teal),
              ),
              const SizedBox(height: 3),
              Text(geo.message, style: const TextStyle(fontSize: 12, color: MiisColors.muted)),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // 2. OBSERVATION SELECTION
        Text(app.t('rep.step2'), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15.5)),
        const SizedBox(height: 4),
        Text(app.t('rep.step2Help'), style: const TextStyle(fontSize: 12.5, color: MiisColors.muted)),
        const SizedBox(height: 10),
        GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          childAspectRatio: 1.15,
          children: _taxa.map((item) {
            final selected = _taxon == item.$1;
            return InkWell(
              onTap: () => setState(() => _taxon = item.$1),
              borderRadius: BorderRadius.circular(14),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                decoration: BoxDecoration(
                  color: selected ? MiisColors.amber.withValues(alpha: 0.16) : MiisColors.panel,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: selected ? MiisColors.amber : MiisColors.line,
                    width: selected ? 1.5 : 1,
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(item.$2, style: const TextStyle(fontSize: 24)),
                    const SizedBox(height: 4),
                    Text(
                      app.t(item.$3),
                      maxLines: 2,
                      textAlign: TextAlign.center,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 11.5,
                        fontWeight: FontWeight.w700,
                        color: selected ? Colors.white : MiisColors.muted,
                      ),
                    ),
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
            final sel = _event == ev.$1;
            return ChoiceChip(
              label: Text(app.t(ev.$2),
                  style: TextStyle(fontSize: 12, color: sel ? MiisColors.bg : Colors.white, fontWeight: FontWeight.w600)),
              selected: sel,
              showCheckmark: false,
              selectedColor: MiisColors.amber,
              backgroundColor: MiisColors.panel,
              side: BorderSide(color: sel ? MiisColors.amber : MiisColors.line),
              shape: const StadiumBorder(),
              onSelected: (_) => setState(() {
                _event = ev.$1;
                _netHazard = ev.$1 == 'Entangled animal' || ev.$1 == 'Ghost net';
                _oilHazard = ev.$1 == 'Oil pollution';
              }),
            );
          }).toList(),
        ),

        const SizedBox(height: 12),
        Row(
          children: _conditions.map((c) {
            final sel = _condition == c.$1;
            return Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 3),
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    backgroundColor: sel ? MiisColors.amber : MiisColors.panel,
                    foregroundColor: sel ? MiisColors.bg : Colors.white,
                    side: BorderSide(color: sel ? MiisColors.amber : MiisColors.line),
                    padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 4),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  onPressed: () => setState(() => _condition = c.$1),
                  child: Text(
                    app.t(c.$2),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            );
          }).toList(),
        ),
        const SizedBox(height: 10),
        MiisCard(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          child: Row(
            children: [
              Text(app.t('rep.count'), style: const TextStyle(fontWeight: FontWeight.w700)),
              const Spacer(),
              IconButton(
                onPressed: _count > 1 ? () => setState(() => _count--) : null,
                icon: const Icon(Icons.remove_circle_outline),
              ),
              Text('$_count', style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w800, color: MiisColors.amber)),
              IconButton(
                onPressed: _count < 500 ? () => setState(() => _count++) : null,
                icon: const Icon(Icons.add_circle_outline),
              ),
            ],
          ),
        ),

        const SizedBox(height: 14),

        // 3. OPTIONAL PHOTO & GUIDED QUICK NOTES
        MiisCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Expanded(
                    child: Text(app.t('rep.step3'),
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5)),
                  ),
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: MiisColors.amber,
                      side: const BorderSide(color: MiisColors.line),
                      shape: const StadiumBorder(),
                    ),
                    onPressed: _capturePhoto,
                    icon: const Icon(Icons.camera_alt_outlined, size: 17),
                    label: Text(_photoKb != null ? '$_photoKb KB ✓' : app.t('rep.camera')),
                  ),
                ],
              ),
              SwitchListTile(
                dense: true,
                contentPadding: EdgeInsets.zero,
                title: Text(app.t('rep.hold'), style: const TextStyle(fontSize: 12.5)),
                subtitle: Text(app.t('rep.holdSub'),
                    style: const TextStyle(fontSize: 11, color: MiisColors.faint)),
                value: _deferPhotoForHarbour,
                activeThumbColor: MiisColors.amber,
                onChanged: (v) => setState(() => _deferPhotoForHarbour = v),
              ),
              const SizedBox(height: 6),
              Text(app.t('rep.quickLabel'),
                  style: const TextStyle(fontSize: 11.5, color: MiisColors.faint)),
              const SizedBox(height: 6),
              Wrap(
                spacing: 6,
                runSpacing: 6,
                children: _quickKeys.map((k) {
                  final txt = app.t(k);
                  return ActionChip(
                    label: Text('+ $txt', style: const TextStyle(fontSize: 11.5)),
                    backgroundColor: MiisColors.bg,
                    side: const BorderSide(color: MiisColors.line),
                    shape: const StadiumBorder(),
                    onPressed: () => _appendNote(txt),
                  );
                }).toList(),
              ),
              const SizedBox(height: 10),
              TextField(
                controller: _notesCtrl,
                maxLines: 2,
                decoration: InputDecoration(
                  hintText: app.t('rep.noteHint'),
                  fillColor: MiisColors.bg,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 18),

        // 4. SUBMIT BUTTON
        MiisButton(
          label: _submitting ? app.t('rep.sending') : app.t('rep.submit'),
          icon: Icons.send,
          onPressed: _submitting ? null : _submitReport,
        ),
      ],
    );
  }
}
