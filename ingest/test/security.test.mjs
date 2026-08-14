// Regression tests for the security audit fixes. Pure functions plus the two
// handlers that only need a KV stub, so this stays on the built-in runner
// (`npm test` from ingest/) with zero dependencies.
//
// Each pin below is a way in that was open before — read the comment before
// "fixing" a failure.

import { test } from "node:test";
import assert from "node:assert/strict";

import { adminAuthed, releaseLink, handleAdminList } from "../src/admin.js";
import { handleCreateReport, handleListReports, handleExportCsv } from "../src/reports.js";

// Minimal KV: get/put/list over a Map, recording the args list() was called
// with so a clamped limit can be asserted.
function kv(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    listCalls: [],
    async get(k) {
      return store.has(k) ? store.get(k) : null;
    },
    async put(k, v) {
      store.set(k, v);
    },
    async list(opts) {
      this.listCalls.push(opts);
      const keys = [...store.keys()].filter((k) => k.startsWith(opts.prefix)).slice(0, opts.limit);
      return { keys: keys.map((name) => ({ name })) };
    },
  };
}

const post = (body, headers = {}) =>
  new Request("https://w.example/v1/reports", { method: "POST", headers: { "content-type": "application/json", ...headers }, body });

// The update banner is an INSTALL path: the app hands `apk`/`url` to the
// system, so publishing an arbitrary https link would turn one leaked
// ADMIN_KEY into an attacker-built APK on every device.
test("releaseLink: only this repo's GitHub release assets are publishable", () => {
  assert.equal(releaseLink("https://github.com/MzrIslem/RadBalek/releases/download/v1.2.1/app-release.apk"), true);
  assert.equal(releaseLink("https://objects.githubusercontent.com/github-production-release-asset/1/2"), true);
  assert.equal(releaseLink("https://evil.example/app-release.apk"), false);
  assert.equal(releaseLink("https://github.com/evil/RadBalek/releases/download/v1/app.apk"), false);
  // Suffix matching would let these through.
  assert.equal(releaseLink("https://github.com.evil.example/MzrIslem/RadBalek/x.apk"), false);
  assert.equal(releaseLink("https://notgithub.com/MzrIslem/RadBalek/x.apk"), false);
  // Downgrade + non-URL.
  assert.equal(releaseLink("http://github.com/MzrIslem/RadBalek/releases/download/v1/app.apk"), false);
  assert.equal(releaseLink("javascript:alert(1)"), false);
  assert.equal(releaseLink("not a url"), false);
});

test("adminAuthed: Bearer only, and failed guesses lock the IP out", async () => {
  const env = { ADMIN_KEY: "s3cret", EWS_KV: kv() };
  const url = new URL("https://w.example/v1/admin/reports?key=s3cret");
  const req = (headers = {}) => new Request(url, { headers });

  assert.equal(await adminAuthed(req({ authorization: "Bearer s3cret" }), url, env), true);
  // The key in the query string leaks into Cloudflare logs, browser history and
  // referrers, so it must NOT authenticate even when it is correct.
  assert.equal(await adminAuthed(req(), url, env), false);
  assert.equal(await adminAuthed(req({ authorization: "Bearer wrong" }), url, env), false);

  for (let i = 0; i < 10; i++) await adminAuthed(req({ authorization: "Bearer wrong" }), url, env);
  // Locked out now — even with the right key, until the 1h counter expires.
  assert.equal(await adminAuthed(req({ authorization: "Bearer s3cret" }), url, env), false);
});

test("adminAuthed: no ADMIN_KEY configured means no admin access at all", async () => {
  const env = { EWS_KV: kv() };
  const url = new URL("https://w.example/v1/admin/reports");
  const r = await handleAdminList(new Request(url, { headers: { authorization: "Bearer anything" } }), url, env);
  assert.equal(r.status, 403);
});

// Admin answers must not be readable by another origin: a wildcard here would
// let any page the curator has open read the moderation queue.
test("admin responses carry no CORS grant and are never cached", async () => {
  const env = { ADMIN_KEY: "k", EWS_KV: kv({ "r:99999999999999:aa": JSON.stringify({ id: "r:99999999999999:aa" }) }) };
  const url = new URL("https://w.example/v1/admin/reports");
  const r = await handleAdminList(new Request(url, { headers: { authorization: "Bearer k" } }), url, env);
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("access-control-allow-origin"), null);
  assert.equal(r.headers.get("cache-control"), "no-store");
});

// request.json() returns null/42/"x" for these bodies; reading .category off
// them threw, so a one-byte body used to answer 500.
test("POST /v1/reports: a non-object JSON body is a 400, not a crash", async () => {
  const env = { EWS_KV: kv() };
  for (const body of ["null", "42", '"x"', "[]", "{oops"]) {
    const r = await handleCreateReport(post(body), env, { type: "FeatureCollection", features: [] });
    assert.equal(r.status, 400, `body ${body}`);
  }
});

test("GET /v1/reports.json: ?limit is clamped to 1..200", async () => {
  const env = { EWS_KV: kv() };
  for (const [q, want] of [["-1", 1], ["abc", 100], ["1e9", 200], ["0", 1], ["50", 50], ["", 100]]) {
    await handleListReports(new URL(`https://w.example/v1/reports.json?limit=${q}`), env);
    const last = env.EWS_KV.listCalls.at(-1);
    // KV rejects a non-integer or out-of-range limit with a 500, which took the
    // public feed down for everyone.
    assert.equal(last.limit, want, `?limit=${q}`);
    assert.ok(Number.isInteger(last.limit));
  }
});

// The curator opens this export in a spreadsheet; a description starting with
// "=" is a formula there.
test("GET /v1/reports.csv: a description cannot become a spreadsheet formula", async () => {
  const report = {
    id: "r:99999999999999:aa",
    at: "2026-01-01T00:00:00.000Z",
    category: "fire",
    wilaya: 16,
    lat: null,
    lon: null,
    description: '=cmd|" /c calc"!A0',
    lang: "fr",
    status: "new",
    confirms: 0,
  };
  const env = { EWS_KV: kv({ [report.id]: JSON.stringify(report) }) };
  const csv = await (await handleExportCsv(env)).text();
  assert.match(csv, /"'=cmd/);
  assert.doesNotMatch(csv, /,=cmd/);
});
