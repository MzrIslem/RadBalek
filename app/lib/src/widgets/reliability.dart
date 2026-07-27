import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../app_state.dart';
import '../strings.dart';
import '../theme.dart';

/// The "Fiabilité" checklist — every switch an OEM or the user can silently
/// flip that would stop a red alert from ringing, each with a one-tap fix.
///
/// This is the app's trust surface: an early-warning app that fails silently
/// is worse than no app, so the state is re-checked on every resume (OEMs
/// revoke these over time) and surfaced on the home screen when broken.
///
/// [showTest] adds the live siren proof-test — used at the end of onboarding
/// so a fresh install ends *proven working*, not merely configured.
class ReliabilityCard extends StatefulWidget {
  const ReliabilityCard({super.key, this.showTest = false});

  final bool showTest;

  @override
  State<ReliabilityCard> createState() => _ReliabilityCardState();
}

class _ReliabilityCardState extends State<ReliabilityCard> with WidgetsBindingObserver {
  Map<String, dynamic> _s = const {};
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _refresh();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  // Returning from a system settings page must re-check, or the user fixes
  // something and still sees a red cross.
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _refresh();
  }

  Future<void> _refresh() async {
    final s = await context.read<AppState>().reliabilityStatus();
    if (mounted) setState(() => _s = s);
  }

  /// Opens the relevant settings page, then re-checks when the user comes back.
  Future<void> _fix(Future<void> Function() action) async {
    await action();
    await Future<void>.delayed(const Duration(milliseconds: 400));
    await _refresh();
  }

  Future<void> _test() async {
    final st = context.read<AppState>();
    final lang = st.lang;
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _busy = true);
    messenger.showSnackBar(SnackBar(content: Text(S.t(lang, 'test_sending'))));
    final res = await st.sendTestPush();
    if (!mounted) return;
    setState(() => _busy = false);
    messenger.hideCurrentSnackBar();
    if (res == 'ok') {
      messenger.showSnackBar(SnackBar(
        content: Text(S.t(lang, 'rel_test_intro')),
        duration: const Duration(seconds: 9),
      ));
    } else if (res == 'no-permission') {
      messenger.showSnackBar(SnackBar(
        content: Text(S.t(lang, 'test_noperm')),
        action: SnackBarAction(label: S.t(lang, 'open'), onPressed: st.openAppNotifSettings),
        duration: const Duration(seconds: 8),
      ));
    } else {
      messenger.showSnackBar(SnackBar(
        content: Text('${S.t(lang, 'test_fail')} ($res)'),
        duration: const Duration(seconds: 6),
      ));
    }
    await _refresh();
  }

  @override
  Widget build(BuildContext context) {
    final st = context.watch<AppState>();
    final lang = st.lang;
    final cs = Theme.of(context).colorScheme;
    final green = vigilance('green', st.dark).solid;
    final red = vigilance('red', st.dark).solid;

    final vol = (_s['volume'] as num?)?.toDouble() ?? 1.0;
    final checked = _s.isNotEmpty;
    // Volume is advisory (the siren forces the alarm stream up at ring time),
    // so it never blocks the "all good" verdict — but a muted alarm is still
    // worth showing, because it is the #1 "it didn't ring" cause.
    // 'fsi' is absent on Android < 14 and on older builds of this app — treat
    // a missing value as OK so the checklist never invents a failure.
    final fsiOk = _s['fsi'] != false;
    final allOk = checked &&
        _s['notifs'] == true &&
        _s['channel'] == true &&
        _s['battery'] == true &&
        fsiOk &&
        vol >= 0.3;

    final amber = vigilance('orange', st.dark).solid;
    // `advisory` rows do NOT block the "everything is ready" verdict (the siren
    // rides the alarm stream, which ignores DND and silent mode). Showing them
    // in red next to "Tout est prêt" contradicted the verdict on the one screen
    // whose whole job is to be trusted — so they warn in amber instead.
    Widget row(String label, bool ok, IconData icon, Future<void> Function() fix,
            {bool advisory = false}) =>
        Padding(
          padding: const EdgeInsets.symmetric(vertical: 5),
          child: Row(children: [
            Icon(ok ? Icons.check_circle : icon, size: 20, color: ok ? green : (advisory ? amber : red)),
            const SizedBox(width: 12),
            Expanded(child: Text(label, style: const TextStyle(fontSize: 13))),
            if (ok)
              Text(S.t(lang, 'rel_on'),
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: green))
            else
              FilledButton.tonal(
                onPressed: () => _fix(fix),
                style: FilledButton.styleFrom(visualDensity: VisualDensity.compact),
                child: Text(S.t(lang, 'rel_fix'), style: const TextStyle(fontSize: 12)),
              ),
          ]),
        );

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(S.t(lang, 'rel_intro'),
          style: TextStyle(fontSize: 11.5, height: 1.5, color: cs.onSurfaceVariant)),
      const SizedBox(height: 8),
      if (!checked)
        const Padding(
          padding: EdgeInsets.symmetric(vertical: 12),
          child: Center(child: SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))),
        )
      else ...[
        row(S.t(lang, 'rel_notifs'), _s['notifs'] == true, Icons.notifications_off_outlined,
            st.openAppNotifSettings),
        row(S.t(lang, 'rel_channel'), _s['channel'] == true, Icons.campaign_outlined,
            st.openEmergencyChannel),
        row(S.t(lang, 'rel_battery'), _s['battery'] == true, Icons.battery_saver_outlined,
            st.requestBatteryExempt),
        row(S.t(lang, 'rel_dnd'), _s['dnd'] == true, Icons.do_not_disturb_on_outlined,
            st.requestDndAccess, advisory: true),
        // Android 14+ only: without this the lockscreen takeover degrades to a
        // banner and the spoken AR/FR announcement never runs at all.
        if (_s.containsKey('fsi'))
          row(S.t(lang, 'rel_fsi'), fsiOk, Icons.fullscreen_exit, st.requestFsi),
        row(S.t(lang, 'rel_volume'), vol >= 0.3, Icons.volume_off_outlined, st.openSoundSettings),
        const SizedBox(height: 10),
        if (allOk)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
            decoration: BoxDecoration(
                color: vigilance('green', st.dark).container, borderRadius: BorderRadius.circular(14)),
            child: Row(children: [
              Icon(Icons.verified_outlined, size: 18, color: vigilance('green', st.dark).onContainer),
              const SizedBox(width: 8),
              Expanded(
                child: Text(S.t(lang, 'rel_all_ok'),
                    style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: vigilance('green', st.dark).onContainer)),
              ),
            ]),
          ),
      ],
      const SizedBox(height: 10),
      Wrap(spacing: 8, runSpacing: 8, children: [
        OutlinedButton.icon(
          onPressed: _refresh,
          icon: const Icon(Icons.refresh, size: 16),
          label: Text(S.t(lang, 'rel_recheck'), style: const TextStyle(fontSize: 11.5)),
        ),
        if (widget.showTest)
          FilledButton.tonalIcon(
            onPressed: _busy ? null : _test,
            icon: const Icon(Icons.notification_add_outlined, size: 16),
            label: Text(S.t(lang, 'test_btn'), style: const TextStyle(fontSize: 11.5)),
          ),
      ]),
    ]);
  }
}
