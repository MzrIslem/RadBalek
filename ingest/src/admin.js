// Curator + utility endpoints.
//   GET  /v1/admin/reports?key=K          newest 100 reports (all statuses)
//   POST /v1/admin/moderate {key,id,status} status: verified | rejected
//   GET  /v1/admin/overview               mission control: snapshot age, sources, push, config
//   POST /v1/admin/app-latest             publish the in-app update banner (KV app:latest)
//   POST /v1/test-push {token}            self-test notification to one device
// AI moderation (optional, env.GEMINI_API_KEY): each new report is reviewed by
// Gemini, which can hide confident spam/abuse and correct a wrong category —
// asynchronously and FAIL-OPEN. In a safety feed the dangerous error is
// suppressing a real report, so anything the AI is unsure about stays visible;
// only "spam"/"rejected" are hidden. Human /admin moderation is the final word.
import { corsHeaders } from "./reports.js";
import { getAccessToken } from "./push.js";
import { geminiGenerate } from "./ai.js";

const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: corsHeaders({ "content-type": "application/json; charset=utf-8" }) });

// Audit fix: the admin key used to ride the URL query, where it leaks into
// logs, browser history and referrers, with unlimited guesses. Now preferred
// via Authorization: Bearer (query kept one release for compatibility), and
// FAILED attempts are rate-limited per IP (10/h) — successful auths cost no
// KV write.
function adminKeyOf(request, url) {
  const m = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  return (m ? m[1] : url.searchParams.get("key")) || "";
}

export async function adminAuthed(request, url, env) {
  if (!env.ADMIN_KEY) return false;
  const ip = request.headers.get("cf-connecting-ip") || "0";
  const rlKey = `adminrl:${ip}`;
  const fails = Number((await env.EWS_KV.get(rlKey)) || 0);
  if (fails >= 10) return false;
  if (adminKeyOf(request, url) === env.ADMIN_KEY) return true;
  try {
    await env.EWS_KV.put(rlKey, String(fails + 1), { expirationTtl: 3600 });
  } catch {}
  return false;
}

export async function handleAdminList(request, url, env) {
  if (!(await adminAuthed(request, url, env))) return json({ error: "forbidden" }, 403);
  // ?kind=feedback lists app feedback (fb:) instead of hazard reports (r:).
  const prefix = url.searchParams.get("kind") === "feedback" ? "fb:" : "r:";
  const listed = await env.EWS_KV.list({ prefix, limit: 100 });
  const out = [];
  for (const k of listed.keys) {
    const raw = await env.EWS_KV.get(k.name);
    if (raw) {
      const item = JSON.parse(raw);
      if (!item.id) item.id = k.name; // feedback rows carry no embedded id
      out.push(item);
    }
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
  // Bearer header preferred; body key kept one release for compatibility.
  const hdr = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  const key = hdr ? hdr[1] : b.key;
  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) return json({ error: "forbidden" }, 403);
  if (!["verified", "rejected"].includes(b.status)) return json({ error: "bad status" }, 400);
  const raw = await env.EWS_KV.get(String(b.id || ""));
  if (!raw) return json({ error: "not found" }, 404);
  const report = JSON.parse(raw);
  report.status = b.status;
  await env.EWS_KV.put(report.id, JSON.stringify(report), { expirationTtl: 60 * 60 * 24 * 180 });
  return json({ ok: true, id: report.id, status: report.status });
}

// Mission-control read: everything the creator needs to know the backend is
// alive, in one authed call — snapshot age, per-source health, last push
// cycle, the published app version and which secrets are configured.
// Cost: 3 KV gets, no list — safe to poll every minute from an open dashboard.
export async function handleAdminOverview(request, url, env) {
  if (!(await adminAuthed(request, url, env))) return json({ error: "forbidden" }, 403);
  const [latestRaw, pushRaw, appRaw] = await Promise.all([
    env.EWS_KV.get("latest"),
    env.EWS_KV.get("push:last"),
    env.EWS_KV.get("app:latest"),
  ]);
  const parse = (s) => {
    try {
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  };
  const snap = parse(latestRaw);
  // Per-source incident counts + freshest observation time.
  const sources = {};
  for (const i of (snap && snap.incidents) || []) {
    const s = sources[i.source] || (sources[i.source] = { count: 0, newest: null });
    s.count++;
    if (i.observedAt && (!s.newest || i.observedAt > s.newest)) s.newest = i.observedAt;
  }
  return json({
    now: new Date().toISOString(),
    generatedAt: snap ? snap.generatedAt : null,
    stats: snap ? snap.stats : null,
    errors: (snap && snap.errors) || [],
    alerts: ((snap && snap.alerts) || []).map((a) => ({
      hazard: a.hazard,
      color: a.color,
      event: a.event,
      wilayas: (a.wilayas || []).length,
      expires: a.expires || null,
    })),
    sources,
    push: parse(pushRaw),
    appLatest: parse(appRaw),
    config: { gemini: !!env.GEMINI_API_KEY, push: !!env.FIREBASE_SA, firms: !!env.FIRMS_MAP_KEY },
  });
}

// Publish the in-app update banner from the dashboard — replaces the release
// ritual step `npx wrangler kv key put "app:latest" ... --remote`. The app
// polls /v1/app.json (edge-cached 900s), so every device sees the banner
// within ~15 min of clicking Publier.
export async function handleAdminAppLatest(request, url, env) {
  if (!(await adminAuthed(request, url, env))) return json({ error: "forbidden" }, 403);
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const version = String(b.version || "").trim();
  if (!/^\d+\.\d+\.\d+$/.test(version)) return json({ error: "version must be x.y.z" }, 400);
  const https = (s) => /^https:\/\/\S+$/.test(s);
  const tag = String(b.tag || "v" + version).trim().slice(0, 60);
  const page = String(b.url || "").trim();
  const apk = String(b.apk || "").trim();
  if (page && !https(page)) return json({ error: "url must be https" }, 400);
  if (apk && !https(apk)) return json({ error: "apk must be https" }, 400);
  const doc = {
    version,
    tag,
    url: page || undefined,
    apk: apk || undefined,
    notes: String(b.notes || "").slice(0, 500) || undefined,
    at: new Date().toISOString(),
  };
  await env.EWS_KV.put("app:latest", JSON.stringify(doc));
  return json({ ok: true, appLatest: doc });
}

const CATS = ["fire", "smoke", "road", "flood", "animal", "heat", "other"];

// Gemini Flash-Lite moderator (~1s). Returns {verdict} or null on any failure.
// The prompt is tuned to KEEP genuine reports even when poorly written — spam
// must be obvious to be removed.
export async function geminiModerate(env, report) {
  if (!env.GEMINI_API_KEY || !report.description) return null;
  const text = String(report.description).slice(0, 400);
  try {
    const out = await geminiGenerate(env, {
      contents: [{ role: "user", parts: [{ text:
        `You moderate citizen hazard reports for an Algerian emergency-warning app. ` +
        `A user submitted category "${report.category}" with text (Arabic, Algerian darija, or French): "${text}". ` +
        `Err strongly toward KEEPING a genuine hazard report even if short, misspelled, in rough darija, or containing a rude word. ` +
        `Classify:\n` +
        `- SPAM = advertising/promotion, insults or harassment of people, vulgar/obscene/sexual language, hate speech, jokes, random gibberish, or anything clearly NOT reporting a real danger. Profanity in Arabic, Algerian darija, or French counts as SPAM ONLY when the message is not a genuine hazard report.\n` +
        `- MISMATCH = a real hazard report but the wrong category; then give the correct one.\n` +
        `- OK = a plausible hazard report — keep it even if it contains a swear word, as long as it describes a real danger.\n` +
        `Reply with ONE token only: OK, or SPAM, or MISMATCH:<category> where <category> is one of ${CATS.join("/")}.` }] }],
      maxTokens: 12,
      temperature: 0,
    });
    const s = (out || "").trim().toUpperCase();
    if (s.startsWith("SPAM")) return { verdict: "spam" };
    if (s.startsWith("MISMATCH")) {
      const cat = (s.split(":")[1] || "").toLowerCase().replace(/[^a-z]/g, "");
      return { verdict: "mismatch", category: CATS.includes(cat) ? cat : null };
    }
    if (s.startsWith("OK")) return { verdict: "ok" };
    return null;
  } catch {
    return null;
  }
}

// Applied async (ctx.waitUntil) after report creation. FAIL-OPEN: on any AI
// failure the report keeps status "new" and stays visible. Only ever acts on a
// still-"new" report, so it never overrides a human or community decision.
export async function triageReport(env, pub) {
  const m = await geminiModerate(env, pub);
  if (!m) return; // AI unavailable/unsure -> report stays "new" and visible
  const raw = await env.EWS_KV.get(pub.id);
  if (!raw) return;
  const r = JSON.parse(raw);
  if (r.status !== "new") return; // don't touch verified/rejected/confirmed
  if (m.verdict === "spam") {
    r.status = "spam"; // hidden from the public feed by listReports()
    r.moderatedBy = "ai";
  } else {
    r.status = "auto-ok";
    if (m.verdict === "mismatch" && m.category && m.category !== r.category) {
      r.categoryOriginal = r.category;
      r.category = m.category; // corrected, still fully visible
    }
  }
  try {
    await env.EWS_KV.put(r.id, JSON.stringify(r), { expirationTtl: 60 * 60 * 24 * 180 });
  } catch {} // KV write best-effort — worst case the report stays "new" (visible)
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
      // Text sources (Algerian press, dgpc.dz) render their own headline,
      // named source and article link — the map-pin sources (FIRMS, quakes)
      // don't need them, so this only fattens a handful of incidents.
      ...(i.source === "press" || i.source === "dgpc-web"
        ? { headline: i.headline, link: i.link, sourceName: i.sourceName }
        : {}),
    })),
  });
}
