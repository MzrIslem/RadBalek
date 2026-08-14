// Shared HTTP plumbing: the CORS/JSON response shape every endpoint returns,
// and the upstream-fetch wrapper every source module needs.

const JSON_TYPE = "application/json; charset=utf-8";

// User agents the upstreams require. dgpc.dz and craag.dz 403 a bare/absent UA,
// so a browser-like string is mandatory there (verified).
export const UA = {
  api: "radbalek/0.2",
  browser: "Mozilla/5.0 (compatible; radbalek/0.2)",
  ingest: "aisx-ews/0.1 (+ingest)",
};

export function corsHeaders(extra = {}) {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    ...extra,
  };
}

export const json = (obj, status = 200, extra = {}) => jsonRaw(JSON.stringify(obj), status, extra);

// Same response as json(), for a body that is ALREADY a JSON string (KV reads
// are served straight through — no parse/re-stringify on the hot path).
export const jsonRaw = (body, status = 200, extra = {}) =>
  new Response(body, { status, headers: corsHeaders({ "content-type": JSON_TYPE, ...extra }) });

// Request body, or null when it isn't valid JSON.
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// GET an upstream and fail loudly with a labelled error. `label` is what the
// pipeline surfaces in snapshot.errors[], so it must name the source.
export async function fetchOk(url, { fetchFn = fetch, label = "upstream", ua = UA.api, accept, headers, timeoutMs, redirect } = {}) {
  const res = await fetchFn(url, {
    headers: { "user-agent": ua, ...(accept ? { accept } : {}), ...headers },
    ...(redirect ? { redirect } : {}),
    // Per-request abort: one hung sensor/feed must not eat the whole budget.
    ...(timeoutMs ? { signal: AbortSignal.timeout(timeoutMs) } : {}),
  });
  if (!res.ok) throw new Error(`${label} HTTP ${res.status}`);
  return res;
}

export async function fetchJson(url, opts) {
  return (await fetchOk(url, opts)).json();
}

export async function fetchText(url, opts) {
  return (await fetchOk(url, opts)).text();
}
