import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/offline_sync_service.dart';

class OutboxScreen extends StatefulWidget {
  final List<QueuedMaritimeReport> reports;
  final VoidCallback onRefresh;

  const OutboxScreen({super.key, required this.reports, required this.onRefresh});

  @override
  State<OutboxScreen> createState() => _OutboxScreenState();
}

class _OutboxScreenState extends State<OutboxScreen> {
  bool _syncing = false;

  Future<void> _syncAll() async {
    setState(() => _syncing = true);
    final res = await OfflineSyncService.flushQueue(includePhotos: true);
    widget.onRefresh();
    if (mounted) {
      setState(() => _syncing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Synced ${res['beacons']} GPS beacons & ${res['photos']} harbour photos.')),
      );
    }
  }

  Future<void> _sendSms(String packet) async {
    final uri = Uri(scheme: 'sms', path: '+94112888555', queryParameters: {'body': packet});
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(14),
          child: SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF10B981),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              onPressed: _syncing ? null : _syncAll,
              icon: const Icon(Icons.cloud_upload),
              label: Text(
                _syncing ? 'SYNCING TO MIIS...' : 'SYNC ALL BEACONS & HARBOUR PHOTOS',
                style: const TextStyle(fontWeight: FontWeight.w900),
              ),
            ),
          ),
        ),
        Expanded(
          child: widget.reports.isEmpty
              ? const Center(
                  child: Text(
                    'No reports saved yet.\nReports made at sea appear here automatically.',
                    textAlign: TextAlign.center,
                    style: TextStyle(color: Colors.white60),
                  ),
                )
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 14),
                  itemCount: widget.reports.length,
                  itemBuilder: (_, idx) {
                    final r = widget.reports[idx];
                    return Card(
                      color: const Color(0xFF0D2036),
                      margin: const EdgeInsets.only(bottom: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  r.serverIncidentId ?? 'LOCAL-${r.clientUuid.substring(0, 8).toUpperCase()}',
                                  style: const TextStyle(fontFamily: 'monospace', color: Color(0xFF22D3EE), fontWeight: FontWeight.bold),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, color: Colors.white38, size: 18),
                                  onPressed: () async {
                                    await OfflineSyncService.removeReport(r.clientUuid);
                                    widget.onRefresh();
                                  },
                                ),
                              ],
                            ),
                            Text('${r.taxonGroup} — ${r.eventType} (${r.conditionStatus})',
                                style: const TextStyle(fontWeight: FontWeight.w800)),
                            const SizedBox(height: 4),
                            Text('${r.district} • ${r.latitude.toStringAsFixed(5)}, ${r.longitude.toStringAsFixed(5)} (±${r.gpsAccuracyM.round()}m)',
                                style: const TextStyle(fontSize: 12, color: Colors.white70)),
                            const SizedBox(height: 10),
                            Wrap(
                              spacing: 8,
                              runSpacing: 6,
                              children: [
                                Chip(
                                  label: Text(
                                    r.beaconStatus == 'synced' ? 'GPS Sent ✓' : 'GPS Queued ⏳',
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                  ),
                                  backgroundColor: r.beaconStatus == 'synced' ? const Color(0xFF064E3B) : const Color(0xFF78350F),
                                ),
                                if (r.photoBase64 != null)
                                  Chip(
                                    label: Text(
                                      r.mediaStatus == 'synced' ? 'Photo Sent ✓' : 'Photo Waiting (${r.photoKb} KB)',
                                      style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                                    ),
                                    backgroundColor: r.mediaStatus == 'synced' ? const Color(0xFF164E63) : const Color(0xFF4C1D95),
                                  ),
                                if (r.beaconStatus != 'synced')
                                  ActionChip(
                                    avatar: const Icon(Icons.sms, size: 16, color: Colors.black),
                                    label: const Text('Send 2G SMS', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 11)),
                                    backgroundColor: const Color(0xFFF59E0B),
                                    onPressed: () => _sendSms(r.smsPacket),
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
