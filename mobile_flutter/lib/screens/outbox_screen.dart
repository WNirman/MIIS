import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../data/constants.dart';
import '../services/offline_sync_service.dart';
import '../state/app_scope.dart';
import '../theme/miis_theme.dart';
import '../widgets/miis_widgets.dart';

/// Offline harbour queue for beacons and deferred photos (trilingual + MIIS website palette).
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
    final app = context.app;
    setState(() => _syncing = true);
    final res = await OfflineSyncService.flushQueue(includePhotos: true);
    widget.onRefresh();
    if (!mounted) return;
    setState(() => _syncing = false);
    final msg = app
        .t('outbox.result')
        .replaceAll('{b}', '${res['beacons'] ?? 0}')
        .replaceAll('{p}', '${res['photos'] ?? 0}');
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  Future<void> _sendSms(String packet) async {
    final uri = Uri(scheme: 'sms', path: kSmsGateway, queryParameters: {'body': packet});
    if (await canLaunchUrl(uri)) await launchUrl(uri);
  }

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: MiisButton(
            label: _syncing ? app.t('outbox.syncing') : app.t('outbox.syncAll'),
            icon: Icons.cloud_upload_outlined,
            onPressed: _syncing ? null : _syncAll,
          ),
        ),
        Expanded(
          child: widget.reports.isEmpty
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(28),
                    child: Text(
                      app.t('outbox.empty'),
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: MiisColors.muted, height: 1.5),
                    ),
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                  itemCount: widget.reports.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (_, idx) {
                    final r = widget.reports[idx];
                    final sent = r.beaconStatus == 'synced';
                    return MiisCard(
                      padding: const EdgeInsets.all(14),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  r.serverIncidentId ??
                                      'LOCAL-${r.clientUuid.substring(0, 8).toUpperCase()}',
                                  style: const TextStyle(
                                    fontFamily: 'monospace',
                                    color: MiisColors.amber,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                              ),
                              IconButton(
                                visualDensity: VisualDensity.compact,
                                icon: const Icon(Icons.delete_outline, color: MiisColors.faint, size: 19),
                                onPressed: () async {
                                  await OfflineSyncService.removeReport(r.clientUuid);
                                  widget.onRefresh();
                                },
                              ),
                            ],
                          ),
                          Text(
                            '${r.taxonGroup} — ${r.eventType} (${r.conditionStatus})',
                            style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14.5),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${r.district} • ${r.latitude.toStringAsFixed(5)}, ${r.longitude.toStringAsFixed(5)} (±${r.gpsAccuracyM.round()}m)',
                            style: const TextStyle(fontSize: 12, color: MiisColors.muted),
                          ),
                          const SizedBox(height: 10),
                          Wrap(
                            spacing: 8,
                            runSpacing: 6,
                            children: [
                              MiisChip(
                                sent ? app.t('outbox.gpsSent') : app.t('outbox.gpsQueued'),
                                color: sent ? MiisColors.emerald : MiisColors.amber,
                              ),
                              if (r.photoBase64 != null)
                                MiisChip(
                                  r.mediaStatus == 'synced'
                                      ? app.t('outbox.photoSent')
                                      : '${app.t('outbox.photoWaiting')} (${r.photoKb ?? 0} KB)',
                                  color: r.mediaStatus == 'synced' ? MiisColors.teal : MiisColors.violet,
                                ),
                              if (!sent)
                                ActionChip(
                                  avatar: const Icon(Icons.sms_outlined, size: 16, color: MiisColors.bg),
                                  label: Text(
                                    app.t('outbox.sms'),
                                    style: const TextStyle(
                                      color: MiisColors.bg,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 11.5,
                                    ),
                                  ),
                                  backgroundColor: MiisColors.amber,
                                  shape: const StadiumBorder(),
                                  onPressed: () => _sendSms(r.smsPacket),
                                ),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
        ),
      ],
    );
  }
}
