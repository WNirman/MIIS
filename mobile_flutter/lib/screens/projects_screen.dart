import 'package:flutter/material.dart';
import '../state/app_scope.dart';
import '../theme/miis_theme.dart';
import '../widgets/miis_widgets.dart';

class ProjectsScreen extends StatelessWidget {
  const ProjectsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    final phases = [
      ('proj.p1', 'proj.p1d'),
      ('proj.p2', 'proj.p2d'),
      ('proj.p3', 'proj.p3d'),
      ('proj.p4', 'proj.p4d'),
      ('proj.p5', 'proj.p5d'),
    ];
    return Scaffold(
      appBar: AppBar(
        title: Text(app.t('proj.title'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1, color: MiisColors.line)),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(18, 20, 18, 30),
        children: [
          Text(app.t('proj.intro'), style: const TextStyle(fontSize: 15, height: 1.55, color: MiisColors.muted)),
          const SizedBox(height: 20),
          for (var i = 0; i < phases.length; i++) ...[
            MiisCard(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: MiisColors.amber.withValues(alpha: 0.16),
                      shape: BoxShape.circle,
                      border: Border.all(color: MiisColors.amber.withValues(alpha: 0.6)),
                    ),
                    child: Text('${i + 1}', style: const TextStyle(color: MiisColors.amber, fontWeight: FontWeight.w800)),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(app.t(phases[i].$1), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                        const SizedBox(height: 5),
                        Text(app.t(phases[i].$2), style: const TextStyle(fontSize: 13.5, height: 1.5, color: MiisColors.muted)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 10),
          ],
        ],
      ),
    );
  }
}
