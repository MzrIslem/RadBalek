import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../api.dart';
import '../app_state.dart';
import '../models.dart';
import '../strings.dart';
import '../theme.dart';
import '../widgets/sheets.dart';

/// Interactive map on real tiles (flutter_map): wilaya vigilance polygons,
/// satellite fire hotspots at true coordinates, Protection Civile badges at
/// area-weighted centroids, plus the EFFIS fire-weather (FWI) overlay.

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _WilayaShape {
  final int code;
  final bool gb; // filler: no border
  final bool approx; // rough box: hit-test only, never painted
  final List<List<LatLng>> rings;
  final LatLng centroid;
  const _WilayaShape(
    this.code,
    this.gb,
    this.approx,
    this.rings,
    this.centroid,
  );
}

class _MapScreenState extends State<MapScreen> {
  int? _selected;
  String _layer = 'vig'; // vig | fire | quake | t | w | h | fwi | burnt
  // FRP filter for the fire layer: keep only clusters whose total Fire
  // Radiative Power says "real blaze", not a warm pixel.
  bool _frpStrong = false;
  double _zoom = 4.6;
  List<_WilayaShape>? _shapes;
  Object? _shapesFrom;

  // Scene cache: polygon/marker lists are rebuilt ONLY when their inputs
  // change — not on every 0.2-zoom setState, which used to reconstruct all 58
  // wilaya polygons + markers per tick and made pan/zoom janky.
  String? _sceneKey;
  List<Polygon> _scenePolys = const [];
  List<CircleMarker> _sceneFires = const [];
  List<CircleMarker> _sceneQuakes = const [];
  List<Marker> _sceneBadges = const [];
  List<Marker> _sceneLabels = const [];
  List<Marker> _sceneTemps = const [];

  void _buildShapes(Map<String, dynamic> geo) {
    if (identical(_shapesFrom, geo)) return;
    final out = <_WilayaShape>[];
    for (final f in (geo['features'] as List).cast<Map<String, dynamic>>()) {
      final props = f['properties'] as Map;
      final g = f['geometry'] as Map<String, dynamic>;
      final polys = g['type'] == 'Polygon'
          ? [g['coordinates']]
          : (g['coordinates'] as List);
      final rings = <List<LatLng>>[];
      List<LatLng>? largest;
      double largestArea = 0;
      for (final poly in polys) {
        final raw = (poly as List)[0] as List;
        final ring = [
          for (final p in raw)
            LatLng((p[1] as num).toDouble(), (p[0] as num).toDouble()),
        ];
        rings.add(ring);
        final a = _ringArea(ring).abs();
        if (a > largestArea) {
          largestArea = a;
          largest = ring;
        }
      }
      final src = props['source'] as String? ?? '';
      out.add(
        _WilayaShape(
          (props['code'] as num).toInt(),
          src.contains('geoBoundaries') || src.contains('approx'),
          src.contains('approx'),
          rings,
          _centroid(largest ?? rings.first),
        ),
      );
    }
    _shapes = out;
    _shapesFrom = geo;
  }

  static double _ringArea(List<LatLng> r) {
    double s = 0;
    for (int i = 0, j = r.length - 1; i < r.length; j = i++) {
      s += (r[j].longitude * r[i].latitude) - (r[i].longitude * r[j].latitude);
    }
    return s / 2;
  }

  /// Area-weighted (shoelace) centroid — always the visual center, unlike bbox.
  static LatLng _centroid(List<LatLng> r) {
    double a = 0, cx = 0, cy = 0;
    for (int i = 0, j = r.length - 1; i < r.length; j = i++) {
      final cross =
          (r[j].longitude * r[i].latitude) - (r[i].longitude * r[j].latitude);
      a += cross;
      cx += (r[j].longitude + r[i].longitude) * cross;
      cy += (r[j].latitude + r[i].latitude) * cross;
    }
    if (a.abs() < 1e-9) return r.first;
    return LatLng(cy / (3 * a), cx / (3 * a));
  }

  static bool _inRing(LatLng p, List<LatLng> ring) {
    var inside = false;
    for (int i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      final a = ring[i], b = ring[j];
      if ((a.latitude > p.latitude) != (b.latitude > p.latitude) &&
          p.longitude <
              (b.longitude - a.longitude) *
                      (p.latitude - a.latitude) /
                      (b.latitude - a.latitude) +
                  a.longitude) {
        inside = !inside;
      }
    }
    return inside;
  }

  int? _hit(LatLng p) {
    final shapes = _shapes!;
    for (final s in shapes.reversed) {
      for (final ring in s.rings) {
        if (_inRing(p, ring)) return s.code;
      }
    }
    int? best;
    double bestD = 2.0; // degrees², generous snap
    for (final s in shapes) {
      final d =
          (s.centroid.latitude - p.latitude) *
              (s.centroid.latitude - p.latitude) +
          (s.centroid.longitude - p.longitude) *
              (s.centroid.longitude - p.longitude);
      if (d < bestD) {
        bestD = d;
        best = s.code;
      }
    }
    return best;
  }

  Color _bucket(String layer, num? v, bool dark) {
    if (v == null) return Colors.grey;
    final int b = switch (layer) {
      't' =>
        v >= 42
            ? 3
            : v >= 35
            ? 2
            : v >= 25
            ? 1
            : 0,
      'w' =>
        v >= 70
            ? 3
            : v >= 50
            ? 2
            : v >= 30
            ? 1
            : 0,
      _ =>
        v < 15
            ? 3
            : v < 30
            ? 2
            : v < 60
            ? 1
            : 0,
    };
    return switch (b) {
      3 => vigilance('red', dark).solid,
      2 => vigilance('orange', dark).solid,
      1 => vigilance('yellow', dark).solid,
      _ => vigilance('green', dark).solid,
    };
  }

  static const _bucketLabels = {
    't': ['<25°', '25–34°', '35–41°', '≥42°'],
    'w': ['<30', '30–49', '50–69', '≥70 km/h'],
    'h': ['≥60%', '30–59%', '15–29%', '<15%'],
  };

  @override
  Widget build(BuildContext context) {
    final st = context.watch<AppState>();
    final lang = st.lang;
    final geo = st.boundaries;
    final snap = st.snapshot;
    final cs = Theme.of(context).colorScheme;
    if (geo == null || snap == null) {
      st.loadBoundaries();
      if (st.sourceStatus == 'offline') {
        return Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(S.t(lang, 'load_fail'), style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant)),
            const SizedBox(height: 10),
            FilledButton.tonalIcon(
              onPressed: () => st.refresh(force: true),
              icon: const Icon(Icons.refresh, size: 18),
              label: Text(S.t(lang, 'retry')),
            ),
          ]),
        );
      }
      return const Center(child: CircularProgressIndicator());
    }
    _buildShapes(geo);
    final shapes = _shapes!;
    final levels = snap.levelByWilaya();
    final vectorLayer =
        _layer == 'vig' || _layer == 't' || _layer == 'w' || _layer == 'h';

    Color fillFor(int code) {
      if (_layer == 'vig') {
        return switch (levels[code] ?? 0) {
          3 => vigilance('red', st.dark).solid,
          2 => vigilance('orange', st.dark).solid,
          1 => vigilance('yellow', st.dark).solid,
          _ => vigilance('green', st.dark).solid,
        };
      }
      final w = st.weather[code];
      return _bucket(
        _layer,
        w?[_layer == 't'
                ? 't'
                : _layer == 'w'
                ? 'wind'
                : 'rh']
            as num?,
        st.dark,
      );
    }

    final sceneKey =
        '${identityHashCode(geo)}:${identityHashCode(snap)}:${identityHashCode(st.weather)}:$_layer:${st.dark}:$_selected:$lang:$_frpStrong';
    if (sceneKey != _sceneKey) {
      _sceneKey = sceneKey;

      _scenePolys = <Polygon>[
        // approx/gb fillers paint borderless & fainter (rough edges), ONM on top.
        for (final s in shapes)
          for (final ring in s.rings)
            Polygon(
              points: ring,
              color: vectorLayer
                  ? fillFor(s.code).withValues(alpha: (s.gb || s.approx) ? .28 : .45)
                  : Colors.transparent,
              borderColor: s.code == _selected
                  ? cs.onSurface
                  : (s.gb || s.approx)
                  ? Colors.transparent
                  : (st.dark
                        ? Colors.black.withValues(alpha: .5)
                        : Colors.white.withValues(alpha: .95)),
              borderStrokeWidth: s.code == _selected ? 3 : ((s.gb || s.approx) ? 0 : 1.2),
            ),
      ];

      _sceneFires = <CircleMarker>[
        if (_layer == 'vig' || _layer == 'fire')
          for (final i in snap.incidents)
            // wilayas.isNotEmpty filters out real fires beyond our borders
            // (the FIRMS bbox overlaps Tunisia/Libya) — they're not ours to map.
            if (i.source == 'firms' &&
                !i.possibleIndustrial &&
                i.wilayas.isNotEmpty &&
                i.lat != null &&
                i.lon != null &&
                // "Feux intenses": total FRP >= 50 MW — the incendieencours.fr
                // pattern for separating real blazes from warm pixels.
                (!_frpStrong || _layer != 'fire' || (i.totalFrp ?? 0) >= 50))
              CircleMarker(
                point: LatLng(i.lat!, i.lon!),
                radius: (3 + i.detections * .3).clamp(3, 10).toDouble(),
                color: vigilance(
                  'red',
                  st.dark,
                ).solid.withValues(alpha: i.corroborated ? .95 : .55),
                borderColor: Colors.white,
                borderStrokeWidth: .6,
              ),
      ];

      _sceneQuakes = <CircleMarker>[
        if (_layer == 'vig' || _layer == 'quake')
          for (final q in snap.incidents)
            if (q.hazard == 'quake' && q.lat != null && q.lon != null)
              CircleMarker(
                point: LatLng(q.lat!, q.lon!),
                radius: (4 + (q.mag ?? 3) * 1.6).clamp(6, 16).toDouble(),
                color: Colors.deepPurple.withValues(alpha: .8),
                borderColor: Colors.white,
                borderStrokeWidth: 1,
              ),
      ];

      final pcOngoing = snap.incidents
          .where((i) => i.source == 'dgpc-telegram' && i.status == 'ongoing')
          .expand((i) => i.wilayas.map((w) => w.code))
          .toSet();
      // Anchor each wilaya's fire badge to its strongest satellite cluster
      // (the actual fire front); centroid only as fallback.
      final bestFire = <int, LatLng>{};
      final bestDet = <int, int>{};
      for (final i in snap.incidents) {
        if (i.source != 'firms' ||
            i.possibleIndustrial ||
            i.lat == null ||
            i.lon == null) {
          continue;
        }
        for (final w in i.wilayas) {
          if (i.detections > (bestDet[w.code] ?? 0)) {
            bestDet[w.code] = i.detections;
            bestFire[w.code] = LatLng(i.lat!, i.lon!);
          }
        }
      }
      _sceneBadges = <Marker>[
        if (_layer == 'vig' || _layer == 'fire')
          for (final s in shapes)
            if (pcOngoing.contains(s.code) && !s.gb)
              Marker(
                point: bestFire[s.code] ?? s.centroid,
                width: 26,
                height: 26,
                child: Container(
                  decoration: BoxDecoration(
                    color: vigilance('orange', st.dark).container,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: vigilance('orange', st.dark).solid,
                      width: 2,
                    ),
                  ),
                  child: Icon(
                    Icons.local_fire_department,
                    size: 15,
                    color: vigilance('orange', st.dark).onContainer,
                  ),
                ),
              ),
      ];

      _sceneLabels = <Marker>[
        for (final s in shapes)
          if (!s.gb)
            Marker(
              point: s.centroid,
              width: 110,
              height: 18,
              child: IgnorePointer(
                child: Text(
                  st.wilayaName(s.code),
                  textAlign: TextAlign.center,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    fontSize: 10.5,
                    fontWeight: FontWeight.w700,
                    color: cs.onSurface,
                    shadows: [
                      Shadow(color: cs.surface, blurRadius: 3),
                      Shadow(color: cs.surface, blurRadius: 6),
                    ],
                  ),
                ),
              ),
            ),
      ];

      _sceneTemps = <Marker>[
        if (_layer == 't')
          for (final s in shapes)
            if (!s.gb && st.weather[s.code]?['t'] != null)
              Marker(
                point: s.centroid,
                width: 46,
                height: 20,
                child: IgnorePointer(
                  child: Container(
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: cs.surface.withValues(alpha: .78),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${(st.weather[s.code]!['t'] as num).round()}°',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: cs.onSurface),
                    ),
                  ),
                ),
              ),
      ];
    }
    final polygons = _scenePolys;
    final fireDots = _sceneFires;
    final quakeDots = _sceneQuakes;
    final badges = _sceneBadges;

    // Open the map focused on the user's wilaya (their GPS wilaya, else first
    // subscribed) instead of the whole country.
    final focusCode = st.hereWilaya ?? (st.myWilayas.isNotEmpty ? st.myWilayas.first : null);
    _WilayaShape? focusShape;
    if (focusCode != null) {
      for (final s in shapes) {
        if (s.code == focusCode) {
          focusShape = s;
          break;
        }
      }
    }
    final initCenter = focusShape?.centroid ?? const LatLng(31.5, 2.5);
    final initZoom = focusShape != null ? 6.8 : 4.6;

    final map = ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: SizedBox(
        height: 430,
        child: Directionality(
          textDirection: TextDirection.ltr,
          child: FlutterMap(
            options: MapOptions(
              initialCenter: initCenter,
              initialZoom: initZoom,
              minZoom: 4,
              maxZoom: 12,
              interactionOptions: const InteractionOptions(
                flags: InteractiveFlag.all & ~InteractiveFlag.rotate,
              ),
              onPositionChanged: (pos, _) {
                if ((pos.zoom - _zoom).abs() > .2) {
                  setState(() => _zoom = pos.zoom);
                }
              },
              onTap: (_, latlng) {
                // Tap a fire/quake dot first (small target); else the wilaya.
                final inc = _nearestIncident(latlng, snap);
                if (inc != null) {
                  _showIncidentPopup(inc);
                  return;
                }
                final code = _hit(latlng);
                setState(() => _selected = code);
                if (code != null) _showWilayaPopup(code);
              },
            ),
            children: [
              TileLayer(
                // CARTO raster basemaps now stamp an "API key required"
                // watermark on keyless tiles (since 2026-08); keys are
                // per-customer, so none can ship inside a public APK (and
                // no secrets live in git). ESRI Canvas gray is keyless and
                // keeps the same muted palette so hazard polygons dominate.
                // Note the {z}/{y}/{x} order — ESRI is not XYZ.
                urlTemplate:
                    'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${st.dark ? 'Dark' : 'Light'}_Gray_Base/MapServer/tile/{z}/{y}/{x}',
                userAgentPackageName: 'dz.radbalek.rad_balek',
              ),
              if (_layer == 'fwi' || _layer == 'burnt')
                OverlayImageLayer(
                  overlayImages: [
                    OverlayImage(
                      bounds: LatLngBounds(
                        const LatLng(18.9, -8.7),
                        const LatLng(37.3, 12.0),
                      ),
                      // Burnt scars are sparse dark patches — keep them opaque
                      // enough to spot; the FWI raster is a full-cover wash.
                      opacity: _layer == 'burnt' ? .8 : .62,
                      imageProvider: NetworkImage(
                        '${Api.base}/v1/${_layer == 'burnt' ? 'burnt' : 'fwi'}.png',
                      ),
                    ),
                  ],
                ),
              // simplificationTolerance 0: the default simplifier warps dense
              // wilaya polygons into displaced shards at country-level zoom.
              PolygonLayer(polygons: polygons, simplificationTolerance: 0),
              CircleLayer(circles: fireDots),
              CircleLayer(circles: quakeDots),
              MarkerLayer(markers: badges),
              // Wilaya labels appear once zoomed in enough to read them
              // (cached — only the visibility toggles with zoom).
              if (_zoom >= 6.0) MarkerLayer(markers: _sceneLabels),
              // Temperature values shown directly on the map (Chaleur layer).
              if (_layer == 't') MarkerLayer(markers: _sceneTemps),
              RichAttributionWidget(
                attributions: [
                  TextSourceAttribution(
                    'Esri · HERE · Garmin',
                    onTap: () {},
                  ),
                  TextSourceAttribution(
                    'ONM CC BY 4.0 · NASA FIRMS',
                    onTap: () {},
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );

    final layerChips = Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Wrap(
        spacing: 7,
        runSpacing: 6,
        children: [
          // Real-time hazard toggles first, then contextual layers.
          for (final (id, label) in [
            ('vig', S.t(lang, 'layer_vig')),
            ('fire', '🔥 ${S.t(lang, 'rt_fire')}'),
            ('quake', '🌋 ${S.t(lang, 'rt_quake')}'),
            ('t', '🌡️ ${S.t(lang, 'rt_heat')}'),
          ])
            ChoiceChip(
              label: Text(label, style: const TextStyle(fontSize: 12)),
              selected: _layer == id,
              onSelected: (_) => setState(() => _layer = id),
            ),
          for (final (id, key) in const [
            ('w', 'layer_w'),
            ('h', 'layer_h'),
          ])
            ChoiceChip(
              label: Text(S.t(lang, key), style: const TextStyle(fontSize: 12)),
              selected: _layer == id,
              onSelected: (_) => setState(() => _layer = id),
            ),
          ChoiceChip(
            label: Text('🔥 ${S.t(lang, 'rt_fwi')}', style: const TextStyle(fontSize: 12)),
            selected: _layer == 'fwi',
            onSelected: (_) => setState(() => _layer = 'fwi'),
          ),
          // EFFIS burnt-areas raster: what already burned this season.
          ChoiceChip(
            label: Text('🩹 ${S.t(lang, 'burnt')}', style: const TextStyle(fontSize: 12)),
            selected: _layer == 'burnt',
            onSelected: (_) => setState(() => _layer = 'burnt'),
          ),
          // FRP filter (incendieencours.fr-style): only strong fires. Shown
          // only while the fire layer is active; filters the satellite dots by
          // total Fire Radiative Power.
          if (_layer == 'fire')
            FilterChip(
              label: Text('⚡ ${S.t(lang, 'frp_strong')}', style: const TextStyle(fontSize: 12)),
              selected: _frpStrong,
              onSelected: (v) => setState(() => _frpStrong = v),
            ),
        ],
      ),
    );

    final legend = Padding(
      padding: const EdgeInsets.fromLTRB(4, 10, 4, 0),
      child: Wrap(
        spacing: 12,
        runSpacing: 6,
        children: _layer == 'fire'
            ? [
                _leg(vigilance('red', st.dark).solid, S.t(lang, 'lg_sat'), round: true),
                _leg(vigilance('orange', st.dark).solid, S.t(lang, 'lg_pc'), round: true),
              ]
            : _layer == 'quake'
            ? [_leg(Colors.deepPurple, S.t(lang, 'quake'), round: true)]
            : _layer == 'vig'
            ? [
                _leg(vigilance('red', st.dark).solid, S.t(lang, 'red')),
                _leg(vigilance('orange', st.dark).solid, S.t(lang, 'orange')),
                _leg(vigilance('yellow', st.dark).solid, S.t(lang, 'yellow')),
                _leg(vigilance('green', st.dark).solid, S.t(lang, 'lg_no')),
                _leg(
                  vigilance('red', st.dark).solid,
                  S.t(lang, 'lg_sat'),
                  round: true,
                ),
              ]
            : (_bucketLabels.containsKey(_layer)
                  ? [
                      _leg(
                        vigilance('green', st.dark).solid,
                        _bucketLabels[_layer]![0],
                      ),
                      _leg(
                        vigilance('yellow', st.dark).solid,
                        _bucketLabels[_layer]![1],
                      ),
                      _leg(
                        vigilance('orange', st.dark).solid,
                        _bucketLabels[_layer]![2],
                      ),
                      _leg(
                        vigilance('red', st.dark).solid,
                        _bucketLabels[_layer]![3],
                      ),
                    ]
                  : [
                      Text(
                        'EFFIS Fire Weather Index — Copernicus',
                        style: TextStyle(
                          fontSize: 11,
                          color: cs.onSurfaceVariant,
                        ),
                      ),
                    ]),
      ),
    );

    final head = Text(
      S.t(lang, 'map_title'),
      style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w700),
    );
    return Center(
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 900),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            head,
            const SizedBox(height: 8),
            layerChips,
            map,
            legend,
            Padding(
              padding: const EdgeInsets.fromLTRB(4, 10, 4, 0),
              child: Text(
                S.t(lang, 'tap_hint'),
                style: TextStyle(fontSize: 11.5, color: cs.onSurfaceVariant),
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Nearest tappable fire/quake dot to the tap, within a small radius.
  Incident? _nearestIncident(LatLng p, Snapshot snap) {
    Incident? best;
    double bestD = 0.18 * 0.18; // ~20km tap tolerance
    for (final i in snap.incidents) {
      final isFire = i.source == 'firms' && !i.possibleIndustrial && i.wilayas.isNotEmpty;
      final isQuake = i.hazard == 'quake';
      if ((!isFire && !isQuake) || i.lat == null || i.lon == null) continue;
      if (_layer == 'quake' && !isQuake) continue;
      if (_layer == 'fire' && !isFire) continue;
      if (_layer != 'vig' && _layer != 'fire' && _layer != 'quake') continue;
      final d = (i.lat! - p.latitude) * (i.lat! - p.latitude) + (i.lon! - p.longitude) * (i.lon! - p.longitude);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  /// One detail row: leading icon + text (optionally colored for emphasis).
  Widget _kv(BuildContext ctx, IconData icon, String text, {Color? color}) {
    final cs = Theme.of(ctx).colorScheme;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(icon, size: 17, color: color ?? cs.onSurfaceVariant),
        const SizedBox(width: 10),
        Expanded(
          child: Text(text, style: TextStyle(fontSize: 13.5, height: 1.3, color: color ?? cs.onSurface)),
        ),
      ]),
    );
  }

  /// Localized "il y a 2 h" / "2 h ago" / "منذ ساعتين" style relative age.
  String _relTime(DateTime d, String lang) {
    final diff = DateTime.now().difference(d);
    if (diff.isNegative || diff.inMinutes < 1) {
      return switch (lang) { 'ar' => 'الآن', 'en' => 'just now', _ => "à l'instant" };
    }
    final int n;
    final String unit;
    if (diff.inMinutes < 60) {
      n = diff.inMinutes;
      unit = switch (lang) { 'ar' => 'د', _ => 'min' };
    } else if (diff.inHours < 24) {
      n = diff.inHours;
      unit = switch (lang) { 'ar' => 'س', _ => 'h' };
    } else {
      n = diff.inDays;
      unit = switch (lang) { 'ar' => 'ي', 'en' => 'd', _ => 'j' };
    }
    return switch (lang) { 'ar' => 'منذ $n $unit', 'en' => '$n $unit ago', _ => 'il y a $n $unit' };
  }

  /// Qualitative band for a cluster's summed fire radiative power (MW).
  String _frpBand(double frp, String lang) => S.t(
        lang,
        frp < 50
            ? 'fi_low'
            : frp < 300
                ? 'fi_mod'
                : frp < 1000
                    ? 'fi_high'
                    : 'fi_ext',
      );

  void _showIncidentPopup(Incident i) {
    final st = context.read<AppState>();
    final lang = st.lang;
    final isQuake = i.hazard == 'quake';
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) {
        final cs = Theme.of(ctx).colorScheme;
        final v = vigilance(isQuake ? 'red' : 'orange', st.dark);
        final d = DateTime.tryParse(i.observedAt ?? '')?.toLocal();
        final stamp = d == null
            ? ''
            : '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')} · '
                '${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')} · ${_relTime(d, lang)}';
        return SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(22, 4, 22, 24),
            child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Icon(isQuake ? Icons.vibration : Icons.local_fire_department, color: v.solid, size: 26),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    isQuake ? '${S.t(lang, 'quake')} M${i.mag ?? '?'}' : S.t(lang, 'sat'),
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
                  ),
                ),
              ]),
              const SizedBox(height: 10),
              _kv(ctx, Icons.place_outlined,
                  '${wLabel(st, i.wilayas)}${i.commune != null ? ' · ${i.commune}' : ''}'),
              if (stamp.isNotEmpty) _kv(ctx, Icons.schedule, '${S.t(lang, 'detected')} · $stamp'),
              if (i.stale)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: _kv(ctx, Icons.history_toggle_off, S.t(lang, 'stale_fire'),
                      color: vigilance('orange', st.dark).solid),
                ),
              if (isQuake) ...[
                _kv(ctx, Icons.public, '${S.t(lang, 'source')}: EMSC · M${i.mag ?? '?'}'),
                if (i.lat != null && i.lon != null)
                  _kv(ctx, Icons.my_location, '${i.lat!.toStringAsFixed(3)}, ${i.lon!.toStringAsFixed(3)}'),
                const SizedBox(height: 10),
                Text(S.t(lang, 'aid_quake'), style: TextStyle(fontSize: 13, height: 1.4, color: cs.onSurfaceVariant)),
              ] else ...[
                _kv(ctx, Icons.satellite_alt_outlined, '${i.detections} ${S.t(lang, 'det')} · NASA FIRMS'),
                _kv(
                  ctx,
                  i.corroborated ? Icons.verified_outlined : Icons.help_outline,
                  i.corroborated ? '${S.t(lang, 'corr_pc')} ✓' : S.t(lang, 'not_corr'),
                  color: i.corroborated ? vigilance('green', st.dark).solid : cs.onSurfaceVariant,
                ),
                if (i.totalFrp != null)
                  _kv(ctx, Icons.whatshot_outlined,
                      '${S.t(lang, 'intensity')} · ≈${i.totalFrp!.round()} MW · ${_frpBand(i.totalFrp!, lang)}'),
                if (i.frpTrend != null)
                  _kv(
                    ctx,
                    i.frpTrend == 'rising'
                        ? Icons.trending_up
                        : (i.frpTrend == 'declining' ? Icons.trending_down : Icons.trending_flat),
                    '${S.t(lang, 'fire_trend_${i.frpTrend}')} · ${i.passes} ${S.t(lang, 'det')}',
                    color: i.frpTrend == 'rising' ? vigilance('orange', st.dark).solid : cs.onSurfaceVariant,
                  ),
                if (i.lat != null && i.lon != null)
                  _kv(ctx, Icons.my_location, '${i.lat!.toStringAsFixed(3)}, ${i.lon!.toStringAsFixed(3)}'),
                const SizedBox(height: 12),
                Text(S.t(lang, 'fire_safety'), style: TextStyle(fontSize: 13, height: 1.4, color: cs.onSurfaceVariant)),
                const SizedBox(height: 12),
                FilledButton.icon(
                  style: FilledButton.styleFrom(backgroundColor: v.container, foregroundColor: v.onContainer),
                  onPressed: () => launchUrl(Uri.parse('tel:14')),
                  icon: const Icon(Icons.call),
                  label: Text(S.t(lang, 'call')),
                ),
              ],
            ]),
          ),
        );
      },
    );
  }

  void _showWilayaPopup(int code) {
    final st = context.read<AppState>();
    final snap = st.snapshot;
    if (snap == null) return;
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.5,
        maxChildSize: 0.85,
        builder: (ctx, ctl) => ListView(
          controller: ctl,
          padding: const EdgeInsets.fromLTRB(22, 4, 22, 26),
          children: [
            Text(
              st.wilayaName(code),
              style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 8),
            _wilayaInfo(ctx, st, snap, code),
          ],
        ),
      ),
    );
  }

  // Rule-based 48h heat trend from the worker (no ML): peak feels-like + arrow.
  Widget _forecastTile(BuildContext context, AppState st, Map f) {
    final lang = st.lang;
    // Missing forecast must NOT paint green "risque faible" — hide the tile.
    final risk = f['risk'] as String?;
    if (risk == null || f['peak48'] == null) return const SizedBox.shrink();
    final v = vigilance(
        risk == 'extreme' ? 'red' : risk == 'high' ? 'orange' : risk == 'moderate' ? 'yellow' : 'green', st.dark);
    final trend = f['trend'] as String? ?? 'flat';
    final arrow = trend == 'up' ? '↑' : trend == 'down' ? '↓' : '→';
    return ListTile(
      dense: true,
      leading: Icon(Icons.trending_up, color: v.solid),
      title: Text('${S.t(lang, 'fc48')}: $arrow ${f['peak48']}° · ${S.t(lang, 'risk_$risk')}',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: v.solid)),
    );
  }

  // Air quality (European AQI) from Open-Meteo — banded to our color scale.
  Widget _airTile(BuildContext context, AppState st, Map aq) {
    final lang = st.lang;
    // Missing AQ must NOT paint green "Bonne" — hide the tile.
    final band = aq['band'] as String?;
    if (band == null || aq['aqi'] == null) return const SizedBox.shrink();
    final v = vigilance(
        band == 'veryPoor' ? 'red' : band == 'poor' ? 'orange' : band == 'moderate' ? 'yellow' : 'green', st.dark);
    return ListTile(
      dense: true,
      leading: Icon(Icons.air, color: v.solid),
      title: Text('${S.t(lang, 'air')}: ${S.t(lang, 'aq_$band')} (AQI ${aq['aqi']}) · PM2.5 ${aq['pm25']}',
          style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: v.solid)),
    );
  }

  Widget _leg(Color c, String label, {bool round = false}) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: c,
            borderRadius: BorderRadius.circular(round ? 99 : 4),
          ),
        ),
        const SizedBox(width: 5),
        Text(label, style: const TextStyle(fontSize: 11.5)),
      ],
    );
  }

  Widget _wilayaInfo(
    BuildContext context,
    AppState st,
    Snapshot snap,
    int code,
  ) {
    final lang = st.lang;
    final cs = Theme.of(context).colorScheme;
    final alerts = snap.alerts
        .where((a) => a.wilayas.any((w) => w.code == code))
        .toList();
    final fires = snap.incidents
        .where(
          (i) =>
              i.source == 'dgpc-telegram' &&
              i.hazard == 'fire' &&
              i.status == 'ongoing' &&
              i.wilayas.any((w) => w.code == code),
        )
        .toList();
    final sats = snap.incidents
        .where(
          (i) =>
              i.source == 'firms' &&
              !i.possibleIndustrial &&
              i.wilayas.any((w) => w.code == code),
        )
        .toList();
    final inMy = st.myWilayas.contains(code);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (st.weather[code] != null && wxLine(st.weather[code]!).isNotEmpty)
          ListTile(
            dense: true,
            leading: Icon(Icons.thermostat, color: cs.onSurfaceVariant),
            title: Text(wxLine(st.weather[code]!), style: const TextStyle(fontSize: 13)),
          ),
        if (st.weather[code]?['f'] != null)
          _forecastTile(context, st, st.weather[code]!['f'] as Map),
        if (st.weather[code]?['aq'] != null)
          _airTile(context, st, st.weather[code]!['aq'] as Map),
        if (alerts.isEmpty)
          ListTile(
            leading: Icon(
              Icons.check_circle_outline,
              color: vigilance('green', st.dark).solid,
            ),
            title: Text(S.t(lang, 'no_alert')),
          ),
        for (final a in alerts)
          Card.filled(
            margin: const EdgeInsets.only(bottom: 8),
            color: cs.surfaceContainerLow,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            child: ListTile(
              onTap: () => showAlertSheet(context, st, a),
              leading: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: vigilance(a.color, st.dark).container,
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(
                  hazardIcon(a.hazard),
                  size: 20,
                  color: vigilance(a.color, st.dark).onContainer,
                ),
              ),
              title: Text(
                '${S.t(lang, a.hazard)} — ${S.t(lang, a.color)}',
                style: const TextStyle(
                  fontSize: 13.5,
                  fontWeight: FontWeight.w600,
                ),
              ),
              subtitle: Text(
                span(a.onset, a.expires),
                style: const TextStyle(fontSize: 12),
              ),
            ),
          ),
        for (final f in fires)
          ListTile(
            dense: true,
            leading: Icon(
              Icons.local_fire_department_outlined,
              color: vigilance('orange', st.dark).solid,
            ),
            title: Text(
              '${S.t(lang, 'fire')} — ${S.t(lang, 'ongoing')}',
              style: const TextStyle(fontSize: 13),
            ),
            subtitle: f.commune == null
                ? null
                : Text(f.commune!, style: const TextStyle(fontSize: 12)),
          ),
        if (sats.isNotEmpty)
          ListTile(
            dense: true,
            leading: Icon(
              Icons.satellite_alt_outlined,
              color: cs.onSurfaceVariant,
            ),
            title: Text(
              '${S.t(lang, 'sat')} · ${sats.length}',
              style: const TextStyle(fontSize: 13),
            ),
          ),
        const SizedBox(height: 8),
        FilledButton.tonal(
          onPressed: () => st.toggleWilaya(code),
          child: Text(inMy ? S.t(lang, 'rm_my') : S.t(lang, 'add_my')),
        ),
      ],
    );
  }
}
