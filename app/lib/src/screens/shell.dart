import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../app_state.dart';
import '../strings.dart';
import '../widgets/sheets.dart';
import '../widgets/transitions.dart';
import 'chat.dart';
import 'home.dart';
import 'map.dart';
import 'onboarding.dart';
import 'settings.dart';

/// Adaptive navigation: bottom bar on phones, rail on wide/landscape.
/// "Report" is an action (opens the sheet), not a destination.
class Shell extends StatefulWidget {
  const Shell({super.key});

  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> with WidgetsBindingObserver {
  int _index = 0; // 0 home, 1 map, 2 settings

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    // Push-driven model: refresh on resume (plus FCM onMessage), no polling.
    // refresh() is throttled (60s) and triggers locate() itself, so a quick
    // app-switch no longer re-fetches everything + a fresh GPS fix each time.
    if (state == AppLifecycleState.resumed && mounted) {
      context.read<AppState>().refresh();
    }
  }

  @override
  Widget build(BuildContext context) {
    final st = context.watch<AppState>();
    if (!st.onboarded) return const OnboardingScreen();
    final lang = st.lang;
    final cs = Theme.of(context).colorScheme;

    final body = switch (_index) {
      1 => const MapScreen(),
      2 => const SettingsScreen(),
      _ => HomeScreen(goTo: (i) => setState(() => _index = i)),
    };
    // Soft cross-fade between tabs — a light touch of fluidity, no gesture
    // conflict with the map's own pan/zoom (which a swipe-nav would fight).
    final animatedBody = AnimatedSwitcher(
      duration: const Duration(milliseconds: 190),
      switchInCurve: Curves.easeOut,
      switchOutCurve: Curves.easeIn,
      transitionBuilder: (child, anim) => FadeTransition(opacity: anim, child: child),
      child: KeyedSubtree(key: ValueKey(_index), child: body),
    );

    final destinations = [
      (Icons.notifications_outlined, Icons.notifications, S.t(lang, 'nav_alerts')),
      (Icons.map_outlined, Icons.map, S.t(lang, 'nav_map')),
      (Icons.add_circle_outline, Icons.add_circle, S.t(lang, 'nav_report')),
      (Icons.settings_outlined, Icons.settings, S.t(lang, 'nav_settings')),
    ];

    int navIndex() => switch (_index) { 1 => 1, 2 => 3, _ => 0 };

    void onSelect(int i) {
      if (i == 2) {
        showReportSheet(context, st);
        return;
      }
      setState(() => _index = switch (i) { 1 => 1, 3 => 2, _ => 0 });
    }

    final appBar = AppBar(
      titleSpacing: 16,
      title: Row(children: [
        Image.asset('assets/logo.png', width: 40, height: 40),
        const SizedBox(width: 10),
        Flexible(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            Text(S.t(lang, 'app'), maxLines: 1, overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
            Text('${S.t(lang, 'tagline')} · ${S.t(lang, st.sourceStatus)}',
                maxLines: 1, overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
          ]),
        ),
      ]),
      actions: [
        PopupMenuButton<String>(
          icon: const Icon(Icons.translate),
          tooltip: 'Langue / اللغة',
          initialValue: lang,
          onSelected: st.setLang,
          itemBuilder: (_) => [
            for (final (code, label) in const [('fr', 'Français'), ('ar', 'العربية'), ('en', 'English')])
              PopupMenuItem(
                value: code,
                child: Row(children: [
                  SizedBox(width: 24, child: lang == code ? const Icon(Icons.check, size: 18) : null),
                  Text(label),
                ]),
              ),
          ],
        ),
        IconButton(
          tooltip: S.t(lang, 'assistant'),
          onPressed: () => Navigator.of(context).push(fluidRoute(const ChatScreen())),
          icon: const Icon(Icons.auto_awesome_outlined),
        ),
        IconButton(
          onPressed: st.toggleDark,
          icon: Icon(st.dark ? Icons.light_mode_outlined : Icons.dark_mode_outlined),
        ),
        const SizedBox(width: 4),
      ],
    );

    return LayoutBuilder(builder: (ctx, box) {
      final wide = box.maxWidth >= 700;
      if (wide) {
        return Scaffold(
          appBar: appBar,
          body: Row(children: [
            NavigationRail(
              selectedIndex: navIndex(),
              onDestinationSelected: onSelect,
              labelType: NavigationRailLabelType.all,
              destinations: [for (final (o, f, l) in destinations)
                NavigationRailDestination(icon: Icon(o), selectedIcon: Icon(f), label: Text(l))],
            ),
            const VerticalDivider(width: 1),
            Expanded(child: animatedBody),
          ]),
        );
      }
      return Scaffold(
        appBar: appBar,
        body: animatedBody,
        bottomNavigationBar: NavigationBar(
          selectedIndex: navIndex(),
          onDestinationSelected: onSelect,
          destinations: [for (final (o, f, l) in destinations)
            NavigationDestination(icon: Icon(o), selectedIcon: Icon(f), label: l)],
        ),
      );
    });
  }
}
