const fs = require('fs');
const m = fs.readFileSync('C:/AISX/algeria-ews/ingest/.dev.vars', 'utf8').match(/FIRMS_MAP_KEY=(.+)/);
const key = m && m[1].trim();
if (!key) { console.log('no key'); process.exit(1); }
const BBOX = "-8.7,18.9,12.0,37.3";
const srcs = ["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT", "MODIS_NRT"];
(async () => {
  const t0 = Date.now();
  const results = await Promise.allSettled(srcs.map(async (src) => {
    const s = Date.now();
    const r = await fetch(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/${src}/${BBOX}/1`,
      { headers: { 'user-agent': 'aisx-ews/0.1' } });
    const txt = await r.text();
    const rows = txt.trim().split(/\r?\n/).length - 1;
    return { src, ms: Date.now() - s, status: r.status, rows };
  }));
  const total = Date.now() - t0;
  let seqSum = 0;
  results.forEach(x => {
    if (x.status === 'fulfilled') { console.log(`  ${x.value.src}: ${x.value.ms}ms  http ${x.value.status}  rows ${x.value.rows}`); seqSum += x.value.ms; }
    else console.log(`  FAIL: ${x.reason}`);
  });
  console.log(`PARALLEL wall time: ${total}ms   (old sequential ~= ${seqSum}ms — that's why it hit the 9000ms cap)`);
})();
