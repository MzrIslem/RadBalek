// Point-in-polygon wilaya resolution.
// Boundaries come from ONM's own CAP files (CC BY 4.0) via
// scripts/harvest-polygons.js -> data/wilayas.geojson.

export function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

export function makeWilayaResolver(geojson) {
  if (!geojson) return () => null;
  const features = geojson.features.map((f) => {
    const rings = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
    for (const poly of rings)
      for (const [lon, lat] of poly[0]) {
        if (lon < minLon) minLon = lon;
        if (lat < minLat) minLat = lat;
        if (lon > maxLon) maxLon = lon;
        if (lat > maxLat) maxLat = lat;
      }
    return { props: f.properties, rings, bbox: [minLon, minLat, maxLon, maxLat] };
  });
  return function resolve(lat, lon) {
    for (const f of features) {
      const [w, s, e, n] = f.bbox;
      if (lon < w || lon > e || lat < s || lat > n) continue;
      for (const poly of f.rings) if (pointInRing(lon, lat, poly[0])) return f.props;
    }
    // fallback: nearest bbox center among candidates within ~0.5 deg
    let best = null;
    let bestD = 0.5 * 0.5;
    for (const f of features) {
      const cx = (f.bbox[0] + f.bbox[2]) / 2;
      const cy = (f.bbox[1] + f.bbox[3]) / 2;
      const d = (cx - lon) ** 2 + (cy - lat) ** 2;
      if (d < bestD) {
        bestD = d;
        best = f.props;
      }
    }
    return best;
  };
}

// Oil/gas basins where FIRMS persistently detects flares, not wildfires
// (Hassi Messaoud/Berkine, Hassi R'Mel, In Amenas/Illizi, Sbaa/Adrar).
const FLARE_ZONES = [
  { w: 5.0, s: 29.5, e: 9.5, n: 32.5 },
  { w: 2.7, s: 32.3, e: 4.3, n: 33.4 },
  { w: 8.0, s: 27.0, e: 10.2, n: 29.5 },
  { w: -1.2, s: 27.5, e: 0.6, n: 29.2 },
];

export function inFlareZone(lat, lon) {
  return FLARE_ZONES.some((z) => lon >= z.w && lon <= z.e && lat >= z.s && lat <= z.n);
}

// Cluster nearby hotspots (~grid cells of `cellDeg`) into fire events so one
// fire front doesn't create dozens of pins/notifications.
export function clusterHotspots(hotspots, cellDeg = 0.05) {
  const cells = new Map();
  for (const h of hotspots) {
    const key = `${Math.round(h.lat / cellDeg)}:${Math.round(h.lon / cellDeg)}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(h);
  }
  return [...cells.values()].map((group) => {
    const lat = group.reduce((s, h) => s + h.lat, 0) / group.length;
    const lon = group.reduce((s, h) => s + h.lon, 0) / group.length;
    const frp = group.reduce((s, h) => s + (h.frp || 0), 0);
    const latest = group.map((h) => h.observedAt).sort().at(-1);
    return { lat, lon, count: group.length, totalFrp: Math.round(frp * 10) / 10, latestObservedAt: latest };
  });
}
