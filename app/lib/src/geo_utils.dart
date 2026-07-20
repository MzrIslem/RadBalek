/// Resolves a lat/lon to a wilaya code using the bundled ONM boundaries
/// GeoJSON (same data the map draws). Returns null outside known polygons.
int? wilayaAt(Map<String, dynamic> geojson, double lat, double lon) {
  for (final f in (geojson['features'] as List).cast<Map<String, dynamic>>()) {
    final g = f['geometry'] as Map<String, dynamic>;
    final rings = g['type'] == 'Polygon' ? [g['coordinates']] : (g['coordinates'] as List);
    for (final poly in rings) {
      final ring = (poly as List)[0] as List;
      if (_inRing(lat, lon, ring)) return ((f['properties'] as Map)['code'] as num).toInt();
    }
  }
  return null;
}

bool _inRing(double lat, double lon, List ring) {
  var inside = false;
  for (int i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    final a = ring[i] as List, b = ring[j] as List;
    final ax = (a[0] as num).toDouble(), ay = (a[1] as num).toDouble();
    final bx = (b[0] as num).toDouble(), by = (b[1] as num).toDouble();
    if ((ay > lat) != (by > lat) && lon < (bx - ax) * (lat - ay) / (by - ay) + ax) inside = !inside;
  }
  return inside;
}
