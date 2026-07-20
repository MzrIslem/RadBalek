// One-shot: convert fr33dz all-wilayas.geojson (real 58-wilaya boundaries,
// 22MB full-res) into our simplified data/wilayas.json schema {code,fr,ar,source}.
import { readFileSync, writeFileSync } from "node:fs";
import { WILAYAS, normFr } from "../src/wilayas.js";

const SRC = process.argv[2];
const g = JSON.parse(readFileSync(SRC, "utf8"));
console.log("features:", g.features.length);
console.log("prop keys:", Object.keys(g.features[0].properties).join(","));
console.log("sample props:", JSON.stringify(g.features[0].properties).slice(0, 400));

// Find the name field
const pk = Object.keys(g.features[0].properties);
const nameKey = pk.find((k) => /name|nom|wilaya/i.test(k)) || pk[0];
const codeKey = pk.find((k) => /code|id|mat/i.test(k));
console.log("using nameKey:", nameKey, "codeKey:", codeKey);

// Douglas-Peucker-lite: decimate to ~0.02° grid, drop consecutive dupes.
function simplify(ring) {
  const q = (n) => Math.round(n * 50) / 50; // 0.02°
  const out = [];
  let last = null;
  for (const [lo, la] of ring) {
    const p = [q(lo), q(la)];
    if (!last || p[0] !== last[0] || p[1] !== last[1]) {
      out.push(p);
      last = p;
    }
  }
  if (out.length && (out[0][0] !== out.at(-1)[0] || out[0][1] !== out.at(-1)[1])) out.push(out[0]);
  return out.length >= 4 ? out : null;
}

const byName = new Map();
for (const w of WILAYAS) {
  byName.set(normFr(w.fr), w);
  for (const v of w.extraFr || []) byName.set(normFr(v), w);
}

const features = [];
let matched = 0, unmatched = [];
for (const f of g.features) {
  const rawName = String(f.properties[nameKey] || "");
  const rawCode = codeKey ? Number(f.properties[codeKey]) : NaN;
  let w = byName.get(normFr(rawName));
  if (!w && Number.isFinite(rawCode)) w = WILAYAS.find((x) => x.code === rawCode);
  if (!w) {
    unmatched.push(rawName);
    continue;
  }
  const geo = f.geometry;
  const polys = geo.type === "Polygon" ? [geo.coordinates] : geo.coordinates;
  const outPolys = [];
  for (const poly of polys) {
    const outer = simplify(poly[0]);
    if (outer) outPolys.push([outer]);
  }
  if (!outPolys.length) continue;
  features.push({
    type: "Feature",
    properties: { code: w.code, fr: w.fr, ar: w.ar, source: "fr33dz Algeria-geojson (ODbL)" },
    geometry: outPolys.length === 1 ? { type: "Polygon", coordinates: outPolys[0] } : { type: "MultiPolygon", coordinates: outPolys },
  });
  matched++;
}

features.sort((a, b) => a.properties.code - b.properties.code);
const codes = new Set(features.map((f) => f.properties.code));
console.log("matched:", matched, "/ codes:", [...codes].sort((a, b) => a - b).join(","));
console.log("MISSING:", Array.from({ length: 58 }, (_, i) => i + 1).filter((c) => !codes.has(c)).join(","));
console.log("unmatched names:", [...new Set(unmatched)].slice(0, 20).join(" | "));

const out = { type: "FeatureCollection", features };
const path = new URL("../data/wilayas.json", import.meta.url);
writeFileSync(path, JSON.stringify(out), "utf8");
const bytes = JSON.stringify(out).length;
console.log("wrote data/wilayas.json:", (bytes / 1024).toFixed(0), "KB,", features.length, "features");
