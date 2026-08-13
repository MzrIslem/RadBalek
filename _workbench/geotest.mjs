import { readFileSync } from 'fs';
import { makeWilayaResolver } from './src/geo.js';
const geo = JSON.parse(readFileSync('./data/wilayas.json','utf8'));
const r = makeWilayaResolver(geo);
const cases = [
  ['~30km off Bejaia', 37.05, 5.10],
  ['~55km off Algiers', 37.30, 3.06],
  ['off Chlef', 36.85, 1.20],
  ['off Oran', 36.30, -0.70],
  ['Zemmouri 2003 (onshore)', 36.90, 3.58],
  ['Boumerdes city', 36.76, 3.47],
];
for (const [n,la,lo] of cases) {
  const w = r(la,lo);
  console.log(`${w? 'OK   ' : 'NULL '} ${n.padEnd(26)} -> ${w? w.code+' '+w.fr : 'NULL  => NO RED ALERT'}`);
}
