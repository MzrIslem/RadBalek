// NASA FIRMS active-fire hotspots (VIIRS 375m + MODIS 1km) over Algeria.
// Free MAP_KEY: https://firms.modaps.eosdis.nasa.gov/api/map_key/
// Quota: 5000 transactions / 10 min. NRT latency for Algeria ~1-3h per overpass.
// S-NPP VIIRS was dropped 2026-09: NASA/NESDIS ends ALL S-NPP product delivery
// on 2026-11-01 (satellite retired); NOAA-20/21 VIIRS + MODIS carry coverage.

const DZ_BBOX = "-8.7,18.9,12.0,37.3"; // west,south,east,north

export const FIRMS_SOURCES = ["VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT", "MODIS_NRT"];

// FIRMS `day_range` counts back from the CURRENT UTC date, not from the latest
// date that actually has data. NRT for "today" only appears a few hours into
// the UTC day, so `day_range=1` returns an EMPTY CSV (HTTP 200, header only)
// from 00:00 UTC until FIRMS catches up — verified against production history:
// the fire map went to zero for 3-5h every single night for 7 nights straight
// in peak fire season (28 of 168 hourly samples, always 00:00-04:00 UTC).
// So we always ask for 2 days and clip to a rolling window ourselves. That also
// makes the displayed window CONSTANT (~24h) instead of "however much of the
// UTC day has elapsed", which is what day_range=1 really meant.
export const FIRMS_DAY_RANGE = 2;
export const FIRMS_MAX_AGE_HOURS = 24;

export async function fetchFirmsHotspots(
  mapKey,
  { days = FIRMS_DAY_RANGE, sources = FIRMS_SOURCES, fetchFn = fetch, maxAgeHours = FIRMS_MAX_AGE_HOURS, now = () => new Date() } = {}
) {
  if (!mapKey) return { skipped: true, reason: "FIRMS_MAP_KEY not set", hotspots: [] };
  mapKey = String(mapKey).trim(); // secrets piped via shell can carry a stray \r\n
  // Fetch all satellite sources CONCURRENTLY. They used to run in a sequential
  // loop — 4 round-trips to FIRMS could not finish inside the pipeline's timeout
  // (the "firms timeout 9000ms" that left the fire map permanently blank in
  // fire season). allSettled so one slow/failed sensor never loses the others.
  const results = await Promise.allSettled(
    sources.map(async (src) => {
      const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${src}/${DZ_BBOX}/${days}`;
      // Per-source abort: FIRMS NRT can hang 15-25s on one sensor. Bounding each
      // fetch means one slow satellite can't drag the whole parallel batch past
      // the pipeline budget — the sensors that answer in time still deliver.
      const res = await fetchFn(url, {
        headers: { "user-agent": "aisx-ews/0.1 (+ingest)", accept: "text/csv,*/*" },
        signal: AbortSignal.timeout(18000),
      });
      if (!res.ok) throw new Error(`FIRMS ${src} HTTP ${res.status}`);
      return parseFirmsCsv(await res.text(), src);
    })
  );
  const all = [];
  const errors = [];
  for (const r of results) {
    if (r.status === "fulfilled") all.push(...r.value);
    else errors.push(String(r.reason && r.reason.message ? r.reason.message : r.reason));
  }
  // Only a TOTAL wipeout is "skipped" — partial sensor coverage is still useful
  // fire data and must reach the map.
  if (!all.length && errors.length === sources.length) {
    return { skipped: true, reason: errors.join("; "), hotspots: [] };
  }
  return { skipped: false, hotspots: withinLastHours(all, maxAgeHours, now()), errors };
}

// Clip the 2-day fetch to a rolling window. An unparseable timestamp is KEPT:
// dropping a detection we merely failed to date is the dangerous direction.
export function withinLastHours(hotspots, hours, now = new Date()) {
  if (!Number.isFinite(hours) || hours <= 0) return hotspots;
  const cutoff = now.getTime() - hours * 3600 * 1000;
  return hotspots.filter((h) => {
    const t = Date.parse(h.observedAt);
    return Number.isFinite(t) ? t >= cutoff : true;
  });
}

export function parseFirmsCsv(csv, sourceName) {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const cols = lines[0].split(",");
  const idx = (name) => cols.indexOf(name);
  const iLat = idx("latitude");
  const iLon = idx("longitude");
  const iDate = idx("acq_date");
  const iTime = idx("acq_time");
  const iConf = idx("confidence");
  const iFrp = idx("frp");
  const iDay = idx("daynight");
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const f = lines[i].split(",");
    if (f.length < cols.length) continue;
    const lat = Number(f[iLat]);
    const lon = Number(f[iLon]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const hhmm = f[iTime].padStart(4, "0");
    out.push({
      source: sourceName,
      lat,
      lon,
      observedAt: `${f[iDate]}T${hhmm.slice(0, 2)}:${hhmm.slice(2)}:00Z`,
      confidence: iConf >= 0 ? f[iConf] : null, // VIIRS: l/n/h, MODIS: 0-100
      frp: iFrp >= 0 ? Number(f[iFrp]) : null, // fire radiative power, MW
      daynight: iDay >= 0 ? f[iDay] : null,
    });
  }
  return out;
}

// Keep likely-real detections: drop low-confidence rows, keep the rest.
export function significantHotspots(hotspots) {
  return hotspots.filter((h) => {
    if (h.confidence === "l") return false;
    // A MISSING confidence must mean "unknown", never "zero": Number(null) and
    // Number("") are both 0, which is < 30, so a renamed or blank NASA column
    // silently discarded 100% of hotspots — and because hotspots still parsed,
    // firmsSkipped stayed false and worker.js overwrote the last-good cache
    // with the empty result, destroying the fallback built for exactly this.
    if (h.confidence == null || h.confidence === "") return true;
    const n = Number(h.confidence);
    if (Number.isFinite(n) && n < 30) return false;
    return true;
  });
}
