import 'package:flutter/material.dart';
import '../services/offline_sync_service.dart';
import '../state/app_scope.dart';
import '../theme/miis_theme.dart';
import '../widgets/miis_widgets.dart';
import 'highlights_screen.dart';
import 'miis_drawer.dart';
import 'outbox_screen.dart';
import 'quick_report_screen.dart';
import 'sightings_screen.dart';
import 'species_screen.dart';

/// Main app after the Join screen: header + right drawer + 5 clean bottom tabs.
class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _tab = 0; // 0 Home/Highlights, 1 Report, 2 Sightings, 3 Species, 4 Outbox
  List<QueuedMaritimeReport> _queue = [];
  int _sightingsRefresh = 0;

  @override
  void initState() {
    super.initState();
    _loadQueue();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final a = context.app;
    if (a.requestedTab >= 0) {
      _tab = a.requestedTab;
      a.requestedTab = -1;
    }
  }

  Future<void> _loadQueue() async {
    final items = await OfflineSyncService.loadQueue();
    if (mounted) setState(() => _queue = items);
  }

  void _onQueueUpdated() {
    _loadQueue();
    setState(() => _sightingsRefresh++);
  }

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final pending = _queue
        .where((r) => r.beaconStatus != 'synced' || (r.photoBase64 != null && r.mediaStatus != 'synced'))
        .length;

    return Scaffold(
      appBar: AppBar(
        toolbarHeight: 64,
        automaticallyImplyLeading: false,
        titleSpacing: 18,
        title: Row(
          children: [
            const MiisCrest(size: 34),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(app.t('app.name'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                  Text(
                    app.t('app.sub'),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(fontSize: 10.5, color: MiisColors.muted),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          Builder(
            builder: (ctx) => IconButton(
              tooltip: 'Menu',
              onPressed: () => Scaffold.of(ctx).openEndDrawer(),
              icon: const Icon(Icons.menu, size: 28),
            ),
          ),
          const SizedBox(width: 6),
        ],
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1, color: MiisColors.line),
        ),
      ),
      endDrawer: MiisDrawer(onSelectTab: (i) => setState(() => _tab = i)),
      body: IndexedStack(
        index: _tab,
        children: [
          HighlightsScreen(onNavigateTab: (i) => setState(() => _tab = i)),
          QuickReportScreen(onQueueUpdated: _onQueueUpdated),
          SightingsScreen(refreshTick: _sightingsRefresh, queue: _queue, active: _tab == 2),
          const SpeciesScreen(),
          OutboxScreen(reports: _queue, onRefresh: _onQueueUpdated),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        backgroundColor: MiisColors.panelAlt,
        indicatorColor: MiisColors.amber.withValues(alpha: 0.22),
        height: 66,
        selectedIndex: _tab,
        onDestinationSelected: (i) => setState(() => _tab = i),
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.waves_outlined),
            selectedIcon: const Icon(Icons.waves, color: MiisColors.amber),
            label: app.t('nav.home'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.add_location_alt_outlined),
            selectedIcon: const Icon(Icons.add_location_alt, color: MiisColors.amber),
            label: app.t('nav.report'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.visibility_outlined),
            selectedIcon: const Icon(Icons.visibility, color: MiisColors.amber),
            label: app.t('nav.sightings'),
          ),
          NavigationDestination(
            icon: const Icon(Icons.format_list_bulleted),
            selectedIcon: const Icon(Icons.format_list_bulleted, color: MiisColors.amber),
            label: app.t('nav.species'),
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: pending > 0,
              label: Text('$pending'),
              child: const Icon(Icons.cloud_upload_outlined),
            ),
            selectedIcon: Badge(
              isLabelVisible: pending > 0,
              label: Text('$pending'),
              child: const Icon(Icons.cloud_upload, color: MiisColors.amber),
            ),
            label: app.t('nav.outbox'),
          ),
        ],
      ),
    );
  }
}
