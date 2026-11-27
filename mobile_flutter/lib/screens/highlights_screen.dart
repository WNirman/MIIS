import 'package:flutter/material.dart';
import '../state/app_scope.dart';
import '../theme/miis_theme.dart';
import '../widgets/miis_widgets.dart';
import 'join_screen.dart';

class _Highlight {
  final String image;
  final String titleKey;
  final String subKey;
  final int targetTab; // 1 = report, 2 = sightings, 3 = species
  const _Highlight(this.image, this.titleKey, this.subKey, this.targetTab);
}

const List<_Highlight> _kHighlights = [
  _Highlight('assets/hero/sl_mirissa_bluewhale.jpg', 'home.hl1Title', 'home.hl1Sub', 3),
  _Highlight('assets/hero/sl_rekawa_turtle.jpg', 'home.hl2Title', 'home.hl2Sub', 3),
  _Highlight('assets/hero/sl_pigeon_island_reef.jpg', 'home.hl3Title', 'home.hl3Sub', 3),
  _Highlight('assets/hero/sl_mannar_dugong_coast.jpg', 'home.hl4Title', 'home.hl4Sub', 3),
  _Highlight('assets/hero/sl_negombo_fishers.jpg', 'home.hl5Title', 'home.hl5Sub', 1),
];

/// Welcome & Sri Lanka Marine Highlights landing tab (adapted from the reference Highlights view
/// using the MIIS website dark ocean + sun-amber palette and zero confidential data exposure).
class HighlightsScreen extends StatelessWidget {
  final ValueChanged<int> onNavigateTab;
  const HighlightsScreen({super.key, required this.onNavigateTab});

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    return ListView(
      padding: EdgeInsets.zero,
      children: [
        HeroBand(
          height: 220,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  app.t('home.welcome'),
                  style: const TextStyle(fontSize: 13, color: MiisColors.amber, fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 2),
                Text(
                  app.t('app.name'),
                  style: const TextStyle(fontSize: 30, fontWeight: FontWeight.w400, height: 1.1),
                ),
                const SizedBox(height: 6),
                Text(
                  app.t('app.sub'),
                  style: const TextStyle(fontSize: 13, color: MiisColors.muted),
                ),
              ],
            ),
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Primary zero-login report call-to-action
              MiisCard(
                borderColor: MiisColors.amber.withValues(alpha: 0.55),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    MiisButton(
                      label: app.t('home.quickReport'),
                      icon: Icons.add_location_alt_outlined,
                      trailingArrow: true,
                      onPressed: () => onNavigateTab(1),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      app.t('home.quickReportSub'),
                      style: const TextStyle(fontSize: 12, color: MiisColors.muted, height: 1.4),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              // Quick navigation pills for Sightings & Species Guide
              Row(
                children: [
                  Expanded(
                    child: MiisCard(
                      onTap: () => onNavigateTab(2),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                      child: Row(
                        children: [
                          const Icon(Icons.visibility_outlined, color: MiisColors.amber, size: 22),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(app.t('menu.sightings'),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: MiisCard(
                      onTap: () => onNavigateTab(3),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                      child: Row(
                        children: [
                          const Icon(Icons.format_list_bulleted, color: MiisColors.teal, size: 22),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(app.t('menu.species'),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 22),
              Text(
                app.t('home.highlights'),
                style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 12),
              for (final h in _kHighlights) ...[
                Material(
                  color: MiisColors.panel,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: const BorderSide(color: MiisColors.line),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: InkWell(
                    onTap: () => onNavigateTab(h.targetTab),
                    child: SizedBox(
                      height: 175,
                      width: double.infinity,
                      child: Stack(
                        fit: StackFit.expand,
                        children: [
                          Image.asset(
                            h.image,
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => Container(color: MiisColors.panelAlt),
                          ),
                          Container(
                            decoration: const BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [Color(0x18021520), Color(0xE6021520)],
                              ),
                            ),
                          ),
                          Positioned(
                            left: 16,
                            right: 16,
                            bottom: 14,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  app.t(h.titleKey),
                                  style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: Colors.white),
                                ),
                                const SizedBox(height: 3),
                                Text(
                                  app.t(h.subKey),
                                  style: const TextStyle(fontSize: 12.5, color: MiisColors.amberSoft),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ],
          ),
        ),
      ],
    );
  }
}
