// Earthquakes over Algeria, last 14 days, M>=3.
// EMSC primary (faster/denser for the Mediterranean), USGS fallback. Both free.
import { wilayasWithinKm } from "./geo.js";

const BOX = "minlatitude=18.9&maxlatitude=37.5&minlongitude=-8.7&maxlongitude=12&minmagnitude=3";

export async function fetchQuakes(fetchFn = fetch) {
  const start = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  try {
    return await fromEmsc(fetchFn, start);
  } catch {
    return await fromUsgs(fetchFn, start);
  }
}

export function haversineKm(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const rLat1 = toRad(lat1), rLon1 = toRad(lon1), rLat2 = toRad(lat2), rLon2 = toRad(lon2);
  const dLat = rLat2 - rLat1, dLon = rLon2 - rLon1;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
}

// Rough felt radius (km). This is intentionally conservative: it defines where
// a useful seconds-level S-wave estimate may still exist, not where the quake
// is officially felt.
export function feltRadiusKm(mag) {
  if (!Number.isFinite(mag)) return 0;
  return Math.max(20, Math.min(300, 10 ** (0.5 * mag - 0.8)));
}

export function detectEew(quake, now = () => new Date(), wilayasGeojson = null, opts = {}) {
  /**
   * Honest seconds-level earthquake warning.
   *
   * This is not a pre-event EEW: EMSC/USGS publish after the P-wave has already
   * been detected. The useful product is an S-wave arrival estimate for wilayas
   * far enough from the epicentre that the damaging wave has not arrived yet.
   *
   * Returns:
   *   { eew: false }
   * or
   *   {
   *     eew: true,
   *     targets: [{ code, fr, ar, distanceKm, leadSeconds, warningSeconds,
   *                 pWaveSeconds, sWaveSeconds }],
   *     warningSeconds, pWaveSeconds, sWaveSeconds, distanceKm, leadSeconds, mag
   *   }
   *
   * `warningSeconds` / `leadSeconds` are REMAINING seconds until estimated
   * S-wave arrival, already corrected for the event's origin age.
   */
  const {
    radiusKm = feltRadiusKm(quake.mag),
    cap = 8,
    pWaveKmS = 6,
    sWaveKmS = 3.5,
    maxLeadSeconds = 120,
  } = opts;

  if (!quake?.mag || quake.mag < 4.5) return { eew: false };
  if (!Number.isFinite(quake.lat) || !Number.isFinite(quake.lon)) return { eew: false };

  const originMs = Date.parse(quake.time);
  if (!Number.isFinite(originMs)) return { eew: false };

  const ageSec = Math.max(0, (now().getTime() - originMs) / 1000);
  if (ageSec > 600) return { eew: false };
  let candidates = [];
  if (wilayasGeojson?.features?.length) {
    // Consider every wilaya inside the felt radius first, then filter by
    // positive lead and cap. Capping before the lead filter would discard the
    // farther wilayas that are the only ones still ahead of the S-wave.
    candidates = wilayasWithinKm(wilayasGeojson, quake.lat, quake.lon, radiusKm, 58);
  } else {
    // Unit-test / degraded fallback: no polygon targeting, approximate distance
    // to the northern Algeria centroid. Pipeline always supplies geojson.
    const distanceKm = Math.round(haversineKm(quake.lat, quake.lon, 36, 3));
    if (distanceKm <= radiusKm) {
      candidates = [{ code: null, fr: "Algérie", ar: "الجزائر", distanceKm }];
    }
  }

  const minLeadSeconds = quake.mag < 5 ? 5 : 1;
  const targets = [];
  for (const c of candidates) {
    const pTravelSeconds = c.distanceKm / pWaveKmS;
    const sTravelSeconds = c.distanceKm / sWaveKmS;
    const leadSeconds = sTravelSeconds - ageSec;
    if (leadSeconds < minLeadSeconds || leadSeconds > maxLeadSeconds) continue;

    const pLeadSeconds = Math.max(0, Math.round(pTravelSeconds - ageSec));
    const sLeadSeconds = Math.max(0, Math.round(leadSeconds));
    targets.push({
      ...c,
      leadSeconds: Math.round(leadSeconds * 10) / 10,
      warningSeconds: sLeadSeconds,
      pWaveSeconds: pLeadSeconds,
      sWaveSeconds: sLeadSeconds,
    });
  }

  if (!targets.length) return { eew: false };
  targets.sort((a, b) => a.leadSeconds - b.leadSeconds);
  const capped = targets.slice(0, cap);
  const first = capped[0];

  return {
    eew: true,
    targets: capped,
    warningSeconds: first.warningSeconds,
    pWaveSeconds: first.pWaveSeconds,
    sWaveSeconds: first.sWaveSeconds,
    distanceKm: first.distanceKm,
    leadSeconds: first.leadSeconds,
    mag: quake.mag,
  };
}

async function fromEmsc(fetchFn, start) {
  const res = await fetchFn(
    `https://www.seismicportal.eu/fdsnws/event/1/query?format=json&starttime=${start}&${BOX}&limit=100`,
    { headers: { "user-agent": "radbalek/0.2" } }
  );
  if (res.status === 204) return []; // EMSC: no content = no events
  if (!res.ok) throw new Error(`EMSC HTTP ${res.status}`);
  const j = await res.json();
  return (j.features || []).map((f) => ({
    id: `emsc:${f.id}`,
    mag: f.properties.mag,
    time: f.properties.time,
    depth: f.properties.depth,
    lat: f.properties.lat,
    lon: f.properties.lon,
    place: f.properties.flynn_region,
  }));
}

async function fromUsgs(fetchFn, start) {
  const res = await fetchFn(
    `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start}&${BOX}&orderby=time`,
    { headers: { "user-agent": "radbalek/0.2" } }
  );
  if (!res.ok) throw new Error(`USGS HTTP ${res.status}`);
  const j = await res.json();
  return (j.features || []).map((f) => ({
    id: `usgs:${f.id}`,
    mag: f.properties.mag,
    time: new Date(f.properties.time).toISOString(),
    depth: f.geometry.coordinates[2],
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
    place: f.properties.place,
  }));
}
