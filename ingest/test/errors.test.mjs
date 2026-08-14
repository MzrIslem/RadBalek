// Regression tests for FAILURE paths: KV going down (quota 429s are routine on
// the free tier) and corrupt stored records. Each pin guards a case where the
// old code either reported success for something that was never stored, or lost
// delivery state without a trace.
//
//   npm test        (from ingest/)

import { test } from "node:test";
import assert from "node:assert/strict";

import { handleCreateReport, handleConfirmReport, handleFeedback, handleListReports } from "../src/reports.js";
import { sendPush } from "../src/push.js";

// Minimal KV double: `values` seeds reads, `failGet`/`failPut` name the keys
// (or "*") whose op throws like a KV quota error.
function kv({ values = {}, failGet = [], failPut = [] } = {}) {
  const store = new Map(Object.entries(values));
  const hits = (list, key) => list.includes("*") || list.includes(key);
  return {
    store,
    puts: [],
    async get(key) {
      if (hits(failGet, key)) throw new Error(`KV GET ${key} limit exceeded`);
      return store.has(key) ? store.get(key) : null;
    },
    async put(key, value) {
      if (hits(failPut, key)) throw new Error(`KV PUT ${key} limit exceeded`);
      this.puts.push(key);
      store.set(key, value);
    },
    async delete(key) {
      store.delete(key);
    },
    async list({ prefix, limit }) {
      return {
        keys: [...store.keys()].filter((k) => k.startsWith(prefix)).slice(0, limit).map((name) => ({ name })),
      };
    },
  };
}

const post = (body) =>
  new Request("https://x/v1/reports", {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": "1.2.3.4" },
    body: JSON.stringify(body),
  });

const REPORT = { category: "fire", wilaya: 16, description: "fumée" };

// A 201 tells the app "signalement envoyé" and clears the form. When the KV put
// throws, the report does not exist: answering 201 loses a real hazard report
// AND the user's only copy of it.
test("create report: KV write failure answers 503, never a fake 201", async () => {
  const EWS_KV = kv({ failPut: ["*"] });
  const res = await handleCreateReport(post(REPORT), { EWS_KV }, null);
  assert.equal(res.status, 503);
  assert.equal((await res.json()).error, "storage unavailable");
});

// The rate-limit counter is bookkeeping: losing it costs one extra allowed
// report, so it must NOT undo a report that is already stored.
test("create report: rate-limit counter failure still returns 201", async () => {
  const EWS_KV = kv({ failPut: ["rl:*"] });
  EWS_KV.put = async function (key, value) {
    if (key.startsWith("rl:")) throw new Error("KV PUT limit exceeded");
    this.puts.push(key);
    this.store.set(key, value);
  };
  const res = await handleCreateReport(post(REPORT), { EWS_KV }, null);
  assert.equal(res.status, 201);
  assert.equal((await res.json()).ok, true);
});

const ID = "r:09999999999999:ab12";

// The app locks the "Confirmer" button on a 200, so a swallowed write turned
// into a confirmation the user can never re-send.
test("confirm report: KV write failure answers 503", async () => {
  const EWS_KV = kv({
    values: { [ID]: JSON.stringify({ id: ID, confirms: 0, status: "new", ck: "someone-else" }) },
    failPut: [ID],
  });
  const res = await handleConfirmReport(post({ id: ID }), { EWS_KV });
  assert.equal(res.status, 503);
});

test("confirm report: corrupt stored record answers 500, not a crash", async () => {
  const EWS_KV = kv({ values: { [ID]: "{not json" } });
  const res = await handleConfirmReport(post({ id: ID }), { EWS_KV });
  assert.equal(res.status, 500);
  assert.equal((await res.json()).error, "corrupt record");
});

test("feedback: KV write failure answers 503", async () => {
  const EWS_KV = kv({ failPut: ["*"] });
  const res = await handleFeedback(post({ type: "bug", text: "crash" }), { EWS_KV });
  assert.equal(res.status, 503);
});

// One unparsable value must cost ONE report, not the whole public feed: a 500
// here is not edge-cached, so every request re-ran the KV list + N gets.
test("list reports: a corrupt record is skipped, the rest are served", async () => {
  const good = JSON.stringify({ id: "r:2", category: "fire", status: "new" });
  const EWS_KV = kv({ values: { "r:1": "{corrupt", "r:2": good } });
  const res = await handleListReports(new URL("https://x/v1/reports.json"), { EWS_KV });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.count, 1);
  assert.equal(body.reports[0].id, "r:2");
});

const SA = JSON.stringify({ project_id: "p", client_email: "a@b.c", private_key: "x" });

// Losing `sentmap` re-sirens every red already delivered; losing `activetopics`
// makes "nothing was active" indistinguishable from an unreadable list. Both
// must reach the summary — the watchdog pages on these fields.
test("sendPush: KV read failure reports dedupe loss and skips the all-clear diff", async () => {
  const EWS_KV = kv({ failGet: ["*"] });
  const summary = await sendPush({ FIREBASE_SA: SA, EWS_KV }, [], []);
  assert.ok(summary.dedupeLost, "dedupeLost must name the failure");
  assert.equal(summary.activeTopicsUnavailable, true);
  assert.equal(summary.allclearSkipped, true);
});

// An unreadable activetopics must leave the stored list ALONE: overwriting it
// with this cycle's topics drops every topic still owed a "Fin d'alerte".
test("sendPush: corrupt activetopics is not overwritten", async () => {
  const EWS_KV = kv({ values: { sentmap: "{}", activetopics: "[not json" } });
  const summary = await sendPush({ FIREBASE_SA: SA, EWS_KV }, [], []);
  assert.equal(summary.activeTopicsUnavailable, true);
  assert.ok(!EWS_KV.puts.includes("activetopics"));
});

test("sendPush: unwritable sentmap is reported as dedupeUnsaved", async () => {
  const EWS_KV = kv({ values: { activetopics: "[]" }, failPut: ["sentmap"] });
  const alerts = [{ id: "a1", color: "red", hazard: "fire", wilayas: [], headline: { fr: "f", ar: "a" }, onset: null }];
  const notifications = [{ alertId: "a1", topic: "w16_fire_red" }];
  const summary = await sendPush({ FIREBASE_SA: SA, EWS_KV }, notifications, alerts);
  assert.ok(summary.dedupeUnsaved || summary.errors.length, "a failed cycle must say why");
});

test("sendPush: malformed FIREBASE_SA is reported instead of throwing", async () => {
  const summary = await sendPush({ FIREBASE_SA: "{not json", EWS_KV: kv() }, [], []);
  assert.match(summary.errors[0].error, /not valid JSON/);
});
