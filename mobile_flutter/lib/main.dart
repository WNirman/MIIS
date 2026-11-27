import 'package:flutter/material.dart';
import 'screens/home_shell.dart';
import 'screens/join_screen.dart';
import 'state/app_scope.dart';
import 'state/app_state.dart';
import 'theme/miis_theme.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MiisMobileApp());
}

class MiisMobileApp extends StatefulWidget {
  final AppState? initialState;
  const MiisMobileApp({super.key, this.initialState});

  @override
  State<MiisMobileApp> createState() => _MiisMobileAppState();
}

class _MiisMobileAppState extends State<MiisMobileApp> {
  late final AppState _state;

  @override
  void initState() {
    super.initState();
    _state = widget.initialState ?? AppState();
    if (!_state.ready) {
      _state.load();
    }
  }

  @override
  void dispose() {
    if (widget.initialState == null) {
      _state.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AppScope(
      state: _state,
      child: AnimatedBuilder(
        animation: _state,
        builder: (context, _) {
          Widget home;
          if (!_state.ready) {
            home = const Scaffold(
              body: Center(child: CircularProgressIndicator()),
            );
          } else if (!_state.languageChosen) {
            home = const LanguageGateScreen();
          } else if (!_state.entered) {
            home = const JoinScreen();
          } else {
            home = const HomeShell();
          }

          return MaterialApp(
            title: 'MIIS Sri Lanka',
            debugShowCheckedModeBanner: false,
            theme: buildMiisTheme(),
            home: home,
          );
        },
      ),
    );
  }
}
