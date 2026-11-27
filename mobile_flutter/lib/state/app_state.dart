import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../l10n/app_strings.dart';
import '../services/offline_sync_service.dart';

class MiisUser {
  final String userId;
  final String email;
  final String fullName;
  final String organization;
  final String role; // reporter | validator | admin
  final String district;

  const MiisUser({
    required this.userId,
    required this.email,
    required this.fullName,
    required this.organization,
    required this.role,
    required this.district,
  });

  bool get isValidator => role == 'validator' || role == 'admin';

  factory MiisUser.fromJson(Map<String, dynamic> j) => MiisUser(
        userId: (j['user_id'] ?? '').toString(),
        email: (j['email'] ?? '').toString(),
        fullName: (j['full_name'] ?? '').toString(),
        organization: (j['organization'] ?? '').toString(),
        role: (j['role'] ?? 'reporter').toString(),
        district: (j['district'] ?? '').toString(),
      );

  Map<String, dynamic> toJson() => {
        'user_id': userId,
        'email': email,
        'full_name': fullName,
        'organization': organization,
        'role': role,
        'district': district,
      };
}

/// Global app state: language, session (anonymous / registered / validator), region.
class AppState extends ChangeNotifier {
  static const _kLang = 'miis_app_lang_v2';
  static const _kLangChosen = 'miis_app_lang_chosen_v2';
  static const _kToken = 'miis_app_token_v2';
  static const _kUser = 'miis_app_user_v2';
  static const _kRegion = 'miis_app_region_v2';
  static const _kMode = 'miis_app_mode_v2'; // 'anon' | 'user'

  int lang = 0; // 0 = en, 1 = si, 2 = ta
  bool languageChosen = false;
  bool entered = false; // has passed the Join screen this launch
  String? token;
  MiisUser? user;
  String region = ''; // empty = all Sri Lanka
  bool ready = false;

  /// Set by the Species guide ("Report this species") and consumed by the Report screen.
  String? prefillTaxon;
  int requestedTab = -1; // shell tab requested from drawer / other screens (-1 = none)

  void prefill(String taxon) {
    prefillTaxon = taxon;
    requestedTab = 1; // Report tab in HomeShell
    notifyListeners();
  }

  void requestTab(int i) {
    requestedTab = i;
    notifyListeners();
  }

  String? takePrefill() {
    final v = prefillTaxon;
    prefillTaxon = null;
    return v;
  }

  String t(String key) => AppStrings.tr(lang, key);

  bool get isLoggedIn => token != null && user != null;
  bool get isValidator => user?.isValidator ?? false;
  Map<String, String> get authHeaders =>
      token == null ? const {} : {'Authorization': 'Bearer $token'};

  Future<void> load() async {
    final p = await SharedPreferences.getInstance();
    lang = p.getInt(_kLang) ?? 0;
    languageChosen = p.getBool(_kLangChosen) ?? false;
    token = p.getString(_kToken);
    region = p.getString(_kRegion) ?? '';
    final rawUser = p.getString(_kUser);
    if (rawUser != null && token != null) {
      try {
        user = MiisUser.fromJson(jsonDecode(rawUser));
      } catch (_) {
        user = null;
        token = null;
      }
    }
    // Keep OfflineSyncService in lockstep with the active session token.
    OfflineSyncService.authToken = token;
    // Returning registered users skip the Join screen; anonymous users see it again.
    entered = isLoggedIn && (p.getString(_kMode) == 'user');
    ready = true;
    notifyListeners();
  }

  Future<void> setLanguage(int l, {bool chosen = true}) async {
    lang = l;
    if (chosen) languageChosen = true;
    final p = await SharedPreferences.getInstance();
    await p.setInt(_kLang, l);
    if (chosen) await p.setBool(_kLangChosen, true);
    notifyListeners();
  }

  Future<void> setRegion(String r) async {
    region = r;
    final p = await SharedPreferences.getInstance();
    await p.setString(_kRegion, r);
    notifyListeners();
  }

  Future<void> continueAnonymous() async {
    entered = true;
    final p = await SharedPreferences.getInstance();
    await p.setString(_kMode, 'anon');
    notifyListeners();
  }

  Future<void> _saveSession(String tok, MiisUser u) async {
    token = tok;
    user = u;
    entered = true;
    OfflineSyncService.authToken = tok;
    final p = await SharedPreferences.getInstance();
    await p.setString(_kToken, tok);
    await p.setString(_kUser, jsonEncode(u.toJson()));
    await p.setString(_kMode, 'user');
    notifyListeners();
  }

  /// Returns null on success or an error message.
  Future<String?> login(String email, String password) async {
    final base = await OfflineSyncService.getServerUrl();
    try {
      final resp = await http
          .post(
            Uri.parse('$base/api/auth/login'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'email': email.trim(), 'password': password}),
          )
          .timeout(const Duration(seconds: 12));
      final data = jsonDecode(resp.body);
      if (resp.statusCode == 200 && data['success'] == true) {
        await _saveSession(data['token'], MiisUser.fromJson(data['user']));
        return null;
      }
      return (data['error'] ?? 'Login failed').toString();
    } catch (_) {
      return t('auth.failed');
    }
  }

  Future<String?> register({
    required String fullName,
    required String email,
    required String password,
    required String organization,
    required String district,
  }) async {
    final base = await OfflineSyncService.getServerUrl();
    try {
      final resp = await http
          .post(
            Uri.parse('$base/api/auth/register'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'full_name': fullName.trim(),
              'email': email.trim(),
              'password': password,
              'organization': organization.trim(),
              'district': district,
            }),
          )
          .timeout(const Duration(seconds: 12));
      final data = jsonDecode(resp.body);
      if (resp.statusCode == 200 && data['success'] == true) {
        await _saveSession(data['token'], MiisUser.fromJson(data['user']));
        return null;
      }
      return (data['error'] ?? 'Registration failed').toString();
    } catch (_) {
      return t('auth.failed');
    }
  }

  Future<void> logout() async {
    token = null;
    user = null;
    entered = false;
    OfflineSyncService.authToken = null;
    final p = await SharedPreferences.getInstance();
    await p.remove(_kToken);
    await p.remove(_kUser);
    await p.setString(_kMode, 'anon');
    notifyListeners();
  }

  void sessionExpired() {
    // Called when the server rejects the token: keep working anonymously.
    token = null;
    user = null;
    OfflineSyncService.authToken = null;
    notifyListeners();
  }
}
