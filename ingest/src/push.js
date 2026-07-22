// FCM HTTP v1 push, topic-based. Runs on Cloudflare Workers and Node 18+
// (WebCrypto). Needs a Firebase service-account JSON in env.FIREBASE_SA.
//
// Policy (alert-fatigue best practice):
//   yellow  -> never pushed (in-app only)
//   orange  -> normal push
//   red     -> high-priority push (dedicated channel; DND-bypass client-side)
// Dedupe: KV key sent:{alertId} (3-day TTL) so the 10-min cron never re-sends.

import { wilayaByCode } from "./wilayas.js";

const SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
// Free-plan Workers allow 50 subrequests/invocation; the pipeline uses ~10.
// One KV round-trip for the whole dedupe map keeps sends at 1 subrequest each.
const MAX_SENDS_PER_CYCLE = 30;
const SENT_TTL_MS = 3 * 24 * 3600 * 1000;

// Crisis heartbeat: while a RED alert is active, re-notify its topics every
// 3h with a rotating recommendation (max 4 heartbeats). Orange channel —
// present without re-piercing DND; the initial red already did.
const HB_INTERVAL_MS = 3 * 3600 * 1000;
const HB_MAX = 4;
const HB_RECS = {
  heat: [
    ["Buvez de l'eau régulièrement, même sans soif", "اشرب الماء بانتظام حتى دون عطش"],
    ["Évitez le soleil entre 11h et 17h", "تجنب الشمس بين 11:00 و17:00"],
    ["Vérifiez les personnes âgées et isolées", "اطمئن على كبار السن والمعزولين"],
    ["De l'eau et de l'ombre pour les animaux", "وفّر الماء والظل للحيوانات"],
  ],
  flood: [
    ["Ne traversez jamais un oued en crue", "لا تعبر واديًا في حالة فيضان أبدًا"],
    ["Éloignez-vous des zones basses", "ابتعد عن المناطق المنخفضة"],
  ],
  storm: [["Restez à l'abri, loin des arbres", "ابقَ في مأمن بعيدًا عن الأشجار"]],
  fire: [["Préparez-vous à évacuer si demandé", "استعد للإخلاء إذا طُلب منك"]],
  quake: [["Attention aux répliques — restez prudents", "انتبه للهزات الارتدادية"]],
  other: [["Suivez les consignes des autorités", "اتبع تعليمات السلطات"]],
};

const b64url = (buf) =>
  btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlJson = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));

function pemToDer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}

export async function getAccessToken(sa, env) {
  const cached = env ? await env.EWS_KV.get("fcm_token") : null;
  if (cached) return cached;
  const iat = Math.floor(Date.now() / 1000);
  const unsigned =
    b64urlJson({ alg: "RS256", typ: "JWT" }) +
    "." +
    b64urlJson({ iss: sa.client_email, scope: SCOPE, aud: sa.token_uri, iat, exp: iat + 3600 });
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = unsigned + "." + b64url(sig);
  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`,
  });
  if (!res.ok) throw new Error(`token exchange HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const tok = (await res.json()).access_token;
  // Cache is best-effort: a quota-exhausted put must not block the send.
  if (env) {
    try {
      await env.EWS_KV.put("fcm_token", tok, { expirationTtl: 3300 });
    } catch {}
  }
  return tok;
}

function messageFor(alert, topic) {
  const color = alert.color;
  const data = {
    kind: "alert",
    alertId: String(alert.id),
    hazard: String(alert.hazard),
    color: String(color),
    severity: String(alert.severity || ""),
    wilayas: alert.wilayas.map((w) => w.code).join(","),
    headline_fr: alert.headline.fr,
    headline_ar: alert.headline.ar,
    headline_en: alert.headline.en,
    onset: String(alert.onset || ""),
    expires: String(alert.expires || ""),
    // Short spoken lines the native AlertActivity reads aloud (AR + FR).
    spoken_fr: `Alerte rouge. ${alert.headline.fr}. Suivez les consignes, et appelez le 14.`,
    spoken_ar: `تحذير أحمر. ${alert.headline.ar}. اتبعوا التعليمات واتصلوا بالرقم 14.`,
  };
  // RED is DATA-ONLY: the app's native RbMessagingService displays it itself
  // (forced alarm volume, full-screen intent, insistent siren) — channel-sound
  // suppression by OEMs (OxygenOS silent mode) made system display unreliable.
  if (color === "red") {
    return {
      message: {
        topic,
        data,
        android: { priority: "HIGH" },
        apns: {
          headers: { "apns-priority": "10" },
          payload: { aps: { "content-available": 1, sound: "default", "interruption-level": "time-sensitive" } },
        },
      },
    };
  }
  return {
    message: {
      topic,
      notification: { title: alert.headline.fr, body: alert.headline.ar },
      data,
      android: {
        priority: "HIGH",
        notification: {
          channel_id: "orange_s2",
          sound: "default",
          notification_priority: "PRIORITY_HIGH",
        },
      },
      apns: {
        headers: { "apns-priority": "10" },
        payload: { aps: { sound: "default", "interruption-level": "active" } },
      },
    },
  };
}

// notifications: [{topic, alertId}] from the pipeline; alerts: snapshot alerts.
export async function sendPush(env, notifications, alerts) {
  const summary = { sent: 0, deduped: 0, yellowSkipped: 0, errors: [] };
  if (!env.FIREBASE_SA) return { ...summary, disabled: true };
  let sa;
  try {
    sa = JSON.parse(env.FIREBASE_SA);
  } catch {
    return { ...summary, errors: [{ error: "FIREBASE_SA is not valid JSON" }] };
  }
  const byId = new Map(alerts.map((a) => [a.id, a]));
  const now = Date.now();
  const sentRaw = (await env.EWS_KV.get("sentmap")) || "{}";
  let sentMap = {};
  try {
    sentMap = JSON.parse(sentRaw);
  } catch {}
  for (const k of Object.keys(sentMap)) if (sentMap[k] < now) delete sentMap[k];

  // Red-first: a life-critical red must never be starved by orange pushes that
  // reach MAX_SENDS_PER_CYCLE before it (e.g. a quake red appended last behind
  // 30 orange ONM topics).
  const ordered = [...notifications].sort(
    (a, b) => (byId.get(a.alertId)?.color === "red" ? 0 : 1) - (byId.get(b.alertId)?.color === "red" ? 0 : 1)
  );

  let token = null;
  for (const n of ordered) {
    if (summary.sent >= MAX_SENDS_PER_CYCLE) break;
    const alert = byId.get(n.alertId);
    if (!alert) continue;
    if (alert.color === "yellow") {
      summary.yellowSkipped++;
      continue;
    }
    // Content-based key: ONM re-issues identical alerts under new ids each
    // publication batch — topic + validity window is the stable identity.
    // Severity escalation changes the topic, so it still pushes (desired).
    const sentKey = `${n.topic}:${alert.onset || ""}:${alert.expires || ""}`;
    if (sentMap[sentKey]) {
      summary.deduped++;
      continue;
    }
    try {
      token = token || (await getAccessToken(sa, env));
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify(messageFor(alert, n.topic)),
      });
      if (!res.ok) throw new Error(`FCM HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
      summary.sent++;
      sentMap[sentKey] = now + SENT_TTL_MS;
    } catch (err) {
      summary.errors.push({ topic: n.topic, error: String(err.message).slice(0, 200) });
      if (summary.errors.length >= 5) break; // credentials/API/limit problem — stop the cycle
    }
  }
  // --- crisis heartbeats for still-active red alerts ---
  summary.heartbeats = 0;
  for (const a of alerts) {
    if (summary.sent + summary.heartbeats >= MAX_SENDS_PER_CYCLE) break;
    if (a.color !== "red" || !a.onset) continue;
    if (a.expires && Date.parse(a.expires) < now) continue;
    const slot = Math.floor((now - Date.parse(a.onset)) / HB_INTERVAL_MS);
    if (slot < 1 || slot > HB_MAX) continue;
    const recs = HB_RECS[a.hazard] || HB_RECS.other;
    const [recFr, recAr] = recs[(slot - 1) % recs.length];
    for (const w of a.wilayas) {
      const topic = `w${w.code}_${a.hazard}_red`;
      const hbKey = `hb:${topic}:${a.onset}:${slot}`;
      if (sentMap[hbKey]) continue;
      try {
        token = token || (await getAccessToken(sa, env));
        const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify({
            message: {
              topic,
              notification: {
                title: `⏰ ${a.headline.fr} — toujours actif`,
                body: `${recFr} · ${recAr}`,
              },
              data: { kind: "heartbeat", alertId: String(a.id), color: "red", hazard: String(a.hazard) },
              android: { priority: "HIGH", notification: { channel_id: "orange_s2", sound: "default" } },
            },
          }),
        });
        if (!res.ok) throw new Error(`FCM HTTP ${res.status}`);
        summary.heartbeats++;
        sentMap[hbKey] = now + SENT_TTL_MS;
      } catch (err) {
        summary.errors.push({ topic, error: String(err.message).slice(0, 120) });
        if (summary.errors.length >= 5) break;
      }
    }
  }

  // --- all-clear: topics active last cycle but no longer alerting → green ---
  summary.allclear = 0;
  const currentTopics = new Set(notifications.map((n) => n.topic));
  const prevRaw = (await env.EWS_KV.get("activetopics")) || "[]";
  let prevTopics = [];
  try {
    prevTopics = JSON.parse(prevRaw);
  } catch {}
  const HAZ = {
    heat: ["Canicule", "موجة الحر"],
    storm: ["Orages", "العواصف الرعدية"],
    wind: ["Vent fort", "الرياح القوية"],
    sandstorm: ["Tempête de sable", "العاصفة الرملية"],
    flood: ["Inondations", "الفيضانات"],
    fire: ["Feu de forêt", "حريق الغابة"],
    quake: ["Séisme", "الزلزال"],
    other: ["Alerte", "التحذير"],
  };
  for (const topic of prevTopics.filter((t) => !currentTopics.has(t)).slice(0, 20)) {
    const m = topic.match(/^w(\d+)_(\w+)_(\w+)$/);
    if (!m) continue;
    const [, code, hazard] = m;
    const w = wilayaByCode(Number(code));
    const [hFr, hAr] = HAZ[hazard] || HAZ.other;
    try {
      token = token || (await getAccessToken(sa, env));
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          message: {
            topic,
            notification: {
              title: `✅ Fin d'alerte — ${w ? w.fr : "Algérie"}`,
              body: `${hFr} terminée · انتهى تحذير ${hAr}`,
            },
            data: { kind: "allclear", hazard: String(hazard) },
            android: { priority: "HIGH", notification: { channel_id: "allclear_s2", sound: "default" } },
          },
        }),
      });
      if (res.ok) summary.allclear++;
    } catch (err) {
      summary.errors.push({ topic, error: "allclear " + String(err.message).slice(0, 100) });
    }
  }
  // Write-on-change only: most cycles nothing moved, and KV writes are the
  // metered resource (1k/day free) — not reads.
  try {
    const topicsOut = JSON.stringify([...currentTopics]);
    if (topicsOut !== prevRaw) await env.EWS_KV.put("activetopics", topicsOut);

    const sentOut = JSON.stringify(sentMap);
    if (sentOut !== sentRaw) await env.EWS_KV.put("sentmap", sentOut);
  } catch {} // dedupe persistence is best-effort — never fail the cycle
  return summary;
}
