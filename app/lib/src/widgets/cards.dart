import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../app_state.dart';
import '../models.dart';
import '../strings.dart';
import '../theme.dart';
import 'sheets.dart';

/// Shared list-card builders used by the section pages (Official alerts,
/// Around me, Terrain). Kept out of the launcher home so both surfaces render
/// identical cards without duplication.

Widget sectionHeader(BuildContext context, String title, {String? badge}) {
  final cs = Theme.of(context).colorScheme;
  return Padding(
    padding: const EdgeInsets.fromLTRB(4, 22, 4, 10),
    child: Row(children: [
      Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
      if (badge != null) ...[
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(color: cs.secondaryContainer, borderRadius: BorderRadius.circular(6)),
          child: Text(badge, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, letterSpacing: .5,
              color: cs.onSecondaryContainer)),
        ),
      ],
    ]),
  );
}

/// Horizontal strip of the user's wilayas with their worst level + fire count.
Widget myWilayasStrip(BuildContext context, AppState st, Snapshot snap) {
  final lang = st.lang;
  final cs = Theme.of(context).colorScheme;
  final codes = [
    if (st.hereWilaya != null && !st.myWilayas.contains(st.hereWilaya)) st.hereWilaya!,
    ...st.myWilayas,
  ];
  return SizedBox(
    height: 102,
    child: ListView(scrollDirection: Axis.horizontal, children: [for (final code in codes) Builder(builder: (ctx) {
      final mine = snap.alerts.where((a) => a.wilayas.any((w) => w.code == code)).toList();
      final top = mine.isEmpty ? null : mine.first;
      final fires = snap.incidents
          .where((i) => i.source == 'dgpc-telegram' && i.hazard == 'fire' && i.status == 'ongoing' && i.wilayas.any((w) => w.code == code))
          .length;
      final v = top == null ? vigilance('green', st.dark) : vigilance(top.color, st.dark);
      return Container(
        width: 158,
        margin: const EdgeInsetsDirectional.only(end: 10),
        padding: const EdgeInsets.all(13),
        decoration: BoxDecoration(
          color: cs.surfaceContainerLow,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: cs.outlineVariant),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            if (code == st.hereWilaya) ...[
              Icon(Icons.my_location, size: 13, color: cs.primary),
              const SizedBox(width: 4),
            ],
            Flexible(
              child: Text(st.wilayaName(code), maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700)),
            ),
          ]),
          const SizedBox(height: 6),
          Row(children: [
            Container(width: 10, height: 10, decoration: BoxDecoration(color: v.solid, borderRadius: BorderRadius.circular(4))),
            const SizedBox(width: 6),
            Expanded(
              child: Text(top == null ? 'OK' : S.t(lang, top.hazard),
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
            ),
          ]),
          if (fires > 0) ...[
            const SizedBox(height: 4),
            Row(children: [
              Icon(Icons.local_fire_department_outlined, size: 13, color: cs.onSurfaceVariant),
              const SizedBox(width: 4),
              Flexible(
                child: Text('$fires ${S.t(lang, 'ongoing')}', maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11.5, color: cs.onSurfaceVariant)),
              ),
            ]),
          ],
        ]),
      );
    })]),
  );
}

/// Big vigilance-colored tile per official alert.
Widget alertCard(BuildContext context, AppState st, AlertItem a, {bool mine = false}) {
  final lang = st.lang;
  final v = vigilance(a.color, st.dark);
  return InkWell(
    onTap: () => showAlertSheet(context, st, a),
    borderRadius: BorderRadius.circular(22),
    child: Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: v.container, borderRadius: BorderRadius.circular(22)),
      child: Row(children: [
        Container(
          width: 54,
          height: 54,
          decoration: BoxDecoration(color: v.solid, shape: BoxShape.circle),
          child: Icon(hazardIcon(a.hazard), color: Colors.white, size: 28),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${S.t(lang, a.hazard)} — ${S.t(lang, a.color)}',
                style: TextStyle(fontSize: 16.5, fontWeight: FontWeight.w800, color: v.onContainer, height: 1.15)),
            const SizedBox(height: 4),
            // GDACS alerts can carry a one-sided or missing window — build the
            // subtitle from non-empty parts so no dangling ' · ' separator leaks.
            Text(
              [wLabel(st, a.wilayas), span(a.onset, a.expires, lang)]
                  .where((p) => p.isNotEmpty)
                  .join(' · '),
              maxLines: 1, overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 12.5, color: v.onContainer.withValues(alpha: .85))),
          ]),
        ),
        Icon(mine ? Icons.my_location : Icons.chevron_right, size: 20,
            color: v.onContainer.withValues(alpha: mine ? 1 : .7)),
      ]),
    ),
  );
}

/// Field incidents: ongoing fires, satellite hotspots, road crashes, quakes.
List<Widget> incidentCards(BuildContext context, AppState st, Snapshot snap) {
  final lang = st.lang;
  final fires = snap.incidents
      .where((i) => i.source == 'dgpc-telegram' && i.hazard == 'fire' && i.status == 'ongoing')
      .take(6);
  final sats = (snap.incidents
          .where((i) => i.source == 'firms' && i.corroborated && !i.possibleIndustrial)
          .toList()
        ..sort((a, b) => b.detections.compareTo(a.detections)))
      .take(5);
  final roads = snap.incidents.where((i) => i.hazard == 'road' && i.source != 'press').take(5);
  final quakes = snap.incidents.where((i) => i.hazard == 'quake').take(5);
  // Official Protection Civile field posts (dgpc.dz) + Algerian press. The
  // press layer covers hazards the official feeds structurally miss (floods in
  // progress, road closures, collapses) and is labelled non-official.
  final official = snap.incidents.where((i) => i.source == 'dgpc-web').take(5);
  final press = snap.incidents.where((i) => i.source == 'press').take(6);

  Widget chip(String text, Color color) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
        decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(99), border: Border.all(color: color, width: 1.5)),
        child: Text(text, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: color)),
      );

  Widget card(IconData icon, String c1, String t1, String t2, Widget trailing) {
    final cs = Theme.of(context).colorScheme;
    final vv = c1 == 'orange' ? vigilance('orange', st.dark) : null;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: cs.surfaceContainerLow, borderRadius: BorderRadius.circular(22)),
      child: Row(children: [
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(
              color: vv?.container ?? cs.surfaceContainerHighest, borderRadius: BorderRadius.circular(18)),
          child: Icon(icon, color: vv?.onContainer ?? cs.onSurfaceVariant, size: 26),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(t1, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            const SizedBox(height: 3),
            Text(t2, maxLines: 1, overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 12.5, color: cs.onSurfaceVariant)),
          ]),
        ),
        trailing,
      ]),
    );
  }

  final red = vigilance('red', st.dark).solid;
  final orange = vigilance('orange', st.dark).solid;
  final green = vigilance('green', st.dark).solid;
  return [
    for (final f in fires)
      card(Icons.local_fire_department_outlined, 'orange', S.t(lang, 'fire'),
          [wLabel(st, f.wilayas), if (f.commune != null) f.commune!, if (f.place != null) f.place!]
              .join(' · '),
          chip(S.t(lang, 'ongoing'), red)),
    for (final s in sats)
      card(Icons.satellite_alt_outlined, '', S.t(lang, 'sat'),
          '${wLabel(st, s.wilayas)} · ${s.detections} ${S.t(lang, 'det')}'
          '${s.frpTrend != null ? ' · ${s.frpTrend == 'rising' ? '↑' : (s.frpTrend == 'declining' ? '↓' : '→')}' : ''}',
          chip('${S.t(lang, 'corr')} ✓', green)),
    for (final r in roads)
      card(Icons.directions_car_outlined, '', S.t(lang, 'road'), wLabel(st, r.wilayas),
          chip(S.t(lang, 'reported'), orange)),
    for (final q in quakes)
      card(Icons.vibration, '', '${S.t(lang, 'quake')} M${q.mag ?? '?'}',
          '${wLabel(st, q.wilayas)} · ${hhmm(q.observedAt)}', chip('EMSC', orange)),
    for (final o in official) sourceCard(context, st, o, official: true),
    for (final p in press) sourceCard(context, st, p, official: false),
  ];
}

/// A headline-carrying incident from dgpc.dz (official) or the Algerian press
/// (non-official). Tapping opens the source article — provenance matters when
/// the app is telling someone their area may be in danger.
Widget sourceCard(BuildContext context, AppState st, Incident i, {required bool official}) {
  final lang = st.lang;
  final cs = Theme.of(context).colorScheme;
  final accent = official ? vigilance('green', st.dark).solid : cs.onSurfaceVariant;
  return InkWell(
    onTap: i.link == null ? null : () => launchUrl(Uri.parse(i.link!), mode: LaunchMode.externalApplication),
    borderRadius: BorderRadius.circular(22),
    child: Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: cs.surfaceContainerLow, borderRadius: BorderRadius.circular(22)),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Container(
          width: 52,
          height: 52,
          decoration: BoxDecoration(color: cs.surfaceContainerHighest, borderRadius: BorderRadius.circular(18)),
          child: Icon(hazardIcon(i.hazard), color: cs.onSurfaceVariant, size: 26),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Provenance line: OFFICIEL / NON OFFICIEL badge + the named source.
            Row(children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(99),
                  border: Border.all(color: accent, width: 1.2),
                ),
                child: Text(official ? S.t(lang, 'src_official') : S.t(lang, 'unofficial'),
                    style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: accent)),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: Text(i.sourceName ?? (official ? 'Protection Civile' : 'Presse'),
                    maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700, color: cs.onSurfaceVariant)),
              ),
              if (i.link != null)
                Icon(Icons.open_in_new, size: 15, color: cs.onSurfaceVariant.withValues(alpha: .7)),
            ]),
            const SizedBox(height: 5),
            Text(i.headlineFr ?? S.t(lang, i.hazard),
                maxLines: 3, overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontSize: 13.5, fontWeight: FontWeight.w600, height: 1.25)),
            const SizedBox(height: 6),
            // Where + a full timestamp (date · time · relative age).
            Row(children: [
              Icon(Icons.place_outlined, size: 13, color: cs.onSurfaceVariant),
              const SizedBox(width: 3),
              Flexible(
                child: Text(wLabel(st, i.wilayas), maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
              ),
              const SizedBox(width: 8),
              Icon(Icons.schedule, size: 13, color: cs.onSurfaceVariant),
              const SizedBox(width: 3),
              Text(stampAgo(i.observedAt, lang),
                  style: TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
            ]),
          ]),
        ),
      ]),
    ),
  );
}

/// Collapse duplicate citizen reports (same category + wilaya) into one entry,
/// newest kept as representative — so 3 reports of the same fire in a wilaya
/// show as one card "×3" instead of three near-identical rows.
List<({CitizenReport rep, int count})> dedupeReports(List<CitizenReport> reports) {
  final groups = <String, List<CitizenReport>>{};
  for (final r in reports) {
    groups.putIfAbsent('${r.category}:${r.wilaya}', () => []).add(r);
  }
  return groups.values.map((g) {
    g.sort((a, b) => b.at.compareTo(a.at));
    return (rep: g.first, count: g.length);
  }).toList()
    ..sort((a, b) => b.rep.at.compareTo(a.rep.at));
}

Widget reportCard(BuildContext context, AppState st, CitizenReport r, {int count = 1}) {
  final lang = st.lang;
  final cs = Theme.of(context).colorScheme;
  final confirmed = r.status == 'community-confirmed';
  return Container(
    margin: const EdgeInsets.only(bottom: 12),
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: cs.surfaceContainerLow, borderRadius: BorderRadius.circular(22)),
    child: Row(children: [
      Container(
        width: 52,
        height: 52,
        decoration: BoxDecoration(color: cs.surfaceContainerHighest, borderRadius: BorderRadius.circular(18)),
        child: Icon(categoryIcons[r.category] ?? Icons.info_outline, color: cs.onSurfaceVariant, size: 26),
      ),
      const SizedBox(width: 14),
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Flexible(
              child: Text(S.t(lang, 'cat_${r.category}'),
                  maxLines: 1, overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
            ),
            if (count > 1) ...[
              const SizedBox(width: 6),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(color: cs.secondaryContainer, borderRadius: BorderRadius.circular(99)),
                child: Text('×$count', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: cs.onSecondaryContainer)),
              ),
            ],
          ]),
          const SizedBox(height: 3),
          Text(
            count > 1
                ? '${st.wilayaName(r.wilaya)} · $count ${S.t(lang, 'reports_n')} · ${hhmm(r.at)}'
                : '${st.wilayaName(r.wilaya)} · ${hhmm(r.at)}${r.description.isNotEmpty ? ' · ${r.description}' : ''}',
            maxLines: 1, overflow: TextOverflow.ellipsis, style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
          ),
          const SizedBox(height: 2),
          Text(confirmed ? '${S.t(lang, 'st_ccf')} ✓' : S.t(lang, 'st_new'),
              style: TextStyle(fontSize: 11, color: confirmed ? vigilance('green', st.dark).solid : cs.onSurfaceVariant)),
        ]),
      ),
      // Keyed by report id: the feed re-sorts on every refresh, so without a
      // stable key the local 👍 "done" state stuck to the slot and jumped to a
      // different report (misattributed community confirmation).
      ConfirmButton(key: ValueKey(r.id), id: r.id, confirms: r.confirms),
    ]),
  );
}

Widget statGrid(BuildContext context, AppState st, Snapshot snap) {
  final lang = st.lang;
  final cs = Theme.of(context).colorScheme;
  final entries = snap.byHazard.entries.toList()..sort((a, b) => b.value.compareTo(a.value));
  return Wrap(spacing: 8, runSpacing: 8, children: [for (final e in entries) Container(
    width: 130,
    padding: const EdgeInsets.all(12),
    decoration: BoxDecoration(color: cs.surfaceContainerLow, borderRadius: BorderRadius.circular(16)),
    child: Row(children: [
      Icon(hazardIcon(e.key), size: 18, color: cs.onSurfaceVariant),
      const SizedBox(width: 8),
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('${e.value}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700, height: 1.1)),
          Text(S.t(lang, e.key), maxLines: 1, overflow: TextOverflow.ellipsis,
              style: TextStyle(fontSize: 10.5, color: cs.onSurfaceVariant)),
        ]),
      ),
    ]),
  )]);
}

class ConfirmButton extends StatefulWidget {
  final String id;
  final int confirms;
  const ConfirmButton({super.key, required this.id, required this.confirms});

  @override
  State<ConfirmButton> createState() => _ConfirmButtonState();
}

class _ConfirmButtonState extends State<ConfirmButton> {
  int? _n;
  bool _done = false;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      onPressed: _done
          ? null
          : () async {
              final n = await context.read<AppState>().confirm(widget.id);
              if (!mounted) return;
              // Audit fix: failure used to lock the button as if it succeeded —
              // stay enabled so the user can retry when the network returns.
              setState(() {
                if (n != null) {
                  _done = true;
                  _n = n;
                }
              });
            },
      style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 10), minimumSize: const Size(0, 32)),
      child: Text('👍 ${_n ?? widget.confirms}', style: const TextStyle(fontSize: 12)),
    );
  }
}
