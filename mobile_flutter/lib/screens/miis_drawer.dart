import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../data/constants.dart';
import '../l10n/app_strings.dart';
import '../services/offline_sync_service.dart';
import '../state/app_scope.dart';
import '../theme/miis_theme.dart';
import '../widgets/miis_widgets.dart';
import 'contact_screen.dart';
import 'projects_screen.dart';

/// Right-hand navigation drawer (mirrors the reference app's menu, adapted for MIIS).
class MiisDrawer extends StatelessWidget {
  final ValueChanged<int> onSelectTab;
  const MiisDrawer({super.key, required this.onSelectTab});

  Future<void> _openWeb(BuildContext context, {String path = ''}) async {
    final base = await OfflineSyncService.getWebsiteUrl();
    await launchUrl(Uri.parse('$base$path'), mode: LaunchMode.externalApplication);
  }

  Future<void> _regionDialog(BuildContext context) async {
    final app = context.app;
    await showDialog(
      context: context,
      builder: (ctx) => SimpleDialog(
        backgroundColor: MiisColors.panel,
        title: Text(app.t('menu.region')),
        children: [
          for (final d in ['', ...kCoastalDistricts])
            SimpleDialogOption(
              onPressed: () {
                app.setRegion(d);
                Navigator.pop(ctx);
              },
              child: Row(
                children: [
                  Icon(app.region == d ? Icons.radio_button_checked : Icons.radio_button_off,
                      size: 20, color: MiisColors.amber),
                  const SizedBox(width: 12),
                  Text(d.isEmpty ? app.t('menu.regionAll') : d),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _serverDialog(BuildContext context) async {
    final app = context.app;
    final ctrl = TextEditingController(text: await OfflineSyncService.getServerUrl());
    if (!context.mounted) return;
    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: MiisColors.panel,
        title: Text(app.t('server.title')),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(app.t('server.desc'), style: const TextStyle(fontSize: 12.5, color: MiisColors.muted)),
            const SizedBox(height: 12),
            TextField(controller: ctrl, decoration: const InputDecoration(hintText: 'http://192.168.1.10:5000')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text(app.t('common.cancel'))),
          TextButton(
            onPressed: () async {
              await OfflineSyncService.setServerUrl(ctrl.text);
              if (ctx.mounted) Navigator.pop(ctx);
            },
            child: Text(app.t('common.save'), style: const TextStyle(color: MiisColors.amber)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final app = context.app;

    Widget item(IconData icon, String label, VoidCallback onTap, {bool external = false, String? trailing}) {
      return InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 14),
          child: Row(
            children: [
              Icon(icon, size: 22, color: Colors.white),
              const SizedBox(width: 22),
              Expanded(
                child: Text(label, style: const TextStyle(fontSize: 16.5, fontWeight: FontWeight.w700)),
              ),
              if (trailing != null)
                Text(trailing, style: const TextStyle(color: MiisColors.amber, fontWeight: FontWeight.w700)),
              if (external) const Icon(Icons.open_in_new, size: 20, color: Colors.white),
            ],
          ),
        ),
      );
    }

    void closeThen(VoidCallback fn) {
      Navigator.pop(context);
      fn();
    }

    final user = app.user;
    return Drawer(
      width: MediaQuery.of(context).size.width * 0.82 > 340 ? 340 : MediaQuery.of(context).size.width * 0.82,
      shape: const RoundedRectangleBorder(),
      child: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  Padding(
                    padding: const EdgeInsets.fromLTRB(22, 22, 22, 18),
                    child: Row(
                      children: [
                        Container(
                          width: 72,
                          height: 72,
                          alignment: Alignment.center,
                          decoration: const BoxDecoration(color: Color(0x14FFFFFF), shape: BoxShape.circle),
                          child: user == null
                              ? const MiisCrest(size: 44)
                              : Text(
                                  user.fullName.isEmpty ? '?' : user.fullName.characters.first.toUpperCase(),
                                  style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w800, color: MiisColors.amber),
                                ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                user?.fullName ?? app.t('menu.welcome'),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                              ),
                              const SizedBox(height: 4),
                              if (user == null)
                                InkWell(
                                  onTap: () => closeThen(() => app.logout()),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(app.t('menu.register'),
                                          style: const TextStyle(color: MiisColors.amber, fontWeight: FontWeight.w700)),
                                      const SizedBox(width: 6),
                                      const Icon(Icons.arrow_circle_right_outlined, size: 18, color: MiisColors.amber),
                                    ],
                                  ),
                                )
                              else
                                MiisChip(user.role.toUpperCase(), color: user.isValidator ? MiisColors.emerald : MiisColors.amber),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1, color: MiisColors.line, indent: 22, endIndent: 22),
                  const SizedBox(height: 6),
                  item(Icons.waves_outlined, app.t('nav.home'), () => closeThen(() => onSelectTab(0))),
                  item(Icons.add_location_alt_outlined, app.t('menu.report'), () => closeThen(() => onSelectTab(1))),
                  item(Icons.visibility_outlined, app.t('menu.sightings'), () => closeThen(() => onSelectTab(2))),
                  item(Icons.format_list_bulleted, app.t('menu.species'), () => closeThen(() => onSelectTab(3))),
                  item(Icons.cloud_upload_outlined, app.t('menu.outbox'), () => closeThen(() => onSelectTab(4))),
                  item(Icons.groups_outlined, app.t('menu.projects'), () {
                    closeThen(() => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ProjectsScreen())));
                  }),
                  item(Icons.menu_book_outlined, app.t('menu.news'), () => closeThen(() => _openWeb(context)), external: true),
                  item(Icons.public, app.t('menu.web'), () => closeThen(() => _openWeb(context)), external: true),
                  if (app.isValidator)
                    item(Icons.verified_user_outlined, app.t('menu.validatorWeb'), () => closeThen(() => _openWeb(context)), external: true),
                  item(Icons.mail_outline, app.t('menu.contact'), () {
                    closeThen(() => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ContactScreen())));
                  }),
                  // Language
                  Padding(
                    padding: const EdgeInsets.fromLTRB(22, 10, 22, 4),
                    child: Row(
                      children: [
                        const Icon(Icons.flag_outlined, size: 22),
                        const SizedBox(width: 22),
                        Text(app.t('menu.language'), style: const TextStyle(fontSize: 16.5, fontWeight: FontWeight.w700)),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(66, 4, 16, 8),
                    child: Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: List.generate(3, (i) {
                        final sel = app.lang == i;
                        return ChoiceChip(
                          label: Text(AppStrings.langNames[i]),
                          selected: sel,
                          showCheckmark: false,
                          selectedColor: MiisColors.amber,
                          backgroundColor: MiisColors.bg,
                          labelStyle: TextStyle(color: sel ? MiisColors.bg : Colors.white, fontWeight: FontWeight.w700),
                          side: const BorderSide(color: MiisColors.line),
                          shape: const StadiumBorder(),
                          onSelected: (_) => app.setLanguage(i),
                        );
                      }),
                    ),
                  ),
                  item(Icons.location_on_outlined, '${app.t('menu.region')}: ${app.region.isEmpty ? app.t('menu.regionAll') : app.region}',
                      () => _regionDialog(context)),
                  item(Icons.dns_outlined, app.t('menu.server'), () => closeThen(() => _serverDialog(context))),
                  if (app.isLoggedIn)
                    item(Icons.logout, app.t('menu.signout'), () => closeThen(() => app.logout())),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 8, 22, 16),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(kAppVersion, style: const TextStyle(color: MiisColors.faint, fontSize: 12.5)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
