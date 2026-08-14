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
import 'diag.dart';
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

  static const appVersion = '1.2.1'; // keep in sync with pubspec version

  String lang = 'fr';
  bool dark = false;
  List<int> myWilayas = [16, 6];
  // MUST cover every hazard `hazardFromEvent` can emit (ingest/src/capfeed.js) —
  // this map's keys are the ONLY source of FCM topic names, so a hazard missing
  // here means a red alert for it is published to a topic nobody subscribes to.
  // `cold` and `other` were missing: a red Froid/Neige vigilance, or any ONM
  // event whose wording matches none of the regexes (fog, waves, black ice),
  // reached zero devices. `other` is a catch-all and stays on (no chip).
  Map<String, bool> notif = {
    'heat': true, 'storm': true, 'flood': true, 'wind': true, 'sandstorm': true, 'fire': true, 'road': true,
    'quake': true, 'cold': true, 'other': true,
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
  // Larger text throughout — this app is meant for elderly and low-literacy
  // users too, and the OS-level setting is one many of them never find.
  bool bigText = false;

  void toggleBigText() {
    bigText = !bigText;
    SharedPreferences.getInstance().then((p) => p.setBool('rb_bigtext', bigText));
    notifyListeners();
  }

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
    } catch (err) {
      logErr('pickContact', err);
      return null;
    }
  }

  /// Direct call for personal contacts; official short codes route to the
  /// dialer (OS rule). Falls back to the dialer on any failure.
  Future<void> directCall(String num) async {
    try {
      await _ch.invokeMethod('directCall', {'number': num});
    } catch (err) {
      logErr('directCall', err);
      try {
        await launchUrl(Uri.parse('tel:$num'));
      } catch (err2) {
        // Both paths gone: the user pressed an emergency number and nothing at
        // all happened, which must not be invisible in the logs.
        logErr('directCall dialer fallback', err2);
      }
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
    bigText = p.getBool('rb_bigtext') ?? false;
    contactNames = {
      for (final e in p.getStringList('rb_names') ?? const <String>[])
        if (e.contains('|')) e.substring(0, e.indexOf('|')): e.substring(e.indexOf('|') + 1),
    };
    onboarded = p.getBool('rb_onboarded') ?? false;
    reliabilityOk = p.getBool('rb_rel_ok'); // null until first native check
    creatorMode = p.getBool('rb_creator') ?? false;
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
      } catch (err) {
        logErr('cached snapshot parse', err);
      }
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
    // Firebase failed to initialise: every messaging call below would throw the
    // same way, so report the real cause instead of a generic 'error:'.
    if (firebaseInitError != null) {
      fcmDiag = 'firebase-init: $firebaseInitError';
      notifyListeners();
      return;
    }
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
      // Tokens rotate (app reinstall, storage wipe, App Check rollback, etc.).
      // A rotated token is subscribed to NOTHING until we resubscribe: the diff
      // in _syncTopicsOnce is token-agnostic, so it would compute an empty diff
      // and the device would never receive another alert. _syncTopicsOnce keys
      // its cache on the token to force a full resubscribe. Also re-arm
      // _fcmReady here: if the initial getToken() timed out, this listener is
      // the only path back to a working subscription.
      FirebaseMessaging.instance.onTokenRefresh.listen((t) {
        _fcmReady = t.isNotEmpty;
        if (fcmDiag == 'no-token') fcmDiag = notifGranted ? 'ready' : 'no-permission';
        syncTopics();
      });
      notifyListeners();
    } catch (err) {
      logErr('fcm init', err);
      fcmDiag = 'error: ${errText(err)}';
      notifyListeners(); // the diagnostic changed — the settings page must see it
    }
  }

  DateTime? _lastRefresh;
  DateTime? _lastWeather;
  bool _refreshing = false;

  /// Why each optional data source last failed, keyed by source name
  /// ('snapshot', 'wilayas', 'reports', 'weather', 'boundaries'). A source that
  /// silently never loads is otherwise indistinguishable from a source with
  /// nothing to report — the map layer just stays empty.
  final Map<String, String> sourceErrors = {};

  void _noteSource(String source, [Object? err]) {
    if (err == null) {
      sourceErrors.remove(source);
      return;
    }
    sourceErrors[source] = errText(err);
    logErr(source, err);
  }

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
        _noteSource('snapshot');
      } catch (err) {
        if (sourceStatus != 'cached') sourceStatus = 'offline';
        _noteSource('snapshot', err);
      }
      try {
        if (wilayas.isEmpty) wilayas = await api.fetchWilayas();
        _noteSource('wilayas');
      } catch (err) {
        _noteSource('wilayas', err);
      }
      try {
        reports = await api.fetchReports();
        _noteSource('reports');
      } catch (err) {
        _noteSource('reports', err);
      }
      try {
        // Weather is the largest payload — refetch at most every 10 min.
        if (force || _lastWeather == null ||
            DateTime.now().difference(_lastWeather!) > const Duration(minutes: 10)) {
          weather = await api.fetchWeather();
          _lastWeather = DateTime.now();
        }
        _noteSource('weather');
      } catch (err) {
        _noteSource('weather', err);
      }
    } finally {
      _refreshing = false;
    }
    notifyListeners(); // single rebuild per cycle (audit app#6)
    unawaited(loadBoundaries().then((_) => locate()));
    unawaited(checkForUpdate());
    // Re-verify the siren prerequisites (cheap native call). refresh() runs on
    // launch and on resume, so an OEM revoking a permission surfaces on the
    // home banner without the user ever opening Réglages.
    unawaited(reliabilityStatus());
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
    } catch (err) {
      // Retried on the next launch (_updateChecked is not persisted), so this
      // stays non-fatal — but a permanently broken check hid every release.
      logErr('checkForUpdate', err);
    }
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
    } catch (err) {
      // "Alerts where I am" just stops updating hereWilaya; the subscribed
      // wilayas still alert, so this is degraded rather than fatal.
      logErr('locate', err);
    }
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
        _noteSource('boundaries');
        notifyListeners();
      } catch (err) {
        // No boundaries means locate() can never resolve a wilaya, so this
        // failure silently disables "alerts where I am" too.
        _noteSource('boundaries', err);
      } finally {
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
      // Never allow zero wilayas: the topic set would empty out (unsubscribing
      // from EVERYTHING) while the home screen showed a permanent green "Tout
      // va bien chez vous" — even during a national red alert. The SOS editor
      // guards its last entry the same way.
      if (myWilayas.length <= 1) return;
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
      final fm = FirebaseMessaging.instance;
      // rb_topics records what THIS token is subscribed to. FCM subscriptions
      // are per-token, so when the token rotates the stored set is meaningless
      // — treat it as empty and resubscribe everything, or the new token stays
      // subscribed to nothing forever (silent device, all UI looking correct).
      final token = await fm.getToken().timeout(const Duration(seconds: 12), onTimeout: () => null);
      final sameToken = token != null && p.getString('rb_topics_token') == token;
      final previous = sameToken ? (p.getStringList('rb_topics') ?? []).toSet() : <String>{};
      for (final t in previous.difference(desired)) {
        await fm.unsubscribeFromTopic(t);
      }
      for (final t in desired.difference(previous)) {
        await fm.subscribeToTopic(t);
      }
      await p.setStringList('rb_topics', desired.toList());
      if (token != null) await p.setString('rb_topics_token', token);
      topicsError = null;
    } catch (err) {
      // This is the failure that makes a device go quiet while every screen
      // still looks correct: the subscriptions are wrong, the alert never
      // arrives. rb_topics is left untouched so the next sync retries the diff.
      topicsError = errText(err);
      logErr('syncTopics', err);
      if (fcmDiag == 'ready') fcmDiag = 'topics-failed';
      notifyListeners();
    }
  }

  /// Why the last topic sync failed, if it did. Reported by [sendTestPush] as
  /// 'topics-failed', because a token-addressed test push succeeds regardless.
  String? topicsError;

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
  /// 'ok' | 'no-permission' | 'no-token' | 'server' | 'topics-failed' | 'error:...'.
  Future<String> sendTestPush() async {
    if (kIsWeb) return 'web';
    if (firebaseInitError != null) return 'error: ${firebaseInitError!}';
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
      if (!ok) return 'server';
      // A test push is addressed to the TOKEN, so it arrives even when topic
      // subscription failed — reporting 'ok' there told the user real alerts
      // would ring when no topic was subscribed. Retry the sync and say so.
      if (topicsError != null) {
        await syncTopics();
        if (topicsError != null) return 'topics-failed';
      }
      return 'ok';
    } catch (err) {
      logErr('sendTestPush', err);
      return 'error: ${errText(err)}';
    }
  }

  static const _ch = MethodChannel('rb/channels');

  /// Opens the OS notification settings for this app (to fix denied permission).
  Future<void> openAppNotifSettings() => _openNative('openAppNotif');

  Future<void> requestDndAccess() => _openNative('requestDndAccess');

  Future<void> requestBatteryExempt() => _openNative('requestBatteryExempt');

  /// Opens an OS settings page. On an OEM that ships no such activity the call
  /// throws and nothing opens; the user is told the button does nothing rather
  /// than left tapping a dead control.
  Future<void> _openNative(String method) async {
    try {
      await _ch.invokeMethod(method);
    } catch (err) {
      logErr('native $method', err);
      scaffoldMessengerKey.currentState?.showSnackBar(SnackBar(
        content: Text(lang == 'ar'
            ? 'تعذّر فتح إعدادات النظام — افتحها يدويًا.'
            : "Impossible d'ouvrir les réglages système — ouvrez-les manuellement."),
        duration: const Duration(seconds: 4),
      ));
    }
  }

  // ---- Creator mode (hidden): subscribes this device to backend health
  // alerts from the worker's watchdog. Long-press "À propos" to toggle.
  bool creatorMode = false;

  Future<bool> toggleCreatorMode() async {
    creatorMode = !creatorMode;
    notifyListeners();
    final p = await SharedPreferences.getInstance();
    await p.setBool('rb_creator', creatorMode);
    if (!kIsWeb) {
      try {
        final fm = FirebaseMessaging.instance;
        if (creatorMode) {
          await fm.subscribeToTopic('admin');
        } else {
          await fm.unsubscribeFromTopic('admin');
        }
      } catch (err) {
        logErr('creatorMode admin topic', err);
      }
    }
    return creatorMode;
  }

  /// Opens the system sound settings (to raise the alarm volume).
  Future<void> openSoundSettings() => _openNative('openSoundSettings');

  /// Android 14+ "full-screen alerts" permission page for this app.
  Future<void> requestFsi() => _openNative('requestFsi');

  /// Opens the emergency channel's own settings page.
  Future<void> openEmergencyChannel() => _openNative('openChannelEmergency');

  /// Every switch that can silently stop a red alert from ringing:
  /// {notifs, channel, battery, dnd: bool, volume: 0..1}.
  /// Volume is a double — the others are booleans, hence the dynamic map.
  Future<Map<String, dynamic>> reliabilityStatus() async {
    if (kIsWeb) return const {};
    try {
      final r = await _ch.invokeMethod('emergencyStatus');
      final s = {
        'notifs': r['notifs'] == true,
        'channel': r['channel'] == true,
        'battery': r['battery'] == true,
        'dnd': r['dnd'] == true,
        'volume': (r['volume'] as num?)?.toDouble() ?? 1.0,
        // Only present on Android 14+; absent means "not applicable", which the
        // checklist treats as OK rather than inventing a failure.
        if (r['fsi'] != null) 'fsi': r['fsi'] == true,
      };
      _cacheReliability(s);
      return s;
    } catch (err) {
      // Empty map = "unknown", which the checklist renders as no verdict. Never
      // cache a verdict from a failed probe: that would claim the siren is fine.
      logErr('emergencyStatus', err);
      return const {};
    }
  }

  /// Backwards-compatible alias (older call sites want just the two flags).
  Future<Map<String, bool>> emergencyStatus() async {
    final s = await reliabilityStatus();
    return {'dnd': s['dnd'] == true, 'battery': s['battery'] == true};
  }

  /// True when every prerequisite for a red alert to ring is satisfied.
  /// Null until the first check — the UI shows no verdict rather than a
  /// wrong one. Cached so the home banner can warn without a native round-trip.
  bool? reliabilityOk;

  void _cacheReliability(Map<String, dynamic> s) {
    final ok = s['notifs'] == true &&
        s['channel'] == true &&
        s['battery'] == true &&
        ((s['volume'] as num?)?.toDouble() ?? 1.0) >= 0.3;
    if (ok == reliabilityOk) return;
    reliabilityOk = ok;
    SharedPreferences.getInstance().then((p) => p.setBool('rb_rel_ok', ok));
    notifyListeners();
  }
}
