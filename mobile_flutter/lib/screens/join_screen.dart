import 'dart:async';
import 'package:flutter/material.dart';
import '../l10n/app_strings.dart';
import '../state/app_scope.dart';
import '../theme/miis_theme.dart';
import '../widgets/miis_widgets.dart';
import 'auth_screen.dart';

const List<String> kHeroImages = [
  'assets/hero/sl_mirissa_bluewhale.jpg',
  'assets/hero/sl_rekawa_turtle.jpg',
  'assets/hero/sl_pigeon_island_reef.jpg',
  'assets/hero/sl_negombo_fishers.jpg',
  'assets/hero/sl_mannar_dugong_coast.jpg',
];

/// Small EN / සිං / தமி switcher used on entry screens and report form.
class LanguageChips extends StatelessWidget {
  const LanguageChips({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (i) {
        final sel = app.lang == i;
        return Padding(
          padding: const EdgeInsets.only(left: 6),
          child: InkWell(
            borderRadius: BorderRadius.circular(99),
            onTap: () => app.setLanguage(i),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: sel ? MiisColors.amber : Colors.transparent,
                borderRadius: BorderRadius.circular(99),
                border: Border.all(color: sel ? MiisColors.amber : const Color(0x55FFFFFF)),
              ),
              child: Text(
                AppStrings.langShort[i],
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w700,
                  color: sel ? MiisColors.bg : Colors.white,
                ),
              ),
            ),
          ),
        );
      }),
    );
  }
}

/// Automatic cross-fading Sri Lankan marine photo band (no manual controls).
class HeroBand extends StatefulWidget {
  final double height;
  final Widget? child;
  const HeroBand({super.key, this.height = 210, this.child});

  @override
  State<HeroBand> createState() => _HeroBandState();
}

class _HeroBandState extends State<HeroBand> {
  int _i = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _timer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (mounted) setState(() => _i = (_i + 1) % kHeroImages.length);
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: widget.height,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 1400),
            child: Image.asset(
              kHeroImages[_i],
              key: ValueKey(_i),
              fit: BoxFit.cover,
              gaplessPlayback: true,
              errorBuilder: (_, _, _) => Container(color: MiisColors.panel),
            ),
          ),
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0x66021520), Color(0xFF021520)],
              ),
            ),
          ),
          if (widget.child != null) widget.child!,
        ],
      ),
    );
  }
}

/// First launch: ask the preferred language (trilingual so every Sri Lankan can read it).
class LanguageGateScreen extends StatelessWidget {
  const LanguageGateScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    return Scaffold(
      body: SafeArea(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            HeroBand(
              height: 230,
              child: const Align(
                alignment: Alignment.bottomLeft,
                child: Padding(
                  padding: EdgeInsets.fromLTRB(22, 0, 22, 18),
                  child: Row(
                    children: [
                      MiisCrest(size: 46),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text('MIIS Sri Lanka', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
                            Text('Marine Incident Intelligence System',
                                style: TextStyle(fontSize: 12, color: MiisColors.muted)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 20, 22, 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Select your preferred language',
                      style: TextStyle(fontSize: 22, fontWeight: FontWeight.w400)),
                  const SizedBox(height: 4),
                  const Text('ඔබ කැමති භාෂාව තෝරන්න', style: TextStyle(fontSize: 18, color: Color(0xE6FFFFFF))),
                  const SizedBox(height: 4),
                  const Text('உங்கள் விருப்ப மொழியைத் தேர்ந்தெடுக்கவும்',
                      style: TextStyle(fontSize: 16, color: MiisColors.muted)),
                  const SizedBox(height: 22),
                  for (var i = 0; i < 3; i++) ...[
                    MiisCard(
                      onTap: () => app.setLanguage(i),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      borderColor: app.lang == i && app.languageChosen ? MiisColors.amber : null,
                      child: Row(
                        children: [
                          Container(
                            width: 42,
                            height: 42,
                            alignment: Alignment.center,
                            decoration: const BoxDecoration(color: Color(0x1FFFFFFF), shape: BoxShape.circle),
                            child: Text(AppStrings.langShort[i],
                                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13)),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Text(AppStrings.langNames[i],
                                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
                          ),
                          const Icon(Icons.arrow_forward, color: MiisColors.amber),
                        ],
                      ),
                    ),
                    const SizedBox(height: 10),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// "Join MIIS" — login, create account, or continue without an account (zero-login reporting).
class JoinScreen extends StatelessWidget {
  const JoinScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.app;
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
                  Text(app.t('app.sub'),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 10.5, color: MiisColors.muted)),
                ],
              ),
            ),
          ],
        ),
        actions: const [Padding(padding: EdgeInsets.only(right: 12), child: Center(child: LanguageChips()))],
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1, color: MiisColors.line),
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            const HeroBand(height: 180),
            Padding(
              padding: const EdgeInsets.fromLTRB(22, 4, 22, 24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(app.t('join.title'), style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w400)),
                  const SizedBox(height: 14),
                  Text(app.t('join.desc'),
                      style: const TextStyle(fontSize: 15, height: 1.55, color: MiisColors.muted)),
                  const SizedBox(height: 26),
                  MiisButton(
                    label: app.t('join.login'),
                    icon: Icons.person,
                    trailingArrow: true,
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const AuthScreen(register: false)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  MiisButton(
                    label: app.t('join.create'),
                    icon: Icons.check_circle_outline,
                    trailingArrow: true,
                    outlined: true,
                    onPressed: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const AuthScreen(register: true)),
                    ),
                  ),
                  const SizedBox(height: 34),
                  MiisButton(
                    label: app.t('join.anon'),
                    icon: Icons.visibility_off_outlined,
                    trailingArrow: true,
                    onPressed: () => app.continueAnonymous(),
                  ),
                  const SizedBox(height: 10),
                  Center(
                    child: Text(
                      app.t('join.anonHint'),
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 12, color: MiisColors.faint),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
