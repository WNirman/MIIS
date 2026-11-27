import 'package:flutter/material.dart';
import '../theme/miis_theme.dart';

/// Original MIIS Sri Lanka crest: island silhouette in a compass ring with an ocean-current arc.
class MiisCrest extends StatelessWidget {
  final double size;
  const MiisCrest({super.key, this.size = 36});

  @override
  Widget build(BuildContext context) => SizedBox(
        width: size,
        height: size,
        child: CustomPaint(painter: _CrestPainter()),
      );
}

class _CrestPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final s = size.width / 40.0;
    canvas.scale(s);

    final ring = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.1
      ..color = Colors.white.withValues(alpha: 0.4);
    canvas.drawCircle(const Offset(20, 20), 17.5, ring);

    final tick = Paint()
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 1.4
      ..color = MiisColors.amber;
    canvas.drawLine(const Offset(20, 2), const Offset(20, 5), tick);
    canvas.drawLine(const Offset(20, 35), const Offset(20, 38), tick);
    canvas.drawLine(const Offset(2, 20), const Offset(5, 20), tick);
    canvas.drawLine(const Offset(35, 20), const Offset(38, 20), tick);

    final island = Path()
      ..moveTo(20.2, 9.5)
      ..cubicTo(22.5, 13.2, 24.8, 17.5, 24.5, 22.8)
      ..cubicTo(24.2, 26.8, 22.1, 29.8, 19.6, 30.2)
      ..cubicTo(17.1, 29.9, 15.6, 26.6, 15.8, 22.2)
      ..cubicTo(16.0, 17.6, 18.2, 13.0, 20.2, 9.5)
      ..close();
    canvas.drawPath(
      island,
      Paint()
        ..shader = const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [MiisColors.teal, Color(0xFF0E7490)],
        ).createShader(const Rect.fromLTWH(15, 9, 10, 22)),
    );
    canvas.drawPath(
      island,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 0.9
        ..color = Colors.white.withValues(alpha: 0.85),
    );

    final arc = Path()
      ..moveTo(11.5, 28.8)
      ..cubicTo(15.2, 32.2, 24.8, 32.2, 28.5, 28.8);
    canvas.drawPath(
      arc,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeCap = StrokeCap.round
        ..strokeWidth = 1.25
        ..color = MiisColors.amber,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Primary amber pill button (matches the website CTA).
class MiisButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool trailingArrow;
  final bool outlined;
  final bool dense;

  const MiisButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.icon,
    this.trailingArrow = false,
    this.outlined = false,
    this.dense = false,
  });

  @override
  Widget build(BuildContext context) {
    final fg = outlined ? Colors.white : MiisColors.bg;
    final content = Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[Icon(icon, size: 19, color: outlined ? MiisColors.amber : fg), const SizedBox(width: 9)],
        Flexible(
          child: Text(
            label,
            textAlign: TextAlign.center,
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: dense ? 13 : 15, color: fg),
          ),
        ),
        if (trailingArrow) ...[const SizedBox(width: 9), Icon(Icons.arrow_forward, size: 19, color: outlined ? MiisColors.amber : fg)],
      ],
    );

    final pad = EdgeInsets.symmetric(vertical: dense ? 11 : 15, horizontal: 20);
    return SizedBox(
      width: double.infinity,
      child: outlined
          ? OutlinedButton(
              onPressed: onPressed,
              style: OutlinedButton.styleFrom(
                padding: pad,
                shape: const StadiumBorder(),
                side: const BorderSide(color: Color(0x59FFFFFF), width: 1.3),
              ),
              child: content,
            )
          : ElevatedButton(
              onPressed: onPressed,
              style: ElevatedButton.styleFrom(
                backgroundColor: MiisColors.amber,
                disabledBackgroundColor: MiisColors.amber.withValues(alpha: 0.35),
                foregroundColor: MiisColors.bg,
                elevation: 0,
                padding: pad,
                shape: const StadiumBorder(),
              ),
              child: content,
            ),
    );
  }
}

/// Rounded dark panel used for cards.
class MiisCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final Color? borderColor;
  final VoidCallback? onTap;
  const MiisCard({super.key, required this.child, this.padding = const EdgeInsets.all(16), this.borderColor, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: MiisColors.panel,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(color: borderColor ?? MiisColors.line),
      ),
      clipBehavior: Clip.antiAlias,
      child: InkWell(onTap: onTap, child: Padding(padding: padding, child: child)),
    );
  }
}

/// Small coloured chip, e.g. IUCN status or sync state.
class MiisChip extends StatelessWidget {
  final String text;
  final Color color;
  const MiisChip(this.text, {super.key, this.color = MiisColors.amber});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.16),
          borderRadius: BorderRadius.circular(99),
          border: Border.all(color: color.withValues(alpha: 0.5)),
        ),
        child: Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
      );
}

Color iucnColor(String code) {
  switch (code) {
    case 'CR':
      return const Color(0xFFEF4444);
    case 'EN':
      return const Color(0xFFF97316);
    case 'VU':
      return MiisColors.amber;
    case 'NT':
      return const Color(0xFFA3E635);
    default:
      return MiisColors.emerald;
  }
}

/// Two flat tabs like "List | Map" / "Divulgative | Scientific".
class MiisTabs extends StatelessWidget {
  final List<String> labels;
  final int index;
  final ValueChanged<int> onChanged;
  const MiisTabs({super.key, required this.labels, required this.index, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(labels.length, (i) {
        final sel = i == index;
        return Expanded(
          child: InkWell(
            onTap: () => onChanged(i),
            child: Container(
              padding: const EdgeInsets.symmetric(vertical: 14),
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(color: sel ? MiisColors.amber : MiisColors.line, width: sel ? 3 : 1),
                ),
              ),
              child: Text(
                labels[i],
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: sel ? Colors.white : MiisColors.faint,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        );
      }),
    );
  }
}
