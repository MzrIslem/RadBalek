// Airport METAR ingestion (NOAA aviationweather.gov) — ground truth for the
// rain arc: rain/thunder/fog/dust observed NOW at Algeria's main airports,
// each mapped to its wilaya so the Today card can show "observed this hour"
// beside the Open-Meteo forecast. Graceful by construction: any failure
// serves {airports:[]} and the app simply omits the METAR line.

// ICAO → wilaya code + display name. Airports are sparse in the far south;
// the list favors sites that report reliably. Pruned against the live feed —
// an ICAO NOAA never answers costs a wasted id in every request and an empty
// card forever.
export const AIRPORTS = [
  { icao: "DAAG", code: 16, name: "Alger" },
  { icao: "DAOO", code: 31, name: "Oran" },
  { icao: "DABB", code: 23, name: "Annaba" },
  { icao: "DABC", code: 25, name: "Constantine" },
  { icao: "DABT", code: 5, name: "Batna" },
  { icao: "DAAV", code: 6, name: "Béjaïa" },
  { icao: "DAON", code: 13, name: "Tlemcen" },
  { icao: "DAAS", code: 19, name: "Sétif" },
  { icao: "DAAE", code: 7, name: "Biskra" },
  { icao: "DAUG", code: 47, name: "Ghardaïa" },
  { icao: "DAUO", code: 30, name: "Ouargla" },
  { icao: "DAAT", code: 11, name: "Tamanrasset" },
];

const KT_TO_KMH = 1.852;

// Pure: one NOAA JSON entry → our compact shape. Never throws — a malformed
// or sparse entry yields nulls and the app omits (degradation rule).
// Live NOAA shape (probed 2026-09-09 22:30Z):
//   visib  statute miles — a NUMBER (4.97) or the STRING "6+" (≥6 SM);
//          anything else is unparseable → null, never a fabricated value.
//   wspd/wgst  knots (wgst absent when calm).
//   wdir   number of degrees, or the string "VRB".
//   wxString  present-weather codes: "-RA" light rain, "RA", "+RA", "TS",
//          "SN", "FG", "DU"/"SA" — matched by substring on the code itself.
export function normalizeMetar(e) {
  let vis = null;
  if (typeof e?.visib === "number") vis = Math.round(e.visib * 1.609 * 10) / 10;
  else if (e?.visib === "6+") vis = 10; // ≥6 SM ≈ ≥10 km — display floor
  const wx = typeof e?.wxString === "string" ? e.wxString : "";
  const has = (code) => wx.includes(code);
  const ktToKmh = (kt) => (kt == null || typeof kt !== "number" ? null : Math.round(kt * KT_TO_KMH));
  return {
    icao: e?.icaoId ?? null,
    raw: e?.rawOb ?? null,
    t: typeof e?.temp === "number" ? e.temp : null,
    td: typeof e?.dewp === "number" ? e.dewp : null,
    wind: ktToKmh(e?.wspd),
    gust: ktToKmh(e?.wgst),
    vis,
    wx,
    // Now-flags the Today card keys on. TS (thunderstorm) is the single most
    // actionable "now" signal an airport can give; RA covers -RA/RA/+RA.
    rain: has("RA"),
    ts: has("TS"),
    snow: has("SN"),
    fog: has("FG"),
    dust: has("DU") || has("SA"),
    at: e?.reportTime ?? null,
  };
}

// Route handler: GET /v1/metar.json. KV cache-first (weather.js pattern,
// 30-min TTL over hourly METAR cycles), guarded put, empty-on-failure.
export async function fetchMetar(env, { fetchFn = fetch } = {}) {
  const jsonHeaders = {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "cache-control": "public, max-age=600",
  };
  try {
    const cached = await env.EWS_KV.get("metar");
    if (cached) return new Response(cached, { headers: jsonHeaders });
  } catch {}

  const ids = AIRPORTS.map((a) => a.icao).join(",");
  const out = { at: new Date().toISOString(), source: "NOAA aviationweather.gov", airports: [] };
  try {
    const res = await fetchFn(
      `https://aviationweather.gov/api/data/metar?ids=${ids}&format=json&taf=false`,
      { headers: { "user-agent": "radbalek/0.1" }, signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) throw new Error(`metar HTTP ${res.status}`);
    const rows = await res.json();
    const byIcao = new Map((Array.isArray(rows) ? rows : []).map((r) => [r.icaoId, r]));
    for (const a of AIRPORTS) {
      const n = normalizeMetar(byIcao.get(a.icao));
      // An ICAO NOAA doesn't answer (offline site, bad id) is omitted — the
      // app shows airports that reported, never a fabricated "calm" entry.
      if (n && byIcao.has(a.icao)) out.airports.push({ ...n, code: a.code, name: a.name });
    }
  } catch {
    // NOAA unreachable — serve the empty shape, not an error: the Today card
    // simply omits the METAR line and keeps the forecast half.
  }
  const body = JSON.stringify(out);
  try {
    await env.EWS_KV.put("metar", body, { expirationTtl: 1800 });
  } catch {} // guarded: quota must never turn a good fetch into a 500
  return new Response(body, { headers: jsonHeaders });
}
