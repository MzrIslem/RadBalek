// Morning briefing push (rain arc v1.3.0). Separate from sendPush by design:
// sendPush is alert-flow-coupled (notifications list, heartbeats, all-clear
// diff over activetopics) — none of that applies to a scheduled digest.
//
// Semantics:
//   - Sent once per DZ calendar day at 06:30 local (05:30Z, UTC+1, no DST).
//   - Topic b{code} per wilaya; subscription is OPT-IN in the app (default
//     OFF), so a push here only ever lands on users who asked for it.
//   - b{code} never matches the all-clear regex ^w(\d+)_(\w+)_(\w+)$ and is
//     never written to activetopics — the alert diff machinery can't touch it.
//   - Content: active alerts for the wilaya + today's rain signature (max
//     precip probability, gusts, storm CAPE) + fire danger when high+.
//     Bilingual fr · ar body, ≤ ~200 chars (all-clear precedent).
//   - KV briefing:{date} is BOTH dedupe and progress: a cycle is capped at
//     MAX_BRIEF_PER_CYCLE FCM sends (50-subrequest free-tier ceiling is
//     already tight after sendPush), with {sent:[codes]} persisted so the
//     next cron minute resumes. TTL 26h > one day.
import { getAccessToken } from "./push.js";
import { WILAYAS, wilayaByCode } from "./wilayas.js";

const MAX_BRIEF_PER_CYCLE = 20;

// Pure: the fr/ar strings for one wilaya's briefing. Exposed for tests.
// snap = pipeline snapshot; wx = the KV-cached /v1/weather.json payload.
export function buildBriefing(snap, wx, code) {
  const w = wilayaByCode(code);
  const name = w ? w.fr : "Algérie";
  const acts = (snap?.alerts || []).filter((a) => a.wilayas.some((x) => x.code === code));
  const parts = [];
  const worst = acts.find((a) => a.color === "red") ? "red" : acts.find((a) => a.color === "orange") ? "orange" : null;
  if (acts.length) {
    const hz = [...new Set(acts.map((a) => a.hazard))].slice(0, 2).join(", ");
    parts.push(`${acts.length} alerte(s) ${worst === "red" ? "🔴" : "🟠"} (${hz})`);
  } else {
    parts.push("Aucune alerte 🟢");
  }
  const entry = (wx?.wilayas || []).find((x) => x.code === code);
  const r = entry?.r?.today;
  if (r) {
    if (r.pp != null && r.pp >= 30) parts.push(`pluie ${r.pp}%`);
    if (r.gust != null && r.gust >= 50) parts.push(`rafales ${Math.round(r.gust)} km/h`);
    if (r.cape != null && r.cape >= 800) parts.push(`orages`);
    if (r.vis != null && r.vis < 2) parts.push(`visibilité ${r.vis} km`);
  }
  const fire = entry?.fire;
  if (fire && ["high", "veryHigh", "extreme", "veryExtreme"].includes(fire.class)) parts.push("feu 🔥");
  const fr = parts.join(" · ");
  // Arabic mirror of the same signals (concise, non-technical register).
  const arParts = [];
  if (acts.length) {
    arParts.push(`${acts.length} تحذير ${worst === "red" ? "🔴" : "🟠"}`);
  } else {
    arParts.push("لا تحذيرات 🟢");
  }
  if (r) {
    if (r.pp != null && r.pp >= 30) arParts.push(`أمطار ${r.pp}%`);
    if (r.gust != null && r.gust >= 50) arParts.push(`هبات ريح ${Math.round(r.gust)} كم/س`);
    if (r.cape != null && r.cape >= 800) arParts.push("عواصف");
  }
  if (fire && ["high", "veryHigh", "extreme", "veryExtreme"].includes(fire.class)) arParts.push("خطر حريق 🔥");
  return {
    title: `🌤️ Briefing — ${name}`,
    fr,
    ar: arParts.join(" · "),
  };
}

// Gate + progress. Returns null when not due (before 05:30Z, or the day is
// already fully sent). Caller (worker refresh) wraps its own try — a broken
// briefing must never kill the alert pipeline that shares the invocation.
export async function sendBriefing(env, snap) {
  if (!env.FIREBASE_SA) return { skipped: "no FIREBASE_SA" };
  const now = new Date(snap?.generatedAt || Date.now());
  // DZ is UTC+1 year-round (no DST). 06:30 DZ == 05:30Z.
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  if (utcMinutes < 5 * 60 + 30) return { skipped: "before 05:30Z" };
  const date = now.toISOString().slice(0, 10);
  const kvKey = `briefing:${date}`;

  let prog = { sent: [] };
  try {
    prog = JSON.parse((await env.EWS_KV.get(kvKey)) || "null") || { sent: [] };
  } catch {}
  if (prog.done) return { skipped: "already sent today" };

  let wx = null;
  try {
    wx = JSON.parse((await env.EWS_KV.get("weather")) || "null");
  } catch {}

  // All 58 wilayas, sending only to codes not yet covered today. If nobody
  // anywhere subscribed to b{code} FCM still bills the request but delivers
  // zero — acceptable (1 subrequest) and self-limiting through the sent map.
  const codes = WILAYAS.map((w) => w.code);
  const todo = codes.filter((c) => !prog.sent.includes(c)).slice(0, MAX_BRIEF_PER_CYCLE);
  if (!todo.length) return { skipped: "nothing to send" };

  let sa;
  try {
    sa = JSON.parse(env.FIREBASE_SA);
  } catch {
    return { errors: ["FIREBASE_SA is not valid JSON"] };
  }
  let sent = 0;
  const errors = [];
  for (const code of todo) {
    if (sent >= MAX_BRIEF_PER_CYCLE) break;
    const b = buildBriefing(snap, wx, code);
    try {
      const token = await getAccessToken(sa, env);
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          message: {
            topic: `b${code}`,
            notification: { title: b.title, body: `${b.fr} · ${b.ar}` },
            data: { kind: "briefing", code: String(code) },
            android: { priority: "NORMAL", notification: { channel_id: "briefing_s2" } },
          },
        }),
      });
      if (!res.ok) throw new Error(`FCM HTTP ${res.status}`);
      sent++;
      prog.sent.push(code);
    } catch (err) {
      errors.push({ code, error: String(err.message).slice(0, 120) });
      if (errors.length >= 5) break;
    }
  }
  // Done only when every wilaya is banked in the sent map. Failed codes stay
  // unsent so the next cron minute retries them (KV TTL 26h self-heals a
  // stuck day); the 5-error budget above already breaks pathological loops.
  prog.done = prog.sent.length >= codes.length;
  // Progress write is the dedupe — guarded, and a failed put must NOT make
  // tomorrow resent today's briefings (the 26h TTL self-heals either way).
  try {
    await env.EWS_KV.put(kvKey, JSON.stringify(prog), { expirationTtl: 26 * 3600 });
  } catch {}
  return { sent, errors };
}
