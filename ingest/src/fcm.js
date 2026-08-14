// FCM HTTP v1 transport: service-account OAuth + the send call itself.
// Runs on Cloudflare Workers and Node 18+ (WebCrypto).
//
// Every sender (alerts, crisis heartbeats, all-clears, the admin watchdog, the
// /v1/test-push self-test) inlined this same call with its own Bearer header,
// and only ONE of them invalidated a stale cached token. fcmSender() is the
// single send path.
import { kvGet, kvPut, kvDelete, safeJson } from "./kv.js";

const SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
const TOKEN_KEY = "fcm_token";

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

// The Firebase service account, or null when unset/malformed.
export function serviceAccount(env) {
  if (!env.FIREBASE_SA) return null;
  return safeJson(env.FIREBASE_SA);
}

export async function getAccessToken(sa, env) {
  const cached = env ? await kvGet(env, TOKEN_KEY) : null;
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
  if (env) await kvPut(env, TOKEN_KEY, tok, { expirationTtl: 3300 });
  return tok;
}

// A sender bound to one service account. The OAuth token is fetched lazily on
// the first send, reused for the rest of the cycle, and dropped from KV when
// FCM rejects it — so the next send re-mints instead of repeating a 401 for the
// token's whole 55-minute life. Throws on a failed send; callers decide whether
// that is fatal.
export function fcmSender(env, sa) {
  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
  let token = null;
  return async function send(message) {
    token = token || (await getAccessToken(sa, env));
    const res = await fetch(url, {
      method: "POST",
      headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (res.status === 401 || res.status === 403) {
      await kvDelete(env, TOKEN_KEY);
      token = null;
    }
    if (!res.ok) throw new Error(`FCM HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
    return res;
  };
}
