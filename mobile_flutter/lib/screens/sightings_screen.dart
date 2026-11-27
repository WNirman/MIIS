import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../services/offline_sync_service.dart';
import '../state/app_scope.dart';
import '../theme/miis_theme.dart';
import '../widgets/miis_widgets.dart';

/// Unified sighting row (on-device reports + server records).
class Sighting {
  final String id;
  final String title;
  final String subtitle;
  final String district;
  final String taxon;
  final String event;
  final DateTime? date;
  final double? lat;
  final double? lon;
  final String status;
  final bool synced;
  final bool fromServer;

  const Sighting({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.district,
    required this.taxon,
    required this.event,
    required this.date,
    required this.lat,
    required this.lon,
    required this.status,
    required this.synced,
    required this.fromServer,
  });
}

Color taxonColor(String taxon) {
  final t = taxon.toLowerCase();
  if (t.contains('turtle')) return MiisColors.emerald;
  if (t.contains('dolphin') || t.contains('whale') || t.contains('cetacean') || t.contains('mammal')) return MiisColors.sky;
  if (t.contains('dugong') || t.contains('sirenian')) return MiisColors.amber;
  if (t.contains('fish')) return MiisColors.violet;
  return const Color(0xFFEF4444);
}

class SightingsScreen extends StatefulWidget {
  final int refreshTick;
  final List<QueuedMaritimeReport> queue;
  final bool active;
  const SightingsScreen({super.key, required this.refreshTick, required this.queue, required this.active});

  @override
  State<SightingsScreen> createState() => _SightingsScreenState();
}

class _SightingsScreenState extends State<SightingsScreen> {
  int _view = 0; // 0 list, 1 map
  int _tileIdx = 0; // 0 dark marine, 1 osm, 2 satellite
  final _mapCtrl = MapController();
  final _search = TextEditingController();
  DateTime? _from;
  DateTime? _until;
  bool _loading = false;
  bool _expired = false;
  List<Map<String, dynamic>> _server = [];
  String _lastKey = '';

  static const _tileTemplates = [
    ('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', ['a', 'b', 'c', 'd'], 'map.layerDark'),
    ('https://tile.openstreetmap.org/{z}/{x}/{y}.png', <String>[], 'map.layerOsm'),
    ('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', <String>[], 'map.layerSat'),
  ];

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(covariant SightingsScreen old) {
    super.didUpdateWidget(old);
    if (widget.active && !old.active) _load();
    if (widget.refreshTick != old.refreshTick) _load();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final a = context.app;
    final key = '${a.token}|${a.user?.role}';
    if (key != _lastKey) {
      _lastKey = key;
      _load();
    }
  }

  Future<void> _load() async {
    final app = context.app;
    if (!app.isLoggedIn) {
      setState(() {
        _server = [];
        _expired = false;
      });
      return;
    }
    setState(() => _loading = true);
    final res = await OfflineSyncService.fetchServerSightings(validator: app.isValidator);
    if (!mounted) return;
    if (res == null) {
      app.sessionExpired();
      setState(() {
        _expired = true;
        _server = [];
        _loading = false;
      });
      return;
    }
    setState(() {
      _server = res;
      _expired = false;
      _loading = false;
    });
  }

  DateTime? _parse(dynamic v) => v == null ? null : DateTime.tryParse(v.toString());
  double? _num(dynamic v) => v == null ? null : double.tryParse(v.toString());

  List<Sighting> _build(bool validator) {
    final out = <Sighting>[];
    final seen = <String>{};

    for (final r in _server) {
      if (validator) {
        final id = (r['incident_id'] ?? '').toString();
        if (!seen.add(id)) continue;
        out.add(Sighting(
          id: id,
          title: (r['species_common'] ?? r['taxon_group'] ?? 'Marine incident').toString(),
          subtitle: (r['species_scientific'] ?? '').toString(),
          district: (r['district'] ?? '').toString(),
          taxon: (r['taxon_group'] ?? '').toString(),
          event: (r['event_type'] ?? '').toString(),
          date: _parse(r['event_date'] ?? r['created_at']),
          lat: _num(r['latitude']),
          lon: _num(r['longitude']),
          status: (r['validation_status'] ?? '').toString(),
          synced: true,
          fromServer: true,
        ));
      } else {
        final id = (r['incident_id'] ?? r['client_uuid'] ?? '').toString();
        seen.add((r['client_uuid'] ?? '').toString());
        seen.add(id);
        out.add(Sighting(
          id: id,
          title: (r['taxon_group'] ?? 'Marine incident').toString(),
          subtitle: (r['condition_status'] ?? '').toString(),
          district: (r['district'] ?? '').toString(),
          taxon: (r['taxon_group'] ?? '').toString(),
          event: (r['event_type'] ?? '').toString(),
          date: _parse(r['observed_at']),
          lat: _num(r['latitude']),
          lon: _num(r['longitude']),
          status: (r['beacon_status'] ?? '').toString(),
          synced: (r['beacon_status'] ?? '') == 'synced',
          fromServer: true,
        ));
      }
    }

    if (!validator) {
      for (final q in widget.queue) {
        final id = q.serverIncidentId ?? q.clientUuid;
        if (seen.contains(id) || seen.contains(q.clientUuid)) continue;
        out.add(Sighting(
          id: q.serverIncidentId ?? 'LOCAL-${q.clientUuid.substring(0, 8).toUpperCase()}',
          title: q.taxonGroup,
          subtitle: q.conditionStatus,
          district: q.district,
          taxon: q.taxonGroup,
          event: q.eventType,
          date: DateTime.tryParse(q.observedAt),
          lat: q.latitude,
          lon: q.longitude,
          status: q.beaconStatus,
          synced: q.beaconStatus == 'synced',
          fromServer: false,
        ));
      }
    }

    out.sort((a, b) => (b.date ?? DateTime.fromMillisecondsSinceEpoch(0)).compareTo(a.date ?? DateTime.fromMillisecondsSinceEpoch(0)));
    return out;
  }

  List<Sighting> _filter(List<Sighting> all, String region) {
    final q = _search.text.trim().toLowerCase();
    return all.where((s) {
      if (region.isNotEmpty && s.district.toLowerCase() != region.toLowerCase()) return false;
      if (q.isNotEmpty) {
        final hay = '${s.title} ${s.subtitle} ${s.taxon} ${s.district} ${s.event} ${s.id}'.toLowerCase();
        if (!hay.contains(q)) return false;
      }
      if (_from != null && s.date != null && s.date!.isBefore(_from!)) return false;
      if (_until != null && s.date != null && s.date!.isAfter(_until!.add(const Duration(days: 1)))) return false;
      return true;
    }).toList();
  }

  Future<void> _pickDate(bool from) async {
    final now = DateTime.now();
    final d = await showDatePicker(
      context: context,
      initialDate: (from ? _from : _until) ?? now,
      firstDate: DateTime(2020),
      lastDate: now.add(const Duration(days: 1)),
      builder: (ctx, child) => Theme(
        data: Theme.of(ctx).copyWith(
          colorScheme: const ColorScheme.dark(primary: MiisColors.amber, onPrimary: MiisColors.bg, surface: MiisColors.panel),
        ),
        child: child!,
      ),
    );
    if (d != null) setState(() => from ? _from = d : _until = d);
  }

  String _fmt(DateTime? d) => d == null ? '' : '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';

  void _openDetail(Sighting s) {
    final app = context.app;
    showModalBottomSheet(
      context: context,
      backgroundColor: MiisColors.panel,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => Padding(
        padding: const EdgeInsets.fromLTRB(22, 20, 22, 28),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(s.id, style: const TextStyle(fontFamily: 'monospace', color: MiisColors.amber, fontWeight: FontWeight.w700)),
            const SizedBox(height: 6),
            Text(s.title, style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w700)),
            if (s.subtitle.isNotEmpty)
              Text(s.subtitle, style: const TextStyle(fontStyle: FontStyle.italic, color: MiisColors.muted)),
            const SizedBox(height: 14),
            _kv(app.t('sight.event'), s.event),
            _kv(app.t('sight.district'), s.district),
            _kv(app.t('sight.date'), _fmt(s.date)),
            if (s.lat != null && s.lon != null) _kv(app.t('sight.coords'), '${s.lat!.toStringAsFixed(5)}, ${s.lon!.toStringAsFixed(5)}'),
            _kv(app.t('sight.status'), s.status),
          ],
        ),
      ),
    );
  }

  Widget _kv(String k, String v) {
    if (v.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 108, child: Text(k, style: const TextStyle(color: MiisColors.faint, fontSize: 13))),
          Expanded(child: Text(v, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600))),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final validator = app.isValidator;
    final all = _build(validator);
    final items = _filter(all, app.region);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
          child: Column(
            children: [
              TextField(
                controller: _search,
                onChanged: (_) => setState(() {}),
                decoration: InputDecoration(
                  hintText: app.t('sight.species'),
                  suffixIcon: const Icon(Icons.search, color: MiisColors.muted),
                ),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(child: _dateField(app.t('sight.from'), _from, () => _pickDate(true), () => setState(() => _from = null))),
                  const SizedBox(width: 10),
                  Expanded(child: _dateField(app.t('sight.until'), _until, () => _pickDate(false), () => setState(() => _until = null))),
                ],
              ),
            ],
          ),
        ),
        MiisTabs(
          labels: [app.t('sight.list'), app.t('sight.map')],
          index: _view,
          onChanged: (i) => setState(() => _view = i),
        ),
        Container(
          width: double.infinity,
          color: MiisColors.panelAlt,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              Icon(validator ? Icons.verified_user_outlined : Icons.lock_outline,
                  size: 15, color: validator ? MiisColors.emerald : MiisColors.amber),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  validator ? app.t('sight.noteValidator') : app.t('sight.noteOwn'),
                  style: const TextStyle(fontSize: 11.5, color: MiisColors.muted, height: 1.3),
                ),
              ),
              IconButton(
                tooltip: app.t('sight.refresh'),
                visualDensity: VisualDensity.compact,
                onPressed: _loading ? null : _load,
                icon: _loading
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.refresh, size: 20),
              ),
            ],
          ),
        ),
        if (_expired)
          Container(
            width: double.infinity,
            color: const Color(0x33F59E0B),
            padding: const EdgeInsets.all(10),
            child: Text(app.t('sight.expired'), style: const TextStyle(fontSize: 12, color: MiisColors.amberSoft)),
          ),
        Expanded(child: _view == 0 ? _list(items, app) : _map(items)),
      ],
    );
  }

  Widget _dateField(String label, DateTime? v, VoidCallback onTap, VoidCallback onClear) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: MiisColors.panel,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: MiisColors.line),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: const TextStyle(fontSize: 11, color: MiisColors.faint)),
                  const SizedBox(height: 2),
                  Text(v == null ? '—' : _fmt(v), style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
            if (v != null)
              InkWell(onTap: onClear, child: const Icon(Icons.close, size: 18, color: MiisColors.muted))
            else
              const Icon(Icons.calendar_today_outlined, size: 18, color: MiisColors.muted),
          ],
        ),
      ),
    );
  }

  Widget _list(List<Sighting> items, dynamic app) {
    if (items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.visibility_off_outlined, size: 44, color: MiisColors.faint),
              const SizedBox(height: 12),
              Text(app.t('sight.empty'), textAlign: TextAlign.center, style: const TextStyle(color: MiisColors.muted)),
            ],
          ),
        ),
      );
    }
    return RefreshIndicator(
      color: MiisColors.amber,
      backgroundColor: MiisColors.panel,
      onRefresh: _load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 24),
        itemCount: items.length,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (_, i) {
          final s = items[i];
          final col = taxonColor(s.taxon);
          return MiisCard(
            onTap: () => _openDetail(s),
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                Container(
                  width: 6,
                  height: 46,
                  decoration: BoxDecoration(color: col, borderRadius: BorderRadius.circular(4)),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(s.title, maxLines: 1, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15.5)),
                      const SizedBox(height: 3),
                      Text(
                        [s.event, s.district, _fmt(s.date)].where((e) => e.isNotEmpty).join(' • '),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(color: MiisColors.muted, fontSize: 12.5),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                MiisChip(s.synced ? app.t('sight.sent') : app.t('sight.queued'), color: s.synced ? MiisColors.emerald : MiisColors.amber),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _map(List<Sighting> items) {
    final app = context.app;
    final pts = items.where((s) => s.lat != null && s.lon != null).toList();
    final tile = _tileTemplates[_tileIdx];
    return Stack(
      children: [
        FlutterMap(
          mapController: _mapCtrl,
          options: MapOptions(
            initialCenter: const LatLng(7.85, 80.72),
            initialZoom: 7,
            minZoom: 5,
            maxZoom: 17,
            interactionOptions: const InteractionOptions(flags: InteractiveFlag.all & ~InteractiveFlag.rotate),
          ),
          children: [
            TileLayer(
              key: ValueKey(_tileIdx),
              urlTemplate: tile.$1,
              subdomains: tile.$2,
              userAgentPackageName: 'lk.miis.miis_fisher_app',
            ),
            MarkerLayer(
              markers: [
                for (final s in pts)
                  Marker(
                    point: LatLng(s.lat!, s.lon!),
                    width: 34,
                    height: 34,
                    child: GestureDetector(
                      onTap: () => _openDetail(s),
                      child: Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: taxonColor(s.taxon).withValues(alpha: 0.9),
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                        child: const Icon(Icons.location_on, size: 16, color: MiisColors.bg),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
        // Floating Recenter Sri Lanka & Basemap Layer Switcher (matches reference map controls)
        Positioned(
          top: 12,
          left: 12,
          child: FloatingActionButton.small(
            heroTag: 'miis_map_center',
            backgroundColor: MiisColors.panel,
            foregroundColor: MiisColors.amber,
            onPressed: () => _mapCtrl.move(const LatLng(7.85, 80.72), 7),
            child: const Icon(Icons.my_location, size: 20),
          ),
        ),
        Positioned(
          top: 12,
          right: 12,
          child: Material(
            color: MiisColors.panel,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: MiisColors.line),
            ),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () => setState(() => _tileIdx = (_tileIdx + 1) % _tileTemplates.length),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.layers_outlined, size: 18, color: MiisColors.amber),
                    const SizedBox(width: 6),
                    Text(app.t(tile.$3), style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ),
          ),
        ),
        const Positioned(
          left: 8,
          bottom: 6,
          child: Text('© OpenStreetMap © CARTO', style: TextStyle(fontSize: 10, color: MiisColors.faint)),
        ),
        if (pts.isEmpty)
          Positioned(
            bottom: 28,
            left: 14,
            right: 14,
            child: MiisCard(
              padding: const EdgeInsets.all(12),
              child: Text(app.t('sight.empty'), textAlign: TextAlign.center, style: const TextStyle(color: MiisColors.muted)),
            ),
          ),
      ],
    );
  }
}
