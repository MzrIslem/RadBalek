import 'dart:convert';
import 'package:http/http.dart' as http;
import 'models.dart';

/// Client for the Rad Balek ingest worker.
class Api {
  static const base = 'https://aisx-ews-ingest.md-mezouar.workers.dev';
  final http.Client _c;
  Api([http.Client? client]) : _c = client ?? http.Client();

  static const _jsonHeaders = {'content-type': 'application/json'};

  /// Every GET goes through here: bodyBytes + utf8 (the Arabic headlines are
  /// mangled by http's latin-1 default) and a labelled non-200 exception.
  Future<String> _getText(String path, String label) async {
    final r = await _c.get(Uri.parse('$base$path'));
    if (r.statusCode != 200) throw Exception('$label HTTP ${r.statusCode}');
    return utf8.decode(r.bodyBytes);
  }

  Future<T> _getJson<T>(String path, String label) async =>
      jsonDecode(await _getText(path, label)) as T;

  Future<http.Response> _post(String path, Map<String, dynamic> body) =>
      _c.post(Uri.parse('$base$path'), headers: _jsonHeaders, body: jsonEncode(body));

  Map<String, dynamic> _obj(http.Response r) =>
      (jsonDecode(utf8.decode(r.bodyBytes)) as Map).cast<String, dynamic>();

  /// Returns the raw JSON string (for offline caching) — ?lite=1 keeps
  /// mobile-data cost ~4x lower than the full snapshot.
  Future<String> fetchSnapshotRaw() => _getText('/v1/alerts.json?lite=1', 'alerts');

  /// Hourly national stats snapshots (7-day window) for the history view.
  Future<List<Map<String, dynamic>>> fetchHistory() async =>
      (await _getJson<List>('/v1/history.json', 'history')).cast<Map<String, dynamic>>();

  Future<bool> testPush(String token) async =>
      (await _post('/v1/test-push', {'token': token})).statusCode == 200;

  Future<List<Wilaya>> fetchWilayas() async =>
      (await _getJson<List>('/v1/wilayas.json', 'wilayas'))
          .map((w) => Wilaya.fromJson(w as Map<String, dynamic>))
          .toList();

  Future<Map<String, dynamic>> fetchBoundaries() =>
      _getJson<Map<String, dynamic>>('/v1/boundaries.json', 'boundaries');

  /// Live conditions per wilaya code: {t, feels, rh, wind}.
  Future<Map<int, Map<String, dynamic>>> fetchWeather() async {
    final j = await _getJson<Map<String, dynamic>>('/v1/weather.json', 'weather');
    return {
      for (final w in (j['wilayas'] as List? ?? const []))
        ((w as Map)['code'] as num).toInt(): w.cast<String, dynamic>()
    };
  }

  Future<List<CitizenReport>> fetchReports() async {
    final j = await _getJson<Map<String, dynamic>>('/v1/reports.json?limit=30', 'reports');
    return ((j['reports'] as List?) ?? const [])
        .map((x) => CitizenReport.fromJson(x as Map<String, dynamic>))
        .toList();
  }

  /// Posts a report. Returns the created report (shown instantly, since the
  /// shared feed is edge-cached), or an error code: 'rate' (too many reports
  /// this hour) | 'error' (anything else).
  Future<({CitizenReport? report, String? error})> postReport({
    required String category,
    int? wilaya,
    double? lat,
    double? lon,
    String description = '',
    String lang = 'fr',
  }) async {
    try {
      final r = await _post('/v1/reports', {
        'category': category,
        'wilaya': wilaya,
        'lat': lat,
        'lon': lon,
        'description': description,
        'lang': lang,
      });
      if (r.statusCode == 429) return (report: null, error: 'rate');
      if (r.statusCode != 201) return (report: null, error: 'error');
      final rep = _obj(r)['report'] as Map<String, dynamic>?;
      return (report: rep == null ? null : CitizenReport.fromJson(rep), error: null);
    } catch (_) {
      return (report: null, error: 'error');
    }
  }

  /// Latest published release {version, tag, url, apk} — for the in-app
  /// update banner. Empty map when unavailable (fail-quiet).
  Future<Map<String, dynamic>> fetchAppInfo() async {
    try {
      return await _getJson<Map<String, dynamic>>('/v1/app.json', 'app');
    } catch (_) {
      return const {};
    }
  }

  /// App feedback (bug/idea/comment + optional 1-5 rating) — for the dev team.
  Future<bool> postFeedback({required String type, int? rating, required String text,
      required String version, required String lang}) async {
    try {
      final r = await _post('/v1/feedback',
          {'type': type, 'rating': rating, 'text': text, 'version': version, 'lang': lang});
      return r.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  Future<int?> confirmReport(String id) async {
    final r = await _post('/v1/reports/confirm', {'id': id});
    if (r.statusCode != 200) return null;
    return (_obj(r)['confirms'] as num?)?.toInt();
  }
}
