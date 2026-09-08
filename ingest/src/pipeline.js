// Orchestrates all sources into one snapshot:
// { generatedAt, alerts[], incidents[], stats, errors[] }
// Every source failure is isolated — one broken feed never blanks the others.

import { fetchOnmAlerts } from "./capfeed.js";
import { fetchDgpcPosts } from "./telegram.js";
import { fetchDgpcWeb } from "./dgpcweb.js";
import { fetchNews } from "./news.js";
import { fetchCraag, enrichQuakes } from "./craag.js";
import { fetchFirmsHotspots, significantHotspots } from "./firms.js";
import { fetchQuakes } from "./quakes.js";
import { fetchGdacs, parseGdacs } from "./gdacs.js";
import { makeWilayaResolver, clusterHotspots, inFlareZone } from "./geo.js";
import { normalizeOnm, normalizeFireCluster, normalizeDgpcIncident, fcmTopicsFor } from "./normalize.js";
import { geminiRiskScore } from "./ai.js";
import { detectEew } from "./quakes.js";

export async function runPipeline({ firmsMapKey = null, wilayasGeojson = null, fetchFn = fetch, now = () => new Date(), geminiApiKey = null } = {}) {
  const errors = [];
  // Per-source timeout: one hung upstream (a stalled t.me / EMSC socket, or
  // dgpc.dz 522'ing to Worker→CF) must never block the whole scheduled() run —
  // that is what silenced all push for 3h on 2026-07-19.
  const T = (p, ms, name) =>
    Promise.race([Promise.resolve(p), new Promise((_, rej) => setTimeout(() => rej(new Error(`${name} timeout ${ms}ms`)), ms))]);
  const settled = await Promise.allSettled([
    T(fetchOnmAlerts(fetchFn), 9000, "onm"),
    T(fetchDgpcPosts(fetchFn), 8000, "dgpc-telegram"),
    T(fetchFirmsHotspots(firmsMapKey, { fetchFn }), 20000, "firms"),
    T(fetchQuakes(fetchFn), 8000, "quakes"),
    T(fetchDgpcWeb(fetchFn), 8000, "dgpc-web"),
    T(fetchNews(fetchFn), 8000, "news"),
    T(fetchCraag(fetchFn), 8000, "craag"),
    T(fetchGdacs({ fetchFn }), 8000, "gdacs"),
  ]);
  const [onmR, dgpcR, firmsR, quakesR, dgpcWebR, newsR, craagR, gdacsR] = settled;
  const grab = (r, name, fallback) => {
    if (r.status === "fulfilled") return r.value;
    errors.push({ source: name, error: String(r.reason) });
    return fallback;
  };

  const onm = grab(onmR, "onm", []);
  const dgpcPosts = grab(dgpcR, "dgpc-telegram", []);
  const firms = grab(firmsR, "firms", { skipped: true, hotspots: [] });
  const dgpcWeb = grab(dgpcWebR, "dgpc-web", []);
  const news = grab(newsR, "press", []);
  const craagRows = grab(craagR, "craag", []);
  const gdacsJson = grab(gdacsR, "gdacs", null);
  // CRAAG lags days — never an alert trigger, only official confirmation +
  // the wilaya name that EMSC never provides.
  const quakes = enrichQuakes(grab(quakesR, "usgs", []), craagRows);

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
    // Offshore epicentres lie outside every wilaya polygon AND outside the 0.5°
    // nearest-centre fallback, so they resolved to null — and a null wilaya
    // meant NO red alert was ever created, for precisely the geometry that
    // produces Algeria's damaging quakes (the northern marine margin). Widen
    // the radius for northern/marine points only; CRAAG is the last resort.
    const w =
      resolveWilaya(q.lat, q.lon) ||
      (q.lat > 36.0 ? resolveWilaya(q.lat, q.lon, 1.5) : null) ||
      q.wilaya ||
      null;
    // Felt quakes (M>=4.5, <6h old) escalate to a pushable red alert.
    const quakeAge = now().getTime() - Date.parse(q.time);
    // Quantise to the minute: onset/expires ARE the push dedupe identity, and
    // EMSC vs USGS report the same event's origin time seconds apart — so an
    // EMSC timeout that failed over to USGS re-sirened the same earthquake.
    const qT0 = Math.round(Date.parse(q.time) / 60000) * 60000;
    if (q.mag >= 4.5 && w && quakeAge < 6 * 3600 * 1000) {
      // Honest EEW: do not create a second alert. The same red quake alert is
      // enriched with remaining S-wave lead time and multi-wilaya targets.
      const eew = detectEew(q, now, wilayasGeojson);
      const eewTargets = eew.eew ? eew.targets.filter((t) => Number.isInteger(t.code) && t.code >= 1 && t.code <= 58) : [];
      const wilayas = eewTargets.length
        ? eewTargets.map((t) => ({ code: t.code, fr: t.fr, ar: t.ar }))
        : [{ code: w.code, fr: w.fr, ar: w.ar }];
      const first = eewTargets[0];
      const whereFr = first?.fr || w.fr;
      const whereAr = first?.ar || w.ar;
      const minLead = eew.warningSeconds;
      const maxLead = Math.max(...eewTargets.map((t) => t.warningSeconds));
      const leadLabel = maxLead > minLead ? `${minLead}-${maxLead}s` : `${minLead}s`;
      const placeFr = wilayas.length === 1 ? whereFr : `${wilayas.length} wilayas`;
      const placeAr = wilayas.length === 1 ? whereAr : `${wilayas.length} ولايات`;

      alerts.push({
        id: `${q.id}:alert`,
        class: "alert",
        source: "usgs-emsc",
        sourceName: eew.eew ? "EMSC/USGS — estimation sismique" : "EMSC/USGS",
        hazard: "quake",
        event: eew.eew ? `Earthquake S-wave estimate M${q.mag}` : `Earthquake M${q.mag}`,
        severity: "Extreme",
        color: "red",
        urgency: eew.eew ? "Critical" : "Immediate",
        certainty: eew.eew ? "Forecast" : "Observed",
        onset: new Date(qT0).toISOString(),
        expires: new Date(qT0 + 6 * 3600 * 1000).toISOString(),
        wilayas,
        lat: q.lat,
        lon: q.lon,
        headline: eew.eew
          ? {
              fr: `⚠️ Secousse estimée dans ~${leadLabel} — ${placeFr}`,
              en: `⚠️ Shaking estimated in ~${leadLabel} — ${placeFr}`,
              ar: `⚠️ هزة متوقعة خلال ~${leadLabel} — ${placeAr}`,
            }
          : {

              fr: `Séisme M${q.mag} — ${whereFr}`,
              en: `Earthquake M${q.mag} — ${whereFr}`,
              ar: `زلزال بقوة ${q.mag} — ولاية ${whereAr}`,
            },
        ...(eew.eew
          ? {
              eew: true,
              warningSeconds: eew.warningSeconds,
              pWaveSeconds: eew.pWaveSeconds,
              sWaveSeconds: eew.sWaveSeconds,
              distanceKm: eew.distanceKm,
              leadSeconds: eew.leadSeconds,
              eewTargets,
            }
          : {}),
      });
    }
    // w already falls back through the widened radius and CRAAG's wilaya.
    const place = w;
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
      // Official Algerian confirmation, when CRAAG has caught up (days later).
      craagMag: q.craag ? q.craag.mag : undefined,
      craagRegion: q.craag ? q.craag.region : undefined,
      wilayas: place ? [{ code: place.code, fr: place.fr, ar: place.ar }] : [],
      headline: {
        fr: `Séisme M${q.mag} — ${place ? place.fr : q.place || "Algérie"}`,
        en: `Earthquake M${q.mag} — ${place ? place.fr : q.place || "Algeria"}`,
        ar: `زلزال ${q.mag} — ${place ? "ولاية " + place.ar : "الجزائر"}`,
      },
    });
  }

  // --- Protection Civile official site (dgpc.dz) — resilience path for the
  // Telegram scrape, plus specific field incidents. National daily bilans are
  // deliberately excluded from the map (they cover the whole country).
  for (const p of dgpcWeb) {
    if (p.aggregate || !p.wilayas.length) continue;
    if (!["fire", "flood", "road-crash", "gas", "drowning"].includes(p.kind)) continue;
    incidents.push({
      id: p.id,
      class: "incident",
      source: "dgpc-web",
      sourceName: "Protection Civile (dgpc.dz)",
      hazard: p.kind === "road-crash" ? "road" : p.kind === "drowning" || p.kind === "gas" ? "other" : p.kind,
      status: "reported",
      observedAt: p.postedAt,
      wilayas: p.wilayas,
      link: p.link,
      headline: { fr: p.title, en: p.title, ar: p.title },
    });
  }

  // --- Algerian press (UNOFFICIAL) — covers hazard classes the official feeds
  // structurally miss: floods in progress, road closures, collapses, storms.
  for (const n of news) {
    incidents.push({
      id: n.id,
      class: "incident",
      source: "press",
      sourceName: n.sourceName,
      hazard: n.hazard,
      status: "unverified",
      observedAt: n.observedAt,
      wilayas: n.wilayas,
      link: n.link,
      headline: { fr: n.title, en: n.title, ar: n.title },
    });
  }

  // --- GDACS floods (UNOFFICIAL, corroborating) — GLOFAS big-basin river
  // floods from the JRC. Orange-max: even a GDACS Red stays our orange.
  // Quakes/cyclones are skipped (duplicates EMSC / ONM vigilance).
  const gdacs = gdacsJson ? parseGdacs(gdacsJson, resolveWilaya) : { alerts: [], incidents: [] };
  for (const a of gdacs.alerts) alerts.push(a);
  for (const i of gdacs.incidents) incidents.push(i);

  // --- AI Predictive Risk Scoring (optional, runs if GEMINI_API_KEY set) ---
  // Build context from all sources for the risk engine.
  let riskScores = null;
  if (geminiApiKey) {
    try {
      const context = buildRiskContext({
        onm, alerts, incidents, clusters, quakes, latestSitrep, dgpcFireWilayas, firms, news, craagRows,
      });
      riskScores = await geminiRiskScore({ GEMINI_API_KEY: geminiApiKey }, context);
    } catch {}
  }

  const notifications = alerts.flatMap((a) => fcmTopicsFor(a).map((topic) => ({ topic, alertId: a.id })));

  return {
    generatedAt: nowIso,
    attribution:
      "Alerts: Office National de la Météorologie (CC BY 4.0) · Incidents: NASA FIRMS, " +
      "Protection Civile Algérienne (dgpc.dz), CRAAG, EMSC, GDACS (JRC-CEC) · Presse: TSA, Ennahar, " +
      "Le Soir, Echorouk (non officiel)",
    stats: {
      onmEntries: onm.length,
      activeAlerts: alerts.length,
      byHazard: countBy(alerts, (a) => a.hazard),
      byColor: countBy(alerts, (a) => a.color),
      dgpcPosts: dgpcPosts.length,
      dgpcWebPosts: dgpcWeb.length,
      pressItems: news.length,
      craagRows: craagRows.length,
      gdacsEvents: gdacs.alerts.length + gdacs.incidents.length,
      dgpcSitrep: latestSitrep ? { postedAt: latestSitrep.postedAt, ...latestSitrep.stats } : null,
      firmsSkipped: firms.skipped || false,
      fireClusters: clusters.length,
      incidents: incidents.length,
    },
    alerts,
    incidents,
    notifications,
    errors,
    riskScores: riskScores || null,
  };
}

function countBy(arr, fn) {
  const out = {};
  for (const x of arr) out[fn(x)] = (out[fn(x)] || 0) + 1;
  return out;
}

function buildRiskContext({ onm, alerts, incidents, clusters, quakes, latestSitrep, dgpcFireWilayas, firms, news, craagRows }) {
  const lines = [];
  // ONM vigilance alerts
  for (const a of onm) {
    if (a.wilaya) lines.push(`ONM: ${a.event} ${a.severity} for wilaya ${a.wilaya.code} (${a.wilaya.fr})`);
    else lines.push(`ONM: ${a.event} ${a.severity} for ${a.areaDesc}`);
  }
  // Active alerts (normalized)
  for (const a of alerts) {
    const w = a.wilayas.map((x) => x.code).join(",");
    lines.push(`ALERT: ${a.hazard} ${a.color} ${a.event} wilayas[${w}]`);
  }
  // FIRMS fire clusters
  if (!firms.skipped && clusters.length) {
    lines.push(`FIRMS: ${clusters.length} fire clusters`);
    for (const c of clusters.slice(0, 10)) lines.push(`  cluster ${c.lat.toFixed(3)},${c.lon.toFixed(3)} det=${c.count} frp=${c.totalFrp}`);
  }
  // DGPC fire sitrep
  if (latestSitrep) {
    lines.push(`DGPC sitrep: ${latestSitrep.incidents?.length || 0} ongoing fires`);
    for (const inc of (latestSitrep.incidents || []).filter((i) => i.status === "ongoing")) {
      if (inc.wilaya) lines.push(`  DGPC fire ongoing wilaya ${inc.wilaya.code} (${inc.wilaya.fr})`);
    }
  }
  // Earthquakes (last 6h, M>=3)
  const recentQuakes = quakes.filter((q) => Date.now() - Date.parse(q.time) < 6 * 3600 * 1000 && q.mag >= 3);
  if (recentQuakes.length) {
    lines.push(`QUAKES: ${recentQuakes.length} recent`);
    for (const q of recentQuakes.slice(0, 5)) lines.push(`  M${q.mag} ${q.lat.toFixed(2)},${q.lon.toFixed(2)} ${q.place || ""}`);
  }
  // CRAAG confirmations
  if (craagRows.length) lines.push(`CRAAG: ${craagRows.length} official entries`);
  // Press incidents
  if (news.length) {
    const byH = {};
    for (const n of news) byH[n.hazard] = (byH[n.hazard] || 0) + 1;
    lines.push(`PRESS: ${Object.entries(byH).map(([h, c]) => `${h}=${c}`).join(", ")}`);
  }
  return lines.join("\n").slice(0, 6000);
}
