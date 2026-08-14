import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../ai.dart';
import '../app_state.dart';
import '../diag.dart';
import '../models.dart';
import '../strings.dart';
import '../theme.dart';
import '../screens/consignes.dart';
import 'transitions.dart';

String hhmm(String? iso) {
  if (iso == null || iso.isEmpty) return '';
  final d = DateTime.tryParse(iso)?.toLocal();
  if (d == null) return '';
  return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
}

/// Validity window with DATES when the range crosses a day boundary.
/// 43 of 83 live alerts span midnight — "19:00 → 19:00" read as a zero-length
/// (or already-over) window when it actually meant "until 19:00 TOMORROW".
/// The \u2066...\u2069 LTR isolate keeps "19:00 -> 20:00" from reordering into
/// "20:00 -> 19:00" inside Arabic (RTL) text — the arrow is bidi-neutral and
/// gets resolved right-to-left between two number runs.
String span(String? a, String? b) {
  final x = DateTime.tryParse(a ?? '')?.toLocal();
  final y = DateTime.tryParse(b ?? '')?.toLocal();
  final sameDay = x != null && y != null && x.day == y.day && x.month == y.month;
  String dm(DateTime? d) =>
      d == null ? '' : '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')} ';
  final left = '${sameDay ? '' : dm(x)}${hhmm(a)}';
  final right = '${sameDay ? '' : dm(y)}${hhmm(b)}';
  return '\u2066$left → $right\u2069';
}

/// Single deadline, dated only when it is NOT today. "valable jusqu'à 19:00"
/// on a 24h alert made people think it ended that evening — it ran to 19:00
/// tomorrow.
String untilStamp(String? iso) {
  final d = DateTime.tryParse(iso ?? '')?.toLocal();
  if (d == null) return '';
  final now = DateTime.now();
  final today = d.day == now.day && d.month == now.month && d.year == now.year;
  final dm = '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')} ';
  return '\u2066${today ? '' : dm}${hhmm(iso)}\u2069';
}

/// Full timestamp + relative age: "21/07 · 14:30 · il y a 2 h" (localized).
/// Used where provenance matters (press / official field posts).
String stampAgo(String? iso, String lang) {
  if (iso == null || iso.isEmpty) return '';
  final d = DateTime.tryParse(iso)?.toLocal();
  if (d == null) return '';
  final dm = '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}';
  final hm = '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
  final diff = DateTime.now().difference(d);
  final String rel;
  if (diff.isNegative || diff.inMinutes < 1) {
    rel = switch (lang) { 'ar' => 'الآن', 'en' => 'just now', _ => "à l'instant" };
  } else if (diff.inMinutes < 60) {
    final n = diff.inMinutes;
    rel = switch (lang) { 'ar' => 'منذ $n د', 'en' => '$n min ago', _ => 'il y a $n min' };
  } else if (diff.inHours < 24) {
    final n = diff.inHours;
    rel = switch (lang) { 'ar' => 'منذ $n س', 'en' => '$n h ago', _ => 'il y a $n h' };
  } else {
    final n = diff.inDays;
    rel = switch (lang) { 'ar' => 'منذ $n ي', 'en' => '$n d ago', _ => 'il y a $n j' };
  }
  return '$dm · $hm · $rel';
}

/// Current-conditions line with unknown fields dropped. A wilaya whose
/// Open-Meteo call failed is still emitted with all-null fields, which leaked
/// "null°C (null°) · 💨 null km/h · 💧 null%". Returns '' when nothing is known.
String wxLine(Map w) {
  final parts = <String>[];
  final t = w['t'], feels = w['feels'], wind = w['wind'], rh = w['rh'];
  if (t is num) parts.add('${t.round()}°C${feels is num ? ' (${feels.round()}°)' : ''}');
  if (wind is num) parts.add('💨 ${wind.round()} km/h');
  if (rh != null) parts.add('💧 $rh%');
  return parts.join(' · ');
}

String wLabel(AppState st, List<Wilaya> ws) {
  if (ws.isEmpty) return st.lang == 'ar' ? 'الجزائر' : 'Algérie';
  return ws.map((w) => st.lang == 'ar' ? 'ولاية ${w.ar}' : w.fr).join('، ');
}

/// A self-contained, shareable alert card — mirrors the sheet header (guaranteed
/// legible container/onContainer pairing) so a screenshot shared to WhatsApp /
/// Facebook carries the hazard, wilaya, window and top actions. WhatsApp is
/// where Algeria actually forwards warnings, so this doubles as reach.
Widget _shareCard(BuildContext context, AppState st, AlertItem a) {
  final lang = st.lang;
  final v = vigilance(a.color, false); // always the light palette — legible on any chat background
  final acts = S.actions(lang, a.hazard).take(3).toList();
  return Container(
    width: 380,
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
    clipBehavior: Clip.antiAlias,
    child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(height: 6, width: double.infinity, color: v.solid),
      Container(
        width: double.infinity,
        color: v.container,
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(hazardIcon(a.hazard), color: v.onContainer, size: 26),
            const SizedBox(width: 10),
            Expanded(
              child: Text('${S.t(lang, a.hazard)} — ${S.t(lang, a.color)}',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: v.onContainer)),
            ),
          ]),
          const SizedBox(height: 6),
          Text('📍 ${wLabel(st, a.wilayas)}',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: v.onContainer)),
        ]),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(18, 12, 18, 14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('🕐 ${span(a.onset, a.expires)}', style: const TextStyle(fontSize: 13, color: Colors.black87)),
          const SizedBox(height: 10),
          Text(S.t(lang, 'action').toUpperCase(),
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: .5, color: v.solid)),
          const SizedBox(height: 5),
          for (final act in acts)
            Padding(
              padding: const EdgeInsets.only(bottom: 3),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('•  ', style: TextStyle(color: Colors.black87)),
                Expanded(child: Text(act, style: const TextStyle(fontSize: 12.5, height: 1.3, color: Colors.black87))),
              ]),
            ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 8),
          Row(children: [
            Text('🛡️ Rad Balek رد بالك',
                style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w800, color: v.solid)),
            const Spacer(),
            const Text('☎ 14 / 1021', style: TextStyle(fontSize: 12, color: Colors.black54)),
          ]),
        ]),
      ),
    ]),
  );
}

/// Render [_shareCard] to a PNG off-screen and open the share sheet. Rendered
/// inside the app's Overlay (so it inherits theme + Directionality), translated
/// far off-viewport so it paints without ever flashing on screen. Text scaling
/// is pinned so "Texte grand" can't distort the exported image. Returns false
/// on any failure so the caller can fall back to the text share.
Future<bool> shareAlertImage(BuildContext context, AppState st, AlertItem a) async {
  final overlay = Overlay.maybeOf(context);
  if (overlay == null) return false;
  final key = GlobalKey();
  final entry = OverlayEntry(
    builder: (_) => Positioned(
      left: 0,
      top: 0,
      child: Transform.translate(
        offset: const Offset(-5000, 0), // paints into its RepaintBoundary layer, never visible
        child: MediaQuery(
          data: MediaQuery.of(context).copyWith(textScaler: TextScaler.noScaling),
          child: Material(
            type: MaterialType.transparency,
            child: RepaintBoundary(key: key, child: _shareCard(context, st, a)),
          ),
        ),
      ),
    ),
  );
  overlay.insert(entry);
  try {
    await WidgetsBinding.instance.endOfFrame;
    final ro = key.currentContext?.findRenderObject();
    if (ro is! RenderRepaintBoundary) return false;
    final image = await ro.toImage(pixelRatio: 3);
    final data = await image.toByteData(format: ui.ImageByteFormat.png);
    image.dispose();
    if (data == null) return false;
    await SharePlus.instance.share(ShareParams(
      files: [XFile.fromData(data.buffer.asUint8List(), mimeType: 'image/png', name: 'rad-balek-alerte.png')],
    ));
    return true;
  } catch (err) {
    logErr('share alert card', err);
    return false;
  } finally {
    entry.remove();
  }
}

/// Alert detail: the 5-element safety message (source, impact, location,
/// window, actions) + call button.
void showAlertSheet(BuildContext context, AppState st, AlertItem a) {
  final dark = st.dark;
  final v = vigilance(a.color, dark);
  final lang = st.lang;
  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.72,
      builder: (ctx, ctl) => ListView(
        controller: ctl,
        padding: EdgeInsets.zero,
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(22, 18, 22, 16),
            color: v.container,
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Icon(hazardIcon(a.hazard), color: v.onContainer, size: 26),
                const SizedBox(width: 10),
                Expanded(
                  child: Text('${S.t(lang, a.hazard)} — ${S.t(lang, a.color)}',
                      style: TextStyle(fontSize: 21, fontWeight: FontWeight.w700, color: v.onContainer)),
                ),
              ]),
              const SizedBox(height: 4),
              Text('${S.t(lang, 'source')}: Météo Algérie (ONM) · ${hhmm(a.sent)}',
                  style: TextStyle(fontSize: 12, color: v.onContainer.withValues(alpha: .85))),
            ]),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(22, 16, 22, 26),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              _row5(ctx, Icons.info_outline, S.t(lang, 'what'), Text(S.impact(lang, a.hazard))),
              _row5(ctx, Icons.place_outlined, S.t(lang, 'where'), Text(wLabel(st, a.wilayas))),
              _row5(ctx, Icons.schedule, S.t(lang, 'when'),
                  Text(span(a.onset, a.expires))),
              if (a.wilayas.isNotEmpty && st.weather[a.wilayas.first.code] != null)
                Builder(builder: (_) {
                  final line = wxLine(st.weather[a.wilayas.first.code]!);
                  if (line.isEmpty) return const SizedBox.shrink();
                  return _row5(ctx, Icons.thermostat, S.t(lang, 'cond'), Text(line));
                }),
              if (a.hazard == 'heat' || a.hazard == 'flood' || a.hazard == 'quake') ...[
                _row5(ctx, Icons.warning_amber_outlined, S.t(lang, 'sym'), Text(S.t(lang, 'sym_${a.hazard}'))),
                _row5(ctx, Icons.medical_services_outlined, S.t(lang, 'aid'), Text(S.t(lang, 'aid_${a.hazard}'))),
              ],
              _row5(
                ctx,
                Icons.check_circle_outline,
                S.t(lang, 'action'),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [for (final act in S.actions(lang, a.hazard)) Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Text('•  '),
                      Expanded(child: Text(act)),
                    ]),
                  )],
                ),
              ),
              const SizedBox(height: 10),
              Wrap(spacing: 10, runSpacing: 8, children: [
                FilledButton.icon(
                  style: FilledButton.styleFrom(backgroundColor: v.container, foregroundColor: v.onContainer),
                  onPressed: () => launchUrl(Uri.parse('tel:14')),
                  icon: const Icon(Icons.call),
                  label: Text(S.t(lang, 'call')),
                ),
                OutlinedButton.icon(
                  onPressed: () {
                    final acts = S.actions(lang, a.hazard).map((x) => '• $x').join('\n');
                    SharePlus.instance.share(ShareParams(
                        text:
                            '⚠️ ${a.headline['fr'] ?? ''}\n${a.headline['ar'] ?? ''}\n🕐 ${span(a.onset, a.expires)}\n$acts\n— Rad Balek رد بالك'));
                  },
                  icon: const Icon(Icons.share_outlined),
                  label: Text(S.t(lang, 'share')),
                ),
                OutlinedButton.icon(
                  onPressed: () async {
                    final ok = await shareAlertImage(context, st, a);
                    if (!ok) {
                      // Capture failed (rare) — never leave the button dead; fall
                      // back to the text share so the warning still goes out.
                      final acts = S.actions(lang, a.hazard).map((x) => '• $x').join('\n');
                      await SharePlus.instance.share(ShareParams(
                          text:
                              '⚠️ ${a.headline['fr'] ?? ''}\n${a.headline['ar'] ?? ''}\n🕐 ${span(a.onset, a.expires)}\n$acts\n— Rad Balek رد بالك'));
                    }
                  },
                  icon: const Icon(Icons.image_outlined),
                  label: Text(S.t(lang, 'share_image')),
                ),
                OutlinedButton.icon(
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    Navigator.of(context).push(
                        fluidRoute(ConsignesScreen(focusHazard: a.hazard)));
                  },
                  icon: const Icon(Icons.menu_book_outlined),
                  label: Text(S.t(lang, 'consignes')),
                ),
              ]),
            ]),
          ),
        ],
      ),
    ),
  );
}

Widget _row5(BuildContext ctx, IconData icon, String label, Widget child) {
  final cs = Theme.of(ctx).colorScheme;
  return Padding(
    padding: const EdgeInsets.only(bottom: 14),
    child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Container(
        width: 38,
        height: 38,
        decoration: BoxDecoration(color: cs.surfaceContainerHighest, borderRadius: BorderRadius.circular(12)),
        child: Icon(icon, size: 18, color: cs.onSurfaceVariant),
      ),
      const SizedBox(width: 12),
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label.toUpperCase(),
              style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: .8, color: cs.onSurfaceVariant)),
          const SizedBox(height: 2),
          child,
        ]),
      ),
    ]),
  );
}

/// 7-day national history from the worker's hourly snapshots.
void showHistorySheet(BuildContext context, AppState st) {
  final lang = st.lang;
  showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    builder: (ctx) => FutureBuilder<List<Map<String, dynamic>>>(
      future: st.api.fetchHistory(),
      builder: (ctx, snap) {
        if (!snap.hasData) return const SizedBox(height: 200, child: Center(child: CircularProgressIndicator()));
        final items = snap.data!;
        Widget pill(String color, int n) {
          final v = vigilance(color, st.dark);
          return Container(
            margin: const EdgeInsetsDirectional.only(end: 6),
            padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 2),
            decoration: BoxDecoration(color: v.container, borderRadius: BorderRadius.circular(99)),
            child: Text('$n', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: v.onContainer)),
          );
        }
        return Column(children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(22, 4, 22, 8),
            child: Text(S.t(lang, 'history'), style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700)),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(22, 0, 22, 20),
              itemCount: items.length,
              itemBuilder: (ctx, i) {
                final it = items[i];
                final bc = ((it['stats'] as Map?)?['byColor'] as Map?) ?? {};
                final d = DateTime.tryParse(it['at'] as String? ?? '')?.toLocal();
                final label = d == null
                    ? ''
                    : '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')} ${d.hour.toString().padLeft(2, '0')}h';
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 5),
                  child: Row(children: [
                    SizedBox(width: 74, child: Text(label, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600))),
                    pill('red', (bc['red'] as num?)?.toInt() ?? 0),
                    pill('orange', (bc['orange'] as num?)?.toInt() ?? 0),
                    pill('yellow', (bc['yellow'] as num?)?.toInt() ?? 0),
                  ]),
                );
              },
            ),
          ),
        ]);
      },
    ),
  );
}

/// Citizen report form: category grid + wilaya picker + description.
void showReportSheet(BuildContext context, AppState st) {
  final lang = st.lang;
  String? category;
  int? wilaya;
  final desc = TextEditingController();
  bool sending = false;
  bool done = false;
  bool aiBusy = false;

  showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setSt) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
        child: done
            ? Padding(
                padding: const EdgeInsets.all(30),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.check_circle_outline, size: 44, color: vigilance('green', st.dark).solid),
                  const SizedBox(height: 10),
                  Text(S.t(lang, 'rep_sent'), textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 16),
                ]),
              )
            : ListView(
                shrinkWrap: true,
                padding: const EdgeInsets.fromLTRB(22, 4, 22, 26),
                children: [
                  Text(S.t(lang, 'report'), style: const TextStyle(fontSize: 21, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 14),
                  Text(S.t(lang, 'rep_cat'),
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: .8,
                          color: Theme.of(ctx).colorScheme.onSurfaceVariant)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [for (final c in categoryIcons.keys) ChoiceChip(
                      avatar: Icon(categoryIcons[c], size: 17),
                      label: Text(S.t(lang, 'cat_$c')),
                      selected: category == c,
                      onSelected: (_) => setSt(() => category = c),
                    )],
                  ),
                  const SizedBox(height: 14),
                  DropdownButtonFormField<int>(
                    initialValue: wilaya,
                    decoration: InputDecoration(
                      labelText: S.t(lang, 'rep_where'),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    hint: Text(S.t(lang, 'choose_w')),
                    items: [for (final w in st.wilayas) DropdownMenuItem(value: w.code, child: Text('${w.code} — ${w.name(lang)}'))],
                    onChanged: (v) => setSt(() => wilaya = v),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: desc,
                    maxLength: 280,
                    maxLines: 3,
                    decoration: InputDecoration(
                      labelText: S.t(lang, 'rep_desc'),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  // Gemini (Firebase AI Logic) reads the darija/Arabic/French
                  // text and picks the category for the user.
                  Align(
                    alignment: AlignmentDirectional.centerStart,
                    child: TextButton.icon(
                      onPressed: aiBusy || desc.text.trim().length < 4
                          ? null
                          : () async {
                              setSt(() => aiBusy = true);
                              final c = await Ai.suggestCategory(desc.text);
                              setSt(() {
                                aiBusy = false;
                                if (c != null) category = c;
                              });
                              if (c == null && ctx.mounted) {
                                ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text(S.t(lang, 'ai_none'))));
                              }
                            },
                      icon: aiBusy
                          ? const SizedBox(width: 15, height: 15, child: CircularProgressIndicator(strokeWidth: 2))
                          : const Icon(Icons.auto_awesome, size: 17),
                      label: Text(S.t(lang, 'ai_suggest'), style: const TextStyle(fontSize: 12.5)),
                    ),
                  ),
                  const SizedBox(height: 4),
                  FilledButton.icon(
                    onPressed: (category == null || wilaya == null || sending)
                        ? null
                        : () async {
                            setSt(() => sending = true);
                            final res = await st.sendReport(category: category!, wilaya: wilaya, description: desc.text);
                            if (res == 'ok') {
                              setSt(() => done = true);
                              Future.delayed(const Duration(milliseconds: 1600), () {
                                if (ctx.mounted) Navigator.of(ctx).pop();
                              });
                            } else {
                              setSt(() => sending = false);
                              if (ctx.mounted) {
                                ScaffoldMessenger.of(ctx).showSnackBar(
                                    SnackBar(content: Text(S.t(lang, res == 'rate' ? 'rep_rate' : 'rep_err'))));
                              }
                            }
                          },
                    icon: const Icon(Icons.send),
                    label: Text(S.t(lang, 'rep_send')),
                  ),
                ],
              ),
      ),
    ),
  );
}
