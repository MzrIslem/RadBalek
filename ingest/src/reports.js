// Community reports ("Signaler"): citizens flag dangers to people, vegetation
// and animals. Stored in KV today (works with current token permissions);
// the data model is flat and export-friendly so it can migrate to D1 (SQL)
// unchanged — see README "Analytics".
//
// Endpoints (all CORS-open):
//   POST /v1/reports                {category, lat?, lon?, wilaya?, description?, lang?}
//   POST /v1/reports/confirm        {id}
//   GET  /v1/reports.json?limit=100
//   GET  /v1/reports.csv            full export for analysis
//   GET  /v1/wilayas.json           the 58 wilayas (code, fr, ar)

import { WILAYAS, wilayaByCode } from "./wilayas.js";
import { makeWilayaResolver } from "./geo.js";

export const CATEGORIES = ["fire", "smoke", "road", "flood", "animal", "heat", "other"];
const MAX_PER_HOUR = 5;
const SALT = "radbalek-v1";

// Newest-first lexicographic key: inverse epoch millis, zero-padded.
function reportKey(now, rand) {
  const inv = String(10_000_000_000_000 - now.getTime()).padStart(14, "0");
  return `r:${inv}:${rand}`;
}

async function clientKey(request) {
  const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(SALT + ip));
  return [...new Uint8Array(buf.slice(0, 8))].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function corsHeaders(extra = {}) {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    ...extra,
  };
}

const json = (obj, status = 200, extra = {}) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: corsHeaders({ "content-type": "application/json; charset=utf-8", ...extra }),
  });

export async function handleWilayasList() {
  return json(WILAYAS.map((w) => ({ code: w.code, fr: w.fr, ar: w.ar })), 200, {
    "cache-control": "public, max-age=86400",
  });
}

export async function handleCreateReport(request, env, wilayasGeojson, now = new Date()) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const category = String(body.category || "");
  if (!CATEGORIES.includes(category)) return json({ error: "bad category" }, 400);

  const ck = await clientKey(request);
  const rl = Number((await env.EWS_KV.get(`rl:${ck}`)) || 0);
  if (rl >= MAX_PER_HOUR) return json({ error: "rate limit" }, 429);

  let wilaya = null;
  // Number(null) === 0, so null must be rejected before coercion.
  let lat = body.lat === null || body.lat === undefined ? NaN : Number(body.lat);
  let lon = body.lon === null || body.lon === undefined ? NaN : Number(body.lon);
  const inDz = lat >= 18.9 && lat <= 37.3 && lon >= -8.7 && lon <= 12.0;
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !inDz) lat = lon = null;
  if (lat !== null) {
    const resolved = makeWilayaResolver(wilayasGeojson)(lat, lon);
    if (resolved) wilaya = resolved.code;
    lat = Math.round(lat * 1000) / 1000; // ~110 m — enough to act on, coarse enough for privacy
    lon = Math.round(lon * 1000) / 1000;
  }
  if (!wilaya && body.wilaya) {
    const w = wilayaByCode(Number(body.wilaya));
    if (w) wilaya = w.code;
  }
  if (!wilaya && lat === null) return json({ error: "need wilaya or position" }, 400);

  const report = {
    id: reportKey(now, Math.random().toString(36).slice(2, 6)),
    at: now.toISOString(),
    category,
    wilaya,
    lat,
    lon,
    description: String(body.description || "").slice(0, 280).replace(/[<>]/g, ""),
    lang: ["fr", "ar", "en"].includes(body.lang) ? body.lang : "fr",
    status: "new",
    confirms: 0,
    ck,
  };
  await env.EWS_KV.put(report.id, JSON.stringify(report), { expirationTtl: 60 * 60 * 24 * 180 });
  try {
    await env.EWS_KV.put(`rl:${ck}`, String(rl + 1), { expirationTtl: 3600 });
  } catch {} // counter is best-effort — the report is already stored
  const { ck: _omit, ...pub } = report;
  return json({ ok: true, report: pub }, 201);
}

export async function handleConfirmReport(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const id = String(body.id || "");
  if (!/^r:\d{14}:[a-z0-9]+$/.test(id)) return json({ error: "bad id" }, 400);
  const raw = await env.EWS_KV.get(id);
  if (!raw) return json({ error: "not found" }, 404);
  const ck = await clientKey(request);
  const marker = `rc:${id}:${ck}`;
  if (await env.EWS_KV.get(marker)) return json({ ok: true, already: true });
  const report = JSON.parse(raw);
  if (report.ck === ck) return json({ ok: true, own: true }); // no self-confirm
  report.confirms += 1;
  if (report.confirms >= 3) report.status = "community-confirmed";
  await env.EWS_KV.put(id, JSON.stringify(report), { expirationTtl: 60 * 60 * 24 * 180 });
  try {
    await env.EWS_KV.put(marker, "1", { expirationTtl: 60 * 60 * 24 * 30 });
  } catch {} // marker is best-effort — worst case a re-confirm later
  return json({ ok: true, confirms: report.confirms, status: report.status });
}

async function listReports(env, limit) {
  const listed = await env.EWS_KV.list({ prefix: "r:", limit });
  const out = [];
  for (const k of listed.keys) {
    const raw = await env.EWS_KV.get(k.name);
    if (!raw) continue;
    const { ck: _omit, ...pub } = JSON.parse(raw);
    out.push(pub);
  }
  return out;
}

export async function handleListReports(url, env) {
  const limit = Math.min(Number(url.searchParams.get("limit") || 100), 200);
  const reports = await listReports(env, limit);
  return json({ count: reports.length, reports }, 200, { "cache-control": "no-store" });
}

export async function handleExportCsv(env) {
  const reports = await listReports(env, 1000);
  const esc = (v) => (v === null || v === undefined ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v));
  const rows = [
    "id,at,category,wilaya,lat,lon,description,lang,status,confirms",
    ...reports.map((r) => [r.id, r.at, r.category, r.wilaya, r.lat, r.lon, r.description, r.lang, r.status, r.confirms].map(esc).join(",")),
  ];
  return new Response(rows.join("\n"), {
    headers: corsHeaders({
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="radbalek-reports.csv"',
    }),
  });
}
