import 'package:flutter/material.dart';
import 'app_state.dart';

/// Gives every widget access to the [AppState] (language, session, region).
class AppScope extends InheritedNotifier<AppState> {
  const AppScope({super.key, required AppState state, required super.child}) : super(notifier: state);

  static AppState of(BuildContext context) {
    final scope = context.dependOnInheritedWidgetOfExactType<AppScope>();
    assert(scope != null, 'AppScope missing');
    return scope!.notifier!;
  }
}

extension AppStateContext on BuildContext {
  AppState get app => AppScope.of(this);
  String tr(String key) => AppScope.of(this).t(key);
}
