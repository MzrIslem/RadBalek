import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../app_state.dart';
import '../models.dart';
import '../strings.dart';
import '../theme.dart';
import '../widgets/cards.dart';

/// The three sections that used to scroll inside the home feed, now full
/// pages reached from the launcher tiles. Each watches AppState so it keeps
/// updating live, and pulls-to-refresh like the home did.

/// Wraps a section body in a titled Scaffold with pull-to-refresh + a
/// watermark loader while the first snapshot lands.
class _SectionScaffold extends StatelessWidget {
  final String title;
  final Widget Function(BuildContext, AppState, Snapshot) body;
  const _SectionScaffold({required this.title, required this.body});

  @override
  Widget build(BuildContext context) {
    final st = context.watch<AppState>();
    final snap = st.snapshot;
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: snap == null
          ? Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Opacity(opacity: .18, child: Image.asset('assets/logo.png', width: 96, height: 96)),
                const SizedBox(height: 18),
                const CircularProgressIndicator(),
              ]),
            )
          : RefreshIndicator(
              onRefresh: st.refresh,
              child: ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 28), children: [body(context, st, snap)]),
            ),
    );
  }
}

Widget _emptyNote(BuildContext context, IconData icon, String text, {Color? color}) {
  final cs = Theme.of(context).colorScheme;
  return Padding(
    padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
    child: Column(children: [
      Icon(icon, size: 46, color: color ?? cs.onSurfaceVariant),
      const SizedBox(height: 12),
      Text(text, textAlign: TextAlign.center,
          style: TextStyle(fontSize: 14, color: cs.onSurfaceVariant)),
    ]),
  );
}

/// Official ONM alerts — mine-first, plus my-wilaya strip and by-hazard totals.
class OfficialAlertsScreen extends StatelessWidget {
  const OfficialAlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _SectionScaffold(
      title: S.t(context.read<AppState>().lang, 'official'),
      body: (ctx, st, snap) {
        final lang = st.lang;
        final myCodes = {...st.myWilayas, if (st.hereWilaya != null) st.hereWilaya!};
        final alerts = [
          ...snap.alerts.where((a) => a.wilayas.any((w) => myCodes.contains(w.code))),
          ...snap.alerts.where((a) => !a.wilayas.any((w) => myCodes.contains(w.code))),
        ];
        return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (myCodes.isNotEmpty) ...[
            sectionHeader(ctx, S.t(lang, 'mywilayas')),
            myWilayasStrip(ctx, st, snap),
          ],
          sectionHeader(ctx, S.t(lang, 'official'), badge: 'ONM'),
          if (alerts.isEmpty)
            _emptyNote(ctx, Icons.check_circle_outline, S.t(lang, 'no_alert'),
                color: vigilance('green', st.dark).solid)
          else
            for (final a in alerts)
              alertCard(ctx, st, a, mine: a.wilayas.any((w) => myCodes.contains(w.code))),
          if (snap.byHazard.isNotEmpty) ...[
            sectionHeader(ctx, S.t(lang, 'byhazard')),
            statGrid(ctx, st, snap),
          ],
        ]);
      },
    );
  }
}

/// Citizen reports in the user's wilayas — unofficial, info only.
class NearbyScreen extends StatelessWidget {
  const NearbyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _SectionScaffold(
      title: S.t(context.read<AppState>().lang, 'nearby'),
      body: (ctx, st, snap) {
        final lang = st.lang;
        final myCodes = {...st.myWilayas, if (st.hereWilaya != null) st.hereWilaya!};
        final mine = st.reports.where((r) => r.wilaya != null && myCodes.contains(r.wilaya)).toList();
        return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          sectionHeader(ctx, S.t(lang, 'nearby'), badge: S.t(lang, 'unofficial')),
          if (mine.isEmpty)
            _emptyNote(ctx, Icons.location_off_outlined, S.t(lang, 'nearby_none'))
          else
            for (final r in mine) reportCard(ctx, st, r),
        ]);
      },
    );
  }
}

/// Field picture — official incidents (fires, satellite, roads, quakes) plus
/// the full community report feed.
class TerrainScreen extends StatelessWidget {
  const TerrainScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return _SectionScaffold(
      title: S.t(context.read<AppState>().lang, 'terrain'),
      body: (ctx, st, snap) {
        final lang = st.lang;
        final incidents = incidentCards(ctx, st, snap);
        final community = st.reports.take(12).toList();
        final empty = incidents.isEmpty && community.isEmpty;
        return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          if (empty)
            _emptyNote(ctx, Icons.spa_outlined, S.t(lang, 'terrain_none'),
                color: vigilance('green', st.dark).solid)
          else ...[
            if (incidents.isNotEmpty) ...[
              sectionHeader(ctx, S.t(lang, 'observed'), badge: S.t(lang, 'unofficial')),
              ...incidents,
            ],
            if (community.isNotEmpty) ...[
              sectionHeader(ctx, S.t(lang, 'community'), badge: S.t(lang, 'unofficial')),
              for (final r in community) reportCard(ctx, st, r),
            ],
          ],
        ]);
      },
    );
  }
}
