// Single sink for errors the worker deliberately swallows.
//
// Most catches here are best-effort on purpose: a KV quota 429 must never kill
// the alert cycle. But a swallowed error with no trace is indistinguishable
// from success, and `wrangler tail` / the Workers log stream is the only window
// into a cron nobody watches. Everything that is caught and not returned to a
// caller goes through here, so a degraded cycle is at least *visible*.

export function errText(err) {
  if (err == null) return "unknown error";
  return String((err && err.message) || err).slice(0, 300);
}

export function logSwallowed(scope, err) {
  console.error(`[rb] swallowed ${scope}: ${errText(err)}`);
}
