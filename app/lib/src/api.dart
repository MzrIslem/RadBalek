import 'dart:convert';
import 'package:http/http.dart' as http;
import 'models.dart';

/// Client for the Rad Balek ingest worker.
class Api {
  static const base = 'https://aisx-ews-ingest.md-mezouar.workers.dev';
  final http.Client _c;
  Api([http.Client? client]) : _c = client ?? http.Client();

  /// Returns the raw JSON string (for offline caching) — ?lite=1 keeps
  /// mobile-data cost ~4x lower than the full snapshot.
  Future<String> fetchSnapshotRaw() async {
    final r = await _c.get(Uri.parse('$base/v1/alerts.json?lite=1'));
    if (r.statusCode != 200) throw Exception('alerts HTTP ${r.statusCode}');
    return utf8.decode(r.bodyBytes);
  }

  /// Hourly national stats snapshots (7-day window) for the history view.
  Future<List<Map<String, dynamic>>> fetchHistory() async {
    final r = await _c.get(Uri.parse('$base/v1/history.json'));
    if (r.statusCode != 200) throw Exception('history HTTP ${r.statusCode}');
    return (jsonDecode(utf8.decode(r.bodyBytes)) as List).cast<Map<String, dynamic>>();
  }

  Future<bool> testPush(String token) async {
    final r = await _c.post(
      Uri.parse('$base/v1/test-push'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode({'token': token}),
    );
    return r.statusCode == 200;
  }

  Future<List<Wilaya>> fetchWilayas() async {
    final r = await _c.get(Uri.parse('$base/v1/wilayas.json'));
    if (r.statusCode != 200) throw Exception('wilayas HTTP ${r.statusCode}');
    return (jsonDecode(utf8.decode(r.bodyBytes)) as List)
        .map((w) => Wilaya.fromJson(w as Map<String, dynamic>))
        .toList();
  }

  Future<Map<String, dynamic>> fetchBoundaries() async {
    final r = await _c.get(Uri.parse('$base/v1/boundaries.json'));
    if (r.statusCode != 200) throw Exception('boundaries HTTP ${r.statusCode}');
    return jsonDecode(utf8.decode(r.bodyBytes)) as Map<String, dynamic>;
  }

  /// Live conditions per wilaya code: {t, feels, rh, wind}.
  Future<Map<int, Map<String, dynamic>>> fetchWeather() async {
    final r = await _c.get(Uri.parse('$base/v1/weather.json'));
    if (r.statusCode != 200) throw Exception('weather HTTP ${r.statusCode}');
    final j = jsonDecode(utf8.decode(r.bodyBytes)) as Map<String, dynamic>;
    return {
      for (final w in (j['wilayas'] as List? ?? const []))
        ((w as Map)['code'] as num).toInt(): w.cast<String, dynamic>()
    };
  }

  /// Airport now-cast per wilaya code (NOAA METAR): {vis, wind, wx,
  /// flags{rain,ts,snow,fog,dust}, t, ...}. Empty map when NOAA is
  /// unreachable — the card omits, never fabricates.
  Future<Map<int, Map<String, dynamic>>> fetchMetar() async {
    final r = await _c.get(Uri.parse('$base/v1/metar.json'));
    if (r.statusCode != 200) throw Exception('metar HTTP ${r.statusCode}');
    final j = jsonDecode(utf8.decode(r.bodyBytes)) as Map<String, dynamic>;
    return {
      for (final a in (j['airports'] as List? ?? const []))
        ((a as Map)['code'] as num).toInt(): a.cast<String, dynamic>()
    };
  }

  Future<List<CitizenReport>> fetchReports() async {
    final r = await _c.get(Uri.parse('$base/v1/reports.json?limit=30'));
    if (r.statusCode != 200) throw Exception('reports HTTP ${r.statusCode}');
    final j = jsonDecode(utf8.decode(r.bodyBytes)) as Map<String, dynamic>;
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
      final r = await _c.post(
        Uri.parse('$base/v1/reports'),
        headers: {'content-type': 'application/json'},
        body: jsonEncode({
          'category': category,
          'wilaya': wilaya,
          'lat': lat,
          'lon': lon,
          'description': description,
          'lang': lang,
        }),
      );
      if (r.statusCode == 429) return (report: null, error: 'rate');
      if (r.statusCode != 201) return (report: null, error: 'error');
      final j = jsonDecode(utf8.decode(r.bodyBytes)) as Map<String, dynamic>;
      final rep = j['report'] as Map<String, dynamic>?;
      return (report: rep == null ? null : CitizenReport.fromJson(rep), error: null);
    } catch (_) {
      return (report: null, error: 'error');
    }
  }

  /// Latest published release {version, tag, url, apk} — for the in-app
  /// update banner. Empty map when unavailable (fail-quiet).
  Future<Map<String, dynamic>> fetchAppInfo() async {
    try {
      final r = await _c.get(Uri.parse('$base/v1/app.json'));
      if (r.statusCode != 200) return const {};
      return (jsonDecode(utf8.decode(r.bodyBytes)) as Map).cast<String, dynamic>();
    } catch (_) {
      return const {};
    }
  }

  /// App feedback (bug/idea/comment + optional 1-5 rating) — for the dev team.
  Future<bool> postFeedback({required String type, int? rating, required String text,
      required String version, required String lang}) async {
    try {
      final r = await _c.post(
        Uri.parse('$base/v1/feedback'),
        headers: {'content-type': 'application/json'},
        body: jsonEncode({'type': type, 'rating': rating, 'text': text, 'version': version, 'lang': lang}),
      );
      return r.statusCode == 201;
    } catch (_) {
      return false;
    }
  }

  Future<int?> confirmReport(String id) async {
    final r = await _c.post(
      Uri.parse('$base/v1/reports/confirm'),
      headers: {'content-type': 'application/json'},
      body: jsonEncode({'id': id}),
    );
    if (r.statusCode != 200) return null;
    return ((jsonDecode(r.body) as Map)['confirms'] as num?)?.toInt();
  }
}
