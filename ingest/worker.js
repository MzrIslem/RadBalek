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
  handleFeedback,
} from "./src/reports.js";
import {
  handleAdminList,
  handleModerate,
  handleTestPush,
  triageReport,
  liteSnapshot,
  adminAuthed,
  handleAdminOverview,
  handleAdminAppLatest,
} from "./src/admin.js";
import { ADMIN_HTML } from "./src/adminui.js";
import { handleWeather } from "./src/weather.js";
import { handleChat, handleCategory } from "./src/ai.js";
import { watchPipeline, watchStale } from "./src/watchdog.js";

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
      // Edge caches are PER-COLO: Algerian traffic spreads over several POPs,
      // so each TTL miss costs a list+N-gets per colo. 600/1800 keeps the
      // read/list fan-out inside the free quota even from 3-4 colos.
      "/v1/reports.json": 600,
      "/v1/reports.csv": 1800, // 1 list + up to 1000 gets — must be cached hard
      "/v1/history.json": 300, // kills the 168-get burst per history open
      "/v1/weather.json": 600,
      // NOTE: /v1/fwi.png and /v1/burnt.png are intentionally NOT edge-cached.
      // MapServer returns errors as 200 + HTML, and an edge-cached error page
      // can't be purged on workers.dev — it froze the fire-risk layer for a
      // day. Their handler validates the PNG and serves from KV (daily) instead.
      "/v1/app.json": 900,
    };
    const cacheable = req.method === "GET" && CACHE_TTL[path];
    // Normalized cache key: pathname + only real params (lite/limit). A junk
    // param (?x=random) no longer bypasses the cache into a KV list+N-get miss,
    // which would drain the free-tier read/list budget (a free-tier DoS).
    const cacheKey = (() => {
      const keep = new URLSearchParams();
      if (url.searchParams.get("lite")) keep.set("lite", "1");
      const lim = url.searchParams.get("limit");
      if (lim && /^\d{1,3}$/.test(lim)) keep.set("limit", lim);
      const q = keep.toString();
      return `https://c${path}${q ? "?" + q : ""}`;
    })();
    if (cacheable) {
      const hit = await caches.default.match(cacheKey);
      if (hit) return hit;
    }
    const store = (resp) => {
      if (cacheable && resp.status === 200) {
        const copy = new Response(resp.clone().body, resp);
        copy.headers.set("cache-control", `public, max-age=${CACHE_TTL[path]}`);
        ctx.waitUntil(caches.default.put(cacheKey, copy));
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
      // Dead-man switch: app traffic is the heartbeat. If the stored snapshot
      // has gone stale the cron is dead — and a dead cron cannot report itself.
      // Regex, not JSON.parse: this runs on a hot path.
      const gen = /"generatedAt":"([^"]+)"/.exec(body);
      if (gen) ctx.waitUntil(watchStale(env, gen[1]));
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
    if (path === "/v1/admin/reports") return handleAdminList(req, url, env);
    if (path === "/v1/admin/moderate" && req.method === "POST") return handleModerate(req, url, env);
    if (path === "/v1/admin/overview") return handleAdminOverview(req, url, env);
    if (path === "/v1/admin/app-latest" && req.method === "POST") return handleAdminAppLatest(req, url, env);
    // Force an immediate pipeline collect (no push — pushes stay cron-only so
    // concurrent invocations can never race the dedupe map and double-send).
    if (path === "/v1/admin/refresh" && req.method === "POST") {
      if (!(await adminAuthed(req, url, env)))
        return new Response(JSON.stringify({ error: "forbidden" }), {
          status: 403,
          headers: corsHeaders({ "content-type": "application/json; charset=utf-8" }),
        });
      try {
        const snap = await refresh(env);
        return new Response(
          JSON.stringify({ ok: true, generatedAt: snap.generatedAt, byColor: snap.stats.byColor, errors: snap.errors.length }),
          { headers: corsHeaders({ "content-type": "application/json; charset=utf-8" }) }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err && err.message) }), {
          status: 500,
          headers: corsHeaders({ "content-type": "application/json; charset=utf-8" }),
        });
      }
    }
    if (path === "/v1/test-push" && req.method === "POST") return handleTestPush(req, env, ctx);
    // EFFIS rasters over Algeria, cached per day.
    //   /v1/fwi.png   Fire Weather Index forecast (danger)
    //   /v1/burnt.png burnt areas this season (what already went up)
    // TIME is mandatory on the FWI layer — without it EFFIS returns a blank tile.
    if (path === "/v1/fwi.png" || path === "/v1/burnt.png") {
      const day = new Date().toISOString().slice(0, 10);
      const burnt = path === "/v1/burnt.png";
      const kvKey = burnt ? `burnt:${day}` : `fwi:${day}`;
      const layer = burnt ? "modis.ba" : "mf010.fwi";
      // MapServer/EFFIS signals failure with HTTP 200 + an HTML body. Guard on
      // the PNG magic bytes so an error page is never cached or served as an
      // "image". Validating the KV read as well lets a previously poisoned
      // cache self-heal on the very next request (no manual purge needed).
      const isPng = (buf) => {
        if (!buf || buf.byteLength < 8) return false;
        const b = new Uint8Array(buf, 0, 8);
        return b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47;
      };
      let img = await env.EWS_KV.get(kvKey, "arrayBuffer");
      if (!isPng(img)) {
        const r = await fetch(
          `https://maps.effis.emergency.copernicus.eu/effis?service=WMS&version=1.1.1&request=GetMap` +
            `&layers=${layer}&styles=default${burnt ? "" : `&time=${day}`}` +
            `&srs=EPSG:4326&bbox=-8.7,18.9,12.0,37.3&width=1024&height=910&format=image/png&transparent=true`,
          { headers: { "user-agent": "radbalek/0.2 (+ews Algeria)", accept: "image/png,*/*" } }
        );
        if (!r.ok) return new Response("effis " + r.status, { status: 502, headers: corsHeaders() });
        const buf = await r.arrayBuffer();
        if (!isPng(buf)) return new Response("effis: non-image response", { status: 502, headers: corsHeaders() });
        img = buf;
        try {
          await env.EWS_KV.put(kvKey, img, { expirationTtl: 86400 });
        } catch {}
      }
      return new Response(img, {
        headers: corsHeaders({ "content-type": "image/png", "cache-control": "public, max-age=10800" }),
      });
    }
    if (path === "/v1/ai/chat" && req.method === "POST") return handleChat(req, env);
    if (path === "/v1/ai/category" && req.method === "POST") return handleCategory(req, env);
    if (path === "/v1/weather.json") return store(await handleWeather(env, geo));
    if (path === "/v1/wilayas.json") return handleWilayasList();
    if (path === "/v1/boundaries.json")
      return new Response(JSON.stringify(geo), {
        headers: corsHeaders({ "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=86400" }),
      });
    // In-app update check: normalizes the latest GitHub release. Publishing a
    // release on GitHub is the ONLY step — every app learns about it within
    // ~30 min (edge cache) with zero server-side bookkeeping.
    if (path === "/v1/app.json") {
      // Latest-release info lives in KV (github.com blocks Worker-egress
      // fetches, and /releases/latest skips pre-releases anyway). Updated at
      // release time with one command:
      //   npx wrangler kv key put "app:latest" '{"version":...}' --namespace-id=<EWS_KV> --remote
      const raw = await env.EWS_KV.get("app:latest");
      return store(new Response(raw || "{}", {
        headers: corsHeaders({ "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=900" }),
      }));
    }
    // App feedback (bugs / ideas / reviews about the app itself — distinct
    // from hazard reports). Private to the admin page, not a public feed.
    if (path === "/v1/feedback" && req.method === "POST") return handleFeedback(req, env);
    if (path === "/v1/reports/confirm" && req.method === "POST") return handleConfirmReport(req, env);
    if (path === "/v1/reports.json") return store(await handleListReports(url, env));
    if (path === "/v1/reports.csv") return store(await handleExportCsv(env));

    if (path === "/v1/push-status.json") {
      const raw = (await env.EWS_KV.get("push:last")) || '{"neverRan":true}';
      return new Response(raw, {
        headers: corsHeaders({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }),
      });
    }

    if (path === "/v1/history.json") {
      // Single rolled-up doc (1 get) — the old list+168-gets fan-out remains
      // only as a one-time fallback until the first hourly cron after deploy.
      let body = await env.EWS_KV.get("history:doc");
      if (!body) {
        const listed = await env.EWS_KV.list({ prefix: "s:", limit: 168 });
        const out = [];
        for (const k of listed.keys) {
          const raw = await env.EWS_KV.get(k.name);
          if (raw) out.push(JSON.parse(raw));
        }
        body = JSON.stringify(out);
      }
      return store(new Response(body, {
        headers: corsHeaders({ "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300" }),
      }));
    }

    return new Response("Rad Balek (رد بالك) ingest — /v1/alerts.json /v1/reports.json /v1/history.json", {
      status: 200,
      headers: corsHeaders(),
    });
  },
};

// Fire-map resilience. FIRMS NRT is slow (15-25s a sensor) and sometimes
// overruns its fetch budget, which used to blank the fire map mid-fire-season.
// On a good cycle we stash the fire incidents; on a skipped cycle we re-inject
// the most recent set (if < 3h old — NRT fires stay valid for hours). The stale
// flag lets the app mark them "last known". Best-effort: never breaks a snapshot.
async function reconcileFires(env, snap) {
  try {
    const fires = (snap.incidents || []).filter((i) => i.source === "firms");
    if (!snap.stats.firmsSkipped) {
      // Fresh FIRMS this cycle (even zero fires is a valid all-clear) — cache it,
      // but WRITE-ON-CHANGE only: the unconditional put burned 144 KV writes/day
      // (14% of the whole 1k budget) re-storing data that changes ~4x/day.
      // `at` is excluded from the comparison (it changes every cycle by design).
      try {
        const body = JSON.stringify(fires);
        let prev = null;
        try {
          prev = JSON.stringify(JSON.parse((await env.EWS_KV.get("firms:last")) || "{}").fires ?? null);
        } catch {}
        if (body !== prev) await env.EWS_KV.put("firms:last", JSON.stringify({ at: snap.generatedAt, fires }));
      } catch {}
      return;
    }
    const raw = await env.EWS_KV.get("firms:last");
    if (!raw) return;
    const cached = JSON.parse(raw);
    const fresh = Date.parse(snap.generatedAt) - Date.parse(cached.at) < 3 * 3600 * 1000;
    if (!fresh || !cached.fires || !cached.fires.length) return;
    for (const f of cached.fires) f.stale = true;
    snap.incidents.push(...cached.fires);
    snap.stats.fireClusters = cached.fires.length;
    snap.stats.incidents = snap.incidents.length;
    snap.stats.firmsFromCache = true;
  } catch {}
}

// doPush: only the scheduled cron pushes — fetch-triggered rebuilds must not,
// or concurrent invocations race on the dedupe map and double-send.
async function refresh(env, doPush = false) {
  const snap = await runPipeline({
    firmsMapKey: env.FIRMS_MAP_KEY || null,
    wilayasGeojson: geo,
  });
  // Keep the fire map alive when this cycle's FIRMS fetch was skipped.
  await reconcileFires(env, snap);
  // Best-effort: when the daily KV write quota is exhausted this put throws
  // 429 — that must never kill the push path below (2026-07-19 outage: the
  // whole cron died here for 3h and no alerts went out).
  try {
    await env.EWS_KV.put("latest", JSON.stringify(snap));
  } catch {}
  if (!doPush) return snap;

  const now = new Date(snap.generatedAt);
  // PUSH FIRST. The hourly analytics block used to run here, with two unguarded
  // statements — and anything that throws before sendPush() silences the whole
  // cycle (the shape of the 2026-07-19 outage). Nothing cosmetic goes above the
  // delivery path; the history write now happens after it, below.
  // KV write budget (1k/day free): only persist the status when something
  // happened, plus an hourly heartbeat so /v1/push-status.json stays fresh.
  try {
    const pushSummary = await sendPush(env, snap.notifications, snap.alerts, snap.errors, snap.stats.onmEntries);
    const eventful = pushSummary.sent || pushSummary.heartbeats || pushSummary.allclear || (pushSummary.errors || []).length;
    if (eventful || now.getUTCMinutes() < 10) {
      try {
        await env.EWS_KV.put("push:last", JSON.stringify({ at: snap.generatedAt, ...pushSummary }));
      } catch {}
    }
    await watchPipeline(env, snap, pushSummary);
  } catch (err) {
    try {
      await env.EWS_KV.put("push:last", JSON.stringify({ at: snap.generatedAt, fatal: String(err.message) }));
    } catch {}
    await watchPipeline(env, snap, { fatal: String(err.message) });
  }

  // Hourly stats snapshot (newest-first key) — the analyzable time series.
  // Deliberately AFTER the push block: this is analytics, and it must never be
  // able to throw its way in front of alert delivery. `now` comes from
  // snap.generatedAt, not wall-clock, so the hourly gate is unchanged.
  try {
    if (now.getUTCMinutes() < 10) {
      const inv = String(10_000_000_000_000 - now.getTime()).padStart(14, "0");
      const entry = { at: snap.generatedAt, stats: snap.stats, reds: snap.alerts.filter((a) => a.color === "red").map((a) => ({ hazard: a.hazard, wilayas: a.wilayas.map((w) => w.code) })) };
      try {
        await env.EWS_KV.put(`s:${inv}`, JSON.stringify(entry), { expirationTtl: 60 * 60 * 24 * 365 });
      } catch {}
      // Rolled-up 7-day doc so /v1/history.json costs 1 get, not list+168 gets.
      try {
        const doc = JSON.parse((await env.EWS_KV.get("history:doc")) || "[]");
        if (!doc.length || doc[0].at !== entry.at) doc.unshift(entry);
        await env.EWS_KV.put("history:doc", JSON.stringify(doc.slice(0, 168)), { expirationTtl: 60 * 60 * 24 * 30 });
      } catch {}
    }
  } catch {}
  return snap;
}
