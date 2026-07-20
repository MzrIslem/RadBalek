// NASA FIRMS active-fire hotspots (VIIRS 375m + MODIS 1km) over Algeria.
// Free MAP_KEY: https://firms.modaps.eosdis.nasa.gov/api/map_key/
// Quota: 5000 transactions / 10 min. NRT latency for Algeria ~1-3h per overpass.

const DZ_BBOX = "-8.7,18.9,12.0,37.3"; // west,south,east,north

export const FIRMS_SOURCES = ["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT", "MODIS_NRT"];

export async function fetchFirmsHotspots(mapKey, { days = 1, sources = FIRMS_SOURCES, fetchFn = fetch } = {}) {
  if (!mapKey) return { skipped: true, reason: "FIRMS_MAP_KEY not set", hotspots: [] };
  mapKey = String(mapKey).trim(); // secrets piped via shell can carry a stray \r\n
  const hotspots = [];
  for (const src of sources) {
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${src}/${DZ_BBOX}/${days}`;
    const res = await fetchFn(url, { headers: { "user-agent": "aisx-ews/0.1 (+ingest)", accept: "text/csv,*/*" } });
    if (!res.ok) throw new Error(`FIRMS ${src} HTTP ${res.status}`);
    hotspots.push(...parseFirmsCsv(await res.text(), src));
  }
  return { skipped: false, hotspots };
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
    const n = Number(h.confidence);
    if (Number.isFinite(n) && n < 30) return false;
    return true;
  });
}
