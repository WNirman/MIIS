import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../data/constants.dart';
import '../services/offline_sync_service.dart';
import '../state/app_scope.dart';
import '../theme/miis_theme.dart';
import '../widgets/miis_widgets.dart';

class ContactScreen extends StatelessWidget {
  const ContactScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    return Scaffold(
      appBar: AppBar(
        title: Text(app.t('contact.title'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1, color: MiisColors.line)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 26, 20, 30),
        children: [
          const Center(child: MiisCrest(size: 76)),
          const SizedBox(height: 16),
          Center(child: Text(app.t('contact.org'), style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700))),
          const SizedBox(height: 4),
          Center(child: Text(app.t('contact.uni'), style: const TextStyle(color: MiisColors.muted))),
          const SizedBox(height: 26),
          MiisButton(
            label: app.t('contact.web'),
            icon: Icons.public,
            trailingArrow: true,
            onPressed: () async {
              final base = await OfflineSyncService.getWebsiteUrl();
              await launchUrl(Uri.parse(base), mode: LaunchMode.externalApplication);
            },
          ),
          const SizedBox(height: 12),
          MiisButton(
            label: app.t('contact.linkedin'),
            icon: Icons.link,
            trailingArrow: true,
            outlined: true,
            onPressed: () => launchUrl(Uri.parse(kLinkedIn), mode: LaunchMode.externalApplication),
          ),
          const SizedBox(height: 22),
          MiisCard(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.shield_outlined, color: MiisColors.amber, size: 22),
                const SizedBox(width: 12),
                Expanded(child: Text(app.t('contact.note'), style: const TextStyle(fontSize: 13.5, height: 1.5, color: MiisColors.muted))),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
