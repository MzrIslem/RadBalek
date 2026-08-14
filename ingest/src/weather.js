// Per-wilaya current weather via Open-Meteo (free, no key), batched in one
// request over wilaya centroids, cached 30 min in KV. Serves /v1/weather.json
// for the app's map layers: temperature, wind speed, humidity, feels-like.
import { fwiSeries } from "./fwi.js";
import { errText, logSwallowed } from "./log.js";

// FFMC/DMC/DC are cumulative, so the index needs a run-up before it means
// anything. 14 days from the standard startup values is enough for FFMC and
// DMC to converge; DC drifts longer but its influence is damped by BUI.
const FWI_SPINUP_DAYS = 14;

export async function handleWeather(env, geo) {
  // A KV read failure must not take the whole layer down: without the cache we
  // just pay for a fresh upstream call.
  let cached = null;
  try {
    cached = await env.EWS_KV.get("weather");
  } catch (err) {
    logSwallowed("kv:get weather", err);
  }
  if (cached)
    return new Response(cached, {
      headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "public, max-age=300" },
    });

  const cents = [];
  for (const f of geo.features) {
    const g = f.geometry;
    const rings = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
    let mnLo = 99, mnLa = 99, mxLo = -99, mxLa = -99;
    for (const poly of rings)
      for (const [lo, la] of poly[0]) {
        if (lo < mnLo) mnLo = lo;
        if (la < mnLa) mnLa = la;
        if (lo > mxLo) mxLo = lo;
        if (la > mxLa) mxLa = la;
      }
    cents.push({ code: f.properties.code, lat: (mnLa + mxLa) / 2, lon: (mnLo + mxLo) / 2 });
  }

  const lats = cents.map((c) => c.lat.toFixed(3)).join(",");
  const lons = cents.map((c) => c.lon.toFixed(3)).join(",");
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,apparent_temperature` +
    // The extra daily fields are the CFFWIS inputs (peak-fire-weather proxies);
    // past_days warms up the cumulative fuel-moisture codes.
    `&daily=apparent_temperature_max,temperature_2m_max,relative_humidity_2m_min,wind_speed_10m_max,precipitation_sum` +
    `&past_days=${FWI_SPINUP_DAYS}&forecast_days=3&timezone=UTC`;
  const aqUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}` +
    `&current=european_aqi,pm2_5,pm10&timezone=UTC`;
  const [res, aqRes] = await Promise.all([
    fetch(url, { headers: { "user-agent": "radbalek/0.1" } }).catch((err) => {
      // Reject with a typed message instead of the bare TypeError a failed
      // subrequest throws, so the worker log names the upstream that died.
      throw new Error(`open-meteo unreachable: ${errText(err)}`);
    }),
    fetch(aqUrl, { headers: { "user-agent": "radbalek/0.1" } }).catch((err) => {
      logSwallowed("open-meteo air-quality", err);
      return null;
    }),
  ]);
  if (!res.ok) {
    console.error(`[rb] open-meteo ${res.status} for /v1/weather.json`);
    return new Response('{"error":"upstream"}', { status: 502, headers: { "access-control-allow-origin": "*" } });
  }
  let data;
  try {
    data = await res.json();
  } catch (err) {
    console.error(`[rb] open-meteo body unparseable: ${errText(err)}`);
    return new Response('{"error":"upstream body"}', { status: 502, headers: { "access-control-allow-origin": "*" } });
  }
  const arr = Array.isArray(data) ? data : [data];
  let aqArr = [];
  try {
    if (aqRes && aqRes.ok) {
      const aq = await aqRes.json();
      aqArr = Array.isArray(aq) ? aq : [aq];
    }
  } catch (err) {
    logSwallowed("air-quality parse", err); // enrichment — never fail weather over it
  }
  // European AQI bands → our color tiers.
  const aqBand = (v) => (v == null ? null : v <= 20 ? "good" : v <= 40 ? "fair" : v <= 60 ? "moderate" : v <= 80 ? "poor" : "veryPoor");
  // Rule-based 48h trend (no ML): compare today's feels-like max to the peak
  // of the next two days; classify heat risk from that peak.
  const riskOf = (feels) => (feels == null ? null : feels >= 45 ? "extreme" : feels >= 40 ? "high" : feels >= 35 ? "moderate" : "low");
  const out = {
    at: new Date().toISOString(),
    source: "Open-Meteo.com",
    wilayas: cents.map((c, i) => {
      const cur = arr[i]?.current || {};
      const daily = arr[i]?.daily || {};
      const dmax = daily.apparent_temperature_max || [];
      // past_days shifts the arrays: index FWI_SPINUP_DAYS is TODAY, and the
      // two entries after it are J+1 / J+2. Everything before is spin-up only.
      const P = FWI_SPINUP_DAYS;
      const today = dmax[P] ?? null;
      const d1 = dmax[P + 1] ?? null;
      const d2 = dmax[P + 2] ?? null;
      const next48 = d1 != null && d2 != null ? Math.max(d1, d2) : (d1 ?? today);
      let trend = "flat";
      if (today != null && next48 != null) trend = next48 > today + 2 ? "up" : next48 < today - 2 ? "down" : "flat";
      // Fire danger: run the cumulative CFFWIS codes across the spin-up window
      // and keep today + the two forecast days (the Météo-des-Forêts framing).
      let fire = null;
      try {
        const times = daily.time || [];
        const series = times.map((d, j) => ({
          t: daily.temperature_2m_max?.[j],
          h: daily.relative_humidity_2m_min?.[j],
          w: daily.wind_speed_10m_max?.[j],
          p: daily.precipitation_sum?.[j],
          month: Number(String(d).slice(5, 7)) || 1,
        }));
        if (series.length > P) {
          const r = fwiSeries(series, P); // [today, J+1, J+2]
          // FWI measures fire WEATHER, not fire risk: it knows nothing about
          // fuel. In the Sahara it saturates (45°C, no rain for months) and
          // would paint half the country "très extrême" with nothing to burn —
          // crying wolf, and EFFIS masks non-fuel areas for the same reason.
          // Crude but honest proxy: Algeria's burnable land (Tell forests, then
          // alfa steppe) is northern. The app uses this to decide whether the
          // fire-danger reading is worth surfacing at all.
          const fuel = c.lat >= 34.5 ? "forest" : c.lat >= 32.5 ? "steppe" : "desert";
          if (r[0]) fire = { fwi: r[0].fwi, class: r[0].class, d1: r[1] ?? null, d2: r[2] ?? null, fuel };
        }
      } catch (err) {
        logSwallowed(`fwi wilaya ${c.code}`, err); // enrichment — never fail weather over it
      }
      return {
        code: c.code,
        t: cur.temperature_2m ?? null,
        feels: cur.apparent_temperature ?? null,
        rh: cur.relative_humidity_2m ?? null,
        wind: cur.wind_speed_10m ?? null,
        f: { today, peak48: next48, trend, risk: riskOf(Math.max(today ?? -99, next48 ?? -99)) },
        fire,
        aq: (() => {
          const c = aqArr[i]?.current;
          if (!c) return null;
          return { aqi: c.european_aqi ?? null, pm25: c.pm2_5 ?? null, pm10: c.pm10 ?? null, band: aqBand(c.european_aqi) };
        })(),
      };
    }),
  };
  const body = JSON.stringify(out);
  // Guarded: an unguarded put threw on a quota 429 and made /v1/weather.json
  // return 500 for the rest of the day — killing the heat-risk layer during
  // exactly the heat emergency that consumed the quota.
  try {
    await env.EWS_KV.put("weather", body, { expirationTtl: 1800 });
  } catch (err) {
    logSwallowed("kv:put weather", err);
  }
  return new Response(body, {
    headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "public, max-age=300" },
  });
}
