// Fills wilayas absent from ONM harvesting using geoBoundaries DZA ADM1
// (CC-BY). ONM polygons stay authoritative; merged features are inserted
// FIRST so harvested ones paint on top (map hit-test iterates reversed).
import { readFileSync, writeFileSync } from "node:fs";
import { WILAYAS, normFr } from "../src/wilayas.js";

const path = new URL("../data/wilayas.json", import.meta.url);
const existing = JSON.parse(readFileSync(path, "utf8"));
existing.features = existing.features.filter((f) => f.properties.source?.includes("ONM"));
const have = new Set(existing.features.map((f) => f.properties.code));
const missing = WILAYAS.filter((w) => !have.has(w.code));
console.log(`missing ${missing.length}: ${missing.map((w) => w.fr).join(", ")}`);
if (!missing.length) process.exit(0);

const meta = await (await fetch("https://www.geoboundaries.org/api/current/gbOpen/DZA/ADM1/")).json();
const url = meta.simplifiedGeometryGeoJSON || meta.gjDownloadURL;
console.log("downloading:", url);
const gj = await (await fetch(url)).json();
console.log(`geoBoundaries features: ${gj.features.length}`);

const round = (ring) => ring; // keep full precision — rounding created sliver artifacts
const added = [];
for (const w of missing) {
  const targets = [normFr(w.fr), ...(w.extraFr || []).map(normFr)];
  const feat = gj.features.find((f) => {
    const n = normFr(String(f.properties.shapeName || ""));
    return targets.some((t) => n === t || n.includes(t) || t.includes(n));
  });
  if (!feat) {
    console.log(`  ! no match: ${w.fr}`);
    continue;
  }
  const g = feat.geometry;
  const geometry =
    g.type === "Polygon"
      ? { type: "Polygon", coordinates: [round(g.coordinates[0])] }
      : { type: "MultiPolygon", coordinates: g.coordinates.map((p) => [round(p[0])]) };
  added.push({
    type: "Feature",
    properties: { code: w.code, fr: w.fr, ar: w.ar, source: "geoBoundaries (CC BY)" },
    geometry,
  });
  console.log(`  + ${w.code} ${w.fr} (${feat.properties.shapeName})`);
}
// Last-resort approximate boxes for wilayas absent from every source —
// drawn underneath everything, replaced automatically once ONM covers them.
// Rough [W,S]→[E,N] boxes for post-2019 wilayas absent from every source.
// Painted borderless UNDER ONM polygons (which win where they overlap), so
// they fill the desert gaps without black holes. Not border-accurate.
const BOX = (w, s, e, n) => [[w, s], [e, s], [e, n], [w, n]];
const APPROX = {
  49: BOX(-0.6, 28.2, 1.9, 30.3), // Timimoun
  52: BOX(-3.6, 28.4, -1.1, 30.9), // Béni Abbès
  54: BOX(4.4, 18.9, 7.6, 21.6), // In Guezzam
  56: BOX(8.0, 22.8, 11.6, 26.6), // Djanet
  58: BOX(1.4, 28.9, 4.3, 31.3), // El Meniaa
};
const stillMissing = WILAYAS.filter((w) => !have.has(w.code) && !added.some((f) => f.properties.code === w.code));
const approx = [];
for (const w of stillMissing) {
  const box = APPROX[w.code];
  if (!box) continue;
  approx.push({
    type: "Feature",
    properties: { code: w.code, fr: w.fr, ar: w.ar, source: "approx geoBoundaries-derived" },
    geometry: { type: "Polygon", coordinates: [[...box, box[0]]] },
  });
  console.log(`  ~ ${w.code} ${w.fr} (approximate box)`);
}
existing.features = [...approx, ...added, ...existing.features];
writeFileSync(path, JSON.stringify(existing), "utf8");
console.log(`saved ${existing.features.length}/58 -> data/wilayas.json`);
