/// Projection: AppState → home-screen widget (arc 3.5).
///
/// The widget itself never fetches (no network code on the Kotlin side, and
/// rb_widget_info.xml sets updatePeriodMillis=0). Instead, every successful
/// refresh() writes a tiny projection of MY wilayas' vigilance into
/// home_widget's SharedPreferences, then pokes the receiver to redraw.
/// When the app isn't opened for a while, a workmanager periodic task
/// (30 min, network-constrained) re-runs the projection from the background
/// isolate — from a fresh lite fetch when online, or the offline cache
/// otherwise. Red alerts still arrive through FCM regardless of what the
/// widget says, so an outdated widget can never delay a siren.
///
/// Degradation rule (never present uncertain data as certain):
/// - Background offline + no cache → the task returns false (WorkManager
///   retries with backoff); the widget keeps its last projection instead
///   of being clobbered with a fresh "open the app".
/// - Never had data → wb_level=-1 → "open the app", never fabricated green.
library;

import 'dart:convert';

import 'package:home_widget/home_widget.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:workmanager/workmanager.dart';

import 'api.dart';
import 'models.dart';
import 'strings.dart';

/// Android receiver class (the plugin resolves packageName + this name).
/// iOS has no widget yet; when it ships, add the iOSName here.
const _kAndroidReceiver = 'RbWidgetReceiver';

/// Task names for workmanager (must stay stable across releases so the
/// periodic work re-registers, not duplicates).
const widgetTaskName = 'radbalek-widget-refresh';
const widgetTaskUniqueName = 'radbalek-widget-refresh-periodic';

/// Whether the periodic refresh is already registered on this device.
bool _widgetTaskRegistered = false;

/// Computes the projection from a [Snapshot]. Pure — no I/O, no side
/// effects — so the smoke test can assert on it without plugin mocks.
/// [myCodes] = the union of subscribed wilayas and the GPS wilaya.
({int level, String? title, String? sub, String? hazard, int national}) widgetProjection(
    Snapshot? snap, Set<int> myCodes, String lang) {
  if (snap == null) {
    return (level: -1, title: null, sub: null, hazard: null, national: -1);
  }
  // Driver = first ACTIVE alert touching MY wilayas, in snapshot order.
  // Snapshot.fromJson pre-sorts EEW → red → orange, so this is exactly the
  // app's hero rule (an EEW drives even over a 6h red) plus an active guard.
  AlertItem? driver;
  for (final a in snap.alerts) {
    if (!a.active) continue;
    if (!a.wilayas.any((w) => myCodes.contains(w.code))) continue;
    driver = a;
    break;
  }
  final level = switch (driver?.color) { 'red' => 3, 'orange' => 2, 'yellow' => 1, _ => 0 };
  // Wilaya names at the driving level — the "where" of the glance.
  final names = <String>{};
  for (final a in snap.alerts) {
    if (!a.active || a.color != (driver?.color ?? '')) continue;
    for (final w in a.wilayas) {
      if (myCodes.contains(w.code)) names.add(w.name(lang));
    }
  }
  // National counts (base-100 packing: red*100 + orange — 58 wilayas max,
  // so both fit without collision; Kotlin unpacks with /100 and %100).
  final national = snap.wilayasWith('red').length * 100 + snap.wilayasWith('orange').length;
  final title = S.t(lang, driver == null ? 'all_ok_here' : driver.color);
  final sub = names.isEmpty ? null : names.take(3).join(' · ');
  return (level: level, title: title, sub: sub, hazard: driver?.hazard, national: national);
}

/// Writes the projection + pokes the widget. Called after every refresh()
/// and from the background task. Returns false on any throw — the widget
/// keeps its last honest state, which is the degradation rule.
Future<bool> projectWidget({required Snapshot? snap, required Set<int> myCodes, required String lang}) async {
  try {
    final p = widgetProjection(snap, myCodes, lang);
    // Stamp = DATA time (snap.generatedAt), never render time.
    final stamp = _stampOf(snap?.generatedAt ?? '');
    await Future.wait([
      HomeWidget.saveWidgetData<int>('wb_level', p.level),
      HomeWidget.saveWidgetData<String>('wb_title', p.title),
      HomeWidget.saveWidgetData<String>('wb_sub', p.sub),
      HomeWidget.saveWidgetData<String>('wb_hazard', p.hazard ?? ''),
      HomeWidget.saveWidgetData<int>('wb_national', p.national),
      HomeWidget.saveWidgetData<String>('wb_updated', stamp ?? ''),
      HomeWidget.saveWidgetData<String>('wb_lang', lang),
    ]);
    await HomeWidget.updateWidget(androidName: _kAndroidReceiver);
    return true;
  } catch (_) {
    return false;
  }
}

/// Local-time HH:mm from a data timestamp; null when unparsable (the widget
/// then keeps its previous stamp — never invents one).
String? _stampOf(String iso) {
  final dt = DateTime.tryParse(iso);
  if (dt == null) return null;
  final local = dt.toLocal();
  return '${local.hour.toString().padLeft(2, '0')}:${local.minute.toString().padLeft(2, '0')}';
}

/// Reads the persisted settings the background isolate can't get from
/// AppState (a background engine has no access to the running AppState —
/// it must re-read SharedPreferences directly).
Future<({Set<int> myCodes, String lang})> _readPersistedTarget() async {
  final sp = await SharedPreferences.getInstance();
  final my = (sp.getStringList('rb_my') ?? ['16', '6']).map(int.parse).toSet();
  final lang = sp.getString('rb_lang') ?? 'fr';
  return (myCodes: my, lang: lang);
}

/// Snapshot for the background path: fresh lite fetch when online, else the
/// same on-disk cache the app itself renders offline (rb_cache).
Future<Snapshot?> _bgSnapshot() async {
  try {
    final raw = await Api().fetchSnapshotRaw();
    return Snapshot.fromJson(jsonDecode(raw) as Map<String, dynamic>);
  } catch (_) {
    try {
      final sp = await SharedPreferences.getInstance();
      final cached = sp.getString('rb_cache');
      if (cached != null) return Snapshot.fromJson(jsonDecode(cached) as Map<String, dynamic>);
    } catch (_) {}
  }
  return null;
}

/// workmanager entry: keeps the widget honest when the app isn't opened.
/// Canonical executeTask pattern — workmanager binds the engine itself,
/// reports success/failure to WorkManager (retry with backoff on false),
/// and never clobbers the widget with a degraded projection when offline.
@pragma('vm:entry-point')
void widgetRefreshTask() => Workmanager().executeTask((task, inputData) async {
      if (task != widgetTaskName) return false;
      final target = await _readPersistedTarget();
      final snap = await _bgSnapshot();
      // No fresh data AND no cache → keep the last projection; returning
      // false makes WorkManager retry with backoff (no clobber).
      if (snap == null) return false;
      return projectWidget(snap: snap, myCodes: target.myCodes, lang: target.lang);
    });

/// Registers the 30-min periodic fallback. Idempotent-safe: workmanager
/// re-registers under the same unique name (KEEP policy), so calling this
/// from both main() and AppState.init() never duplicates work.
Future<void> ensureWidgetTask() async {
  if (_widgetTaskRegistered) return;
  _widgetTaskRegistered = true;
  try {
    await Workmanager().registerPeriodicTask(
      widgetTaskUniqueName,
      widgetTaskName,
      frequency: const Duration(minutes: 30),
      // Only run when the network is up — the whole point of the task
      // is the fetch; no point waking the device offline.
      constraints: Constraints(networkType: NetworkType.connected),
      // KEEP: never replace/reset an existing schedule on app launch —
      // resetting the schedule is how you get a widget that only ever
      // refreshes while the app is open.
      existingWorkPolicy: ExistingPeriodicWorkPolicy.keep,
    );
  } catch (_) {
    _widgetTaskRegistered = false; // allow a retry on next launch
  }
}
