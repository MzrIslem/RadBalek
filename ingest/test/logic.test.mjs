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
import { severityColor, fcmTopicsFor } from "../src/normalize.js";
import { makeWilayaResolver } from "../src/geo.js";
import { fwiClass } from "../src/fwi.js";
import { fetchFirmsHotspots, withinLastHours, FIRMS_DAY_RANGE } from "../src/firms.js";
import { detectEew, feltRadiusKm, haversineKm } from "../src/quakes.js";
import { adminAuthed } from "../src/auth.js";
import { handleRisk } from "../src/ai.js";
import { handleTestPush } from "../src/admin.js";

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
  await fetchFirmsHotspots("KEY", { fetchFn, sources: ["VIIRS_SNPP_NRT"] });
  assert.equal(asked.length, 1);
  assert.ok(asked[0].endsWith(`/${FIRMS_DAY_RANGE}`), `requested "${asked[0]}" — day_range must be ${FIRMS_DAY_RANGE}`);
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
