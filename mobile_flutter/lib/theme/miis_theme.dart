import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// MIIS Sri Lanka palette — identical to the MIIS website (deep Indian Ocean + sun amber).
class MiisColors {
  static const bg = Color(0xFF021520);
  static const panel = Color(0xFF041E2D);
  static const panelAlt = Color(0xFF031A27);
  static const amber = Color(0xFFF5A623);
  static const amberSoft = Color(0xFFFBBA45);
  static const teal = Color(0xFF2DD4BF);
  static const emerald = Color(0xFF34D399);
  static const sky = Color(0xFF38BDF8);
  static const violet = Color(0xFFA78BFA);
  static const line = Color(0x26FFFFFF);
  static const muted = Color(0xB3FFFFFF);
  static const faint = Color(0x80FFFFFF);
}

const List<String> kFontFallback = ['Noto Sans Sinhala', 'Noto Sans Tamil', 'Roboto'];

ThemeData buildMiisTheme() {
  final base = ThemeData.dark(useMaterial3: true);
  final text = GoogleFonts.openSansTextTheme(base.textTheme)
      .apply(bodyColor: Colors.white, displayColor: Colors.white, fontFamilyFallback: kFontFallback);

  OutlineInputBorder border(Color c, [double w = 1]) => OutlineInputBorder(
        borderRadius: BorderRadius.circular(12),
        borderSide: BorderSide(color: c, width: w),
      );

  return base.copyWith(
    scaffoldBackgroundColor: MiisColors.bg,
    colorScheme: const ColorScheme.dark(
      primary: MiisColors.amber,
      onPrimary: MiisColors.bg,
      secondary: MiisColors.teal,
      surface: MiisColors.panel,
      onSurface: Colors.white,
    ),
    textTheme: text,
    appBarTheme: const AppBarTheme(
      backgroundColor: MiisColors.bg,
      elevation: 0,
      scrolledUnderElevation: 0,
    ),
    drawerTheme: const DrawerThemeData(backgroundColor: MiisColors.panel),
    dividerColor: MiisColors.line,
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: MiisColors.panel,
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
      labelStyle: const TextStyle(color: MiisColors.muted),
      hintStyle: const TextStyle(color: MiisColors.faint),
      border: border(MiisColors.line),
      enabledBorder: border(MiisColors.line),
      focusedBorder: border(MiisColors.amber, 1.4),
    ),
    snackBarTheme: SnackBarThemeData(
      backgroundColor: MiisColors.panel,
      contentTextStyle: const TextStyle(color: Colors.white),
      behavior: SnackBarBehavior.floating,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
    ),
    progressIndicatorTheme: const ProgressIndicatorThemeData(color: MiisColors.amber),
  );
}
