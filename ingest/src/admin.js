// Curator + utility endpoints.
//   GET  /v1/admin/reports?key=K          newest 100 reports (all statuses)
//   POST /v1/admin/moderate {key,id,status} status: verified | rejected
//   POST /v1/test-push {token}            self-test notification to one device
// Gemini triage (optional, env.GEMINI_API_KEY): classifies new reports into
// status "auto-ok" | "flagged" before human review. Verified stays human-only.
import { corsHeaders } from "./reports.js";
import { getAccessToken } from "./push.js";

const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: corsHeaders({ "content-type": "application/json; charset=utf-8" }) });

export async function handleAdminList(url, env) {
  if (!env.ADMIN_KEY || url.searchParams.get("key") !== env.ADMIN_KEY) return json({ error: "forbidden" }, 403);
  const listed = await env.EWS_KV.list({ prefix: "r:", limit: 100 });
  const out = [];
  for (const k of listed.keys) {
    const raw = await env.EWS_KV.get(k.name);
    if (raw) out.push(JSON.parse(raw));
  }
  return json({ count: out.length, reports: out });
}

export async function handleModerate(request, env) {
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  if (!env.ADMIN_KEY || b.key !== env.ADMIN_KEY) return json({ error: "forbidden" }, 403);
  if (!["verified", "rejected"].includes(b.status)) return json({ error: "bad status" }, 400);
  const raw = await env.EWS_KV.get(String(b.id || ""));
  if (!raw) return json({ error: "not found" }, 404);
  const report = JSON.parse(raw);
  report.status = b.status;
  await env.EWS_KV.put(report.id, JSON.stringify(report), { expirationTtl: 60 * 60 * 24 * 180 });
  return json({ ok: true, id: report.id, status: report.status });
}

// Gemini Flash first-pass triage — advisory only, never sets "verified".
export async function geminiTriage(env, report) {
  if (!env.GEMINI_API_KEY || !report.description) return null;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${env.GEMINI_API_KEY.trim()}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text:
            `Citizen hazard report from Algeria. Category claimed: ${report.category}. Text (may be Arabic/French/darija): "${report.description}". ` +
            `Reply with exactly one word: OK (plausible hazard report), SPAM (ads/gibberish/insults/jokes), or MISMATCH (real report but wrong category).` }] }],
          generationConfig: { maxOutputTokens: 5, temperature: 0 },
        }),
      }
    );
    if (!res.ok) return null;
    const word = ((await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || "").trim().toUpperCase();
    if (word.startsWith("SPAM")) return "flagged";
    if (word.startsWith("MISMATCH")) return "flagged";
    if (word.startsWith("OK")) return "auto-ok";
    return null;
  } catch {
    return null;
  }
}

// Applied async after report creation; only upgrades status from "new".
export async function triageReport(env, pub) {
  const st = await geminiTriage(env, pub);
  if (!st) return;
  const raw = await env.EWS_KV.get(pub.id);
  if (!raw) return;
  const r = JSON.parse(raw);
  if (r.status === "new") {
    r.status = st;
    await env.EWS_KV.put(r.id, JSON.stringify(r), { expirationTtl: 60 * 60 * 24 * 180 });
  }
}

export async function handleTestPush(request, env, ctx) {
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const token = String(b.token || "");
  if (token.length < 50 || token.length > 400) return json({ error: "bad token" }, 400);
  if (!env.FIREBASE_SA) return json({ error: "push disabled" }, 503);
  const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const rlKey = `tp:${ip}`;
  const n = Number((await env.EWS_KV.get(rlKey)) || 0);
  if (n >= 12) return json({ error: "rate limit" }, 429);
  const sa = JSON.parse(env.FIREBASE_SA);
  const at = await getAccessToken(sa, env);
  try {
    await env.EWS_KV.put(rlKey, String(n + 1), { expirationTtl: 3600 });
  } catch {} // counter is best-effort
  // Delayed 8s: foreground FCM is silent on Android (no channel sound), so the
  // user must have time to LOCK THE SCREEN — then the siren rides the real
  // background path, which is exactly what a real red alert uses.
  const send = async () => {
    await new Promise((r) => setTimeout(r, 8000));
    await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: "POST",
      headers: { authorization: `Bearer ${at}`, "content-type": "application/json" },
      body: JSON.stringify({
        message: {
          token,
          // Data-only RED: exercises the exact native siren path a real red
          // alert uses (forced alarm volume + full-screen + insistent loop).
          data: {
            kind: "self-test",
            color: "red",
            headline_fr: "🔴 Rad Balek — test ✓",
            headline_ar: "التنبيهات تعمل — Vos alertes fonctionnent.",
            alertId: "self-test",
            hazard: "other",
          },
          android: { priority: "HIGH" },
        },
      }),
    });
  };
  if (ctx) ctx.waitUntil(send());
  else await send();
  return json({ ok: true, delayed: 8 });
}

// ?lite=1 projection of the snapshot: ~4x smaller for mobile-data users.
export function liteSnapshot(full) {
  const s = JSON.parse(full);
  return JSON.stringify({
    generatedAt: s.generatedAt,
    stats: s.stats,
    alerts: s.alerts,
    // Keep ALL ground-truth incidents (DGPC fires, roads); cap only satellite clusters.
    incidents: [
      ...(s.incidents || []).filter((i) => i.source !== "firms"),
      ...(s.incidents || []).filter((i) => i.source === "firms").slice(0, 90),
    ].map((i) => ({
      id: i.id,
      source: i.source,
      hazard: i.hazard,
      status: i.status,
      wilayas: i.wilayas,
      commune: i.commune,
      detections: i.detections,
      totalFrp: i.totalFrp,
      corroborated: i.corroborated,
      possibleIndustrial: i.possibleIndustrial,
      lat: i.lat,
      lon: i.lon,
      mag: i.mag,
      observedAt: i.observedAt,
    })),
  });
}
