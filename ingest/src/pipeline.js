// Orchestrates all sources into one snapshot:
// { generatedAt, alerts[], incidents[], stats, errors[] }
// Every source failure is isolated — one broken feed never blanks the others.

import { fetchOnmAlerts } from "./capfeed.js";
import { fetchDgpcPosts } from "./telegram.js";
import { fetchFirmsHotspots, significantHotspots } from "./firms.js";
import { fetchQuakes } from "./quakes.js";
import { makeWilayaResolver, clusterHotspots, inFlareZone } from "./geo.js";
import { normalizeOnm, normalizeFireCluster, normalizeDgpcIncident, fcmTopicsFor } from "./normalize.js";

export async function runPipeline({ firmsMapKey = null, wilayasGeojson = null, fetchFn = fetch, now = () => new Date() } = {}) {
  const errors = [];
  const settled = await Promise.allSettled([
    fetchOnmAlerts(fetchFn),
    fetchDgpcPosts(fetchFn),
    fetchFirmsHotspots(firmsMapKey, { fetchFn }),
    fetchQuakes(fetchFn),
  ]);
  const [onmR, dgpcR, firmsR, quakesR] = settled;
  const grab = (r, name, fallback) => {
    if (r.status === "fulfilled") return r.value;
    errors.push({ source: name, error: String(r.reason) });
    return fallback;
  };

  const onm = grab(onmR, "onm", []);
  const dgpcPosts = grab(dgpcR, "dgpc-telegram", []);
  const firms = grab(firmsR, "firms", { skipped: true, hotspots: [] });
  const quakes = grab(quakesR, "usgs", []);

  const nowIso = now().toISOString();

  // --- official alerts ---
  const alerts = onm
    .filter((a) => a.status === "Actual" && a.msgType !== "Cancel")
    .filter((a) => !a.expires || a.expires >= nowIso)
    .map(normalizeOnm);

  // --- observed incidents ---
  const incidents = [];
  const resolveWilaya = makeWilayaResolver(wilayasGeojson);

  const latestSitrep = dgpcPosts.filter((p) => p.kind === "fire-sitrep").sort((a, b) => (a.postedAt < b.postedAt ? 1 : -1))[0];
  const dgpcFireWilayas = new Set(
    (latestSitrep?.incidents || []).filter((i) => i.status === "ongoing" && i.wilaya).map((i) => i.wilaya.code)
  );

  const clusters = clusterHotspots(significantHotspots(firms.hotspots));
  for (const c of clusters) {
    const w = resolveWilaya(c.lat, c.lon);
    incidents.push(
      normalizeFireCluster(c, w, {
        corroborated: !!(w && dgpcFireWilayas.has(w.code)),
        possibleIndustrial: inFlareZone(c.lat, c.lon),
      })
    );
  }
  if (latestSitrep) for (const inc of latestSitrep.incidents) incidents.push(normalizeDgpcIncident(inc, latestSitrep.id, latestSitrep.postedAt));

  for (const p of dgpcPosts) {
    if (p.kind !== "road-crash") continue;
    incidents.push({
      id: `dgpc:${p.id}`,
      class: "incident",
      source: "dgpc-telegram",
      sourceName: "Protection Civile (Telegram)",
      hazard: "road",
      status: "reported",
      observedAt: p.postedAt,
      wilayas: p.wilaya ? [p.wilaya] : [],
      casualties: p.casualties || null,
      headline: {
        fr: `Accident de la route${p.wilaya ? " — " + p.wilaya.fr : ""}`,
        en: `Road crash${p.wilaya ? " — " + p.wilaya.fr : ""}`,
        ar: `حادث مرور${p.wilaya ? " — ولاية " + p.wilaya.ar : ""}`,
      },
      textAr: p.text.slice(0, 500),
    });
  }

  for (const q of quakes) {
    const w = resolveWilaya(q.lat, q.lon);
    // Felt quakes (M>=4.5, <6h old) escalate to a pushable red alert.
    const quakeAge = Date.now() - Date.parse(q.time);
    if (q.mag >= 4.5 && w && quakeAge < 6 * 3600 * 1000) {
      alerts.push({
        id: `${q.id}:alert`,
        class: "alert",
        source: "usgs-emsc",
        sourceName: "EMSC/USGS",
        hazard: "quake",
        event: `Earthquake M${q.mag}`,
        severity: "Extreme",
        color: "red",
        urgency: "Immediate",
        certainty: "Observed",
        onset: q.time,
        expires: new Date(Date.parse(q.time) + 6 * 3600 * 1000).toISOString(),
        wilayas: [{ code: w.code, fr: w.fr, ar: w.ar }],
        lat: q.lat,
        lon: q.lon,
        headline: {
          fr: `Séisme M${q.mag} — ${w.fr}`,
          en: `Earthquake M${q.mag} — ${w.fr}`,
          ar: `زلزال بقوة ${q.mag} — ولاية ${w.ar}`,
        },
      });
    }
    incidents.push({
      id: q.id,
      class: "incident",
      source: "usgs",
      sourceName: "USGS",
      hazard: "quake",
      status: "observed",
      observedAt: q.time,
      mag: q.mag,
      depth: q.depth,
      lat: q.lat,
      lon: q.lon,
      wilayas: w ? [{ code: w.code, fr: w.fr, ar: w.ar }] : [],
      headline: {
        fr: `Séisme M${q.mag} — ${w ? w.fr : q.place || "Algérie"}`,
        en: `Earthquake M${q.mag} — ${w ? w.fr : q.place || "Algeria"}`,
        ar: `زلزال ${q.mag} — ${w ? "ولاية " + w.ar : "الجزائر"}`,
      },
    });
  }

  const notifications = alerts.flatMap((a) => fcmTopicsFor(a).map((topic) => ({ topic, alertId: a.id })));

  return {
    generatedAt: nowIso,
    attribution: "Alerts: Office National de la Météorologie (CC BY 4.0) · Incidents: NASA FIRMS, Protection Civile Algérienne",
    stats: {
      onmEntries: onm.length,
      activeAlerts: alerts.length,
      byHazard: countBy(alerts, (a) => a.hazard),
      byColor: countBy(alerts, (a) => a.color),
      dgpcPosts: dgpcPosts.length,
      dgpcSitrep: latestSitrep ? { postedAt: latestSitrep.postedAt, ...latestSitrep.stats } : null,
      firmsSkipped: firms.skipped || false,
      fireClusters: clusters.length,
      incidents: incidents.length,
    },
    alerts,
    incidents,
    notifications,
    errors,
  };
}

function countBy(arr, fn) {
  const out = {};
  for (const x of arr) out[fn(x)] = (out[fn(x)] || 0) + 1;
  return out;
}
