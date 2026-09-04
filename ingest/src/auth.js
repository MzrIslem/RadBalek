// Shared admin authentication primitive.
//
// Audit fix: the admin key used to ride the URL query, where it leaks into
// logs, browser history and referrers, with unlimited guesses. Now preferred
// via Authorization: Bearer (query kept one release for compatibility), and
// FAILED attempts are rate-limited per IP (10/h) — successful auths cost no
// KV write.
//
// This lives in its own module so non-admin routes (AI risk, CSV export) can
// gate on the exact same primitive without importing admin.js and creating a
// circular dependency (admin.js -> ai.js -> admin.js).

export function adminKeyOf(request, url) {
  const m = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  return (m ? m[1] : url.searchParams.get("key")) || "";
}

export async function adminAuthed(request, url, env) {
  if (!env?.ADMIN_KEY || !env?.EWS_KV) return false;
  const ip = request.headers.get("cf-connecting-ip") || "0";
  const rlKey = `adminrl:${ip}`;
  const fails = Number((await env.EWS_KV.get(rlKey)) || 0);
  if (fails >= 10) return false;
  if (adminKeyOf(request, url) === env.ADMIN_KEY) return true;
  try {
    await env.EWS_KV.put(rlKey, String(fails + 1), { expirationTtl: 3600 });
  } catch {}
  return false;
}
