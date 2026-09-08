// GDACS (Global Disaster Alert and Coordination System, EC JRC + UN OCHA).
// Free, no auth. GeoJSON events feed covering floods (FL), quakes (EQ),
// tropical cyclones (TC), droughts (DR), volcanoes (VO), fires (WF).
//
// v2 scope: FL (floods) ONLY. GDACS FL is GLOFAS-derived big-basin river
// flood forecasting — a CORROBORATING orange alert path, NOT a flash-flood
// solution (flash floods in small wadis remain out of reach; see
// TECHNICAL.md dead-ends). Orange-max: GDACS Red is capped to our orange —
// a foreign model's severity must never pierce DND on its own say-so.
// EQ/TC skipped (duplicates EMSC / overlaps ONM storm vigilance → double
// push). DR/VO/WF skipped (not app hazards / covered elsewhere).
//
// API verified live 2026-09-08:
//   GET /gdacsapi/api/events/geteventlist/SEARCH?fromDate=&toDate=
//   → GeoJSON FeatureCollection. The date window matches event OVERLAP,
//   not start (an event starting Jul 31 returns for a Sep 01-08 window),
//   so a ±7d window around now is the right fetch.

const API_BASE = "https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH";
// Same bbox as the FIRMS harvest (west,south,east,north) — Algeria + margin.
const DZ_BBOX = [-8.7, 18.9, 12.0, 37.3];

const isoDate = (d) => d.toISOString().slice(0, 10);

// bbox overlap test: both are [lonMin, latMin, lonMax, latMax].
function bboxOverlaps(fbox, region) {
  return fbox[0] <= region[2] && fbox[2] >= region[0] && fbox[1] <= region[3] && fbox[3] >= region[1];
}

function parseGdacsDate(s) {
  // GDACS dates are ISO without the Z ("2026-07-31T01:00:00") — treat as UTC.
  if (!s || typeof s !== "string") return null;
  const t = Date.parse(s.endsWith("Z") ? s : s + "Z");
  return Number.isFinite(t) ? new Date(t) : null;
}

// Fetch raw GeoJSON (throws on HTTP error — pipeline records it per-source).
export async function fetchGdacs({ fetchFn = fetch, now = () => new Date() } = {}) {
  const t = now();
  const url =
    `${API_BASE}?fromDate=${isoDate(new Date(t.getTime() - 7 * 86400e3))}` +
    `&toDate=${isoDate(new Date(t.getTime() + 7 * 86400e3))}`;
  const res = await fetchFn(url, {
    headers: { "user-agent": "aisx-ews/0.2 (+ingest)", accept: "application/json" },
    signal: AbortSignal.timeout(7500),
  });
  if (!res.ok) throw new Error(`gdacs HTTP ${res.status}`);
  return await res.json();
}

// Pure parser: GeoJSON FeatureCollection -> { alerts: [], incidents: [] }.
// `resolve` is the pipeline's wilaya resolver: (lat, lon, maxDeg) => props.
// Kept separate from fetchGdacs so tests can pin the normalization contract.
export function parseGdacs(json, resolve) {
  const out = { alerts: [], incidents: [] };
  const features = Array.isArray(json?.features) ? json.features : [];
  for (const f of features) {
    const p = f?.properties || {};
    // iscurrent is the STRING "true"/"false" in the API, not a boolean.
    if (String(p.iscurrent) !== "true") continue;
    if (p.eventtype !== "FL") continue;
    const fbox = Array.isArray(f.bbox) && f.bbox.length >= 4 ? f.bbox : null;
    if (!fbox || !bboxOverlaps(fbox, DZ_BBOX)) continue;
    const evId = String(p.eventid ?? "");
    const epId = String(p.episodeid ?? "");
    if (!evId) continue;
    // GeoJSON geometry: coordinates are [lon, lat].
    const coords = f?.geometry?.coordinates || [];
    const lon = Number(coords[0]);
    const lat = Number(coords[1]);
    const name = String(p.name || "Flood");
    const from = parseGdacsDate(p.fromdate);
    const to = parseGdacsDate(p.todate);
    const link = p.url?.report || null;
    // Wilaya placement: exact point-in-polygon, then the quakes-style 1.5°
    // fallback — basin-scale events often centre on a river point offshore or
    // in a neighbouring wilaya of the actual flood zone.
    let w = null;
    if (resolve && Number.isFinite(lat) && Number.isFinite(lon)) {
      w = resolve(lat, lon) || resolve(lat, lon, 1.5);
    }
    const wilayas = w ? [{ code: w.code, fr: w.fr, ar: w.ar }] : [];
    const base = {
      id: `gdacs:FL:${evId}:${epId}`,
      class: p.alertlevel === "Orange" || p.alertlevel === "Red" ? "alert" : "incident",
      source: "gdacs",
      sourceName: "GDACS (JRC-CEC)",
      hazard: "flood",
      status: "forecast",
      lat: Number.isFinite(lat) ? lat : null,
      lon: Number.isFinite(lon) ? lon : null,
      link,
    };
    const orangeOrRed = p.alertlevel === "Orange" || p.alertlevel === "Red";
    if (orangeOrRed && wilayas.length) {
      const wf = wilayas[0].fr;
      const wa = wilayas[0].ar;
      const fr = `Inondation (GDACS) — ${wf}`;
      const en = `Flood (GDACS) — ${wf}`;
      const ar = `فيضان (GDACS) — ${wa}`;
      out.alerts.push({
        ...base,
        color: "orange", // orange-max: even GDACS Red stays our orange
        severity: "Severe",
        event: "Flood (GDACS)",
        urgency: "Expected",
        certainty: "Possible",
        onset: from ? from.toISOString() : null,
        expires: to ? to.toISOString() : null,
        headline: { fr, en, ar },
        wilayas,
      });
    } else {
      // Green, unknown level, or Orange/Red we cannot pin to a wilaya:
      // map pin only, never a push.
      out.incidents.push({
        ...base,
        class: "incident",
        observedAt: from ? from.toISOString() : null,
        headline: { fr: name, en: name, ar: name },
        wilayas,
      });
    }
  }
  return out;
}
