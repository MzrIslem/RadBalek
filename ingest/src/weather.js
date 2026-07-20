// Per-wilaya current weather via Open-Meteo (free, no key), batched in one
// request over wilaya centroids, cached 30 min in KV. Serves /v1/weather.json
// for the app's map layers: temperature, wind speed, humidity, feels-like.
export async function handleWeather(env, geo) {
  const cached = await env.EWS_KV.get("weather");
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
    `&daily=apparent_temperature_max&forecast_days=3&timezone=UTC`;
  const aqUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}` +
    `&current=european_aqi,pm2_5,pm10&timezone=UTC`;
  const [res, aqRes] = await Promise.all([
    fetch(url, { headers: { "user-agent": "radbalek/0.1" } }),
    fetch(aqUrl, { headers: { "user-agent": "radbalek/0.1" } }).catch(() => null),
  ]);
  if (!res.ok) return new Response('{"error":"upstream"}', { status: 502, headers: { "access-control-allow-origin": "*" } });
  const data = await res.json();
  const arr = Array.isArray(data) ? data : [data];
  let aqArr = [];
  if (aqRes && aqRes.ok) {
    const aq = await aqRes.json();
    aqArr = Array.isArray(aq) ? aq : [aq];
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
      const dmax = arr[i]?.daily?.apparent_temperature_max || [];
      const today = dmax[0] ?? null;
      const next48 = dmax.length > 2 ? Math.max(dmax[1], dmax[2]) : (dmax[1] ?? today);
      let trend = "flat";
      if (today != null && next48 != null) trend = next48 > today + 2 ? "up" : next48 < today - 2 ? "down" : "flat";
      return {
        code: c.code,
        t: cur.temperature_2m ?? null,
        feels: cur.apparent_temperature ?? null,
        rh: cur.relative_humidity_2m ?? null,
        wind: cur.wind_speed_10m ?? null,
        f: { today, peak48: next48, trend, risk: riskOf(Math.max(today ?? -99, next48 ?? -99)) },
        aq: (() => {
          const c = aqArr[i]?.current;
          if (!c) return null;
          return { aqi: c.european_aqi ?? null, pm25: c.pm2_5 ?? null, pm10: c.pm10 ?? null, band: aqBand(c.european_aqi) };
        })(),
      };
    }),
  };
  const body = JSON.stringify(out);
  await env.EWS_KV.put("weather", body, { expirationTtl: 1800 });
  return new Response(body, {
    headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "public, max-age=300" },
  });
}
