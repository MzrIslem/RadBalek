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

test("fwiClass: EFFIS thresholds are exact (public, defensible scale)", () => {
  assert.equal(fwiClass(5), "low");
  assert.equal(fwiClass(11.2), "moderate");
  assert.equal(fwiClass(21.3), "high");
  assert.equal(fwiClass(38.0), "veryHigh");
  assert.equal(fwiClass(50.0), "extreme");
  assert.equal(fwiClass(70.0), "veryExtreme");
  assert.equal(fwiClass(NaN), null);
});
