// Regression tests for the alert-DELIVERY logic — the exact classes the audit
// found CRITICAL bugs in. Pure functions only, so this runs with the built-in
// Node test runner (`node --test`) — zero dependencies, no Workers/KV mocking.
//
//   npm test        (from ingest/)
//
// If one of these fails, an alert could be MISSED, MIS-ROUTED or DUPLICATED.
// Do not "fix" a failing pin without understanding which real-world alert it
// guards — the comment on each says.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import { hazardFromEvent } from "../src/capfeed.js";
import { severityColor, fcmTopicsFor, normalizeFireCluster } from "../src/normalize.js";
import { makeWilayaResolver, clusterHotspots } from "../src/geo.js";
import { fwiClass } from "../src/fwi.js";
import { fetchFirmsHotspots, withinLastHours, FIRMS_DAY_RANGE, FIRMS_SOURCES } from "../src/firms.js";
import { detectEew, feltRadiusKm, haversineKm } from "../src/quakes.js";
import { adminAuthed } from "../src/auth.js";
import { handleRisk, geminiGenerate } from "../src/ai.js";
import { handleTestPush } from "../src/admin.js";
import { handleWilayasList } from "../src/reports.js";
import { hbSlot } from "../src/push.js";
import { decodeEntities } from "../src/xml.js";
import { parseGdacs, fetchGdacs } from "../src/gdacs.js";
import { normalizeMetar } from "../src/metar.js";
import { rainDays } from "../src/weather.js";
import { buildBriefing } from "../src/briefing.js";

const __dir = dirname(fileURLToPath(import.meta.url));
const geo = JSON.parse(readFileSync(join(__dir, "..", "data", "wilayas.json"), "utf8"));

// The CONTRACT: every hazard the worker can push MUST be a key the app
// subscribes to (app/lib/src/app_state.dart -> `notif`). Missing `cold`/`other`
// here once meant a red Froid/Neige alert reached zero devices.
const APP_SUBSCRIBED = new Set([
  "heat", "storm", "flood", "wind", "sandstorm", "fire", "road", "quake", "cold", "other",
]);

test("hazardFromEvent: real ONM titles all map into the app-subscribed set", () => {
  const titles = [
    ["Canicule", "heat"], ["Heat wave warning", "heat"],
    ["Orages", "storm"], ["Vent fort", "wind"], ["Tempête de sable", "sandstorm"],
    ["Pluies / Inondations", "flood"], ["Neige et froid", "cold"],
    // Titles that match NO regex must fall to "other" — and "other" MUST be
    // subscribed, or fog / high-waves / black-ice reds reach nobody.
    ["Brouillard dense", "other"], ["Fortes vagues", "other"], ["Vague de chaleur", "other"],
  ];
  for (const [title, expected] of titles) {
    const h = hazardFromEvent(title);
    assert.equal(h, expected, `"${title}" -> ${h}, expected ${expected}`);
    assert.ok(APP_SUBSCRIBED.has(h), `hazard "${h}" from "${title}" is NOT in the app-subscribed set`);
  }
});

test("severityColor: ONM ladder, and unknown FAILS OPEN to yellow (never pushed)", () => {
  assert.equal(severityColor("Extreme"), "red");
  assert.equal(severityColor("Severe"), "orange");
  assert.equal(severityColor("Moderate"), "yellow");
  // Pinned on purpose: an unrecognised severity becomes yellow, which is the
  // one colour fcmTopicsFor never pushes. If ONM renames a value, the alert is
  // shown in-app but silent — this test documents that trade-off so a change is
  // a conscious one, not a silent downgrade of a red.
  assert.equal(severityColor("Extrême"), "yellow");
  assert.equal(severityColor(undefined), "yellow");
});

test("fcmTopicsFor: yellow + non-alerts never push; topic format matches the app", () => {
  const w = [{ code: 16 }, { code: 6 }];
  assert.deepEqual(fcmTopicsFor({ class: "incident", color: "red", hazard: "fire", wilayas: w }), []);
  assert.deepEqual(fcmTopicsFor({ class: "alert", color: "yellow", hazard: "heat", wilayas: w }), []);
  // The app subscribes to exactly `w{code}_{hazard}_{color}` (app_state.dart).
  assert.deepEqual(
    fcmTopicsFor({ class: "alert", color: "red", hazard: "heat", wilayas: [{ code: 16 }] }),
    ["w16_heat_red"],
  );
  assert.deepEqual(
    fcmTopicsFor({ class: "alert", color: "orange", hazard: "flood", wilayas: w }),
    ["w16_flood_orange", "w6_flood_orange"],
  );
});

test("resolveWilaya: OFFSHORE epicentres resolve (widened radius), far sea stays null", () => {
  const resolve = makeWilayaResolver(geo);
  // Marine margin — where Algeria's damaging quakes originate. At the default
  // 0.5deg fallback these were NULL, and a null wilaya meant NO red alert.
  assert.equal(resolve(37.05, 5.10), null, "off Bejaia null at default radius");
  assert.equal(resolve(37.05, 5.10, 1.5)?.code, 6, "off Bejaia -> Bejaia at 1.5deg");
  assert.equal(resolve(37.30, 3.06, 1.5)?.code, 16, "off Algiers -> Alger");
  assert.equal(resolve(36.30, -0.70, 1.5)?.code, 31, "off Oran -> Oran");
  // Onshore still resolves with the default radius.
  assert.equal(resolve(36.76, 3.47)?.code, 35, "Boumerdes onshore");
  // Far out to sea must NOT be attributed to a wilaya even when widened.
  assert.equal(resolve(39.5, 4.0, 1.5), null, "far sea stays null");
});

test("FIRMS: never asks for day_range=1 (the nightly blank-fire-map bug)", async () => {
  // FIRMS resolves day_range against the CURRENT UTC date, which has no NRT
  // data until hours into the day: day_range=1 returned an EMPTY CSV every
  // night 00:00-04:00 UTC, blanking the fire map in peak fire season.
  assert.ok(FIRMS_DAY_RANGE >= 2, "day_range must cover yesterday");
  const asked = [];
  const fetchFn = async (url) => {
    asked.push(url);
    return { ok: true, text: async () => "" };
  };
  await fetchFirmsHotspots("KEY", { fetchFn, sources: ["VIIRS_NOAA21_NRT"] });
  assert.equal(asked.length, 1);
  assert.ok(asked[0].endsWith(`/${FIRMS_DAY_RANGE}`), `requested "${asked[0]}" — day_range must be ${FIRMS_DAY_RANGE}`);
});

test("FIRMS: VIIRS_SNPP_NRT is gone before the 2026-11-01 S-NPP sunset", () => {
  // NASA/NESDIS ends ALL S-NPP product delivery on 2026-11-01. Keeping the
  // source would waste a subrequest + log an error every cycle forever after.
  assert.ok(!FIRMS_SOURCES.includes("VIIRS_SNPP_NRT"), "S-NPP must be dropped");
  assert.equal(FIRMS_SOURCES.length, 3, "NOAA-20 + NOAA-21 VIIRS + MODIS remain");
  assert.ok(FIRMS_SOURCES.includes("VIIRS_NOAA20_NRT"), "NOAA-20 remains");
  assert.ok(FIRMS_SOURCES.includes("VIIRS_NOAA21_NRT"), "NOAA-21 remains");
  assert.ok(FIRMS_SOURCES.includes("MODIS_NRT"), "MODIS remains");
});

test("withinLastHours: clips the 2-day fetch, keeps undateable rows", () => {
  const now = new Date("2026-08-12T00:40:00Z");
  const rows = [
    { id: "yesterday-ok", observedAt: "2026-08-11T13:00:00Z" }, // inside 24h
    { id: "too-old", observedAt: "2026-08-10T13:00:00Z" }, // 35h — the extra day we only fetched to survive the gap
    { id: "undateable", observedAt: "not-a-date" }, // keep: never DROP a detection we merely failed to date
  ];
  const kept = withinLastHours(rows, 24, now).map((r) => r.id);
  assert.deepEqual(kept, ["yesterday-ok", "undateable"]);
});

test("fwiClass: EFFIS thresholds are exact (public, defensible scale)", () => {
  assert.equal(fwiClass(5), "low");
  assert.equal(fwiClass(11.2), "moderate");
  assert.equal(fwiClass(21.3), "high");
  assert.equal(fwiClass(38.0), "veryHigh");
  assert.equal(fwiClass(50.0), "extreme");
  assert.equal(fwiClass(70.0), "veryExtreme");
  assert.equal(fwiClass(NaN), null);
});

test("haversineKm: sanity 1deg ~111km at equator", () => {
  assert.ok(Math.abs(haversineKm(0, 0, 0, 1) - 111.2) < 1, "0,0 -> 0,1 ~111km");
  assert.ok(Math.abs(haversineKm(36, 3, 36.5, 3) - 55.6) < 2, "0.5deg lat ~55km");
});

test("feltRadiusKm: conservative magnitude scaling with clamps", () => {
  assert.ok(Math.abs(feltRadiusKm(4.5) - 28.18) < 0.1);
  assert.equal(feltRadiusKm(6.8), 300);
  assert.equal(feltRadiusKm(3), 20);
  assert.equal(feltRadiusKm(NaN), 0);
});

test("detectEew: fires only when estimated S-wave arrival is still in the future", () => {
  const now = new Date("2026-08-27T12:00:00.000Z");
  const at = (msAgo) => new Date(now.getTime() - msAgo).toISOString();
  // M6.8 offshore Boumerdès, 15s after origin: northern wilayas still have a
  // small but real S-wave lead. No-geo fallback uses the northern centroid.
  const near = { mag: 6.8, lat: 36.6, lon: 3.5, time: at(15_000) };
  const r1 = detectEew(near, () => now);
  assert.equal(r1.eew, true, "near should eew");
  assert.ok(r1.warningSeconds >= 1 && r1.warningSeconds <= 120, `warning ${r1.warningSeconds} in 1..120`);
  assert.ok(r1.pWaveSeconds <= r1.sWaveSeconds, "p <= s");
  assert.ok(r1.distanceKm <= 300, "distance <= felt radius");
  // Same event 70s later: the S-wave has already passed the centroid.
  assert.equal(detectEew({ ...near, time: at(70_000) }, () => now).eew, false, "old quake no eew");
  // Far Med event: outside the felt radius.
  assert.equal(detectEew({ mag: 6, lat: 40, lon: 10, time: at(10_000) }, () => now).eew, false, "far Med no eew");
  // Small mag -> false.
  assert.equal(detectEew({ mag: 4.0, lat: 36.5, lon: 3.05, time: at(10_000) }, () => now).eew, false, "M4 no eew");
  // Missing coords -> false.
  assert.equal(detectEew({ mag: 5.2, time: at(10_000) }, () => now).eew, false, "no coords no eew");
  // Very old -> false even if geometry would otherwise work.
  assert.equal(detectEew({ ...near, time: at(601_000) }, () => now).eew, false, "age > 600s no eew");
});

test("detectEew: near-field M<5 with no positive lead is filtered", () => {
  const now = new Date("2026-08-27T12:00:00Z");
  const at = (msAgo) => new Date(now.getTime() - msAgo).toISOString();
  // ~11km from the fallback centroid, 5s after origin: S-wave arrives before a
  // useful 5s warning can be issued for M<5.
  const veryClose = { mag: 4.7, lat: 36.1, lon: 3.0, time: at(5_000) };
  assert.equal(detectEew(veryClose, () => now).eew, false, "4.7 very close should be filtered");
});

test("detectEew: geo targeting returns multi-wilaya positive leads and filters zero lead", () => {
  const now = new Date("2026-08-27T12:00:00Z");
  const square = (lon, lat, code, fr, ar) => ({
    type: "Feature",
    properties: { code, fr, ar },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [lon - 0.1, lat - 0.1],
        [lon + 0.1, lat - 0.1],
        [lon + 0.1, lat + 0.1],
        [lon - 0.1, lat + 0.1],
        [lon - 0.1, lat - 0.1],
      ]],
    },
  });
  const geo2 = {
    type: "FeatureCollection",
    features: [
      square(3, 36, 16, "Alger", "الجزائر"),
      square(4.11, 36, 6, "Béjaïa", "بجاية"),
    ],
  };
  const r = detectEew({ mag: 6.8, lat: 36, lon: 3, time: new Date(now.getTime() - 15_000).toISOString() }, () => now, geo2);
  assert.equal(r.eew, true, "far wilaya should still have lead");
  assert.equal(r.targets.length, 1, "epicentral wilaya has no positive lead");
  assert.equal(r.targets[0].code, 6, "only the ~100km wilaya is warned");
  assert.ok(r.targets[0].warningSeconds >= 10 && r.targets[0].warningSeconds <= 20, `warning ${r.targets[0].warningSeconds} around 14s`);
});

test("adminAuthed: bearer/query accepted, wrong key rejected, repeated failures lock out", async () => {
  const kv = () => {
    const m = new Map();
    return {
      async get(k) { return m.has(k) ? m.get(k) : null; },
      async put(k, v) { m.set(k, v); },
    };
  };
  const env = { ADMIN_KEY: "secret", EWS_KV: kv() };
  const req = (auth) => ({ headers: new Headers(auth ? { authorization: auth } : {}) });
  const bearer = new URL("https://example.test/v1/admin/refresh");
  const query = new URL("https://example.test/v1/admin/refresh?key=secret");
  assert.equal(await adminAuthed(req("Bearer secret"), bearer, env), true);
  assert.equal(await adminAuthed(req(), query, env), true);
  assert.equal(await adminAuthed(req("Bearer nope"), bearer, env), false);
  for (let i = 0; i < 9; i++) {
    assert.equal(await adminAuthed(req("Bearer nope"), bearer, env), false, `failure ${i + 1}`);
  }
  assert.equal(await adminAuthed(req("Bearer secret"), bearer, env), false, "locked out after 10 failures");
});

test("handleRisk: unauthenticated callers are rejected before Gemini", async () => {
  const env = { EWS_KV: { async get() { return null; }, async put() {} } };
  const res = await handleRisk({ headers: new Headers() }, new URL("https://example.test/v1/ai/risk"), env);
  assert.equal(res.status, 403);
});

test("handleTestPush: IP and token rate limits reject before FCM send", async () => {
  const token = "a".repeat(60);
  const req = () =>
    new Request("https://example.test/v1/test-push", {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": "1.2.3.4" },
      body: JSON.stringify({ token }),
    });
  const env = (counts) => ({
    FIREBASE_SA: "{}",
    EWS_KV: {
      async get(k) {
        if (k === "tp:1.2.3.4") return String(counts.ip);
        if (k.startsWith("tpt:")) return String(counts.token);
        return null;
      },
      async put() {},
    },
  });

  assert.equal((await handleTestPush(req(), env({ ip: 12, token: 0 }), null)).status, 429);
  assert.equal((await handleTestPush(req(), env({ ip: 0, token: 3 }), null)).status, 429);
});

// --- v2 additions -----------------------------------------------------------

const H = 3600 * 1000;

test("hbSlot: adaptive heartbeat ladder — 3h fast, then 6h slow through 72h", () => {
  // Multi-day red crises used to lose heartbeats entirely once past 12h
  // (4 slots x 3h). v2: slots 1-3 at 3h (ages 3/6/9h), slots 4-13 on a 6h
  // cadence from 12h (last begins 66h — coverage strictly through 72h),
  // -1 at/after 72h. Slots 1-3 keep the SAME numbering as the old scheme so
  // in-flight KV hb: keys stay valid.
  assert.equal(hbSlot(2.9 * H), 0, "under 3h: too soon (initial push just went)");
  assert.equal(hbSlot(3 * H), 1);
  assert.equal(hbSlot(6 * H), 2);
  assert.equal(hbSlot(9 * H), 3);
  assert.equal(hbSlot(11.9 * H), 3, "still in slot 3 before 12h");
  assert.equal(hbSlot(12 * H), 4, "12h starts the slow cadence");
  assert.equal(hbSlot(13 * H), 4, "slot 4 spans 12-18h");
  assert.equal(hbSlot(66 * H), 13, "last slot begins at 66h");
  assert.equal(hbSlot(71.9 * H), 13, "still slot 13 right before 72h");
  assert.equal(hbSlot(72 * H), -1, "at 72h: stop heartbeating");
  assert.equal(hbSlot(73 * H), -1, "past 72h: stop heartbeating");
});

test("decodeEntities: single-decode pinned, malformed codepoints never throw", () => {
  // The &amp;-last order is CORRECT (single decode). What actually crashed
  // whole sources pre-v2: String.fromCodePoint RangeError on &#0; /
  // &#x110000; — one malformed entity in a feed killed the source's parse.
  assert.equal(decodeEntities("&amp;lt;"), "&lt;", "single decode, not double");
  assert.equal(decodeEntities("&#65;"), "A");
  assert.equal(decodeEntities("&amp;eacute;"), "&eacute;", "single decode of named");
  assert.equal(decodeEntities("&#0;"), "&#0;", "invalid codepoint: raw, no throw");
  assert.equal(decodeEntities("&#x110000;"), "&#x110000;", "out of range hex: raw, no throw");
  assert.equal(decodeEntities("caf&#xe9;"), "café", "hex accent decodes");
});

test("geminiGenerate: thinkingBudget:0 only for non-lite models (the lite 400)", async () => {
  // TECHNICAL.md runbook gotcha: flash-LITE models hard-reject
  // thinkingConfig.thinkingBudget:0 with a 400. v2 guards at the boundary:
  // noThinking:true keeps expressing intent, but lite models never get the
  // config. Captured via fetch monkey-patch; restored in finally.
  const realFetch = globalThis.fetch;
  const seen = [];
  globalThis.fetch = async (url, init) => {
    seen.push(JSON.parse(init.body));
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: "ok" }] } }] }) };
  };
  try {
    const env = { GEMINI_API_KEY: " test " };
    await geminiGenerate(env, { contents: [], noThinking: true, model: "gemini-flash-lite-latest" });
    assert.ok(!("thinkingConfig" in seen[0].generationConfig), "lite model must NOT get thinkingConfig");
    await geminiGenerate(env, { contents: [], noThinking: true, model: "gemini-2.5-flash" });
    assert.ok("thinkingConfig" in seen[1].generationConfig, "full model gets thinkingConfig");
    assert.equal(seen[1].generationConfig.thinkingConfig.thinkingBudget, 0);
    await geminiGenerate(env, { contents: [], noThinking: false, model: "gemini-2.5-flash" });
    assert.ok(!("thinkingConfig" in seen[2].generationConfig), "noThinking:false never sends it");
  } finally {
    globalThis.fetch = realFetch;
  }
});

test("parseGdacs: FL-only, orange-max, DZ-bbox, iscurrent string, wilaya fallback", () => {
  const resolve = makeWilayaResolver(geo);
  const feature = (over) => ({
    bbox: over.bbox,
    geometry: { type: "Point", coordinates: over.coords },
    properties: {
      eventtype: over.type, eventid: over.eventid ?? "1104081", episodeid: over.episodeid ?? "17",
      alertlevel: over.level, iscurrent: over.iscurrent ?? "true",
      fromdate: over.from ?? "2026-09-05T01:00:00", todate: over.to ?? "2026-09-10T01:00:00",
      name: over.name ?? "Flood in Algeria",
      url: { report: "https://www.gdacs.org/report" },
    },
  });
  // (lon, lat) GeoJSON order; point inside Alger, bbox across northern DZ.
  const orangeFlood = feature({ type: "FL", level: "Orange", coords: [3.05, 36.75], bbox: [1, 35, 5, 37.5] });
  const redFlood = feature({ type: "FL", level: "Red", coords: [3.05, 36.75], bbox: [1, 35, 5, 37.5], eventid: "999" });
  const greenFlood = feature({ type: "FL", level: "Green", coords: [3.05, 36.75], bbox: [1, 35, 5, 37.5], eventid: "888" });
  const drought = feature({ type: "DR", level: "Red", coords: [3.05, 36.75], bbox: [1, 35, 5, 37.5], eventid: "777" });
  const farAway = feature({ type: "FL", level: "Orange", coords: [12, 12], bbox: [11, 11, 13, 13], eventid: "666" });
  const notCurrent = feature({ type: "FL", level: "Orange", coords: [3.05, 36.75], bbox: [1, 35, 5, 37.5], eventid: "555", iscurrent: "false" });
  const offshore = feature({ type: "FL", level: "Orange", coords: [4.0, 37.6], bbox: [1, 35, 5, 38], eventid: "444" });

  const { alerts, incidents } = parseGdacs({ features: [orangeFlood, redFlood, greenFlood, drought, farAway, notCurrent, offshore] }, resolve);
  // 3 alerts: the Orange FL, the Red FL (capped to orange — still a pushable
  // orange alert), and the offshore Orange FL (rescued by the 1.5deg
  // fallback). Green → incident; DR/far/iscurrent:"false" → nothing.
  assert.equal(alerts.length, 3, "orange + red-capped + offshore-rescued all alert");
  assert.equal(incidents.length, 1, "green becomes an incident pin only");
  const a = alerts[0];
  assert.equal(a.id, "gdacs:FL:1104081:17");
  assert.equal(a.color, "orange", "GDACS alert colour is always our orange");
  assert.equal(a.hazard, "flood");
  assert.equal(a.class, "alert");
  assert.equal(a.onset, "2026-09-05T01:00:00.000Z", "GDACS no-Z dates parsed as UTC");
  assert.equal(a.expires, "2026-09-10T01:00:00.000Z");
  assert.equal(a.wilayas.length, 1);
  assert.ok(a.headline.fr.includes("Inondation"), "fr headline");
  assert.ok(a.headline.ar.includes("فيضان"), "ar headline");
  // Red GDACS is capped to orange (never our red) — separate alert object.
  const red = parseGdacs({ features: [redFlood] }, resolve).alerts[0];
  assert.equal(red.color, "orange", "GDACS Red capped to our orange");
  assert.equal(red.id, "gdacs:FL:999:17", "event id in the alert id");
  // Green → incident pin, no push.
  const g = parseGdacs({ features: [greenFlood] }, resolve);
  assert.equal(g.alerts.length, 0);
  assert.equal(g.incidents.length, 1);
  assert.equal(g.incidents[0].hazard, "flood");
  // Non-FL skipped entirely.
  assert.equal(parseGdacs({ features: [drought] }, resolve).alerts.length + parseGdacs({ features: [drought] }, resolve).incidents.length, 0);
  // Out-of-DZ bbox skipped.
  assert.equal(parseGdacs({ features: [farAway] }, resolve).alerts.length, 0);
  // iscurrent:"false" skipped (STRING compare — "false" truthy traps).
  assert.equal(parseGdacs({ features: [notCurrent] }, resolve).alerts.length, 0);
  // Offshore orange FL point: resolver 1.5deg fallback rescues it into an alert.
  const off = parseGdacs({ features: [offshore] }, resolve);
  assert.equal(off.alerts.length, 1, "offshore basin point resolves via 1.5deg fallback");
  assert.equal(off.alerts[0].wilayas.length, 1, "rescued to a real wilaya");
});

test("fetchGdacs: window is ±7d around now, iscurrent query not needed", async () => {
  const asked = [];
  const fetchFn = async (url) => {
    asked.push(url);
    return { ok: true, json: async () => ({ features: [] }) };
  };
  await fetchGdacs({ fetchFn, now: () => new Date("2026-09-08T12:00:00Z") });
  assert.equal(asked.length, 1);
  assert.ok(asked[0].includes("fromDate=2026-09-01"), asked[0]);
  assert.ok(asked[0].includes("toDate=2026-09-15"), asked[0]);
  assert.ok(asked[0].includes("SEARCH"), asked[0]);
});

test("handleWilayasList: 58 wilayas, projection {code,fr,ar} only, memoized body stable", async () => {
  const r1 = await handleWilayasList();
  const r2 = await handleWilayasList();
  const body1 = await r1.text();
  const body2 = await r2.text();
  // The app decodes this as a List<Map>; shape drift breaks the wilaya pickers.
  const list = JSON.parse(body1);
  assert.equal(list.length, 58, "58 wilayas");
  const first = list[0];
  assert.deepEqual(Object.keys(first).sort(), ["ar", "code", "fr"], "projection keeps code/fr/ar only");
  assert.ok(first.code >= 1 && first.code <= 58, "codes 1-58");
  assert.ok(r2.headers.get("cache-control")?.includes("86400"), "browser cache header kept");
  // Memoization pin: the per-isolate cache must serve identical bytes.
  assert.equal(body1, body2, "second call returns the memoized body");
});

// ---------------------------------------------------------------------------
// FIRMS fire clusters: STABLE IDENTITY + STATELESS FRP TREND.
//
// Real-world bug this guards: the old incident id embedded the observation
// timestamp, so the SAME fire re-birthed as a "new" incident every ~3h
// satellite cycle — history filled with duplicates, incident continuity
// broke. The id is now the 0.05° grid cell (~5.5km), and the FRP trend is
// derived statelessly from the multiple passes already inside the rolling
// 24h FIRMS window (VIIRS x2 + MODIS ≈ up to ~12 passes/day — no KV needed).
// ---------------------------------------------------------------------------

const CELL = (lat, lon, frp, observedAt) => ({ lat, lon, frp, observedAt });
// Algiers-area coordinates that all round into ONE 0.05° cell ("735:61").
const PASS_A = "2026-09-09T01:20:00Z"; // VIIRS NOAA-20 overpass
const PASS_B = "2026-09-09T04:50:00Z"; // VIIRS NOAA-21 overpass
const PASS_C = "2026-09-09T13:30:00Z"; // MODIS overpass

test("clusterHotspots: same fire across satellite passes keeps ONE cell identity", () => {
  // Two fetch cycles of the SAME fire (jittered coords, different passes) must
  // land in the SAME cell key — this is what stops the incident re-birthing.
  const batchA = clusterHotspots([CELL(36.75, 3.06, 10, PASS_A)]);
  const batchB = clusterHotspots([CELL(36.76, 3.05, 30, PASS_B)]);
  assert.equal(batchA[0].cellKey, "735:61");
  assert.equal(batchB[0].cellKey, "735:61");
});

test("clusterHotspots: count/totalFrp math, first/latest ordering, passes", () => {
  const [c] = clusterHotspots([
    CELL(36.75, 3.06, 10.5, PASS_A),
    CELL(36.755, 3.055, 30, PASS_B),
  ]);
  assert.equal(c.count, 2);
  assert.equal(c.totalFrp, 40.5); // 0.1-precision rounding
  assert.equal(c.firstObservedAt, PASS_A);
  assert.equal(c.latestObservedAt, PASS_B);
  assert.equal(c.passes, 2);
});

test("clusterHotspots: FRP trend — latest pass vs MEAN of earlier passes", () => {
  // Rising: latest (30) ≥ 1.5× the earlier mean (10).
  assert.equal(
    clusterHotspots([CELL(36.75, 3.06, 10, PASS_A), CELL(36.75, 3.05, 30, PASS_B)])[0].frpTrend,
    "rising"
  );
  // Declining: latest (10) ≤ 0.67× the earlier mean (30) → 10 ≤ 20.1.
  assert.equal(
    clusterHotspots([CELL(36.75, 3.06, 30, PASS_A), CELL(36.75, 3.05, 10, PASS_B)])[0].frpTrend,
    "declining"
  );
  // Steady: 20 vs mean 20 — between the two thresholds.
  assert.equal(
    clusterHotspots([CELL(36.75, 3.06, 20, PASS_A), CELL(36.75, 3.05, 20, PASS_B)])[0].frpTrend,
    "steady"
  );
  // Single pass → no trend possible, even with several detections in it.
  assert.equal(
    clusterHotspots([CELL(36.75, 3.06, 10, PASS_A), CELL(36.75, 3.05, 50, PASS_A)])[0].frpTrend,
    null
  );
  // MEAN-of-earlier, not SUM (sum would bias every multi-pass fire toward
  // "declining"): passes 10 + 20 → mean 15, latest 30 ≥ 22.5 → rising.
  assert.equal(
    clusterHotspots([
      CELL(36.75, 3.06, 10, PASS_A),
      CELL(36.75, 3.05, 20, PASS_B),
      CELL(36.75, 3.062, 30, PASS_C),
    ])[0].frpTrend,
    "rising"
  );
});

test("clusterHotspots: undated rows count for size/FRP but never skew the trend", () => {
  // Historical quirk: an undated row could win the "latest" slot via sort()
  // undefined-comparison, corrupting observedAt. Undated data must stay out
  // of trend/passes/times entirely while still counting toward count/totalFrp.
  const [c] = clusterHotspots([
    CELL(36.75, 3.06, 100, undefined),
    CELL(36.75, 3.05, 10, PASS_A),
  ]);
  assert.equal(c.count, 2);
  assert.equal(c.totalFrp, 110);
  assert.equal(c.passes, 1);
  assert.equal(c.frpTrend, null);
  assert.equal(c.firstObservedAt, PASS_A);
  assert.equal(c.latestObservedAt, PASS_A);
});

test("normalizeFireCluster: SAME id across passes — the re-birth bug stays dead", () => {
  // THE BUG: ids embedded the observation timestamp, so every ~3h pass
  // created a "new" incident for the SAME fire. Now the id is the cell — a
  // morning batch and an afternoon batch of one fire normalize to ONE id.
  const w = { code: 16, fr: "Alger", ar: "الجزائر" };
  const morning = clusterHotspots([CELL(36.75, 3.06, 10, PASS_A)])[0];
  const afternoon = clusterHotspots([CELL(36.76, 3.05, 30, PASS_B)])[0];
  const a = normalizeFireCluster(morning, w);
  const b = normalizeFireCluster(afternoon, w);
  assert.equal(a.id, "firms:cell:735:61");
  assert.equal(a.id, b.id, "same fire, different pass → same incident id");
  // New fields flow onto the incident for the app (and the firms:last cache).
  assert.equal(b.detections, 1);
  assert.equal(b.observedAt, PASS_B);
  assert.equal(b.passes, 1); // each single-pass batch
  assert.equal(b.frpTrend, null); // trend needs ≥2 passes within the batch
  assert.equal(b.wilayas[0].code, 16);
});

// ---------------------------------------------------------------------------
// Rain arc (v1.3.0): NOAA METAR normalization, Open-Meteo hourly rain
// aggregation, morning-briefing content. Pure pins against the REAL shapes
// each source serves — probed live 2026-09-09 (see src/metar.js header).
// ---------------------------------------------------------------------------

test("normalizeMetar: real NOAA shapes — '6+' vis, -RA rain flag, kt→km/h conversions", () => {
  // DAAG was live-reporting this exact entry on 2026-09-09: light rain,
  // 6 kt wind, vis "6+" (NOAA's "6 statute miles or more" encoding).
  const n = normalizeMetar({ icaoId: "DAAG", visib: "6+", wxString: "-RA", wspd: 6, reportTime: "2026-09-09T21:00:00Z" });
  assert.equal(n.vis, 10, "'6+' SM → 10 km nominal");
  assert.equal(n.rain, true, "'-RA' is light rain — includes() must catch prefixed forms");
  assert.equal(n.wind, 11, "6 kt × 1.852 = 11.11 → rounds to 11 km/h");
  assert.equal(n.icao, "DAAG");
  assert.equal(n.at, "2026-09-09T21:00:00Z");

  // DABB live entry: 4.97 SM numeric vis, 3 kt.
  const b = normalizeMetar({ icaoId: "DABB", visib: 4.97, wspd: 3 });
  assert.equal(b.vis, 8.0, "4.97 SM × 1.609 = 7.99 km → rounds to 8.0 (1dp)");
  assert.equal(b.wind, 6, "3 kt × 1.852 = 5.56 → 6 km/h");
  assert.equal(b.rain, false, "no RA in the wx string → no rain flag");
});

test("normalizeMetar: VRB wind, missing gust, empty entry never throws", () => {
  const v = normalizeMetar({ icaoId: "DAOO", wdir: "VRB", wspd: 4 });
  assert.equal(v.gust, null, "no wgst field → null gust, never 0 (0 km/h would read as calm)");
  assert.equal(v.vis, null, "absent visib → null, not a fabricated '0 km'");
  assert.equal(v.t, null);
  // Empty entry: the airport never answered NOAA's proxy — every field null,
  // zero throws. The route serves airports[] and the app omits silently.
  const e = normalizeMetar({});
  assert.equal(e.vis, null);
  assert.equal(e.wind, null);
  assert.equal(e.rain, false);
  assert.equal(e.raw, null);
});

test("normalizeMetar: TS / DU / SA / SN / FG flag coverage", () => {
  const ts = normalizeMetar({ wxString: "VCTS RA" });
  assert.equal(ts.ts, true, "distant thunderstorm TS");
  assert.equal(ts.rain, true);
  const dust = normalizeMetar({ wxString: "DU" });
  const sand = normalizeMetar({ wxString: "SA" });
  assert.equal(dust.dust, true, "DU = dust");
  assert.equal(sand.dust, true, "SA = sand — same family, one flag");
  const snow = normalizeMetar({ wxString: "-SN BR" });
  assert.equal(snow.snow, true);
  assert.equal(snow.fog, false, "BR is mist — distinct code from FG fog, no false flag");
  const fg = normalizeMetar({ wxString: "FG" });
  assert.equal(fg.fog, true);
});

test("rainDays: per-day max pp/cape/gust, MIN vis, m→km, nulls on absent/partial", () => {
  // pastDays=1 keeps arrays small. Day 0 (today) = hours 24–47, d1 = 48–71.
  const fill = (len, v) => Array.from({ length: len }, () => v);
  const mk = (len, fn) => Array.from({ length: len }, (_, i) => fn(i));
  const hourly = {
    precipitation_probability: mk(72, (i) => (i >= 24 && i < 48 ? [20, 35, 61.4][(i - 24) % 3] : 0)),
    cape: mk(72, (i) => (i >= 24 && i < 48 ? 900 + (i - 24) : 10)),
    wind_gusts_10m: mk(72, (i) => (i >= 24 && i < 48 ? 33.333 + (i - 24) * 0.1 : 5)),
    visibility: mk(72, (i) => (i >= 24 && i < 48 ? 8500 - (i - 24) * 100 : 24000)),
  };
  const r = rainDays(hourly, 1);
  assert.equal(r.today.pp, 61, "max of 20/35/61.4 → Math.round(61.4) = 61");
  assert.equal(r.today.cape, 923, "max 900+23 = 923");
  assert.equal(r.today.gust, 35.6, "33.333 + 23×0.1 = 35.63 → 1dp max");
  assert.equal(r.today.vis, 6.2, "8500-2300=6200 m → min 6200/1000 = 6.2 km");
  assert.equal(r.d1.pp, 0, "constant 0 pp → max 0");
  assert.equal(r.d1.gust, 5);
  // Partial day: pp shorter than s+24 → whole day null.
  const partial = { ...hourly, precipitation_probability: hourly.precipitation_probability.slice(0, 60) };
  assert.equal(rainDays(partial, 1).d2, null);
  // Absent required arrays (old cached payloads / other shapes) → null overall.
  assert.equal(rainDays({ visibility: fill(72, 8000) }), null);
  assert.equal(rainDays({ precipitation_probability: fill(72, 10) }), null);
  assert.equal(rainDays(null), null);
  // All days too short → all null → null overall.
  assert.equal(rainDays({ precipitation_probability: [1], wind_gusts_10m: [2] }, 1), null);
});

test("buildBriefing: alerts + rain signature + fire in one bilingual digest", () => {
  const snap = { alerts: [{ color: "orange", hazard: "flood", wilayas: [{ code: 16 }] }] };
  const wx = { wilayas: [{ code: 16, r: { today: { pp: 60, gust: 70.4, cape: 900 } }, fire: { class: "moderate" } }] };
  const b = buildBriefing(snap, wx, 16);
  assert.equal(b.title, "🌤️ Briefing — Alger");
  assert.ok(b.fr.includes("1 alerte"), b.fr);
  assert.ok(b.fr.includes("flood"), b.fr, "top hazards named");
  assert.ok(b.fr.includes("pluie 60%"), b.fr);
  assert.ok(b.fr.includes("rafales 70 km/h"), b.fr, "gust rounded");
  assert.ok(b.fr.includes("orages"), b.fr, "cape ≥ 800");
  assert.ok(b.fr.includes("🟠"), b.fr, "worst color emoji");
  assert.ok(b.ar.includes("أمطار 60%"), b.ar);
  assert.ok(b.ar.includes("تحذير"), b.ar);
  assert.ok(!b.fr.includes("feu"), "fire.class moderate → no fire line (green-noise rule)");
});

test("buildBriefing: all-clear + high fire danger variants", () => {
  // No alerts, no notable rain, but fire danger HIGH → the digest still says
  // something (this is a daily habit push, not an alert).
  const quiet = buildBriefing({ alerts: [] }, { wilayas: [{ code: 16, fire: { class: "high" } }] }, 16);
  assert.ok(quiet.fr.includes("Aucune alerte 🟢"));
  assert.ok(quiet.ar.includes("لا تحذيرات 🟢"));
  assert.ok(quiet.fr.includes("feu 🔥"));
  assert.ok(quiet.ar.includes("خطر حريق 🔥"), quiet.ar);
  // Below-threshold rain must NOT leak into the digest (pp 29 < 30, gust 49 < 50).
  const low = buildBriefing({ alerts: [] }, { wilayas: [{ code: 16, r: { today: { pp: 29, gust: 49, cape: 799 } } }] }, 16);
  assert.ok(!low.fr.includes("pluie"), low.fr);
  assert.ok(!low.fr.includes("rafales"), low.fr);
  assert.ok(!low.fr.includes("orages"), low.fr);
  // Unknown code degrades to the country name, never a crash.
  const unk = buildBriefing({ alerts: [] }, { wilayas: [] }, 999);
  assert.equal(unk.title, "🌤️ Briefing — Algérie");
});

// ---------------------------------------------------------------------------

test("normalizeFireCluster: trend word in the trilingual headline; hand-built fallback id", () => {
  const w = { code: 16, fr: "Alger", ar: "الجزائر" };
  const growing = normalizeFireCluster(
    clusterHotspots([CELL(36.75, 3.06, 10, PASS_A), CELL(36.75, 3.05, 30, PASS_B)])[0],
    w
  );
  assert.equal(growing.frpTrend, "rising");
  assert.ok(growing.headline.fr.includes("en intensification"), growing.headline.fr);
  assert.ok(growing.headline.en.includes("intensifying"), growing.headline.en);
  assert.ok(growing.headline.ar.includes("في تصاعد"), growing.headline.ar);
  // Single pass: no trend suffix at all — null-safe, no stray commas.
  const single = normalizeFireCluster(clusterHotspots([CELL(36.75, 3.06, 10, PASS_A)])[0], w);
  assert.equal(single.frpTrend, null);
  assert.ok(!single.headline.fr.includes("intensification"), single.headline.fr);
  assert.ok(single.headline.fr.includes("1 détections"), single.headline.fr);
  // Hand-built cluster (no cellKey): centroid fallback still yields firms:cell:…
  const handBuilt = normalizeFireCluster(
    { lat: 36.75, lon: 3.06, count: 3, totalFrp: 40.5, latestObservedAt: PASS_B },
    w
  );
  assert.equal(handBuilt.id, "firms:cell:735:61");
  assert.equal(handBuilt.passes, 1); // absent → default 1
  assert.equal(handBuilt.frpTrend, null);
});
