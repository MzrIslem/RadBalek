// Cloudflare Worker: cron-driven poller + JSON API + community reports.
// Endpoints:
//   GET  /v1/alerts.json    latest normalized snapshot (alerts + incidents)
//   GET  /v1/wilayas.json   the 58 wilayas
//   POST /v1/reports        citizen report (danger to people/vegetation/animals)
//   POST /v1/reports/confirm
//   GET  /v1/reports.json   recent community reports
//   GET  /v1/reports.csv    export for analysis
//   GET  /v1/history.json   hourly stats snapshots (analysis time series)
//   GET  /healthz
import { runPipeline } from "./src/pipeline.js";
import { sendPush } from "./src/push.js";
import geo from "./data/wilayas.json"; // bundled + parsed at build time by esbuild
import {
  corsHeaders,
  handleWilayasList,
  handleCreateReport,
  handleConfirmReport,
  handleListReports,
  handleExportCsv,
} from "./src/reports.js";
import { handleAdminList, handleModerate, handleTestPush, triageReport, liteSnapshot } from "./src/admin.js";
import { ADMIN_HTML } from "./src/adminui.js";
import { handleWeather } from "./src/weather.js";
import { handleChat, handleCategory } from "./src/ai.js";

export default {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(refresh(env, true));
  },

  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const path = url.pathname;

    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });
    if (path === "/healthz") return new Response("ok");

    // Edge cache (free, unmetered) in front of KV: repeat reads within the TTL
    // never touch KV — KV ops are what the free tier actually meters. Keyed on
    // the full URL, so ?lite=1 caches separately from the full snapshot.
    const CACHE_TTL = {
      "/v1/alerts.json": 120,
      "/v1/reports.json": 60, // kills the list+N-gets fan-out per app open
      "/v1/history.json": 300, // kills the 168-get burst per history open
      "/v1/weather.json": 600,
      "/v1/fwi.png": 10800,
    };
    const cacheable = req.method === "GET" && CACHE_TTL[path];
    if (cacheable) {
      const hit = await caches.default.match(req.url);
      if (hit) return hit;
    }
    const store = (resp) => {
      if (cacheable && resp.status === 200) {
        const copy = new Response(resp.clone().body, resp);
        copy.headers.set("cache-control", `public, max-age=${CACHE_TTL[path]}`);
        ctx.waitUntil(caches.default.put(req.url, copy));
      }
      return resp;
    };

    if (path === "/v1/alerts.json") {
      let body = await env.EWS_KV.get("latest");
      if (!body) {
        try {
          const snap = await refresh(env);
          body = JSON.stringify(snap);
        } catch (err) {
          return new Response("refresh failed: " + err.message, { status: 500, headers: corsHeaders() });
        }
      }
      if (url.searchParams.get("lite")) body = liteSnapshot(body);
      return store(new Response(body, {
        headers: corsHeaders({
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=120",
        }),
      }));
    }

    if (path === "/v1/reports" && req.method === "POST") {
      const resp = await handleCreateReport(req, env, geo);
      if (resp.status === 201 && env.GEMINI_API_KEY) {
        const created = await resp.clone().json();
        ctx.waitUntil(triageReport(env, created.report));
      }
      return resp;
    }
    if (path === "/admin")
      return new Response(ADMIN_HTML, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    if (path === "/v1/admin/reports") return handleAdminList(url, env);
    if (path === "/v1/admin/moderate" && req.method === "POST") return handleModerate(req, env);
    if (path === "/v1/test-push" && req.method === "POST") return handleTestPush(req, env, ctx);
    // EFFIS Fire Weather Index forecast raster over Algeria, cached per day.
    // TIME is mandatory — without it EFFIS silently returns a blank tile.
    if (path === "/v1/fwi.png") {
      const day = new Date().toISOString().slice(0, 10);
      let img = await env.EWS_KV.get(`fwi:${day}`, "arrayBuffer");
      if (!img) {
        const r = await fetch(
          `https://maps.effis.emergency.copernicus.eu/effis?service=WMS&version=1.1.1&request=GetMap&layers=mf010.fwi&styles=default&time=${day}&srs=EPSG:4326&bbox=-8.7,18.9,12.0,37.3&width=1024&height=910&format=image/png&transparent=true`,
          { headers: { "user-agent": "radbalek/0.2 (+ews Algeria)", accept: "image/png,*/*" } }
        );
        if (!r.ok) return new Response("effis " + r.status, { status: 502, headers: corsHeaders() });
        img = await r.arrayBuffer();
        await env.EWS_KV.put(`fwi:${day}`, img, { expirationTtl: 86400 });
      }
      return store(new Response(img, {
        headers: corsHeaders({ "content-type": "image/png", "cache-control": "public, max-age=10800" }),
      }));
    }
    if (path === "/v1/ai/chat" && req.method === "POST") return handleChat(req, env);
    if (path === "/v1/ai/category" && req.method === "POST") return handleCategory(req, env);
    if (path === "/v1/weather.json") return store(await handleWeather(env, geo));
    if (path === "/v1/wilayas.json") return handleWilayasList();
    if (path === "/v1/boundaries.json")
      return new Response(JSON.stringify(geo), {
        headers: corsHeaders({ "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=86400" }),
      });
    if (path === "/v1/reports/confirm" && req.method === "POST") return handleConfirmReport(req, env);
    if (path === "/v1/reports.json") return store(await handleListReports(url, env));
    if (path === "/v1/reports.csv") return handleExportCsv(env);

    if (path === "/v1/push-status.json") {
      const raw = (await env.EWS_KV.get("push:last")) || '{"neverRan":true}';
      return new Response(raw, {
        headers: corsHeaders({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }),
      });
    }

    if (path === "/v1/history.json") {
      const listed = await env.EWS_KV.list({ prefix: "s:", limit: 168 }); // last 7 days hourly
      const out = [];
      for (const k of listed.keys) {
        const raw = await env.EWS_KV.get(k.name);
        if (raw) out.push(JSON.parse(raw));
      }
      return store(new Response(JSON.stringify(out), {
        headers: corsHeaders({ "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300" }),
      }));
    }

    return new Response("Rad Balek (رد بالك) ingest — /v1/alerts.json /v1/reports.json /v1/history.json", {
      status: 200,
      headers: corsHeaders(),
    });
  },
};

// doPush: only the scheduled cron pushes — fetch-triggered rebuilds must not,
// or concurrent invocations race on the dedupe map and double-send.
async function refresh(env, doPush = false) {
  const snap = await runPipeline({
    firmsMapKey: env.FIRMS_MAP_KEY || null,
    wilayasGeojson: geo,
  });
  // Best-effort: when the daily KV write quota is exhausted this put throws
  // 429 — that must never kill the push path below (2026-07-19 outage: the
  // whole cron died here for 3h and no alerts went out).
  try {
    await env.EWS_KV.put("latest", JSON.stringify(snap));
  } catch {}
  if (!doPush) return snap;

  // Hourly stats snapshot (newest-first key) — the analyzable time series.
  const now = new Date(snap.generatedAt);
  if (now.getUTCMinutes() < 10) {
    const inv = String(10_000_000_000_000 - now.getTime()).padStart(14, "0");
    try {
      await env.EWS_KV.put(
        `s:${inv}`,
        JSON.stringify({ at: snap.generatedAt, stats: snap.stats, reds: snap.alerts.filter((a) => a.color === "red").map((a) => ({ hazard: a.hazard, wilayas: a.wilayas.map((w) => w.code) })) }),
        { expirationTtl: 60 * 60 * 24 * 365 }
      );
    } catch {}
  }
  // Push new orange/red alerts to FCM topics (no-op until FIREBASE_SA secret exists).
  // KV write budget (1k/day free): only persist the status when something
  // happened, plus an hourly heartbeat so /v1/push-status.json stays fresh.
  try {
    const pushSummary = await sendPush(env, snap.notifications, snap.alerts);
    const eventful = pushSummary.sent || pushSummary.heartbeats || pushSummary.allclear || (pushSummary.errors || []).length;
    if (eventful || now.getUTCMinutes() < 10) {
      try {
        await env.EWS_KV.put("push:last", JSON.stringify({ at: snap.generatedAt, ...pushSummary }));
      } catch {}
    }
  } catch (err) {
    try {
      await env.EWS_KV.put("push:last", JSON.stringify({ at: snap.generatedAt, fatal: String(err.message) }));
    } catch {}
  }
  return snap;
}
