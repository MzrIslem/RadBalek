import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../ai.dart';
import '../app_state.dart';
import '../models.dart';
import '../strings.dart';
import '../theme.dart';

String hhmm(String? iso) {
  if (iso == null || iso.isEmpty) return '';
  final d = DateTime.tryParse(iso)?.toLocal();
  if (d == null) return '';
  return '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
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

String wLabel(AppState st, List<Wilaya> ws) {
  if (ws.isEmpty) return st.lang == 'ar' ? 'الجزائر' : 'Algérie';
  return ws.map((w) => st.lang == 'ar' ? 'ولاية ${w.ar}' : w.fr).join('، ');
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
                  Text('${S.t(lang, 'today')} ${hhmm(a.onset)} → ${hhmm(a.expires)}')),
              if (a.wilayas.isNotEmpty && st.weather[a.wilayas.first.code] != null)
                Builder(builder: (_) {
                  final w = st.weather[a.wilayas.first.code]!;
                  return _row5(ctx, Icons.thermostat, S.t(lang, 'cond'),
                      Text('${w['t']}°C (${w['feels']}°) · 💨 ${w['wind']} km/h · 💧 ${w['rh']}%'));
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
                            '⚠️ ${a.headline['fr'] ?? ''}\n${a.headline['ar'] ?? ''}\n🕐 ${hhmm(a.onset)} → ${hhmm(a.expires)}\n$acts\n— Rad Balek رد بالك'));
                  },
                  icon: const Icon(Icons.share_outlined),
                  label: Text(S.t(lang, 'share')),
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
