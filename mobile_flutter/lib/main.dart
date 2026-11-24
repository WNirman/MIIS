import 'package:flutter/material.dart';
import 'screens/quick_report_screen.dart';
import 'screens/outbox_screen.dart';
import 'services/offline_sync_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MIISFisherApp());
}

class MIISFisherApp extends StatelessWidget {
  const MIISFisherApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'MIIS Fisher Reporter',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark(useMaterial3: true).copyWith(
        scaffoldBackgroundColor: const Color(0xFF061120),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF22D3EE),
          secondary: Color(0xFF10B981),
          surface: Color(0xFF0D2036),
        ),
      ),
      home: const FisherHomeShell(),
    );
  }
}

class FisherHomeShell extends StatefulWidget {
  const FisherHomeShell({super.key});

  @override
  State<FisherHomeShell> createState() => _FisherHomeShellState();
}

class _FisherHomeShellState extends State<FisherHomeShell> {
  int _tabIndex = 0;
  List<QueuedMaritimeReport> _queue = [];

  @override
  void initState() {
    super.initState();
    _loadQueue();
  }

  Future<void> _loadQueue() async {
    final items = await OfflineSyncService.loadQueue();
    if (mounted) setState(() => _queue = items);
  }

  Future<void> _openServerSettings() async {
    final current = await OfflineSyncService.getServerUrl();
    final ctrl = TextEditingController(text: current);
    if (!mounted) return;
    await showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: const Color(0xFF0D2036),
        title: const Text('MIIS Server Endpoint'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Set your MIIS backend API URL (e.g. local PC IP on Wi-Fi or deployed HTTPS server):',
              style: TextStyle(fontSize: 12, color: Colors.white70),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: ctrl,
              decoration: const InputDecoration(
                border: OutlineInputBorder(),
                hintText: 'http://172.26.102.34:5000',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              await OfflineSyncService.setServerUrl(ctrl.text);
              if (mounted) Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pendingCount = _queue
        .where((r) => r.beaconStatus != 'synced' || (r.photoBase64 != null && r.mediaStatus != 'synced'))
        .length;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF071426),
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('MIIS Fisher Sea Reporter', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17)),
            Text('Sri Lanka • Offline GPS • No Login Needed', style: TextStyle(fontSize: 11, color: Color(0xFF5EEAD4))),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings, color: Colors.white70),
            tooltip: 'MIIS Server URL',
            onPressed: _openServerSettings,
          ),
        ],
      ),
      body: IndexedStack(
        index: _tabIndex,
        children: [
          QuickReportScreen(onQueueUpdated: _loadQueue),
          OutboxScreen(reports: _queue, onRefresh: _loadQueue),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        backgroundColor: const Color(0xFF071426),
        selectedIndex: _tabIndex,
        onDestinationSelected: (i) => setState(() => _tabIndex = i),
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.add_location_alt_outlined),
            selectedIcon: Icon(Icons.add_location_alt),
            label: 'Report Now',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: pendingCount > 0,
              label: Text('$pendingCount'),
              child: const Icon(Icons.cloud_upload_outlined),
            ),
            selectedIcon: Badge(
              isLabelVisible: pendingCount > 0,
              label: Text('$pendingCount'),
              child: const Icon(Icons.cloud_upload),
            ),
            label: 'Sea Outbox',
          ),
        ],
      ),
    );
  }
}
