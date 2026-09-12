import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../app_state.dart';
import '../models.dart';
import '../regions.dart';
import '../strings.dart';
import '../theme.dart';
import '../widgets/cards.dart';
import '../widgets/sheets.dart';

/// The three sections that used to scroll inside the home feed, now full
/// pages reached from the launcher tiles. Each watches AppState so it keeps
/// updating live, and pulls-to-refresh like the home did.

/// Wraps a section body in a titled Scaffold with pull-to-refresh + a
/// watermark loader while the first snapshot lands.
class _SectionScaffold extends StatelessWidget {
  final String title;
  // Returns the flat list of rows (headers + cards) rather than one big Column,
  // so the ListView's SliverList only inflates the rows on screen. A national
  // ONM feed is ~80 alerts; the old single-Column child rendered every card at
  // once on every rebuild.
  final List<Widget> Function(BuildContext, AppState, Snapshot) body;
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
                if (st.sourceStatus != 'offline') const CircularProgressIndicator() else ...[
                  Text(S.t(st.lang, 'load_fail'),
                      style: TextStyle(fontSize: 13, color: Theme.of(context).colorScheme.onSurfaceVariant)),
                  const SizedBox(height: 10),
                  FilledButton.tonalIcon(
                    onPressed: () => st.refresh(force: true),
                    icon: const Icon(Icons.refresh, size: 18),
                    label: Text(S.t(st.lang, 'retry')),
                  ),
                ],
              ]),
            )
          : RefreshIndicator(
              onRefresh: () => st.refresh(force: true),
              // Flat children (not one Column) → SliverList inflates only the
              // visible rows. ListView stretches each to full width, exactly as
              // the home feed already renders these same cards.
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
                children: body(context, st, snap),
              ),
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
        // Cache guard: only still-valid alerts. An expired window can only
        // linger in an offline/cached snapshot — live fetches are already
        // filtered server-side.
        final alerts = [
          ...snap.alerts.where((a) => a.active && a.wilayas.any((w) => myCodes.contains(w.code))),
          ...snap.alerts.where((a) => a.active && !a.wilayas.any((w) => myCodes.contains(w.code))),
        ];
        return [
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
        ];
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
        // Streamlined: duplicate reports (same category + wilaya) collapse into
        // one card with a ×N count, on top of the server-side AI moderation.
        final groups = dedupeReports(mine);
        return [
          sectionHeader(ctx, S.t(lang, 'nearby'), badge: S.t(lang, 'unofficial')),
          if (groups.isEmpty)
            _emptyNote(ctx, Icons.location_off_outlined, S.t(lang, 'nearby_none'))
          else
            for (final g in groups) reportCard(ctx, st, g.rep, count: g.count),
        ];
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
        return [
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
        ];
      },
    );
  }
}

/// Radar: local 72h alert-change timeline. Renders AppState.timeline — the
/// change-events this device has witnessed — so it works fully offline and
/// never claims history it didn't see (honest-data doctrine).
class TimelineScreen extends StatefulWidget {
  const TimelineScreen({super.key});

  @override
  State<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends State<TimelineScreen> {
  String _filter = 'all'; // all | mine | est | centre | ouest | sud

  @override
  Widget build(BuildContext context) {
    final st = context.watch<AppState>();
    final lang = st.lang;
    final cs = Theme.of(context).colorScheme;
    final myCodes = {...st.myWilayas, if (st.hereWilaya != null) st.hereWilaya!};
    final shown = <Map<String, dynamic>>[];
    for (final e in st.timeline.reversed) {
      final hits = (e['a'] as List? ?? const [])
          .whereType<Map<String, dynamic>>()
          .where((a) {
        final codes =
            (a['w'] as List? ?? const []).map((x) => (x as num).toInt()).toSet();
        switch (_filter) {
          case 'mine':
            return codes.any(myCodes.contains);
          case 'est':
          case 'centre':
          case 'ouest':
          case 'sud':
            return codes.any((c) => regionMembers[_filter]!.contains(c));
          default:
            return true;
        }
      }).toList();
      if (hits.isNotEmpty) shown.add({...e, 'a': hits});
    }
    return Scaffold(
      appBar: AppBar(title: Text(S.t(lang, 'timeline'))),
      body: shown.isEmpty
          ? _emptyNote(context, Icons.timeline_outlined, S.t(lang, 'tl_none'))
          : ListView(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 28),
              children: [
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    for (final f in const [
                      'all',
                      'mine',
                      'est',
                      'centre',
                      'ouest',
                      'sud'
                    ])
                      ChoiceChip(
                        selected: _filter == f,
                        onSelected: (_) => setState(() => _filter = f),
                        label: Text(f == 'all'
                            ? S.t(lang, 'tl_all')
                            : f == 'mine'
                                ? S.t(lang, 'mywilayas')
                                : regionName(f, lang)),
                      ),
                  ],
                ),
                const SizedBox(height: 10),
                for (final e in shown) ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(2, 10, 2, 6),
                    child: Text(
                      stampAgo(e['t'] as String?, lang).toUpperCase(),
                      style: TextStyle(
                          fontSize: 10.5,
                          fontWeight: FontWeight.w700,
                          letterSpacing: .4,
                          color: cs.onSurface.withValues(alpha: .6)),
                    ),
                  ),
                  for (final a in (e['a'] as List).cast<Map<String, dynamic>>())
                    Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 10),
                        decoration: BoxDecoration(
                          color: cs.surfaceContainerLow,
                          borderRadius: BorderRadius.circular(14),
                          border: Border(
                            left: BorderSide(
                                width: 4,
                                color: vigilance(a['c'] as String? ?? 'yellow',
                                        st.dark)
                                    .solid),
                          ),
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Icon(
                                hazardIcons[a['h'] as String?] ??
                                    hazardIcons['other']!,
                                size: 17,
                                color: cs.onSurfaceVariant),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    '${S.t(lang, a['h'] as String? ?? 'other')}'
                                    ' · ${(a['w'] as List? ?? const []).join(", ")}',
                                    style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w800),
                                  ),
                                  if ((a['x'] as String? ?? '').isNotEmpty)
                                    Text(a['x'] as String,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                        style: TextStyle(
                                            fontSize: 11.5,
                                            color: cs.onSurface
                                                .withValues(alpha: .7))),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ],
            ),
    );
  }
}
