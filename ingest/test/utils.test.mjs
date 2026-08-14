// Tests for the shared utilities the sources/handlers were refactored onto.
// They encode the guarantees the callers rely on: open CORS on every public
// response, best-effort KV that never throws, first-match rule ordering and
// exact band boundaries.

import { test } from "node:test";
import assert from "node:assert/strict";

import { corsHeaders, fetchOk, json, jsonRaw, readJson } from "../src/http.js";
import { bumpCounter, counter, invStamp, kvGet, kvJson, kvPut, rateLimit, safeJson } from "../src/kv.js";
import { bandOf, matchRule } from "../src/rules.js";

// KV double that can be told to fail — the free tier throws 429 on quota, and
// every bookkeeping call site must survive that.
function fakeEnv({ store = new Map(), fail = false } = {}) {
  const kv = {
    get: async (k) => {
      if (fail) throw new Error("KV 429");
      return store.has(k) ? store.get(k) : null;
    },
    put: async (k, v) => {
      if (fail) throw new Error("KV 429");
      store.set(k, v);
    },
    delete: async (k) => {
      if (fail) throw new Error("KV 429");
      store.delete(k);
    },
  };
  return { env: { EWS_KV: kv }, store };
}

test("json/jsonRaw: every public response carries open CORS + the JSON type", () => {
  for (const res of [json({ ok: true }), jsonRaw("{}")]) {
    assert.equal(res.headers.get("access-control-allow-origin"), "*");
    assert.equal(res.headers.get("access-control-allow-methods"), "GET,POST,OPTIONS");
    assert.equal(res.headers.get("access-control-allow-headers"), "content-type");
    assert.equal(res.headers.get("content-type"), "application/json; charset=utf-8");
  }
  const err = json({ error: "rate limit" }, 429, { "cache-control": "no-store" });
  assert.equal(err.status, 429);
  assert.equal(err.headers.get("cache-control"), "no-store");
  assert.equal(corsHeaders()["access-control-allow-origin"], "*");
});

test("readJson: a malformed body is null, never a thrown 500", async () => {
  assert.deepEqual(await readJson(new Request("https://x/", { method: "POST", body: "{" })), null);
  assert.deepEqual(await readJson(new Request("https://x/", { method: "POST", body: '{"a":1}' })), { a: 1 });
});

test("fetchOk: labels upstream failures and keeps 204 (EMSC 'no events') usable", async () => {
  const fetchFn = async (url) => new Response(null, { status: url.includes("bad") ? 503 : 204 });
  await assert.rejects(() => fetchOk("https://bad", { fetchFn, label: "EMSC" }), /EMSC HTTP 503/);
  assert.equal((await fetchOk("https://ok", { fetchFn })).status, 204);
});

test("fetchOk: sends the requested user-agent/accept and honours redirect mode", async () => {
  let seen;
  const fetchFn = async (_url, init) => ((seen = init), new Response("x"));
  await fetchOk("https://x", { fetchFn, ua: "ua/1", accept: "text/csv", redirect: "manual" });
  assert.equal(seen.headers["user-agent"], "ua/1");
  assert.equal(seen.headers.accept, "text/csv");
  assert.equal(seen.redirect, "manual");
});

test("kv helpers: a KV outage degrades, never throws", async () => {
  const { env } = fakeEnv({ fail: true });
  assert.equal(await kvGet(env, "k"), null);
  assert.equal(await kvPut(env, "k", "v"), false);
  assert.deepEqual(await kvJson(env, "k", []), []);
  assert.equal(await counter(env, "rl:1"), 0);
  assert.equal(await bumpCounter(env, "rl:1"), false);
});

test("safeJson: malformed or missing values fall back instead of exploding", () => {
  assert.deepEqual(safeJson("{", {}), {});
  assert.deepEqual(safeJson(null, []), []);
  assert.deepEqual(safeJson("null", []), []);
  assert.deepEqual(safeJson('{"a":1}'), { a: 1 });
});

test("rateLimit: allows exactly `cap` calls per window", async () => {
  const { env } = fakeEnv();
  for (let i = 0; i < 3; i++) assert.equal(await rateLimit(env, "air:1", 3), true);
  assert.equal(await rateLimit(env, "air:1", 3), false);
  assert.equal(await rateLimit(env, "air:2", 3), true); // per-key
});

test("invStamp: newest-first keys sort lexicographically", () => {
  const older = invStamp(1_700_000_000_000);
  const newer = invStamp(1_800_000_000_000);
  assert.equal(older.length, 14);
  assert.ok(newer < older);
});

test("matchRule: first match wins, so rule order stays meaningful", () => {
  const rules = [
    [/incendie|feu/i, "fire"],
    [/inondation/i, "flood"],
  ];
  assert.equal(matchRule(rules, "Feu de forêt et inondation"), "fire");
  assert.equal(matchRule(rules, "Inondations à Alger"), "flood");
  assert.equal(matchRule(rules, "Conseil des ministres", "other"), "other");
  assert.equal(matchRule(rules, "", "other"), "other");
});

test("bandOf: FWI is exclusive, AQI inclusive — boundaries must not drift", () => {
  const fwi = [
    [11.2, "low"],
    [21.3, "moderate"],
  ];
  assert.equal(bandOf(fwi, 11.19, "top"), "low");
  assert.equal(bandOf(fwi, 11.2, "top"), "moderate"); // exclusive: not "low"
  assert.equal(bandOf(fwi, 99, "top"), "top");
  assert.equal(bandOf(fwi, NaN, "top"), null);

  const aqi = [
    [20, "good"],
    [40, "fair"],
  ];
  assert.equal(bandOf(aqi, 20, "top", { inclusive: true }), "good"); // inclusive
  assert.equal(bandOf(aqi, 20.1, "top", { inclusive: true }), "fair");
});
