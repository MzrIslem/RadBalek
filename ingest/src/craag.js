// CRAAG — Algeria's official national seismic authority (craag.dz).
//
// IMPORTANT, measured not assumed: CRAAG publishes days-to-weeks AFTER an
// event (an EMSC quake from 2026-07-13 was still absent 7 days later), and
// lists only ~40 events/year against the ~80/month it records. So it is NEVER
// an alert trigger — EMSC stays primary for speed.
//
// It earns its place for two things EMSC cannot give:
//   1. Official national attribution + the Algerian magnitude ("confirmé par
//      le CRAAG"), which is what Algerians actually trust.
//   2. The WILAYA by name — EMSC only ever says "NORTHERN ALGERIA".
// It also occasionally catches small local events EMSC misses entirely.
//
// No API exists (the WP REST API has no earthquake type); the listing is a
// plain server-rendered <table>. robots.txt permits it.

import { htmlToText } from "./xml.js";
import { WILAYAS, normFr } from "./wilayas.js";

const LIST_URL = "https://www.craag.dz/index.php/derniers-seismes/";
const UA = "Mozilla/5.0 (compatible; radbalek/0.2)";

export async function fetchCraag(fetchFn = fetch) {
  const res = await fetchFn(LIST_URL, { headers: { "user-agent": UA } });
  if (!res.ok) throw new Error(`CRAAG HTTP ${res.status}`);
  return parseCraag(await res.text());
}

export function parseCraag(html) {
  const out = [];
  // Rows: date | heure | magnitude | région | <a href=...map/?id=N>
  const re =
    /<td[^>]*>\s*(\d{4}-\d{2}-\d{2})\s*<\/td>\s*<td[^>]*>\s*([0-9:]{4,8})\s*<\/td>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>([\s\S]*?)<\/tr>/gi;
  let m;
  while ((m = re.exec(html))) {
    const [, date, time, mag, regionRaw, tail] = m;
    const region = htmlToText(regionRaw).replace(/\s+/g, " ").trim();
    const magnitude = Number(mag);
    if (!region || !Number.isFinite(magnitude)) continue;
    const year = Number(date.slice(0, 4));
    if (year < 2000 || year > 2100) continue; // hand-typed rows carry typos ("0205-08-21")
    const idMatch = tail.match(/map\/\?id=(\d+)/);
    out.push({
      id: `craag:${idMatch ? idMatch[1] : `${date}T${time}`}`,
      mag: magnitude,
      // Times are LOCAL Algeria (UTC+1) with NO timezone marker — a real trap.
      time: `${date}T${time.length === 5 ? `${time}:00` : time}+01:00`,
      region,
      wilaya: wilayaFromRegion(region),
      mapId: idMatch ? Number(idMatch[1]) : null,
    });
  }
  return out;
}

/// CRAAG writes the wilaya inline: "12 Km Nord Ouest de Ain El kerma W.Oran".
/// Spelling is inconsistent across rows ("W.Btna"/"W.Batna", "W.medea"), so we
/// match loosely against the canonical list.
export function wilayaFromRegion(region) {
  const tail = normFr(String(region).split(/w\./i).pop() || "");
  if (!tail) return null;
  let best = null;
  for (const w of WILAYAS) {
    const n = normFr(w.fr);
    if (!n) continue;
    if (tail.includes(n) || n.includes(tail.trim())) {
      if (!best || n.length > normFr(best.fr).length) best = w;
    }
  }
  return best ? { code: best.code, fr: best.fr, ar: best.ar } : null;
}

/// Attach official CRAAG confirmation to EMSC/USGS quakes.
/// Matched on time (±90s after converting CRAAG local→UTC) and magnitude (±0.8,
/// since agencies genuinely diverge: CRAAG M4.3 vs EMSC M4.6 on 2026-06-28).
export function enrichQuakes(quakes, craagRows) {
  if (!craagRows?.length) return quakes;
  return quakes.map((q) => {
    const qt = Date.parse(q.time);
    const hit = craagRows.find((c) => {
      const ct = Date.parse(c.time);
      return (
        Number.isFinite(ct) && Math.abs(ct - qt) <= 90_000 && Math.abs((c.mag ?? 0) - (q.mag ?? 0)) <= 0.8
      );
    });
    if (!hit) return q;
    return {
      ...q,
      craag: { mag: hit.mag, region: hit.region, id: hit.id },
      // The wilaya name is the real prize — EMSC never provides it.
      wilaya: hit.wilaya || q.wilaya || null,
    };
  });
}
