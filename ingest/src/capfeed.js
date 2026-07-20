// ONM (Météo Algérie) official CAP v1.2 vigilance feed.
// Atom feed with inline cap:* fields, one entry per (event, wilaya).
// License: CC BY 4.0, attribution "Office National de la Météorologie".

import { blocks, tag, attr } from "./xml.js";
import { wilayaByFr } from "./wilayas.js";

export const ONM_FEED_URL = "https://ametvigilance.meteo.dz/rss/rss_meteo_dz.xml";

const EVENT_HAZARD = [
  [/heat\s*wave|canicule/i, "heat"],
  [/thunderstorm|orage/i, "storm"],
  [/strong\s*wind|vent/i, "wind"],
  [/sand\s*storm|sable/i, "sandstorm"],
  [/rain|pluie|flood|inondation/i, "flood"],
  [/snow|neige|cold|froid/i, "cold"],
];

export function hazardFromEvent(event) {
  for (const [re, h] of EVENT_HAZARD) if (re.test(event)) return h;
  return "other";
}

export async function fetchOnmAlerts(fetchFn = fetch) {
  const res = await fetchFn(ONM_FEED_URL, {
    headers: { accept: "application/xml,text/xml,*/*", "user-agent": "aisx-ews/0.1 (+ingest)" },
  });
  if (!res.ok) throw new Error(`ONM feed HTTP ${res.status}`);
  return parseOnmFeed(await res.text());
}

export function parseOnmFeed(xml) {
  const out = [];
  for (const e of blocks(xml, "entry")) {
    const title = tag(e, "title") || "";
    // "Heat Wave Severe warning for the wilaya: SIDI-BEL-ABBÈS"
    const m = title.match(/^(.*?)\s+(Moderate|Severe|Extreme)\s+warning for the wilaya:\s*(.+)$/i);
    const event = m ? m[1].trim() : title;
    const areaDesc = m ? m[3].trim() : tag(e, "cap:areaDesc") || "";
    const wilaya = wilayaByFr(areaDesc);
    out.push({
      id: tag(e, "id"),
      source: "onm",
      event,
      hazard: hazardFromEvent(event),
      severity: tag(e, "cap:severity") || (m ? m[2] : "Unknown"),
      urgency: tag(e, "cap:urgency"),
      certainty: tag(e, "cap:certainty"),
      status: tag(e, "cap:status"),
      msgType: tag(e, "cap:msgType"),
      sent: tag(e, "cap:sent"),
      onset: tag(e, "cap:onset"),
      expires: tag(e, "cap:expires"),
      areaDesc,
      wilaya: wilaya ? { code: wilaya.code, fr: wilaya.fr, ar: wilaya.ar } : null,
      capUrl: attr(e, "link", "href"),
    });
  }
  return out;
}

// The per-alert CAP file carries fr-FR + en-US info blocks and the wilaya
// boundary polygon. Used by scripts/harvest-polygons.js to build our GeoJSON.
export function parseCapDetail(xml) {
  const infos = blocks(xml, "info").map((i) => ({
    language: tag(i, "language"),
    event: tag(i, "event"),
    headline: tag(i, "headline"),
    description: tag(i, "description"),
    instruction: tag(i, "instruction"),
    areaDesc: tag(i, "areaDesc"),
    polygons: blocks(i, "polygon").map(parsePolygon),
  }));
  return { identifier: tag(xml, "identifier"), infos };
}

function parsePolygon(text) {
  // CAP polygon: "lat,lon lat,lon ..." -> [[lon,lat],...] (GeoJSON order)
  return text
    .trim()
    .split(/\s+/)
    .map((pair) => {
      const [lat, lon] = pair.split(",").map(Number);
      return [lon, lat];
    })
    .filter((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
}
