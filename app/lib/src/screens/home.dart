import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import '../app_state.dart';
import '../models.dart';
import '../regions.dart';
import '../strings.dart';
import '../theme.dart';
import '../voice.dart';
import '../widgets/sheets.dart';
import 'chat.dart';
import 'sections.dart';

/// Home = launcher. The landing screen carries only what matters in the first
/// second — the national alert hero, the emergency SOS row, and "I'm safe".
/// Everything else (official alerts, around me, terrain, map, assistant) is a
/// big tile that opens its own page.
class HomeScreen extends StatelessWidget {
  final void Function(int) goTo; // shell tab switch (1 = map)
  const HomeScreen({super.key, required this.goTo});

  @override
  Widget build(BuildContext context) {
    final st = context.watch<AppState>();
    final snap = st.snapshot;
    final lang = st.lang;
    final cs = Theme.of(context).colorScheme;
    if (snap == null) {
      // Watermark: the Signal Khamsa "watching over you" while data loads.
      return Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Opacity(opacity: .18, child: Image.asset('assets/logo.png', width: 120, height: 120)),
          const SizedBox(height: 20),
          const CircularProgressIndicator(),
        ]),
      );
    }

    // Which of my wilayas is worst off — drives the hero, the "I'm safe"
    // emphasis and the red takeover.
    final myCodes = {...st.myWilayas, if (st.hereWilaya != null) st.hereWilaya!};
    AlertItem? redHere;
    AlertItem? mineTop;
    for (final a in snap.alerts) {
      if (a.wilayas.any((w) => myCodes.contains(w.code))) {
        mineTop ??= a;
        if (a.color == 'red') {
          redHere ??= a;
          break;
        }
      }
    }
    final alertActive = mineTop != null;
    final target = mineTop ?? (snap.alerts.isEmpty ? null : snap.alerts.first);

    // Tile counts.
    final nearbyCount = st.reports.where((r) => r.wilaya != null && myCodes.contains(r.wilaya)).length;
    String worst = 'green';
    if (snap.alerts.any((a) => a.color == 'red')) {
      worst = 'red';
    } else if (snap.alerts.any((a) => a.color == 'orange')) {
      worst = 'orange';
    } else if (snap.alerts.any((a) => a.color == 'yellow')) {
      worst = 'yellow';
    }

    return RefreshIndicator(
      onRefresh: st.refresh,
      child: LayoutBuilder(builder: (ctx, box) {
        const gap = 12.0;
        final contentW = box.maxWidth - 32; // ListView horizontal padding
        final cols = box.maxWidth >= 900 ? 4 : 2;
        final tileW = (contentW - gap * (cols - 1)) / cols;

        // Official alerts: brand-teal when calm, vigilance-colored when a red or
        // orange alert is live nationally.
        final officialHot = worst == 'red' || worst == 'orange';
        final ov = vigilance(worst, st.dark);
        final tiles = <Widget>[
          _tile(context,
              width: tileW,
              icon: Icons.notifications_active_outlined,
              title: S.t(lang, 'official'),
              subtitle: S.t(lang, 'tile_alerts_sub'),
              count: '${snap.alerts.length}',
              bg: officialHot ? ov.container : cs.primaryContainer,
              fg: officialHot ? ov.onContainer : cs.onPrimaryContainer,
              iconBg: officialHot ? ov.solid : cs.primary,
              iconFg: officialHot ? Colors.white : cs.onPrimary,
              onTap: () => _open(context, const OfficialAlertsScreen())),
          _tile(context,
              width: tileW,
              icon: Icons.location_on_outlined,
              title: S.t(lang, 'nearby'),
              subtitle: S.t(lang, 'tile_nearby_sub'),
              count: '$nearbyCount',
              onTap: () => _open(context, const NearbyScreen())),
          _tile(context,
              width: tileW,
              icon: Icons.local_fire_department_outlined,
              title: S.t(lang, 'terrain_short'),
              subtitle: S.t(lang, 'tile_terrain_sub'),
              count: '${snap.incidents.length}',
              onTap: () => _open(context, const TerrainScreen())),
          _tile(context,
              width: tileW,
              icon: Icons.map_outlined,
              title: S.t(lang, 'nav_map'),
              subtitle: S.t(lang, 'tile_map_sub'),
              trailing: _regionDots(st, snap),
              onTap: () => goTo(1)),
        ];

        return ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 24), children: [
          // 1 — Alert hero (red takeover when a red alert touches my wilayas).
          if (redHere != null)
            _redMode(context, st, redHere)
          else
            GestureDetector(
              onTap: target == null ? null : () => showAlertSheet(context, st, target),
              child: _hero(context, st, snap),
            ),
          const SizedBox(height: 12),
          // 2 — Emergency hotkeys + "I'm safe".
          _sos(context, st, safeProminent: alertActive),
          const SizedBox(height: 22),
          // 3 — Big tile access buttons.
          _launcherLabel(context, S.t(lang, 'quick_access')),
          const SizedBox(height: 12),
          Wrap(spacing: gap, runSpacing: gap, children: tiles),
          const SizedBox(height: gap),
          _tile(context,
              width: contentW,
              icon: Icons.auto_awesome_outlined,
              title: S.t(lang, 'assistant'),
              subtitle: S.t(lang, 'tile_ai_sub'),
              bg: cs.secondaryContainer,
              fg: cs.onSecondaryContainer,
              iconBg: cs.secondary,
              iconFg: cs.onSecondary,
              trailing: Icon(Icons.chevron_right, color: cs.onSecondaryContainer.withValues(alpha: .7)),
              onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const ChatScreen()))),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 12),
            child: Text(S.t(lang, 'disclaimer'),
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 11.5, color: cs.onSurfaceVariant)),
          ),
        ]);
      }),
    );
  }

  void _open(BuildContext context, Widget page) =>
      Navigator.of(context).push(MaterialPageRoute(builder: (_) => page));

  Widget _launcherLabel(BuildContext context, String text) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(text.toUpperCase(),
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, letterSpacing: 1, color: cs.primary)),
    );
  }

  /// Big tile access button. Neutral card by default; pass bg/fg/iconBg/iconFg
  /// to theme it (brand, vigilance, secondary…). Either a [count] or a
  /// [trailing] widget sits top-right.
  Widget _tile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    required double width,
    String? count,
    Widget? trailing,
    Color? bg,
    Color? fg,
    Color? iconBg,
    Color? iconFg,
  }) {
    final cs = Theme.of(context).colorScheme;
    final tileBg = bg ?? cs.surfaceContainerLow;
    final tileFg = fg ?? cs.onSurface;
    final circleBg = iconBg ?? cs.surfaceContainerHighest;
    final circleFg = iconFg ?? cs.onSurfaceVariant;
    return SizedBox(
      width: width,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(22),
        child: Container(
          height: 116,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: tileBg,
            borderRadius: BorderRadius.circular(22),
            border: bg == null ? Border.all(color: cs.outlineVariant) : null,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(
                  width: 46,
                  height: 46,
                  decoration: BoxDecoration(color: circleBg, shape: BoxShape.circle),
                  child: Icon(icon, color: circleFg, size: 23),
                ),
                if (trailing != null)
                  trailing
                else if (count != null)
                  Text(count, style: TextStyle(fontSize: 27, fontWeight: FontWeight.w800, height: 1, color: tileFg)),
              ]),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title, maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, color: tileFg)),
                const SizedBox(height: 2),
                Text(subtitle, maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11.5, color: tileFg.withValues(alpha: .72))),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  /// Four region status dots for the Map tile — "alive" at a glance.
  Widget _regionDots(AppState st, Snapshot snap) {
    final rl = regionLevels(snap.levelByWilaya());
    Color dot(int l) => vigilance(switch (l) { 3 => 'red', 2 => 'orange', 1 => 'yellow', _ => 'green' }, st.dark).solid;
    return Row(mainAxisSize: MainAxisSize.min, children: [
      for (final r in const ['est', 'centre', 'ouest', 'sud'])
        Padding(
          padding: const EdgeInsetsDirectional.only(start: 5),
          child: Container(width: 12, height: 12, decoration: BoxDecoration(color: dot(rl[r]!), shape: BoxShape.circle)),
        ),
    ]);
  }

  Widget _hero(BuildContext context, AppState st, Snapshot snap) {
    final lang = st.lang;
    final top = snap.alerts.isEmpty ? null : snap.alerts.first;
    final color = top?.color ?? 'green';
    final v = vigilance(color == 'yellow' ? 'yellow' : color, st.dark);
    final reds = snap.wilayasWith('red').length;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(color: v.container, borderRadius: BorderRadius.circular(28)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(
            child: Text('${S.t(lang, 'natl')} · ${S.t(lang, 'monitored')}'.toUpperCase(),
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1.1,
                    color: v.onContainer.withValues(alpha: .8))),
          ),
          InkWell(
            onTap: () => showHistorySheet(context, st),
            borderRadius: BorderRadius.circular(99),
            child: Icon(Icons.history, size: 20, color: v.onContainer.withValues(alpha: .7)),
          ),
        ]),
        const SizedBox(height: 8),
        Row(children: [
          Container(width: 15, height: 15, decoration: BoxDecoration(color: v.solid, borderRadius: BorderRadius.circular(5))),
          const SizedBox(width: 11),
          Expanded(
            child: Text(
              top == null ? S.t(lang, 'no_alert') : '${S.t(lang, color)} — ${S.t(lang, top.hazard)}',
              style: TextStyle(fontSize: 25, fontWeight: FontWeight.w700, color: v.onContainer, height: 1.2),
            ),
          ),
        ]),
        const SizedBox(height: 6),
        Text(
          '$reds ${S.t(lang, 'wilayas_red')} · ${S.t(lang, 'until')} ${hhmm(top?.expires)} · ${S.t(lang, st.sourceStatus)} ${hhmm(snap.generatedAt)}',
          style: TextStyle(fontSize: 13, color: v.onContainer.withValues(alpha: .9)),
        ),
        const SizedBox(height: 12),
        // Personal conditions for MY wilaya (GPS first): what the air actually
        // feels like right now — more actionable than a macro region strip.
        Builder(builder: (_) {
          final code = st.hereWilaya ?? (st.myWilayas.isNotEmpty ? st.myWilayas.first : null);
          final w = code == null ? null : st.weather[code];
          if (w == null) return const SizedBox.shrink();
          final aq = w['aq'] as Map?;
          final f = w['f'] as Map?;
          final aqBand = aq?['band'] as String? ?? 'good';
          final aqColor = vigilance(
              aqBand == 'veryPoor' ? 'red' : aqBand == 'poor' ? 'orange' : aqBand == 'moderate' ? 'yellow' : 'green',
              st.dark).solid;
          final trend = f?['trend'] as String? ?? 'flat';
          final arrow = trend == 'up' ? '↑' : trend == 'down' ? '↓' : '→';

          Widget chip(String emoji, String big, String small, {Color? dot}) => Expanded(
                child: Container(
                  padding: const EdgeInsets.symmetric(vertical: 7),
                  decoration: BoxDecoration(
                    color: v.onContainer.withValues(alpha: .08),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(children: [
                    Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Text(emoji, style: const TextStyle(fontSize: 12)),
                      const SizedBox(width: 3),
                      if (dot != null) ...[
                        Container(width: 8, height: 8, decoration: BoxDecoration(color: dot, shape: BoxShape.circle)),
                        const SizedBox(width: 3),
                      ],
                      Flexible(
                        child: Text(big, maxLines: 1, overflow: TextOverflow.ellipsis,
                            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800, color: v.onContainer)),
                      ),
                    ]),
                    Text(small, maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 9.5, color: v.onContainer.withValues(alpha: .8))),
                  ]),
                ),
              );

          return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Padding(
              padding: const EdgeInsetsDirectional.only(start: 2, bottom: 5),
              child: Text('📍 ${st.wilayaName(code)}',
                  style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w700,
                      color: v.onContainer.withValues(alpha: .9))),
            ),
            Row(children: [
              chip('🌡️', '${w['feels'] ?? w['t']}°', S.t(lang, 'feels')),
              const SizedBox(width: 6),
              chip('💨', '${w['wind']}', 'km/h'),
              const SizedBox(width: 6),
              chip('💧', '${w['rh']}%', S.t(lang, 'layer_h')),
              if (aq != null) ...[
                const SizedBox(width: 6),
                chip('🍃', 'AQI ${aq['aqi']}', S.t(lang, 'aq_$aqBand'), dot: aqColor),
              ],
              if (f != null) ...[
                const SizedBox(width: 6),
                chip('📈', '$arrow ${f['peak48']}°', S.t(lang, 'fc48')),
              ],
            ]),
          ]);
        }),
      ]),
    );
  }

  /// Crisis takeover card: hazard, where, and three giant actions.
  Widget _redMode(BuildContext context, AppState st, AlertItem a) {
    final lang = st.lang;
    final v = vigilance('red', st.dark);
    Widget big(IconData icon, String label, VoidCallback onTap, {Color? bg, Color? fg}) => Padding(
          padding: const EdgeInsets.only(top: 10),
          child: FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: bg ?? Colors.white,
              foregroundColor: fg ?? v.solid,
              minimumSize: const Size.fromHeight(54),
              textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
            ),
            onPressed: onTap,
            icon: Icon(icon, size: 22),
            label: Text(label),
          ),
        );
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(color: v.solid, borderRadius: BorderRadius.circular(28)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.warning_amber_rounded, color: Colors.white, size: 30),
          const SizedBox(width: 10),
          Expanded(
            child: Text('${S.t(lang, 'red')} — ${S.t(lang, a.hazard)}',
                style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white, height: 1.15)),
          ),
          // Speak/stop the alert aloud (AR+FR) — for anyone who can't read it.
          IconButton(
            tooltip: S.t(lang, 'listen'),
            onPressed: () => VoiceAlert.toggle(a,
                myCodes: {...st.myWilayas, if (st.hereWilaya != null) st.hereWilaya!}, lang: st.lang),
            icon: const Icon(Icons.campaign_outlined, color: Colors.white, size: 28),
          ),
        ]),
        const SizedBox(height: 4),
        Text('${wLabel(st, a.wilayas)} · ${hhmm(a.onset)} → ${hhmm(a.expires)}',
            style: const TextStyle(fontSize: 13, color: Colors.white70)),
        big(Icons.checklist_rounded, S.t(lang, 'directives'), () => showAlertSheet(context, st, a)),
        big(Icons.call, '${S.t(lang, 'em_pc')} · ${st.sosNumbers.first}',
            () => st.directCall(st.sosNumbers.first)),
        big(Icons.favorite, S.t(lang, 'safe_btn'), () {
          final msg = S.t(lang, 'safe_msg');
          if (st.family.isNotEmpty) {
            launchUrl(Uri.parse('sms:${st.family.join(',')}?body=${Uri.encodeComponent(msg)}'));
          } else {
            SharePlus.instance.share(ShareParams(text: msg));
          }
        }, bg: vigilance('green', st.dark).container, fg: vigilance('green', st.dark).onContainer),
      ]),
    );
  }

  /// One-tap rescue row: identical, centered cells on a strict grid.
  /// [safeProminent] fills the green "I'm safe" cell solid when an alert is
  /// live in the user's wilayas (muscle-memory placement, situational emphasis).
  Widget _sos(BuildContext context, AppState st, {bool safeProminent = false}) {
    final lang = st.lang;
    final v = vigilance('red', st.dark);
    final g = vigilance('green', st.dark);
    const labels = {'14': 'em_pc', '1021': 'em_pc', '17': 'em_police', '1055': 'em_gn'};

    Widget cell(IconData icon, String title, String sub, Color bg, Color fg, VoidCallback onTap,
            {double titleSize = 16}) =>
        Expanded(
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(16),
            child: Container(
              height: 76,
              decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(16)),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(icon, size: 20, color: fg),
                const SizedBox(height: 3),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Text(title, maxLines: 1, overflow: TextOverflow.ellipsis,
                      style: TextStyle(fontSize: titleSize, fontWeight: FontWeight.w800, color: fg, height: 1.1)),
                ),
                if (sub.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    child: Text(sub, maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w600,
                            color: fg.withValues(alpha: .85))),
                  ),
              ]),
            ),
          ),
        );

    final nums = st.sosNumbers.take(3).toList();
    final safeBg = safeProminent ? g.solid : g.container;
    final safeFg = safeProminent ? Colors.white : g.onContainer;
    return Row(children: [
      for (final n in nums) ...[
        // Personal contacts show their name and dial DIRECTLY (CALL_PHONE);
        // official short codes open the dialer (OS rule for emergency numbers).
        cell(Icons.call, st.nameFor(n) ?? n,
            labels.containsKey(n) ? S.t(lang, labels[n]!) : (st.nameFor(n) != null ? n : 'SOS'),
            v.container, v.onContainer, () => st.directCall(n),
            titleSize: st.nameFor(n) != null ? 12.5 : 16),
        const SizedBox(width: 8),
      ],
      cell(Icons.favorite, S.t(lang, 'safe_btn'), 'أنا بخير', safeBg, safeFg, () {
        final msg = S.t(lang, 'safe_msg');
        if (st.family.isNotEmpty) {
          launchUrl(Uri.parse('sms:${st.family.join(',')}?body=${Uri.encodeComponent(msg)}'));
        } else {
          SharePlus.instance.share(ShareParams(text: msg));
        }
      }, titleSize: 11.5),
    ]);
  }
}
