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
  String? _voicedId; // last alert announced — speak each red only once

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

  /// Voice a new red alert for my zone — once per alert id. Fires on refresh,
  /// which covers foreground FCM arrival, app resume, and cold open.
  Future<void> _maybeAnnounce() async {
    if (!voiceAlerts || kIsWeb) return;
    final a = redMine;
    if (a == null || a.id == _voicedId) return;
    _voicedId = a.id;
    SharedPreferences.getInstance().then((p) => p.setString('rb_voiced', a.id));
    final my = {...myWilayas, ?hereWilaya};
    await VoiceAlert.announce(a, myCodes: my, lang: lang);
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
    _voicedId = p.getString('rb_voiced');
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

  Future<void> refresh() async {
    try {
      final raw = await api.fetchSnapshotRaw();
      snapshot = Snapshot.fromJson(jsonDecode(raw) as Map<String, dynamic>);
      sourceStatus = 'live';
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
      weather = await api.fetchWeather();
    } catch (_) {}
    notifyListeners();
    unawaited(_maybeAnnounce());
    unawaited(loadBoundaries().then((_) => locate()));
  }

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
        unawaited(_maybeAnnounce()); // GPS may reveal a red zone we just entered
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

  Future<void> loadBoundaries() async {
    if (boundaries != null) return;
    try {
      boundaries = await api.fetchBoundaries();
      notifyListeners();
    } catch (_) {}
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

  /// Subscribes FCM topics `w{code}_{hazard}_{color}` for every subscribed
  /// wilaya: red always on; orange follows the per-hazard preference.
  /// Diffs against the previously synced set so removals unsubscribe cleanly.
  Future<void> syncTopics() async {
    if (!_fcmReady) return;
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

  Future<bool> sendReport({required String category, int? wilaya, String description = ''}) async {
    final ok = await api.postReport(category: category, wilaya: wilaya, description: description, lang: lang);
    if (ok) await refresh();
    return ok;
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
