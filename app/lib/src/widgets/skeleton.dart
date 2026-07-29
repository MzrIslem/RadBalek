import 'package:flutter/material.dart';

/// Loading placeholder that mimics the home layout (hero + condition tiles +
/// two cards) with a single shared pulse — lighter and calmer than a spinner,
/// and it tells the user *what* is about to appear. One AnimationController for
/// the whole screen (not one per box), disposed with the widget.
class HomeSkeleton extends StatefulWidget {
  const HomeSkeleton({super.key});
  @override
  State<HomeSkeleton> createState() => _HomeSkeletonState();
}

class _HomeSkeletonState extends State<HomeSkeleton> with SingleTickerProviderStateMixin {
  late final AnimationController _c =
      AnimationController(vsync: this, duration: const Duration(milliseconds: 1100))..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final onSurf = Theme.of(context).colorScheme.onSurface;
    return AnimatedBuilder(
      animation: _c,
      builder: (context, _) {
        final color = Color.lerp(onSurf.withValues(alpha: .05), onSurf.withValues(alpha: .12), _c.value)!;
        Widget box({double? width, double height = 16, double radius = 8}) => Container(
              width: width,
              height: height,
              decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(radius)),
            );
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            box(height: 150, radius: 28), // hero
            const SizedBox(height: 14),
            Row(children: [
              Expanded(child: box(height: 72, radius: 16)),
              const SizedBox(width: 10),
              Expanded(child: box(height: 72, radius: 16)),
              const SizedBox(width: 10),
              Expanded(child: box(height: 72, radius: 16)),
            ]),
            const SizedBox(height: 22),
            box(width: 150, height: 14), // section label
            const SizedBox(height: 12),
            box(height: 84, radius: 16),
            const SizedBox(height: 10),
            box(height: 84, radius: 16),
          ],
        );
      },
    );
  }
}
