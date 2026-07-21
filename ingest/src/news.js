// Algerian press RSS — UNOFFICIAL corroboration layer.
//
// Why: ONM only forecasts vigilance, FIRMS only sees thermal anomalies, EMSC
// only seismicity, DGPC only what Protection Civile intervened on. Whole
// hazard classes therefore never reach the app: floods in progress, road
// closures, building collapses, water cuts, storm damage. The press reports
// those within minutes and names the wilaya.
//
// Everything produced here is source:"press", status:"reported" and MUST be
// rendered with the "non officiel" badge — it never triggers a red alert.

import { blocks, tag, htmlToText } from "./xml.js";
import { wilayasInFrenchText } from "./wilayas.js";

// Verified live 2026-07-20. Topic feeds first (high signal-to-noise), then the
// general feeds which we filter by keyword.
export const FEEDS = [
  { url: "https://www.tsa-algerie.com/tag/incendies/feed/", name: "TSA", topic: "fire" },
  { url: "https://www.tsa-algerie.com/tag/canicule/feed/", name: "TSA", topic: "heat" },
  { url: "https://www.tsa-algerie.com/feed/", name: "TSA", topic: null },
  { url: "https://www.ennaharonline.com/category/algeria/feed/", name: "Ennahar", topic: null },
];

const UA = "Mozilla/5.0 (compatible; radbalek/0.2)";
const MAX_AGE_MS = 24 * 3600 * 1000;

export async function fetchNews(fetchFn = fetch, feeds = FEEDS) {
  const settled = await Promise.allSettled(feeds.map((f) => fetchFeed(fetchFn, f)));
  const items = settled.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  // De-dupe across feeds by link, newest first.
  const byLink = new Map();
  for (const it of items) if (!byLink.has(it.link)) byLink.set(it.link, it);
  return [...byLink.values()].sort((a, b) => (a.observedAt < b.observedAt ? 1 : -1)).slice(0, 40);
}

async function fetchFeed(fetchFn, feed) {
  const res = await fetchFn(feed.url, { headers: { "user-agent": UA, accept: "application/rss+xml,*/*" } });
  if (!res.ok) throw new Error(`${feed.name} HTTP ${res.status}`);
  const xml = await res.text();
  const out = [];
  for (const item of blocks(xml, "item")) {
    const title = htmlToText(tag(item, "title") || "");
    const link = (tag(item, "link") || "").trim();
    const pub = tag(item, "pubDate") || "";
    const when = Date.parse(pub);
    if (!title || !link || !Number.isFinite(when)) continue;
    if (Date.now() - when > MAX_AGE_MS) continue; // only today's news
    const summary = htmlToText(tag(item, "description") || "").slice(0, 600);
    // NEVER trust feed.topic alone: TSA's /tag/incendies/ feed served an
    // article about visas, which a forced hazard turned into a fake fire.
    // The content must name the hazard itself.
    const hazard = hazardOf(`${title} ${summary}`);
    if (!hazard) continue;
    if (feed.topic && hazard !== feed.topic) continue; // topic feed disagrees → drop
    // Headlines often omit the wilaya ("Incendies en Algérie : …") while the
    // lede names it, so search both before discarding as unplaceable.
    const wilayas = wilayasInFrenchText(`${title} ${summary}`);
    if (!wilayas.length) continue; // unplaceable — useless for a wilaya app
    out.push({
      id: `press:${link}`,
      source: "press",
      sourceName: feed.name,
      hazard,
      title,
      link,
      observedAt: new Date(when).toISOString(),
      wilayas,
    });
  }
  return out;
}

// Deliberately narrow: a false positive here becomes a wrong incident pin.
const HAZARD_RULES = [
  [/incendie|feu de for[êe]t|حريق|حرائق/i, "fire"],
  [/inondation|crue|oued en crue|سيول|فيضان/i, "flood"],
  [/canicule|vague de chaleur|موجة حر/i, "heat"],
  [/s[ée]isme|secousse|زلزال|هزة أرضية/i, "quake"],
  [/accident.{0,15}(route|circulation)|carambolage|حادث مرور/i, "road"],
  [/temp[êe]te|vents violents|rafales|عاصفة/i, "storm"],
  [/effondrement|glissement de terrain|انهيار/i, "other"],
];

function hazardOf(title) {
  for (const [re, h] of HAZARD_RULES) if (re.test(title)) return h;
  return null;
}

