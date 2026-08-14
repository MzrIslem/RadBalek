// Dead-man switch: the creator gets pushed when the backend degrades or dies.
//
// A watchdog cannot live only inside the thing it watches — if the cron stops
// firing, any in-cron check stops with it. So there are two detectors:
//   (1) watchPipeline — runs IN the cron, catches degradation (a source down,
//       push throwing) while the system is otherwise alive.
//   (2) watchStale    — runs on the FETCH path, catches total death. App
//       traffic is the heartbeat: if the snapshot is older than the cron
//       interval, the cron is gone and nobody else would notice.
//
// Both are rate-limited to one push per hour per kind — the KV free tier meters
// writes (1k/day), and a flapping source must not become a write storm.
import { getAccessToken } from "./push.js";
import { logSwallowed } from "./log.js";

const ADMIN_TOPIC = "admin";
const COOLDOWN_S = 3600;
const STALE_MS = 35 * 60 * 1000; // cron is every 10 min — 35 means it missed 3

async function notifyAdmin(env, kind, title, body) {
  if (!env.FIREBASE_SA) return false;
  const flag = `wd:${kind}`;
  try {
    if (await env.EWS_KV.get(flag)) return false; // already alerted this hour
  } catch (err) {
    logSwallowed(`watchdog:cooldown ${kind}`, err);
    return false;
  }
  try {
    const sa = JSON.parse(env.FIREBASE_SA);
    const at = await getAccessToken(sa, env);
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: "POST",
      headers: { authorization: `Bearer ${at}`, "content-type": "application/json" },
      body: JSON.stringify({
        message: {
          topic: ADMIN_TOPIC,
          notification: { title, body: String(body).slice(0, 200) },
          // Audible but NOT the red siren — a backend outage is urgent for the
          // maintainer, it is not a civil emergency.
          android: { priority: "HIGH", notification: { channel_id: "orange_s2" } },
          data: { kind: "admin", watchdog: String(kind) },
        },
      }),
    });
    // Don't claim success (and don't burn the 1h cooldown) on a failed send —
    // that suppressed the retry for an hour while reporting delivered.
    if (!res.ok) return false;
    try {
      await env.EWS_KV.put(flag, "1", { expirationTtl: COOLDOWN_S });
    } catch (err) {
      logSwallowed(`watchdog:cooldown put ${kind}`, err); // worst case one extra push
    }
    return true;
  } catch (err) {
    logSwallowed(`watchdog:notify ${kind}`, err);
    return false; // never let the watchdog break the cron
  }
}

// (1) Degradation — called at the end of each cron run.
export async function watchPipeline(env, snap, pushSummary) {
  try {
    const errors = snap.errors || [];
    const names = errors.map((e) => e.source);
    // ONM is the only OFFICIAL vigilance source; losing it is a real outage,
    // not degradation — every other source is corroboration.
    if (names.includes("onm")) {
      const e = errors.find((x) => x.source === "onm");
      await notifyAdmin(env, "onm", "⚠️ Rad Balek — ONM en panne",
        `La source officielle ONM échoue : ${e && e.error ? e.error : "erreur inconnue"}`);
    } else if (names.length >= 4) {
      await notifyAdmin(env, "sources", "⚠️ Rad Balek — sources en panne",
        `${names.length}/7 sources échouent : ${names.join(", ")}`);
    }
    // A cycle where EVERY send failed does not throw — sendPush returns
    // normally with a populated errors[] and no `fatal`, so this was completely
    // invisible: up to 55 min of total delivery blackout with nobody paged.
    if (pushSummary && (pushSummary.fatal || (!pushSummary.sent && (pushSummary.errors || []).length >= 3))) {
      await notifyAdmin(env, "push", "🔴 Rad Balek — envoi des alertes en panne",
        pushSummary.fatal || `0 envoyé, ${(pushSummary.errors || []).length} erreurs : ${JSON.stringify((pushSummary.errors || []).slice(0, 2))}`);
    }
    // A lost or unsaved dedupe map re-sends every alert of this cycle on the
    // next one: the red siren fires again on phones that already rang, and
    // nothing in the delivery counters looks wrong. Page on it.
    if (pushSummary && (pushSummary.dedupeLost || pushSummary.dedupeUnsaved)) {
      await notifyAdmin(env, "dedupe", "⚠️ Rad Balek — anti-doublon perdu",
        `sentmap indisponible (${pushSummary.dedupeLost || pushSummary.dedupeUnsaved}) : les alertes déjà envoyées risquent de re-sonner.`);
    }
    // ONM parsed but yielded nothing = markup drift. This is also the exact
    // state that used to fire a false all-clear to every wilaya.
    if (snap.stats && snap.stats.onmEntries > 0 && snap.stats.activeAlerts === 0) {
      await notifyAdmin(env, "parse", "⚠️ Rad Balek — flux ONM illisible",
        `${snap.stats.onmEntries} entrées, 0 alerte active — le parsing a dérivé.`);
    }
  } catch (err) {
    logSwallowed("watchdog:pipeline", err);
  }
}

// (2) Total death — called from the fetch path, where app traffic is the pulse.
export async function watchStale(env, generatedAt) {
  try {
    const age = Date.now() - Date.parse(generatedAt);
    if (!(age > STALE_MS)) return;
    await notifyAdmin(env, "stale", "🔴 Rad Balek — collecte arrêtée",
      `Aucune collecte depuis ${Math.round(age / 60000)} min : le cron ne tourne plus.`);
  } catch (err) {
    logSwallowed("watchdog:stale", err);
  }
}
