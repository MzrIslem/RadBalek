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

/// Predictive risk per wilaya — AI advisory, never pushes, shown as amber card.
class RiskScore {
  final int score; // 0..100
  final String hazard;
  final List<String> factors;
  const RiskScore({required this.score, required this.hazard, required this.factors});
  factory RiskScore.fromJson(Map<String, dynamic> j) => RiskScore(
        score: (j['score'] as num?)?.toInt().clamp(0, 100) ?? 0,
        hazard: j['hazard'] as String? ?? 'other',
        factors: ((j['factors'] as List?) ?? const []).map((e) => e.toString()).take(5).toList(),
      );
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
  // EEW extension — honest S-wave arrival estimate; null for non-EEW alerts
  final bool eew;
  final int? warningSeconds;
  final int? pWaveSeconds;
  final int? sWaveSeconds;
  final int? distanceKm;

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
    this.eew = false,
    this.warningSeconds,
    this.pWaveSeconds,
    this.sWaveSeconds,
    this.distanceKm,
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
        eew: j['eew'] == true,
        warningSeconds: (j['warningSeconds'] as num?)?.toInt(),
        pWaveSeconds: (j['pWaveSeconds'] as num?)?.toInt(),
        sWaveSeconds: (j['sWaveSeconds'] as num?)?.toInt(),
        distanceKm: (j['distanceKm'] as num?)?.toInt(),
      );

  /// True for EEW alerts: seconds-level estimated S-wave arrival, not a guaranteed pre-event warning.
  bool get isEew => eew && warningSeconds != null;
}

class Incident {
  final String id;
  final String source; // firms | dgpc-telegram
  final String hazard;
  final String status;
  final List<Wilaya> wilayas;
  final String? commune;
  final String? place; // exact named location from DGPC sitrep bullets
  final int detections;
  final double? totalFrp; // summed fire radiative power (MW) of the cluster
  final bool corroborated;
  final bool possibleIndustrial;
  final double? lat;
  final double? lon;
  final double? mag;
  final String? observedAt;
  final int passes; // distinct satellite passes in the 24h window
  final String? frpTrend; // 'rising' | 'declining' | 'steady' | null (single pass)
  final String? firstObservedAt; // earliest dated observation in the window
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
    this.place,
    this.detections = 0,
    this.totalFrp,
    this.corroborated = false,
    this.possibleIndustrial = false,
    this.lat,
    this.lon,
    this.mag,
    this.observedAt,
    this.passes = 1,
    this.frpTrend,
    this.firstObservedAt,
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
        place: j['place'] as String?,
        detections: (j['detections'] as num?)?.toInt() ?? 0,
        totalFrp: (j['totalFrp'] as num?)?.toDouble(),
        corroborated: j['corroborated'] as bool? ?? false,
        possibleIndustrial: j['possibleIndustrial'] as bool? ?? false,
        lat: (j['lat'] as num?)?.toDouble(),
        lon: (j['lon'] as num?)?.toDouble(),
        mag: (j['mag'] as num?)?.toDouble(),
        observedAt: j['observedAt'] as String?,
        passes: (j['passes'] as num?)?.toInt() ?? 1,
        frpTrend: j['frpTrend'] as String?,
        firstObservedAt: j['firstObservedAt'] as String?,
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
  // Live source credits from the worker ('' when absent — offline caches and
  // pre-attribution snapshots must keep decoding, per the degradation rule).
  final String attribution;
  final Map<String, int> byColor;
  final Map<String, int> byHazard;
  final int ongoingFires;
  final List<AlertItem> alerts;
  final List<Incident> incidents;
  final Map<int, RiskScore> riskScores; // empty when AI disabled / offline cache

  const Snapshot({
    required this.generatedAt,
    this.attribution = '',
    required this.byColor,
    required this.byHazard,
    required this.ongoingFires,
    required this.alerts,
    required this.incidents,
    this.riskScores = const {},
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
    // riskScores is Map<String, {score,hazard,factors}> — resilient like the rest
    final rs = <int, RiskScore>{};
    try {
      final raw = j['riskScores'] as Map?;
      if (raw != null) {
        for (final e in raw.entries) {
          final code = int.tryParse(e.key.toString());
          if (code == null || code < 1 || code > 58) continue;
          try {
            rs[code] = RiskScore.fromJson(e.value as Map<String, dynamic>);
          } catch (_) {}
        }
      }
    } catch (_) {}
    return Snapshot(
      generatedAt: j['generatedAt'] as String? ?? '',
      attribution: j['attribution'] as String? ?? '',
      byColor: intMap(stats['byColor']),
      byHazard: intMap(stats['byHazard']),
      ongoingFires: ((stats['dgpcSitrep'] as Map?)?['ongoing'] as num?)?.toInt() ?? 0,
      alerts: parseEach(j['alerts'], AlertItem.fromJson)
        ..sort((a, b) {
          // EEW first, then red, then orange — life-critical order
          final ae = a.eew ? -1 : _rank(a.color);
          final be = b.eew ? -1 : _rank(b.color);
          return ae.compareTo(be);
        }),
      incidents: parseEach(j['incidents'], Incident.fromJson),
      riskScores: rs,
    );
  }

  static int _rank(String c) => switch (c) { 'red' => 0, 'orange' => 1, _ => 2 };

  /// Wilaya codes currently under a given color.
  Set<int> wilayasWith(String color) =>
      alerts.where((a) => a.active && a.color == color).expand((a) => a.wilayas.map((w) => w.code)).toSet();

  /// Highest level per wilaya: 3 red, 2 orange, 1 yellow, 0 none.
  Map<int, int> levelByWilaya() {
    final out = <int, int>{};
    for (final a in alerts) {
      if (!a.active) continue; // cached/offline expired guard
      final r = switch (a.color) { 'red' => 3, 'orange' => 2, _ => 1 };
      for (final w in a.wilayas) {
        if (r > (out[w.code] ?? 0)) out[w.code] = r;
      }
    }
    return out;
  }
}
