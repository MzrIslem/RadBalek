// Harvests wilaya boundary polygons from ONM's own CAP detail files
// (CC BY 4.0) into data/wilayas.json. ONM publishes one CAP file per
// (event, wilaya); each contains the wilaya polygon. Coverage grows as
// alerts rotate through wilayas — re-run to merge newly seen ones.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { ONM_FEED_URL, parseOnmFeed, parseCapDetail } from "../src/capfeed.js";
import { wilayaByFr } from "../src/wilayas.js";

const outUrl = new URL("../data/wilayas.json", import.meta.url);
const existing = existsSync(outUrl) ? JSON.parse(readFileSync(outUrl, "utf8")) : { type: "FeatureCollection", features: [] };
const have = new Set(existing.features.map((f) => f.properties.code));

const feedRes = await fetch(ONM_FEED_URL, { headers: { accept: "application/xml" } });
const entries = parseOnmFeed(await feedRes.text());

const byWilaya = new Map();
for (const e of entries) {
  if (!e.wilaya || !e.capUrl || byWilaya.has(e.wilaya.code) || have.has(e.wilaya.code)) continue;
  byWilaya.set(e.wilaya.code, e);
}
console.log(`feed has ${entries.length} entries; ${byWilaya.size} new wilayas to harvest (${have.size} already stored)`);

for (const [code, e] of byWilaya) {
  try {
    const res = await fetch(e.capUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const detail = parseCapDetail(await res.text());
    const info = detail.infos.find((i) => i.polygons?.length);
    if (!info) throw new Error("no polygon in CAP");
    const w = wilayaByFr(e.areaDesc);
    existing.features.push({
      type: "Feature",
      properties: { code: w.code, fr: w.fr, ar: w.ar, source: "ONM CAP (CC BY 4.0)" },
      geometry:
        info.polygons.length === 1
          ? { type: "Polygon", coordinates: [info.polygons[0]] }
          : { type: "MultiPolygon", coordinates: info.polygons.map((p) => [p]) },
    });
    console.log(`  + ${w.code} ${w.fr} (${info.polygons[0].length} pts)`);
    await new Promise((r) => setTimeout(r, 300));
  } catch (err) {
    console.log(`  ! ${code} ${e.areaDesc}: ${err.message}`);
  }
}

existing.features.sort((a, b) => a.properties.code - b.properties.code);
mkdirSync(new URL("../data", import.meta.url), { recursive: true });
writeFileSync(outUrl, JSON.stringify(existing), "utf8");
console.log(`saved ${existing.features.length}/58 wilayas -> data/wilayas.json`);

