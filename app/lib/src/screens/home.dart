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
import '../widgets/skeleton.dart';
import '../widgets/transitions.dart';
import 'chat.dart';
import 'consignes.dart';
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
      // A failed first load must NOT spin forever — fatal on a weak network,
      // which is when an EWS matters most. Failed → khamsa + retry; still
      // loading → a layout-shaped skeleton (calmer than a spinner, and it
      // previews what's coming).
      final failed = st.sourceStatus == 'offline';
      if (!failed) return const HomeSkeleton();
      return Center(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Opacity(opacity: .18, child: Image.asset('assets/logo.png', width: 120, height: 120)),
          const SizedBox(height: 20),
          Text(S.t(lang, 'load_fail'),
              style: TextStyle(fontSize: 13.5, color: Theme.of(context).colorScheme.onSurfaceVariant)),
          const SizedBox(height: 12),
          FilledButton.tonalIcon(
            onPressed: () => st.refresh(force: true),
            icon: const Icon(Icons.refresh, size: 18),
            label: Text(S.t(lang, 'retry')),
          ),
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
        // Only a still-valid red drives the full-screen crisis takeover. An
        // expired red (only possible in a cached/offline snapshot) still shows
        // as the hero card with its dated window — visible but not screaming.
        if (a.color == 'red' && a.active) {
          redHere ??= a;
          break;
        }
      }
    }
    final alertActive = mineTop != null;

    // Tile counts.
    final nearbyCount = st.reports.where((r) => r.wilaya != null && myCodes.contains(r.wilaya)).length;
    // National tiles must not scream over an expired alert lingering in a
    // cached/offline snapshot — mirror the .active guard the hero uses.
    String worst = 'green';
    if (snap.alerts.any((a) => a.color == 'red' && a.active)) {
      worst = 'red';
    } else if (snap.alerts.any((a) => a.color == 'orange' && a.active)) {
      worst = 'orange';
    } else if (snap.alerts.any((a) => a.color == 'yellow' && a.active)) {
      worst = 'yellow';
    }

    return RefreshIndicator(
      onRefresh: () => st.refresh(force: true),
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
          _tile(context,
              width: tileW,
              icon: Icons.timeline_outlined,
              title: S.t(lang, 'timeline'),
              subtitle: S.t(lang, 'tile_timeline_sub'),
              count: '${st.timeline.length}',
              onTap: () => _open(context, const TimelineScreen())),
        ];

        return ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 24), children: [
          // 0 — In-app update banner (a new GitHub release is out).
          if (st.updateInfo != null) ...[
            _updateBanner(context, st),
            const SizedBox(height: 12),
          ],
          // 0b — Reliability warning. An OEM can revoke a permission months
          // after setup and the app would fail SILENTLY at the worst moment,
          // so a broken prerequisite is surfaced here, not left in Réglages.
          if (st.reliabilityOk == false) ...[
            _reliabilityBanner(context, st),
            const SizedBox(height: 12),
          ],
          // 1 — Unified status card: personal "am I safe?" + national context +
          // local conditions, one glanceable card. Red gets the full takeover.
          if (redHere != null)
            _redMode(context, st, redHere)
          else
            _hero(context, st, snap, mineTop),
          const SizedBox(height: 12),
          // 2 — Emergency hotkeys + "I'm safe".
          _sos(context, st, safeProminent: alertActive),
          // 2b — Unified all-hazard 3-day outlook (fire, rain, wind,
          // visibility, heat + METAR now-cast): one honest card, always
          // rendered when any data exists. A quiet day shows green.
          ...(() {
            final card = _outlook(context, st);
            return card == null
                ? const <Widget>[]
                : [const SizedBox(height: 12), card];
          })(),
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
              onTap: () => Navigator.of(context).push(fluidRoute(const ChatScreen()))),
          const SizedBox(height: gap),
          // Offline safety guides — core EWS value, works with no network.
          _tile(context,
              width: contentW,
              icon: Icons.menu_book_outlined,
              title: S.t(lang, 'consignes'),
              subtitle: S.t(lang, 'tile_consignes_sub'),
              bg: cs.primaryContainer,
              fg: cs.onPrimaryContainer,
              iconBg: cs.primary,
              iconFg: cs.onPrimary,
              trailing: Icon(Icons.chevron_right, color: cs.onPrimaryContainer.withValues(alpha: .7)),
              onTap: () => Navigator.of(context).push(fluidRoute(const ConsignesScreen()))),
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
      Navigator.of(context).push(fluidRoute(page));

  Widget _updateBanner(BuildContext context, AppState st) {
    final lang = st.lang;
    final cs = Theme.of(context).colorScheme;
    final url = (st.updateInfo?['apk'] ?? st.updateInfo?['url']) as String?;
    final tag = st.updateInfo?['tag'] as String?;
    return Container(
      padding: const EdgeInsetsDirectional.fromSTEB(16, 10, 8, 10),
      decoration: BoxDecoration(color: cs.primaryContainer, borderRadius: BorderRadius.circular(20)),
      child: Row(children: [
        Icon(Icons.system_update, color: cs.onPrimaryContainer, size: 22),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(S.t(lang, 'update_title'),
                style: TextStyle(fontSize: 13.5, fontWeight: FontWeight.w800, color: cs.onPrimaryContainer)),
            Text('${S.t(lang, 'update_body')}${tag != null ? ' ($tag)' : ''}',
                maxLines: 1, overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 11, color: cs.onPrimaryContainer.withValues(alpha: .85))),
          ]),
        ),
        TextButton(
          onPressed: st.dismissUpdate,
          child: Text(S.t(lang, 'later'),
              style: TextStyle(fontSize: 12, color: cs.onPrimaryContainer.withValues(alpha: .8))),
        ),
        FilledButton(
          onPressed: url == null ? null : () => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication),
          style: FilledButton.styleFrom(
            backgroundColor: cs.primary, foregroundColor: cs.onPrimary,
            padding: const EdgeInsets.symmetric(horizontal: 14), visualDensity: VisualDensity.compact),
          child: Text(S.t(lang, 'update_btn'), style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
        ),
      ]),
    );
  }

  /// Red-tinted warning that a prerequisite for the siren is missing.
  /// Tapping goes straight to Réglages, where the Fiabilité checklist fixes it.
  Widget _reliabilityBanner(BuildContext context, AppState st) {
    final lang = st.lang;
    final v = vigilance('red', st.dark);
    return InkWell(
      onTap: () => goTo(2), // Réglages tab
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsetsDirectional.fromSTEB(16, 11, 10, 11),
        decoration: BoxDecoration(color: v.container, borderRadius: BorderRadius.circular(20)),
        child: Row(children: [
          Icon(Icons.notifications_off_outlined, color: v.onContainer, size: 22),
          const SizedBox(width: 12),
          Expanded(
            child: Text(S.t(lang, 'rel_warn'),
                style: TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700, color: v.onContainer)),
          ),
          FilledButton(
            onPressed: () => goTo(2),
            style: FilledButton.styleFrom(
                // solid is pale in dark mode — white on it is unreadable.
                backgroundColor: st.dark ? v.onContainer : v.solid,
                foregroundColor: st.dark ? v.container : Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 14), visualDensity: VisualDensity.compact),
            child: Text(S.t(lang, 'rel_check'),
                style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700)),
          ),
        ]),
      ),
    );
  }

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
            padding: const EdgeInsetsDirectional.fromSTEB(16, 14, 16, 14),
            decoration: BoxDecoration(
              color: tileBg,
              borderRadius: BorderRadius.circular(22),
              border: bg == null ? Border.all(color: cs.outlineVariant) : null,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, crossAxisAlignment: CrossAxisAlignment.center, children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(color: circleBg, shape: BoxShape.circle),
                    child: Icon(icon, color: circleFg, size: 22),
                  ),
                  if (trailing != null)
                    trailing
                  else if (count != null)
                    Text(count, style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, height: 1, color: tileFg)),
                ]),
                const SizedBox(height: 10),
                Text(title, maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 14.5, fontWeight: FontWeight.w800, color: tileFg, height: 1.2)),
                const SizedBox(height: 2),
                Text(subtitle, maxLines: 1, overflow: TextOverflow.ellipsis,
                    style: TextStyle(fontSize: 11.5, color: tileFg.withValues(alpha: .72), height: 1.2)),
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

  // One unified status card: the personal "am I safe?" answer up top (tap for
  // detail), the national picture as a context line, then local conditions —
  // merged so the home leads with a single glance, not two stacked banners.
  Widget _hero(BuildContext context, AppState st, Snapshot snap, AlertItem? mineTop) {
    final lang = st.lang;
    final safe = mineTop == null;
    final v = vigilance(safe ? 'green' : mineTop.color, st.dark); // card colour = MY state
    // Name the wilaya(s) the alert ACTUALLY covers, not every wilaya the user
    // follows — three names under "Vigilance orange" read as three wilayas
    // under orange, and a traveller's GPS wilaya never got named at all.
    final where = safe
        ? st.myWilayas.map(st.wilayaName).take(3).join(' · ')
        : wLabel(st, mineTop.wilayas);
    // National context: how many wilayas sit at the worst active level.
    final reds = snap.wilayasWith('red').length;
    final oranges = snap.wilayasWith('orange').length;
    final yellows = snap.wilayasWith('yellow').length;
    final nat = reds > 0 ? 'red' : oranges > 0 ? 'orange' : yellows > 0 ? 'yellow' : 'green';
    final natN = nat == 'red' ? reds : nat == 'orange' ? oranges : yellows;
    final natHead = nat == 'green'
        ? S.t(lang, 'no_alert')
        : '$natN ${S.t(lang, 'wilayas_$nat')}${safe ? '' : ' · ${S.t(lang, 'until')} ${untilStamp(mineTop.expires)}'}';
    final natLine = '$natHead · ${S.t(lang, st.sourceStatus)} ${hhmm(snap.generatedAt)}';
    return AnimatedContainer(
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeOutCubic,
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(color: v.container, borderRadius: BorderRadius.circular(28)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        // Personal headline (tap → alert detail) + history.
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Icon(safe ? Icons.check_circle : Icons.warning_amber_rounded, color: v.solid, size: 30),
          const SizedBox(width: 12),
          Expanded(
            child: GestureDetector(
              behavior: HitTestBehavior.opaque,
              onTap: safe ? null : () => showAlertSheet(context, st, mineTop),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(
                  safe ? S.t(lang, 'all_ok_here') : '${S.t(lang, mineTop.color)} — ${S.t(lang, mineTop.hazard)}',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: v.onContainer, height: 1.15),
                ),
                if (where.isNotEmpty)
                  Padding(
                    padding: const EdgeInsets.only(top: 3),
                    child: Text('📍 $where',
                        maxLines: 1, overflow: TextOverflow.ellipsis,
                        style: TextStyle(fontSize: 12.5, color: v.onContainer.withValues(alpha: .85))),
                  ),
              ]),
            ),
          ),
          const SizedBox(width: 6),
          InkWell(
            onTap: () => showHistorySheet(context, st),
            borderRadius: BorderRadius.circular(99),
            child: Padding(
              padding: const EdgeInsets.all(4),
              child: Icon(Icons.history, size: 20, color: v.onContainer.withValues(alpha: .7)),
            ),
          ),
        ]),
        const SizedBox(height: 12),
        // National context line.
        Row(children: [
          Container(width: 10, height: 10,
              decoration: BoxDecoration(color: vigilance(nat, st.dark).solid, borderRadius: BorderRadius.circular(3))),
          const SizedBox(width: 8),
          Expanded(
            child: Text(natLine.toUpperCase(),
                maxLines: 2, overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 10.5, fontWeight: FontWeight.w600, letterSpacing: .3,
                    color: v.onContainer.withValues(alpha: .85))),
          ),
        ]),
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

          return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Uniform 3-column tiles in a centered grid — equal widths line up,
            // and the last row (2 tiles) is centered. dp-based, so it holds at
            // any screen density.
            LayoutBuilder(builder: (lctx, box) {
              const gap = 6.0;
              final tileW = (box.maxWidth - gap * 2) / 3;
              Widget tile(String emoji, String value, String label, {Color? tint}) => Container(
                    width: tileW,
                    padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                    decoration: BoxDecoration(
                      color: (tint ?? v.onContainer).withValues(alpha: tint != null ? .22 : .08),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(mainAxisSize: MainAxisSize.min, children: [
                      Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Text(emoji, style: const TextStyle(fontSize: 13)),
                        const SizedBox(width: 5),
                        Flexible(
                          // Scale to fit rather than truncate — "2 km/h" / "AQI 51"
                          // no longer clip to "2 k…" in the narrow 3-up tiles.
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: AlignmentDirectional.centerStart,
                            child: Text(value, maxLines: 1,
                                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: v.onContainer)),
                          ),
                        ),
                      ]),
                      const SizedBox(height: 2),
                      Text(label, maxLines: 1, overflow: TextOverflow.ellipsis,
                          style: TextStyle(fontSize: 9.5, color: v.onContainer.withValues(alpha: .75))),
                    ]),
                  );
              return Wrap(
                spacing: gap,
                runSpacing: gap,
                alignment: WrapAlignment.center,
                children: [
                  // Missing weather = tile omitted, never a fabricated "0°" /
                  // "null%" / green "good" (green is reserved for real all-clear).
                  if (w['feels'] != null || w['t'] != null)
                    tile('🌡️', '${((w['feels'] ?? w['t']) as num).round()}°', S.t(lang, 'feels')),
                  if (w['wind'] != null)
                    tile('💨', '${(w['wind'] as num).round()} km/h', S.t(lang, 'layer_w')),
                  if (w['rh'] != null)
                    tile('💧', '${w['rh']}%', S.t(lang, 'layer_h')),
                  if (aq != null && aq['band'] != null && aq['aqi'] != null)
                    tile('🍃', 'AQI ${aq['aqi']}', S.t(lang, 'aq_$aqBand'), tint: aqColor),
                  if (f != null && f['peak48'] != null)
                    tile('📈', '$arrow ${f['peak48']}°', S.t(lang, 'fc48')),
                ],
              );
            }),
          ]);
        }),
      ]),
    );
  }

  /// Unified all-hazard 3-day outlook — fire weather (FWI on the EFFIS class
  /// scale), rain + storms + wind + visibility, a 48h heat footer and a live
  /// METAR now-cast, in one honest card. Quiet windows still render: green is
  /// information too. Returns null only with no wilaya selected or no data at all.
  Widget? _outlook(BuildContext context, AppState st) {
    final lang = st.lang;
    final code = st.hereWilaya ?? (st.myWilayas.isNotEmpty ? st.myWilayas.first : null);
    if (code == null) return null;
    final cs = Theme.of(context).colorScheme;
    final w = st.weather[code] as Map?;
    final fire = w?['fire'] as Map?;
    final f = w?['f'] as Map?;
    final r = w?['r'] as Map?;
    final m = st.metar[code];
    final mRain = m?['rain'] == true;
    final mTs = m?['ts'] == true;
    final mFog = m?['fog'] == true;
    final mDust = m?['dust'] == true;
    // Dust is deliberately NOT in metarNow: a dust-only METAR would pop this
    // card open on any hazy Sahara day (noise, not warning). Real sandstorm
    // risk reaches the user through ONM vigilance alerts; and when the card
    // IS open (rain/storm/fog), the METAR line below still names dust.
    final metarNow = mRain || mTs || mFog;
    // FWI saturates in the Sahara with nothing to burn — ingest sends `fuel`
    // precisely so the app can drop the fire reading there (weather.js: it
    // would cry "très extrême" wolf over bare sand).
    final desert = fire?['fuel'] == 'desert';
    final hasFire = !desert &&
        (fire?['class'] != null ||
            (fire?['d1'] as Map?)?['class'] != null ||
            (fire?['d2'] as Map?)?['class'] != null);
    final hasRain = (r?['today'] ?? r?['d1'] ?? r?['d2']) != null;
    if (!hasFire && !hasRain && !metarNow) return null;

    String vigName(String cls) =>
        cls == 'veryHigh' || cls == 'extreme' || cls == 'veryExtreme'
            ? 'red'
            : cls == 'high'
                ? 'orange'
                : cls == 'moderate'
                    ? 'yellow'
                    : 'green';
    Color fireBg(String cls) => vigilance(vigName(cls), st.dark).container;
    Color fireFg(String cls) => vigilance(vigName(cls), st.dark).onContainer;
    int fireEdge(String cls) =>
        cls == 'veryHigh' || cls == 'extreme' || cls == 'veryExtreme'
            ? 2
            : cls == 'high'
                ? 1
                : 0;
    Color lvlBg(int l) =>
        vigilance(l == 2 ? 'red' : l == 1 ? 'orange' : 'green', st.dark).container;
    Color lvlFg(int l) =>
        vigilance(l == 2 ? 'red' : l == 1 ? 'orange' : 'green', st.dark).onContainer;
    Widget chip(String e, String v, Color bg, Color fg) => Container(
          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3.5),
          decoration: BoxDecoration(
              color: bg, borderRadius: BorderRadius.circular(8)),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(e, style: const TextStyle(fontSize: 11)),
              const SizedBox(width: 3),
              Text(v,
                  style: TextStyle(
                      fontSize: 10.5, fontWeight: FontWeight.w800, color: fg)),
            ],
          ),
        );
    Widget dayRow(String label, num? fwi, String? cls, Map? rd) {
      final chips = <(String, String, Color, Color, int)>[];
      if (cls != null && !desert) {
        final t = S.t(lang, 'fwi_$cls');
        chips.add((
          '🔥',
          fwi == null ? t : '$t ${fwi.round()}',
          fireBg(cls),
          fireFg(cls),
          fireEdge(cls)
        ));
      }
      final pp = rd?['pp'] as num?;
      final cape = rd?['cape'] as num?;
      final gust = rd?['gust'] as num?;
      final vis = rd?['vis'] as num?;
      final capeLvl = cape == null ? 0 : (cape >= 1500 ? 2 : cape >= 800 ? 1 : 0);
      final ppLvl = pp == null ? 0 : (pp >= 70 ? 2 : pp >= 40 ? 1 : 0);
      final gustLvl = gust == null ? 0 : (gust >= 80 ? 2 : gust >= 50 ? 1 : 0);
      final visLvl = vis == null ? 0 : (vis < 1 ? 2 : vis < 2 ? 1 : 0);
      if (pp != null) {
        final lvl = ppLvl > capeLvl ? ppLvl : capeLvl;
        chips.add((capeLvl >= 1 ? '⛈️' : '🌧️', '$pp%', lvlBg(lvl), lvlFg(lvl), lvl));
      } else if (capeLvl >= 1) {
        chips.add((
          '⛈️',
          S.t(lang, 'r_cape'),
          lvlBg(capeLvl),
          lvlFg(capeLvl),
          capeLvl
        ));
      }
      if (gust != null) {
        chips.add(
            ('💨', '${gust.round()} km/h', lvlBg(gustLvl), lvlFg(gustLvl), gustLvl));
      }
      if (vis != null) {
        chips.add(('🏜️', '$vis km', lvlBg(visLvl), lvlFg(visLvl), visLvl));
      }
      var edge = 0;
      for (final (_, _, _, _, l) in chips) {
        if (l > edge) edge = l;
      }
      return Padding(
        padding: const EdgeInsets.only(top: 6),
        child: IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                width: 4,
                decoration: BoxDecoration(
                    color: lvlBg(edge),
                    borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 62,
                child: Text(label,
                    style: const TextStyle(
                        fontSize: 10.5, fontWeight: FontWeight.w700),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: chips.isEmpty
                    ? Text('—',
                        style: TextStyle(
                            fontSize: 11, color: cs.onSurfaceVariant))
                    : Wrap(
                        spacing: 4,
                        runSpacing: 4,
                        children: [
                          for (final (e, v, bg, fg, _) in chips)
                            chip(e, v, bg, fg),
                        ],
                      ),
              ),
            ],
          ),
        ),
      );
    }

    final trend = f?['trend'] ?? 'flat';
    final arrow = trend == 'up' ? '↑' : trend == 'down' ? '↓' : '→';
    final nowWords = [
      if (mRain) S.t(lang, 'r_pp'),
      if (mTs) S.t(lang, 'r_cape'),
      if (mFog) S.t(lang, 'r_vis'),
      if (mDust) S.t(lang, 'sandstorm'),
    ].join(' · ');

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: cs.surfaceContainerLow,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Text('🧭', style: TextStyle(fontSize: 15)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  '${S.t(lang, 'outlook_title')} — ${st.wilayaName(code)}',
                  style: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.w800),
                ),
              ),
            ],
          ),
          dayRow(S.t(lang, 'today'), fire?['fwi'] as num?,
              fire?['class'] as String?, r?['today'] as Map?),
          dayRow(
              S.t(lang, 'fwi_d1'),
              (fire?['d1'] as Map?)?['fwi'] as num?,
              (fire?['d1'] as Map?)?['class'] as String?,
              r?['d1'] as Map?),
          dayRow(
              S.t(lang, 'fwi_d2'),
              (fire?['d2'] as Map?)?['fwi'] as num?,
              (fire?['d2'] as Map?)?['class'] as String?,
              r?['d2'] as Map?),
          if (f?['peak48'] != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text('🥵 ${S.t(lang, 'fc48')} $arrow ${f?['peak48']}°',
                  style: const TextStyle(
                      fontSize: 11.5, fontWeight: FontWeight.w700)),
            ),
          if (desert)
            Padding(
              padding: const EdgeInsets.only(top: 8),
            child: Row(children: [
              Icon(Icons.info_outline, size: 13, color: cs.onSurfaceVariant),
                  const SizedBox(width: 6),
                  Expanded(
                    child: Text(S.t(lang, 'fwi_desert'),
                        style: TextStyle(
                            fontSize: 11, color: cs.onSurfaceVariant)),
                  ),
                ],
              ),
            ),
          if (nowWords.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: 8),
            child: Text('${S.t(lang, 'r_metar')} ${m?['name'] ?? ''} · $nowWords',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style:
                      TextStyle(fontSize: 11, color: cs.onSurfaceVariant)),
            ),
          const SizedBox(height: 8),
          Text('Open-Meteo.com · EFFIS · NOAA aviationweather.gov',
              style: TextStyle(fontSize: 10, color: cs.onSurfaceVariant)),
        ],
      ),
    );
  }

  /// Crisis takeover card: hazard, where, and three giant actions.
  Widget _redMode(BuildContext context, AppState st, AlertItem a) {
    final lang = st.lang;
    final v = vigilance('red', st.dark);
    // In dark mode `solid` is a PALE salmon (#FFB4AB): using it as a background
    // under white text gave 1.7:1 contrast (WCAG AA needs 4.5:1) on the one
    // screen someone reads at 3am. Use the container/onContainer pair in dark,
    // keep the existing solid/white in light (that pair is already fine).
    final cardBg = st.dark ? v.container : v.solid;
    final onCard = st.dark ? v.onContainer : Colors.white;
    Widget big(IconData icon, String label, VoidCallback onTap, {Color? bg, Color? fg}) => Padding(
          padding: const EdgeInsets.only(top: 10),
          child: FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: bg ?? onCard,
              foregroundColor: fg ?? cardBg,
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
      decoration: BoxDecoration(color: cardBg, borderRadius: BorderRadius.circular(28)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(Icons.warning_amber_rounded, color: onCard, size: 30),
          const SizedBox(width: 10),
          Expanded(
            child: Text('${S.t(lang, 'red')} — ${S.t(lang, a.hazard)}',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: onCard, height: 1.15)),
          ),
          // Speak/stop the alert aloud (AR+FR) — for anyone who can't read it.
          IconButton(
            tooltip: S.t(lang, 'listen'),
            onPressed: () => VoiceAlert.toggle(a,
                myCodes: {...st.myWilayas, if (st.hereWilaya != null) st.hereWilaya!}, lang: st.lang),
            icon: Icon(Icons.campaign_outlined, color: onCard, size: 28),
          ),
        ]),
        const SizedBox(height: 4),
        Text('${wLabel(st, a.wilayas)} · ${span(a.onset, a.expires)}',
            style: TextStyle(fontSize: 13, color: onCard.withValues(alpha: .85))),
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
    // safeProminent is true exactly when an alert is live in the user's
    // wilayas, so this cell must stay readable then above all. In dark mode
    // g.solid is a pale green and white on it measures ~1.7:1.
    final safeBg = safeProminent ? (st.dark ? g.onContainer : g.solid) : g.container;
    final safeFg = safeProminent ? (st.dark ? g.container : Colors.white) : g.onContainer;
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
