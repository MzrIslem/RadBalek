/// Data models mirroring the worker's /v1/alerts.json snapshot.
class Wilaya {
  final int code;
  final String fr;
  final String ar;
  const Wilaya({required this.code, required this.fr, required this.ar});

  factory Wilaya.fromJson(Map<String, dynamic> j) =>
      // Guarded: one malformed `code` (null / "16") used to throw and, via the
      // bare catch in AppState, drop the WHOLE snapshot — every alert nationwide
      // vanished silently.
      Wilaya(code: (j['code'] as num?)?.toInt() ?? 0, fr: j['fr'] as String? ?? '', ar: j['ar'] as String? ?? '');

  String name(String lang) => lang == 'ar' ? ar : fr;
}

class AlertItem {
  final String id;
  final String source;
  final String hazard;
  final String color; // yellow | orange | red
  final String severity;
  final String? onset;
  final String? expires;
  final String? sent;
  final List<Wilaya> wilayas;
  final Map<String, String> headline;

  const AlertItem({
    required this.id,
    required this.source,
    required this.hazard,
    required this.color,
    required this.severity,
    this.onset,
    this.expires,
    this.sent,
    required this.wilayas,
    required this.headline,
  });

  /// Still valid right now. A LIVE snapshot never carries an expired alert (the
  /// worker filters them), but a CACHED snapshot rendered offline can — and an
  /// expired red must not drive the full-screen crisis takeover as if live.
  bool get active {
    if (expires == null || expires!.isEmpty) return true;
    final e = DateTime.tryParse(expires!);
    return e == null || !e.isBefore(DateTime.now());
  }

  factory AlertItem.fromJson(Map<String, dynamic> j) => AlertItem(
        id: j['id'] as String? ?? '',
        source: j['source'] as String? ?? '',
        hazard: j['hazard'] as String? ?? 'other',
        color: j['color'] as String? ?? 'yellow',
        severity: j['severity'] as String? ?? '',
        onset: j['onset'] as String?,
        expires: j['expires'] as String?,
        sent: j['sent'] as String?,
        wilayas: ((j['wilayas'] as List?) ?? const [])
            .map((w) => Wilaya.fromJson(w as Map<String, dynamic>))
            .toList(),
        headline: ((j['headline'] as Map?) ?? const {}).map((k, v) => MapEntry(k.toString(), v.toString())),
      );
}

class Incident {
  final String id;
  final String source; // firms | dgpc-telegram
  final String hazard;
  final String status;
  final List<Wilaya> wilayas;
  final String? commune;
  final int detections;
  final double? totalFrp; // summed fire radiative power (MW) of the cluster
  final bool corroborated;
  final bool possibleIndustrial;
  final double? lat;
  final double? lon;
  final double? mag;
  final String? observedAt;
  final String? headlineFr; // press / dgpc.dz posts carry their own title
  final String? link; // source article, for "lire la source"
  final String? sourceName; // e.g. "TSA", "Ennahar", "Protection Civile (dgpc.dz)"
  final bool stale; // fire re-served from cache during a FIRMS outage — "last known"

  const Incident({
    required this.id,
    required this.source,
    required this.hazard,
    required this.status,
    required this.wilayas,
    this.commune,
    this.detections = 0,
    this.totalFrp,
    this.corroborated = false,
    this.possibleIndustrial = false,
    this.lat,
    this.lon,
    this.mag,
    this.observedAt,
    this.headlineFr,
    this.link,
    this.sourceName,
    this.stale = false,
  });

  factory Incident.fromJson(Map<String, dynamic> j) => Incident(
        id: j['id'] as String? ?? '',
        source: j['source'] as String? ?? '',
        hazard: j['hazard'] as String? ?? 'other',
        status: j['status'] as String? ?? '',
        wilayas: ((j['wilayas'] as List?) ?? const [])
            .map((w) => Wilaya.fromJson(w as Map<String, dynamic>))
            .toList(),
        commune: j['commune'] as String?,
        detections: (j['detections'] as num?)?.toInt() ?? 0,
        totalFrp: (j['totalFrp'] as num?)?.toDouble(),
        corroborated: j['corroborated'] as bool? ?? false,
        possibleIndustrial: j['possibleIndustrial'] as bool? ?? false,
        lat: (j['lat'] as num?)?.toDouble(),
        lon: (j['lon'] as num?)?.toDouble(),
        mag: (j['mag'] as num?)?.toDouble(),
        observedAt: j['observedAt'] as String?,
        headlineFr: ((j['headline'] as Map?)?['fr'])?.toString(),
        link: j['link'] as String?,
        sourceName: j['sourceName'] as String?,
        stale: j['stale'] as bool? ?? false,
      );
}

class CitizenReport {
  final String id;
  final String at;
  final String category;
  final int? wilaya;
  final String description;
  final String status;
  final int confirms;

  const CitizenReport({
    required this.id,
    required this.at,
    required this.category,
    this.wilaya,
    required this.description,
    required this.status,
    required this.confirms,
  });

  factory CitizenReport.fromJson(Map<String, dynamic> j) => CitizenReport(
        id: j['id'] as String? ?? '',
        at: j['at'] as String? ?? '',
        category: j['category'] as String? ?? 'other',
        wilaya: (j['wilaya'] as num?)?.toInt(),
        description: j['description'] as String? ?? '',
        status: j['status'] as String? ?? 'new',
        confirms: (j['confirms'] as num?)?.toInt() ?? 0,
      );
}

class Snapshot {
  final String generatedAt;
  final Map<String, int> byColor;
  final Map<String, int> byHazard;
  final int ongoingFires;
  final List<AlertItem> alerts;
  final List<Incident> incidents;

  const Snapshot({
    required this.generatedAt,
    required this.byColor,
    required this.byHazard,
    required this.ongoingFires,
    required this.alerts,
    required this.incidents,
  });

  factory Snapshot.fromJson(Map<String, dynamic> j) {
    final stats = (j['stats'] as Map?) ?? const {};
    Map<String, int> intMap(dynamic m) =>
        ((m as Map?) ?? const {}).map((k, v) => MapEntry(k.toString(), v is num ? v.toInt() : 0));
    // Per-item resilient parse: one malformed alert/incident drops ITSELF, not
    // the entire snapshot (which would blank every alert in the country).
    List<T> parseEach<T>(dynamic list, T Function(Map<String, dynamic>) fromJson) {
      final out = <T>[];
      for (final e in (list as List?) ?? const []) {
        try {
          out.add(fromJson(e as Map<String, dynamic>));
        } catch (_) {}
      }
      return out;
    }
    return Snapshot(
      generatedAt: j['generatedAt'] as String? ?? '',
      byColor: intMap(stats['byColor']),
      byHazard: intMap(stats['byHazard']),
      ongoingFires: ((stats['dgpcSitrep'] as Map?)?['ongoing'] as num?)?.toInt() ?? 0,
      alerts: parseEach(j['alerts'], AlertItem.fromJson)
        ..sort((a, b) => _rank(a.color).compareTo(_rank(b.color))),
      incidents: parseEach(j['incidents'], Incident.fromJson),
    );
  }

  static int _rank(String c) => switch (c) { 'red' => 0, 'orange' => 1, _ => 2 };

  /// Wilaya codes currently under a given color.
  Set<int> wilayasWith(String color) =>
      alerts.where((a) => a.color == color).expand((a) => a.wilayas.map((w) => w.code)).toSet();

  /// Highest level per wilaya: 3 red, 2 orange, 1 yellow, 0 none.
  Map<int, int> levelByWilaya() {
    final out = <int, int>{};
    for (final a in alerts) {
      final r = switch (a.color) { 'red' => 3, 'orange' => 2, _ => 1 };
      for (final w in a.wilayas) {
        if (r > (out[w.code] ?? 0)) out[w.code] = r;
      }
    }
    return out;
  }
}
