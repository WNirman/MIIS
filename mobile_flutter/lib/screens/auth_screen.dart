import 'package:flutter/material.dart';
import '../data/constants.dart';
import '../state/app_scope.dart';
import '../theme/miis_theme.dart';
import '../widgets/miis_widgets.dart';

/// Login or Create-account form (one screen, switchable like the reference app).
class AuthScreen extends StatefulWidget {
  final bool register;
  const AuthScreen({super.key, required this.register});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  late bool _register = widget.register;
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  final _name = TextEditingController();
  final _org = TextEditingController();
  String _district = 'Colombo';
  bool _busy = false;
  bool _hide = true;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    _name.dispose();
    _org.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final app = context.app;
    final email = _email.text.trim();
    final pass = _password.text;
    if (email.isEmpty || pass.isEmpty || (_register && (_name.text.trim().isEmpty || pass.length < 6))) {
      setState(() => _error = app.t('auth.required'));
      return;
    }
    if (_register && _confirmPassword.text != pass) {
      setState(() => _error = app.t('auth.passwordMismatch'));
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    final err = _register
        ? await app.register(
            fullName: _name.text,
            email: email,
            password: pass,
            organization: _org.text,
            district: _district,
          )
        : await app.login(email, pass);
    if (!mounted) return;
    if (err == null) {
      Navigator.of(context).popUntil((r) => r.isFirst);
    } else {
      setState(() {
        _busy = false;
        _error = err;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final app = context.app;
    return Scaffold(
      appBar: AppBar(
        toolbarHeight: 64,
        titleSpacing: 0,
        title: Row(
          children: [
            const MiisCrest(size: 30),
            const SizedBox(width: 10),
            Text(app.t('app.name'), style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          ],
        ),
        bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1, color: MiisColors.line)),
      ),
      body: Stack(
        children: [
          SafeArea(
            child: ListView(
              padding: const EdgeInsets.fromLTRB(22, 26, 22, 30),
              children: [
                Text(
                  _register ? app.t('auth.registerTitle') : app.t('auth.loginTitle'),
                  style: const TextStyle(fontSize: 32, fontWeight: FontWeight.w400),
                ),
                const SizedBox(height: 22),
                if (_error != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0x33EF4444),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0x80EF4444)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline, color: Color(0xFFFCA5A5), size: 20),
                        const SizedBox(width: 10),
                        Expanded(child: Text(_error!, style: const TextStyle(fontSize: 13, color: Color(0xFFFECACA)))),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                if (_register) ...[
                  TextField(
                    controller: _name,
                    textCapitalization: TextCapitalization.words,
                    decoration: InputDecoration(labelText: app.t('auth.fullName')),
                  ),
                  const SizedBox(height: 14),
                ],
                TextField(
                  controller: _email,
                  keyboardType: TextInputType.emailAddress,
                  autocorrect: false,
                  decoration: InputDecoration(labelText: app.t('auth.email')),
                ),
                const SizedBox(height: 14),
                TextField(
                  controller: _password,
                  obscureText: _hide,
                  onSubmitted: (_) => _submit(),
                  decoration: InputDecoration(
                    labelText: _register ? app.t('auth.passwordMin') : app.t('auth.password'),
                    suffixIcon: IconButton(
                      icon: Icon(_hide ? Icons.visibility_outlined : Icons.visibility_off_outlined, size: 20),
                      onPressed: () => setState(() => _hide = !_hide),
                    ),
                  ),
                ),
                if (_register) ...[
                  const SizedBox(height: 14),
                  TextField(
                    controller: _confirmPassword,
                    obscureText: _hide,
                    decoration: InputDecoration(labelText: app.t('auth.confirmPassword')),
                  ),
                  const SizedBox(height: 14),
                  DropdownButtonFormField<String>(
                    initialValue: _district,
                    dropdownColor: MiisColors.panel,
                    decoration: InputDecoration(labelText: app.t('auth.district')),
                    items: kCoastalDistricts.map((d) => DropdownMenuItem(value: d, child: Text(d))).toList(),
                    onChanged: (v) => setState(() => _district = v ?? _district),
                  ),
                  const SizedBox(height: 14),
                  TextField(controller: _org, decoration: InputDecoration(labelText: app.t('auth.org'))),
                ],
                const SizedBox(height: 22),
                MiisButton(
                  label: _register ? app.t('auth.registerBtn') : app.t('auth.loginBtn'),
                  onPressed: _busy ? null : _submit,
                ),
                const SizedBox(height: 18),
                if (!_register)
                  TextButton(
                    onPressed: () => showDialog(
                      context: context,
                      builder: (_) => AlertDialog(
                        backgroundColor: MiisColors.panel,
                        content: Text(app.t('auth.forgotMsg')),
                        actions: [
                          TextButton(onPressed: () => Navigator.pop(context), child: Text(app.t('common.close'))),
                        ],
                      ),
                    ),
                    style: TextButton.styleFrom(alignment: Alignment.centerLeft, padding: EdgeInsets.zero),
                    child: Text(
                      app.t('auth.forgot'),
                      style: const TextStyle(decoration: TextDecoration.underline, color: Colors.white, fontSize: 15),
                    ),
                  ),
                const SizedBox(height: 4),
                Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(_register ? app.t('auth.haveAccount') : app.t('auth.noAccount'),
                        style: const TextStyle(color: MiisColors.muted, fontSize: 15)),
                    TextButton(
                      onPressed: () => setState(() {
                        _register = !_register;
                        _error = null;
                      }),
                      child: Text(
                        _register ? app.t('auth.signIn') : app.t('auth.signUp'),
                        style: const TextStyle(
                          decoration: TextDecoration.underline,
                          color: MiisColors.amber,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          if (_busy)
            Positioned.fill(
              child: Container(
                color: const Color(0x99000000),
                alignment: Alignment.center,
                child: Container(
                  width: 78,
                  height: 78,
                  decoration: BoxDecoration(color: MiisColors.panel, borderRadius: BorderRadius.circular(14)),
                  child: const Center(child: CircularProgressIndicator()),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
