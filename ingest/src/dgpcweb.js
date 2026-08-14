// Protection Civile — OFFICIAL website REST API (dgpc.dz, WordPress).
// First-party, trilingual, stable numeric ids. This is the resilience path for
// the t.me/s/DGPCDZ scrape (Telegram is the most fragile ingest we have): if
// Telegram changes markup or blocks us, the official bilans still arrive here.
//
// WAF: dgpc.dz 403s a bare/absent User-Agent — a naive Worker fetch silently
// fails. A browser-like UA is required (verified).

import { htmlToText, blocks, tag } from "./xml.js";
import { wilayasInFrenchText, wilayaInArabicText, wilayaRef } from "./wilayas.js";
import { fetchJson, fetchText, UA } from "./http.js";
import { matchRule } from "./rules.js";

/// Recent posts from the official Protection Civile site.
/// dgpc.dz sits behind Cloudflare and intermittently returns 522 (origin
/// timeout) to Worker-to-Cloudflare requests, so: one retry, then fall back to
/// the RSS feed, which is served from a different path and survives when the
/// REST API does not.
export async function fetchDgpcWeb(fetchFn = fetch, { sinceHours = 48, limit = 20 } = {}) {
  const after = new Date(Date.now() - sinceHours * 3600 * 1000).toISOString().slice(0, 19);
  const url =
    `https://dgpc.dz/wp-json/wp/v2/posts?per_page=${limit}&after=${after}` +
    `&_fields=id,date_gmt,link,title,content`;
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const rows = await fetchJson(url, { fetchFn, label: "dgpc.dz", ua: UA.browser, accept: "application/json" });
      if (!Array.isArray(rows)) throw new Error("dgpc.dz: unexpected payload");
      return rows.map(normalizePost).filter(Boolean);
    } catch (e) {
      lastErr = e;
    }
  }
  try {
    return await fetchDgpcRss(fetchFn, sinceHours);
  } catch {
    throw lastErr || new Error("dgpc.dz unreachable");
  }
}

/// RSS fallback — same content, no JSON API dependency.
async function fetchDgpcRss(fetchFn, sinceHours) {
  const xml = await fetchText("https://dgpc.dz/feed/", {
    fetchFn,
    label: "dgpc.dz/feed",
    ua: UA.browser,
    accept: "application/rss+xml,*/*",
  });
  const cutoff = Date.now() - sinceHours * 3600 * 1000;
  const out = [];
  for (const item of blocks(xml, "item")) {
    const title = htmlToText(tag(item, "title") || "");
    const link = (tag(item, "link") || "").trim();
    const when = Date.parse(tag(item, "pubDate") || "");
    if (!title || !Number.isFinite(when) || when < cutoff) continue;
    const body = htmlToText(tag(item, "description") || "").slice(0, 1200);
    const text = `${title}\n${body}`.trim();
    const aggregate = AGGREGATE.test(title);
    out.push({
      id: `dgpcweb:rss:${link.split("/").filter(Boolean).pop() || when}`,
      postedAt: new Date(when).toISOString(),
      link: link || "https://dgpc.dz/",
      title,
      text,
      kind: aggregate ? "bilan" : classify(text),
      aggregate,
      wilayas: aggregate ? [] : matchWilayas(text),
    });
  }
  return out;
}

// Country-wide daily summaries ("bilan des interventions des dernières 24h").
// They name a dozen wilayas at once, so pinning them to a map location is
// actively misleading — they are national statistics, not an incident.
const AGGREGATE = /حصيلة تدخل|bilan (?:des )?interventions?|outcome of the civil protection|intervention results|الحصيلة اليومية/i;

function normalizePost(p) {
  const title = htmlToText(p?.title?.rendered || "");
  const bodyText = htmlToText(p?.content?.rendered || "").slice(0, 1200);
  const text = `${title}\n${bodyText}`.trim();
  if (!text) return null;
  const aggregate = AGGREGATE.test(title);
  return {
    id: `dgpcweb:${p.id}`,
    postedAt: p.date_gmt ? `${p.date_gmt}Z` : new Date().toISOString(),
    link: p.link || "https://dgpc.dz/",
    title,
    text,
    kind: aggregate ? "bilan" : classify(text),
    aggregate,
    // Never geo-pin a national bilan.
    wilayas: aggregate ? [] : matchWilayas(text),
  };
}

// Same hazard vocabulary as the Telegram classifier, in FR + AR (the site
// publishes both languages depending on the post).
const RULES = [
  [/incendie|حريق|feu de for|حرائق/i, "fire"],
  [/accident.{0,12}(de la )?circulation|حادث(?:ة)? مرور|حوادث المرور|collision/i, "road-crash"],
  [/noyade|غرق|plage|شاطئ/i, "drowning"],
  [/asphyxie|اختناق|monoxyde|غاز/i, "gas"],
  [/inondation|فيضان|crue|سيول/i, "flood"],
  [/séisme|seisme|زلزال|هزة/i, "earthquake"],
  [/canicule|موجة حر/i, "heat"],
];

function classify(text) {
  return matchRule(RULES, text, "other");
}

/// Wilaya extraction: word-boundary French matching (the site writes "wilaya
/// de Béjaïa"), then the Arabic matcher shared with the Telegram parser.
function matchWilayas(text) {
  const found = new Map();
  for (const w of wilayasInFrenchText(text, { max: 6 })) found.set(w.code, w);
  const ar = wilayaInArabicText(text);
  if (ar) found.set(ar.code, wilayaRef(ar));
  return [...found.values()].slice(0, 6);
}
