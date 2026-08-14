// Workers-KV access, with the project's non-negotiable rule baked in: NO piece
// of bookkeeping may ever throw its way in front of alert delivery. A write
// quota 429 on a counter once killed the cron for 3 hours (2026-07-19), so the
// guard every call site used to re-type lives here.

// Read a key, or null on ANY failure (missing, quota, network).
export async function kvGet(env, key, type) {
  try {
    return type ? await env.EWS_KV.get(key, type) : await env.EWS_KV.get(key);
  } catch {
    return null;
  }
}

// Best-effort write: returns whether it landed, never throws.
export async function kvPut(env, key, value, options) {
  try {
    await env.EWS_KV.put(key, value, options);
    return true;
  } catch {
    return false;
  }
}

export async function kvDelete(env, key) {
  try {
    await env.EWS_KV.delete(key);
    return true;
  } catch {
    return false;
  }
}

// JSON.parse that yields `fallback` instead of throwing — one malformed value
// must cost one row, never the whole response.
export function safeJson(raw, fallback = null) {
  if (raw == null) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return parsed === null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

export async function kvJson(env, key, fallback = null) {
  return safeJson(await kvGet(env, key), fallback);
}

// --- counters (anti-abuse, all TTL'd to the hour) ---

const HOUR_S = 3600;

export async function counter(env, key) {
  return Number((await kvGet(env, key)) || 0);
}

// Increment a counter, best-effort — the action it guards has already been
// authorized, so a failed write costs one extra allowance, never a 500.
export async function bumpCounter(env, key, ttl = HOUR_S) {
  return kvPut(env, key, String((await counter(env, key)) + 1), { expirationTtl: ttl });
}

// Check-and-increment in one call, for the endpoints that consume their
// allowance on every attempt (AI, self-test push).
export async function rateLimit(env, key, cap, ttl = HOUR_S) {
  const n = await counter(env, key);
  if (n >= cap) return false;
  await kvPut(env, key, String(n + 1), { expirationTtl: ttl });
  return true;
}

// Newest-first lexicographic key component: inverse epoch millis, zero-padded.
// KV lists ascending, so this makes `list({prefix})` return the newest rows.
export function invStamp(ms = Date.now()) {
  return String(10_000_000_000_000 - ms).padStart(14, "0");
}

export function randomSuffix() {
  return Math.random().toString(36).slice(2, 6);
}
