// Local runner: node run.js
// Env: FIRMS_MAP_KEY (optional) — free key from https://firms.modaps.eosdis.nasa.gov/api/map_key/
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { runPipeline } from "./src/pipeline.js";

// Load .dev.vars (wrangler's local-secrets convention) into env if present.
const varsPath = new URL("./.dev.vars", import.meta.url);
if (existsSync(varsPath))
  for (const line of readFileSync(varsPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
  }

const geoPath = new URL("./data/wilayas.json", import.meta.url);
const wilayasGeojson = existsSync(geoPath) ? JSON.parse(readFileSync(geoPath, "utf8")) : null;
if (!wilayasGeojson) console.log("note: data/wilayas.json missing — run `node scripts/harvest-polygons.js` to enable satellite->wilaya matching\n");

const result = await runPipeline({ firmsMapKey: process.env.FIRMS_MAP_KEY || null, wilayasGeojson, geminiApiKey: process.env.GEMINI_API_KEY || null });

mkdirSync(new URL("./out", import.meta.url), { recursive: true });
writeFileSync(new URL("./out/alerts.json", import.meta.url), JSON.stringify(result, null, 2), "utf8");

const s = result.stats;
console.log(`generated ${result.generatedAt}`);
console.log(`official alerts: ${s.activeAlerts}  by hazard: ${JSON.stringify(s.byHazard)}  by color: ${JSON.stringify(s.byColor)}`);
if (s.dgpcSitrep) console.log(`DGPC fire sitrep (${s.dgpcSitrep.postedAt}): total=${s.dgpcSitrep.total} ongoing=${s.dgpcSitrep.ongoing} contained=${s.dgpcSitrep.contained} extinguished=${s.dgpcSitrep.extinguished}`);
console.log(`incidents: ${s.incidents} (fire clusters from satellite: ${s.fireClusters}${s.firmsSkipped ? " — FIRMS skipped, no key" : ""})`);
console.log(`push notifications queued: ${result.notifications.length} topics`);
if (result.errors.length) console.log("errors:", result.errors);

console.log("\n--- red/extreme alerts ---");
for (const a of result.alerts.filter((a) => a.color === "red")) console.log(`  ${a.headline.fr}`);
console.log("\n--- sample incidents ---");
for (const i of result.incidents.slice(0, 8)) console.log(`  [${i.source}] ${i.headline.fr}`);
console.log("\nfull output: out/alerts.json");
