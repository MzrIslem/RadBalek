import { fetchFirmsHotspots, significantHotspots } from "../ingest/src/firms.js";
import { clusterHotspots } from "../ingest/src/geo.js";
const key = process.argv[2];
console.log("now UTC:", new Date().toISOString());
const old = await fetchFirmsHotspots(key, { days: 1 });          // the shipped behaviour
const neu = await fetchFirmsHotspots(key);                        // the fix (days=2 + 24h clip)
for (const [label, r] of [["days=1 (current prod)", old], ["days=2 + 24h clip (fix)", neu]]) {
  const sig = significantHotspots(r.hotspots);
  console.log(`${label}: skipped=${r.skipped} hotspots=${r.hotspots.length} significant=${sig.length} clusters=${clusterHotspots(sig).length} errors=${(r.errors||[]).length}`);
}
const times = neu.hotspots.map(h => h.observedAt).sort();
console.log("fix window:", times[0], "->", times.at(-1));
