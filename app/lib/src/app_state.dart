import 'dart:async';
import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import 'api.dart';
import 'geo_utils.dart';
import 'keys.dart';
import 'models.dart';
import 'voice.dart';

/// App-wide state: language, theme, subscriptions, live data.
/// FCM topic subscription hooks live in [syncTopics] — activated once the
/// Firebase app config lands (google-services.json / FlutterFire).
class AppState extends ChangeNotifier {
  final Api api;
  final bool autoRefresh;

  static const appVersion = '0.9.7'; // keep in sync with pubspec version

  String lang = 'fr';
  bool dark = false;
  List<int> myWilayas = [16, 6];
  Map<String, bool> notif = {
    'heat': true, 'storm': true, 'flood': true, 'wind': true, 'sandstorm': true, 'fire': true, 'road': true,
    'quake': true,
  };

  Snapshot? snapshot;
  List<Wilaya> wilayas = const [];
  List<CitizenReport> reports = const [];
  Map<String, dynamic>? boundaries;
  Map<int, Map<String, dynamic>> weather = {};
  String sourceStatus = 'offline';
  bool followMe = true; // "alerts where I am": on-open position -> wilaya
  int? hereWilaya;
  List<String> family = []; // SMS recipients for the I'm-safe button
  List<String> sosNumbers = ['14', '17', '1055']; // customizable SOS row
  bool voiceAlerts = true; // spoken red-alert announcements (AR+FR)
  // Auto-announce is now native (AlertActivity fires it WITH the siren, even on
  // a locked screen). Dart VoiceAlert stays only for the in-app replay button
  // and the settings sample.

  void toggleVoice() {
    voiceAlerts = !voiceAlerts;
    if (!voiceAlerts) {
      VoiceAlert.stop();
    } else {
      // Speak a sample on enable: user hears the exact voice pattern and we
      // exercise the Arabic-voice check on THIS device — no waiting for a red.
      final w = wilayaByCode(myWilayas.isNotEmpty ? myWilayas.first : null);
      unawaited(VoiceAlert.announce(
        AlertItem(id: 'sample', source: '', hazard: 'heat', color: 'red', severity: '',
            wilayas: [?w], headline: const {}),
        myCodes: {...myWilayas},
        lang: lang,
      ));
    }
    _persist();
    notifyListeners();
  }

  /// The red alert touching MY wilayas (subscriptions + GPS wilaya), if any.
  AlertItem? get redMine {
    final s = snapshot;
    if (s == null) return null;
    final my = {...myWilayas, ?hereWilaya};
    for (final a in s.alerts) {
      if (a.color == 'red' && a.wilayas.any((w) => my.contains(w.code))) return a;
    }
    return null;
  }


  Map<String, String> contactNames = {}; // number -> display name (from picker)

  String? nameFor(String num) => contactNames[num];

  void addSos(String num, {String? name}) {
    final n = _cleanNum(num);
    if (n.isEmpty || sosNumbers.contains(n)) return;
    sosNumbers = [...sosNumbers, n];
    if (name != null && name.trim().isNotEmpty) contactNames[n] = name.trim();
    _persist();
    notifyListeners();
  }

  void removeSos(String num) {
    sosNumbers = sosNumbers.where((f) => f != num).toList();
    _dropNameIfOrphan(num);
    _persist();
    notifyListeners();
  }

  void addFamily(String num, {String? name}) {
    final n = _cleanNum(num);
    if (n.isEmpty || family.contains(n)) return;
    family = [...family, n];
    if (name != null && name.trim().isNotEmpty) contactNames[n] = name.trim();
    _persist();
    notifyListeners();
  }

  void removeFamily(String num) {
    family = family.where((f) => f != num).toList();
    _dropNameIfOrphan(num);
    _persist();
    notifyListeners();
  }

  static String _cleanNum(String num) => num.replaceAll(RegExp(r'[\s\-().]'), '').trim();

  void _dropNameIfOrphan(String num) {
    if (!sosNumbers.contains(num) && !family.contains(num)) contactNames.remove(num);
  }

  /// System contact picker (no contacts permission needed) — returns
  /// {number, name} or null if cancelled/unavailable.
  Future<({String number, String name})?> pickContact() async {
    try {
      final r = await _ch.invokeMethod<Map<Object?, Object?>>('pickContact');
      final num = _cleanNum((r?['number'] ?? '').toString());
      if (num.isEmpty) return null;
      return (number: num, name: (r?['name'] ?? '').toString().trim());
    } catch (_) {
      return null;
    }
  }

  /// Direct call for personal contacts; official short codes route to the
  /// dialer (OS rule). Falls back to the dialer on any failure.
  Future<void> directCall(String num) async {
    try {
      await _ch.invokeMethod('directCall', {'number': num});
    } catch (_) {
      try {
        await launchUrl(Uri.parse('tel:$num'));
      } catch (_) {}
    }
  }

  AppState({Api? api, this.autoRefresh = true}) : api = api ?? Api();

  bool get rtl => lang == 'ar';

  Wilaya? wilayaByCode(int? code) {
    if (code == null) return null;
    for (final w in wilayas) {
      if (w.code == code) return w;
    }
    return null;
  }

  String wilayaName(int? code) => wilayaByCode(code)?.name(lang) ?? (code == null ? '—' : 'W$code');

  bool onboarded = true;

  Future<void> init() async {
    final p = await SharedPreferences.getInstance();
    lang = p.getString('rb_lang') ?? 'fr';
    dark = p.getBool('rb_dark') ?? false;
    followMe = p.getBool('rb_follow') ?? true;
    family = p.getStringList('rb_family') ?? [];
    sosNumbers = p.getStringList('rb_sos') ?? ['14', '17', '1055'];
    voiceAlerts = p.getBool('rb_voice') ?? true;
    contactNames = {
      for (final e in p.getStringList('rb_names') ?? const <String>[])
        if (e.contains('|')) e.substring(0, e.indexOf('|')): e.substring(e.indexOf('|') + 1),
    };
    onboarded = p.getBool('rb_onboarded') ?? false;
    myWilayas = (p.getStringList('rb_my') ?? ['16', '6']).map(int.parse).toList();
    final notifKeys = p.getStringList('rb_notif_off') ?? [];
    for (final k in notifKeys) {
      notif[k] = false;
    }
    // Offline-first: last cached snapshot renders instantly, network updates it.
    final cached = p.getString('rb_cache');
    if (cached != null) {
      try {
        snapshot = Snapshot.fromJson(jsonDecode(cached) as Map<String, dynamic>);
        sourceStatus = 'cached';
      } catch (_) {}
    }
    notifyListeners();
    await refresh();
    // Push-driven refresh: FCM messages and app-resume trigger updates;
    // no polling timer (battery + data).
    unawaited(_initFcm());
  }

  void finishOnboarding() {
    onboarded = true;
    SharedPreferences.getInstance().then((p) => p.setBool('rb_onboarded', true));
    syncTopics();
    locate();
    notifyListeners();
  }

  bool _fcmReady = false;
  String fcmDiag = 'init'; // last-known push health, surfaced by the test button
  bool notifGranted = false;

  Future<void> _initFcm() async {
    if (kIsWeb) return; // web push comes with the web Firebase app registration
    try {
      final fm = FirebaseMessaging.instance;
      final settings = await fm.requestPermission(alert: true, badge: true, sound: true);
      notifGranted = settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional;
      // Foreground FCM never shows a system notification — surface a banner.
      FirebaseMessaging.onMessage.listen((msg) {
        final title = msg.notification?.title ?? msg.data['headline_fr'] ?? 'Rad Balek';
        final body = msg.notification?.body ?? msg.data['headline_ar'] ?? '';
        scaffoldMessengerKey.currentState?.showSnackBar(SnackBar(
          content: Text('🔔 $title\n$body'),
          duration: const Duration(seconds: 5),
          behavior: SnackBarBehavior.floating,
        ));
        refresh();
      });
      // Token fetch can stall if App Check enforcement rejects the device —
      // bound it so init never hangs; note it in the diagnostic.
      final token = await fm.getToken().timeout(const Duration(seconds: 12), onTimeout: () => null);
      _fcmReady = token != null;
      fcmDiag = token == null ? 'no-token' : (notifGranted ? 'ready' : 'no-permission');
      if (token != null) await syncTopics();
      notifyListeners();
    } catch (e) {
      fcmDiag = 'error: ${e.toString().split('\n').first}';
    }
  }

  DateTime? _lastRefresh;
  DateTime? _lastWeather;
  bool _refreshing = false;

  /// [force] bypasses the throttle (pull-to-refresh). Auto-refresh on resume
  /// is throttled to 60s (audit: every resume re-fetched everything + GPS).
  Future<void> refresh({bool force = false}) async {
    if (_refreshing) return; // single-flight
    if (!force && _lastRefresh != null &&
        DateTime.now().difference(_lastRefresh!) < const Duration(seconds: 60)) {
      return;
    }
    _refreshing = true;
    try {
      try {
        final raw = await api.fetchSnapshotRaw();
        snapshot = Snapshot.fromJson(jsonDecode(raw) as Map<String, dynamic>);
        sourceStatus = 'live';
        _lastRefresh = DateTime.now();
        SharedPreferences.getInstance().then((p) => p.setString('rb_cache', raw));
      } catch (_) {
        if (sourceStatus != 'cached') sourceStatus = 'offline';
      }
      try {
        if (wilayas.isEmpty) wilayas = await api.fetchWilayas();
      } catch (_) {}
      try {
        reports = await api.fetchReports();
      } catch (_) {}
      try {
        // Weather is the largest payload — refetch at most every 10 min.
        if (force || _lastWeather == null ||
            DateTime.now().difference(_lastWeather!) > const Duration(minutes: 10)) {
          weather = await api.fetchWeather();
          _lastWeather = DateTime.now();
        }
      } catch (_) {}
    } finally {
      _refreshing = false;
    }
    notifyListeners(); // single rebuild per cycle (audit app#6)
    unawaited(loadBoundaries().then((_) => locate()));
    unawaited(checkForUpdate());
  }

  // ---- In-app update (pulls latest release info from the worker) ----
  Map<String, dynamic>? updateInfo; // {version, tag, url, apk} when newer
  bool _updateChecked = false;

  Future<void> checkForUpdate() async {
    if (_updateChecked) return;
    _updateChecked = true;
    try {
      final info = await api.fetchAppInfo();
      final latest = (info['version'] as String?)?.trim();
      if (latest != null && latest.isNotEmpty && _isNewer(latest, appVersion)) {
        updateInfo = info;
        notifyListeners();
      }
    } catch (_) {}
  }

  void dismissUpdate() {
    updateInfo = null;
    notifyListeners();
  }

  /// Semver-ish compare "0.9.1" vs "0.10.0" numerically, not lexically.
  static bool _isNewer(String a, String b) {
    final pa = a.split('.').map((x) => int.tryParse(x) ?? 0).toList();
    final pb = b.split('.').map((x) => int.tryParse(x) ?? 0).toList();
    for (var i = 0; i < 3; i++) {
      final x = i < pa.length ? pa[i] : 0, y = i < pb.length ? pb[i] : 0;
      if (x != y) return x > y;
    }
    return false;
  }

  Future<bool> sendFeedback({required String type, int? rating, required String text}) =>
      api.postFeedback(type: type, rating: rating, text: text, version: appVersion, lang: lang);

  /// One-shot position -> wilaya (no background tracking). Wilaya granularity
  /// matches ONM's alert granularity, so this is exact w.r.t. the source.
  Future<void> locate() async {
    if (!followMe || boundaries == null) return;
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) perm = await Geolocator.requestPermission();
      if (perm == LocationPermission.denied || perm == LocationPermission.deniedForever) return;
      final pos = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(accuracy: LocationAccuracy.low, timeLimit: Duration(seconds: 10)),
      );
      final code = wilayaAt(boundaries!, pos.latitude, pos.longitude);
      if (code != hereWilaya) {
        hereWilaya = code;
        await syncTopics();
      }
      notifyListeners();
    } catch (_) {}
  }

  void toggleFollow() {
    followMe = !followMe;
    if (!followMe) hereWilaya = null;
    _persist();
    syncTopics();
    if (followMe) locate();
    notifyListeners();
  }

  Future<void>? _boundariesInflight;

  Future<void> loadBoundaries() {
    if (boundaries != null) return Future.value();
    // Single-flight: refresh() and MapScreen.build both call this — without the
    // guard they raced and downloaded the (large) geojson twice.
    return _boundariesInflight ??= () async {
      try {
        boundaries = await api.fetchBoundaries();
        notifyListeners();
      } catch (_) {} finally {
        _boundariesInflight = null;
      }
    }();
  }

  Future<void> _persist() async {
    final p = await SharedPreferences.getInstance();
    await p.setString('rb_lang', lang);
    await p.setBool('rb_dark', dark);
    await p.setBool('rb_follow', followMe);
    await p.setStringList('rb_family', family);
    await p.setStringList('rb_sos', sosNumbers);
    await p.setBool('rb_voice', voiceAlerts);
    await p.setStringList('rb_names', [for (final e in contactNames.entries) '${e.key}|${e.value}']);
    await p.setStringList('rb_my', myWilayas.map((c) => c.toString()).toList());
    await p.setStringList('rb_notif_off', notif.entries.where((e) => !e.value).map((e) => e.key).toList());
  }

  void setLang(String l) {
    lang = l;
    _persist();
    notifyListeners();
  }

  void toggleDark() {
    dark = !dark;
    _persist();
    notifyListeners();
  }

  void toggleWilaya(int code) {
    if (myWilayas.contains(code)) {
      myWilayas = myWilayas.where((c) => c != code).toList();
    } else {
      myWilayas = [...myWilayas, code];
    }
    _persist();
    syncTopics();
    notifyListeners();
  }

  void toggleNotif(String hazard) {
    notif[hazard] = !(notif[hazard] ?? true);
    _persist();
    syncTopics();
    notifyListeners();
  }

  bool _topicsBusy = false;
  bool _topicsDirty = false;

  /// Subscribes FCM topics `w{code}_{hazard}_{color}` for every subscribed
  /// wilaya: red always on; orange follows the per-hazard preference.
  /// Diffs against the previously synced set so removals unsubscribe cleanly.
  /// Serialized: concurrent callers (toggleWilaya + locate + onboarding) used
  /// to interleave the read-modify-write of rb_topics and drift subscriptions.
  Future<void> syncTopics() async {
    if (!_fcmReady) return;
    if (_topicsBusy) {
      _topicsDirty = true; // re-run once the current sync finishes
      return;
    }
    _topicsBusy = true;
    try {
      await _syncTopicsOnce();
    } finally {
      _topicsBusy = false;
      if (_topicsDirty) {
        _topicsDirty = false;
        unawaited(syncTopics());
      }
    }
  }

  Future<void> _syncTopicsOnce() async {
    final desired = <String>{};
    for (final code in {...myWilayas, ?hereWilaya}) {
      for (final h in notif.keys) {
        desired.add('w${code}_${h}_red');
        if (notif[h] ?? true) desired.add('w${code}_${h}_orange');
      }
    }
    try {
      final p = await SharedPreferences.getInstance();
      final previous = (p.getStringList('rb_topics') ?? []).toSet();
      final fm = FirebaseMessaging.instance;
      for (final t in previous.difference(desired)) {
        await fm.unsubscribeFromTopic(t);
      }
      for (final t in desired.difference(previous)) {
        await fm.subscribeToTopic(t);
      }
      await p.setStringList('rb_topics', desired.toList());
    } catch (_) {}
  }

  /// Returns 'ok' | 'rate' | 'error' so the UI can explain a rate limit rather
  /// than telling the user to retry when they can't for an hour.
  Future<String> sendReport({required String category, int? wilaya, String description = ''}) async {
    final res = await api.postReport(category: category, wilaya: wilaya, description: description, lang: lang);
    if (res.report != null) {
      // Show it immediately — the shared /v1/reports.json feed is edge-cached
      // up to 60s, so a plain refresh wouldn't include the new report yet.
      reports = [res.report!, ...reports.where((r) => r.id != res.report!.id)];
      notifyListeners();
      unawaited(refresh()); // reconcile with the server (and the AI verdict)
      return 'ok';
    }
    return res.error ?? 'error';
  }

  Future<int?> confirm(String id) => api.confirmReport(id);

  /// Returns a precise status so the UI can tell the user WHAT failed:
  /// 'ok' | 'no-permission' | 'no-token' | 'server' | 'error:...'.
  Future<String> sendTestPush() async {
    if (kIsWeb) return 'web';
    try {
      // Re-request in case it was denied before (Android 13+ POST_NOTIFICATIONS).
      final settings = await FirebaseMessaging.instance.requestPermission();
      notifGranted = settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional;
      if (!notifGranted) return 'no-permission';
      final token = await FirebaseMessaging.instance
          .getToken()
          .timeout(const Duration(seconds: 12), onTimeout: () => null);
      if (token == null) return 'no-token';
      final ok = await api.testPush(token);
      fcmDiag = ok ? 'ready' : 'server';
      return ok ? 'ok' : 'server';
    } catch (e) {
      return 'error: ${e.toString().split('\n').first}';
    }
  }

  static const _ch = MethodChannel('rb/channels');

  /// Opens the OS notification settings for this app (to fix denied permission).
  Future<void> openAppNotifSettings() async {
    try {
      await _ch.invokeMethod('openAppNotif');
    } catch (_) {}
  }

  Future<void> requestDndAccess() async {
    try {
      await _ch.invokeMethod('requestDndAccess');
    } catch (_) {}
  }

  Future<void> requestBatteryExempt() async {
    try {
      await _ch.invokeMethod('requestBatteryExempt');
    } catch (_) {}
  }

  /// {dnd: bool, battery: bool} — whether emergency prerequisites are granted.
  Future<Map<String, bool>> emergencyStatus() async {
    try {
      final r = await _ch.invokeMethod('emergencyStatus');
      return {'dnd': r['dnd'] == true, 'battery': r['battery'] == true};
    } catch (_) {
      return {'dnd': false, 'battery': false};
    }
  }

}
