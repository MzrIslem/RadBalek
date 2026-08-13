var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/xml.js
function blocks(xml, tag2) {
  const re = new RegExp(`<${tag2}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag2}>`, "g");
  const out = [];
  let m;
  while (m = re.exec(xml)) out.push(m[1]);
  return out;
}
__name(blocks, "blocks");
function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? decodeEntities(m[1].trim()) : null;
}
__name(tag, "tag");
function attr(xml, tagName, attrName) {
  const m = xml.match(new RegExp(`<${tagName}[^>]*\\b${attrName}="([^"]*)"`));
  return m ? decodeEntities(m[1]) : null;
}
__name(attr, "attr");
var NAMED = {
  nbsp: " ",
  rsquo: "\u2019",
  lsquo: "\u2018",
  rdquo: "\u201D",
  ldquo: "\u201C",
  hellip: "\u2026",
  mdash: "\u2014",
  ndash: "\u2013",
  eacute: "\xE9",
  egrave: "\xE8",
  ecirc: "\xEA",
  agrave: "\xE0",
  acirc: "\xE2",
  ccedil: "\xE7",
  ugrave: "\xF9",
  ocirc: "\xF4",
  icirc: "\xEE",
  iuml: "\xEF",
  euml: "\xEB",
  laquo: "\xAB",
  raquo: "\xBB",
  deg: "\xB0",
  euro: "\u20AC"
};
function decodeEntities(s) {
  return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#0?39;|&apos;/g, "'").replace(/&([a-zA-Z]+);/g, (m, name) => name in NAMED ? NAMED[name] : m).replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCodePoint(parseInt(n, 16))).replace(/&amp;/g, "&");
}
__name(decodeEntities, "decodeEntities");
function htmlToText(html) {
  return decodeEntities(
    html.replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|div)>/gi, "\n").replace(/<[^>]+>/g, "")
  ).replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
__name(htmlToText, "htmlToText");

// src/wilayas.js
var WILAYAS = [
  { code: 1, fr: "Adrar", ar: "\u0623\u062F\u0631\u0627\u0631" },
  { code: 2, fr: "Chlef", ar: "\u0627\u0644\u0634\u0644\u0641" },
  { code: 3, fr: "Laghouat", ar: "\u0627\u0644\u0623\u063A\u0648\u0627\u0637" },
  { code: 4, fr: "Oum El Bouaghi", ar: "\u0623\u0645 \u0627\u0644\u0628\u0648\u0627\u0642\u064A", extraFr: ["OUM-EL-BOUAGHI"] },
  { code: 5, fr: "Batna", ar: "\u0628\u0627\u062A\u0646\u0629" },
  { code: 6, fr: "B\xE9ja\xEFa", ar: "\u0628\u062C\u0627\u064A\u0629", extraFr: ["BEJAIA"] },
  { code: 7, fr: "Biskra", ar: "\u0628\u0633\u0643\u0631\u0629" },
  { code: 8, fr: "B\xE9char", ar: "\u0628\u0634\u0627\u0631", extraFr: ["BECHAR"] },
  { code: 9, fr: "Blida", ar: "\u0627\u0644\u0628\u0644\u064A\u062F\u0629" },
  { code: 10, fr: "Bouira", ar: "\u0627\u0644\u0628\u0648\u064A\u0631\u0629" },
  { code: 11, fr: "Tamanrasset", ar: "\u062A\u0645\u0646\u0631\u0627\u0633\u062A", extraFr: ["TAMENGHASSET", "TAMANGHASSET", "TAMENRASSET"], extraAr: ["\u062A\u0645\u0646\u063A\u0633\u062A"] },
  { code: 12, fr: "T\xE9bessa", ar: "\u062A\u0628\u0633\u0629", extraFr: ["TEBESSA"] },
  { code: 13, fr: "Tlemcen", ar: "\u062A\u0644\u0645\u0633\u0627\u0646" },
  { code: 14, fr: "Tiaret", ar: "\u062A\u064A\u0627\u0631\u062A" },
  { code: 15, fr: "Tizi Ouzou", ar: "\u062A\u064A\u0632\u064A \u0648\u0632\u0648", extraFr: ["TIZI-OUZOU"] },
  { code: 16, fr: "Alger", ar: "\u0627\u0644\u062C\u0632\u0627\u0626\u0631", extraFr: ["ALGIERS"], extraAr: ["\u0627\u0644\u062C\u0632\u0627\u0626\u0631 \u0627\u0644\u0639\u0627\u0635\u0645\u0629"] },
  { code: 17, fr: "Djelfa", ar: "\u0627\u0644\u062C\u0644\u0641\u0629" },
  { code: 18, fr: "Jijel", ar: "\u062C\u064A\u062C\u0644" },
  { code: 19, fr: "S\xE9tif", ar: "\u0633\u0637\u064A\u0641", extraFr: ["SETIF"] },
  { code: 20, fr: "Sa\xEFda", ar: "\u0633\u0639\u064A\u062F\u0629", extraFr: ["SAIDA"] },
  { code: 21, fr: "Skikda", ar: "\u0633\u0643\u064A\u0643\u062F\u0629" },
  { code: 22, fr: "Sidi Bel Abb\xE8s", ar: "\u0633\u064A\u062F\u064A \u0628\u0644\u0639\u0628\u0627\u0633", extraFr: ["SIDI-BEL-ABBES"] },
  { code: 23, fr: "Annaba", ar: "\u0639\u0646\u0627\u0628\u0629" },
  { code: 24, fr: "Guelma", ar: "\u0642\u0627\u0644\u0645\u0629" },
  { code: 25, fr: "Constantine", ar: "\u0642\u0633\u0646\u0637\u064A\u0646\u0629" },
  { code: 26, fr: "M\xE9d\xE9a", ar: "\u0627\u0644\u0645\u062F\u064A\u0629", extraFr: ["MEDEA"] },
  { code: 27, fr: "Mostaganem", ar: "\u0645\u0633\u062A\u063A\u0627\u0646\u0645" },
  { code: 28, fr: "M'Sila", ar: "\u0627\u0644\u0645\u0633\u064A\u0644\u0629", extraFr: ["MSILA"] },
  { code: 29, fr: "Mascara", ar: "\u0645\u0639\u0633\u0643\u0631" },
  { code: 30, fr: "Ouargla", ar: "\u0648\u0631\u0642\u0644\u0629", extraFr: ["OUARGLA"], extraAr: ["\u0648\u0631\u06A8\u0644\u0629"] },
  { code: 31, fr: "Oran", ar: "\u0648\u0647\u0631\u0627\u0646" },
  { code: 32, fr: "El Bayadh", ar: "\u0627\u0644\u0628\u064A\u0636", extraFr: ["EL-BAYADH"] },
  { code: 33, fr: "Illizi", ar: "\u0625\u0644\u064A\u0632\u064A" },
  { code: 34, fr: "Bordj Bou Arreridj", ar: "\u0628\u0631\u062C \u0628\u0648\u0639\u0631\u064A\u0631\u064A\u062C", extraFr: ["BORDJ-BOU-ARRERIDJ", "BBA"] },
  { code: 35, fr: "Boumerd\xE8s", ar: "\u0628\u0648\u0645\u0631\u062F\u0627\u0633", extraFr: ["BOUMERDES"] },
  { code: 36, fr: "El Tarf", ar: "\u0627\u0644\u0637\u0627\u0631\u0641", extraFr: ["EL-TARF", "EL-TAREF", "ELTAREF"] },
  { code: 37, fr: "Tindouf", ar: "\u062A\u0646\u062F\u0648\u0641" },
  { code: 38, fr: "Tissemsilt", ar: "\u062A\u064A\u0633\u0645\u0633\u064A\u0644\u062A" },
  { code: 39, fr: "El Oued", ar: "\u0627\u0644\u0648\u0627\u062F\u064A", extraFr: ["EL-OUED"] },
  { code: 40, fr: "Khenchela", ar: "\u062E\u0646\u0634\u0644\u0629" },
  { code: 41, fr: "Souk Ahras", ar: "\u0633\u0648\u0642 \u0623\u0647\u0631\u0627\u0633", extraFr: ["SOUK-AHRAS"] },
  { code: 42, fr: "Tipaza", ar: "\u062A\u064A\u0628\u0627\u0632\u0629", extraFr: ["TIPASA"] },
  { code: 43, fr: "Mila", ar: "\u0645\u064A\u0644\u0629" },
  { code: 44, fr: "A\xEFn Defla", ar: "\u0639\u064A\u0646 \u0627\u0644\u062F\u0641\u0644\u0649", extraFr: ["AIN-DEFLA", "AIN DEFLA"] },
  { code: 45, fr: "Na\xE2ma", ar: "\u0627\u0644\u0646\u0639\u0627\u0645\u0629", extraFr: ["NAAMA"] },
  { code: 46, fr: "A\xEFn T\xE9mouchent", ar: "\u0639\u064A\u0646 \u062A\u0645\u0648\u0634\u0646\u062A", extraFr: ["AIN-TEMOUCHENT"] },
  { code: 47, fr: "Gharda\xEFa", ar: "\u063A\u0631\u062F\u0627\u064A\u0629", extraFr: ["GHARDAIA"] },
  { code: 48, fr: "Relizane", ar: "\u063A\u0644\u064A\u0632\u0627\u0646" },
  { code: 49, fr: "Timimoun", ar: "\u062A\u064A\u0645\u064A\u0645\u0648\u0646", extraFr: ["TIMIMOUNE"] },
  { code: 50, fr: "Bordj Badji Mokhtar", ar: "\u0628\u0631\u062C \u0628\u0627\u062C\u064A \u0645\u062E\u062A\u0627\u0631", extraFr: ["BORDJ-BADJI-MOKHTAR"] },
  { code: 51, fr: "Ouled Djellal", ar: "\u0623\u0648\u0644\u0627\u062F \u062C\u0644\u0627\u0644", extraFr: ["OULED-DJELLAL"] },
  { code: 52, fr: "B\xE9ni Abb\xE8s", ar: "\u0628\u0646\u064A \u0639\u0628\u0627\u0633", extraFr: ["BENI-ABBES", "BENI ABBES"] },
  { code: 53, fr: "In Salah", ar: "\u0639\u064A\u0646 \u0635\u0627\u0644\u062D", extraFr: ["IN-SALAH", "AIN SALAH", "AIN-SALAH"] },
  { code: 54, fr: "In Guezzam", ar: "\u0639\u064A\u0646 \u0642\u0632\u0627\u0645", extraFr: ["IN-GUEZZAM", "AIN GUEZZAM", "AIN-GUEZZAM"] },
  { code: 55, fr: "Touggourt", ar: "\u062A\u0642\u0631\u062A", extraAr: ["\u062A\u0648\u0642\u0631\u062A", "\u062A\u06A8\u0631\u062A"] },
  { code: 56, fr: "Djanet", ar: "\u062C\u0627\u0646\u062A" },
  { code: 57, fr: "El M'Ghair", ar: "\u0627\u0644\u0645\u063A\u064A\u0631", extraFr: ["EL-MGHAIR", "EL-MEGHAIER", "EL MGHAIR"] },
  { code: 58, fr: "El Meniaa", ar: "\u0627\u0644\u0645\u0646\u064A\u0639\u0629", extraFr: ["EL-MENIAA", "EL-MENEA", "EL GOLEA", "EL-GOLEA", "EL MENIA", "EL-MENIA"] }
];
function normFr(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z]/g, "");
}
__name(normFr, "normFr");
function normAr(s) {
  return s.replace(/[ً-ْٰ]/g, "").replace(/[أإآ]/g, "\u0627").replace(/ى/g, "\u064A").replace(/ة/g, "\u0647").replace(/\s+/g, " ").trim();
}
__name(normAr, "normAr");
var frIndex = /* @__PURE__ */ new Map();
var arNames = [];
for (const w of WILAYAS) {
  frIndex.set(normFr(w.fr), w);
  for (const v of w.extraFr || []) frIndex.set(normFr(v), w);
  arNames.push({ norm: normAr(w.ar), w });
  for (const v of w.extraAr || []) arNames.push({ norm: normAr(v), w });
}
arNames.sort((a, b) => b.norm.length - a.norm.length);
function wilayaByFr(name) {
  return frIndex.get(normFr(name)) || null;
}
__name(wilayaByFr, "wilayaByFr");
function wilayaInArabicText(text) {
  const t = normAr(text);
  for (const { norm, w } of arNames) if (t.includes(norm)) return w;
  return null;
}
__name(wilayaInArabicText, "wilayaInArabicText");
function wilayaByCode(code) {
  return WILAYAS.find((w) => w.code === code) || null;
}
__name(wilayaByCode, "wilayaByCode");
function foldFr(s) {
  return String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
__name(foldFr, "foldFr");
function wilayasInFrenchText(text, { max = 4 } = {}) {
  const hay = ` ${foldFr(text)} `;
  const found = /* @__PURE__ */ new Map();
  for (const w of WILAYAS) {
    for (const name of [w.fr, ...w.extraFr || []]) {
      const needle = foldFr(name);
      if (needle.length < 4) continue;
      if (hay.includes(` ${needle} `)) {
        found.set(w.code, { code: w.code, fr: w.fr, ar: w.ar });
        break;
      }
    }
  }
  return [...found.values()].slice(0, max);
}
__name(wilayasInFrenchText, "wilayasInFrenchText");

// src/capfeed.js
var ONM_FEED_URL = "https://ametvigilance.meteo.dz/rss/rss_meteo_dz.xml";
var EVENT_HAZARD = [
  [/heat\s*wave|canicule/i, "heat"],
  [/thunderstorm|orage/i, "storm"],
  [/strong\s*wind|vent/i, "wind"],
  [/sand\s*storm|sable/i, "sandstorm"],
  [/rain|pluie|flood|inondation/i, "flood"],
  [/snow|neige|cold|froid/i, "cold"]
];
function hazardFromEvent(event) {
  for (const [re, h] of EVENT_HAZARD) if (re.test(event)) return h;
  return "other";
}
__name(hazardFromEvent, "hazardFromEvent");
async function fetchOnmAlerts(fetchFn = fetch) {
  const res = await fetchFn(ONM_FEED_URL, {
    headers: { accept: "application/xml,text/xml,*/*", "user-agent": "aisx-ews/0.1 (+ingest)" }
  });
  if (!res.ok) throw new Error(`ONM feed HTTP ${res.status}`);
  return parseOnmFeed(await res.text());
}
__name(fetchOnmAlerts, "fetchOnmAlerts");
function parseOnmFeed(xml) {
  const out = [];
  for (const e of blocks(xml, "entry")) {
    const title = tag(e, "title") || "";
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
      capUrl: attr(e, "link", "href")
    });
  }
  return out;
}
__name(parseOnmFeed, "parseOnmFeed");

// src/telegram.js
var DGPC_CHANNEL = "DGPCDZ";
var CHANNELS = ["DGPCDZ"];
async function fetchOne(fetchFn, channel) {
  const res = await fetchFn(`https://t.me/s/${channel}`, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; aisx-ews/0.1)" },
    redirect: "manual"
  });
  if (res.status !== 200) return [];
  return parseChannelPage(await res.text(), channel);
}
__name(fetchOne, "fetchOne");
async function fetchDgpcPosts(fetchFn = fetch, channels = CHANNELS) {
  const list = Array.isArray(channels) ? channels : [channels];
  const results = await Promise.allSettled(list.map((c) => fetchOne(fetchFn, c)));
  const posts = results.flatMap((r) => r.status === "fulfilled" ? r.value : []);
  if (!posts.length && list.length === 1) throw new Error(`t.me/s/${list[0]} empty`);
  return posts;
}
__name(fetchDgpcPosts, "fetchDgpcPosts");
function parseChannelPage(html, channel = DGPC_CHANNEL) {
  const posts = [];
  const re = new RegExp(`data-post="${channel}/(\\d+)"[\\s\\S]*?(?=data-post="${channel}/\\d+"|$)`, "g");
  let m;
  while (m = re.exec(html)) {
    const block = m[0];
    const textMatch = block.match(/tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const text = textMatch ? htmlToText(textMatch[1]) : "";
    const datetime = attr(block, "time", "datetime");
    if (!text) continue;
    posts.push(classifyPost({ id: `${channel}/${m[1]}`, postedAt: datetime, text }));
  }
  return posts;
}
__name(parseChannelPage, "parseChannelPage");
var KIND_RULES = [
  [/الحالة العامة لحرائق|حرائق الغطاء النباتي/, "fire-sitrep"],
  [/حريق/, "fire"],
  [/حادث(?:ة)? مرور|حوادث المرور|اصطدام|انحراف.*مركبة/, "road-crash"],
  [/غرق|شاطئ|سباحة/, "drowning"],
  [/اختناق|غاز|تسرب/, "gas"],
  [/زلزال|هزة/, "earthquake"],
  [/موجة حر|ارتفاع درجات الحرارة/, "heat"]
];
function classifyPost(post) {
  let kind = "other";
  for (const [re, k] of KIND_RULES)
    if (re.test(post.text)) {
      kind = k;
      break;
    }
  const out = { ...post, kind, wilaya: null, incidents: [], stats: null };
  const w = wilayaInArabicText(post.text);
  if (w) out.wilaya = { code: w.code, fr: w.fr, ar: w.ar };
  if (kind === "fire-sitrep") {
    const parsed = parseFireSitrep(post.text);
    out.incidents = parsed.incidents;
    out.stats = parsed.stats;
  }
  if (kind === "road-crash") out.casualties = extractCasualties(post.text);
  return out;
}
__name(classifyPost, "classifyPost");
function parseFireSitrep(text) {
  const incidents = [];
  const stats = {};
  const num = /* @__PURE__ */ __name((re) => {
    const m = text.match(re);
    return m ? Number(toWesternDigits(m[1])) : null;
  }, "num");
  stats.total = num(/إجمالي عدد الحرائق المسجلة\s*:?\s*(\d+|[٠-٩]+)/);
  stats.ongoing = num(/العمليات الجارية\s*:?\s*(\d+|[٠-٩]+)/);
  stats.contained = num(/تحت الحراسة[^:]*:?\s*(\d+|[٠-٩]+)/);
  stats.extinguished = num(/أُ?خمِ?دت نهائيا?ً?\s*:?\s*(\d+|[٠-٩]+)/);
  let status = "ongoing";
  let wilaya = null;
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    if (/الجارية|المتواصلة/.test(line) && !/:\s*\d/.test(line)) status = "ongoing";
    else if (/الحراسة/.test(line) && !/:\s*\d/.test(line)) status = "contained";
    else if (/خمدت نهائي|أُخمِدت نهائي/.test(line) && !/:\s*\d/.test(line)) status = "extinguished";
    const wm = line.match(/ولاية\s+(.+)/);
    if (wm) {
      const w = wilayaInArabicText(wm[0]);
      if (w) wilaya = { code: w.code, fr: w.fr, ar: w.ar };
      continue;
    }
    if (line.startsWith("*")) {
      const body = line.replace(/^\*\s*/, "");
      if (!body) continue;
      const place = (body.match(/بالمكان المسمى\s+(.+?)\s+ببلدية/) || [])[1] || null;
      const commune = (body.match(/ببلدية\s+([^.]+)/) || [])[1]?.trim() || null;
      const type = /حريق غابة/.test(body) ? "forest" : /أدغال|أحراش/.test(body) ? "scrub" : "vegetation";
      incidents.push({ status, type, place, commune, wilaya, textAr: body });
    }
  }
  return { incidents, stats };
}
__name(parseFireSitrep, "parseFireSitrep");
function extractCasualties(text) {
  const t = toWesternDigits(text);
  const dead = (t.match(/(\d+)\s*(?:قتيل|قتلى|وفاة|وفيات|متوفي)/) || [])[1];
  const injured = (t.match(/(\d+)\s*(?:جريح|جرحى|مصاب)/) || [])[1];
  return { dead: dead ? Number(dead) : null, injured: injured ? Number(injured) : null };
}
__name(extractCasualties, "extractCasualties");
function toWesternDigits(s) {
  return s.replace(/[٠-٩]/g, (d) => String("\u0660\u0661\u0662\u0663\u0664\u0665\u0666\u0667\u0668\u0669".indexOf(d)));
}
__name(toWesternDigits, "toWesternDigits");

// src/dgpcweb.js
var UA = "Mozilla/5.0 (compatible; radbalek/0.2; +https://github.com/rad-balek)";
async function fetchDgpcWeb(fetchFn = fetch, { sinceHours = 48, limit = 20 } = {}) {
  const after = new Date(Date.now() - sinceHours * 3600 * 1e3).toISOString().slice(0, 19);
  const url = `https://dgpc.dz/wp-json/wp/v2/posts?per_page=${limit}&after=${after}&_fields=id,date_gmt,link,title,content`;
  let lastErr;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetchFn(url, { headers: { "user-agent": UA, accept: "application/json" } });
      if (!res.ok) throw new Error(`dgpc.dz HTTP ${res.status}`);
      const rows = await res.json();
      if (!Array.isArray(rows)) throw new Error("dgpc.dz: unexpected payload");
      return rows.map(normalizePost).filter(Boolean);
    } catch (e) {
      lastErr = e;
    }
  }
  try {
    return await fetchDgpcRss(fetchFn, sinceHours);
  } catch {
    throw lastErr || new Error("dgpc.dz unreachable");
  }
}
__name(fetchDgpcWeb, "fetchDgpcWeb");
async function fetchDgpcRss(fetchFn, sinceHours) {
  const res = await fetchFn("https://dgpc.dz/feed/", {
    headers: { "user-agent": UA, accept: "application/rss+xml,*/*" }
  });
  if (!res.ok) throw new Error(`dgpc.dz/feed HTTP ${res.status}`);
  const xml = await res.text();
  const cutoff = Date.now() - sinceHours * 3600 * 1e3;
  const out = [];
  for (const item of blocks(xml, "item")) {
    const title = htmlToText(tag(item, "title") || "");
    const link = (tag(item, "link") || "").trim();
    const when = Date.parse(tag(item, "pubDate") || "");
    if (!title || !Number.isFinite(when) || when < cutoff) continue;
    const body = htmlToText(tag(item, "description") || "").slice(0, 1200);
    const text = `${title}
${body}`.trim();
    const aggregate = AGGREGATE.test(title);
    out.push({
      id: `dgpcweb:rss:${link.split("/").filter(Boolean).pop() || when}`,
      postedAt: new Date(when).toISOString(),
      link: link || "https://dgpc.dz/",
      title,
      text,
      kind: aggregate ? "bilan" : classify(text),
      aggregate,
      wilayas: aggregate ? [] : matchWilayas(text)
    });
  }
  return out;
}
__name(fetchDgpcRss, "fetchDgpcRss");
var AGGREGATE = /حصيلة تدخل|bilan (?:des )?interventions?|outcome of the civil protection|intervention results|الحصيلة اليومية/i;
function normalizePost(p) {
  const title = htmlToText(p?.title?.rendered || "");
  const bodyText = htmlToText(p?.content?.rendered || "").slice(0, 1200);
  const text = `${title}
${bodyText}`.trim();
  if (!text) return null;
  const aggregate = AGGREGATE.test(title);
  return {
    id: `dgpcweb:${p.id}`,
    postedAt: p.date_gmt ? `${p.date_gmt}Z` : (/* @__PURE__ */ new Date()).toISOString(),
    link: p.link || "https://dgpc.dz/",
    title,
    text,
    kind: aggregate ? "bilan" : classify(text),
    aggregate,
    // Never geo-pin a national bilan.
    wilayas: aggregate ? [] : matchWilayas(text)
  };
}
__name(normalizePost, "normalizePost");
var RULES = [
  [/incendie|حريق|feu de for|حرائق/i, "fire"],
  [/accident.{0,12}(de la )?circulation|حادث(?:ة)? مرور|حوادث المرور|collision/i, "road-crash"],
  [/noyade|غرق|plage|شاطئ/i, "drowning"],
  [/asphyxie|اختناق|monoxyde|غاز/i, "gas"],
  [/inondation|فيضان|crue|سيول/i, "flood"],
  [/séisme|seisme|زلزال|هزة/i, "earthquake"],
  [/canicule|موجة حر/i, "heat"]
];
function classify(text) {
  for (const [re, kind] of RULES) if (re.test(text)) return kind;
  return "other";
}
__name(classify, "classify");
function matchWilayas(text) {
  const found = /* @__PURE__ */ new Map();
  for (const w of wilayasInFrenchText(text, { max: 6 })) found.set(w.code, w);
  const ar = wilayaInArabicText(text);
  if (ar) found.set(ar.code, { code: ar.code, fr: ar.fr, ar: ar.ar });
  return [...found.values()].slice(0, 6);
}
__name(matchWilayas, "matchWilayas");

// src/news.js
var FEEDS = [
  { url: "https://www.tsa-algerie.com/tag/incendies/feed/", name: "TSA", topic: "fire" },
  { url: "https://www.tsa-algerie.com/tag/canicule/feed/", name: "TSA", topic: "heat" },
  { url: "https://www.tsa-algerie.com/feed/", name: "TSA", topic: null },
  { url: "https://www.ennaharonline.com/category/algeria/feed/", name: "Ennahar", topic: null }
];
var UA2 = "Mozilla/5.0 (compatible; radbalek/0.2)";
var MAX_AGE_MS = 24 * 3600 * 1e3;
async function fetchNews(fetchFn = fetch, feeds = FEEDS) {
  const settled = await Promise.allSettled(feeds.map((f) => fetchFeed(fetchFn, f)));
  const items = settled.flatMap((r) => r.status === "fulfilled" ? r.value : []);
  const byLink = /* @__PURE__ */ new Map();
  for (const it of items) if (!byLink.has(it.link)) byLink.set(it.link, it);
  return [...byLink.values()].sort((a, b) => a.observedAt < b.observedAt ? 1 : -1).slice(0, 40);
}
__name(fetchNews, "fetchNews");
async function fetchFeed(fetchFn, feed) {
  const res = await fetchFn(feed.url, { headers: { "user-agent": UA2, accept: "application/rss+xml,*/*" } });
  if (!res.ok) throw new Error(`${feed.name} HTTP ${res.status}`);
  const xml = await res.text();
  const out = [];
  for (const item of blocks(xml, "item")) {
    const title = htmlToText(tag(item, "title") || "");
    const link = (tag(item, "link") || "").trim();
    const pub = tag(item, "pubDate") || "";
    const when = Date.parse(pub);
    if (!title || !link || !Number.isFinite(when)) continue;
    if (Date.now() - when > MAX_AGE_MS) continue;
    const summary = htmlToText(tag(item, "description") || "").slice(0, 600);
    const hazard = hazardOf(`${title} ${summary}`);
    if (!hazard) continue;
    if (feed.topic && hazard !== feed.topic) continue;
    const wilayas = wilayasInFrenchText(`${title} ${summary}`);
    if (!wilayas.length) continue;
    out.push({
      id: `press:${link}`,
      source: "press",
      sourceName: feed.name,
      hazard,
      title,
      link,
      observedAt: new Date(when).toISOString(),
      wilayas
    });
  }
  return out;
}
__name(fetchFeed, "fetchFeed");
var HAZARD_RULES = [
  [/incendie|feu de for[êe]t|حريق|حرائق/i, "fire"],
  [/inondation|crue|oued en crue|سيول|فيضان/i, "flood"],
  [/canicule|vague de chaleur|موجة حر/i, "heat"],
  [/s[ée]isme|secousse|زلزال|هزة أرضية/i, "quake"],
  [/accident.{0,15}(route|circulation)|carambolage|حادث مرور/i, "road"],
  [/temp[êe]te|vents violents|rafales|عاصفة/i, "storm"],
  [/effondrement|glissement de terrain|انهيار/i, "other"]
];
function hazardOf(title) {
  for (const [re, h] of HAZARD_RULES) if (re.test(title)) return h;
  return null;
}
__name(hazardOf, "hazardOf");

// src/craag.js
var LIST_URL = "https://www.craag.dz/index.php/derniers-seismes/";
var UA3 = "Mozilla/5.0 (compatible; radbalek/0.2)";
async function fetchCraag(fetchFn = fetch) {
  const res = await fetchFn(LIST_URL, { headers: { "user-agent": UA3 } });
  if (!res.ok) throw new Error(`CRAAG HTTP ${res.status}`);
  const html = await res.text();
  const rows = parseCraag(html);
  if (!rows.length && html.length > 5e3) throw new Error("CRAAG: 0 rows parsed (markup drift?)");
  return rows;
}
__name(fetchCraag, "fetchCraag");
function parseCraag(html) {
  const out = [];
  const re = /<td[^>]*>\s*(\d{4}-\d{2}-\d{2})\s*<\/td>\s*<td[^>]*>\s*([0-9:]{4,8})\s*<\/td>\s*<td[^>]*>\s*([\d.]+)\s*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>([\s\S]*?)<\/tr>/gi;
  let m;
  while (m = re.exec(html)) {
    const [, date, time, mag, regionRaw, tail] = m;
    const region = htmlToText(regionRaw).replace(/\s+/g, " ").trim();
    const magnitude = Number(mag);
    if (!region || !Number.isFinite(magnitude)) continue;
    const year = Number(date.slice(0, 4));
    if (year < 2e3 || year > 2100) continue;
    const idMatch = tail.match(/map\/\?id=(\d+)/);
    out.push({
      id: `craag:${idMatch ? idMatch[1] : `${date}T${time}`}`,
      mag: magnitude,
      // Times are LOCAL Algeria (UTC+1) with NO timezone marker — a real trap.
      time: `${date}T${time.length === 5 ? `${time}:00` : time}+01:00`,
      region,
      wilaya: wilayaFromRegion(region),
      mapId: idMatch ? Number(idMatch[1]) : null
    });
  }
  return out;
}
__name(parseCraag, "parseCraag");
function wilayaFromRegion(region) {
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
__name(wilayaFromRegion, "wilayaFromRegion");
function enrichQuakes(quakes, craagRows) {
  if (!craagRows?.length) return quakes;
  return quakes.map((q) => {
    const qt = Date.parse(q.time);
    const hit = craagRows.find((c) => {
      const ct = Date.parse(c.time);
      return Number.isFinite(ct) && Math.abs(ct - qt) <= 9e4 && Math.abs((c.mag ?? 0) - (q.mag ?? 0)) <= 0.8;
    });
    if (!hit) return q;
    return {
      ...q,
      craag: { mag: hit.mag, region: hit.region, id: hit.id },
      // The wilaya name is the real prize — EMSC never provides it.
      wilaya: hit.wilaya || q.wilaya || null
    };
  });
}
__name(enrichQuakes, "enrichQuakes");

// src/firms.js
var DZ_BBOX = "-8.7,18.9,12.0,37.3";
var FIRMS_SOURCES = ["VIIRS_SNPP_NRT", "VIIRS_NOAA20_NRT", "VIIRS_NOAA21_NRT", "MODIS_NRT"];
async function fetchFirmsHotspots(mapKey, { days = 1, sources = FIRMS_SOURCES, fetchFn = fetch } = {}) {
  if (!mapKey) return { skipped: true, reason: "FIRMS_MAP_KEY not set", hotspots: [] };
  mapKey = String(mapKey).trim();
  const results = await Promise.allSettled(
    sources.map(async (src) => {
      const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${mapKey}/${src}/${DZ_BBOX}/${days}`;
      const res = await fetchFn(url, {
        headers: { "user-agent": "aisx-ews/0.1 (+ingest)", accept: "text/csv,*/*" },
        signal: AbortSignal.timeout(18e3)
      });
      if (!res.ok) throw new Error(`FIRMS ${src} HTTP ${res.status}`);
      return parseFirmsCsv(await res.text(), src);
    })
  );
  const hotspots = [];
  const errors = [];
  for (const r of results) {
    if (r.status === "fulfilled") hotspots.push(...r.value);
    else errors.push(String(r.reason && r.reason.message ? r.reason.message : r.reason));
  }
  if (!hotspots.length && errors.length === sources.length) {
    return { skipped: true, reason: errors.join("; "), hotspots: [] };
  }
  return { skipped: false, hotspots, errors };
}
__name(fetchFirmsHotspots, "fetchFirmsHotspots");
function parseFirmsCsv(csv, sourceName) {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const cols = lines[0].split(",");
  const idx = /* @__PURE__ */ __name((name) => cols.indexOf(name), "idx");
  const iLat = idx("latitude");
  const iLon = idx("longitude");
  const iDate = idx("acq_date");
  const iTime = idx("acq_time");
  const iConf = idx("confidence");
  const iFrp = idx("frp");
  const iDay = idx("daynight");
  const out = [];
  for (let i = 1; i < lines.length; i++) {
    const f = lines[i].split(",");
    if (f.length < cols.length) continue;
    const lat = Number(f[iLat]);
    const lon = Number(f[iLon]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const hhmm = f[iTime].padStart(4, "0");
    out.push({
      source: sourceName,
      lat,
      lon,
      observedAt: `${f[iDate]}T${hhmm.slice(0, 2)}:${hhmm.slice(2)}:00Z`,
      confidence: iConf >= 0 ? f[iConf] : null,
      // VIIRS: l/n/h, MODIS: 0-100
      frp: iFrp >= 0 ? Number(f[iFrp]) : null,
      // fire radiative power, MW
      daynight: iDay >= 0 ? f[iDay] : null
    });
  }
  return out;
}
__name(parseFirmsCsv, "parseFirmsCsv");
function significantHotspots(hotspots) {
  return hotspots.filter((h) => {
    if (h.confidence === "l") return false;
    if (h.confidence == null || h.confidence === "") return true;
    const n = Number(h.confidence);
    if (Number.isFinite(n) && n < 30) return false;
    return true;
  });
}
__name(significantHotspots, "significantHotspots");

// src/quakes.js
var BOX = "minlatitude=18.9&maxlatitude=37.5&minlongitude=-8.7&maxlongitude=12&minmagnitude=3";
async function fetchQuakes(fetchFn = fetch) {
  const start = new Date(Date.now() - 14 * 24 * 3600 * 1e3).toISOString().slice(0, 10);
  try {
    return await fromEmsc(fetchFn, start);
  } catch {
    return await fromUsgs(fetchFn, start);
  }
}
__name(fetchQuakes, "fetchQuakes");
async function fromEmsc(fetchFn, start) {
  const res = await fetchFn(
    `https://www.seismicportal.eu/fdsnws/event/1/query?format=json&starttime=${start}&${BOX}&limit=100`,
    { headers: { "user-agent": "radbalek/0.2" } }
  );
  if (res.status === 204) return [];
  if (!res.ok) throw new Error(`EMSC HTTP ${res.status}`);
  const j = await res.json();
  return (j.features || []).map((f) => ({
    id: `emsc:${f.id}`,
    mag: f.properties.mag,
    time: f.properties.time,
    depth: f.properties.depth,
    lat: f.properties.lat,
    lon: f.properties.lon,
    place: f.properties.flynn_region
  }));
}
__name(fromEmsc, "fromEmsc");
async function fromUsgs(fetchFn, start) {
  const res = await fetchFn(
    `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start}&${BOX}&orderby=time`,
    { headers: { "user-agent": "radbalek/0.2" } }
  );
  if (!res.ok) throw new Error(`USGS HTTP ${res.status}`);
  const j = await res.json();
  return (j.features || []).map((f) => ({
    id: `usgs:${f.id}`,
    mag: f.properties.mag,
    time: new Date(f.properties.time).toISOString(),
    depth: f.geometry.coordinates[2],
    lat: f.geometry.coordinates[1],
    lon: f.geometry.coordinates[0],
    place: f.properties.place
  }));
}
__name(fromUsgs, "fromUsgs");

// src/geo.js
function pointInRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
__name(pointInRing, "pointInRing");
function makeWilayaResolver(geojson) {
  if (!geojson) return () => null;
  const features = geojson.features.map((f) => {
    const rings = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    let minLon = Infinity, minLat = Infinity, maxLon = -Infinity, maxLat = -Infinity;
    for (const poly of rings)
      for (const [lon, lat] of poly[0]) {
        if (lon < minLon) minLon = lon;
        if (lat < minLat) minLat = lat;
        if (lon > maxLon) maxLon = lon;
        if (lat > maxLat) maxLat = lat;
      }
    return { props: f.properties, rings, bbox: [minLon, minLat, maxLon, maxLat] };
  });
  return /* @__PURE__ */ __name(function resolve(lat, lon, maxDeg = 0.5) {
    for (const f of features) {
      const [w, s, e, n] = f.bbox;
      if (lon < w || lon > e || lat < s || lat > n) continue;
      for (const poly of f.rings) if (pointInRing(lon, lat, poly[0])) return f.props;
    }
    let best = null;
    let bestD = maxDeg * maxDeg;
    for (const f of features) {
      const cx = (f.bbox[0] + f.bbox[2]) / 2;
      const cy = (f.bbox[1] + f.bbox[3]) / 2;
      const d = (cx - lon) ** 2 + (cy - lat) ** 2;
      if (d < bestD) {
        bestD = d;
        best = f.props;
      }
    }
    return best;
  }, "resolve");
}
__name(makeWilayaResolver, "makeWilayaResolver");
var FLARE_ZONES = [
  { w: 5, s: 29.5, e: 9.5, n: 32.5 },
  { w: 2.7, s: 32.3, e: 4.3, n: 33.4 },
  { w: 8, s: 27, e: 10.2, n: 29.5 },
  { w: -1.2, s: 27.5, e: 0.6, n: 29.2 }
];
function inFlareZone(lat, lon) {
  return FLARE_ZONES.some((z) => lon >= z.w && lon <= z.e && lat >= z.s && lat <= z.n);
}
__name(inFlareZone, "inFlareZone");
function clusterHotspots(hotspots, cellDeg = 0.05) {
  const cells = /* @__PURE__ */ new Map();
  for (const h of hotspots) {
    const key = `${Math.round(h.lat / cellDeg)}:${Math.round(h.lon / cellDeg)}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key).push(h);
  }
  return [...cells.values()].map((group) => {
    const lat = group.reduce((s, h) => s + h.lat, 0) / group.length;
    const lon = group.reduce((s, h) => s + h.lon, 0) / group.length;
    const frp = group.reduce((s, h) => s + (h.frp || 0), 0);
    const latest = group.map((h) => h.observedAt).sort().at(-1);
    return { lat, lon, count: group.length, totalFrp: Math.round(frp * 10) / 10, latestObservedAt: latest };
  });
}
__name(clusterHotspots, "clusterHotspots");

// src/normalize.js
var SEVERITY_COLOR = { Moderate: "yellow", Severe: "orange", Extreme: "red" };
var HAZARD_LABELS = {
  heat: { fr: "Canicule", en: "Heat wave", ar: "\u0645\u0648\u062C\u0629 \u062D\u0631" },
  storm: { fr: "Orages", en: "Thunderstorms", ar: "\u0639\u0648\u0627\u0635\u0641 \u0631\u0639\u062F\u064A\u0629" },
  wind: { fr: "Vent fort", en: "Strong wind", ar: "\u0631\u064A\u0627\u062D \u0642\u0648\u064A\u0629" },
  sandstorm: { fr: "Temp\xEAte de sable", en: "Sandstorm", ar: "\u0639\u0627\u0635\u0641\u0629 \u0631\u0645\u0644\u064A\u0629" },
  flood: { fr: "Pluies/Inondations", en: "Rain/Flooding", ar: "\u0623\u0645\u0637\u0627\u0631 \u0648\u0641\u064A\u0636\u0627\u0646\u0627\u062A" },
  cold: { fr: "Froid/Neige", en: "Cold/Snow", ar: "\u0628\u0631\u062F \u0648\u062B\u0644\u0648\u062C" },
  fire: { fr: "Feu de for\xEAt", en: "Wildfire", ar: "\u062D\u0631\u064A\u0642 \u063A\u0627\u0628\u0629" },
  road: { fr: "Danger routier", en: "Road hazard", ar: "\u062E\u0637\u0631 \u0639\u0644\u0649 \u0627\u0644\u0637\u0631\u064A\u0642" },
  other: { fr: "Alerte", en: "Alert", ar: "\u062A\u0646\u0628\u064A\u0647" }
};
var SEVERITY_LABELS = {
  yellow: { fr: "vigilance jaune", en: "yellow alert", ar: "\u062A\u062D\u0630\u064A\u0631 \u0623\u0635\u0641\u0631" },
  orange: { fr: "vigilance orange", en: "orange alert", ar: "\u062A\u062D\u0630\u064A\u0631 \u0628\u0631\u062A\u0642\u0627\u0644\u064A" },
  red: { fr: "vigilance rouge", en: "red alert", ar: "\u062A\u062D\u0630\u064A\u0631 \u0623\u062D\u0645\u0631" }
};
function severityColor(severity) {
  return SEVERITY_COLOR[severity] || "yellow";
}
__name(severityColor, "severityColor");
function normalizeOnm(onmAlert) {
  const color = severityColor(onmAlert.severity);
  const h = HAZARD_LABELS[onmAlert.hazard] || HAZARD_LABELS.other;
  const s = SEVERITY_LABELS[color];
  const w = onmAlert.wilaya;
  const wFr = w ? w.fr : onmAlert.areaDesc;
  const wAr = w ? w.ar : onmAlert.areaDesc;
  return {
    id: onmAlert.id,
    class: "alert",
    source: "onm",
    sourceName: "M\xE9t\xE9o Alg\xE9rie (ONM)",
    hazard: onmAlert.hazard,
    event: onmAlert.event,
    severity: onmAlert.severity,
    color,
    urgency: onmAlert.urgency,
    certainty: onmAlert.certainty,
    onset: onmAlert.onset,
    expires: onmAlert.expires,
    sent: onmAlert.sent,
    wilayas: w ? [w] : [],
    headline: {
      fr: `${h.fr} \u2014 ${s.fr} \u2014 ${wFr}`,
      en: `${h.en} \u2014 ${s.en} \u2014 ${wFr}`,
      ar: `${h.ar} \u2014 ${s.ar} \u2014 \u0648\u0644\u0627\u064A\u0629 ${wAr}`
    },
    link: onmAlert.capUrl
  };
}
__name(normalizeOnm, "normalizeOnm");
function normalizeFireCluster(cluster, wilayaProps, { corroborated = false, possibleIndustrial = false } = {}) {
  const w = wilayaProps ? { code: wilayaProps.code, fr: wilayaProps.fr, ar: wilayaProps.ar } : null;
  const where = { fr: w ? w.fr : "Alg\xE9rie", ar: w ? `\u0648\u0644\u0627\u064A\u0629 ${w.ar}` : "\u0627\u0644\u062C\u0632\u0627\u0626\u0631" };
  return {
    corroborated,
    // DGPC reports ongoing fires in the same wilaya
    possibleIndustrial,
    // inside a known oil/gas flare basin — likely not a wildfire
    id: `firms:${cluster.lat.toFixed(3)},${cluster.lon.toFixed(3)}:${cluster.latestObservedAt}`,
    class: "incident",
    source: "firms",
    sourceName: "NASA FIRMS (satellite)",
    hazard: "fire",
    status: "detected",
    lat: cluster.lat,
    lon: cluster.lon,
    detections: cluster.count,
    totalFrp: cluster.totalFrp,
    observedAt: cluster.latestObservedAt,
    wilayas: w ? [w] : [],
    headline: {
      fr: `Point chaud satellite (${cluster.count} d\xE9tections) \u2014 ${where.fr}`,
      en: `Satellite hotspot (${cluster.count} detections) \u2014 ${where.fr}`,
      ar: `\u0646\u0642\u0637\u0629 \u062D\u0631\u0627\u0631\u064A\u0629 \u0639\u0628\u0631 \u0627\u0644\u0623\u0642\u0645\u0627\u0631 \u0627\u0644\u0635\u0646\u0627\u0639\u064A\u0629 (${cluster.count} \u0631\u0635\u062F) \u2014 ${where.ar}`
    }
  };
}
__name(normalizeFireCluster, "normalizeFireCluster");
function normalizeDgpcIncident(inc, postId, postedAt) {
  const w = inc.wilaya;
  const typeAr = inc.type === "forest" ? "\u062D\u0631\u064A\u0642 \u063A\u0627\u0628\u0629" : "\u062D\u0631\u064A\u0642 \u0623\u062F\u063A\u0627\u0644 \u0648\u0623\u062D\u0631\u0627\u0634";
  const typeFr = inc.type === "forest" ? "Feu de for\xEAt" : "Feu de broussailles";
  const where = [inc.place, inc.commune].filter(Boolean).join("\u060C ");
  return {
    id: `dgpc:${postId}:${w ? w.code : 0}:${(inc.place || "").slice(0, 24)}`,
    class: "incident",
    source: "dgpc-telegram",
    sourceName: "Protection Civile (Telegram)",
    hazard: "fire",
    status: inc.status,
    // ongoing | contained | extinguished
    observedAt: postedAt,
    wilayas: w ? [w] : [],
    place: inc.place,
    commune: inc.commune,
    headline: {
      fr: `${typeFr} (${statusFr(inc.status)}) \u2014 ${inc.commune || ""}${w ? ", " + w.fr : ""}`,
      en: `${typeFr} (${inc.status}) \u2014 ${inc.commune || ""}${w ? ", " + w.fr : ""}`,
      ar: `${typeAr} (${statusAr(inc.status)}) \u2014 ${where}${w ? " \u2014 \u0648\u0644\u0627\u064A\u0629 " + w.ar : ""}`
    },
    textAr: inc.textAr
  };
}
__name(normalizeDgpcIncident, "normalizeDgpcIncident");
function statusFr(s) {
  return { ongoing: "en cours", contained: "ma\xEEtris\xE9, sous surveillance", extinguished: "\xE9teint" }[s] || s;
}
__name(statusFr, "statusFr");
function statusAr(s) {
  return { ongoing: "\u0639\u0645\u0644\u064A\u0629 \u062C\u0627\u0631\u064A\u0629", contained: "\u062A\u062D\u062A \u0627\u0644\u062D\u0631\u0627\u0633\u0629", extinguished: "\u0623\u064F\u062E\u0645\u062F \u0646\u0647\u0627\u0626\u064A\u0627\u064B" }[s] || s;
}
__name(statusAr, "statusAr");
function fcmTopicsFor(item) {
  if (item.class !== "alert") return [];
  if (item.color === "yellow") return [];
  return item.wilayas.map((w) => `w${w.code}_${item.hazard}_${item.color}`);
}
__name(fcmTopicsFor, "fcmTopicsFor");

// src/pipeline.js
async function runPipeline({ firmsMapKey = null, wilayasGeojson = null, fetchFn = fetch, now = /* @__PURE__ */ __name(() => /* @__PURE__ */ new Date(), "now") } = {}) {
  const errors = [];
  const T = /* @__PURE__ */ __name((p, ms, name) => Promise.race([Promise.resolve(p), new Promise((_, rej) => setTimeout(() => rej(new Error(`${name} timeout ${ms}ms`)), ms))]), "T");
  const settled = await Promise.allSettled([
    T(fetchOnmAlerts(fetchFn), 9e3, "onm"),
    T(fetchDgpcPosts(fetchFn), 8e3, "dgpc-telegram"),
    T(fetchFirmsHotspots(firmsMapKey, { fetchFn }), 2e4, "firms"),
    T(fetchQuakes(fetchFn), 8e3, "quakes"),
    T(fetchDgpcWeb(fetchFn), 8e3, "dgpc-web"),
    T(fetchNews(fetchFn), 8e3, "news"),
    T(fetchCraag(fetchFn), 8e3, "craag")
  ]);
  const [onmR, dgpcR, firmsR, quakesR, dgpcWebR, newsR, craagR] = settled;
  const grab = /* @__PURE__ */ __name((r, name, fallback) => {
    if (r.status === "fulfilled") return r.value;
    errors.push({ source: name, error: String(r.reason) });
    return fallback;
  }, "grab");
  const onm = grab(onmR, "onm", []);
  const dgpcPosts = grab(dgpcR, "dgpc-telegram", []);
  const firms = grab(firmsR, "firms", { skipped: true, hotspots: [] });
  const dgpcWeb = grab(dgpcWebR, "dgpc-web", []);
  const news = grab(newsR, "press", []);
  const craagRows = grab(craagR, "craag", []);
  const quakes = enrichQuakes(grab(quakesR, "usgs", []), craagRows);
  const nowIso = now().toISOString();
  const alerts = onm.filter((a) => a.status === "Actual" && a.msgType !== "Cancel").filter((a) => !a.expires || a.expires >= nowIso).map(normalizeOnm);
  const incidents = [];
  const resolveWilaya = makeWilayaResolver(wilayasGeojson);
  const latestSitrep = dgpcPosts.filter((p) => p.kind === "fire-sitrep").sort((a, b) => a.postedAt < b.postedAt ? 1 : -1)[0];
  const dgpcFireWilayas = new Set(
    (latestSitrep?.incidents || []).filter((i) => i.status === "ongoing" && i.wilaya).map((i) => i.wilaya.code)
  );
  const clusters = clusterHotspots(significantHotspots(firms.hotspots));
  for (const c of clusters) {
    const w = resolveWilaya(c.lat, c.lon);
    incidents.push(
      normalizeFireCluster(c, w, {
        corroborated: !!(w && dgpcFireWilayas.has(w.code)),
        possibleIndustrial: inFlareZone(c.lat, c.lon)
      })
    );
  }
  if (latestSitrep) for (const inc of latestSitrep.incidents) incidents.push(normalizeDgpcIncident(inc, latestSitrep.id, latestSitrep.postedAt));
  for (const p of dgpcPosts) {
    if (p.kind !== "road-crash") continue;
    incidents.push({
      id: `dgpc:${p.id}`,
      class: "incident",
      source: "dgpc-telegram",
      sourceName: "Protection Civile (Telegram)",
      hazard: "road",
      status: "reported",
      observedAt: p.postedAt,
      wilayas: p.wilaya ? [p.wilaya] : [],
      casualties: p.casualties || null,
      headline: {
        fr: `Accident de la route${p.wilaya ? " \u2014 " + p.wilaya.fr : ""}`,
        en: `Road crash${p.wilaya ? " \u2014 " + p.wilaya.fr : ""}`,
        ar: `\u062D\u0627\u062F\u062B \u0645\u0631\u0648\u0631${p.wilaya ? " \u2014 \u0648\u0644\u0627\u064A\u0629 " + p.wilaya.ar : ""}`
      },
      textAr: p.text.slice(0, 500)
    });
  }
  for (const q of quakes) {
    const w = resolveWilaya(q.lat, q.lon) || (q.lat > 36 ? resolveWilaya(q.lat, q.lon, 1.5) : null) || q.wilaya || null;
    const quakeAge = Date.now() - Date.parse(q.time);
    const qT0 = Math.round(Date.parse(q.time) / 6e4) * 6e4;
    if (q.mag >= 4.5 && w && quakeAge < 6 * 3600 * 1e3) {
      alerts.push({
        id: `${q.id}:alert`,
        class: "alert",
        source: "usgs-emsc",
        sourceName: "EMSC/USGS",
        hazard: "quake",
        event: `Earthquake M${q.mag}`,
        severity: "Extreme",
        color: "red",
        urgency: "Immediate",
        certainty: "Observed",
        onset: new Date(qT0).toISOString(),
        expires: new Date(qT0 + 6 * 3600 * 1e3).toISOString(),
        wilayas: [{ code: w.code, fr: w.fr, ar: w.ar }],
        lat: q.lat,
        lon: q.lon,
        headline: {
          fr: `S\xE9isme M${q.mag} \u2014 ${w.fr}`,
          en: `Earthquake M${q.mag} \u2014 ${w.fr}`,
          ar: `\u0632\u0644\u0632\u0627\u0644 \u0628\u0642\u0648\u0629 ${q.mag} \u2014 \u0648\u0644\u0627\u064A\u0629 ${w.ar}`
        }
      });
    }
    const place = w;
    incidents.push({
      id: q.id,
      class: "incident",
      source: "usgs",
      sourceName: "USGS",
      hazard: "quake",
      status: "observed",
      observedAt: q.time,
      mag: q.mag,
      depth: q.depth,
      lat: q.lat,
      lon: q.lon,
      // Official Algerian confirmation, when CRAAG has caught up (days later).
      craagMag: q.craag ? q.craag.mag : void 0,
      craagRegion: q.craag ? q.craag.region : void 0,
      wilayas: place ? [{ code: place.code, fr: place.fr, ar: place.ar }] : [],
      headline: {
        fr: `S\xE9isme M${q.mag} \u2014 ${place ? place.fr : q.place || "Alg\xE9rie"}`,
        en: `Earthquake M${q.mag} \u2014 ${place ? place.fr : q.place || "Algeria"}`,
        ar: `\u0632\u0644\u0632\u0627\u0644 ${q.mag} \u2014 ${place ? "\u0648\u0644\u0627\u064A\u0629 " + place.ar : "\u0627\u0644\u062C\u0632\u0627\u0626\u0631"}`
      }
    });
  }
  for (const p of dgpcWeb) {
    if (p.aggregate || !p.wilayas.length) continue;
    if (!["fire", "flood", "road-crash", "gas", "drowning"].includes(p.kind)) continue;
    incidents.push({
      id: p.id,
      class: "incident",
      source: "dgpc-web",
      sourceName: "Protection Civile (dgpc.dz)",
      hazard: p.kind === "road-crash" ? "road" : p.kind === "drowning" || p.kind === "gas" ? "other" : p.kind,
      status: "reported",
      observedAt: p.postedAt,
      wilayas: p.wilayas,
      link: p.link,
      headline: { fr: p.title, en: p.title, ar: p.title }
    });
  }
  for (const n of news) {
    incidents.push({
      id: n.id,
      class: "incident",
      source: "press",
      sourceName: n.sourceName,
      hazard: n.hazard,
      status: "unverified",
      observedAt: n.observedAt,
      wilayas: n.wilayas,
      link: n.link,
      headline: { fr: n.title, en: n.title, ar: n.title }
    });
  }
  const notifications = alerts.flatMap((a) => fcmTopicsFor(a).map((topic) => ({ topic, alertId: a.id })));
  return {
    generatedAt: nowIso,
    attribution: "Alerts: Office National de la M\xE9t\xE9orologie (CC BY 4.0) \xB7 Incidents: NASA FIRMS, Protection Civile Alg\xE9rienne (dgpc.dz), CRAAG, EMSC \xB7 Presse: TSA, Ennahar (non officiel)",
    stats: {
      onmEntries: onm.length,
      activeAlerts: alerts.length,
      byHazard: countBy(alerts, (a) => a.hazard),
      byColor: countBy(alerts, (a) => a.color),
      dgpcPosts: dgpcPosts.length,
      dgpcWebPosts: dgpcWeb.length,
      pressItems: news.length,
      craagRows: craagRows.length,
      dgpcSitrep: latestSitrep ? { postedAt: latestSitrep.postedAt, ...latestSitrep.stats } : null,
      firmsSkipped: firms.skipped || false,
      fireClusters: clusters.length,
      incidents: incidents.length
    },
    alerts,
    incidents,
    notifications,
    errors
  };
}
__name(runPipeline, "runPipeline");
function countBy(arr, fn) {
  const out = {};
  for (const x of arr) out[fn(x)] = (out[fn(x)] || 0) + 1;
  return out;
}
__name(countBy, "countBy");

// src/push.js
var SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
var MAX_SENDS_PER_CYCLE = 30;
var SENT_TTL_MS = 3 * 24 * 3600 * 1e3;
var HB_INTERVAL_MS = 3 * 3600 * 1e3;
var HB_MAX = 4;
var HB_RECS = {
  heat: [
    ["Buvez de l'eau r\xE9guli\xE8rement, m\xEAme sans soif", "\u0627\u0634\u0631\u0628 \u0627\u0644\u0645\u0627\u0621 \u0628\u0627\u0646\u062A\u0638\u0627\u0645 \u062D\u062A\u0649 \u062F\u0648\u0646 \u0639\u0637\u0634"],
    ["\xC9vitez le soleil entre 11h et 17h", "\u062A\u062C\u0646\u0628 \u0627\u0644\u0634\u0645\u0633 \u0628\u064A\u0646 11:00 \u064817:00"],
    ["V\xE9rifiez les personnes \xE2g\xE9es et isol\xE9es", "\u0627\u0637\u0645\u0626\u0646 \u0639\u0644\u0649 \u0643\u0628\u0627\u0631 \u0627\u0644\u0633\u0646 \u0648\u0627\u0644\u0645\u0639\u0632\u0648\u0644\u064A\u0646"],
    ["De l'eau et de l'ombre pour les animaux", "\u0648\u0641\u0651\u0631 \u0627\u0644\u0645\u0627\u0621 \u0648\u0627\u0644\u0638\u0644 \u0644\u0644\u062D\u064A\u0648\u0627\u0646\u0627\u062A"]
  ],
  flood: [
    ["Ne traversez jamais un oued en crue", "\u0644\u0627 \u062A\u0639\u0628\u0631 \u0648\u0627\u062F\u064A\u064B\u0627 \u0641\u064A \u062D\u0627\u0644\u0629 \u0641\u064A\u0636\u0627\u0646 \u0623\u0628\u062F\u064B\u0627"],
    ["\xC9loignez-vous des zones basses", "\u0627\u0628\u062A\u0639\u062F \u0639\u0646 \u0627\u0644\u0645\u0646\u0627\u0637\u0642 \u0627\u0644\u0645\u0646\u062E\u0641\u0636\u0629"]
  ],
  storm: [["Restez \xE0 l'abri, loin des arbres", "\u0627\u0628\u0642\u064E \u0641\u064A \u0645\u0623\u0645\u0646 \u0628\u0639\u064A\u062F\u064B\u0627 \u0639\u0646 \u0627\u0644\u0623\u0634\u062C\u0627\u0631"]],
  fire: [["Pr\xE9parez-vous \xE0 \xE9vacuer si demand\xE9", "\u0627\u0633\u062A\u0639\u062F \u0644\u0644\u0625\u062E\u0644\u0627\u0621 \u0625\u0630\u0627 \u0637\u064F\u0644\u0628 \u0645\u0646\u0643"]],
  quake: [["Attention aux r\xE9pliques \u2014 restez prudents", "\u0627\u0646\u062A\u0628\u0647 \u0644\u0644\u0647\u0632\u0627\u062A \u0627\u0644\u0627\u0631\u062A\u062F\u0627\u062F\u064A\u0629"]],
  other: [["Suivez les consignes des autorit\xE9s", "\u0627\u062A\u0628\u0639 \u062A\u0639\u0644\u064A\u0645\u0627\u062A \u0627\u0644\u0633\u0644\u0637\u0627\u062A"]]
};
var b64url = /* @__PURE__ */ __name((buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""), "b64url");
var b64urlJson = /* @__PURE__ */ __name((obj) => b64url(new TextEncoder().encode(JSON.stringify(obj))), "b64urlJson");
function pemToDer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out.buffer;
}
__name(pemToDer, "pemToDer");
async function getAccessToken(sa, env) {
  const cached = env ? await env.EWS_KV.get("fcm_token") : null;
  if (cached) return cached;
  const iat = Math.floor(Date.now() / 1e3);
  const unsigned = b64urlJson({ alg: "RS256", typ: "JWT" }) + "." + b64urlJson({ iss: sa.client_email, scope: SCOPE, aud: sa.token_uri, iat, exp: iat + 3600 });
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = unsigned + "." + b64url(sig);
  const res = await fetch(sa.token_uri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${jwt}`
  });
  if (!res.ok) throw new Error(`token exchange HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const tok = (await res.json()).access_token;
  if (env) {
    try {
      await env.EWS_KV.put("fcm_token", tok, { expirationTtl: 3300 });
    } catch {
    }
  }
  return tok;
}
__name(getAccessToken, "getAccessToken");
function messageFor(alert, topic) {
  const color = alert.color;
  const data = {
    kind: "alert",
    alertId: String(alert.id),
    hazard: String(alert.hazard),
    color: String(color),
    severity: String(alert.severity || ""),
    wilayas: alert.wilayas.map((w) => w.code).join(","),
    headline_fr: alert.headline.fr,
    headline_ar: alert.headline.ar,
    headline_en: alert.headline.en,
    onset: String(alert.onset || ""),
    expires: String(alert.expires || ""),
    // Short spoken lines the native AlertActivity reads aloud (AR + FR).
    spoken_fr: `Alerte rouge. ${alert.headline.fr}. Suivez les consignes, et appelez le 14.`,
    spoken_ar: `\u062A\u062D\u0630\u064A\u0631 \u0623\u062D\u0645\u0631. ${alert.headline.ar}. \u0627\u062A\u0628\u0639\u0648\u0627 \u0627\u0644\u062A\u0639\u0644\u064A\u0645\u0627\u062A \u0648\u0627\u062A\u0635\u0644\u0648\u0627 \u0628\u0627\u0644\u0631\u0642\u0645 14.`
  };
  if (color === "red") {
    return {
      message: {
        topic,
        data,
        android: { priority: "HIGH" },
        apns: {
          headers: { "apns-priority": "10" },
          payload: { aps: { "content-available": 1, sound: "default", "interruption-level": "time-sensitive" } }
        }
      }
    };
  }
  return {
    message: {
      topic,
      notification: { title: alert.headline.fr, body: alert.headline.ar },
      data,
      android: {
        priority: "HIGH",
        notification: {
          channel_id: "orange_s2",
          sound: "default",
          notification_priority: "PRIORITY_HIGH"
        }
      },
      apns: {
        headers: { "apns-priority": "10" },
        payload: { aps: { sound: "default", "interruption-level": "active" } }
      }
    }
  };
}
__name(messageFor, "messageFor");
async function sendPush(env, notifications, alerts, errors = [], onmEntries = 1) {
  const summary = { sent: 0, deduped: 0, yellowSkipped: 0, errors: [] };
  if (!env.FIREBASE_SA) return { ...summary, disabled: true };
  let sa;
  try {
    sa = JSON.parse(env.FIREBASE_SA);
  } catch {
    return { ...summary, errors: [{ error: "FIREBASE_SA is not valid JSON" }] };
  }
  const byId = new Map(alerts.map((a) => [a.id, a]));
  const now = Date.now();
  let sentRaw = "{}";
  try {
    sentRaw = await env.EWS_KV.get("sentmap") || "{}";
  } catch {
  }
  let sentMap = {};
  try {
    sentMap = JSON.parse(sentRaw);
  } catch {
  }
  for (const k of Object.keys(sentMap)) if (sentMap[k] < now) delete sentMap[k];
  const ordered = [...notifications].sort(
    (a, b) => (byId.get(a.alertId)?.color === "red" ? 0 : 1) - (byId.get(b.alertId)?.color === "red" ? 0 : 1)
  );
  let token = null;
  const delivered = /* @__PURE__ */ new Set();
  for (const n of ordered) {
    if (summary.sent >= MAX_SENDS_PER_CYCLE) break;
    const alert = byId.get(n.alertId);
    if (!alert) continue;
    if (alert.color === "yellow") {
      summary.yellowSkipped++;
      continue;
    }
    const sentKey = `${n.topic}:${alert.onset || ""}:${alert.expires || ""}`;
    if (sentMap[sentKey]) {
      summary.deduped++;
      delivered.add(n.topic);
      continue;
    }
    try {
      token = token || await getAccessToken(sa, env);
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify(messageFor(alert, n.topic))
      });
      if (res.status === 401 || res.status === 403) {
        try {
          await env.EWS_KV.delete("fcm_token");
        } catch {
        }
        token = null;
      }
      if (!res.ok) throw new Error(`FCM HTTP ${res.status}: ${(await res.text()).slice(0, 160)}`);
      summary.sent++;
      sentMap[sentKey] = now + SENT_TTL_MS;
      delivered.add(n.topic);
    } catch (err) {
      summary.errors.push({ topic: n.topic, error: String(err.message).slice(0, 200) });
      if (summary.errors.length >= 5) break;
    }
  }
  summary.heartbeats = 0;
  for (const a of alerts) {
    if (summary.errors.length >= 5) break;
    if (summary.sent + summary.heartbeats >= MAX_SENDS_PER_CYCLE) break;
    if (a.color !== "red" || !a.onset) continue;
    if (a.expires && Date.parse(a.expires) < now) continue;
    const slot = Math.floor((now - Date.parse(a.onset)) / HB_INTERVAL_MS);
    if (slot < 1 || slot > HB_MAX) continue;
    const recs = HB_RECS[a.hazard] || HB_RECS.other;
    const [recFr, recAr] = recs[(slot - 1) % recs.length];
    for (const w of a.wilayas) {
      const topic = `w${w.code}_${a.hazard}_red`;
      const hbKey = `hb:${topic}:${a.onset}:${slot}`;
      if (sentMap[hbKey]) continue;
      try {
        token = token || await getAccessToken(sa, env);
        const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: JSON.stringify({
            message: {
              topic,
              notification: {
                title: `\u23F0 ${a.headline.fr} \u2014 toujours actif`,
                body: `${recFr} \xB7 ${recAr}`
              },
              data: { kind: "heartbeat", alertId: String(a.id), color: "red", hazard: String(a.hazard) },
              android: { priority: "HIGH", notification: { channel_id: "orange_s2", sound: "default" } }
            }
          })
        });
        if (!res.ok) throw new Error(`FCM HTTP ${res.status}`);
        summary.heartbeats++;
        sentMap[hbKey] = now + SENT_TTL_MS;
      } catch (err) {
        summary.errors.push({ topic, error: String(err.message).slice(0, 120) });
        if (summary.errors.length >= 5) break;
      }
    }
  }
  summary.allclear = 0;
  const currentTopics = delivered;
  let prevRaw = "[]";
  try {
    prevRaw = await env.EWS_KV.get("activetopics") || "[]";
  } catch {
  }
  let prevTopics = [];
  try {
    prevTopics = JSON.parse(prevRaw);
  } catch {
  }
  const degraded = (errors || []).some((e) => e.source === "onm") || !onmEntries;
  if (degraded) summary.allclearSkipped = true;
  const HAZ = {
    heat: ["Canicule", "\u0645\u0648\u062C\u0629 \u0627\u0644\u062D\u0631"],
    storm: ["Orages", "\u0627\u0644\u0639\u0648\u0627\u0635\u0641 \u0627\u0644\u0631\u0639\u062F\u064A\u0629"],
    wind: ["Vent fort", "\u0627\u0644\u0631\u064A\u0627\u062D \u0627\u0644\u0642\u0648\u064A\u0629"],
    sandstorm: ["Temp\xEAte de sable", "\u0627\u0644\u0639\u0627\u0635\u0641\u0629 \u0627\u0644\u0631\u0645\u0644\u064A\u0629"],
    flood: ["Inondations", "\u0627\u0644\u0641\u064A\u0636\u0627\u0646\u0627\u062A"],
    fire: ["Feu de for\xEAt", "\u062D\u0631\u064A\u0642 \u0627\u0644\u063A\u0627\u0628\u0629"],
    quake: ["S\xE9isme", "\u0627\u0644\u0632\u0644\u0632\u0627\u0644"],
    cold: ["Froid/Neige", "\u0627\u0644\u0628\u0631\u062F \u0648\u0627\u0644\u062B\u0644\u0648\u062C"],
    road: ["Route", "\u0627\u0644\u0637\u0631\u064A\u0642"],
    other: ["Alerte", "\u0627\u0644\u062A\u062D\u0630\u064A\u0631"]
  };
  const stale = degraded ? [] : prevTopics.filter((t) => !currentTopics.has(t));
  const carry = new Set(stale.slice(20));
  for (const topic of stale.slice(0, 20)) {
    const m = topic.match(/^w(\d+)_(\w+)_(\w+)$/);
    if (!m) continue;
    const [, code, hazard] = m;
    const w = wilayaByCode(Number(code));
    const [hFr, hAr] = HAZ[hazard] || HAZ.other;
    try {
      token = token || await getAccessToken(sa, env);
      const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({
          message: {
            topic,
            notification: {
              title: `\u2705 Fin d'alerte \u2014 ${w ? w.fr : "Alg\xE9rie"}`,
              body: `${hFr} termin\xE9e \xB7 \u0627\u0646\u062A\u0647\u0649 \u062A\u062D\u0630\u064A\u0631 ${hAr}`
            },
            data: { kind: "allclear", hazard: String(hazard) },
            android: { priority: "HIGH", notification: { channel_id: "allclear_s2", sound: "default" } }
          }
        })
      });
      if (res.ok) summary.allclear++;
      else carry.add(topic);
    } catch (err) {
      carry.add(topic);
      summary.errors.push({ topic, error: "allclear " + String(err.message).slice(0, 100) });
    }
  }
  try {
    const sentOut = JSON.stringify(sentMap);
    if (sentOut !== sentRaw) await env.EWS_KV.put("sentmap", sentOut);
  } catch {
  }
  if (!degraded) {
    try {
      const topicsOut = JSON.stringify([.../* @__PURE__ */ new Set([...currentTopics, ...carry])].sort());
      if (topicsOut !== JSON.stringify(prevTopics.slice().sort())) await env.EWS_KV.put("activetopics", topicsOut);
    } catch {
    }
  }
  return summary;
}
__name(sendPush, "sendPush");

// data/wilayas.json
var wilayas_default = { type: "FeatureCollection", features: [{ type: "Feature", properties: { code: 1, fr: "Adrar", ar: "\u0623\u062F\u0631\u0627\u0631", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[-5.66, 25.52], [-5.62, 25.48], [-5.58, 25.46], [-5.54, 25.44], [-5.5, 25.42], [-5.46, 25.38], [-5.42, 25.36], [-5.4, 25.34], [-5.34, 25.32], [-5.3, 25.3], [-5.26, 25.26], [-5.2, 25.22], [-5.14, 25.2], [-5.1, 25.16], [-5, 25.1], [-4.94, 25.08], [-4.9, 25.04], [-4.84, 25], [-4.5, 25.1], [-4.2, 25.2], [-4.02, 25.24], [-4, 25.24], [-3.68, 25.18], [-3.5, 25.14], [-3.24, 25.08], [-3, 25.04], [-2.92, 25.02], [-2.86, 25], [-2.84, 25], [-2.82, 25], [-2.8, 24.98], [-2.64, 24.96], [-2.04, 24.82], [-1.36, 24.68], [-0.64, 24.5], [0, 24.36], [0.02, 24.34], [0.08, 24.32], [0.34, 24.26], [0.86, 24.14], [1.2, 24.06], [1.42, 24], [1.44, 24], [1.44, 24.02], [1.44, 24.06], [1.44, 24.12], [1.44, 24.18], [1.44, 24.3], [1.44, 24.36], [1.44, 24.4], [1.44, 24.56], [1.44, 24.64], [1.44, 24.82], [1.44, 24.92], [1.44, 24.98], [1.42, 25], [1.42, 25.52], [1.08, 25.96], [1.06, 25.98], [1.06, 26], [1, 26.1], [1, 26.12], [0.98, 26.14], [0.96, 26.16], [0.96, 26.18], [0.94, 26.2], [0.94, 26.22], [0.94, 26.24], [0.96, 26.26], [0.98, 26.28], [1, 26.3], [1.02, 26.32], [1.04, 26.34], [1.06, 26.36], [1.08, 26.36], [1.1, 26.38], [1.12, 26.4], [1.14, 26.42], [1.16, 26.44], [1.18, 26.46], [1.2, 26.48], [1.2, 26.5], [1.22, 26.5], [1.24, 26.52], [1.24, 26.54], [1.26, 26.54], [1.26, 26.56], [1.28, 26.56], [1.28, 26.58], [1.28, 26.6], [1.3, 26.6], [1.3, 26.62], [1.3, 26.64], [1.32, 26.64], [1.34, 26.64], [1.34, 26.66], [1.36, 26.66], [1.38, 26.66], [1.4, 26.66], [1.42, 26.66], [1.44, 26.66], [1.46, 26.66], [1.46, 26.64], [1.48, 26.64], [1.5, 26.64], [1.5, 26.62], [1.5, 26.64], [1.52, 26.64], [1.54, 26.64], [1.54, 26.62], [1.56, 26.62], [1.56, 26.64], [1.58, 26.64], [1.6, 26.64], [1.62, 26.64], [1.62, 26.66], [1.64, 26.66], [1.64, 26.68], [1.64, 26.7], [1.64, 26.72], [1.64, 26.76], [1.64, 26.84], [1.66, 26.9], [1.66, 26.94], [1.66, 26.96], [1.66, 26.98], [1.66, 27], [1.66, 27.02], [1.66, 27.04], [1.7, 27.12], [1.74, 27.2], [1.78, 27.26], [1.78, 27.28], [1.7, 27.38], [1.7, 27.58], [1.7, 27.62], [1.78, 27.76], [1.78, 27.84], [1.8, 27.94], [1.8, 28], [1.82, 28.14], [1.96, 28.34], [2, 28.48], [1.98, 28.48], [2, 28.48], [2, 28.5], [1.98, 28.5], [1.96, 28.5], [1.94, 28.5], [1.92, 28.5], [1.92, 28.52], [1.9, 28.52], [1.9, 28.5], [1.88, 28.5], [1.88, 28.52], [1.86, 28.52], [1.86, 28.54], [1.86, 28.56], [1.84, 28.56], [1.82, 28.56], [1.8, 28.56], [1.8, 28.58], [1.78, 28.58], [1.78, 28.56], [1.76, 28.56], [1.74, 28.56], [1.72, 28.56], [1.7, 28.56], [1.68, 28.56], [1.66, 28.56], [1.18, 28.56], [1, 28.5], [0.98, 28.48], [0.74, 28.44], [0.4, 28.38], [0.18, 28.44], [0.02, 28.48], [0, 28.5], [-0.04, 28.5], [-0.22, 28.52], [-0.26, 28.56], [-0.66, 28.84], [-0.92, 28.98], [-1, 28.98], [-1.04, 28.98], [-1.06, 28.98], [-1.14, 28.96], [-1.22, 28.96], [-1.32, 28.96], [-1.42, 28.96], [-1.46, 28.94], [-1.6, 28.9], [-1.7, 28.88], [-1.86, 28.84], [-1.9, 28.82], [-1.96, 28.8], [-2, 28.8], [-2.02, 28.78], [-2.04, 28.76], [-2.06, 28.72], [-2.08, 28.7], [-2.1, 28.66], [-2.12, 28.64], [-2.16, 28.6], [-2.18, 28.58], [-2.2, 28.54], [-2.22, 28.52], [-2.24, 28.48], [-2.28, 28.46], [-2.3, 28.42], [-2.32, 28.42], [-2.36, 28.38], [-2.38, 28.36], [-2.42, 28.34], [-2.46, 28.32], [-2.48, 28.3], [-2.5, 28.28], [-2.52, 28.26], [-2.54, 28.24], [-2.56, 28.24], [-2.58, 28.22], [-2.58, 28.2], [-2.6, 28.2], [-2.6, 28.18], [-2.6, 28.16], [-2.62, 28.16], [-2.62, 28.14], [-2.64, 28.14], [-2.64, 28.12], [-2.62, 28.1], [-2.64, 28.1], [-2.64, 28.08], [-2.66, 28.06], [-2.66, 28.04], [-2.68, 28.04], [-2.68, 28.02], [-2.7, 28.02], [-2.7, 28], [-2.72, 28], [-2.72, 27.98], [-2.72, 27.96], [-2.74, 27.96], [-2.74, 27.94], [-2.76, 27.94], [-2.76, 27.92], [-2.78, 27.92], [-2.78, 27.9], [-2.8, 27.9], [-2.8, 27.88], [-2.82, 27.88], [-2.82, 27.86], [-2.84, 27.86], [-2.84, 27.84], [-2.86, 27.84], [-2.86, 27.82], [-2.88, 27.82], [-2.88, 27.8], [-2.88, 27.78], [-2.9, 27.78], [-2.9, 27.76], [-2.9, 27.74], [-2.9, 27.72], [-2.92, 27.72], [-2.92, 27.7], [-2.92, 27.68], [-2.94, 27.66], [-2.94, 27.64], [-2.94, 27.62], [-2.94, 27.6], [-2.96, 27.6], [-2.96, 27.58], [-2.96, 27.56], [-2.96, 27.54], [-2.98, 27.54], [-2.98, 27.52], [-2.98, 27.5], [-2.98, 27.48], [-3, 27.48], [-3, 27.46], [-3, 27.44], [-3, 27.42], [-3.02, 27.4], [-3.02, 27.38], [-3.02, 27.36], [-3.04, 27.36], [-3.04, 27.34], [-3, 27.32], [-2.98, 27.3], [-2.98, 27.28], [-2.98, 27.26], [-2.98, 27.24], [-3, 27.24], [-3, 27.22], [-3, 27.2], [-3, 27.18], [-3.02, 27.16], [-3.02, 27.14], [-3.02, 27.12], [-3.04, 27.12], [-3.04, 27.1], [-3.04, 27.08], [-3.04, 27.06], [-3.06, 27.06], [-3.06, 27.04], [-3.06, 27.02], [-3.08, 27.02], [-3.08, 27], [-3.06, 26.98], [-3.08, 26.98], [-3.08, 26.96], [-3.08, 26.94], [-3.1, 26.92], [-3.1, 26.9], [-3.1, 26.88], [-3.1, 26.86], [-3.12, 26.86], [-3.14, 26.86], [-3.14, 26.84], [-3.16, 26.84], [-3.18, 26.82], [-3.2, 26.82], [-3.22, 26.82], [-3.24, 26.82], [-3.28, 26.82], [-3.3, 26.82], [-3.32, 26.82], [-3.34, 26.82], [-3.36, 26.82], [-3.38, 26.82], [-3.4, 26.82], [-3.42, 26.82], [-3.44, 26.82], [-3.46, 26.82], [-3.46, 26.84], [-3.48, 26.84], [-3.5, 26.84], [-3.52, 26.84], [-3.52, 26.82], [-3.54, 26.82], [-3.56, 26.82], [-3.58, 26.82], [-3.6, 26.8], [-3.62, 26.8], [-3.62, 26.78], [-3.64, 26.78], [-3.66, 26.78], [-3.68, 26.78], [-3.68, 26.76], [-3.7, 26.76], [-3.7, 26.74], [-3.72, 26.74], [-3.72, 26.72], [-3.74, 26.72], [-3.76, 26.7], [-3.78, 26.7], [-3.78, 26.68], [-3.78, 26.66], [-3.8, 26.66], [-3.8, 26.64], [-3.82, 26.64], [-3.82, 26.62], [-3.84, 26.62], [-3.84, 26.6], [-3.84, 26.58], [-3.86, 26.58], [-3.88, 26.56], [-3.9, 26.52], [-3.92, 26.5], [-3.94, 26.46], [-3.98, 26.4], [-4.02, 26.36], [-4.02, 26.34], [-4.04, 26.34], [-4.06, 26.32], [-4.06, 26.3], [-4.08, 26.28], [-4.08, 26.26], [-4.1, 26.26], [-4.1, 26.24], [-4.12, 26.22], [-4.12, 26.2], [-4.12, 26.18], [-4.14, 26.18], [-4.14, 26.16], [-4.14, 26.14], [-4.14, 26.12], [-4.16, 26.12], [-4.16, 26.1], [-4.16, 26.08], [-4.18, 26.06], [-4.18, 26.04], [-4.2, 26.02], [-4.22, 26.02], [-4.26, 26.02], [-4.3, 26.02], [-4.32, 26.02], [-4.38, 26.02], [-4.44, 26.02], [-4.5, 26.02], [-4.6, 26], [-4.68, 26], [-4.74, 26], [-4.78, 26], [-4.8, 26], [-4.82, 26], [-4.84, 25.98], [-4.84, 25.96], [-4.88, 25.94], [-4.9, 25.92], [-4.9, 25.9], [-4.92, 25.88], [-4.94, 25.86], [-4.96, 25.86], [-4.98, 25.84], [-4.98, 25.82], [-5, 25.82], [-5.1, 25.72], [-5.14, 25.7], [-5.2, 25.68], [-5.22, 25.66], [-5.26, 25.66], [-5.34, 25.64], [-5.38, 25.62], [-5.44, 25.6], [-5.48, 25.58], [-5.52, 25.56], [-5.56, 25.56], [-5.6, 25.54], [-5.66, 25.52]]] } }, { type: "Feature", properties: { code: 2, fr: "Chlef", ar: "\u0627\u0644\u0634\u0644\u0641", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[0.7, 36.22], [0.7, 36.2], [0.72, 36.2], [0.74, 36.2], [0.76, 36.2], [0.78, 36.2], [0.8, 36.2], [0.82, 36.2], [0.82, 36.22], [0.84, 36.22], [0.84, 36.2], [0.84, 36.22], [0.86, 36.22], [0.88, 36.22], [0.9, 36.22], [0.92, 36.2], [0.9, 36.2], [0.92, 36.2], [0.92, 36.18], [0.92, 36.16], [0.94, 36.16], [0.94, 36.14], [0.94, 36.12], [0.94, 36.14], [0.94, 36.12], [0.94, 36.1], [0.92, 36.1], [0.9, 36.1], [0.9, 36.08], [0.92, 36.08], [0.92, 36.1], [0.92, 36.08], [0.92, 36.06], [0.92, 36.08], [0.94, 36.06], [0.96, 36.06], [0.96, 36.04], [0.94, 36.04], [0.96, 36.04], [0.96, 36.02], [0.98, 36.02], [1, 36.02], [1, 36.04], [1.02, 36.04], [1.04, 36.04], [1.02, 36.04], [1.02, 36.02], [1.04, 36.02], [1.06, 36.04], [1.06, 36.02], [1.06, 36], [1.08, 36], [1.08, 35.98], [1.1, 35.98], [1.12, 35.98], [1.12, 35.96], [1.12, 35.98], [1.12, 35.96], [1.12, 35.98], [1.12, 35.96], [1.14, 35.96], [1.16, 35.94], [1.18, 35.94], [1.2, 35.94], [1.2, 35.96], [1.22, 35.96], [1.24, 35.96], [1.26, 35.96], [1.28, 35.96], [1.28, 35.98], [1.3, 35.98], [1.3, 35.96], [1.3, 35.94], [1.32, 35.94], [1.32, 35.92], [1.34, 35.92], [1.34, 35.9], [1.36, 35.9], [1.36, 35.88], [1.38, 35.86], [1.36, 35.86], [1.38, 35.86], [1.4, 35.86], [1.4, 35.88], [1.38, 35.88], [1.4, 35.88], [1.38, 35.88], [1.4, 35.88], [1.4, 35.9], [1.4, 35.92], [1.42, 35.92], [1.4, 35.92], [1.4, 35.94], [1.42, 35.94], [1.44, 35.94], [1.42, 35.94], [1.44, 35.94], [1.46, 35.94], [1.48, 35.94], [1.5, 35.94], [1.5, 35.96], [1.52, 35.96], [1.52, 35.98], [1.5, 35.98], [1.52, 35.98], [1.5, 35.98], [1.5, 36], [1.5, 35.98], [1.52, 35.98], [1.52, 36], [1.54, 36], [1.54, 36.02], [1.56, 36.02], [1.56, 36.04], [1.56, 36.02], [1.58, 36.02], [1.58, 36], [1.6, 36], [1.58, 36], [1.6, 36], [1.6, 35.98], [1.62, 35.98], [1.62, 35.96], [1.62, 35.98], [1.62, 35.96], [1.64, 35.96], [1.64, 35.94], [1.64, 35.96], [1.64, 35.94], [1.66, 35.94], [1.68, 35.94], [1.66, 35.94], [1.68, 35.94], [1.66, 35.94], [1.68, 35.94], [1.68, 35.92], [1.68, 35.94], [1.68, 35.92], [1.7, 35.92], [1.7, 35.94], [1.72, 35.94], [1.72, 35.96], [1.7, 35.96], [1.72, 35.96], [1.72, 35.98], [1.72, 36], [1.72, 35.98], [1.7, 35.98], [1.7, 36], [1.7, 36.02], [1.68, 36.02], [1.66, 36.02], [1.66, 36.04], [1.68, 36.04], [1.66, 36.04], [1.66, 36.06], [1.64, 36.06], [1.64, 36.08], [1.62, 36.08], [1.62, 36.1], [1.64, 36.1], [1.62, 36.1], [1.64, 36.1], [1.64, 36.12], [1.62, 36.12], [1.6, 36.12], [1.58, 36.12], [1.58, 36.14], [1.56, 36.14], [1.58, 36.14], [1.58, 36.16], [1.56, 36.16], [1.58, 36.16], [1.58, 36.18], [1.56, 36.18], [1.58, 36.18], [1.6, 36.18], [1.6, 36.2], [1.62, 36.2], [1.64, 36.2], [1.64, 36.22], [1.62, 36.22], [1.62, 36.24], [1.6, 36.24], [1.6, 36.22], [1.6, 36.24], [1.58, 36.24], [1.6, 36.24], [1.58, 36.24], [1.56, 36.24], [1.54, 36.24], [1.56, 36.24], [1.56, 36.26], [1.58, 36.26], [1.58, 36.28], [1.6, 36.28], [1.6, 36.3], [1.6, 36.28], [1.58, 36.28], [1.58, 36.3], [1.56, 36.3], [1.56, 36.32], [1.54, 36.32], [1.54, 36.34], [1.52, 36.34], [1.54, 36.34], [1.54, 36.36], [1.52, 36.36], [1.54, 36.36], [1.52, 36.36], [1.52, 36.38], [1.54, 36.38], [1.54, 36.4], [1.56, 36.4], [1.58, 36.4], [1.58, 36.42], [1.6, 36.42], [1.62, 36.42], [1.62, 36.44], [1.64, 36.44], [1.64, 36.46], [1.64, 36.48], [1.66, 36.48], [1.68, 36.48], [1.68, 36.5], [1.68, 36.48], [1.66, 36.48], [1.66, 36.5], [1.68, 36.5], [1.66, 36.5], [1.66, 36.52], [1.68, 36.52], [1.68, 36.54], [1.7, 36.54], [1.7, 36.56], [1.68, 36.56], [1.66, 36.56], [1.64, 36.56], [1.64, 36.54], [1.62, 36.54], [1.6, 36.54], [1.58, 36.54], [1.56, 36.54], [1.54, 36.54], [1.56, 36.54], [1.54, 36.54], [1.52, 36.54], [1.52, 36.52], [1.5, 36.52], [1.48, 36.52], [1.48, 36.54], [1.46, 36.54], [1.44, 36.54], [1.42, 36.54], [1.4, 36.54], [1.38, 36.54], [1.38, 36.56], [1.36, 36.56], [1.34, 36.56], [1.36, 36.56], [1.34, 36.56], [1.34, 36.54], [1.32, 36.54], [1.32, 36.52], [1.3, 36.52], [1.3, 36.5], [1.28, 36.5], [1.26, 36.5], [1.24, 36.5], [1.22, 36.5], [1.22, 36.52], [1.22, 36.5], [1.22, 36.52], [1.2, 36.52], [1.18, 36.52], [1.18, 36.5], [1.16, 36.5], [1.14, 36.5], [1.12, 36.5], [1.1, 36.5], [1.08, 36.5], [1.08, 36.48], [1.08, 36.5], [1.08, 36.48], [1.06, 36.48], [1.04, 36.48], [1.02, 36.48], [1.02, 36.46], [1, 36.46], [0.98, 36.46], [0.96, 36.46], [0.98, 36.46], [0.96, 36.46], [0.98, 36.46], [0.96, 36.46], [0.96, 36.44], [0.94, 36.44], [0.94, 36.46], [0.94, 36.44], [0.92, 36.44], [0.92, 36.42], [0.92, 36.4], [0.9, 36.4], [0.9, 36.38], [0.88, 36.38], [0.86, 36.38], [0.86, 36.36], [0.86, 36.38], [0.86, 36.36], [0.84, 36.36], [0.82, 36.36], [0.8, 36.36], [0.78, 36.36], [0.78, 36.34], [0.76, 36.34], [0.74, 36.34], [0.74, 36.32], [0.74, 36.3], [0.72, 36.3], [0.72, 36.28], [0.72, 36.26], [0.7, 36.26], [0.7, 36.24], [0.7, 36.22]]] } }, { type: "Feature", properties: { code: 3, fr: "Laghouat", ar: "\u0627\u0644\u0623\u063A\u0648\u0627\u0637", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[1.34, 34.08], [1.34, 34.06], [1.36, 34.06], [1.34, 34.04], [1.36, 34.04], [1.36, 34.02], [1.38, 34.02], [1.36, 34.02], [1.36, 34], [1.36, 33.98], [1.38, 33.98], [1.4, 33.96], [1.42, 33.96], [1.44, 33.94], [1.46, 33.94], [1.48, 33.94], [1.48, 33.92], [1.5, 33.92], [1.5, 33.9], [1.52, 33.9], [1.52, 33.88], [1.54, 33.88], [1.56, 33.86], [1.58, 33.86], [1.58, 33.88], [1.6, 33.88], [1.62, 33.88], [1.64, 33.88], [1.64, 33.9], [1.66, 33.9], [1.68, 33.9], [1.7, 33.9], [1.72, 33.9], [1.72, 33.88], [1.74, 33.88], [1.76, 33.88], [1.76, 33.86], [1.76, 33.84], [1.78, 33.84], [1.8, 33.84], [1.8, 33.82], [1.8, 33.8], [1.82, 33.8], [1.82, 33.78], [1.82, 33.76], [1.8, 33.76], [1.8, 33.74], [1.82, 33.74], [1.82, 33.72], [1.82, 33.7], [1.8, 33.7], [1.82, 33.7], [1.82, 33.68], [1.82, 33.66], [1.82, 33.68], [1.84, 33.68], [1.84, 33.66], [1.86, 33.66], [1.88, 33.66], [1.88, 33.64], [1.9, 33.64], [1.88, 33.64], [1.88, 33.62], [1.9, 33.62], [1.9, 33.6], [1.92, 33.6], [1.94, 33.6], [1.94, 33.58], [1.92, 33.58], [1.92, 33.56], [1.9, 33.54], [1.9, 33.52], [1.9, 33.5], [1.9, 33.48], [1.9, 33.46], [1.9, 33.44], [1.88, 33.42], [1.9, 33.42], [1.92, 33.42], [1.94, 33.42], [1.96, 33.42], [1.98, 33.42], [1.98, 33.4], [2, 33.4], [2.02, 33.4], [2.02, 33.36], [2.02, 33.34], [2.04, 33.34], [2.1, 33.32], [2.18, 33.3], [2.22, 33.3], [2.26, 33.3], [2.28, 33.32], [2.28, 33.28], [2.28, 33.26], [2.28, 33.24], [2.28, 33.22], [2.28, 33.2], [2.26, 33.16], [2.1, 33.16], [2.08, 33.16], [2.08, 33.14], [2.1, 33.14], [2.12, 33.12], [2.12, 33.1], [2.1, 33.1], [2.1, 33.08], [2.1, 33.06], [2.12, 33.04], [2.14, 33.02], [2.14, 33], [2.16, 32.98], [2.16, 32.96], [2.16, 32.94], [2.18, 32.94], [2.18, 32.92], [2.18, 32.9], [2.2, 32.9], [2.22, 32.88], [2.22, 32.86], [2.22, 32.84], [2.24, 32.82], [2.22, 32.82], [2.24, 32.82], [2.24, 32.8], [2.36, 32.82], [2.42, 32.82], [2.52, 32.82], [2.62, 32.84], [2.68, 32.84], [2.72, 32.84], [2.74, 32.84], [2.76, 32.84], [2.78, 32.84], [2.78, 32.86], [2.8, 32.86], [2.82, 32.86], [2.84, 32.86], [2.84, 32.88], [2.86, 32.88], [2.88, 32.88], [2.92, 32.88], [2.98, 32.9], [3, 32.9], [3.02, 32.9], [3.06, 32.88], [3.18, 32.86], [3.34, 32.82], [3.4, 32.82], [3.38, 32.86], [3.38, 32.92], [3.32, 32.96], [3.28, 32.98], [3.26, 32.98], [3.24, 33], [3.22, 33], [3.22, 33.02], [3.24, 33.02], [3.34, 33.02], [3.36, 33.02], [3.38, 33.02], [3.56, 33.02], [3.58, 33.02], [3.58, 33.04], [3.6, 33.04], [3.62, 33.04], [3.62, 33.06], [3.62, 33.04], [3.64, 33.04], [3.64, 33.06], [3.66, 33.06], [3.66, 33.08], [3.66, 33.06], [3.68, 33.06], [3.7, 33.06], [3.72, 33.06], [3.72, 33.04], [3.74, 33.04], [3.74, 33.06], [3.76, 33.06], [3.78, 33.06], [3.78, 33.04], [3.8, 33.04], [3.82, 33.04], [3.84, 33.04], [3.84, 33.02], [3.86, 33.02], [3.88, 33.04], [3.88, 33.02], [3.9, 33.02], [3.92, 33.02], [3.94, 33.02], [3.96, 33.02], [3.98, 33.02], [4, 33.02], [4.02, 33.02], [4.06, 33.02], [4.08, 33.02], [4.1, 33.02], [4.12, 33.02], [4.14, 33.02], [4.16, 33.02], [4.22, 33], [4.3, 33], [4.34, 33], [4.36, 33], [4.38, 33], [4.42, 33], [4.46, 33], [4.48, 33], [4.44, 33.04], [4.42, 33.06], [4.42, 33.1], [4.36, 33.14], [4.34, 33.2], [4.22, 33.32], [4.2, 33.34], [4.16, 33.36], [4.1, 33.38], [4.08, 33.4], [4, 33.42], [4, 33.44], [3.94, 33.46], [3.9, 33.46], [3.86, 33.48], [3.8, 33.5], [3.76, 33.52], [3.72, 33.52], [3.64, 33.62], [3.62, 33.62], [3.6, 33.64], [3.6, 33.66], [3.56, 33.7], [3.46, 33.76], [3.44, 33.76], [3.4, 33.78], [3.38, 33.78], [3.36, 33.8], [3.34, 33.8], [3.32, 33.8], [3.3, 33.82], [3.28, 33.82], [3.26, 33.82], [3.24, 33.82], [3.22, 33.82], [3.22, 33.84], [3.22, 33.86], [3.18, 33.86], [3.18, 33.88], [3.18, 33.9], [3.16, 33.92], [3.16, 33.94], [3.14, 33.94], [3.14, 33.98], [3.16, 34], [3.14, 34], [3.14, 34.02], [3.14, 34.04], [3.12, 34.04], [3.12, 34.06], [3.12, 34.08], [3.1, 34.1], [3.08, 34.12], [3.08, 34.14], [3.1, 34.14], [3.1, 34.16], [3.1, 34.18], [3.08, 34.2], [3.08, 34.22], [3.06, 34.2], [3.06, 34.22], [3.06, 34.24], [3.06, 34.26], [3.04, 34.26], [3.04, 34.24], [3.02, 34.24], [3, 34.24], [2.98, 34.24], [3, 34.26], [2.98, 34.26], [2.96, 34.26], [2.96, 34.28], [2.94, 34.28], [2.92, 34.28], [2.9, 34.28], [2.9, 34.26], [2.88, 34.26], [2.86, 34.26], [2.86, 34.24], [2.84, 34.24], [2.84, 34.22], [2.84, 34.2], [2.82, 34.2], [2.82, 34.18], [2.8, 34.18], [2.82, 34.18], [2.8, 34.16], [2.82, 34.16], [2.82, 34.14], [2.8, 34.14], [2.8, 34.16], [2.78, 34.16], [2.78, 34.14], [2.76, 34.14], [2.74, 34.14], [2.72, 34.12], [2.7, 34.12], [2.68, 34.12], [2.66, 34.12], [2.64, 34.12], [2.62, 34.12], [2.62, 34.14], [2.6, 34.14], [2.6, 34.16], [2.58, 34.16], [2.58, 34.18], [2.56, 34.18], [2.56, 34.2], [2.54, 34.2], [2.54, 34.22], [2.52, 34.24], [2.5, 34.24], [2.5, 34.26], [2.5, 34.28], [2.48, 34.28], [2.48, 34.3], [2.46, 34.32], [2.46, 34.3], [2.44, 34.3], [2.46, 34.32], [2.44, 34.32], [2.44, 34.34], [2.44, 34.36], [2.42, 34.38], [2.42, 34.4], [2.42, 34.42], [2.4, 34.42], [2.4, 34.44], [2.4, 34.46], [2.4, 34.48], [2.4, 34.5], [2.4, 34.52], [2.38, 34.52], [2.38, 34.54], [2.38, 34.56], [2.38, 34.58], [2.38, 34.6], [2.38, 34.62], [2.36, 34.62], [2.36, 34.64], [2.36, 34.66], [2.36, 34.68], [2.36, 34.7], [2.34, 34.7], [2.32, 34.7], [2.3, 34.68], [2.28, 34.68], [2.26, 34.68], [2.24, 34.68], [2.22, 34.68], [2.22, 34.66], [2.2, 34.66], [2.2, 34.64], [2.18, 34.64], [2.18, 34.62], [2.16, 34.62], [2.14, 34.62], [2.12, 34.62], [2.12, 34.6], [2.08, 34.6], [2.08, 34.58], [2.06, 34.56], [2.04, 34.56], [2.02, 34.54], [2.02, 34.52], [2, 34.52], [2, 34.5], [1.98, 34.5], [1.96, 34.5], [1.94, 34.5], [1.94, 34.48], [1.92, 34.48], [1.9, 34.48], [1.88, 34.48], [1.86, 34.48], [1.86, 34.46], [1.84, 34.46], [1.82, 34.46], [1.8, 34.46], [1.78, 34.46], [1.78, 34.44], [1.76, 34.44], [1.76, 34.42], [1.74, 34.42], [1.74, 34.4], [1.72, 34.4], [1.7, 34.38], [1.7, 34.36], [1.68, 34.36], [1.68, 34.34], [1.68, 34.32], [1.68, 34.3], [1.68, 34.28], [1.66, 34.28], [1.66, 34.26], [1.64, 34.26], [1.64, 34.24], [1.62, 34.24], [1.6, 34.24], [1.6, 34.22], [1.58, 34.22], [1.58, 34.24], [1.58, 34.26], [1.56, 34.26], [1.54, 34.26], [1.54, 34.24], [1.52, 34.24], [1.52, 34.22], [1.5, 34.22], [1.48, 34.22], [1.48, 34.2], [1.46, 34.2], [1.44, 34.2], [1.42, 34.2], [1.42, 34.18], [1.4, 34.18], [1.4, 34.16], [1.42, 34.16], [1.42, 34.14], [1.44, 34.14], [1.44, 34.12], [1.42, 34.12], [1.4, 34.12], [1.4, 34.1], [1.38, 34.1], [1.36, 34.08], [1.34, 34.08]]] } }, { type: "Feature", properties: { code: 4, fr: "Oum El Bouaghi", ar: "\u0623\u0645 \u0627\u0644\u0628\u0648\u0627\u0642\u064A", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[6.16, 35.9], [6.16, 35.88], [6.18, 35.88], [6.18, 35.86], [6.2, 35.86], [6.22, 35.86], [6.24, 35.84], [6.26, 35.84], [6.28, 35.82], [6.28, 35.84], [6.3, 35.84], [6.32, 35.84], [6.32, 35.86], [6.32, 35.88], [6.34, 35.88], [6.36, 35.88], [6.36, 35.86], [6.38, 35.86], [6.4, 35.86], [6.4, 35.84], [6.42, 35.84], [6.44, 35.84], [6.46, 35.84], [6.48, 35.84], [6.48, 35.82], [6.46, 35.82], [6.46, 35.8], [6.48, 35.8], [6.48, 35.78], [6.46, 35.78], [6.46, 35.76], [6.48, 35.76], [6.5, 35.76], [6.5, 35.78], [6.52, 35.78], [6.54, 35.78], [6.56, 35.78], [6.56, 35.8], [6.58, 35.8], [6.6, 35.8], [6.62, 35.8], [6.62, 35.78], [6.64, 35.78], [6.66, 35.78], [6.68, 35.78], [6.68, 35.76], [6.7, 35.76], [6.7, 35.74], [6.72, 35.74], [6.72, 35.72], [6.74, 35.72], [6.74, 35.7], [6.76, 35.7], [6.76, 35.68], [6.78, 35.68], [6.78, 35.66], [6.8, 35.64], [6.8, 35.62], [6.82, 35.62], [6.84, 35.62], [6.84, 35.6], [6.84, 35.62], [6.84, 35.6], [6.84, 35.62], [6.86, 35.62], [6.88, 35.62], [6.9, 35.62], [6.92, 35.62], [6.94, 35.62], [6.96, 35.62], [6.98, 35.62], [7, 35.62], [7.02, 35.62], [7.02, 35.6], [7.02, 35.58], [7.02, 35.56], [7, 35.56], [7.02, 35.56], [7.04, 35.56], [7.06, 35.56], [7.06, 35.54], [7.08, 35.54], [7.08, 35.56], [7.1, 35.56], [7.1, 35.58], [7.12, 35.58], [7.12, 35.6], [7.12, 35.62], [7.14, 35.62], [7.16, 35.62], [7.18, 35.62], [7.2, 35.62], [7.22, 35.62], [7.22, 35.6], [7.22, 35.62], [7.22, 35.6], [7.22, 35.62], [7.24, 35.62], [7.26, 35.62], [7.28, 35.62], [7.28, 35.6], [7.3, 35.6], [7.32, 35.58], [7.32, 35.56], [7.3, 35.56], [7.3, 35.54], [7.3, 35.52], [7.3, 35.5], [7.3, 35.52], [7.32, 35.52], [7.34, 35.52], [7.36, 35.52], [7.34, 35.52], [7.34, 35.54], [7.36, 35.54], [7.36, 35.56], [7.38, 35.56], [7.38, 35.58], [7.38, 35.56], [7.4, 35.56], [7.42, 35.54], [7.44, 35.54], [7.44, 35.52], [7.42, 35.52], [7.44, 35.52], [7.44, 35.5], [7.44, 35.52], [7.46, 35.52], [7.46, 35.54], [7.46, 35.52], [7.48, 35.52], [7.48, 35.5], [7.48, 35.48], [7.5, 35.48], [7.5, 35.46], [7.5, 35.48], [7.52, 35.48], [7.52, 35.46], [7.52, 35.44], [7.54, 35.44], [7.54, 35.42], [7.56, 35.42], [7.58, 35.42], [7.58, 35.44], [7.6, 35.44], [7.6, 35.46], [7.62, 35.46], [7.62, 35.48], [7.64, 35.48], [7.64, 35.5], [7.66, 35.5], [7.66, 35.52], [7.66, 35.54], [7.68, 35.54], [7.7, 35.54], [7.72, 35.54], [7.72, 35.56], [7.74, 35.56], [7.76, 35.56], [7.76, 35.58], [7.78, 35.58], [7.8, 35.58], [7.8, 35.56], [7.82, 35.56], [7.82, 35.58], [7.84, 35.58], [7.84, 35.6], [7.86, 35.6], [7.86, 35.62], [7.84, 35.62], [7.84, 35.64], [7.82, 35.64], [7.82, 35.66], [7.82, 35.68], [7.82, 35.7], [7.82, 35.72], [7.82, 35.74], [7.8, 35.74], [7.82, 35.74], [7.84, 35.74], [7.84, 35.76], [7.82, 35.76], [7.8, 35.76], [7.8, 35.78], [7.78, 35.78], [7.78, 35.8], [7.76, 35.8], [7.78, 35.8], [7.78, 35.82], [7.78, 35.84], [7.76, 35.84], [7.76, 35.86], [7.76, 35.88], [7.74, 35.88], [7.72, 35.88], [7.72, 35.9], [7.72, 35.88], [7.7, 35.88], [7.68, 35.88], [7.68, 35.86], [7.7, 35.86], [7.68, 35.86], [7.68, 35.84], [7.66, 35.84], [7.68, 35.84], [7.68, 35.82], [7.7, 35.82], [7.68, 35.82], [7.66, 35.82], [7.64, 35.82], [7.62, 35.82], [7.6, 35.82], [7.6, 35.8], [7.58, 35.8], [7.58, 35.82], [7.56, 35.82], [7.56, 35.84], [7.56, 35.82], [7.56, 35.84], [7.56, 35.86], [7.54, 35.86], [7.56, 35.86], [7.56, 35.88], [7.54, 35.88], [7.52, 35.88], [7.5, 35.88], [7.5, 35.9], [7.48, 35.9], [7.46, 35.9], [7.44, 35.92], [7.42, 35.92], [7.42, 35.94], [7.44, 35.94], [7.42, 35.94], [7.42, 35.96], [7.4, 35.96], [7.4, 35.98], [7.38, 35.98], [7.38, 36], [7.36, 36], [7.36, 36.02], [7.38, 36.02], [7.36, 36.02], [7.36, 36.04], [7.36, 36.06], [7.34, 36.06], [7.36, 36.06], [7.34, 36.06], [7.34, 36.08], [7.34, 36.1], [7.32, 36.1], [7.34, 36.1], [7.32, 36.1], [7.32, 36.12], [7.32, 36.14], [7.3, 36.14], [7.28, 36.14], [7.26, 36.14], [7.24, 36.12], [7.24, 36.1], [7.22, 36.1], [7.22, 36.08], [7.2, 36.08], [7.2, 36.06], [7.18, 36.06], [7.16, 36.06], [7.14, 36.06], [7.14, 36.04], [7.12, 36.04], [7.1, 36.04], [7.1, 36.02], [7.08, 36.02], [7.08, 36.04], [7.06, 36.04], [7.06, 36.02], [7.06, 36.04], [7.04, 36.04], [7.04, 36.06], [7.04, 36.08], [7.02, 36.08], [7, 36.08], [7, 36.1], [6.98, 36.1], [7, 36.1], [7, 36.12], [7, 36.14], [6.98, 36.14], [6.96, 36.14], [6.94, 36.14], [6.92, 36.14], [6.9, 36.14], [6.88, 36.14], [6.86, 36.14], [6.84, 36.14], [6.84, 36.16], [6.82, 36.16], [6.82, 36.18], [6.8, 36.18], [6.78, 36.18], [6.78, 36.2], [6.8, 36.2], [6.78, 36.2], [6.78, 36.18], [6.76, 36.18], [6.76, 36.2], [6.74, 36.2], [6.74, 36.18], [6.76, 36.18], [6.76, 36.16], [6.74, 36.16], [6.76, 36.16], [6.74, 36.16], [6.74, 36.14], [6.72, 36.14], [6.7, 36.14], [6.68, 36.14], [6.66, 36.14], [6.64, 36.14], [6.64, 36.12], [6.64, 36.1], [6.62, 36.1], [6.6, 36.1], [6.6, 36.12], [6.58, 36.12], [6.56, 36.12], [6.58, 36.12], [6.58, 36.1], [6.56, 36.1], [6.56, 36.12], [6.54, 36.12], [6.54, 36.1], [6.54, 36.12], [6.54, 36.14], [6.52, 36.14], [6.54, 36.14], [6.52, 36.14], [6.52, 36.16], [6.54, 36.18], [6.52, 36.18], [6.52, 36.16], [6.5, 36.16], [6.48, 36.16], [6.46, 36.16], [6.44, 36.16], [6.44, 36.14], [6.42, 36.14], [6.4, 36.12], [6.4, 36.1], [6.4, 36.08], [6.42, 36.08], [6.4, 36.08], [6.42, 36.08], [6.4, 36.08], [6.4, 36.06], [6.4, 36.04], [6.4, 36.02], [6.38, 36.02], [6.38, 36], [6.36, 36], [6.36, 35.98], [6.34, 35.98], [6.32, 35.98], [6.3, 35.98], [6.3, 35.96], [6.32, 35.96], [6.3, 35.96], [6.28, 35.96], [6.28, 35.98], [6.26, 35.98], [6.26, 35.96], [6.24, 35.96], [6.22, 35.96], [6.2, 35.96], [6.2, 35.94], [6.18, 35.94], [6.16, 35.94], [6.16, 35.92], [6.16, 35.9]]] } }, { type: "Feature", properties: { code: 5, fr: "Batna", ar: "\u0628\u0627\u062A\u0646\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[4.74, 35.18], [4.74, 35.16], [4.74, 35.14], [4.76, 35.14], [4.78, 35.14], [4.8, 35.14], [4.82, 35.14], [4.84, 35.14], [4.86, 35.14], [4.88, 35.14], [4.9, 35.14], [4.94, 35.12], [4.96, 35.12], [4.98, 35.12], [4.96, 35.1], [4.98, 35.1], [4.98, 35.08], [5, 35.08], [5, 35.1], [5.02, 35.1], [5.04, 35.1], [5.04, 35.08], [5.06, 35.08], [5.08, 35.08], [5.08, 35.06], [5.1, 35.06], [5.12, 35.06], [5.12, 35.04], [5.12, 35.02], [5.14, 35.02], [5.16, 35.02], [5.18, 35.02], [5.18, 35.04], [5.2, 35.04], [5.2, 35.02], [5.22, 35.02], [5.24, 35.02], [5.24, 35], [5.26, 35], [5.28, 35], [5.28, 35.02], [5.3, 35.02], [5.3, 35.04], [5.32, 35.04], [5.34, 35.06], [5.36, 35.06], [5.38, 35.06], [5.4, 35.06], [5.42, 35.06], [5.44, 35.06], [5.44, 35.04], [5.46, 35.04], [5.48, 35.04], [5.5, 35.04], [5.5, 35.06], [5.52, 35.06], [5.54, 35.06], [5.56, 35.06], [5.56, 35.08], [5.58, 35.08], [5.58, 35.1], [5.58, 35.12], [5.58, 35.14], [5.56, 35.14], [5.56, 35.16], [5.54, 35.16], [5.52, 35.16], [5.5, 35.16], [5.48, 35.16], [5.48, 35.18], [5.48, 35.2], [5.5, 35.2], [5.52, 35.2], [5.54, 35.2], [5.56, 35.2], [5.58, 35.2], [5.6, 35.2], [5.6, 35.22], [5.62, 35.22], [5.62, 35.24], [5.64, 35.24], [5.66, 35.24], [5.66, 35.26], [5.68, 35.26], [5.7, 35.26], [5.72, 35.28], [5.74, 35.28], [5.76, 35.28], [5.78, 35.28], [5.78, 35.26], [5.8, 35.26], [5.82, 35.26], [5.84, 35.26], [5.84, 35.24], [5.86, 35.24], [5.86, 35.22], [5.88, 35.22], [5.88, 35.2], [5.9, 35.2], [5.9, 35.22], [5.92, 35.22], [5.94, 35.22], [5.96, 35.22], [5.96, 35.2], [5.94, 35.2], [5.94, 35.18], [5.92, 35.18], [5.92, 35.16], [5.9, 35.16], [5.9, 35.14], [5.88, 35.14], [5.86, 35.14], [5.88, 35.14], [5.88, 35.12], [5.9, 35.12], [5.9, 35.1], [5.88, 35.1], [5.88, 35.08], [5.9, 35.08], [5.9, 35.06], [5.9, 35.04], [5.88, 35.04], [5.86, 35.04], [5.86, 35.02], [5.88, 35.02], [5.88, 35.04], [5.9, 35.04], [5.9, 35.02], [5.92, 35.02], [5.92, 35], [5.94, 35], [5.94, 34.98], [5.94, 34.96], [5.96, 34.98], [5.96, 35], [5.98, 35], [6, 35], [6, 35.02], [6, 35.04], [6.02, 35.04], [6.02, 35.06], [6.04, 35.06], [6.04, 35.08], [6.06, 35.08], [6.06, 35.06], [6.08, 35.06], [6.1, 35.06], [6.1, 35.04], [6.1, 35.02], [6.08, 35.02], [6.1, 35.02], [6.1, 35], [6.12, 35], [6.12, 34.98], [6.14, 34.98], [6.16, 35], [6.18, 35], [6.18, 34.98], [6.2, 34.98], [6.2, 35], [6.2, 34.98], [6.2, 35], [6.2, 35.02], [6.22, 35.02], [6.22, 35.04], [6.24, 35.04], [6.24, 35.02], [6.24, 35.04], [6.26, 35.04], [6.28, 35.04], [6.3, 35.04], [6.32, 35.04], [6.34, 35.04], [6.34, 35.06], [6.36, 35.06], [6.34, 35.06], [6.36, 35.06], [6.38, 35.06], [6.4, 35.06], [6.4, 35.08], [6.38, 35.08], [6.4, 35.08], [6.42, 35.08], [6.42, 35.06], [6.42, 35.04], [6.44, 35.04], [6.44, 35.02], [6.44, 35.04], [6.44, 35.02], [6.46, 35.02], [6.46, 35], [6.44, 35], [6.44, 34.98], [6.42, 34.98], [6.44, 34.98], [6.44, 34.96], [6.42, 34.96], [6.44, 34.96], [6.44, 34.94], [6.44, 34.92], [6.44, 34.9], [6.42, 34.9], [6.44, 34.9], [6.42, 34.9], [6.42, 34.88], [6.42, 34.86], [6.42, 34.84], [6.44, 34.84], [6.44, 34.82], [6.46, 34.82], [6.46, 34.8], [6.48, 34.8], [6.5, 34.78], [6.52, 34.78], [6.54, 34.76], [6.56, 34.76], [6.58, 34.76], [6.58, 34.78], [6.58, 34.8], [6.56, 34.8], [6.56, 34.82], [6.56, 34.84], [6.56, 34.86], [6.58, 34.88], [6.6, 34.88], [6.6, 34.9], [6.58, 34.9], [6.56, 34.9], [6.58, 34.9], [6.58, 34.92], [6.6, 34.92], [6.6, 34.94], [6.58, 34.94], [6.56, 34.94], [6.56, 34.96], [6.56, 34.98], [6.54, 34.98], [6.54, 35], [6.54, 35.02], [6.52, 35.02], [6.5, 35.02], [6.5, 35.04], [6.52, 35.04], [6.52, 35.06], [6.52, 35.08], [6.5, 35.08], [6.5, 35.1], [6.5, 35.12], [6.52, 35.12], [6.52, 35.14], [6.54, 35.14], [6.56, 35.14], [6.56, 35.16], [6.56, 35.18], [6.56, 35.2], [6.56, 35.22], [6.54, 35.22], [6.54, 35.24], [6.56, 35.24], [6.56, 35.26], [6.58, 35.26], [6.58, 35.28], [6.6, 35.28], [6.62, 35.28], [6.62, 35.3], [6.64, 35.3], [6.64, 35.32], [6.62, 35.32], [6.6, 35.32], [6.58, 35.32], [6.58, 35.34], [6.58, 35.36], [6.58, 35.38], [6.6, 35.38], [6.58, 35.38], [6.58, 35.4], [6.58, 35.42], [6.56, 35.42], [6.58, 35.42], [6.58, 35.44], [6.6, 35.44], [6.6, 35.46], [6.62, 35.46], [6.62, 35.48], [6.62, 35.46], [6.64, 35.48], [6.64, 35.46], [6.64, 35.48], [6.66, 35.48], [6.68, 35.48], [6.68, 35.5], [6.68, 35.48], [6.7, 35.48], [6.72, 35.48], [6.74, 35.48], [6.74, 35.5], [6.76, 35.5], [6.76, 35.52], [6.78, 35.52], [6.76, 35.52], [6.76, 35.54], [6.78, 35.54], [6.78, 35.56], [6.8, 35.56], [6.8, 35.58], [6.78, 35.58], [6.78, 35.6], [6.76, 35.6], [6.76, 35.62], [6.76, 35.64], [6.76, 35.66], [6.76, 35.68], [6.78, 35.68], [6.76, 35.68], [6.76, 35.7], [6.74, 35.7], [6.74, 35.72], [6.72, 35.72], [6.72, 35.74], [6.7, 35.74], [6.7, 35.76], [6.68, 35.76], [6.68, 35.78], [6.66, 35.78], [6.64, 35.78], [6.62, 35.78], [6.62, 35.8], [6.6, 35.8], [6.58, 35.8], [6.56, 35.8], [6.56, 35.78], [6.54, 35.78], [6.52, 35.78], [6.5, 35.78], [6.5, 35.76], [6.48, 35.76], [6.46, 35.76], [6.46, 35.78], [6.48, 35.78], [6.48, 35.8], [6.46, 35.8], [6.46, 35.82], [6.48, 35.82], [6.48, 35.84], [6.46, 35.84], [6.44, 35.84], [6.42, 35.84], [6.4, 35.84], [6.4, 35.86], [6.38, 35.86], [6.36, 35.86], [6.36, 35.88], [6.34, 35.88], [6.32, 35.88], [6.32, 35.86], [6.32, 35.84], [6.3, 35.84], [6.28, 35.84], [6.28, 35.82], [6.26, 35.84], [6.24, 35.84], [6.22, 35.86], [6.2, 35.86], [6.18, 35.86], [6.18, 35.88], [6.16, 35.88], [6.14, 35.88], [6.12, 35.88], [6.1, 35.88], [6.08, 35.88], [6.06, 35.88], [6.06, 35.9], [6.04, 35.9], [6.02, 35.88], [6.02, 35.9], [6, 35.9], [5.98, 35.9], [5.96, 35.9], [5.96, 35.88], [5.94, 35.88], [5.92, 35.88], [5.92, 35.86], [5.94, 35.86], [5.94, 35.84], [5.94, 35.82], [5.92, 35.82], [5.92, 35.84], [5.9, 35.84], [5.88, 35.84], [5.88, 35.86], [5.86, 35.88], [5.82, 35.92], [5.8, 35.92], [5.78, 35.92], [5.76, 35.92], [5.76, 35.9], [5.74, 35.9], [5.72, 35.9], [5.72, 35.88], [5.7, 35.88], [5.72, 35.88], [5.7, 35.88], [5.7, 35.86], [5.68, 35.86], [5.68, 35.84], [5.68, 35.82], [5.7, 35.82], [5.72, 35.82], [5.74, 35.82], [5.74, 35.8], [5.72, 35.8], [5.72, 35.78], [5.72, 35.76], [5.7, 35.76], [5.68, 35.76], [5.66, 35.76], [5.66, 35.74], [5.64, 35.74], [5.62, 35.76], [5.6, 35.76], [5.6, 35.78], [5.58, 35.78], [5.56, 35.78], [5.54, 35.78], [5.52, 35.78], [5.52, 35.76], [5.5, 35.76], [5.48, 35.76], [5.48, 35.74], [5.46, 35.74], [5.44, 35.74], [5.44, 35.72], [5.44, 35.74], [5.42, 35.74], [5.42, 35.72], [5.42, 35.7], [5.42, 35.68], [5.42, 35.66], [5.42, 35.64], [5.4, 35.64], [5.4, 35.62], [5.38, 35.62], [5.36, 35.62], [5.34, 35.62], [5.34, 35.64], [5.34, 35.62], [5.32, 35.62], [5.32, 35.6], [5.3, 35.6], [5.3, 35.58], [5.28, 35.58], [5.26, 35.58], [5.26, 35.56], [5.24, 35.56], [5.22, 35.56], [5.22, 35.54], [5.22, 35.52], [5.2, 35.52], [5.18, 35.52], [5.18, 35.5], [5.18, 35.52], [5.16, 35.52], [5.16, 35.5], [5.14, 35.5], [5.12, 35.5], [5.12, 35.48], [5.1, 35.5], [5.1, 35.52], [5.08, 35.52], [5.06, 35.52], [5.04, 35.52], [5.04, 35.54], [5.04, 35.52], [5.02, 35.52], [5.02, 35.5], [5, 35.5], [5, 35.52], [4.98, 35.52], [4.98, 35.5], [4.96, 35.5], [4.96, 35.48], [4.94, 35.48], [4.94, 35.46], [4.94, 35.48], [4.92, 35.48], [4.9, 35.48], [4.9, 35.5], [4.9, 35.52], [4.88, 35.52], [4.86, 35.52], [4.86, 35.54], [4.86, 35.52], [4.86, 35.5], [4.86, 35.48], [4.86, 35.46], [4.88, 35.46], [4.88, 35.44], [4.88, 35.42], [4.88, 35.4], [4.88, 35.38], [4.88, 35.36], [4.88, 35.34], [4.86, 35.28], [4.86, 35.26], [4.86, 35.24], [4.84, 35.22], [4.82, 35.22], [4.82, 35.2], [4.8, 35.22], [4.8, 35.2], [4.78, 35.2], [4.76, 35.2], [4.76, 35.18], [4.74, 35.18]]] } }, { type: "Feature", properties: { code: 6, fr: "B\xE9ja\xEFa", ar: "\u0628\u062C\u0627\u064A\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[4.36, 36.34], [4.36, 36.32], [4.38, 36.32], [4.38, 36.3], [4.38, 36.28], [4.38, 36.26], [4.38, 36.24], [4.4, 36.24], [4.4, 36.22], [4.42, 36.22], [4.44, 36.22], [4.46, 36.22], [4.48, 36.22], [4.5, 36.22], [4.5, 36.24], [4.5, 36.22], [4.52, 36.24], [4.52, 36.26], [4.54, 36.26], [4.54, 36.24], [4.56, 36.24], [4.56, 36.26], [4.58, 36.26], [4.6, 36.26], [4.62, 36.26], [4.62, 36.28], [4.6, 36.28], [4.6, 36.3], [4.6, 36.32], [4.62, 36.32], [4.62, 36.34], [4.62, 36.36], [4.64, 36.36], [4.66, 36.36], [4.68, 36.36], [4.68, 36.38], [4.7, 36.38], [4.72, 36.38], [4.72, 36.4], [4.72, 36.42], [4.72, 36.44], [4.74, 36.44], [4.76, 36.44], [4.74, 36.44], [4.76, 36.44], [4.76, 36.46], [4.78, 36.46], [4.8, 36.46], [4.8, 36.48], [4.82, 36.48], [4.84, 36.48], [4.86, 36.48], [4.86, 36.5], [4.84, 36.5], [4.86, 36.52], [4.86, 36.54], [4.88, 36.54], [4.9, 36.54], [4.92, 36.52], [4.94, 36.52], [4.96, 36.52], [4.98, 36.5], [4.98, 36.52], [5, 36.52], [4.98, 36.52], [5, 36.52], [4.98, 36.52], [5, 36.52], [5.02, 36.52], [5.04, 36.52], [5.06, 36.52], [5.06, 36.54], [5.06, 36.56], [5.06, 36.58], [5.08, 36.58], [5.08, 36.56], [5.1, 36.56], [5.1, 36.58], [5.12, 36.58], [5.12, 36.56], [5.12, 36.58], [5.12, 36.56], [5.12, 36.58], [5.12, 36.56], [5.12, 36.58], [5.12, 36.56], [5.14, 36.56], [5.16, 36.56], [5.16, 36.54], [5.18, 36.54], [5.2, 36.52], [5.18, 36.52], [5.18, 36.5], [5.18, 36.48], [5.18, 36.46], [5.18, 36.44], [5.18, 36.42], [5.18, 36.4], [5.16, 36.4], [5.18, 36.4], [5.16, 36.4], [5.16, 36.38], [5.18, 36.38], [5.18, 36.4], [5.2, 36.4], [5.2, 36.38], [5.2, 36.36], [5.22, 36.36], [5.22, 36.38], [5.24, 36.38], [5.24, 36.36], [5.26, 36.36], [5.26, 36.38], [5.26, 36.36], [5.28, 36.36], [5.28, 36.38], [5.3, 36.38], [5.32, 36.38], [5.32, 36.4], [5.3, 36.4], [5.3, 36.42], [5.28, 36.42], [5.3, 36.42], [5.32, 36.42], [5.32, 36.44], [5.34, 36.44], [5.34, 36.46], [5.36, 36.46], [5.36, 36.48], [5.34, 36.48], [5.34, 36.5], [5.36, 36.5], [5.36, 36.52], [5.36, 36.5], [5.36, 36.52], [5.38, 36.52], [5.4, 36.5], [5.4, 36.52], [5.42, 36.52], [5.44, 36.52], [5.44, 36.54], [5.46, 36.54], [5.46, 36.56], [5.48, 36.56], [5.48, 36.58], [5.48, 36.6], [5.46, 36.6], [5.48, 36.6], [5.46, 36.6], [5.44, 36.6], [5.42, 36.6], [5.42, 36.62], [5.44, 36.64], [5.42, 36.64], [5.42, 36.66], [5.4, 36.66], [5.38, 36.66], [5.38, 36.64], [5.36, 36.64], [5.34, 36.64], [5.32, 36.64], [5.3, 36.64], [5.28, 36.64], [5.26, 36.64], [5.24, 36.64], [5.22, 36.64], [5.22, 36.66], [5.2, 36.66], [5.18, 36.66], [5.16, 36.66], [5.16, 36.68], [5.14, 36.68], [5.12, 36.68], [5.12, 36.7], [5.1, 36.7], [5.08, 36.7], [5.08, 36.72], [5.08, 36.7], [5.08, 36.72], [5.08, 36.74], [5.1, 36.74], [5.1, 36.76], [5.1, 36.74], [5.1, 36.76], [5.1, 36.74], [5.08, 36.74], [5.08, 36.76], [5.1, 36.76], [5.1, 36.78], [5.1, 36.76], [5.1, 36.78], [5.08, 36.78], [5.06, 36.78], [5.04, 36.78], [5.04, 36.8], [5.02, 36.8], [5, 36.8], [5, 36.82], [4.98, 36.82], [4.96, 36.82], [4.94, 36.82], [4.94, 36.84], [4.92, 36.84], [4.92, 36.86], [4.92, 36.84], [4.9, 36.84], [4.9, 36.86], [4.88, 36.86], [4.86, 36.86], [4.84, 36.86], [4.84, 36.88], [4.82, 36.88], [4.8, 36.88], [4.78, 36.88], [4.78, 36.9], [4.78, 36.88], [4.78, 36.9], [4.76, 36.9], [4.74, 36.9], [4.74, 36.88], [4.72, 36.88], [4.7, 36.88], [4.68, 36.88], [4.66, 36.88], [4.64, 36.88], [4.62, 36.88], [4.6, 36.88], [4.58, 36.88], [4.6, 36.88], [4.58, 36.88], [4.6, 36.88], [4.6, 36.86], [4.6, 36.84], [4.62, 36.84], [4.62, 36.82], [4.64, 36.82], [4.64, 36.8], [4.66, 36.8], [4.64, 36.8], [4.64, 36.78], [4.64, 36.76], [4.66, 36.76], [4.64, 36.76], [4.64, 36.74], [4.62, 36.74], [4.6, 36.74], [4.6, 36.76], [4.58, 36.76], [4.58, 36.74], [4.58, 36.76], [4.58, 36.74], [4.56, 36.74], [4.54, 36.74], [4.52, 36.74], [4.52, 36.72], [4.54, 36.72], [4.54, 36.7], [4.56, 36.7], [4.58, 36.7], [4.6, 36.7], [4.6, 36.68], [4.6, 36.66], [4.58, 36.66], [4.58, 36.64], [4.56, 36.64], [4.56, 36.62], [4.54, 36.62], [4.54, 36.6], [4.56, 36.6], [4.56, 36.58], [4.54, 36.58], [4.54, 36.56], [4.52, 36.56], [4.52, 36.54], [4.5, 36.54], [4.48, 36.54], [4.46, 36.54], [4.46, 36.52], [4.46, 36.5], [4.44, 36.5], [4.42, 36.5], [4.42, 36.48], [4.4, 36.48], [4.38, 36.48], [4.36, 36.48], [4.36, 36.46], [4.38, 36.44], [4.4, 36.44], [4.4, 36.42], [4.4, 36.4], [4.38, 36.4], [4.38, 36.38], [4.38, 36.36], [4.36, 36.36], [4.36, 36.34]]] } }, { type: "Feature", properties: { code: 7, fr: "Biskra", ar: "\u0628\u0633\u0643\u0631\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[4.92, 34.86], [4.94, 34.86], [4.96, 34.86], [4.98, 34.84], [5, 34.84], [5.02, 34.84], [5.04, 34.84], [5.06, 34.84], [5.08, 34.84], [5.08, 34.86], [5.1, 34.86], [5.12, 34.86], [5.12, 34.84], [5.12, 34.82], [5.14, 34.82], [5.14, 34.8], [5.14, 34.78], [5.12, 34.76], [5.12, 34.74], [5.14, 34.74], [5.16, 34.74], [5.18, 34.74], [5.18, 34.72], [5.2, 34.72], [5.2, 34.7], [5.22, 34.7], [5.22, 34.68], [5.24, 34.68], [5.24, 34.66], [5.26, 34.66], [5.26, 34.64], [5.28, 34.64], [5.28, 34.6], [5.3, 34.58], [5.3, 34.56], [5.28, 34.56], [5.28, 34.54], [5.28, 34.52], [5.3, 34.52], [5.3, 34.5], [5.32, 34.5], [5.32, 34.48], [5.34, 34.48], [5.36, 34.48], [5.36, 34.46], [5.38, 34.46], [5.4, 34.46], [5.4, 34.44], [5.42, 34.44], [5.44, 34.44], [5.46, 34.44], [5.48, 34.44], [5.5, 34.44], [5.52, 34.44], [5.54, 34.44], [5.54, 34.42], [5.56, 34.42], [5.6, 34.42], [5.66, 34.42], [5.68, 34.42], [5.7, 34.42], [5.78, 34.4], [5.8, 34.4], [5.82, 34.4], [5.84, 34.4], [5.86, 34.4], [5.88, 34.4], [5.9, 34.4], [5.9, 34.38], [5.92, 34.38], [5.94, 34.38], [5.96, 34.38], [5.96, 34.4], [5.98, 34.4], [6, 34.4], [6.02, 34.4], [6.04, 34.4], [6.06, 34.4], [6.06, 34.42], [6.08, 34.42], [6.1, 34.42], [6.12, 34.42], [6.14, 34.42], [6.16, 34.42], [6.18, 34.42], [6.2, 34.42], [6.22, 34.42], [6.24, 34.42], [6.26, 34.4], [6.28, 34.4], [6.3, 34.4], [6.32, 34.4], [6.32, 34.38], [6.34, 34.38], [6.36, 34.36], [6.38, 34.36], [6.4, 34.36], [6.42, 34.36], [6.44, 34.36], [6.44, 34.34], [6.46, 34.34], [6.48, 34.34], [6.48, 34.32], [6.5, 34.32], [6.5, 34.3], [6.52, 34.3], [6.52, 34.28], [6.54, 34.28], [6.56, 34.28], [6.58, 34.28], [6.6, 34.28], [6.6, 34.3], [6.62, 34.3], [6.62, 34.32], [6.64, 34.32], [6.66, 34.34], [6.68, 34.34], [6.68, 34.36], [6.68, 34.38], [6.7, 34.38], [6.7, 34.4], [6.72, 34.4], [6.7, 34.4], [6.72, 34.4], [6.7, 34.4], [6.7, 34.42], [6.7, 34.44], [6.68, 34.46], [6.68, 34.48], [6.7, 34.48], [6.7, 34.5], [6.72, 34.5], [6.72, 34.52], [6.72, 34.54], [6.74, 34.54], [6.74, 34.56], [6.74, 34.58], [6.74, 34.6], [6.74, 34.62], [6.74, 34.64], [6.74, 34.66], [6.74, 34.68], [6.74, 34.7], [6.76, 34.7], [6.76, 34.72], [6.76, 34.74], [6.76, 34.76], [6.78, 34.76], [6.74, 34.76], [6.74, 34.78], [6.74, 34.8], [6.76, 34.8], [6.74, 34.8], [6.74, 34.82], [6.72, 34.82], [6.72, 34.84], [6.7, 34.84], [6.72, 34.84], [6.72, 34.86], [6.7, 34.86], [6.68, 34.86], [6.66, 34.86], [6.66, 34.84], [6.66, 34.82], [6.64, 34.82], [6.64, 34.8], [6.62, 34.8], [6.62, 34.78], [6.6, 34.78], [6.58, 34.78], [6.58, 34.76], [6.56, 34.76], [6.54, 34.76], [6.52, 34.78], [6.5, 34.78], [6.48, 34.8], [6.46, 34.8], [6.46, 34.82], [6.44, 34.82], [6.44, 34.84], [6.42, 34.84], [6.42, 34.86], [6.42, 34.88], [6.42, 34.9], [6.44, 34.9], [6.42, 34.9], [6.44, 34.9], [6.44, 34.92], [6.44, 34.94], [6.44, 34.96], [6.42, 34.96], [6.44, 34.96], [6.44, 34.98], [6.42, 34.98], [6.44, 34.98], [6.44, 35], [6.46, 35], [6.46, 35.02], [6.44, 35.02], [6.44, 35.04], [6.44, 35.02], [6.44, 35.04], [6.42, 35.04], [6.42, 35.06], [6.42, 35.08], [6.4, 35.08], [6.38, 35.08], [6.4, 35.08], [6.4, 35.06], [6.38, 35.06], [6.36, 35.06], [6.34, 35.06], [6.36, 35.06], [6.34, 35.06], [6.34, 35.04], [6.32, 35.04], [6.3, 35.04], [6.28, 35.04], [6.26, 35.04], [6.24, 35.04], [6.24, 35.02], [6.24, 35.04], [6.22, 35.04], [6.22, 35.02], [6.2, 35.02], [6.2, 35], [6.2, 34.98], [6.2, 35], [6.2, 34.98], [6.18, 34.98], [6.18, 35], [6.16, 35], [6.14, 34.98], [6.12, 34.98], [6.12, 35], [6.1, 35], [6.1, 35.02], [6.08, 35.02], [6.1, 35.02], [6.1, 35.04], [6.1, 35.06], [6.08, 35.06], [6.06, 35.06], [6.06, 35.08], [6.04, 35.08], [6.04, 35.06], [6.02, 35.06], [6.02, 35.04], [6, 35.04], [6, 35.02], [6, 35], [5.98, 35], [5.96, 35], [5.96, 34.98], [5.94, 34.96], [5.94, 34.98], [5.94, 35], [5.92, 35], [5.92, 35.02], [5.9, 35.02], [5.9, 35.04], [5.88, 35.04], [5.88, 35.02], [5.86, 35.02], [5.86, 35.04], [5.88, 35.04], [5.9, 35.04], [5.9, 35.06], [5.9, 35.08], [5.88, 35.08], [5.88, 35.1], [5.9, 35.1], [5.9, 35.12], [5.88, 35.12], [5.88, 35.14], [5.86, 35.14], [5.88, 35.14], [5.9, 35.14], [5.9, 35.16], [5.92, 35.16], [5.92, 35.18], [5.94, 35.18], [5.94, 35.2], [5.96, 35.2], [5.96, 35.22], [5.94, 35.22], [5.92, 35.22], [5.9, 35.22], [5.9, 35.2], [5.88, 35.2], [5.88, 35.22], [5.86, 35.22], [5.86, 35.24], [5.84, 35.24], [5.84, 35.26], [5.82, 35.26], [5.8, 35.26], [5.78, 35.26], [5.78, 35.28], [5.76, 35.28], [5.74, 35.28], [5.72, 35.28], [5.7, 35.26], [5.68, 35.26], [5.66, 35.26], [5.66, 35.24], [5.64, 35.24], [5.62, 35.24], [5.62, 35.22], [5.6, 35.22], [5.6, 35.2], [5.58, 35.2], [5.56, 35.2], [5.54, 35.2], [5.52, 35.2], [5.5, 35.2], [5.48, 35.2], [5.48, 35.18], [5.48, 35.16], [5.5, 35.16], [5.52, 35.16], [5.54, 35.16], [5.56, 35.16], [5.56, 35.14], [5.58, 35.14], [5.58, 35.12], [5.58, 35.1], [5.58, 35.08], [5.56, 35.08], [5.56, 35.06], [5.54, 35.06], [5.52, 35.06], [5.5, 35.06], [5.5, 35.04], [5.48, 35.04], [5.46, 35.04], [5.44, 35.04], [5.44, 35.06], [5.42, 35.06], [5.4, 35.06], [5.38, 35.06], [5.36, 35.06], [5.34, 35.06], [5.32, 35.04], [5.3, 35.04], [5.3, 35.02], [5.28, 35.02], [5.28, 35], [5.26, 35], [5.24, 35], [5.24, 35.02], [5.22, 35.02], [5.2, 35.02], [5.2, 35.04], [5.18, 35.04], [5.18, 35.02], [5.16, 35.02], [5.14, 35.02], [5.12, 35.02], [5.12, 35.04], [5.12, 35.06], [5.1, 35.06], [5.08, 35.06], [5.08, 35.08], [5.06, 35.08], [5.04, 35.08], [5.04, 35.1], [5.02, 35.1], [5, 35.1], [5, 35.08], [4.98, 35.08], [5, 35.08], [5, 35.04], [5, 35.02], [5, 35], [5.02, 35], [5.02, 34.98], [5, 34.96], [5, 34.94], [5.02, 34.94], [5, 34.94], [5, 34.92], [5, 34.9], [4.98, 34.9], [4.98, 34.88], [4.96, 34.88], [4.94, 34.88], [4.94, 34.86], [4.92, 34.86]]] } }, { type: "Feature", properties: { code: 8, fr: "B\xE9char", ar: "\u0628\u0634\u0627\u0631", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[-3.8, 31.24], [-3.78, 31.24], [-3.78, 31.22], [-3.78, 31.2], [-3.76, 31.2], [-3.76, 31.18], [-3.76, 31.16], [-3.78, 31.16], [-3.78, 31.14], [-3.78, 31.12], [-3.78, 31.1], [-3.78, 31.12], [-3.76, 31.12], [-3.74, 31.12], [-3.72, 31.12], [-3.72, 31.14], [-3.74, 31.14], [-3.72, 31.14], [-3.72, 31.16], [-3.7, 31.16], [-3.7, 31.14], [-3.7, 31.16], [-3.72, 31.16], [-3.7, 31.18], [-3.7, 31.16], [-3.68, 31.16], [-3.68, 31.14], [-3.68, 31.12], [-3.68, 31.1], [-3.68, 31.08], [-3.66, 31.08], [-3.64, 31.08], [-3.66, 31.08], [-3.66, 31.1], [-3.64, 31.1], [-3.64, 31.12], [-3.64, 31.14], [-3.66, 31.14], [-3.64, 31.14], [-3.64, 31.16], [-3.64, 31.14], [-3.64, 31.12], [-3.64, 31.1], [-3.62, 31.1], [-3.62, 31.12], [-3.62, 31.1], [-3.6, 31.1], [-3.6, 31.08], [-3.6, 31.06], [-3.58, 31.06], [-3.58, 31.04], [-3.58, 31.06], [-3.56, 31.06], [-3.56, 31.04], [-3.56, 31.06], [-3.54, 31.06], [-3.56, 31.06], [-3.54, 31.06], [-3.56, 31.04], [-3.54, 31.04], [-3.54, 31.02], [-3.54, 31], [-3.54, 30.98], [-3.54, 30.96], [-3.56, 30.96], [-3.56, 30.94], [-3.56, 30.92], [-3.56, 30.94], [-3.58, 30.94], [-3.58, 30.92], [-3.58, 30.9], [-3.6, 30.9], [-3.6, 30.88], [-3.62, 30.88], [-3.62, 30.86], [-3.62, 30.88], [-3.64, 30.88], [-3.64, 30.86], [-3.66, 30.86], [-3.66, 30.84], [-3.66, 30.82], [-3.66, 30.8], [-3.64, 30.8], [-3.64, 30.78], [-3.64, 30.76], [-3.64, 30.74], [-3.62, 30.74], [-3.64, 30.74], [-3.64, 30.72], [-3.64, 30.7], [-3.64, 30.68], [-3.66, 30.68], [-3.66, 30.66], [-3.64, 30.64], [-3.62, 30.6], [-3.6, 30.6], [-3.6, 30.58], [-3.6, 30.54], [-3.6, 30.52], [-3.58, 30.46], [-3.58, 30.42], [-3.58, 30.4], [-3.58, 30.36], [-3.56, 30.36], [-3.5, 30.38], [-3.38, 30.4], [-3.28, 30.42], [-3.18, 30.46], [-3.1, 30.48], [-3.04, 30.48], [-3, 30.48], [-3, 30.5], [-2.98, 30.5], [-2.94, 30.5], [-2.92, 30.5], [-2.9, 30.5], [-2.86, 30.52], [-2.84, 30.52], [-2.8, 30.52], [-2.78, 30.54], [-2.74, 30.56], [-2.7, 30.6], [-2.68, 30.62], [-2.64, 30.64], [-2.6, 30.66], [-2.58, 30.7], [-2.56, 30.7], [-2.54, 30.72], [-2.52, 30.72], [-2.5, 30.72], [-2.48, 30.72], [-2.46, 30.72], [-2.44, 30.74], [-2.42, 30.74], [-2.4, 30.72], [-2.38, 30.72], [-2.38, 30.7], [-2.36, 30.7], [-2.36, 30.68], [-2.32, 30.68], [-2.28, 30.7], [-2.22, 30.7], [-2.18, 30.7], [-2.14, 30.7], [-2.1, 30.7], [-2.06, 30.72], [-2.04, 30.72], [-2.02, 30.72], [-2, 30.72], [-1.98, 30.72], [-1.96, 30.74], [-1.92, 30.74], [-1.9, 30.76], [-1.88, 30.76], [-1.84, 30.78], [-1.82, 30.78], [-1.8, 30.78], [-1.76, 30.8], [-1.7, 30.8], [-1.66, 30.8], [-1.62, 30.82], [-1.58, 30.82], [-1.56, 30.82], [-1.52, 30.82], [-1.5, 30.82], [-1.46, 30.82], [-1.42, 30.82], [-1.4, 30.8], [-1.38, 30.8], [-1.36, 30.8], [-1.34, 30.8], [-1.32, 30.8], [-1.26, 30.82], [-1.2, 30.82], [-1.16, 30.84], [-1.1, 30.84], [-1.08, 30.84], [-1.06, 30.86], [-1.04, 30.86], [-1.02, 30.86], [-1, 30.86], [-1, 30.84], [-0.98, 30.84], [-0.96, 30.86], [-0.94, 30.86], [-0.92, 30.86], [-0.84, 30.86], [-0.74, 30.86], [-0.64, 30.88], [-0.58, 30.88], [-0.52, 30.84], [-0.44, 30.82], [-0.36, 30.78], [-0.3, 30.74], [-0.24, 30.74], [-0.18, 30.72], [-0.12, 30.72], [-0.1, 30.72], [-0.08, 30.72], [-0.04, 30.72], [-0.02, 30.72], [0, 30.72], [0, 30.74], [0.02, 30.74], [0.06, 30.74], [0.08, 30.74], [0.1, 30.74], [0.18, 30.72], [0.28, 30.72], [0.38, 30.7], [0.36, 30.72], [0.34, 30.74], [0.32, 30.74], [0.3, 30.76], [0.3, 30.78], [0.28, 30.78], [0.26, 30.8], [0.24, 30.8], [0.22, 30.82], [0.2, 30.82], [0.2, 30.84], [0.18, 30.86], [0.16, 30.86], [0.14, 30.88], [0.12, 30.88], [0.12, 30.9], [0.1, 30.9], [0.08, 30.92], [0.06, 30.94], [0.04, 30.94], [0.04, 30.96], [0.02, 30.96], [0, 30.98], [-0.02, 30.98], [-0.04, 31], [-0.04, 31.02], [-0.06, 31.02], [-0.08, 31.04], [-0.1, 31.04], [-0.12, 31.06], [-0.14, 31.08], [-0.16, 31.1], [-0.18, 31.1], [-0.2, 31.12], [-0.22, 31.14], [-0.24, 31.14], [-0.26, 31.16], [-0.26, 31.18], [-0.26, 31.2], [-0.24, 31.22], [-0.24, 31.24], [-0.24, 31.26], [-0.22, 31.28], [-0.24, 31.28], [-0.24, 31.3], [-0.26, 31.3], [-0.26, 31.32], [-0.28, 31.32], [-0.3, 31.34], [-0.32, 31.34], [-0.32, 31.36], [-0.34, 31.36], [-0.36, 31.36], [-0.36, 31.38], [-0.38, 31.4], [-0.38, 31.42], [-0.4, 31.44], [-0.4, 31.46], [-0.4, 31.48], [-0.4, 31.5], [-0.4, 31.52], [-0.38, 31.52], [-0.38, 31.54], [-0.36, 31.54], [-0.36, 31.56], [-0.38, 31.58], [-0.4, 31.6], [-0.4, 31.62], [-0.42, 31.64], [-0.4, 31.66], [-0.38, 31.66], [-0.38, 31.68], [-0.36, 31.68], [-0.38, 31.7], [-0.38, 31.72], [-0.4, 31.74], [-0.4, 31.76], [-0.38, 31.76], [-0.38, 31.78], [-0.38, 31.8], [-0.36, 31.8], [-0.36, 31.82], [-0.36, 31.84], [-0.36, 31.86], [-0.38, 31.88], [-0.38, 31.9], [-0.38, 31.92], [-0.4, 31.92], [-0.4, 31.94], [-0.4, 31.96], [-0.4, 31.98], [-0.4, 32], [-0.38, 32.02], [-0.38, 32.04], [-0.38, 32.06], [-0.36, 32.06], [-0.38, 32.08], [-0.36, 32.1], [-0.34, 32.12], [-0.34, 32.14], [-0.32, 32.16], [-0.3, 32.16], [-0.28, 32.18], [-0.26, 32.18], [-0.24, 32.18], [-0.22, 32.18], [-0.2, 32.16], [-0.2, 32.18], [-0.2, 32.2], [-0.18, 32.2], [-0.18, 32.22], [-0.16, 32.24], [-0.16, 32.26], [-0.16, 32.28], [-0.14, 32.3], [-0.16, 32.32], [-0.16, 32.34], [-0.22, 32.24], [-0.34, 32.26], [-0.42, 32.2], [-0.58, 32.24], [-0.74, 32.28], [-0.74, 32.26], [-0.76, 32.26], [-0.78, 32.24], [-0.8, 32.24], [-0.82, 32.22], [-0.84, 32.22], [-0.84, 32.2], [-0.86, 32.2], [-0.88, 32.2], [-0.9, 32.18], [-0.92, 32.18], [-0.94, 32.18], [-0.94, 32.16], [-0.96, 32.16], [-0.98, 32.16], [-0.98, 32.14], [-1, 32.14], [-1, 32.16], [-1, 32.18], [-1, 32.2], [-1.02, 32.2], [-1.04, 32.2], [-1.06, 32.2], [-1.08, 32.2], [-1.08, 32.22], [-1.08, 32.24], [-1.06, 32.26], [-1.06, 32.28], [-1.06, 32.3], [-1.06, 32.32], [-1.08, 32.32], [-1.1, 32.32], [-1.12, 32.32], [-1.12, 32.34], [-1.14, 32.34], [-1.14, 32.36], [-1.14, 32.38], [-1.12, 32.38], [-1.12, 32.4], [-1.12, 32.42], [-1.14, 32.42], [-1.16, 32.42], [-1.16, 32.4], [-1.18, 32.42], [-1.18, 32.4], [-1.2, 32.4], [-1.2, 32.38], [-1.2, 32.36], [-1.22, 32.36], [-1.22, 32.34], [-1.24, 32.34], [-1.24, 32.32], [-1.24, 32.3], [-1.24, 32.28], [-1.24, 32.26], [-1.24, 32.24], [-1.24, 32.22], [-1.24, 32.2], [-1.26, 32.2], [-1.26, 32.18], [-1.28, 32.18], [-1.3, 32.18], [-1.3, 32.16], [-1.28, 32.16], [-1.26, 32.16], [-1.24, 32.16], [-1.24, 32.18], [-1.22, 32.18], [-1.2, 32.18], [-1.2, 32.16], [-1.18, 32.16], [-1.16, 32.14], [-1.16, 32.12], [-1.16, 32.1], [-1.16, 32.12], [-1.16, 32.1], [-1.18, 32.1], [-1.2, 32.1], [-1.2, 32.08], [-1.22, 32.08], [-1.24, 32.08], [-1.22, 32.08], [-1.24, 32.08], [-1.26, 32.08], [-1.28, 32.08], [-1.3, 32.08], [-1.32, 32.08], [-1.34, 32.08], [-1.36, 32.1], [-1.38, 32.08], [-1.4, 32.08], [-1.42, 32.08], [-1.42, 32.1], [-1.44, 32.1], [-1.46, 32.1], [-1.48, 32.1], [-1.5, 32.1], [-1.52, 32.1], [-1.54, 32.1], [-1.56, 32.1], [-1.58, 32.1], [-1.6, 32.1], [-1.62, 32.1], [-1.64, 32.1], [-1.64, 32.12], [-1.64, 32.1], [-1.66, 32.12], [-1.66, 32.1], [-1.66, 32.12], [-1.66, 32.1], [-1.66, 32.12], [-1.68, 32.12], [-1.7, 32.12], [-1.72, 32.12], [-1.74, 32.12], [-1.76, 32.12], [-1.78, 32.12], [-1.78, 32.14], [-1.8, 32.14], [-1.82, 32.14], [-1.84, 32.14], [-1.86, 32.14], [-1.88, 32.14], [-1.88, 32.16], [-1.9, 32.16], [-1.92, 32.16], [-1.94, 32.16], [-1.96, 32.16], [-1.98, 32.16], [-1.98, 32.18], [-2, 32.18], [-2.02, 32.18], [-2.04, 32.18], [-2.06, 32.18], [-2.06, 32.16], [-2.08, 32.16], [-2.1, 32.16], [-2.12, 32.16], [-2.12, 32.14], [-2.14, 32.14], [-2.16, 32.14], [-2.18, 32.14], [-2.2, 32.14], [-2.2, 32.16], [-2.22, 32.16], [-2.24, 32.16], [-2.26, 32.16], [-2.28, 32.16], [-2.3, 32.16], [-2.32, 32.16], [-2.34, 32.16], [-2.36, 32.16], [-2.38, 32.16], [-2.4, 32.16], [-2.42, 32.16], [-2.44, 32.16], [-2.46, 32.16], [-2.48, 32.16], [-2.5, 32.16], [-2.5, 32.14], [-2.52, 32.14], [-2.54, 32.14], [-2.56, 32.14], [-2.56, 32.12], [-2.58, 32.12], [-2.6, 32.12], [-2.62, 32.12], [-2.64, 32.12], [-2.66, 32.12], [-2.68, 32.12], [-2.7, 32.12], [-2.72, 32.12], [-2.74, 32.12], [-2.76, 32.12], [-2.78, 32.12], [-2.8, 32.12], [-2.82, 32.12], [-2.84, 32.12], [-2.86, 32.12], [-2.88, 32.12], [-2.88, 32.1], [-2.9, 32.1], [-2.9, 32.08], [-2.92, 32.08], [-2.92, 32.06], [-2.92, 32.04], [-2.94, 32.04], [-2.94, 32.02], [-2.92, 32.02], [-2.92, 32], [-2.9, 32], [-2.9, 31.98], [-2.88, 31.96], [-2.88, 31.94], [-2.88, 31.92], [-2.86, 31.92], [-2.86, 31.9], [-2.84, 31.88], [-2.84, 31.86], [-2.84, 31.84], [-2.84, 31.82], [-2.82, 31.82], [-2.82, 31.8], [-3, 31.76], [-3.14, 31.74], [-3.16, 31.72], [-3.26, 31.72], [-3.32, 31.7], [-3.38, 31.68], [-3.5, 31.66], [-3.58, 31.66], [-3.66, 31.64], [-3.66, 31.52], [-3.66, 31.5], [-3.66, 31.44], [-3.66, 31.4], [-3.64, 31.4], [-3.66, 31.38], [-3.68, 31.38], [-3.68, 31.36], [-3.7, 31.36], [-3.72, 31.36], [-3.72, 31.34], [-3.74, 31.34], [-3.74, 31.36], [-3.76, 31.36], [-3.76, 31.34], [-3.76, 31.32], [-3.76, 31.3], [-3.78, 31.3], [-3.78, 31.28], [-3.78, 31.3], [-3.78, 31.28], [-3.76, 31.28], [-3.76, 31.26], [-3.78, 31.26], [-3.78, 31.24], [-3.8, 31.24]]] } }, { type: "Feature", properties: { code: 9, fr: "Blida", ar: "\u0627\u0644\u0628\u0644\u064A\u062F\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[2.48, 36.42], [2.48, 36.4], [2.48, 36.42], [2.5, 36.42], [2.5, 36.4], [2.5, 36.42], [2.5, 36.4], [2.5, 36.42], [2.5, 36.4], [2.5, 36.42], [2.5, 36.4], [2.52, 36.4], [2.52, 36.38], [2.54, 36.38], [2.56, 36.38], [2.58, 36.38], [2.56, 36.38], [2.56, 36.36], [2.56, 36.34], [2.58, 36.34], [2.6, 36.34], [2.62, 36.34], [2.62, 36.32], [2.62, 36.34], [2.64, 36.34], [2.66, 36.34], [2.66, 36.36], [2.66, 36.34], [2.66, 36.36], [2.68, 36.36], [2.7, 36.36], [2.7, 36.38], [2.72, 36.38], [2.74, 36.38], [2.76, 36.38], [2.78, 36.38], [2.78, 36.36], [2.78, 36.38], [2.78, 36.36], [2.78, 36.38], [2.8, 36.38], [2.8, 36.36], [2.8, 36.38], [2.8, 36.36], [2.82, 36.36], [2.84, 36.36], [2.84, 36.38], [2.84, 36.36], [2.84, 36.38], [2.86, 36.38], [2.86, 36.4], [2.88, 36.4], [2.9, 36.4], [2.92, 36.4], [2.92, 36.38], [2.94, 36.38], [2.92, 36.38], [2.92, 36.36], [2.94, 36.36], [2.94, 36.34], [2.94, 36.36], [2.94, 36.34], [2.94, 36.36], [2.94, 36.34], [2.96, 36.34], [2.96, 36.36], [2.98, 36.36], [2.98, 36.34], [2.98, 36.36], [3, 36.36], [3, 36.34], [3.02, 36.34], [3.02, 36.36], [3.04, 36.36], [3.04, 36.38], [3.06, 36.38], [3.06, 36.4], [3.04, 36.4], [3.06, 36.4], [3.04, 36.4], [3.06, 36.4], [3.06, 36.42], [3.04, 36.42], [3.04, 36.44], [3.06, 36.44], [3.06, 36.42], [3.06, 36.4], [3.08, 36.4], [3.08, 36.42], [3.1, 36.42], [3.12, 36.42], [3.12, 36.4], [3.14, 36.4], [3.16, 36.4], [3.16, 36.42], [3.16, 36.4], [3.16, 36.42], [3.16, 36.44], [3.18, 36.44], [3.18, 36.46], [3.18, 36.48], [3.2, 36.48], [3.2, 36.5], [3.22, 36.5], [3.22, 36.48], [3.22, 36.5], [3.22, 36.48], [3.22, 36.5], [3.22, 36.48], [3.22, 36.5], [3.22, 36.48], [3.22, 36.5], [3.22, 36.48], [3.24, 36.48], [3.26, 36.48], [3.28, 36.48], [3.28, 36.5], [3.3, 36.5], [3.3, 36.52], [3.3, 36.54], [3.3, 36.56], [3.28, 36.56], [3.28, 36.58], [3.3, 36.58], [3.28, 36.58], [3.28, 36.6], [3.28, 36.62], [3.3, 36.62], [3.3, 36.64], [3.28, 36.64], [3.28, 36.62], [3.26, 36.62], [3.26, 36.64], [3.24, 36.64], [3.24, 36.66], [3.22, 36.66], [3.2, 36.68], [3.2, 36.66], [3.18, 36.66], [3.18, 36.64], [3.16, 36.64], [3.16, 36.66], [3.14, 36.66], [3.14, 36.64], [3.14, 36.62], [3.12, 36.62], [3.12, 36.6], [3.14, 36.6], [3.12, 36.6], [3.12, 36.58], [3.1, 36.58], [3.1, 36.6], [3.08, 36.6], [3.08, 36.58], [3.06, 36.58], [3.06, 36.6], [3.06, 36.62], [3.04, 36.62], [3.02, 36.6], [3.04, 36.6], [3.02, 36.6], [3, 36.6], [3, 36.58], [2.98, 36.58], [2.98, 36.6], [2.96, 36.6], [2.96, 36.58], [2.96, 36.6], [2.96, 36.62], [2.94, 36.6], [2.92, 36.6], [2.9, 36.6], [2.9, 36.62], [2.88, 36.62], [2.88, 36.64], [2.86, 36.64], [2.84, 36.64], [2.82, 36.64], [2.82, 36.62], [2.84, 36.62], [2.82, 36.62], [2.82, 36.6], [2.8, 36.6], [2.78, 36.6], [2.78, 36.58], [2.76, 36.58], [2.74, 36.58], [2.72, 36.58], [2.72, 36.56], [2.7, 36.56], [2.68, 36.56], [2.68, 36.54], [2.68, 36.56], [2.68, 36.54], [2.66, 36.54], [2.66, 36.52], [2.64, 36.52], [2.62, 36.52], [2.6, 36.52], [2.6, 36.5], [2.62, 36.5], [2.62, 36.48], [2.62, 36.46], [2.6, 36.46], [2.58, 36.46], [2.56, 36.46], [2.54, 36.46], [2.52, 36.46], [2.52, 36.44], [2.5, 36.44], [2.5, 36.42], [2.52, 36.42], [2.5, 36.42], [2.48, 36.42]]] } }, { type: "Feature", properties: { code: 10, fr: "Bouira", ar: "\u0627\u0644\u0628\u0648\u064A\u0631\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[3.3, 36.52], [3.3, 36.5], [3.32, 36.5], [3.32, 36.48], [3.34, 36.48], [3.36, 36.48], [3.36, 36.46], [3.38, 36.46], [3.38, 36.44], [3.4, 36.44], [3.4, 36.42], [3.42, 36.42], [3.42, 36.4], [3.44, 36.4], [3.44, 36.42], [3.42, 36.42], [3.44, 36.42], [3.46, 36.42], [3.46, 36.44], [3.48, 36.44], [3.48, 36.46], [3.5, 36.46], [3.5, 36.44], [3.52, 36.44], [3.54, 36.44], [3.54, 36.42], [3.54, 36.44], [3.56, 36.44], [3.56, 36.42], [3.56, 36.4], [3.56, 36.42], [3.56, 36.4], [3.54, 36.4], [3.56, 36.4], [3.54, 36.4], [3.54, 36.38], [3.56, 36.38], [3.56, 36.36], [3.58, 36.36], [3.6, 36.36], [3.6, 36.34], [3.58, 36.34], [3.56, 36.34], [3.54, 36.34], [3.54, 36.32], [3.54, 36.3], [3.54, 36.28], [3.52, 36.28], [3.54, 36.28], [3.54, 36.26], [3.54, 36.28], [3.54, 36.26], [3.56, 36.26], [3.54, 36.26], [3.56, 36.26], [3.56, 36.24], [3.56, 36.22], [3.56, 36.2], [3.54, 36.2], [3.52, 36.2], [3.5, 36.2], [3.48, 36.2], [3.48, 36.18], [3.48, 36.16], [3.48, 36.14], [3.5, 36.14], [3.5, 36.12], [3.5, 36.1], [3.48, 36.1], [3.46, 36.1], [3.46, 36.08], [3.44, 36.08], [3.44, 36.06], [3.42, 36.06], [3.4, 36.06], [3.4, 36.04], [3.42, 36.04], [3.44, 36.04], [3.46, 36.04], [3.48, 36.04], [3.5, 36.04], [3.5, 36.02], [3.52, 36.02], [3.54, 36.02], [3.56, 36.02], [3.56, 36], [3.56, 35.98], [3.58, 35.98], [3.58, 35.96], [3.6, 35.96], [3.58, 35.96], [3.58, 35.94], [3.6, 35.94], [3.62, 35.92], [3.64, 35.92], [3.64, 35.94], [3.66, 35.94], [3.68, 35.94], [3.7, 35.94], [3.72, 35.94], [3.72, 35.92], [3.74, 35.92], [3.74, 35.9], [3.76, 35.9], [3.78, 35.9], [3.8, 35.9], [3.8, 35.88], [3.8, 35.86], [3.82, 35.86], [3.84, 35.86], [3.86, 35.86], [3.88, 35.86], [3.88, 35.88], [3.9, 35.88], [3.9, 35.9], [3.92, 35.9], [3.92, 35.88], [3.94, 35.9], [3.94, 35.88], [3.96, 35.88], [3.98, 35.88], [3.98, 35.86], [4, 35.86], [4.02, 35.86], [4.04, 35.86], [4.04, 35.88], [4.02, 35.88], [4.04, 35.88], [4.02, 35.88], [4.04, 35.88], [4.02, 35.88], [4.02, 35.9], [4.02, 35.92], [4.02, 35.94], [4.04, 35.94], [4.04, 35.96], [4.04, 35.98], [4.06, 35.98], [4.06, 36], [4.08, 36], [4.08, 36.02], [4.06, 36.02], [4.08, 36.02], [4.06, 36.02], [4.06, 36.04], [4.08, 36.04], [4.1, 36.04], [4.1, 36.06], [4.12, 36.06], [4.12, 36.08], [4.14, 36.08], [4.14, 36.1], [4.14, 36.12], [4.16, 36.12], [4.14, 36.12], [4.14, 36.14], [4.16, 36.14], [4.16, 36.16], [4.16, 36.18], [4.14, 36.18], [4.16, 36.18], [4.18, 36.18], [4.2, 36.18], [4.2, 36.2], [4.22, 36.2], [4.24, 36.2], [4.24, 36.22], [4.24, 36.24], [4.26, 36.24], [4.26, 36.26], [4.28, 36.26], [4.28, 36.24], [4.3, 36.24], [4.32, 36.24], [4.34, 36.24], [4.34, 36.26], [4.34, 36.24], [4.34, 36.26], [4.36, 36.26], [4.36, 36.28], [4.38, 36.28], [4.38, 36.3], [4.38, 36.32], [4.36, 36.32], [4.36, 36.34], [4.36, 36.36], [4.38, 36.36], [4.38, 36.38], [4.38, 36.4], [4.4, 36.4], [4.4, 36.42], [4.4, 36.44], [4.38, 36.44], [4.36, 36.46], [4.36, 36.48], [4.34, 36.48], [4.34, 36.46], [4.32, 36.46], [4.3, 36.46], [4.28, 36.46], [4.26, 36.46], [4.24, 36.46], [4.24, 36.48], [4.22, 36.48], [4.2, 36.48], [4.2, 36.46], [4.18, 36.46], [4.16, 36.46], [4.14, 36.46], [4.12, 36.46], [4.1, 36.46], [4.08, 36.46], [4.06, 36.46], [4.04, 36.46], [4.02, 36.46], [4, 36.46], [3.98, 36.46], [3.96, 36.46], [3.94, 36.46], [3.92, 36.46], [3.9, 36.46], [3.88, 36.46], [3.88, 36.48], [3.88, 36.46], [3.86, 36.46], [3.86, 36.48], [3.84, 36.48], [3.82, 36.48], [3.82, 36.5], [3.82, 36.52], [3.8, 36.52], [3.8, 36.54], [3.78, 36.54], [3.8, 36.54], [3.78, 36.54], [3.76, 36.54], [3.76, 36.56], [3.74, 36.56], [3.72, 36.56], [3.72, 36.58], [3.7, 36.58], [3.7, 36.6], [3.68, 36.6], [3.68, 36.58], [3.66, 36.58], [3.64, 36.58], [3.62, 36.58], [3.6, 36.58], [3.6, 36.6], [3.58, 36.6], [3.56, 36.6], [3.54, 36.6], [3.52, 36.6], [3.52, 36.62], [3.5, 36.62], [3.5, 36.6], [3.48, 36.6], [3.5, 36.6], [3.48, 36.6], [3.48, 36.58], [3.46, 36.58], [3.46, 36.56], [3.44, 36.56], [3.42, 36.56], [3.4, 36.56], [3.4, 36.54], [3.4, 36.56], [3.38, 36.56], [3.36, 36.56], [3.34, 36.56], [3.32, 36.56], [3.3, 36.56], [3.32, 36.56], [3.3, 36.56], [3.3, 36.54], [3.3, 36.52]]] } }, { type: "Feature", properties: { code: 11, fr: "Tamanrasset", ar: "\u062A\u0645\u0646\u0631\u0627\u0633\u062A", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[1.42, 21.8], [1.44, 21.8], [1.48, 21.82], [1.5, 21.82], [1.56, 21.82], [1.6, 21.84], [1.64, 21.84], [1.68, 21.82], [1.7, 21.82], [1.74, 21.82], [1.76, 21.82], [1.78, 21.82], [1.78, 21.8], [1.88, 21.82], [2.02, 21.82], [2.16, 21.82], [2.38, 21.82], [2.54, 21.82], [2.66, 21.82], [2.74, 21.82], [2.76, 21.82], [2.8, 21.82], [2.82, 21.82], [2.84, 21.82], [2.86, 21.82], [2.88, 21.82], [2.92, 21.82], [2.94, 21.82], [2.96, 21.84], [2.98, 21.84], [3, 21.84], [3.02, 21.86], [3.04, 21.88], [3.06, 21.88], [3.08, 21.88], [3.08, 21.9], [3.1, 21.9], [3.12, 21.84], [3.14, 21.78], [3.16, 21.74], [3.18, 21.68], [3.2, 21.64], [3.22, 21.58], [3.26, 21.54], [3.28, 21.48], [3.3, 21.44], [3.3, 21.42], [3.36, 21.42], [3.44, 21.42], [3.44, 21.4], [3.42, 21.4], [3.44, 21.4], [3.44, 21.38], [3.44, 21.36], [3.44, 21.34], [3.44, 21.32], [3.46, 21.32], [3.46, 21.3], [3.48, 21.3], [3.48, 21.28], [3.5, 21.28], [3.52, 21.28], [3.54, 21.28], [3.56, 21.28], [3.58, 21.28], [3.58, 21.26], [3.6, 21.26], [3.62, 21.26], [3.64, 21.26], [3.66, 21.26], [3.68, 21.26], [3.7, 21.26], [3.72, 21.24], [3.74, 21.22], [3.76, 21.22], [3.78, 21.2], [3.8, 21.16], [3.82, 21.16], [3.84, 21.16], [3.86, 21.16], [3.88, 21.16], [3.9, 21.16], [3.9, 21.14], [3.92, 21.14], [3.94, 21.14], [3.94, 21.12], [3.96, 21.12], [3.98, 21.1], [3.98, 21.08], [4, 21.08], [4.02, 21.08], [4.02, 21.06], [4.02, 21.04], [4.04, 21.04], [4.04, 21.02], [4.04, 21], [4.02, 21], [4.04, 20.98], [4.04, 20.96], [4.04, 20.94], [4.04, 20.92], [4.04, 20.9], [4.06, 20.9], [4.06, 20.88], [4.04, 20.88], [4.04, 20.86], [4.04, 20.84], [4.04, 20.82], [4.04, 20.8], [4.04, 20.78], [4.04, 20.76], [4.04, 20.74], [4.02, 20.72], [4.04, 20.72], [4.04, 20.7], [4.04, 20.68], [4.04, 20.66], [4.04, 20.64], [4.04, 20.62], [4.04, 20.6], [4.02, 20.6], [4.02, 20.58], [4.02, 20.56], [4.02, 20.54], [4.02, 20.52], [4.02, 20.5], [4.02, 20.48], [4.02, 20.46], [4.02, 20.44], [4.18, 20.46], [4.2, 20.46], [4.28, 20.48], [4.32, 20.5], [4.34, 20.5], [4.34, 20.52], [4.36, 20.52], [4.38, 20.52], [4.38, 20.54], [4.38, 20.56], [4.4, 20.56], [4.4, 20.58], [4.42, 20.58], [4.44, 20.6], [4.46, 20.6], [4.46, 20.62], [4.48, 20.62], [4.48, 20.64], [4.5, 20.64], [4.52, 20.64], [4.52, 20.66], [4.54, 20.64], [4.56, 20.64], [4.58, 20.64], [4.58, 20.62], [4.6, 20.62], [4.6, 20.64], [4.6, 20.66], [4.62, 20.66], [4.62, 20.68], [4.64, 20.68], [4.64, 20.7], [4.64, 20.72], [4.64, 20.74], [4.66, 20.74], [4.66, 20.76], [4.66, 20.78], [4.66, 20.8], [4.68, 20.8], [4.68, 20.82], [4.68, 20.84], [4.68, 20.86], [4.7, 20.86], [4.7, 20.88], [4.7, 20.9], [4.72, 20.92], [4.72, 20.94], [4.7, 20.94], [4.7, 20.96], [4.7, 20.98], [4.68, 20.98], [4.68, 21], [4.68, 21.02], [4.68, 21.04], [4.68, 21.06], [4.68, 21.08], [4.68, 21.1], [4.68, 21.12], [4.68, 21.14], [4.7, 21.14], [4.7, 21.16], [4.72, 21.16], [4.72, 21.18], [4.72, 21.2], [4.74, 21.2], [4.74, 21.22], [4.76, 21.22], [4.76, 21.2], [4.78, 21.2], [4.8, 21.2], [4.82, 21.2], [4.82, 21.18], [4.82, 21.2], [4.84, 21.2], [4.84, 21.18], [4.86, 21.18], [4.88, 21.18], [4.9, 21.18], [4.92, 21.18], [4.94, 21.18], [4.96, 21.18], [4.98, 21.18], [5, 21.16], [5.04, 21.16], [5.14, 21.12], [5.22, 21.1], [5.32, 21.06], [5.36, 21.06], [5.38, 21.04], [5.5, 21.04], [5.6, 21.02], [5.68, 21.02], [5.72, 21.02], [5.72, 21], [5.72, 20.98], [5.72, 20.96], [5.74, 20.96], [5.76, 20.94], [5.82, 20.92], [5.84, 20.92], [5.9, 20.92], [5.92, 20.9], [5.94, 20.9], [5.96, 20.9], [5.98, 20.9], [6, 20.9], [6.02, 20.9], [6.06, 20.9], [6.12, 20.9], [6.16, 20.9], [6.22, 20.9], [6.26, 20.9], [6.28, 20.92], [6.28, 20.94], [6.28, 20.96], [6.28, 20.98], [6.28, 21], [6.28, 21.02], [6.28, 21.04], [6.3, 21.04], [6.3, 21.06], [6.32, 21.06], [6.32, 21.08], [6.32, 21.1], [6.32, 21.12], [6.32, 21.14], [6.34, 21.14], [6.34, 21.16], [6.34, 21.18], [6.36, 21.18], [6.38, 21.18], [6.38, 21.2], [6.4, 21.2], [6.4, 21.22], [6.4, 21.24], [6.42, 21.24], [6.42, 21.26], [6.42, 21.28], [6.44, 21.28], [6.44, 21.3], [6.46, 21.3], [6.46, 21.32], [6.48, 21.32], [6.48, 21.34], [6.48, 21.36], [6.48, 21.38], [6.48, 21.4], [6.48, 21.42], [6.5, 21.44], [6.5, 21.46], [6.5, 21.48], [6.52, 21.48], [6.52, 21.5], [6.54, 21.5], [6.54, 21.52], [6.54, 21.54], [6.52, 21.54], [6.5, 21.54], [6.52, 21.56], [6.54, 21.56], [6.56, 21.56], [6.58, 21.56], [6.6, 21.56], [6.62, 21.56], [6.64, 21.56], [6.66, 21.54], [6.68, 21.54], [6.7, 21.54], [6.72, 21.54], [6.74, 21.54], [6.76, 21.54], [6.78, 21.54], [6.8, 21.54], [6.82, 21.54], [6.82, 21.52], [6.84, 21.52], [6.86, 21.52], [6.86, 21.5], [6.88, 21.5], [6.88, 21.48], [6.9, 21.48], [6.9, 21.46], [6.92, 21.46], [6.94, 21.46], [6.96, 21.46], [6.96, 21.44], [6.98, 21.44], [6.98, 21.42], [6.98, 21.4], [7, 21.4], [7, 21.42], [7, 21.4], [7, 21.42], [7.02, 21.42], [7.02, 21.4], [7, 21.4], [7.02, 21.38], [7.04, 21.38], [7.04, 21.36], [7.06, 21.36], [7.08, 21.36], [7.1, 21.36], [7.1, 21.38], [7.12, 21.36], [7.12, 21.34], [7.12, 21.32], [7.12, 21.3], [7.14, 21.3], [7.16, 21.3], [7.18, 21.3], [7.18, 21.28], [7.2, 21.28], [7.2, 21.26], [7.22, 21.26], [7.24, 21.26], [7.24, 21.24], [7.26, 21.24], [7.28, 21.24], [7.28, 21.22], [7.28, 21.24], [7.3, 21.24], [7.3, 21.26], [7.3, 21.28], [7.3, 21.3], [7.32, 21.3], [7.36, 21.28], [7.42, 21.24], [7.48, 21.22], [7.54, 21.18], [7.56, 21.16], [7.6, 21.12], [7.64, 21.08], [7.66, 21.08], [7.7, 21.08], [7.8, 21.04], [7.82, 21.06], [7.84, 21.08], [7.88, 21.1], [7.9, 21.1], [7.92, 21.12], [7.94, 21.14], [7.96, 21.16], [8, 21.16], [8, 21.18], [8.02, 21.18], [8.06, 21.22], [8.12, 21.24], [8.18, 21.3], [8.26, 21.34], [8.34, 21.38], [8.44, 21.44], [8.52, 21.5], [8.64, 21.56], [8.76, 21.64], [8.86, 21.7], [9, 21.78], [9.06, 21.8], [9.18, 21.88], [9.36, 21.98], [9.56, 22.1], [9.76, 22.22], [10, 22.36], [10.08, 22.4], [10.14, 22.44], [10.24, 22.5], [10.26, 22.76], [10.26, 22.9], [10.26, 22.96], [10.26, 23], [10.26, 23.02], [10.26, 23.06], [10.26, 23.08], [10.26, 23.1], [10.26, 23.12], [10.26, 23.16], [10.26, 23.18], [10.26, 23.2], [10.26, 23.22], [10.26, 23.24], [10.26, 23.26], [10.26, 23.28], [10.28, 23.3], [10.28, 23.32], [10.26, 23.32], [10.24, 23.32], [10.24, 23.34], [10.22, 23.36], [10.2, 23.36], [10.2, 23.38], [10.18, 23.38], [10.16, 23.38], [10.16, 23.4], [10.14, 23.4], [10.12, 23.42], [10.1, 23.42], [10.08, 23.44], [10.06, 23.44], [10.04, 23.44], [10.04, 23.46], [10.02, 23.46], [10, 23.48], [9.98, 23.48], [9.98, 23.5], [9.96, 23.5], [9.94, 23.5], [9.92, 23.5], [9.9, 23.5], [9.88, 23.5], [9.88, 23.52], [9.86, 23.52], [9.84, 23.52], [9.84, 23.54], [9.82, 23.54], [9.8, 23.56], [9.5, 23.56], [9.26, 23.56], [9.22, 23.56], [9, 23.44], [9, 23.42], [8.82, 23.32], [8.72, 23.26], [8.64, 23.22], [8.54, 23.2], [8.44, 23.18], [8.38, 23.18], [8.28, 23.16], [8.2, 23.14], [8.14, 23.12], [8.08, 23.12], [8.06, 23.1], [8, 23.1], [7.98, 23.1], [7.94, 23.1], [7.92, 23.08], [7.9, 23.1], [7.84, 23.14], [7.78, 23.18], [7.74, 23.22], [7.66, 23.28], [7.68, 23.3], [7.72, 23.32], [7.74, 23.36], [7.64, 23.62], [7.54, 23.82], [7.54, 23.84], [7.54, 23.92], [7.52, 23.96], [7.52, 24], [7.52, 24.04], [7.52, 24.1], [7.52, 24.16], [7.52, 24.24], [7.52, 24.26], [7.52, 24.28], [7.52, 24.34], [7.52, 24.38], [7.52, 24.4], [7.54, 24.42], [7.3, 24.74], [7.3, 24.76], [7.28, 24.76], [7.26, 24.76], [7.24, 24.76], [7.22, 24.76], [7.2, 24.76], [7.2, 24.74], [7.18, 24.76], [7.16, 24.76], [7.14, 24.76], [7.12, 24.76], [7.1, 24.76], [7.1, 24.78], [7.08, 24.78], [7.06, 24.8], [7.04, 24.8], [7.04, 24.82], [7.02, 24.82], [7.02, 24.84], [7, 24.84], [7, 24.86], [7, 24.88], [6.98, 24.88], [6.98, 24.9], [6.98, 24.92], [6.96, 24.92], [6.96, 24.94], [6.94, 24.96], [6.94, 24.98], [6.92, 24.98], [6.92, 25], [6.9, 25], [6.9, 25.02], [6.9, 25.04], [6.88, 25.06], [6.88, 25.08], [6.86, 25.08], [6.86, 25.1], [6.86, 25.12], [6.84, 25.12], [6.84, 25.14], [6.84, 25.16], [6.84, 25.18], [6.82, 25.18], [6.82, 25.2], [6.82, 25.22], [6.82, 25.24], [6.8, 25.24], [6.8, 25.26], [6.78, 25.28], [6.78, 25.3], [6.76, 25.3], [6.76, 25.32], [6.74, 25.32], [6.74, 25.34], [6.72, 25.34], [6.72, 25.36], [6.72, 25.38], [6.7, 25.38], [6.7, 25.4], [6.68, 25.4], [6.68, 25.42], [6.66, 25.44], [6.66, 25.46], [6.64, 25.46], [6.64, 25.48], [6.62, 25.48], [6.62, 25.5], [6.6, 25.5], [6.58, 25.52], [6.58, 25.56], [6.42, 26], [6.4, 26.02], [6.4, 26.04], [6.38, 26.08], [6.36, 26.12], [6.36, 26.16], [6.34, 26.16], [6.34, 26.18], [6.32, 26.18], [6.32, 26.2], [6.3, 26.2], [6.28, 26.2], [6.28, 26.22], [6.28, 26.24], [6.26, 26.24], [6.26, 26.26], [6.24, 26.24], [6.24, 26.26], [6.22, 26.26], [6.2, 26.26], [6.18, 26.28], [6.18, 26.3], [6.16, 26.3], [6.16, 26.32], [6.14, 26.32], [6.14, 26.34], [6.16, 26.34], [6.16, 26.36], [6.16, 26.38], [6.18, 26.38], [6.18, 26.4], [6.16, 26.4], [6.16, 26.42], [6.18, 26.42], [6.18, 26.44], [6.2, 26.46], [6.22, 26.46], [6.24, 26.46], [6.24, 26.48], [6.26, 26.48], [6.26, 26.5], [6.28, 26.5], [6.28, 26.52], [6.3, 26.52], [6.3, 26.54], [6.32, 26.54], [6.32, 26.56], [6.3, 26.56], [6.3, 26.58], [6.3, 26.6], [6.3, 26.62], [6.28, 26.62], [6.28, 26.64], [6.26, 26.64], [6.26, 26.66], [6.24, 26.66], [6.24, 26.68], [6.22, 26.68], [6.18, 26.72], [6.14, 26.74], [6.12, 26.78], [6.08, 26.8], [6.06, 26.82], [6.04, 26.86], [6.02, 26.86], [6, 26.88], [5.94, 26.92], [5.9, 26.96], [5.86, 26.98], [5.86, 27], [5.8, 27.04], [5.76, 27.08], [5.76, 27.1], [5.78, 27.18], [5.78, 27.28], [5.78, 27.42], [5.48, 27.38], [5.34, 27.26], [5.34, 27.24], [5.32, 27.24], [5.32, 27.22], [5.3, 27.22], [5.3, 27.2], [5.3, 27.18], [5.3, 27.16], [5.32, 27.16], [5.32, 27.14], [5.32, 27.12], [5.32, 27.1], [5.32, 27.08], [5.3, 27.08], [5.3, 27.06], [5.3, 27.04], [5.28, 27.04], [5.28, 27.02], [5.28, 27], [5.26, 27], [5.26, 26.98], [5.24, 26.98], [5.24, 26.96], [5.24, 26.94], [5.24, 26.92], [5.22, 26.92], [5.22, 26.9], [5.2, 26.9], [5.18, 26.9], [5.18, 26.88], [5.16, 26.88], [5.14, 26.88], [5.14, 26.86], [5.14, 26.84], [5.14, 26.82], [5.14, 26.8], [5.14, 26.78], [5.12, 26.78], [5.12, 26.76], [5.1, 26.76], [5.1, 26.74], [5.08, 26.72], [5.06, 26.7], [5.04, 26.68], [5.04, 26.66], [5.02, 26.66], [5.02, 26.64], [5, 26.64], [5, 26.62], [4.98, 26.62], [4.96, 26.62], [4.96, 26.6], [4.96, 26.58], [4.96, 26.56], [4.96, 26.54], [4.94, 26.54], [4.94, 26.52], [4.94, 26.5], [4.94, 26.48], [4.92, 26.48], [4.92, 26.5], [4.92, 26.52], [4.92, 26.54], [4.9, 26.54], [4.9, 26.56], [4.88, 26.56], [4.86, 26.56], [4.86, 26.54], [4.86, 26.52], [4.86, 26.5], [4.84, 26.5], [4.82, 26.5], [4.82, 26.48], [4.8, 26.48], [4.8, 26.46], [4.78, 26.46], [4.76, 26.46], [4.74, 26.46], [4.72, 26.46], [4.72, 26.48], [4.7, 26.48], [4.7, 26.5], [4.7, 26.52], [4.68, 26.52], [4.66, 26.52], [4.66, 26.5], [4.64, 26.5], [4.66, 26.48], [4.64, 26.48], [4.62, 26.48], [4.6, 26.48], [4.58, 26.48], [4.58, 26.5], [4.58, 26.52], [4.56, 26.52], [4.56, 26.54], [4.54, 26.54], [4.52, 26.54], [4.5, 26.54], [4.48, 26.54], [4.46, 26.54], [4.44, 26.54], [4.42, 26.54], [4.4, 26.54], [4.38, 26.5], [4.36, 26.5], [4.36, 26.48], [4.34, 26.46], [4.34, 26.44], [4.32, 26.42], [4.3, 26.4], [4.24, 26.38], [4.22, 26.36], [4.18, 26.34], [4.16, 26.3], [4.12, 26.28], [4.08, 26.24], [4.04, 26.2], [4.02, 26.18], [4, 26.18], [4, 26.2], [3.98, 26.2], [3.96, 26.2], [3.96, 26.18], [3.94, 26.18], [3.94, 26.2], [3.96, 26.2], [3.94, 26.2], [3.92, 26.2], [3.9, 26.2], [3.9, 26.22], [3.88, 26.22], [3.86, 26.22], [3.84, 26.22], [3.84, 26.24], [3.84, 26.26], [3.84, 26.28], [3.8, 26.3], [3.78, 26.3], [3.76, 26.28], [3.76, 26.26], [3.74, 26.24], [3.76, 26.24], [3.78, 26.22], [3.78, 26.2], [3.8, 26.2], [3.8, 26.18], [3.8, 26.16], [3.82, 26.14], [3.84, 26.14], [3.84, 26.12], [3.84, 26.1], [3.86, 26.08], [3.86, 26.06], [3.86, 26.04], [3.86, 26.02], [3.88, 26], [3.86, 25.98], [3.86, 25.96], [3.84, 25.94], [3.84, 25.92], [3.84, 25.9], [3.82, 25.88], [3.82, 25.86], [3.82, 25.84], [3.82, 25.82], [3.82, 25.8], [3.82, 25.78], [3.84, 25.78], [3.84, 25.76], [3.86, 25.76], [3.86, 25.74], [3.86, 25.72], [3.86, 25.7], [3.88, 25.68], [3.88, 25.66], [3.9, 25.66], [3.92, 25.64], [3.92, 25.62], [3.94, 25.6], [3.92, 25.58], [3.92, 25.56], [3.9, 25.54], [3.88, 25.54], [3.88, 25.52], [3.86, 25.52], [3.84, 25.5], [3.82, 25.48], [3.8, 25.46], [3.78, 25.46], [3.76, 25.44], [3.74, 25.42], [3.72, 25.4], [3.7, 25.4], [3.68, 25.38], [3.66, 25.38], [3.64, 25.38], [3.62, 25.4], [3.6, 25.4], [3.58, 25.4], [3.56, 25.4], [3.54, 25.38], [3.52, 25.36], [3.5, 25.36], [3.48, 25.36], [3.46, 25.38], [3.44, 25.4], [3.42, 25.4], [3.4, 25.42], [3.4, 25.44], [3.4, 25.46], [3.4, 25.48], [3.4, 25.5], [3.4, 25.52], [3.4, 25.54], [3.38, 25.56], [3.38, 25.58], [3.38, 25.6], [3.36, 25.6], [3.36, 25.62], [3.34, 25.62], [3.32, 25.62], [3.3, 25.62], [3.28, 25.6], [3.28, 25.58], [3.28, 25.56], [3.26, 25.54], [3.24, 25.54], [3.22, 25.52], [3.2, 25.5], [3.2, 25.48], [3.18, 25.48], [3.16, 25.46], [3.14, 25.46], [3.12, 25.46], [3.1, 25.46], [3.08, 25.46], [3.06, 25.46], [3.04, 25.46], [3.02, 25.46], [3, 25.46], [2.98, 25.46], [2.96, 25.46], [2.94, 25.48], [2.92, 25.48], [2.9, 25.48], [2.88, 25.48], [2.86, 25.48], [2.84, 25.48], [2.82, 25.48], [2.8, 25.48], [2.78, 25.48], [2.76, 25.48], [2.74, 25.48], [2.72, 25.5], [2.7, 25.5], [2.7, 25.52], [2.68, 25.52], [2.68, 25.54], [2.66, 25.54], [2.64, 25.56], [2.62, 25.56], [2.62, 25.58], [2.6, 25.58], [2.58, 25.58], [2.56, 25.58], [2.54, 25.58], [2.52, 25.6], [2.5, 25.6], [2.48, 25.6], [2.46, 25.6], [2.44, 25.62], [2.42, 25.62], [2.42, 25.64], [2.4, 25.64], [2.38, 25.64], [2.36, 25.64], [2.34, 25.64], [2.34, 25.66], [2.32, 25.66], [2.32, 25.68], [2.3, 25.68], [2.28, 25.68], [2.26, 25.68], [2.24, 25.68], [2.22, 25.68], [2.2, 25.68], [2.18, 25.68], [2.16, 25.68], [2.14, 25.68], [2.14, 25.7], [2.14, 25.72], [2.12, 25.72], [2.1, 25.72], [2.1, 25.7], [2.1, 25.68], [2.08, 25.68], [2.08, 25.66], [2.08, 25.64], [2.06, 25.64], [2.06, 25.62], [2.06, 25.6], [2.04, 25.6], [2.04, 25.58], [2.04, 25.56], [2.02, 25.56], [2.02, 25.54], [2.02, 25.52], [2, 25.52], [2, 25.5], [1.98, 25.36], [1.94, 25.22], [1.92, 25], [1.9, 24.96], [1.76, 24.88], [1.64, 24.8], [1.52, 24.74], [1.44, 24.64], [1.44, 24.56], [1.44, 24.4], [1.44, 24.36], [1.44, 24.3], [1.44, 24.18], [1.44, 24.12], [1.44, 24.06], [1.44, 24.02], [1.44, 24], [1.42, 24], [1.42, 23.96], [1.42, 23.84], [1.42, 23.72], [1.42, 23.48], [1.42, 23.38], [1.42, 23.36], [1.42, 23.3], [1.42, 22.88], [1.42, 22.66], [1.42, 22.2], [1.42, 21.8]]] } }, { type: "Feature", properties: { code: 12, fr: "T\xE9bessa", ar: "\u062A\u0628\u0633\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[7.22, 34.9], [7.24, 34.9], [7.24, 34.88], [7.24, 34.86], [7.26, 34.86], [7.26, 34.84], [7.26, 34.82], [7.26, 34.84], [7.28, 34.84], [7.26, 34.84], [7.26, 34.86], [7.28, 34.86], [7.26, 34.86], [7.26, 34.88], [7.28, 34.88], [7.26, 34.88], [7.26, 34.86], [7.26, 34.88], [7.24, 34.88], [7.26, 34.88], [7.26, 34.9], [7.26, 34.92], [7.28, 34.92], [7.28, 34.94], [7.3, 34.94], [7.3, 34.96], [7.32, 34.96], [7.34, 34.96], [7.36, 34.96], [7.38, 34.96], [7.36, 34.96], [7.36, 34.94], [7.38, 34.94], [7.38, 34.92], [7.4, 34.92], [7.4, 34.9], [7.4, 34.88], [7.4, 34.86], [7.4, 34.84], [7.38, 34.84], [7.38, 34.82], [7.38, 34.8], [7.36, 34.8], [7.36, 34.78], [7.38, 34.78], [7.38, 34.76], [7.4, 34.76], [7.38, 34.76], [7.38, 34.74], [7.4, 34.74], [7.4, 34.72], [7.4, 34.7], [7.38, 34.7], [7.38, 34.68], [7.38, 34.66], [7.36, 34.66], [7.36, 34.64], [7.34, 34.64], [7.34, 34.62], [7.34, 34.6], [7.32, 34.6], [7.32, 34.58], [7.3, 34.58], [7.3, 34.56], [7.3, 34.54], [7.28, 34.54], [7.28, 34.52], [7.26, 34.52], [7.26, 34.5], [7.26, 34.48], [7.26, 34.46], [7.24, 34.46], [7.24, 34.44], [7.24, 34.4], [7.24, 34.34], [7.26, 34.32], [7.28, 34.32], [7.32, 34.32], [7.36, 34.3], [7.38, 34.28], [7.4, 34.28], [7.42, 34.28], [7.46, 34.28], [7.5, 34.28], [7.52, 34.26], [7.54, 34.26], [7.56, 34.26], [7.58, 34.26], [7.6, 34.26], [7.62, 34.26], [7.64, 34.26], [7.66, 34.26], [7.68, 34.26], [7.72, 34.26], [7.78, 34.24], [7.8, 34.24], [7.82, 34.24], [7.82, 34.26], [7.84, 34.3], [7.84, 34.32], [7.84, 34.34], [7.86, 34.34], [7.86, 34.36], [7.84, 34.36], [7.86, 34.36], [7.86, 34.38], [7.86, 34.4], [7.88, 34.4], [7.88, 34.42], [7.9, 34.42], [7.92, 34.42], [7.94, 34.42], [7.94, 34.44], [7.96, 34.44], [7.98, 34.44], [7.98, 34.46], [8, 34.46], [8.02, 34.46], [8.02, 34.48], [8.04, 34.5], [8.06, 34.5], [8.08, 34.5], [8.08, 34.52], [8.1, 34.52], [8.12, 34.52], [8.14, 34.52], [8.14, 34.54], [8.16, 34.54], [8.16, 34.56], [8.18, 34.56], [8.18, 34.58], [8.2, 34.58], [8.22, 34.58], [8.2, 34.58], [8.2, 34.6], [8.22, 34.6], [8.22, 34.62], [8.22, 34.6], [8.22, 34.62], [8.24, 34.62], [8.26, 34.62], [8.24, 34.62], [8.24, 34.64], [8.26, 34.64], [8.28, 34.64], [8.28, 34.66], [8.26, 34.66], [8.24, 34.66], [8.24, 34.68], [8.24, 34.7], [8.26, 34.7], [8.28, 34.7], [8.28, 34.72], [8.3, 34.72], [8.3, 34.74], [8.32, 34.72], [8.32, 34.74], [8.3, 34.74], [8.3, 34.76], [8.28, 34.76], [8.28, 34.78], [8.28, 34.8], [8.28, 34.82], [8.28, 34.84], [8.28, 34.86], [8.26, 34.86], [8.26, 34.88], [8.26, 34.9], [8.26, 34.92], [8.24, 34.92], [8.26, 34.92], [8.26, 34.94], [8.28, 34.94], [8.3, 34.94], [8.32, 34.94], [8.32, 34.96], [8.3, 34.96], [8.32, 34.96], [8.32, 34.98], [8.32, 35], [8.32, 35.02], [8.32, 35.04], [8.34, 35.04], [8.34, 35.06], [8.34, 35.08], [8.36, 35.08], [8.36, 35.1], [8.38, 35.1], [8.38, 35.12], [8.4, 35.12], [8.4, 35.14], [8.42, 35.14], [8.42, 35.16], [8.42, 35.18], [8.44, 35.2], [8.46, 35.22], [8.46, 35.24], [8.48, 35.24], [8.46, 35.24], [8.44, 35.24], [8.42, 35.24], [8.4, 35.24], [8.4, 35.26], [8.38, 35.26], [8.36, 35.26], [8.36, 35.28], [8.34, 35.28], [8.32, 35.28], [8.32, 35.3], [8.32, 35.32], [8.32, 35.34], [8.32, 35.36], [8.32, 35.38], [8.32, 35.4], [8.32, 35.42], [8.34, 35.42], [8.34, 35.44], [8.34, 35.46], [8.36, 35.46], [8.38, 35.46], [8.38, 35.48], [8.38, 35.5], [8.36, 35.5], [8.36, 35.52], [8.36, 35.54], [8.36, 35.56], [8.36, 35.58], [8.36, 35.6], [8.36, 35.62], [8.36, 35.64], [8.36, 35.66], [8.36, 35.68], [8.34, 35.68], [8.32, 35.68], [8.32, 35.7], [8.3, 35.7], [8.28, 35.72], [8.26, 35.74], [8.26, 35.76], [8.26, 35.78], [8.26, 35.8], [8.28, 35.82], [8.26, 35.82], [8.28, 35.82], [8.28, 35.84], [8.26, 35.86], [8.26, 35.88], [8.28, 35.88], [8.26, 35.88], [8.26, 35.9], [8.28, 35.9], [8.26, 35.9], [8.28, 35.9], [8.26, 35.9], [8.26, 35.92], [8.26, 35.94], [8.28, 35.94], [8.28, 35.96], [8.3, 35.96], [8.28, 35.96], [8.3, 35.96], [8.28, 35.96], [8.26, 35.96], [8.24, 35.96], [8.24, 35.98], [8.22, 35.98], [8.22, 36], [8.2, 36], [8.18, 36], [8.18, 35.98], [8.18, 36], [8.18, 35.98], [8.16, 35.98], [8.16, 36], [8.16, 35.98], [8.16, 36], [8.14, 36], [8.12, 36], [8.12, 35.98], [8.12, 36], [8.12, 35.98], [8.1, 35.98], [8.08, 35.98], [8.08, 35.96], [8.06, 35.96], [8.06, 35.98], [8.04, 35.98], [8.04, 35.96], [8.04, 35.98], [8.02, 35.98], [8, 35.98], [8.02, 35.96], [8, 35.96], [7.98, 35.96], [7.98, 35.94], [7.96, 35.94], [7.96, 35.92], [7.96, 35.94], [7.94, 35.94], [7.94, 35.92], [7.92, 35.92], [7.92, 35.9], [7.92, 35.92], [7.92, 35.9], [7.9, 35.9], [7.9, 35.88], [7.88, 35.88], [7.88, 35.9], [7.86, 35.88], [7.84, 35.9], [7.82, 35.9], [7.82, 35.88], [7.82, 35.9], [7.8, 35.9], [7.8, 35.92], [7.78, 35.92], [7.78, 35.94], [7.76, 35.92], [7.76, 35.94], [7.74, 35.94], [7.72, 35.94], [7.72, 35.92], [7.72, 35.9], [7.72, 35.88], [7.74, 35.88], [7.76, 35.88], [7.76, 35.86], [7.76, 35.84], [7.78, 35.84], [7.78, 35.82], [7.78, 35.8], [7.76, 35.8], [7.78, 35.8], [7.78, 35.78], [7.8, 35.78], [7.8, 35.76], [7.82, 35.76], [7.84, 35.76], [7.84, 35.74], [7.82, 35.74], [7.8, 35.74], [7.82, 35.74], [7.82, 35.72], [7.82, 35.7], [7.82, 35.68], [7.82, 35.66], [7.82, 35.64], [7.84, 35.64], [7.84, 35.62], [7.86, 35.62], [7.86, 35.6], [7.84, 35.6], [7.84, 35.58], [7.82, 35.58], [7.82, 35.56], [7.8, 35.56], [7.8, 35.58], [7.78, 35.58], [7.76, 35.58], [7.76, 35.56], [7.74, 35.56], [7.72, 35.56], [7.72, 35.54], [7.7, 35.54], [7.68, 35.54], [7.66, 35.54], [7.66, 35.52], [7.66, 35.5], [7.64, 35.5], [7.64, 35.48], [7.62, 35.48], [7.62, 35.46], [7.6, 35.46], [7.6, 35.44], [7.58, 35.44], [7.58, 35.42], [7.56, 35.42], [7.54, 35.42], [7.52, 35.42], [7.5, 35.42], [7.48, 35.42], [7.48, 35.4], [7.46, 35.4], [7.44, 35.4], [7.42, 35.4], [7.4, 35.4], [7.4, 35.38], [7.4, 35.36], [7.42, 35.36], [7.4, 35.36], [7.42, 35.36], [7.42, 35.34], [7.4, 35.34], [7.4, 35.32], [7.4, 35.3], [7.4, 35.28], [7.42, 35.28], [7.44, 35.28], [7.42, 35.28], [7.42, 35.26], [7.4, 35.26], [7.4, 35.24], [7.38, 35.24], [7.4, 35.24], [7.4, 35.22], [7.4, 35.2], [7.42, 35.2], [7.42, 35.18], [7.44, 35.18], [7.44, 35.16], [7.42, 35.16], [7.42, 35.14], [7.4, 35.12], [7.4, 35.1], [7.38, 35.1], [7.38, 35.08], [7.36, 35.08], [7.34, 35.08], [7.34, 35.06], [7.32, 35.06], [7.3, 35.06], [7.3, 35.04], [7.3, 35.02], [7.28, 35.02], [7.28, 35], [7.26, 35], [7.26, 34.98], [7.24, 34.96], [7.24, 34.94], [7.24, 34.92], [7.24, 34.9], [7.22, 34.9]]] } }, { type: "Feature", properties: { code: 13, fr: "Tlemcen", ar: "\u062A\u0644\u0645\u0633\u0627\u0646", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[-2.22, 35.04], [-2.2, 35.04], [-2.18, 35.04], [-2.18, 35.02], [-2.18, 35], [-2.16, 35], [-2.14, 35], [-2.12, 35], [-2.12, 34.98], [-2.1, 34.98], [-2.12, 34.98], [-2.1, 34.98], [-2.1, 34.96], [-2.08, 34.96], [-2.08, 34.94], [-2.06, 34.94], [-2.04, 34.94], [-2.04, 34.92], [-2.02, 34.92], [-2.02, 34.94], [-2, 34.94], [-2, 34.92], [-2, 34.94], [-1.98, 34.94], [-1.98, 34.92], [-1.98, 34.9], [-1.98, 34.88], [-1.96, 34.88], [-1.96, 34.86], [-1.94, 34.86], [-1.92, 34.86], [-1.92, 34.84], [-1.9, 34.84], [-1.9, 34.82], [-1.88, 34.82], [-1.88, 34.8], [-1.86, 34.8], [-1.84, 34.8], [-1.84, 34.78], [-1.82, 34.78], [-1.8, 34.78], [-1.8, 34.76], [-1.78, 34.76], [-1.76, 34.76], [-1.76, 34.74], [-1.74, 34.74], [-1.76, 34.74], [-1.76, 34.72], [-1.78, 34.72], [-1.78, 34.7], [-1.78, 34.68], [-1.8, 34.68], [-1.8, 34.66], [-1.82, 34.66], [-1.82, 34.64], [-1.84, 34.64], [-1.84, 34.62], [-1.86, 34.62], [-1.84, 34.62], [-1.82, 34.62], [-1.82, 34.6], [-1.82, 34.62], [-1.82, 34.6], [-1.8, 34.6], [-1.8, 34.58], [-1.78, 34.58], [-1.78, 34.56], [-1.8, 34.56], [-1.78, 34.56], [-1.78, 34.54], [-1.76, 34.54], [-1.76, 34.52], [-1.74, 34.52], [-1.74, 34.5], [-1.72, 34.5], [-1.7, 34.5], [-1.68, 34.5], [-1.7, 34.48], [-1.72, 34.46], [-1.74, 34.44], [-1.76, 34.42], [-1.78, 34.4], [-1.78, 34.38], [-1.76, 34.38], [-1.76, 34.36], [-1.74, 34.36], [-1.74, 34.34], [-1.72, 34.34], [-1.72, 34.32], [-1.7, 34.32], [-1.7, 34.3], [-1.72, 34.28], [-1.7, 34.28], [-1.7, 34.26], [-1.72, 34.26], [-1.7, 34.26], [-1.7, 34.24], [-1.7, 34.22], [-1.7, 34.2], [-1.68, 34.18], [-1.68, 34.16], [-1.66, 34.14], [-1.66, 34.12], [-1.64, 34.12], [-1.64, 34.1], [-1.66, 34.1], [-1.64, 34.1], [-1.62, 34.12], [-1.6, 34.12], [-1.6, 34.14], [-1.58, 34.14], [-1.56, 34.14], [-1.56, 34.16], [-1.54, 34.16], [-1.52, 34.16], [-1.52, 34.18], [-1.5, 34.18], [-1.5, 34.2], [-1.48, 34.2], [-1.46, 34.2], [-1.44, 34.2], [-1.42, 34.2], [-1.4, 34.2], [-1.38, 34.2], [-1.36, 34.2], [-1.34, 34.2], [-1.32, 34.22], [-1.3, 34.22], [-1.3, 34.2], [-1.28, 34.2], [-1.26, 34.2], [-1.24, 34.2], [-1.24, 34.22], [-1.22, 34.22], [-1.22, 34.24], [-1.2, 34.24], [-1.2, 34.26], [-1.18, 34.26], [-1.16, 34.26], [-1.14, 34.28], [-1.12, 34.28], [-1.12, 34.3], [-1.1, 34.3], [-1.1, 34.32], [-1.08, 34.32], [-1.08, 34.34], [-1.06, 34.34], [-1.06, 34.36], [-1.04, 34.36], [-1.04, 34.38], [-1.02, 34.38], [-1, 34.38], [-1, 34.4], [-0.98, 34.4], [-0.96, 34.4], [-0.96, 34.42], [-0.94, 34.42], [-0.94, 34.44], [-0.92, 34.44], [-0.9, 34.44], [-0.9, 34.46], [-0.9, 34.48], [-0.88, 34.48], [-0.86, 34.48], [-0.86, 34.5], [-0.84, 34.5], [-0.86, 34.5], [-0.86, 34.52], [-0.86, 34.54], [-0.88, 34.54], [-0.9, 34.54], [-0.9, 34.56], [-0.88, 34.56], [-0.86, 34.56], [-0.86, 34.58], [-0.84, 34.58], [-0.82, 34.58], [-0.82, 34.6], [-0.82, 34.62], [-0.8, 34.62], [-0.8, 34.64], [-0.8, 34.66], [-0.78, 34.66], [-0.78, 34.68], [-0.78, 34.7], [-0.78, 34.72], [-0.76, 34.72], [-0.76, 34.74], [-0.78, 34.74], [-0.78, 34.76], [-0.78, 34.74], [-0.8, 34.74], [-0.82, 34.74], [-0.84, 34.74], [-0.86, 34.74], [-0.88, 34.74], [-0.88, 34.76], [-0.9, 34.76], [-0.9, 34.78], [-0.88, 34.78], [-0.88, 34.8], [-0.88, 34.82], [-0.88, 34.84], [-0.88, 34.86], [-0.86, 34.86], [-0.88, 34.86], [-0.88, 34.88], [-0.9, 34.88], [-0.9, 34.86], [-0.92, 34.86], [-0.92, 34.88], [-0.9, 34.88], [-0.9, 34.9], [-0.92, 34.9], [-0.92, 34.92], [-0.92, 34.9], [-0.94, 34.9], [-0.96, 34.9], [-0.96, 34.92], [-0.94, 34.92], [-0.94, 34.94], [-0.96, 34.94], [-0.96, 34.96], [-0.98, 34.96], [-0.98, 34.98], [-0.96, 34.98], [-0.94, 34.98], [-0.94, 35], [-0.94, 35.02], [-0.92, 35.02], [-0.92, 35.04], [-0.92, 35.06], [-0.94, 35.06], [-0.94, 35.08], [-0.96, 35.08], [-0.98, 35.08], [-1, 35.08], [-1, 35.1], [-1.02, 35.1], [-1.02, 35.08], [-1.02, 35.1], [-1.04, 35.1], [-1.04, 35.12], [-1.06, 35.12], [-1.08, 35.12], [-1.08, 35.14], [-1.1, 35.14], [-1.12, 35.14], [-1.14, 35.14], [-1.14, 35.16], [-1.12, 35.16], [-1.14, 35.16], [-1.12, 35.16], [-1.14, 35.16], [-1.16, 35.16], [-1.18, 35.16], [-1.18, 35.18], [-1.2, 35.18], [-1.2, 35.16], [-1.2, 35.18], [-1.22, 35.18], [-1.22, 35.2], [-1.22, 35.18], [-1.24, 35.18], [-1.24, 35.2], [-1.26, 35.2], [-1.24, 35.2], [-1.26, 35.2], [-1.28, 35.2], [-1.3, 35.2], [-1.3, 35.18], [-1.3, 35.2], [-1.32, 35.2], [-1.34, 35.2], [-1.36, 35.2], [-1.36, 35.22], [-1.38, 35.22], [-1.38, 35.2], [-1.4, 35.2], [-1.42, 35.22], [-1.42, 35.2], [-1.44, 35.2], [-1.44, 35.18], [-1.46, 35.18], [-1.44, 35.18], [-1.44, 35.16], [-1.46, 35.16], [-1.48, 35.16], [-1.5, 35.16], [-1.52, 35.16], [-1.52, 35.18], [-1.54, 35.18], [-1.52, 35.18], [-1.54, 35.18], [-1.56, 35.18], [-1.56, 35.2], [-1.54, 35.2], [-1.54, 35.22], [-1.56, 35.22], [-1.58, 35.22], [-1.58, 35.24], [-1.6, 35.24], [-1.6, 35.22], [-1.62, 35.22], [-1.6, 35.22], [-1.62, 35.22], [-1.64, 35.22], [-1.62, 35.22], [-1.64, 35.22], [-1.64, 35.2], [-1.64, 35.18], [-1.66, 35.18], [-1.68, 35.18], [-1.7, 35.18], [-1.7, 35.16], [-1.7, 35.18], [-1.7, 35.16], [-1.72, 35.16], [-1.74, 35.16], [-1.74, 35.14], [-1.76, 35.14], [-1.76, 35.12], [-1.78, 35.12], [-1.76, 35.12], [-1.78, 35.12], [-1.8, 35.12], [-1.8, 35.14], [-1.8, 35.12], [-1.82, 35.12], [-1.84, 35.12], [-1.84, 35.1], [-1.84, 35.12], [-1.84, 35.1], [-1.86, 35.1], [-1.88, 35.1], [-1.86, 35.1], [-1.88, 35.1], [-1.9, 35.1], [-1.9, 35.08], [-1.92, 35.08], [-1.94, 35.08], [-1.96, 35.08], [-1.98, 35.08], [-2, 35.08], [-2.02, 35.08], [-2.04, 35.08], [-2.06, 35.08], [-2.08, 35.08], [-2.1, 35.08], [-2.12, 35.08], [-2.12, 35.1], [-2.14, 35.1], [-2.16, 35.1], [-2.18, 35.1], [-2.16, 35.1], [-2.18, 35.1], [-2.16, 35.1], [-2.18, 35.1], [-2.18, 35.08], [-2.18, 35.1], [-2.18, 35.08], [-2.18, 35.1], [-2.18, 35.08], [-2.2, 35.08], [-2.22, 35.08], [-2.22, 35.06], [-2.22, 35.04]]] } }, { type: "Feature", properties: { code: 14, fr: "Tiaret", ar: "\u062A\u064A\u0627\u0631\u062A", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[0.48, 35.1], [0.5, 35.1], [0.52, 35.1], [0.54, 35.1], [0.56, 35.1], [0.58, 35.1], [0.58, 35.12], [0.58, 35.1], [0.6, 35.1], [0.62, 35.1], [0.62, 35.12], [0.64, 35.12], [0.64, 35.1], [0.66, 35.1], [0.66, 35.08], [0.66, 35.06], [0.68, 35.06], [0.7, 35.06], [0.72, 35.06], [0.72, 35.04], [0.74, 35.04], [0.74, 35.02], [0.76, 35.02], [0.76, 35], [0.78, 35], [0.78, 34.98], [0.78, 34.96], [0.8, 34.96], [0.78, 34.96], [0.78, 34.94], [0.76, 34.94], [0.76, 34.92], [0.74, 34.92], [0.74, 34.9], [0.72, 34.9], [0.68, 34.88], [0.66, 34.86], [0.66, 34.84], [0.68, 34.84], [0.68, 34.82], [0.66, 34.82], [0.66, 34.8], [0.66, 34.78], [0.66, 34.76], [0.66, 34.74], [0.68, 34.74], [0.68, 34.72], [0.7, 34.72], [0.7, 34.7], [0.72, 34.68], [0.72, 34.66], [0.74, 34.66], [0.74, 34.64], [0.76, 34.66], [0.78, 34.66], [0.8, 34.66], [0.8, 34.64], [0.8, 34.62], [0.82, 34.62], [0.8, 34.62], [0.78, 34.6], [0.78, 34.58], [0.8, 34.58], [0.82, 34.56], [0.84, 34.56], [0.86, 34.56], [0.88, 34.56], [0.88, 34.54], [0.9, 34.54], [0.94, 34.52], [0.92, 34.52], [0.9, 34.48], [0.86, 34.42], [0.88, 34.42], [0.9, 34.4], [0.92, 34.4], [0.94, 34.4], [0.96, 34.4], [1, 34.4], [1.04, 34.38], [1.04, 34.36], [1.04, 34.34], [1.04, 34.32], [1.04, 34.3], [1.02, 34.3], [1.02, 34.28], [1.02, 34.26], [1.02, 34.24], [1.02, 34.22], [1.02, 34.2], [1.04, 34.2], [1.06, 34.2], [1.08, 34.2], [1.1, 34.2], [1.12, 34.2], [1.14, 34.2], [1.16, 34.2], [1.18, 34.2], [1.2, 34.2], [1.22, 34.2], [1.24, 34.2], [1.26, 34.2], [1.28, 34.2], [1.28, 34.18], [1.26, 34.18], [1.28, 34.18], [1.26, 34.18], [1.28, 34.18], [1.28, 34.16], [1.28, 34.14], [1.3, 34.14], [1.3, 34.12], [1.32, 34.12], [1.32, 34.1], [1.32, 34.08], [1.34, 34.08], [1.36, 34.08], [1.38, 34.1], [1.4, 34.1], [1.4, 34.12], [1.42, 34.12], [1.44, 34.12], [1.44, 34.14], [1.42, 34.14], [1.42, 34.16], [1.4, 34.16], [1.4, 34.18], [1.42, 34.18], [1.42, 34.2], [1.44, 34.2], [1.46, 34.2], [1.48, 34.2], [1.48, 34.22], [1.5, 34.22], [1.52, 34.22], [1.52, 34.24], [1.54, 34.24], [1.54, 34.26], [1.56, 34.26], [1.58, 34.26], [1.58, 34.24], [1.58, 34.22], [1.6, 34.22], [1.6, 34.24], [1.62, 34.24], [1.64, 34.24], [1.64, 34.26], [1.66, 34.26], [1.66, 34.28], [1.68, 34.28], [1.68, 34.3], [1.68, 34.32], [1.68, 34.34], [1.68, 34.36], [1.7, 34.36], [1.7, 34.38], [1.72, 34.4], [1.74, 34.4], [1.74, 34.42], [1.76, 34.42], [1.76, 34.44], [1.78, 34.44], [1.78, 34.46], [1.8, 34.46], [1.82, 34.46], [1.84, 34.46], [1.86, 34.46], [1.86, 34.48], [1.88, 34.48], [1.9, 34.48], [1.92, 34.48], [1.94, 34.48], [1.94, 34.5], [1.96, 34.5], [1.98, 34.5], [2, 34.5], [2, 34.52], [2.02, 34.52], [2.02, 34.54], [2.04, 34.56], [2.06, 34.56], [2.08, 34.58], [2.08, 34.6], [2.12, 34.6], [2.12, 34.62], [2.14, 34.62], [2.16, 34.62], [2.18, 34.62], [2.18, 34.64], [2.2, 34.64], [2.2, 34.66], [2.22, 34.66], [2.22, 34.68], [2.24, 34.68], [2.26, 34.68], [2.28, 34.68], [2.3, 34.68], [2.32, 34.7], [2.34, 34.7], [2.36, 34.7], [2.38, 34.7], [2.38, 34.72], [2.36, 34.72], [2.36, 34.74], [2.36, 34.76], [2.36, 34.78], [2.4, 34.8], [2.42, 34.8], [2.44, 34.82], [2.44, 34.84], [2.46, 34.84], [2.46, 34.86], [2.46, 34.88], [2.48, 34.88], [2.48, 34.9], [2.48, 34.92], [2.48, 34.94], [2.48, 34.96], [2.5, 34.96], [2.5, 34.98], [2.5, 35], [2.52, 35], [2.54, 35], [2.56, 35], [2.58, 35], [2.6, 35], [2.6, 35.02], [2.62, 35.02], [2.64, 35.04], [2.66, 35.04], [2.64, 35.04], [2.62, 35.06], [2.6, 35.08], [2.58, 35.08], [2.58, 35.1], [2.6, 35.1], [2.6, 35.12], [2.62, 35.12], [2.62, 35.14], [2.62, 35.16], [2.64, 35.16], [2.64, 35.18], [2.66, 35.18], [2.66, 35.2], [2.66, 35.22], [2.66, 35.24], [2.68, 35.24], [2.66, 35.24], [2.64, 35.24], [2.62, 35.24], [2.6, 35.24], [2.6, 35.26], [2.58, 35.26], [2.58, 35.28], [2.56, 35.28], [2.58, 35.28], [2.58, 35.3], [2.56, 35.3], [2.56, 35.32], [2.54, 35.32], [2.54, 35.34], [2.52, 35.34], [2.52, 35.32], [2.5, 35.32], [2.5, 35.3], [2.5, 35.32], [2.48, 35.32], [2.48, 35.3], [2.46, 35.3], [2.46, 35.28], [2.44, 35.28], [2.42, 35.28], [2.42, 35.26], [2.4, 35.26], [2.4, 35.24], [2.4, 35.26], [2.38, 35.26], [2.38, 35.28], [2.36, 35.28], [2.36, 35.3], [2.36, 35.32], [2.34, 35.32], [2.32, 35.32], [2.3, 35.32], [2.3, 35.34], [2.28, 35.34], [2.26, 35.34], [2.26, 35.36], [2.24, 35.36], [2.22, 35.36], [2.22, 35.38], [2.2, 35.38], [2.18, 35.38], [2.18, 35.4], [2.16, 35.4], [2.14, 35.4], [2.14, 35.42], [2.12, 35.42], [2.12, 35.44], [2.1, 35.44], [2.08, 35.44], [2.08, 35.46], [2.06, 35.46], [2.04, 35.46], [2.04, 35.48], [2.02, 35.48], [2.02, 35.5], [2.02, 35.52], [2.02, 35.54], [2.04, 35.54], [2.06, 35.54], [2.08, 35.54], [2.08, 35.56], [2.08, 35.58], [2.06, 35.58], [2.04, 35.58], [2.02, 35.58], [2, 35.58], [2.02, 35.58], [2.02, 35.6], [2.04, 35.6], [2.02, 35.6], [2, 35.6], [1.98, 35.6], [1.98, 35.58], [1.98, 35.56], [1.96, 35.56], [1.94, 35.56], [1.92, 35.56], [1.9, 35.56], [1.88, 35.56], [1.86, 35.56], [1.86, 35.54], [1.84, 35.54], [1.84, 35.56], [1.84, 35.54], [1.84, 35.56], [1.82, 35.56], [1.82, 35.54], [1.82, 35.56], [1.8, 35.56], [1.78, 35.56], [1.76, 35.56], [1.74, 35.56], [1.74, 35.54], [1.72, 35.54], [1.72, 35.56], [1.72, 35.58], [1.7, 35.58], [1.7, 35.56], [1.7, 35.54], [1.68, 35.54], [1.66, 35.54], [1.64, 35.54], [1.64, 35.56], [1.62, 35.56], [1.62, 35.58], [1.6, 35.58], [1.6, 35.6], [1.6, 35.62], [1.58, 35.62], [1.58, 35.6], [1.58, 35.62], [1.58, 35.6], [1.58, 35.62], [1.56, 35.62], [1.56, 35.6], [1.56, 35.62], [1.56, 35.6], [1.54, 35.6], [1.52, 35.6], [1.5, 35.6], [1.5, 35.62], [1.5, 35.64], [1.5, 35.66], [1.48, 35.66], [1.48, 35.68], [1.46, 35.68], [1.46, 35.66], [1.46, 35.68], [1.44, 35.68], [1.44, 35.66], [1.44, 35.68], [1.42, 35.68], [1.4, 35.68], [1.38, 35.68], [1.38, 35.7], [1.36, 35.7], [1.36, 35.72], [1.36, 35.7], [1.36, 35.72], [1.34, 35.72], [1.34, 35.7], [1.34, 35.68], [1.34, 35.66], [1.34, 35.64], [1.34, 35.62], [1.32, 35.62], [1.3, 35.64], [1.3, 35.62], [1.28, 35.64], [1.28, 35.66], [1.26, 35.66], [1.26, 35.68], [1.24, 35.68], [1.22, 35.68], [1.22, 35.66], [1.2, 35.66], [1.18, 35.66], [1.18, 35.64], [1.16, 35.64], [1.16, 35.62], [1.14, 35.62], [1.12, 35.62], [1.12, 35.64], [1.12, 35.62], [1.1, 35.62], [1.08, 35.62], [1.08, 35.64], [1.06, 35.64], [1.06, 35.62], [1.06, 35.6], [1.04, 35.6], [1.02, 35.6], [1.02, 35.58], [1.02, 35.56], [1, 35.56], [1, 35.58], [0.98, 35.58], [0.98, 35.56], [0.96, 35.56], [0.96, 35.54], [0.94, 35.54], [0.96, 35.54], [0.94, 35.54], [0.92, 35.54], [0.92, 35.52], [0.9, 35.52], [0.92, 35.52], [0.9, 35.52], [0.92, 35.52], [0.9, 35.52], [0.9, 35.5], [0.9, 35.48], [0.88, 35.48], [0.88, 35.46], [0.88, 35.44], [0.86, 35.44], [0.86, 35.46], [0.84, 35.46], [0.86, 35.46], [0.84, 35.46], [0.84, 35.44], [0.84, 35.42], [0.86, 35.42], [0.88, 35.42], [0.88, 35.4], [0.9, 35.4], [0.9, 35.38], [0.88, 35.38], [0.86, 35.38], [0.86, 35.36], [0.86, 35.34], [0.86, 35.32], [0.84, 35.32], [0.84, 35.3], [0.82, 35.3], [0.84, 35.3], [0.82, 35.3], [0.82, 35.28], [0.8, 35.28], [0.78, 35.28], [0.78, 35.3], [0.78, 35.28], [0.76, 35.28], [0.74, 35.28], [0.74, 35.3], [0.72, 35.3], [0.7, 35.3], [0.68, 35.3], [0.68, 35.32], [0.68, 35.3], [0.66, 35.3], [0.64, 35.3], [0.64, 35.28], [0.62, 35.28], [0.64, 35.28], [0.62, 35.28], [0.62, 35.26], [0.64, 35.26], [0.62, 35.26], [0.6, 35.26], [0.6, 35.24], [0.6, 35.22], [0.6, 35.2], [0.6, 35.22], [0.6, 35.2], [0.6, 35.22], [0.6, 35.2], [0.58, 35.2], [0.58, 35.18], [0.58, 35.2], [0.58, 35.18], [0.56, 35.18], [0.54, 35.18], [0.54, 35.16], [0.52, 35.16], [0.52, 35.14], [0.5, 35.12], [0.48, 35.1]]] } }, { type: "Feature", properties: { code: 15, fr: "Tizi Ouzou", ar: "\u062A\u064A\u0632\u064A \u0648\u0632\u0648", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[3.72, 36.64], [3.72, 36.62], [3.74, 36.62], [3.74, 36.6], [3.74, 36.58], [3.72, 36.58], [3.72, 36.56], [3.74, 36.56], [3.76, 36.56], [3.76, 36.54], [3.78, 36.54], [3.8, 36.54], [3.78, 36.54], [3.8, 36.54], [3.8, 36.52], [3.82, 36.52], [3.82, 36.5], [3.82, 36.48], [3.84, 36.48], [3.86, 36.48], [3.86, 36.46], [3.88, 36.46], [3.88, 36.48], [3.88, 36.46], [3.9, 36.46], [3.92, 36.46], [3.94, 36.46], [3.96, 36.46], [3.98, 36.46], [4, 36.46], [4.02, 36.46], [4.04, 36.46], [4.06, 36.46], [4.08, 36.46], [4.1, 36.46], [4.12, 36.46], [4.14, 36.46], [4.16, 36.46], [4.18, 36.46], [4.2, 36.46], [4.2, 36.48], [4.22, 36.48], [4.24, 36.48], [4.24, 36.46], [4.26, 36.46], [4.28, 36.46], [4.3, 36.46], [4.32, 36.46], [4.34, 36.46], [4.34, 36.48], [4.36, 36.48], [4.36, 36.46], [4.36, 36.48], [4.38, 36.48], [4.4, 36.48], [4.42, 36.48], [4.42, 36.5], [4.44, 36.5], [4.46, 36.5], [4.46, 36.52], [4.46, 36.54], [4.48, 36.54], [4.5, 36.54], [4.52, 36.54], [4.52, 36.56], [4.54, 36.56], [4.54, 36.58], [4.56, 36.58], [4.56, 36.6], [4.54, 36.6], [4.54, 36.62], [4.56, 36.62], [4.56, 36.64], [4.58, 36.64], [4.58, 36.66], [4.6, 36.66], [4.6, 36.68], [4.6, 36.7], [4.58, 36.7], [4.56, 36.7], [4.54, 36.7], [4.54, 36.72], [4.52, 36.72], [4.52, 36.74], [4.54, 36.74], [4.56, 36.74], [4.58, 36.74], [4.58, 36.76], [4.58, 36.74], [4.58, 36.76], [4.6, 36.76], [4.6, 36.74], [4.62, 36.74], [4.64, 36.74], [4.64, 36.76], [4.66, 36.76], [4.64, 36.76], [4.64, 36.78], [4.64, 36.8], [4.66, 36.8], [4.64, 36.8], [4.64, 36.82], [4.62, 36.82], [4.62, 36.84], [4.6, 36.84], [4.6, 36.86], [4.6, 36.88], [4.58, 36.88], [4.6, 36.88], [4.58, 36.88], [4.56, 36.88], [4.54, 36.88], [4.52, 36.88], [4.5, 36.88], [4.5, 36.9], [4.48, 36.9], [4.46, 36.9], [4.44, 36.9], [4.44, 36.92], [4.44, 36.9], [4.44, 36.92], [4.42, 36.92], [4.42, 36.9], [4.42, 36.92], [4.42, 36.9], [4.4, 36.9], [4.38, 36.9], [4.38, 36.88], [4.38, 36.9], [4.36, 36.9], [4.34, 36.9], [4.32, 36.9], [4.3, 36.9], [4.28, 36.9], [4.26, 36.9], [4.24, 36.9], [4.22, 36.9], [4.2, 36.9], [4.18, 36.9], [4.16, 36.9], [4.14, 36.9], [4.12, 36.9], [4.1, 36.88], [4.1, 36.9], [4.08, 36.9], [4.06, 36.9], [4.04, 36.9], [4.04, 36.88], [4.04, 36.86], [4.04, 36.84], [4.02, 36.84], [4.02, 36.82], [4, 36.82], [4, 36.8], [3.98, 36.8], [3.98, 36.78], [3.96, 36.78], [3.94, 36.78], [3.94, 36.76], [3.92, 36.76], [3.92, 36.78], [3.92, 36.76], [3.9, 36.76], [3.9, 36.78], [3.88, 36.78], [3.88, 36.76], [3.86, 36.76], [3.86, 36.74], [3.86, 36.72], [3.84, 36.72], [3.84, 36.7], [3.86, 36.7], [3.86, 36.68], [3.88, 36.68], [3.86, 36.68], [3.84, 36.68], [3.82, 36.68], [3.82, 36.66], [3.82, 36.64], [3.8, 36.64], [3.78, 36.64], [3.8, 36.64], [3.8, 36.66], [3.78, 36.66], [3.78, 36.64], [3.76, 36.64], [3.76, 36.66], [3.76, 36.64], [3.74, 36.64], [3.74, 36.66], [3.74, 36.64], [3.74, 36.66], [3.74, 36.64], [3.72, 36.64]]] } }, { type: "Feature", properties: { code: 16, fr: "Alger", ar: "\u0627\u0644\u062C\u0632\u0627\u0626\u0631", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "MultiPolygon", coordinates: [[[[2.8, 36.66], [2.8, 36.64], [2.82, 36.64], [2.8, 36.64], [2.82, 36.64], [2.84, 36.64], [2.86, 36.64], [2.88, 36.64], [2.88, 36.62], [2.9, 36.62], [2.9, 36.6], [2.92, 36.6], [2.94, 36.6], [2.96, 36.62], [2.96, 36.6], [2.96, 36.58], [2.96, 36.6], [2.98, 36.6], [2.98, 36.58], [3, 36.58], [3, 36.6], [3.02, 36.6], [3.04, 36.6], [3.02, 36.6], [3.04, 36.62], [3.06, 36.62], [3.06, 36.6], [3.06, 36.58], [3.08, 36.58], [3.08, 36.6], [3.1, 36.6], [3.1, 36.58], [3.12, 36.58], [3.12, 36.6], [3.14, 36.6], [3.12, 36.6], [3.12, 36.62], [3.14, 36.62], [3.14, 36.64], [3.14, 36.66], [3.16, 36.66], [3.16, 36.64], [3.18, 36.64], [3.18, 36.66], [3.2, 36.66], [3.2, 36.68], [3.22, 36.66], [3.24, 36.68], [3.26, 36.68], [3.26, 36.7], [3.26, 36.72], [3.26, 36.7], [3.28, 36.7], [3.3, 36.7], [3.3, 36.72], [3.32, 36.72], [3.34, 36.72], [3.36, 36.72], [3.38, 36.72], [3.38, 36.74], [3.38, 36.76], [3.36, 36.76], [3.34, 36.76], [3.36, 36.76], [3.36, 36.78], [3.34, 36.78], [3.32, 36.78], [3.32, 36.8], [3.3, 36.8], [3.32, 36.8], [3.3, 36.78], [3.3, 36.8], [3.28, 36.8], [3.26, 36.8], [3.26, 36.82], [3.24, 36.82], [3.22, 36.82], [3.22, 36.8], [3.24, 36.8], [3.22, 36.8], [3.24, 36.8], [3.22, 36.8], [3.24, 36.8], [3.24, 36.78], [3.22, 36.78], [3.22, 36.76], [3.2, 36.76], [3.2, 36.74], [3.18, 36.74], [3.18, 36.76], [3.18, 36.74], [3.16, 36.74], [3.14, 36.74], [3.16, 36.74], [3.14, 36.74], [3.12, 36.74], [3.1, 36.74], [3.1, 36.76], [3.1, 36.74], [3.08, 36.74], [3.08, 36.76], [3.08, 36.74], [3.08, 36.76], [3.06, 36.76], [3.06, 36.78], [3.08, 36.78], [3.06, 36.78], [3.06, 36.8], [3.04, 36.8], [3.04, 36.82], [3.04, 36.8], [3.04, 36.82], [3.04, 36.8], [3.04, 36.82], [3.04, 36.8], [3.04, 36.82], [3.04, 36.8], [3.04, 36.82], [3.04, 36.8], [3.04, 36.82], [3.04, 36.8], [3.04, 36.82], [3.04, 36.8], [3.04, 36.82], [3.02, 36.82], [3.04, 36.82], [3.02, 36.82], [3, 36.82], [2.98, 36.82], [2.96, 36.82], [2.94, 36.82], [2.94, 36.8], [2.92, 36.8], [2.9, 36.8], [2.9, 36.78], [2.88, 36.78], [2.88, 36.76], [2.86, 36.76], [2.84, 36.76], [2.84, 36.74], [2.84, 36.76], [2.84, 36.74], [2.84, 36.72], [2.84, 36.74], [2.84, 36.72], [2.82, 36.72], [2.82, 36.7], [2.8, 36.7], [2.8, 36.68], [2.82, 36.68], [2.82, 36.66], [2.8, 36.66]]], [[[3.06, 36.78], [3.06, 36.76], [3.08, 36.76], [3.06, 36.76], [3.06, 36.78], [3.08, 36.78], [3.06, 36.78]]]] } }, { type: "Feature", properties: { code: 17, fr: "Djelfa", ar: "\u0627\u0644\u062C\u0644\u0641\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[2.02, 35.5], [2.02, 35.48], [2.04, 35.48], [2.04, 35.46], [2.06, 35.46], [2.08, 35.46], [2.08, 35.44], [2.1, 35.44], [2.12, 35.44], [2.12, 35.42], [2.14, 35.42], [2.14, 35.4], [2.16, 35.4], [2.18, 35.4], [2.18, 35.38], [2.2, 35.38], [2.22, 35.38], [2.22, 35.36], [2.24, 35.36], [2.26, 35.36], [2.26, 35.34], [2.28, 35.34], [2.3, 35.34], [2.3, 35.32], [2.32, 35.32], [2.34, 35.32], [2.36, 35.32], [2.36, 35.3], [2.36, 35.28], [2.38, 35.28], [2.38, 35.26], [2.4, 35.26], [2.4, 35.24], [2.4, 35.26], [2.42, 35.26], [2.42, 35.28], [2.44, 35.28], [2.46, 35.28], [2.46, 35.3], [2.48, 35.3], [2.48, 35.32], [2.5, 35.32], [2.5, 35.3], [2.5, 35.32], [2.52, 35.32], [2.52, 35.34], [2.54, 35.34], [2.54, 35.32], [2.56, 35.32], [2.56, 35.3], [2.58, 35.3], [2.58, 35.28], [2.56, 35.28], [2.58, 35.28], [2.58, 35.26], [2.6, 35.26], [2.6, 35.24], [2.62, 35.24], [2.64, 35.24], [2.66, 35.24], [2.68, 35.24], [2.66, 35.24], [2.66, 35.22], [2.66, 35.2], [2.66, 35.18], [2.64, 35.18], [2.64, 35.16], [2.62, 35.16], [2.62, 35.14], [2.62, 35.12], [2.6, 35.12], [2.6, 35.1], [2.58, 35.1], [2.58, 35.08], [2.6, 35.08], [2.62, 35.06], [2.64, 35.04], [2.66, 35.04], [2.64, 35.04], [2.62, 35.02], [2.6, 35.02], [2.6, 35], [2.58, 35], [2.56, 35], [2.54, 35], [2.52, 35], [2.5, 35], [2.5, 34.98], [2.5, 34.96], [2.48, 34.96], [2.48, 34.94], [2.48, 34.92], [2.48, 34.9], [2.48, 34.88], [2.46, 34.88], [2.46, 34.86], [2.46, 34.84], [2.44, 34.84], [2.44, 34.82], [2.42, 34.8], [2.4, 34.8], [2.36, 34.78], [2.36, 34.76], [2.36, 34.74], [2.36, 34.72], [2.38, 34.72], [2.38, 34.7], [2.36, 34.7], [2.36, 34.68], [2.36, 34.66], [2.36, 34.64], [2.36, 34.62], [2.38, 34.62], [2.38, 34.6], [2.38, 34.58], [2.38, 34.56], [2.38, 34.54], [2.38, 34.52], [2.4, 34.52], [2.4, 34.5], [2.4, 34.48], [2.4, 34.46], [2.4, 34.44], [2.4, 34.42], [2.42, 34.42], [2.42, 34.4], [2.42, 34.38], [2.44, 34.36], [2.44, 34.34], [2.44, 34.32], [2.46, 34.32], [2.44, 34.3], [2.46, 34.3], [2.46, 34.32], [2.48, 34.3], [2.48, 34.28], [2.5, 34.28], [2.5, 34.26], [2.5, 34.24], [2.52, 34.24], [2.54, 34.22], [2.54, 34.2], [2.56, 34.2], [2.56, 34.18], [2.58, 34.18], [2.58, 34.16], [2.6, 34.16], [2.6, 34.14], [2.62, 34.14], [2.62, 34.12], [2.64, 34.12], [2.66, 34.12], [2.68, 34.12], [2.7, 34.12], [2.72, 34.12], [2.74, 34.14], [2.76, 34.14], [2.78, 34.14], [2.78, 34.16], [2.8, 34.16], [2.8, 34.14], [2.82, 34.14], [2.82, 34.16], [2.8, 34.16], [2.82, 34.18], [2.8, 34.18], [2.82, 34.18], [2.82, 34.2], [2.84, 34.2], [2.84, 34.22], [2.84, 34.24], [2.86, 34.24], [2.86, 34.26], [2.88, 34.26], [2.9, 34.26], [2.9, 34.28], [2.92, 34.28], [2.94, 34.28], [2.96, 34.28], [2.96, 34.26], [2.98, 34.26], [3, 34.26], [2.98, 34.24], [3, 34.24], [3.02, 34.24], [3.04, 34.24], [3.04, 34.26], [3.06, 34.26], [3.06, 34.24], [3.06, 34.22], [3.06, 34.2], [3.08, 34.22], [3.08, 34.2], [3.1, 34.18], [3.1, 34.16], [3.1, 34.14], [3.08, 34.14], [3.08, 34.12], [3.1, 34.1], [3.12, 34.08], [3.12, 34.06], [3.12, 34.04], [3.14, 34.04], [3.14, 34.02], [3.14, 34], [3.16, 34], [3.14, 33.98], [3.14, 33.94], [3.16, 33.94], [3.16, 33.92], [3.18, 33.9], [3.18, 33.88], [3.18, 33.86], [3.22, 33.86], [3.22, 33.84], [3.22, 33.82], [3.24, 33.82], [3.26, 33.82], [3.28, 33.82], [3.3, 33.82], [3.32, 33.8], [3.34, 33.8], [3.36, 33.8], [3.38, 33.78], [3.4, 33.78], [3.44, 33.76], [3.46, 33.76], [3.56, 33.7], [3.6, 33.66], [3.6, 33.64], [3.62, 33.62], [3.64, 33.62], [3.72, 33.52], [3.76, 33.52], [3.8, 33.5], [3.86, 33.48], [3.9, 33.46], [3.94, 33.46], [4, 33.44], [4, 33.42], [4.08, 33.4], [4.1, 33.38], [4.16, 33.36], [4.2, 33.34], [4.22, 33.32], [4.34, 33.2], [4.36, 33.14], [4.42, 33.1], [4.42, 33.06], [4.44, 33.04], [4.48, 33], [4.48, 32.98], [4.6, 32.96], [4.78, 32.92], [4.94, 32.88], [4.98, 32.86], [5, 32.86], [5.02, 32.86], [5.02, 32.88], [5.02, 32.9], [5.02, 32.92], [5, 32.94], [5, 32.96], [5, 32.98], [5, 33], [4.98, 33.06], [4.96, 33.14], [4.94, 33.2], [4.94, 33.26], [4.94, 33.3], [4.96, 33.34], [4.98, 33.38], [5, 33.4], [5.02, 33.42], [5.04, 33.46], [5.04, 33.48], [5.06, 33.5], [5.06, 33.58], [5.08, 33.6], [5.02, 33.62], [5, 33.64], [4.98, 33.64], [4.96, 33.64], [4.94, 33.64], [4.94, 33.66], [4.92, 33.66], [4.9, 33.66], [4.9, 33.64], [4.88, 33.66], [4.88, 33.68], [4.86, 33.68], [4.86, 33.7], [4.84, 33.7], [4.8, 33.7], [4.76, 33.68], [4.76, 33.7], [4.76, 33.72], [4.74, 33.72], [4.72, 33.72], [4.72, 33.74], [4.7, 33.74], [4.68, 33.74], [4.66, 33.74], [4.64, 33.74], [4.62, 33.74], [4.6, 33.76], [4.6, 33.78], [4.58, 33.78], [4.58, 33.8], [4.56, 33.8], [4.56, 33.82], [4.54, 33.82], [4.52, 33.82], [4.5, 33.84], [4.48, 33.84], [4.46, 33.84], [4.44, 33.84], [4.42, 33.86], [4.4, 33.86], [4.38, 33.86], [4.38, 33.88], [4.36, 33.88], [4.36, 33.9], [4.34, 33.9], [4.32, 33.9], [4.3, 33.9], [4.28, 33.9], [4.28, 33.92], [4.26, 33.92], [4.24, 33.92], [4.24, 33.94], [4.22, 33.96], [4.24, 33.96], [4.24, 33.98], [4.26, 33.98], [4.26, 33.96], [4.26, 33.98], [4.28, 33.96], [4.3, 33.98], [4.32, 33.98], [4.32, 34], [4.34, 34], [4.34, 34.02], [4.36, 34.02], [4.38, 34.02], [4.38, 34.04], [4.4, 34.04], [4.42, 34.02], [4.44, 34.04], [4.4, 34.06], [4.38, 34.06], [4.34, 34.06], [4.32, 34.06], [4.3, 34.08], [4.28, 34.08], [4.28, 34.1], [4.28, 34.12], [4.3, 34.12], [4.28, 34.12], [4.28, 34.14], [4.26, 34.14], [4.24, 34.16], [4.2, 34.14], [4.18, 34.16], [4.18, 34.18], [4.16, 34.18], [4.14, 34.2], [4.16, 34.2], [4.18, 34.2], [4.18, 34.22], [4.16, 34.22], [4.14, 34.22], [4.14, 34.24], [4.12, 34.24], [4.12, 34.26], [4.1, 34.26], [4.12, 34.26], [4.12, 34.28], [4.1, 34.28], [4.1, 34.3], [4.08, 34.3], [4.06, 34.3], [4.06, 34.32], [4.04, 34.32], [4.02, 34.32], [4.02, 34.34], [4, 34.34], [3.98, 34.34], [3.98, 34.36], [3.98, 34.38], [3.98, 34.4], [3.98, 34.42], [3.98, 34.44], [3.92, 34.5], [3.9, 34.52], [3.9, 34.54], [3.92, 34.54], [3.92, 34.56], [3.92, 34.6], [3.9, 34.64], [3.9, 34.66], [3.9, 34.7], [3.9, 34.72], [3.9, 34.74], [3.9, 34.76], [3.82, 34.78], [3.8, 34.78], [3.78, 34.78], [3.76, 34.78], [3.74, 34.78], [3.72, 34.8], [3.7, 34.8], [3.66, 34.78], [3.64, 34.8], [3.64, 34.82], [3.62, 34.84], [3.64, 34.86], [3.62, 34.86], [3.6, 34.86], [3.56, 34.86], [3.58, 34.88], [3.58, 34.9], [3.58, 34.92], [3.56, 34.94], [3.58, 34.94], [3.58, 34.96], [3.58, 34.98], [3.56, 34.98], [3.56, 35], [3.54, 35.02], [3.58, 35.02], [3.6, 35.08], [3.58, 35.08], [3.56, 35.08], [3.56, 35.06], [3.54, 35.06], [3.52, 35.06], [3.52, 35.08], [3.5, 35.08], [3.5, 35.1], [3.5, 35.12], [3.48, 35.12], [3.48, 35.14], [3.48, 35.16], [3.46, 35.16], [3.46, 35.18], [3.48, 35.18], [3.48, 35.2], [3.5, 35.2], [3.52, 35.22], [3.54, 35.22], [3.54, 35.24], [3.56, 35.24], [3.58, 35.24], [3.58, 35.26], [3.6, 35.26], [3.6, 35.28], [3.62, 35.28], [3.64, 35.3], [3.66, 35.32], [3.66, 35.36], [3.64, 35.4], [3.66, 35.4], [3.68, 35.4], [3.68, 35.42], [3.68, 35.44], [3.68, 35.46], [3.7, 35.48], [3.68, 35.48], [3.68, 35.5], [3.68, 35.52], [3.66, 35.52], [3.64, 35.52], [3.64, 35.54], [3.62, 35.54], [3.6, 35.56], [3.58, 35.56], [3.58, 35.58], [3.56, 35.58], [3.54, 35.58], [3.54, 35.6], [3.52, 35.6], [3.52, 35.62], [3.5, 35.62], [3.48, 35.62], [3.48, 35.64], [3.46, 35.64], [3.46, 35.66], [3.44, 35.66], [3.44, 35.68], [3.42, 35.68], [3.4, 35.7], [3.38, 35.7], [3.38, 35.72], [3.38, 35.74], [3.38, 35.76], [3.36, 35.76], [3.34, 35.76], [3.32, 35.76], [3.3, 35.76], [3.3, 35.78], [3.28, 35.78], [3.28, 35.8], [3.28, 35.82], [3.26, 35.82], [3.26, 35.8], [3.24, 35.8], [3.24, 35.78], [3.22, 35.78], [3.24, 35.78], [3.22, 35.78], [3.22, 35.76], [3.24, 35.76], [3.22, 35.76], [3.22, 35.74], [3.24, 35.74], [3.22, 35.74], [3.24, 35.74], [3.22, 35.74], [3.2, 35.68], [3.18, 35.68], [3.16, 35.68], [3.14, 35.68], [3.08, 35.66], [3.06, 35.66], [3.06, 35.68], [3.04, 35.68], [3.04, 35.7], [3.04, 35.72], [3.06, 35.74], [3.04, 35.74], [3.02, 35.74], [3.02, 35.76], [3.02, 35.78], [3.02, 35.8], [3, 35.82], [3, 35.84], [2.98, 35.84], [2.98, 35.82], [2.98, 35.84], [2.98, 35.82], [2.96, 35.82], [2.94, 35.82], [2.94, 35.8], [2.92, 35.8], [2.9, 35.8], [2.9, 35.82], [2.88, 35.82], [2.88, 35.8], [2.86, 35.8], [2.88, 35.8], [2.86, 35.8], [2.86, 35.78], [2.88, 35.78], [2.88, 35.76], [2.88, 35.74], [2.88, 35.72], [2.88, 35.7], [2.9, 35.7], [2.9, 35.68], [2.9, 35.66], [2.88, 35.66], [2.9, 35.66], [2.9, 35.64], [2.88, 35.64], [2.88, 35.62], [2.9, 35.62], [2.9, 35.6], [2.88, 35.6], [2.88, 35.62], [2.86, 35.62], [2.86, 35.6], [2.86, 35.62], [2.84, 35.62], [2.84, 35.6], [2.82, 35.6], [2.82, 35.58], [2.8, 35.58], [2.78, 35.58], [2.78, 35.56], [2.76, 35.56], [2.76, 35.54], [2.74, 35.54], [2.72, 35.5], [2.72, 35.48], [2.7, 35.48], [2.7, 35.46], [2.68, 35.46], [2.66, 35.46], [2.66, 35.44], [2.64, 35.44], [2.62, 35.44], [2.62, 35.46], [2.6, 35.46], [2.58, 35.46], [2.58, 35.48], [2.56, 35.48], [2.54, 35.48], [2.54, 35.5], [2.52, 35.5], [2.52, 35.52], [2.52, 35.5], [2.5, 35.5], [2.5, 35.52], [2.48, 35.52], [2.48, 35.5], [2.46, 35.5], [2.44, 35.5], [2.44, 35.48], [2.42, 35.48], [2.4, 35.48], [2.4, 35.46], [2.38, 35.46], [2.36, 35.46], [2.34, 35.46], [2.32, 35.46], [2.3, 35.46], [2.28, 35.46], [2.28, 35.48], [2.28, 35.5], [2.26, 35.5], [2.26, 35.52], [2.26, 35.54], [2.26, 35.56], [2.24, 35.56], [2.22, 35.56], [2.2, 35.56], [2.18, 35.56], [2.16, 35.56], [2.14, 35.56], [2.12, 35.56], [2.12, 35.54], [2.1, 35.54], [2.08, 35.54], [2.06, 35.54], [2.04, 35.54], [2.02, 35.54], [2.02, 35.52], [2.02, 35.5]]] } }, { type: "Feature", properties: { code: 18, fr: "Jijel", ar: "\u062C\u064A\u062C\u0644", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[5.42, 36.64], [5.44, 36.64], [5.42, 36.62], [5.42, 36.6], [5.44, 36.6], [5.46, 36.6], [5.48, 36.6], [5.5, 36.6], [5.5, 36.58], [5.52, 36.58], [5.52, 36.56], [5.52, 36.54], [5.5, 36.54], [5.52, 36.54], [5.5, 36.54], [5.52, 36.54], [5.52, 36.52], [5.54, 36.52], [5.56, 36.52], [5.58, 36.52], [5.58, 36.54], [5.6, 36.54], [5.58, 36.54], [5.6, 36.54], [5.62, 36.54], [5.62, 36.56], [5.62, 36.54], [5.64, 36.54], [5.66, 36.54], [5.66, 36.52], [5.68, 36.52], [5.68, 36.54], [5.7, 36.54], [5.72, 36.54], [5.74, 36.54], [5.74, 36.56], [5.76, 36.56], [5.76, 36.58], [5.76, 36.56], [5.78, 36.56], [5.78, 36.58], [5.78, 36.56], [5.8, 36.56], [5.82, 36.56], [5.84, 36.56], [5.84, 36.54], [5.86, 36.54], [5.86, 36.56], [5.88, 36.56], [5.9, 36.56], [5.92, 36.56], [5.94, 36.56], [5.94, 36.58], [5.96, 36.58], [5.96, 36.6], [5.98, 36.6], [5.98, 36.62], [6, 36.62], [6.02, 36.62], [6.02, 36.6], [6.04, 36.6], [6.04, 36.62], [6.06, 36.62], [6.06, 36.6], [6.08, 36.6], [6.1, 36.6], [6.12, 36.6], [6.14, 36.6], [6.14, 36.58], [6.16, 36.58], [6.18, 36.58], [6.2, 36.58], [6.22, 36.58], [6.24, 36.58], [6.24, 36.6], [6.26, 36.6], [6.26, 36.62], [6.28, 36.62], [6.3, 36.62], [6.32, 36.62], [6.34, 36.62], [6.34, 36.6], [6.36, 36.6], [6.38, 36.6], [6.4, 36.6], [6.4, 36.58], [6.42, 36.58], [6.44, 36.58], [6.46, 36.58], [6.46, 36.6], [6.48, 36.6], [6.46, 36.6], [6.46, 36.62], [6.48, 36.62], [6.46, 36.62], [6.46, 36.64], [6.48, 36.64], [6.5, 36.64], [6.5, 36.66], [6.52, 36.66], [6.5, 36.66], [6.5, 36.68], [6.48, 36.68], [6.48, 36.7], [6.48, 36.68], [6.48, 36.7], [6.46, 36.7], [6.46, 36.68], [6.46, 36.7], [6.44, 36.7], [6.42, 36.7], [6.4, 36.7], [6.4, 36.72], [6.38, 36.72], [6.36, 36.72], [6.36, 36.74], [6.38, 36.74], [6.38, 36.76], [6.36, 36.76], [6.36, 36.78], [6.34, 36.78], [6.34, 36.8], [6.36, 36.8], [6.36, 36.82], [6.34, 36.82], [6.34, 36.84], [6.34, 36.86], [6.32, 36.86], [6.3, 36.86], [6.28, 36.86], [6.28, 36.88], [6.26, 36.88], [6.28, 36.88], [6.28, 36.9], [6.28, 36.92], [6.26, 36.92], [6.26, 36.94], [6.28, 36.94], [6.26, 36.94], [6.26, 36.92], [6.24, 36.92], [6.22, 36.92], [6.22, 36.9], [6.2, 36.9], [6.18, 36.9], [6.16, 36.9], [6.14, 36.9], [6.14, 36.88], [6.12, 36.88], [6.1, 36.88], [6.08, 36.88], [6.08, 36.86], [6.06, 36.86], [6.04, 36.86], [6.02, 36.84], [6, 36.84], [5.98, 36.84], [5.96, 36.84], [5.94, 36.84], [5.94, 36.82], [5.92, 36.82], [5.9, 36.82], [5.88, 36.82], [5.88, 36.84], [5.9, 36.84], [5.88, 36.84], [5.88, 36.82], [5.86, 36.82], [5.84, 36.82], [5.84, 36.8], [5.82, 36.8], [5.8, 36.8], [5.78, 36.8], [5.78, 36.82], [5.76, 36.82], [5.78, 36.82], [5.76, 36.82], [5.78, 36.82], [5.76, 36.82], [5.74, 36.82], [5.72, 36.82], [5.7, 36.82], [5.68, 36.82], [5.7, 36.82], [5.7, 36.8], [5.68, 36.8], [5.68, 36.82], [5.68, 36.8], [5.66, 36.8], [5.66, 36.78], [5.64, 36.78], [5.62, 36.78], [5.6, 36.78], [5.58, 36.78], [5.58, 36.76], [5.56, 36.76], [5.56, 36.74], [5.56, 36.76], [5.56, 36.74], [5.56, 36.76], [5.56, 36.74], [5.56, 36.72], [5.54, 36.72], [5.54, 36.7], [5.52, 36.7], [5.52, 36.68], [5.52, 36.7], [5.52, 36.68], [5.5, 36.68], [5.48, 36.68], [5.48, 36.66], [5.46, 36.66], [5.44, 36.66], [5.42, 36.66], [5.42, 36.64]]] } }, { type: "Feature", properties: { code: 19, fr: "S\xE9tif", ar: "\u0633\u0637\u064A\u0641", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[4.72, 36.44], [4.74, 36.42], [4.76, 36.42], [4.78, 36.42], [4.78, 36.4], [4.8, 36.4], [4.8, 36.38], [4.78, 36.38], [4.8, 36.38], [4.8, 36.36], [4.78, 36.36], [4.78, 36.34], [4.78, 36.32], [4.8, 36.32], [4.8, 36.3], [4.82, 36.3], [4.84, 36.3], [4.86, 36.3], [4.88, 36.3], [4.9, 36.3], [4.92, 36.3], [4.94, 36.3], [4.96, 36.3], [4.98, 36.3], [4.98, 36.32], [5, 36.32], [5.02, 36.32], [5.02, 36.3], [5.04, 36.3], [5.06, 36.3], [5.04, 36.3], [5.06, 36.3], [5.04, 36.3], [5.06, 36.3], [5.06, 36.28], [5.08, 36.28], [5.08, 36.26], [5.1, 36.26], [5.08, 36.26], [5.08, 36.24], [5.1, 36.24], [5.12, 36.24], [5.1, 36.24], [5.1, 36.22], [5.12, 36.22], [5.12, 36.2], [5.12, 36.22], [5.14, 36.22], [5.14, 36.2], [5.16, 36.2], [5.16, 36.18], [5.16, 36.16], [5.18, 36.16], [5.16, 36.16], [5.18, 36.16], [5.18, 36.14], [5.2, 36.14], [5.18, 36.14], [5.18, 36.12], [5.16, 36.12], [5.16, 36.1], [5.18, 36.1], [5.18, 36.08], [5.2, 36.08], [5.18, 36.08], [5.18, 36.06], [5.18, 36.04], [5.18, 36.02], [5.16, 36.02], [5.14, 36.02], [5.14, 36], [5.12, 36], [5.12, 35.98], [5.12, 35.96], [5.12, 35.94], [5.12, 35.92], [5.12, 35.9], [5.12, 35.88], [5.12, 35.86], [5.14, 35.86], [5.12, 35.86], [5.12, 35.84], [5.1, 35.84], [5.08, 35.84], [5.06, 35.84], [5.06, 35.86], [5.06, 35.84], [5.06, 35.86], [5.04, 35.86], [5.04, 35.84], [5.04, 35.82], [5.04, 35.8], [5.04, 35.78], [5.04, 35.76], [5.02, 35.76], [5.04, 35.76], [5.06, 35.76], [5.06, 35.74], [5.08, 35.74], [5.08, 35.72], [5.1, 35.72], [5.12, 35.72], [5.14, 35.72], [5.16, 35.72], [5.16, 35.7], [5.14, 35.7], [5.16, 35.7], [5.14, 35.7], [5.14, 35.68], [5.16, 35.68], [5.16, 35.66], [5.18, 35.66], [5.2, 35.66], [5.22, 35.66], [5.22, 35.64], [5.22, 35.66], [5.24, 35.66], [5.24, 35.64], [5.24, 35.66], [5.26, 35.66], [5.26, 35.64], [5.28, 35.64], [5.3, 35.64], [5.32, 35.64], [5.34, 35.64], [5.34, 35.62], [5.36, 35.62], [5.38, 35.62], [5.4, 35.62], [5.4, 35.64], [5.42, 35.64], [5.42, 35.66], [5.42, 35.68], [5.42, 35.7], [5.42, 35.72], [5.42, 35.74], [5.44, 35.74], [5.44, 35.72], [5.44, 35.74], [5.46, 35.74], [5.48, 35.74], [5.48, 35.76], [5.5, 35.76], [5.52, 35.76], [5.52, 35.78], [5.54, 35.78], [5.56, 35.78], [5.58, 35.78], [5.6, 35.78], [5.6, 35.76], [5.62, 35.76], [5.64, 35.74], [5.66, 35.74], [5.66, 35.76], [5.68, 35.76], [5.7, 35.76], [5.72, 35.76], [5.72, 35.78], [5.72, 35.8], [5.74, 35.8], [5.74, 35.82], [5.72, 35.82], [5.7, 35.82], [5.68, 35.82], [5.68, 35.84], [5.68, 35.86], [5.7, 35.86], [5.7, 35.88], [5.72, 35.88], [5.7, 35.88], [5.72, 35.88], [5.72, 35.9], [5.74, 35.9], [5.76, 35.9], [5.76, 35.92], [5.78, 35.92], [5.8, 35.92], [5.82, 35.92], [5.86, 35.88], [5.88, 35.86], [5.88, 35.84], [5.9, 35.84], [5.92, 35.84], [5.92, 35.82], [5.94, 35.82], [5.94, 35.84], [5.94, 35.86], [5.92, 35.86], [5.92, 35.88], [5.94, 35.88], [5.96, 35.88], [5.96, 35.9], [5.98, 35.9], [5.98, 35.92], [6, 35.92], [6.02, 35.92], [6.02, 35.94], [6.02, 35.96], [6, 35.96], [5.98, 35.96], [6, 35.96], [6, 35.98], [5.98, 35.98], [6, 35.98], [5.98, 35.98], [5.98, 36], [6, 36], [6, 36.02], [6, 36.04], [6, 36.06], [6, 36.08], [5.98, 36.08], [6, 36.08], [6, 36.1], [5.98, 36.1], [5.96, 36.1], [5.94, 36.1], [5.92, 36.1], [5.92, 36.12], [5.92, 36.14], [5.92, 36.16], [5.92, 36.18], [5.92, 36.2], [5.94, 36.2], [5.96, 36.2], [5.96, 36.22], [5.94, 36.22], [5.94, 36.24], [5.92, 36.24], [5.9, 36.24], [5.9, 36.26], [5.88, 36.26], [5.88, 36.28], [5.88, 36.3], [5.86, 36.3], [5.86, 36.32], [5.88, 36.32], [5.86, 36.32], [5.86, 36.34], [5.84, 36.34], [5.8, 36.36], [5.82, 36.38], [5.8, 36.38], [5.82, 36.38], [5.82, 36.4], [5.82, 36.42], [5.8, 36.42], [5.78, 36.42], [5.76, 36.42], [5.76, 36.44], [5.78, 36.44], [5.76, 36.44], [5.76, 36.46], [5.74, 36.46], [5.74, 36.48], [5.76, 36.48], [5.76, 36.5], [5.76, 36.52], [5.76, 36.54], [5.74, 36.54], [5.74, 36.56], [5.74, 36.54], [5.72, 36.54], [5.7, 36.54], [5.68, 36.54], [5.68, 36.52], [5.66, 36.52], [5.66, 36.54], [5.64, 36.54], [5.62, 36.54], [5.62, 36.56], [5.62, 36.54], [5.6, 36.54], [5.58, 36.54], [5.6, 36.54], [5.58, 36.54], [5.58, 36.52], [5.56, 36.52], [5.54, 36.52], [5.52, 36.52], [5.52, 36.54], [5.5, 36.54], [5.52, 36.54], [5.5, 36.54], [5.52, 36.54], [5.52, 36.56], [5.52, 36.58], [5.5, 36.58], [5.5, 36.6], [5.48, 36.6], [5.46, 36.6], [5.48, 36.6], [5.48, 36.58], [5.48, 36.56], [5.46, 36.56], [5.46, 36.54], [5.44, 36.54], [5.44, 36.52], [5.42, 36.52], [5.4, 36.52], [5.4, 36.5], [5.38, 36.52], [5.36, 36.52], [5.36, 36.5], [5.36, 36.52], [5.36, 36.5], [5.34, 36.5], [5.34, 36.48], [5.36, 36.48], [5.36, 36.46], [5.34, 36.46], [5.34, 36.44], [5.32, 36.44], [5.32, 36.42], [5.3, 36.42], [5.28, 36.42], [5.3, 36.42], [5.3, 36.4], [5.32, 36.4], [5.32, 36.38], [5.3, 36.38], [5.28, 36.38], [5.28, 36.36], [5.26, 36.36], [5.26, 36.38], [5.26, 36.36], [5.24, 36.36], [5.24, 36.38], [5.22, 36.38], [5.22, 36.36], [5.2, 36.36], [5.2, 36.38], [5.2, 36.4], [5.18, 36.4], [5.18, 36.38], [5.16, 36.38], [5.16, 36.4], [5.18, 36.4], [5.16, 36.4], [5.18, 36.4], [5.18, 36.42], [5.18, 36.44], [5.18, 36.46], [5.18, 36.48], [5.18, 36.5], [5.18, 36.52], [5.2, 36.52], [5.18, 36.54], [5.16, 36.54], [5.16, 36.56], [5.14, 36.56], [5.12, 36.56], [5.12, 36.58], [5.12, 36.56], [5.12, 36.58], [5.12, 36.56], [5.12, 36.58], [5.12, 36.56], [5.12, 36.58], [5.1, 36.58], [5.1, 36.56], [5.08, 36.56], [5.08, 36.58], [5.06, 36.58], [5.06, 36.56], [5.06, 36.54], [5.06, 36.52], [5.04, 36.52], [5.02, 36.52], [5, 36.52], [4.98, 36.52], [5, 36.52], [4.98, 36.52], [5, 36.52], [4.98, 36.52], [4.98, 36.5], [4.96, 36.52], [4.94, 36.52], [4.92, 36.52], [4.9, 36.54], [4.88, 36.54], [4.86, 36.54], [4.86, 36.52], [4.84, 36.5], [4.86, 36.5], [4.86, 36.48], [4.84, 36.48], [4.82, 36.48], [4.8, 36.48], [4.8, 36.46], [4.78, 36.46], [4.76, 36.46], [4.76, 36.44], [4.74, 36.44], [4.76, 36.44], [4.74, 36.44], [4.72, 36.44]]] } }, { type: "Feature", properties: { code: 20, fr: "Sa\xEFda", ar: "\u0633\u0639\u064A\u062F\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[-0.34, 34.88], [-0.34, 34.86], [-0.32, 34.86], [-0.3, 34.86], [-0.3, 34.84], [-0.28, 34.84], [-0.3, 34.84], [-0.3, 34.82], [-0.3, 34.8], [-0.28, 34.8], [-0.26, 34.8], [-0.26, 34.78], [-0.26, 34.8], [-0.24, 34.8], [-0.22, 34.8], [-0.22, 34.78], [-0.2, 34.78], [-0.2, 34.76], [-0.2, 34.74], [-0.18, 34.74], [-0.16, 34.74], [-0.14, 34.72], [-0.14, 34.7], [-0.12, 34.7], [-0.1, 34.7], [-0.1, 34.68], [-0.08, 34.68], [-0.08, 34.66], [-0.06, 34.64], [-0.06, 34.62], [-0.04, 34.62], [-0.06, 34.62], [-0.06, 34.6], [-0.04, 34.58], [-0.04, 34.56], [-0.06, 34.56], [-0.06, 34.54], [-0.08, 34.54], [-0.08, 34.52], [-0.1, 34.52], [-0.1, 34.54], [-0.12, 34.54], [-0.12, 34.56], [-0.12, 34.58], [-0.12, 34.6], [-0.14, 34.6], [-0.16, 34.6], [-0.18, 34.6], [-0.18, 34.62], [-0.2, 34.62], [-0.22, 34.62], [-0.22, 34.64], [-0.24, 34.64], [-0.24, 34.62], [-0.24, 34.6], [-0.26, 34.6], [-0.26, 34.58], [-0.24, 34.58], [-0.24, 34.56], [-0.22, 34.56], [-0.22, 34.54], [-0.2, 34.54], [-0.2, 34.52], [-0.2, 34.5], [-0.2, 34.48], [-0.2, 34.46], [-0.18, 34.46], [-0.18, 34.48], [-0.16, 34.48], [-0.14, 34.48], [-0.12, 34.48], [-0.12, 34.5], [-0.1, 34.5], [-0.08, 34.5], [-0.06, 34.5], [-0.06, 34.48], [-0.04, 34.48], [-0.04, 34.46], [-0.02, 34.46], [-0.02, 34.44], [0, 34.44], [0.02, 34.44], [0.02, 34.42], [0.04, 34.42], [0.06, 34.42], [0.08, 34.42], [0.1, 34.42], [0.1, 34.4], [0.12, 34.4], [0.14, 34.38], [0.16, 34.38], [0.16, 34.36], [0.18, 34.36], [0.18, 34.34], [0.24, 34.34], [0.3, 34.32], [0.34, 34.36], [0.36, 34.38], [0.4, 34.38], [0.42, 34.4], [0.44, 34.4], [0.46, 34.38], [0.48, 34.36], [0.5, 34.36], [0.5, 34.34], [0.5, 34.32], [0.52, 34.32], [0.52, 34.34], [0.54, 34.34], [0.56, 34.34], [0.58, 34.34], [0.58, 34.36], [0.6, 34.36], [0.6, 34.38], [0.62, 34.38], [0.64, 34.38], [0.64, 34.4], [0.66, 34.4], [0.66, 34.42], [0.68, 34.42], [0.7, 34.42], [0.7, 34.44], [0.72, 34.44], [0.74, 34.44], [0.76, 34.44], [0.8, 34.42], [0.86, 34.42], [0.9, 34.48], [0.92, 34.52], [0.94, 34.52], [0.9, 34.54], [0.88, 34.54], [0.88, 34.56], [0.86, 34.56], [0.84, 34.56], [0.82, 34.56], [0.8, 34.58], [0.78, 34.58], [0.78, 34.6], [0.8, 34.62], [0.82, 34.62], [0.8, 34.62], [0.8, 34.64], [0.8, 34.66], [0.78, 34.66], [0.76, 34.66], [0.74, 34.64], [0.74, 34.66], [0.72, 34.66], [0.72, 34.68], [0.7, 34.7], [0.7, 34.72], [0.68, 34.72], [0.68, 34.74], [0.66, 34.74], [0.66, 34.76], [0.66, 34.78], [0.66, 34.8], [0.66, 34.82], [0.68, 34.82], [0.68, 34.84], [0.66, 34.84], [0.66, 34.86], [0.68, 34.88], [0.72, 34.9], [0.74, 34.9], [0.74, 34.92], [0.76, 34.92], [0.76, 34.94], [0.78, 34.94], [0.78, 34.96], [0.8, 34.96], [0.78, 34.96], [0.78, 34.98], [0.78, 35], [0.76, 35], [0.76, 35.02], [0.74, 35.02], [0.74, 35.04], [0.72, 35.04], [0.72, 35.06], [0.7, 35.06], [0.68, 35.06], [0.66, 35.06], [0.66, 35.08], [0.66, 35.1], [0.64, 35.1], [0.64, 35.12], [0.62, 35.12], [0.62, 35.1], [0.6, 35.1], [0.58, 35.1], [0.58, 35.12], [0.58, 35.1], [0.56, 35.1], [0.54, 35.1], [0.52, 35.1], [0.5, 35.1], [0.48, 35.1], [0.48, 35.08], [0.46, 35.08], [0.46, 35.06], [0.44, 35.06], [0.44, 35.04], [0.42, 35.04], [0.4, 35.04], [0.4, 35.06], [0.38, 35.06], [0.38, 35.04], [0.36, 35.04], [0.36, 35.06], [0.34, 35.06], [0.34, 35.08], [0.32, 35.08], [0.32, 35.06], [0.3, 35.06], [0.28, 35.06], [0.28, 35.04], [0.26, 35.04], [0.26, 35.02], [0.26, 35.04], [0.24, 35.04], [0.24, 35.02], [0.22, 35.02], [0.2, 35.02], [0.18, 35.02], [0.18, 35.04], [0.16, 35.04], [0.18, 35.04], [0.18, 35.06], [0.16, 35.06], [0.16, 35.08], [0.16, 35.06], [0.14, 35.06], [0.12, 35.06], [0.12, 35.08], [0.12, 35.06], [0.1, 35.06], [0.1, 35.08], [0.08, 35.08], [0.06, 35.08], [0.06, 35.1], [0.04, 35.1], [0.02, 35.1], [0, 35.1], [0, 35.08], [-0.02, 35.08], [-0.02, 35.1], [-0.04, 35.1], [-0.06, 35.1], [-0.08, 35.1], [-0.08, 35.12], [-0.08, 35.14], [-0.1, 35.14], [-0.08, 35.14], [-0.08, 35.16], [-0.1, 35.16], [-0.12, 35.16], [-0.12, 35.14], [-0.12, 35.12], [-0.14, 35.12], [-0.16, 35.12], [-0.18, 35.12], [-0.2, 35.12], [-0.2, 35.1], [-0.22, 35.1], [-0.24, 35.1], [-0.24, 35.08], [-0.26, 35.08], [-0.26, 35.06], [-0.24, 35.06], [-0.24, 35.04], [-0.22, 35.04], [-0.22, 35.02], [-0.24, 35.02], [-0.24, 35], [-0.22, 35], [-0.24, 35], [-0.26, 35], [-0.28, 35], [-0.3, 35], [-0.28, 35], [-0.3, 35], [-0.3, 34.98], [-0.32, 34.98], [-0.32, 34.96], [-0.3, 34.96], [-0.32, 34.96], [-0.3, 34.96], [-0.3, 34.94], [-0.32, 34.94], [-0.3, 34.94], [-0.32, 34.94], [-0.32, 34.92], [-0.3, 34.92], [-0.3, 34.9], [-0.32, 34.9], [-0.32, 34.88], [-0.32, 34.9], [-0.32, 34.88], [-0.34, 34.88], [-0.34, 34.9], [-0.34, 34.88], [-0.34, 34.9], [-0.34, 34.88]]] } }, { type: "Feature", properties: { code: 21, fr: "Skikda", ar: "\u0633\u0643\u064A\u0643\u062F\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[6.24, 36.98], [6.26, 36.98], [6.26, 36.96], [6.26, 36.94], [6.28, 36.94], [6.26, 36.94], [6.26, 36.92], [6.28, 36.92], [6.28, 36.9], [6.28, 36.88], [6.26, 36.88], [6.28, 36.88], [6.28, 36.86], [6.3, 36.86], [6.32, 36.86], [6.34, 36.86], [6.34, 36.84], [6.34, 36.82], [6.36, 36.82], [6.36, 36.8], [6.34, 36.8], [6.34, 36.78], [6.36, 36.78], [6.36, 36.76], [6.38, 36.76], [6.38, 36.74], [6.36, 36.74], [6.36, 36.72], [6.38, 36.72], [6.4, 36.72], [6.4, 36.7], [6.42, 36.7], [6.44, 36.7], [6.46, 36.7], [6.46, 36.68], [6.46, 36.7], [6.48, 36.7], [6.48, 36.68], [6.48, 36.7], [6.48, 36.68], [6.5, 36.68], [6.5, 36.66], [6.52, 36.66], [6.5, 36.66], [6.5, 36.64], [6.48, 36.64], [6.46, 36.64], [6.46, 36.62], [6.48, 36.62], [6.46, 36.62], [6.46, 36.6], [6.48, 36.6], [6.46, 36.6], [6.46, 36.58], [6.48, 36.58], [6.5, 36.58], [6.52, 36.58], [6.54, 36.58], [6.56, 36.58], [6.58, 36.58], [6.6, 36.58], [6.62, 36.58], [6.62, 36.6], [6.64, 36.6], [6.64, 36.62], [6.66, 36.62], [6.68, 36.62], [6.68, 36.6], [6.68, 36.58], [6.7, 36.58], [6.72, 36.58], [6.74, 36.58], [6.74, 36.56], [6.76, 36.56], [6.78, 36.56], [6.8, 36.56], [6.82, 36.56], [6.84, 36.56], [6.86, 36.56], [6.88, 36.56], [6.86, 36.54], [6.84, 36.54], [6.84, 36.52], [6.84, 36.54], [6.84, 36.52], [6.82, 36.52], [6.84, 36.52], [6.84, 36.5], [6.84, 36.48], [6.84, 36.46], [6.82, 36.46], [6.82, 36.44], [6.82, 36.46], [6.84, 36.46], [6.86, 36.46], [6.88, 36.46], [6.88, 36.44], [6.88, 36.42], [6.9, 36.42], [6.9, 36.44], [6.9, 36.42], [6.9, 36.44], [6.9, 36.42], [6.92, 36.42], [6.92, 36.44], [6.92, 36.42], [6.92, 36.44], [6.92, 36.42], [6.94, 36.42], [6.96, 36.42], [6.94, 36.42], [6.94, 36.44], [6.96, 36.44], [6.94, 36.44], [6.94, 36.46], [6.94, 36.48], [6.96, 36.48], [6.98, 36.48], [7, 36.48], [7.02, 36.48], [7.04, 36.48], [7.04, 36.5], [7.06, 36.5], [7.08, 36.5], [7.08, 36.52], [7.08, 36.54], [7.06, 36.54], [7.06, 36.56], [7.06, 36.54], [7.06, 36.56], [7.08, 36.56], [7.08, 36.58], [7.1, 36.58], [7.12, 36.58], [7.14, 36.58], [7.14, 36.6], [7.16, 36.6], [7.18, 36.6], [7.2, 36.6], [7.2, 36.62], [7.22, 36.62], [7.24, 36.62], [7.26, 36.62], [7.28, 36.62], [7.28, 36.64], [7.28, 36.66], [7.3, 36.66], [7.32, 36.66], [7.32, 36.64], [7.34, 36.66], [7.34, 36.68], [7.34, 36.7], [7.34, 36.72], [7.36, 36.72], [7.38, 36.72], [7.4, 36.72], [7.4, 36.74], [7.4, 36.76], [7.4, 36.78], [7.38, 36.78], [7.38, 36.8], [7.4, 36.8], [7.38, 36.8], [7.38, 36.82], [7.38, 36.84], [7.38, 36.86], [7.38, 36.88], [7.38, 36.9], [7.36, 36.9], [7.36, 36.92], [7.34, 36.92], [7.32, 36.92], [7.32, 36.94], [7.34, 36.94], [7.36, 36.94], [7.36, 36.96], [7.34, 36.96], [7.36, 36.96], [7.34, 36.96], [7.36, 36.96], [7.34, 36.96], [7.34, 36.98], [7.34, 37], [7.32, 37], [7.32, 37.02], [7.32, 37.04], [7.32, 37.06], [7.3, 37.06], [7.3, 37.08], [7.28, 37.08], [7.28, 37.06], [7.26, 37.06], [7.28, 37.06], [7.26, 37.06], [7.26, 37.08], [7.24, 37.08], [7.22, 37.08], [7.2, 37.08], [7.18, 37.08], [7.2, 37.08], [7.18, 37.08], [7.16, 37.08], [7.18, 37.08], [7.16, 37.08], [7.18, 37.08], [7.16, 37.08], [7.18, 37.08], [7.18, 37.06], [7.2, 37.06], [7.22, 37.06], [7.22, 37.04], [7.24, 37.04], [7.26, 37.02], [7.24, 37.02], [7.26, 37.02], [7.26, 37], [7.24, 37], [7.24, 36.98], [7.24, 36.96], [7.22, 36.96], [7.2, 36.94], [7.18, 36.94], [7.18, 36.92], [7.16, 36.92], [7.14, 36.92], [7.14, 36.9], [7.14, 36.92], [7.14, 36.9], [7.12, 36.9], [7.12, 36.92], [7.12, 36.9], [7.12, 36.92], [7.12, 36.9], [7.12, 36.92], [7.1, 36.92], [7.08, 36.92], [7.06, 36.92], [7.06, 36.9], [7.04, 36.9], [7.02, 36.9], [7, 36.9], [7, 36.88], [6.98, 36.88], [6.96, 36.88], [6.94, 36.88], [6.94, 36.9], [6.94, 36.88], [6.92, 36.88], [6.9, 36.9], [6.9, 36.88], [6.92, 36.88], [6.9, 36.88], [6.9, 36.9], [6.9, 36.88], [6.9, 36.9], [6.88, 36.9], [6.88, 36.92], [6.88, 36.9], [6.88, 36.92], [6.88, 36.94], [6.86, 36.94], [6.84, 36.94], [6.84, 36.96], [6.86, 36.96], [6.84, 36.96], [6.82, 36.96], [6.82, 36.94], [6.82, 36.96], [6.82, 36.94], [6.82, 36.96], [6.82, 36.94], [6.8, 36.94], [6.8, 36.96], [6.78, 36.96], [6.78, 36.94], [6.76, 36.94], [6.76, 36.96], [6.76, 36.94], [6.76, 36.96], [6.76, 36.94], [6.76, 36.96], [6.76, 36.94], [6.76, 36.96], [6.76, 36.94], [6.76, 36.96], [6.74, 36.96], [6.74, 36.94], [6.72, 36.94], [6.72, 36.96], [6.7, 36.96], [6.7, 36.94], [6.7, 36.96], [6.7, 36.94], [6.7, 36.96], [6.7, 36.94], [6.7, 36.96], [6.7, 36.94], [6.7, 36.96], [6.7, 36.94], [6.68, 36.94], [6.68, 36.96], [6.68, 36.94], [6.68, 36.96], [6.68, 36.94], [6.66, 36.94], [6.66, 36.96], [6.64, 36.96], [6.62, 36.96], [6.62, 36.98], [6.64, 36.98], [6.62, 36.98], [6.62, 36.96], [6.62, 36.98], [6.62, 36.96], [6.62, 36.98], [6.6, 36.98], [6.58, 36.98], [6.56, 36.98], [6.56, 37], [6.58, 37], [6.58, 37.02], [6.58, 37], [6.56, 37], [6.56, 37.02], [6.58, 37.02], [6.56, 37.02], [6.54, 37.02], [6.54, 37.04], [6.54, 37.06], [6.52, 37.06], [6.54, 37.06], [6.52, 37.06], [6.52, 37.08], [6.5, 37.08], [6.48, 37.08], [6.46, 37.08], [6.44, 37.08], [6.42, 37.08], [6.4, 37.08], [6.38, 37.08], [6.36, 37.08], [6.34, 37.08], [6.34, 37.06], [6.32, 37.06], [6.34, 37.06], [6.32, 37.06], [6.32, 37.04], [6.3, 37.04], [6.28, 37.04], [6.28, 37.02], [6.26, 37.02], [6.26, 37], [6.24, 37], [6.24, 36.98]]] } }, { type: "Feature", properties: { code: 22, fr: "Sidi Bel Abb\xE8s", ar: "\u0633\u064A\u062F\u064A \u0628\u0644\u0639\u0628\u0627\u0633", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[-1.12, 34.28], [-1.12, 34.26], [-1.1, 34.26], [-1.08, 34.24], [-1.08, 34.22], [-1.06, 34.22], [-1.04, 34.24], [-1.02, 34.24], [-1.02, 34.26], [-1, 34.26], [-0.98, 34.28], [-0.96, 34.28], [-0.96, 34.26], [-0.96, 34.24], [-0.94, 34.24], [-0.94, 34.26], [-0.94, 34.24], [-0.94, 34.26], [-0.92, 34.26], [-0.9, 34.24], [-0.88, 34.24], [-0.86, 34.24], [-0.84, 34.24], [-0.82, 34.24], [-0.8, 34.24], [-0.8, 34.22], [-0.78, 34.22], [-0.78, 34.24], [-0.7, 34.28], [-0.64, 34.3], [-0.62, 34.32], [-0.6, 34.32], [-0.58, 34.3], [-0.56, 34.3], [-0.54, 34.3], [-0.52, 34.28], [-0.5, 34.28], [-0.5, 34.26], [-0.48, 34.24], [-0.48, 34.22], [-0.48, 34.18], [-0.48, 34.16], [-0.48, 34.14], [-0.46, 34.12], [-0.44, 34.12], [-0.44, 34.1], [-0.44, 34.08], [-0.42, 34.06], [-0.4, 34.06], [-0.4, 34.04], [-0.4, 34.02], [-0.4, 34], [-0.38, 33.98], [-0.38, 33.96], [-0.4, 33.94], [-0.38, 33.94], [-0.36, 33.94], [-0.36, 33.92], [-0.36, 33.9], [-0.34, 33.92], [-0.36, 33.94], [-0.34, 33.96], [-0.32, 33.96], [-0.3, 33.96], [-0.3, 33.98], [-0.28, 33.98], [-0.28, 34], [-0.26, 34.02], [-0.26, 34.04], [-0.24, 34.04], [-0.22, 34.06], [-0.2, 34.06], [-0.18, 34.06], [-0.18, 34.08], [-0.16, 34.08], [-0.14, 34.08], [-0.14, 34.1], [-0.12, 34.1], [-0.12, 34.08], [-0.1, 34.08], [-0.08, 34.08], [-0.06, 34.1], [-0.06, 34.12], [-0.04, 34.12], [-0.04, 34.14], [-0.04, 34.16], [-0.02, 34.16], [-0.02, 34.18], [0, 34.2], [0, 34.22], [0.02, 34.22], [0.04, 34.22], [0.04, 34.24], [0.04, 34.26], [0.02, 34.26], [0.02, 34.28], [0.02, 34.3], [0.02, 34.32], [0.02, 34.34], [0.02, 34.36], [0, 34.36], [0, 34.38], [0, 34.4], [-0.02, 34.4], [-0.02, 34.42], [-0.02, 34.44], [-0.02, 34.46], [-0.04, 34.46], [-0.04, 34.48], [-0.06, 34.48], [-0.06, 34.5], [-0.08, 34.5], [-0.1, 34.5], [-0.12, 34.5], [-0.12, 34.48], [-0.14, 34.48], [-0.16, 34.48], [-0.18, 34.48], [-0.18, 34.46], [-0.2, 34.46], [-0.2, 34.48], [-0.2, 34.5], [-0.2, 34.52], [-0.2, 34.54], [-0.22, 34.54], [-0.22, 34.56], [-0.24, 34.56], [-0.24, 34.58], [-0.26, 34.58], [-0.26, 34.6], [-0.24, 34.6], [-0.24, 34.62], [-0.24, 34.64], [-0.22, 34.64], [-0.22, 34.62], [-0.2, 34.62], [-0.18, 34.62], [-0.18, 34.6], [-0.16, 34.6], [-0.14, 34.6], [-0.12, 34.6], [-0.12, 34.58], [-0.12, 34.56], [-0.12, 34.54], [-0.1, 34.54], [-0.1, 34.52], [-0.08, 34.52], [-0.08, 34.54], [-0.06, 34.54], [-0.06, 34.56], [-0.04, 34.56], [-0.04, 34.58], [-0.06, 34.6], [-0.06, 34.62], [-0.04, 34.62], [-0.06, 34.62], [-0.06, 34.64], [-0.08, 34.66], [-0.08, 34.68], [-0.1, 34.68], [-0.1, 34.7], [-0.12, 34.7], [-0.14, 34.7], [-0.14, 34.72], [-0.16, 34.74], [-0.18, 34.74], [-0.2, 34.74], [-0.2, 34.76], [-0.2, 34.78], [-0.22, 34.78], [-0.22, 34.8], [-0.24, 34.8], [-0.26, 34.8], [-0.26, 34.78], [-0.26, 34.8], [-0.28, 34.8], [-0.3, 34.8], [-0.3, 34.82], [-0.3, 34.84], [-0.28, 34.84], [-0.3, 34.84], [-0.3, 34.86], [-0.32, 34.86], [-0.34, 34.86], [-0.34, 34.88], [-0.34, 34.9], [-0.34, 34.88], [-0.34, 34.9], [-0.34, 34.88], [-0.32, 34.88], [-0.32, 34.9], [-0.32, 34.88], [-0.32, 34.9], [-0.3, 34.9], [-0.3, 34.92], [-0.32, 34.92], [-0.32, 34.94], [-0.3, 34.94], [-0.32, 34.94], [-0.3, 34.94], [-0.3, 34.96], [-0.32, 34.96], [-0.3, 34.96], [-0.32, 34.96], [-0.32, 34.98], [-0.3, 34.98], [-0.3, 35], [-0.28, 35], [-0.3, 35], [-0.28, 35], [-0.26, 35], [-0.24, 35], [-0.22, 35], [-0.24, 35], [-0.24, 35.02], [-0.22, 35.02], [-0.22, 35.04], [-0.24, 35.04], [-0.24, 35.06], [-0.26, 35.06], [-0.26, 35.08], [-0.24, 35.08], [-0.24, 35.1], [-0.22, 35.1], [-0.2, 35.1], [-0.2, 35.12], [-0.18, 35.12], [-0.18, 35.14], [-0.18, 35.16], [-0.18, 35.18], [-0.2, 35.18], [-0.22, 35.18], [-0.2, 35.18], [-0.22, 35.18], [-0.2, 35.18], [-0.2, 35.2], [-0.22, 35.2], [-0.2, 35.2], [-0.2, 35.22], [-0.18, 35.22], [-0.2, 35.22], [-0.2, 35.24], [-0.18, 35.24], [-0.18, 35.26], [-0.16, 35.26], [-0.14, 35.26], [-0.12, 35.26], [-0.14, 35.26], [-0.14, 35.28], [-0.16, 35.28], [-0.18, 35.28], [-0.18, 35.26], [-0.2, 35.26], [-0.22, 35.26], [-0.22, 35.24], [-0.24, 35.24], [-0.24, 35.26], [-0.24, 35.28], [-0.22, 35.28], [-0.2, 35.28], [-0.2, 35.3], [-0.18, 35.3], [-0.18, 35.32], [-0.16, 35.32], [-0.16, 35.34], [-0.18, 35.34], [-0.18, 35.36], [-0.18, 35.34], [-0.18, 35.36], [-0.2, 35.36], [-0.2, 35.34], [-0.2, 35.36], [-0.22, 35.36], [-0.24, 35.36], [-0.26, 35.36], [-0.28, 35.36], [-0.28, 35.38], [-0.28, 35.36], [-0.3, 35.36], [-0.3, 35.38], [-0.3, 35.4], [-0.32, 35.4], [-0.32, 35.38], [-0.34, 35.38], [-0.34, 35.36], [-0.36, 35.36], [-0.38, 35.36], [-0.4, 35.36], [-0.42, 35.36], [-0.42, 35.38], [-0.42, 35.4], [-0.4, 35.4], [-0.42, 35.4], [-0.42, 35.42], [-0.4, 35.42], [-0.4, 35.44], [-0.42, 35.44], [-0.42, 35.46], [-0.44, 35.46], [-0.44, 35.44], [-0.46, 35.44], [-0.48, 35.44], [-0.48, 35.42], [-0.5, 35.42], [-0.5, 35.44], [-0.52, 35.44], [-0.52, 35.42], [-0.54, 35.42], [-0.54, 35.4], [-0.56, 35.4], [-0.56, 35.38], [-0.54, 35.38], [-0.54, 35.36], [-0.56, 35.36], [-0.58, 35.36], [-0.58, 35.34], [-0.6, 35.34], [-0.62, 35.34], [-0.62, 35.36], [-0.64, 35.36], [-0.66, 35.36], [-0.66, 35.34], [-0.68, 35.34], [-0.7, 35.34], [-0.72, 35.34], [-0.74, 35.34], [-0.76, 35.34], [-0.76, 35.32], [-0.74, 35.32], [-0.76, 35.32], [-0.74, 35.32], [-0.76, 35.32], [-0.76, 35.3], [-0.78, 35.3], [-0.8, 35.3], [-0.82, 35.3], [-0.82, 35.32], [-0.84, 35.32], [-0.84, 35.3], [-0.86, 35.3], [-0.86, 35.28], [-0.88, 35.28], [-0.88, 35.26], [-0.9, 35.26], [-0.9, 35.24], [-0.9, 35.22], [-0.88, 35.22], [-0.88, 35.2], [-0.9, 35.2], [-0.9, 35.18], [-0.9, 35.2], [-0.9, 35.18], [-0.92, 35.18], [-0.94, 35.18], [-0.94, 35.16], [-0.96, 35.18], [-0.96, 35.16], [-0.94, 35.16], [-0.96, 35.16], [-0.96, 35.14], [-0.96, 35.12], [-0.98, 35.12], [-0.98, 35.1], [-1, 35.1], [-1, 35.08], [-0.98, 35.08], [-0.96, 35.08], [-0.94, 35.08], [-0.94, 35.06], [-0.92, 35.06], [-0.92, 35.04], [-0.92, 35.02], [-0.94, 35.02], [-0.94, 35], [-0.94, 34.98], [-0.96, 34.98], [-0.98, 34.98], [-0.98, 34.96], [-0.96, 34.96], [-0.96, 34.94], [-0.94, 34.94], [-0.94, 34.92], [-0.96, 34.92], [-0.96, 34.9], [-0.94, 34.9], [-0.92, 34.9], [-0.92, 34.92], [-0.92, 34.9], [-0.9, 34.9], [-0.9, 34.88], [-0.92, 34.88], [-0.92, 34.86], [-0.9, 34.86], [-0.9, 34.88], [-0.88, 34.88], [-0.88, 34.86], [-0.86, 34.86], [-0.88, 34.86], [-0.88, 34.84], [-0.88, 34.82], [-0.88, 34.8], [-0.88, 34.78], [-0.9, 34.78], [-0.9, 34.76], [-0.88, 34.76], [-0.88, 34.74], [-0.86, 34.74], [-0.84, 34.74], [-0.82, 34.74], [-0.8, 34.74], [-0.78, 34.74], [-0.78, 34.76], [-0.78, 34.74], [-0.76, 34.74], [-0.76, 34.72], [-0.78, 34.72], [-0.78, 34.7], [-0.78, 34.68], [-0.78, 34.66], [-0.8, 34.66], [-0.8, 34.64], [-0.8, 34.62], [-0.82, 34.62], [-0.82, 34.6], [-0.82, 34.58], [-0.84, 34.58], [-0.86, 34.58], [-0.86, 34.56], [-0.88, 34.56], [-0.9, 34.56], [-0.9, 34.54], [-0.88, 34.54], [-0.86, 34.54], [-0.86, 34.52], [-0.86, 34.5], [-0.84, 34.5], [-0.86, 34.5], [-0.86, 34.48], [-0.88, 34.48], [-0.9, 34.48], [-0.9, 34.46], [-0.9, 34.44], [-0.92, 34.44], [-0.94, 34.44], [-0.94, 34.42], [-0.96, 34.42], [-0.96, 34.4], [-0.98, 34.4], [-1, 34.4], [-1, 34.38], [-1.02, 34.38], [-1.04, 34.38], [-1.04, 34.36], [-1.06, 34.36], [-1.06, 34.34], [-1.08, 34.34], [-1.08, 34.32], [-1.1, 34.32], [-1.1, 34.3], [-1.12, 34.3], [-1.12, 34.28]]] } }, { type: "Feature", properties: { code: 23, fr: "Annaba", ar: "\u0639\u0646\u0627\u0628\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "MultiPolygon", coordinates: [[[[7.28, 37.08], [7.3, 37.08], [7.3, 37.06], [7.32, 37.06], [7.32, 37.04], [7.32, 37.02], [7.32, 37], [7.34, 37], [7.34, 36.98], [7.34, 36.96], [7.36, 36.96], [7.34, 36.96], [7.36, 36.96], [7.34, 36.96], [7.36, 36.96], [7.36, 36.94], [7.34, 36.94], [7.32, 36.94], [7.32, 36.92], [7.34, 36.92], [7.36, 36.92], [7.36, 36.9], [7.38, 36.9], [7.38, 36.88], [7.38, 36.86], [7.38, 36.84], [7.38, 36.82], [7.38, 36.8], [7.4, 36.8], [7.38, 36.8], [7.38, 36.78], [7.4, 36.78], [7.4, 36.76], [7.4, 36.74], [7.4, 36.72], [7.38, 36.72], [7.36, 36.72], [7.34, 36.72], [7.34, 36.7], [7.34, 36.68], [7.34, 36.66], [7.36, 36.66], [7.38, 36.66], [7.4, 36.66], [7.4, 36.64], [7.42, 36.64], [7.42, 36.62], [7.42, 36.64], [7.42, 36.66], [7.44, 36.66], [7.46, 36.66], [7.48, 36.66], [7.48, 36.68], [7.5, 36.66], [7.5, 36.64], [7.5, 36.62], [7.52, 36.62], [7.52, 36.64], [7.54, 36.64], [7.54, 36.62], [7.56, 36.62], [7.56, 36.6], [7.58, 36.6], [7.6, 36.6], [7.6, 36.62], [7.62, 36.62], [7.62, 36.6], [7.64, 36.6], [7.64, 36.62], [7.64, 36.64], [7.66, 36.64], [7.66, 36.66], [7.66, 36.68], [7.68, 36.68], [7.68, 36.7], [7.7, 36.7], [7.7, 36.68], [7.7, 36.7], [7.7, 36.72], [7.68, 36.72], [7.68, 36.74], [7.7, 36.74], [7.7, 36.76], [7.72, 36.76], [7.72, 36.78], [7.74, 36.78], [7.76, 36.78], [7.78, 36.78], [7.78, 36.8], [7.78, 36.82], [7.8, 36.82], [7.82, 36.82], [7.84, 36.82], [7.82, 36.82], [7.82, 36.84], [7.82, 36.86], [7.82, 36.84], [7.82, 36.86], [7.8, 36.86], [7.78, 36.86], [7.78, 36.88], [7.76, 36.88], [7.76, 36.9], [7.78, 36.9], [7.76, 36.9], [7.78, 36.9], [7.78, 36.92], [7.76, 36.92], [7.76, 36.94], [7.78, 36.94], [7.78, 36.96], [7.8, 36.96], [7.78, 36.96], [7.76, 36.96], [7.74, 36.96], [7.72, 36.96], [7.72, 36.94], [7.7, 36.94], [7.7, 36.96], [7.68, 36.96], [7.68, 36.98], [7.68, 36.96], [7.66, 36.96], [7.66, 36.98], [7.66, 36.96], [7.66, 36.98], [7.66, 36.96], [7.64, 36.98], [7.66, 36.96], [7.64, 36.96], [7.62, 36.96], [7.6, 36.96], [7.6, 36.98], [7.58, 36.98], [7.56, 36.98], [7.56, 37], [7.54, 37], [7.54, 37.02], [7.52, 37.02], [7.52, 37.04], [7.5, 37.04], [7.48, 37.04], [7.46, 37.04], [7.44, 37.04], [7.42, 37.04], [7.4, 37.04], [7.4, 37.06], [7.38, 37.06], [7.4, 37.06], [7.38, 37.06], [7.4, 37.06], [7.4, 37.08], [7.38, 37.08], [7.36, 37.08], [7.38, 37.08], [7.36, 37.08], [7.36, 37.06], [7.36, 37.08], [7.36, 37.06], [7.34, 37.06], [7.32, 37.06], [7.32, 37.08], [7.3, 37.08], [7.28, 37.08]]], [[[7.78, 36.96], [7.8, 36.96], [7.78, 36.96], [7.8, 36.96], [7.78, 36.96]]]] } }, { type: "Feature", properties: { code: 24, fr: "Guelma", ar: "\u0642\u0627\u0644\u0645\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[6.94, 36.44], [6.94, 36.42], [6.96, 36.42], [6.94, 36.42], [6.96, 36.42], [6.96, 36.4], [6.96, 36.38], [6.98, 36.38], [6.96, 36.38], [6.96, 36.36], [6.94, 36.36], [6.96, 36.36], [6.98, 36.36], [6.98, 36.34], [7, 36.34], [6.98, 36.34], [6.98, 36.32], [6.96, 36.32], [6.98, 36.32], [6.98, 36.3], [7, 36.3], [7.02, 36.3], [7.02, 36.28], [7.04, 36.28], [7.04, 36.26], [7.04, 36.24], [7.04, 36.22], [7.04, 36.2], [7.04, 36.18], [7.02, 36.18], [7.02, 36.16], [7, 36.16], [7, 36.14], [7, 36.12], [7, 36.1], [6.98, 36.1], [7, 36.1], [7, 36.08], [7.02, 36.08], [7.04, 36.08], [7.04, 36.06], [7.04, 36.04], [7.06, 36.04], [7.06, 36.02], [7.06, 36.04], [7.08, 36.04], [7.08, 36.02], [7.1, 36.02], [7.1, 36.04], [7.12, 36.04], [7.14, 36.04], [7.14, 36.06], [7.16, 36.06], [7.18, 36.06], [7.2, 36.06], [7.2, 36.08], [7.22, 36.08], [7.22, 36.1], [7.24, 36.1], [7.24, 36.12], [7.26, 36.14], [7.28, 36.14], [7.3, 36.14], [7.32, 36.14], [7.3, 36.14], [7.3, 36.16], [7.28, 36.16], [7.3, 36.16], [7.28, 36.18], [7.28, 36.2], [7.3, 36.2], [7.3, 36.22], [7.32, 36.22], [7.32, 36.24], [7.32, 36.22], [7.34, 36.22], [7.36, 36.22], [7.38, 36.22], [7.4, 36.22], [7.4, 36.2], [7.4, 36.22], [7.42, 36.22], [7.42, 36.2], [7.42, 36.22], [7.42, 36.2], [7.44, 36.2], [7.46, 36.2], [7.46, 36.22], [7.48, 36.22], [7.5, 36.22], [7.52, 36.22], [7.54, 36.22], [7.54, 36.24], [7.56, 36.24], [7.58, 36.24], [7.58, 36.22], [7.58, 36.24], [7.6, 36.24], [7.62, 36.24], [7.62, 36.22], [7.62, 36.24], [7.64, 36.24], [7.66, 36.24], [7.66, 36.26], [7.68, 36.26], [7.7, 36.26], [7.72, 36.26], [7.72, 36.28], [7.72, 36.3], [7.74, 36.3], [7.76, 36.3], [7.76, 36.28], [7.78, 36.28], [7.78, 36.3], [7.8, 36.3], [7.82, 36.3], [7.84, 36.3], [7.84, 36.32], [7.86, 36.32], [7.84, 36.32], [7.84, 36.34], [7.84, 36.36], [7.82, 36.36], [7.8, 36.38], [7.82, 36.38], [7.82, 36.4], [7.8, 36.4], [7.82, 36.4], [7.82, 36.42], [7.84, 36.42], [7.86, 36.42], [7.86, 36.4], [7.86, 36.42], [7.88, 36.42], [7.9, 36.42], [7.9, 36.44], [7.92, 36.44], [7.94, 36.44], [7.94, 36.46], [7.96, 36.46], [7.96, 36.48], [7.94, 36.48], [7.94, 36.5], [7.96, 36.5], [7.94, 36.5], [7.94, 36.52], [7.92, 36.52], [7.92, 36.54], [7.9, 36.54], [7.88, 36.54], [7.88, 36.56], [7.86, 36.56], [7.86, 36.54], [7.86, 36.56], [7.84, 36.56], [7.84, 36.54], [7.84, 36.56], [7.84, 36.54], [7.84, 36.56], [7.82, 36.56], [7.82, 36.54], [7.8, 36.54], [7.78, 36.54], [7.78, 36.56], [7.78, 36.58], [7.78, 36.6], [7.76, 36.6], [7.76, 36.62], [7.74, 36.62], [7.74, 36.64], [7.74, 36.66], [7.72, 36.66], [7.7, 36.66], [7.68, 36.66], [7.7, 36.66], [7.7, 36.64], [7.68, 36.64], [7.68, 36.66], [7.66, 36.66], [7.66, 36.64], [7.64, 36.64], [7.64, 36.62], [7.64, 36.6], [7.62, 36.6], [7.62, 36.62], [7.6, 36.62], [7.6, 36.6], [7.58, 36.6], [7.56, 36.6], [7.56, 36.62], [7.54, 36.62], [7.54, 36.64], [7.52, 36.64], [7.52, 36.62], [7.5, 36.62], [7.5, 36.64], [7.5, 36.66], [7.48, 36.68], [7.48, 36.66], [7.46, 36.66], [7.44, 36.66], [7.42, 36.66], [7.42, 36.64], [7.42, 36.62], [7.42, 36.64], [7.4, 36.64], [7.4, 36.66], [7.38, 36.66], [7.36, 36.66], [7.34, 36.66], [7.32, 36.64], [7.32, 36.66], [7.3, 36.66], [7.28, 36.66], [7.28, 36.64], [7.28, 36.62], [7.26, 36.62], [7.24, 36.62], [7.22, 36.62], [7.2, 36.62], [7.2, 36.6], [7.18, 36.6], [7.16, 36.6], [7.14, 36.6], [7.14, 36.58], [7.12, 36.58], [7.1, 36.58], [7.08, 36.58], [7.08, 36.56], [7.06, 36.56], [7.06, 36.54], [7.06, 36.56], [7.06, 36.54], [7.08, 36.54], [7.08, 36.52], [7.08, 36.5], [7.06, 36.5], [7.04, 36.5], [7.04, 36.48], [7.02, 36.48], [7, 36.48], [6.98, 36.48], [6.96, 36.48], [6.94, 36.48], [6.94, 36.46], [6.94, 36.44], [6.96, 36.44], [6.94, 36.44]]] } }, { type: "Feature", properties: { code: 25, fr: "Constantine", ar: "\u0642\u0633\u0646\u0637\u064A\u0646\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[6.3, 36.34], [6.32, 36.34], [6.34, 36.34], [6.34, 36.36], [6.36, 36.36], [6.38, 36.36], [6.38, 36.34], [6.4, 36.34], [6.4, 36.32], [6.42, 36.32], [6.44, 36.32], [6.44, 36.3], [6.42, 36.3], [6.4, 36.28], [6.4, 36.26], [6.42, 36.26], [6.42, 36.24], [6.42, 36.26], [6.42, 36.24], [6.42, 36.26], [6.44, 36.26], [6.44, 36.24], [6.46, 36.24], [6.46, 36.26], [6.48, 36.26], [6.5, 36.26], [6.5, 36.24], [6.52, 36.24], [6.52, 36.22], [6.54, 36.22], [6.54, 36.2], [6.52, 36.2], [6.54, 36.2], [6.54, 36.18], [6.52, 36.16], [6.52, 36.14], [6.54, 36.14], [6.52, 36.14], [6.54, 36.14], [6.54, 36.12], [6.54, 36.1], [6.54, 36.12], [6.56, 36.12], [6.56, 36.1], [6.58, 36.1], [6.58, 36.12], [6.56, 36.12], [6.58, 36.12], [6.6, 36.12], [6.6, 36.1], [6.62, 36.1], [6.64, 36.1], [6.64, 36.12], [6.64, 36.14], [6.66, 36.14], [6.68, 36.14], [6.7, 36.14], [6.72, 36.14], [6.74, 36.14], [6.74, 36.16], [6.76, 36.16], [6.74, 36.16], [6.76, 36.16], [6.76, 36.18], [6.74, 36.18], [6.74, 36.2], [6.76, 36.2], [6.76, 36.18], [6.78, 36.18], [6.78, 36.2], [6.8, 36.2], [6.78, 36.2], [6.78, 36.18], [6.8, 36.18], [6.82, 36.18], [6.82, 36.16], [6.84, 36.16], [6.84, 36.14], [6.86, 36.14], [6.88, 36.14], [6.9, 36.14], [6.92, 36.14], [6.94, 36.14], [6.96, 36.14], [6.98, 36.14], [7, 36.14], [7, 36.16], [7.02, 36.16], [7.02, 36.18], [7.04, 36.18], [7.04, 36.2], [7.04, 36.22], [7.04, 36.24], [7.04, 36.26], [7.04, 36.28], [7.02, 36.28], [7.02, 36.3], [7, 36.3], [6.98, 36.3], [6.98, 36.32], [6.96, 36.32], [6.98, 36.32], [6.98, 36.34], [7, 36.34], [6.98, 36.34], [6.98, 36.36], [6.96, 36.36], [6.94, 36.36], [6.96, 36.36], [6.96, 36.38], [6.98, 36.38], [6.96, 36.38], [6.96, 36.4], [6.96, 36.42], [6.94, 36.42], [6.92, 36.42], [6.92, 36.44], [6.92, 36.42], [6.92, 36.44], [6.92, 36.42], [6.9, 36.42], [6.9, 36.44], [6.9, 36.42], [6.9, 36.44], [6.9, 36.42], [6.88, 36.42], [6.88, 36.44], [6.88, 36.46], [6.86, 36.46], [6.84, 36.46], [6.82, 36.46], [6.82, 36.44], [6.82, 36.46], [6.84, 36.46], [6.84, 36.48], [6.84, 36.5], [6.84, 36.52], [6.82, 36.52], [6.84, 36.52], [6.84, 36.54], [6.84, 36.52], [6.84, 36.54], [6.86, 36.54], [6.88, 36.56], [6.86, 36.56], [6.84, 36.56], [6.82, 36.56], [6.8, 36.56], [6.78, 36.56], [6.76, 36.56], [6.74, 36.56], [6.74, 36.58], [6.72, 36.58], [6.7, 36.58], [6.68, 36.58], [6.68, 36.6], [6.68, 36.62], [6.66, 36.62], [6.64, 36.62], [6.64, 36.6], [6.62, 36.6], [6.62, 36.58], [6.6, 36.58], [6.58, 36.58], [6.56, 36.58], [6.54, 36.58], [6.52, 36.58], [6.5, 36.58], [6.5, 36.56], [6.5, 36.54], [6.5, 36.52], [6.48, 36.52], [6.48, 36.5], [6.46, 36.5], [6.44, 36.5], [6.42, 36.5], [6.4, 36.5], [6.38, 36.5], [6.38, 36.48], [6.38, 36.5], [6.36, 36.5], [6.34, 36.5], [6.36, 36.5], [6.36, 36.48], [6.36, 36.46], [6.34, 36.46], [6.34, 36.44], [6.36, 36.44], [6.36, 36.42], [6.36, 36.4], [6.34, 36.4], [6.34, 36.38], [6.32, 36.38], [6.32, 36.36], [6.32, 36.34], [6.3, 36.34]]] } }, { type: "Feature", properties: { code: 26, fr: "M\xE9d\xE9a", ar: "\u0627\u0644\u0645\u062F\u064A\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[2.14, 35.72], [2.14, 35.7], [2.16, 35.7], [2.14, 35.7], [2.14, 35.68], [2.16, 35.68], [2.14, 35.68], [2.14, 35.66], [2.16, 35.66], [2.18, 35.66], [2.2, 35.66], [2.2, 35.64], [2.22, 35.64], [2.24, 35.64], [2.26, 35.64], [2.28, 35.64], [2.28, 35.62], [2.28, 35.64], [2.28, 35.62], [2.28, 35.6], [2.26, 35.6], [2.26, 35.58], [2.26, 35.56], [2.26, 35.54], [2.26, 35.52], [2.26, 35.5], [2.28, 35.5], [2.28, 35.48], [2.28, 35.46], [2.3, 35.46], [2.32, 35.46], [2.34, 35.46], [2.36, 35.46], [2.38, 35.46], [2.4, 35.46], [2.4, 35.48], [2.42, 35.48], [2.44, 35.48], [2.44, 35.5], [2.46, 35.5], [2.48, 35.5], [2.48, 35.52], [2.5, 35.52], [2.5, 35.5], [2.52, 35.5], [2.52, 35.52], [2.52, 35.5], [2.54, 35.5], [2.54, 35.48], [2.56, 35.48], [2.58, 35.48], [2.58, 35.46], [2.6, 35.46], [2.62, 35.46], [2.62, 35.44], [2.64, 35.44], [2.66, 35.44], [2.66, 35.46], [2.68, 35.46], [2.7, 35.46], [2.7, 35.48], [2.72, 35.48], [2.72, 35.5], [2.74, 35.54], [2.76, 35.54], [2.76, 35.56], [2.78, 35.56], [2.78, 35.58], [2.8, 35.58], [2.82, 35.58], [2.82, 35.6], [2.84, 35.6], [2.84, 35.62], [2.86, 35.62], [2.86, 35.6], [2.86, 35.62], [2.88, 35.62], [2.88, 35.6], [2.9, 35.6], [2.9, 35.62], [2.88, 35.62], [2.88, 35.64], [2.9, 35.64], [2.9, 35.66], [2.88, 35.66], [2.9, 35.66], [2.9, 35.68], [2.9, 35.7], [2.88, 35.7], [2.88, 35.72], [2.88, 35.74], [2.88, 35.76], [2.88, 35.78], [2.86, 35.78], [2.86, 35.8], [2.88, 35.8], [2.86, 35.8], [2.88, 35.8], [2.88, 35.82], [2.9, 35.82], [2.9, 35.8], [2.92, 35.8], [2.94, 35.8], [2.94, 35.82], [2.96, 35.82], [2.98, 35.82], [2.98, 35.84], [2.98, 35.82], [2.98, 35.84], [3, 35.84], [3, 35.82], [3.02, 35.8], [3.02, 35.78], [3.02, 35.76], [3.02, 35.74], [3.04, 35.74], [3.06, 35.74], [3.04, 35.72], [3.04, 35.7], [3.04, 35.68], [3.06, 35.68], [3.06, 35.66], [3.08, 35.66], [3.14, 35.68], [3.16, 35.68], [3.18, 35.68], [3.2, 35.68], [3.22, 35.74], [3.24, 35.74], [3.22, 35.74], [3.24, 35.74], [3.22, 35.74], [3.22, 35.76], [3.24, 35.76], [3.22, 35.76], [3.22, 35.78], [3.24, 35.78], [3.22, 35.78], [3.24, 35.78], [3.24, 35.8], [3.26, 35.8], [3.26, 35.82], [3.28, 35.82], [3.28, 35.8], [3.28, 35.78], [3.3, 35.78], [3.3, 35.76], [3.32, 35.76], [3.34, 35.76], [3.36, 35.76], [3.38, 35.76], [3.38, 35.78], [3.4, 35.78], [3.38, 35.78], [3.38, 35.8], [3.38, 35.82], [3.4, 35.82], [3.42, 35.82], [3.42, 35.8], [3.44, 35.8], [3.44, 35.78], [3.46, 35.78], [3.46, 35.76], [3.46, 35.74], [3.48, 35.74], [3.48, 35.72], [3.5, 35.7], [3.5, 35.68], [3.52, 35.68], [3.52, 35.66], [3.54, 35.66], [3.54, 35.7], [3.54, 35.74], [3.54, 35.76], [3.54, 35.78], [3.52, 35.78], [3.52, 35.8], [3.52, 35.82], [3.5, 35.82], [3.52, 35.82], [3.54, 35.82], [3.56, 35.84], [3.58, 35.84], [3.6, 35.84], [3.6, 35.86], [3.58, 35.86], [3.58, 35.88], [3.6, 35.88], [3.62, 35.88], [3.62, 35.9], [3.6, 35.92], [3.62, 35.92], [3.6, 35.94], [3.58, 35.94], [3.58, 35.96], [3.6, 35.96], [3.58, 35.96], [3.58, 35.98], [3.56, 35.98], [3.56, 36], [3.56, 36.02], [3.54, 36.02], [3.52, 36.02], [3.5, 36.02], [3.5, 36.04], [3.48, 36.04], [3.46, 36.04], [3.44, 36.04], [3.42, 36.04], [3.4, 36.04], [3.4, 36.06], [3.42, 36.06], [3.44, 36.06], [3.44, 36.08], [3.46, 36.08], [3.46, 36.1], [3.48, 36.1], [3.5, 36.1], [3.5, 36.12], [3.5, 36.14], [3.48, 36.14], [3.48, 36.16], [3.48, 36.18], [3.48, 36.2], [3.5, 36.2], [3.52, 36.2], [3.54, 36.2], [3.56, 36.2], [3.56, 36.22], [3.56, 36.24], [3.56, 36.26], [3.54, 36.26], [3.56, 36.26], [3.54, 36.26], [3.54, 36.28], [3.54, 36.26], [3.54, 36.28], [3.52, 36.28], [3.54, 36.28], [3.54, 36.3], [3.54, 36.32], [3.54, 36.34], [3.56, 36.34], [3.58, 36.34], [3.6, 36.34], [3.6, 36.36], [3.58, 36.36], [3.56, 36.36], [3.56, 36.38], [3.54, 36.38], [3.54, 36.4], [3.56, 36.4], [3.54, 36.4], [3.56, 36.4], [3.56, 36.42], [3.56, 36.4], [3.56, 36.42], [3.56, 36.44], [3.54, 36.44], [3.54, 36.42], [3.54, 36.44], [3.52, 36.44], [3.5, 36.44], [3.5, 36.46], [3.48, 36.46], [3.48, 36.44], [3.46, 36.44], [3.46, 36.42], [3.44, 36.42], [3.42, 36.42], [3.44, 36.42], [3.44, 36.4], [3.42, 36.4], [3.42, 36.42], [3.4, 36.42], [3.4, 36.44], [3.38, 36.44], [3.38, 36.46], [3.36, 36.46], [3.36, 36.48], [3.34, 36.48], [3.32, 36.48], [3.32, 36.5], [3.3, 36.5], [3.28, 36.5], [3.28, 36.48], [3.26, 36.48], [3.24, 36.48], [3.22, 36.48], [3.22, 36.5], [3.22, 36.48], [3.22, 36.5], [3.22, 36.48], [3.22, 36.5], [3.22, 36.48], [3.22, 36.5], [3.22, 36.48], [3.22, 36.5], [3.2, 36.5], [3.2, 36.48], [3.18, 36.48], [3.18, 36.46], [3.18, 36.44], [3.16, 36.44], [3.16, 36.42], [3.16, 36.4], [3.16, 36.42], [3.16, 36.4], [3.14, 36.4], [3.12, 36.4], [3.12, 36.42], [3.1, 36.42], [3.08, 36.42], [3.08, 36.4], [3.06, 36.4], [3.06, 36.42], [3.06, 36.44], [3.04, 36.44], [3.04, 36.42], [3.06, 36.42], [3.06, 36.4], [3.04, 36.4], [3.06, 36.4], [3.04, 36.4], [3.06, 36.4], [3.06, 36.38], [3.04, 36.38], [3.04, 36.36], [3.02, 36.36], [3.02, 36.34], [3, 36.34], [3, 36.36], [2.98, 36.36], [2.98, 36.34], [2.98, 36.36], [2.96, 36.36], [2.96, 36.34], [2.94, 36.34], [2.94, 36.36], [2.94, 36.34], [2.94, 36.36], [2.94, 36.34], [2.94, 36.36], [2.92, 36.36], [2.92, 36.38], [2.94, 36.38], [2.92, 36.38], [2.92, 36.4], [2.9, 36.4], [2.88, 36.4], [2.86, 36.4], [2.86, 36.38], [2.84, 36.38], [2.84, 36.36], [2.84, 36.38], [2.84, 36.36], [2.82, 36.36], [2.8, 36.36], [2.8, 36.38], [2.8, 36.36], [2.8, 36.38], [2.78, 36.38], [2.78, 36.36], [2.78, 36.38], [2.78, 36.36], [2.78, 36.38], [2.76, 36.38], [2.74, 36.38], [2.72, 36.38], [2.7, 36.38], [2.7, 36.36], [2.68, 36.36], [2.66, 36.36], [2.66, 36.34], [2.66, 36.36], [2.66, 36.34], [2.64, 36.34], [2.62, 36.34], [2.62, 36.32], [2.6, 36.32], [2.58, 36.32], [2.58, 36.3], [2.56, 36.32], [2.54, 36.32], [2.52, 36.32], [2.52, 36.3], [2.52, 36.28], [2.52, 36.26], [2.5, 36.26], [2.5, 36.24], [2.48, 36.24], [2.5, 36.24], [2.5, 36.22], [2.52, 36.22], [2.5, 36.22], [2.5, 36.2], [2.52, 36.2], [2.52, 36.18], [2.54, 36.18], [2.56, 36.18], [2.54, 36.18], [2.56, 36.18], [2.56, 36.16], [2.58, 36.16], [2.6, 36.16], [2.58, 36.16], [2.58, 36.14], [2.6, 36.14], [2.58, 36.14], [2.6, 36.14], [2.58, 36.14], [2.6, 36.14], [2.6, 36.12], [2.58, 36.12], [2.6, 36.12], [2.6, 36.1], [2.58, 36.1], [2.56, 36.1], [2.56, 36.08], [2.54, 36.08], [2.52, 36.08], [2.52, 36.06], [2.5, 36.06], [2.5, 36.04], [2.48, 36.06], [2.46, 36.06], [2.46, 36.04], [2.46, 36.02], [2.46, 36], [2.46, 35.98], [2.44, 35.98], [2.46, 35.98], [2.46, 35.96], [2.44, 35.96], [2.44, 35.94], [2.42, 35.94], [2.4, 35.94], [2.4, 35.96], [2.38, 35.96], [2.38, 35.94], [2.38, 35.96], [2.38, 35.94], [2.38, 35.96], [2.36, 35.96], [2.34, 35.96], [2.34, 35.94], [2.36, 35.94], [2.36, 35.92], [2.34, 35.92], [2.36, 35.92], [2.36, 35.9], [2.34, 35.9], [2.36, 35.9], [2.34, 35.9], [2.32, 35.9], [2.32, 35.88], [2.32, 35.86], [2.32, 35.84], [2.3, 35.84], [2.3, 35.82], [2.3, 35.8], [2.28, 35.8], [2.28, 35.78], [2.28, 35.76], [2.28, 35.74], [2.26, 35.72], [2.24, 35.72], [2.22, 35.72], [2.22, 35.74], [2.2, 35.74], [2.18, 35.74], [2.16, 35.74], [2.16, 35.72], [2.14, 35.72]]] } }, { type: "Feature", properties: { code: 27, fr: "Mostaganem", ar: "\u0645\u0633\u062A\u063A\u0627\u0646\u0645", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[-0.12, 35.78], [-0.1, 35.78], [-0.1, 35.76], [-0.1, 35.74], [-0.08, 35.74], [-0.06, 35.74], [-0.06, 35.72], [-0.04, 35.72], [-0.02, 35.72], [0, 35.72], [-0.02, 35.72], [0, 35.72], [0, 35.74], [0.02, 35.74], [0.04, 35.74], [0.06, 35.74], [0.08, 35.72], [0.1, 35.72], [0.1, 35.7], [0.12, 35.7], [0.14, 35.7], [0.14, 35.68], [0.14, 35.7], [0.16, 35.7], [0.16, 35.68], [0.16, 35.7], [0.18, 35.7], [0.18, 35.72], [0.2, 35.72], [0.2, 35.7], [0.22, 35.7], [0.22, 35.72], [0.22, 35.7], [0.24, 35.7], [0.24, 35.72], [0.24, 35.74], [0.26, 35.74], [0.28, 35.74], [0.28, 35.76], [0.26, 35.76], [0.28, 35.76], [0.3, 35.76], [0.3, 35.78], [0.32, 35.78], [0.3, 35.78], [0.32, 35.78], [0.34, 35.78], [0.34, 35.8], [0.36, 35.8], [0.38, 35.8], [0.4, 35.8], [0.38, 35.8], [0.4, 35.8], [0.4, 35.82], [0.42, 35.82], [0.42, 35.84], [0.44, 35.84], [0.46, 35.84], [0.46, 35.86], [0.46, 35.88], [0.44, 35.88], [0.46, 35.88], [0.46, 35.9], [0.48, 35.9], [0.46, 35.9], [0.46, 35.92], [0.48, 35.92], [0.46, 35.92], [0.44, 35.92], [0.44, 35.94], [0.44, 35.96], [0.42, 35.96], [0.44, 35.96], [0.44, 35.98], [0.46, 35.98], [0.46, 36], [0.46, 35.98], [0.48, 35.98], [0.5, 35.98], [0.52, 35.98], [0.52, 35.96], [0.52, 35.98], [0.54, 35.98], [0.54, 36], [0.56, 36], [0.56, 35.98], [0.58, 35.98], [0.6, 35.98], [0.6, 36], [0.62, 36], [0.64, 36], [0.66, 36], [0.64, 36], [0.66, 36], [0.64, 36], [0.66, 36], [0.66, 36.02], [0.64, 36.02], [0.64, 36.04], [0.66, 36.04], [0.66, 36.06], [0.64, 36.06], [0.64, 36.08], [0.62, 36.08], [0.62, 36.1], [0.6, 36.1], [0.62, 36.1], [0.6, 36.1], [0.6, 36.12], [0.62, 36.12], [0.6, 36.12], [0.62, 36.12], [0.62, 36.14], [0.64, 36.14], [0.64, 36.16], [0.66, 36.16], [0.66, 36.14], [0.66, 36.16], [0.66, 36.18], [0.68, 36.18], [0.7, 36.18], [0.7, 36.2], [0.68, 36.2], [0.7, 36.2], [0.7, 36.22], [0.7, 36.24], [0.7, 36.26], [0.72, 36.26], [0.72, 36.28], [0.72, 36.3], [0.74, 36.3], [0.74, 36.32], [0.74, 36.34], [0.72, 36.34], [0.7, 36.34], [0.68, 36.34], [0.68, 36.32], [0.68, 36.34], [0.68, 36.32], [0.68, 36.34], [0.68, 36.32], [0.66, 36.32], [0.66, 36.34], [0.66, 36.32], [0.64, 36.32], [0.64, 36.3], [0.62, 36.3], [0.6, 36.3], [0.6, 36.28], [0.58, 36.28], [0.56, 36.28], [0.54, 36.28], [0.54, 36.26], [0.54, 36.28], [0.54, 36.26], [0.52, 36.26], [0.54, 36.26], [0.52, 36.26], [0.5, 36.26], [0.5, 36.24], [0.48, 36.24], [0.48, 36.22], [0.46, 36.22], [0.44, 36.22], [0.42, 36.22], [0.42, 36.2], [0.4, 36.2], [0.4, 36.22], [0.4, 36.2], [0.4, 36.22], [0.4, 36.2], [0.4, 36.22], [0.38, 36.22], [0.38, 36.2], [0.36, 36.2], [0.34, 36.2], [0.34, 36.18], [0.34, 36.16], [0.32, 36.16], [0.3, 36.14], [0.28, 36.14], [0.28, 36.12], [0.28, 36.14], [0.26, 36.14], [0.26, 36.12], [0.24, 36.12], [0.22, 36.12], [0.22, 36.1], [0.2, 36.1], [0.2, 36.08], [0.18, 36.08], [0.16, 36.06], [0.14, 36.06], [0.14, 36.04], [0.12, 36.04], [0.12, 36.02], [0.12, 36], [0.1, 36], [0.1, 35.98], [0.1, 35.96], [0.08, 35.96], [0.08, 35.94], [0.06, 35.94], [0.08, 35.94], [0.08, 35.92], [0.06, 35.92], [0.06, 35.9], [0.06, 35.92], [0.06, 35.9], [0.04, 35.9], [0.04, 35.88], [0.04, 35.86], [0.02, 35.86], [0.02, 35.84], [0, 35.84], [-0.02, 35.84], [-0.02, 35.82], [-0.04, 35.82], [-0.06, 35.82], [-0.06, 35.8], [-0.08, 35.8], [-0.1, 35.8], [-0.1, 35.78], [-0.12, 35.78]]] } }, { type: "Feature", properties: { code: 28, fr: "M'Sila", ar: "\u0627\u0644\u0645\u0633\u064A\u0644\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[3.36, 35.76], [3.38, 35.76], [3.38, 35.74], [3.38, 35.72], [3.38, 35.7], [3.4, 35.7], [3.42, 35.68], [3.44, 35.68], [3.44, 35.66], [3.46, 35.66], [3.46, 35.64], [3.48, 35.64], [3.48, 35.62], [3.5, 35.62], [3.52, 35.62], [3.52, 35.6], [3.54, 35.6], [3.54, 35.58], [3.56, 35.58], [3.58, 35.58], [3.58, 35.56], [3.6, 35.56], [3.62, 35.54], [3.64, 35.54], [3.64, 35.52], [3.66, 35.52], [3.68, 35.52], [3.68, 35.5], [3.68, 35.48], [3.7, 35.48], [3.68, 35.46], [3.68, 35.44], [3.68, 35.42], [3.68, 35.4], [3.66, 35.4], [3.64, 35.4], [3.66, 35.36], [3.66, 35.32], [3.64, 35.3], [3.62, 35.28], [3.6, 35.28], [3.6, 35.26], [3.58, 35.26], [3.58, 35.24], [3.56, 35.24], [3.54, 35.24], [3.54, 35.22], [3.52, 35.22], [3.5, 35.2], [3.48, 35.2], [3.48, 35.18], [3.46, 35.18], [3.46, 35.16], [3.48, 35.16], [3.48, 35.14], [3.48, 35.12], [3.5, 35.12], [3.5, 35.1], [3.5, 35.08], [3.52, 35.08], [3.52, 35.06], [3.54, 35.06], [3.56, 35.06], [3.56, 35.08], [3.58, 35.08], [3.6, 35.08], [3.58, 35.02], [3.54, 35.02], [3.56, 35], [3.56, 34.98], [3.58, 34.98], [3.58, 34.96], [3.58, 34.94], [3.56, 34.94], [3.58, 34.92], [3.58, 34.9], [3.58, 34.88], [3.56, 34.86], [3.6, 34.86], [3.62, 34.86], [3.64, 34.86], [3.62, 34.84], [3.64, 34.82], [3.64, 34.8], [3.66, 34.78], [3.7, 34.8], [3.72, 34.8], [3.74, 34.78], [3.76, 34.78], [3.78, 34.78], [3.8, 34.78], [3.82, 34.78], [3.9, 34.76], [3.9, 34.74], [3.9, 34.72], [3.9, 34.7], [3.9, 34.66], [3.9, 34.64], [3.92, 34.6], [3.92, 34.56], [3.92, 34.54], [3.9, 34.54], [3.9, 34.52], [3.92, 34.5], [3.98, 34.44], [3.98, 34.42], [3.98, 34.4], [3.98, 34.38], [3.98, 34.36], [3.98, 34.34], [4, 34.34], [4.02, 34.34], [4.02, 34.32], [4.04, 34.32], [4.06, 34.32], [4.06, 34.3], [4.08, 34.3], [4.1, 34.3], [4.1, 34.28], [4.12, 34.28], [4.12, 34.26], [4.1, 34.26], [4.12, 34.26], [4.12, 34.24], [4.14, 34.24], [4.14, 34.22], [4.16, 34.22], [4.18, 34.22], [4.18, 34.24], [4.2, 34.24], [4.2, 34.22], [4.22, 34.22], [4.22, 34.24], [4.24, 34.24], [4.26, 34.24], [4.28, 34.24], [4.28, 34.26], [4.26, 34.26], [4.28, 34.26], [4.3, 34.26], [4.3, 34.28], [4.28, 34.28], [4.26, 34.3], [4.24, 34.3], [4.24, 34.32], [4.22, 34.32], [4.22, 34.34], [4.24, 34.34], [4.22, 34.34], [4.22, 34.36], [4.2, 34.36], [4.2, 34.38], [4.2, 34.36], [4.2, 34.38], [4.18, 34.38], [4.18, 34.4], [4.16, 34.4], [4.16, 34.42], [4.16, 34.44], [4.16, 34.46], [4.16, 34.48], [4.16, 34.5], [4.16, 34.52], [4.14, 34.52], [4.14, 34.54], [4.16, 34.54], [4.18, 34.54], [4.18, 34.56], [4.2, 34.56], [4.2, 34.58], [4.22, 34.58], [4.24, 34.58], [4.24, 34.6], [4.24, 34.62], [4.26, 34.64], [4.28, 34.64], [4.28, 34.66], [4.3, 34.66], [4.32, 34.66], [4.34, 34.66], [4.36, 34.66], [4.38, 34.66], [4.4, 34.66], [4.42, 34.66], [4.44, 34.66], [4.46, 34.66], [4.48, 34.66], [4.5, 34.66], [4.52, 34.66], [4.52, 34.68], [4.54, 34.68], [4.56, 34.68], [4.58, 34.68], [4.58, 34.7], [4.6, 34.7], [4.62, 34.7], [4.62, 34.68], [4.64, 34.68], [4.64, 34.7], [4.66, 34.7], [4.68, 34.7], [4.68, 34.72], [4.66, 34.72], [4.64, 34.72], [4.64, 34.74], [4.62, 34.74], [4.62, 34.76], [4.64, 34.76], [4.66, 34.78], [4.66, 34.76], [4.66, 34.78], [4.68, 34.78], [4.68, 34.8], [4.7, 34.8], [4.7, 34.82], [4.72, 34.82], [4.74, 34.82], [4.76, 34.82], [4.76, 34.84], [4.76, 34.82], [4.78, 34.82], [4.8, 34.82], [4.8, 34.84], [4.82, 34.84], [4.84, 34.84], [4.86, 34.84], [4.88, 34.84], [4.9, 34.84], [4.9, 34.86], [4.92, 34.86], [4.94, 34.86], [4.94, 34.88], [4.96, 34.88], [4.98, 34.88], [4.98, 34.9], [5, 34.9], [5, 34.92], [5, 34.94], [5.02, 34.94], [5, 34.94], [5, 34.96], [5.02, 34.98], [5.02, 35], [5, 35], [5, 35.02], [5, 35.04], [5, 35.08], [4.98, 35.08], [4.98, 35.1], [4.96, 35.1], [4.98, 35.12], [4.96, 35.12], [4.94, 35.12], [4.9, 35.14], [4.88, 35.14], [4.86, 35.14], [4.84, 35.14], [4.82, 35.14], [4.8, 35.14], [4.78, 35.14], [4.76, 35.14], [4.74, 35.14], [4.74, 35.16], [4.74, 35.18], [4.76, 35.18], [4.76, 35.2], [4.78, 35.2], [4.8, 35.2], [4.8, 35.22], [4.82, 35.2], [4.82, 35.22], [4.84, 35.22], [4.86, 35.24], [4.86, 35.26], [4.86, 35.28], [4.88, 35.34], [4.88, 35.36], [4.88, 35.38], [4.88, 35.4], [4.88, 35.42], [4.88, 35.44], [4.88, 35.46], [4.86, 35.46], [4.86, 35.48], [4.86, 35.5], [4.86, 35.52], [4.86, 35.54], [4.86, 35.52], [4.88, 35.52], [4.9, 35.52], [4.9, 35.5], [4.9, 35.48], [4.92, 35.48], [4.94, 35.48], [4.94, 35.46], [4.94, 35.48], [4.96, 35.48], [4.96, 35.5], [4.98, 35.5], [4.98, 35.52], [5, 35.52], [5, 35.5], [5.02, 35.5], [5.02, 35.52], [5.04, 35.52], [5.04, 35.54], [5.04, 35.52], [5.06, 35.52], [5.08, 35.52], [5.1, 35.52], [5.1, 35.5], [5.12, 35.48], [5.12, 35.5], [5.14, 35.5], [5.16, 35.5], [5.16, 35.52], [5.18, 35.52], [5.18, 35.5], [5.18, 35.52], [5.2, 35.52], [5.22, 35.52], [5.22, 35.54], [5.22, 35.56], [5.24, 35.56], [5.26, 35.56], [5.26, 35.58], [5.28, 35.58], [5.3, 35.58], [5.3, 35.6], [5.32, 35.6], [5.32, 35.62], [5.34, 35.62], [5.34, 35.64], [5.32, 35.64], [5.3, 35.64], [5.28, 35.64], [5.26, 35.64], [5.26, 35.66], [5.24, 35.66], [5.24, 35.64], [5.24, 35.66], [5.22, 35.66], [5.22, 35.64], [5.22, 35.66], [5.2, 35.66], [5.18, 35.66], [5.16, 35.66], [5.16, 35.68], [5.14, 35.68], [5.14, 35.7], [5.16, 35.7], [5.14, 35.7], [5.16, 35.7], [5.16, 35.72], [5.14, 35.72], [5.12, 35.72], [5.1, 35.72], [5.08, 35.72], [5.08, 35.74], [5.06, 35.74], [5.06, 35.76], [5.04, 35.76], [5.02, 35.76], [5.04, 35.76], [5.04, 35.78], [5.02, 35.78], [5, 35.78], [5, 35.76], [4.98, 35.76], [4.98, 35.78], [4.98, 35.76], [4.96, 35.76], [4.96, 35.78], [4.96, 35.8], [4.96, 35.82], [4.94, 35.82], [4.92, 35.82], [4.9, 35.82], [4.9, 35.84], [4.88, 35.84], [4.88, 35.86], [4.86, 35.86], [4.84, 35.86], [4.84, 35.88], [4.84, 35.86], [4.82, 35.86], [4.8, 35.86], [4.78, 35.86], [4.76, 35.86], [4.74, 35.86], [4.72, 35.86], [4.7, 35.86], [4.7, 35.84], [4.68, 35.84], [4.66, 35.84], [4.64, 35.84], [4.64, 35.82], [4.62, 35.82], [4.62, 35.8], [4.6, 35.8], [4.6, 35.82], [4.58, 35.82], [4.58, 35.84], [4.6, 35.84], [4.6, 35.86], [4.6, 35.88], [4.58, 35.86], [4.56, 35.86], [4.54, 35.86], [4.56, 35.86], [4.54, 35.86], [4.54, 35.84], [4.54, 35.86], [4.54, 35.84], [4.54, 35.82], [4.56, 35.82], [4.54, 35.82], [4.52, 35.82], [4.5, 35.82], [4.48, 35.82], [4.46, 35.82], [4.44, 35.82], [4.42, 35.82], [4.42, 35.84], [4.42, 35.86], [4.44, 35.86], [4.44, 35.88], [4.46, 35.88], [4.46, 35.9], [4.46, 35.92], [4.46, 35.9], [4.46, 35.92], [4.48, 35.92], [4.5, 35.92], [4.52, 35.92], [4.54, 35.92], [4.52, 35.92], [4.52, 35.94], [4.52, 35.96], [4.5, 35.96], [4.52, 35.96], [4.5, 35.96], [4.5, 35.98], [4.5, 36], [4.5, 36.02], [4.48, 36.02], [4.5, 36.02], [4.5, 36.04], [4.48, 36.04], [4.46, 36.04], [4.44, 36.04], [4.44, 36.02], [4.42, 36.02], [4.42, 36], [4.4, 36.02], [4.4, 36], [4.38, 36], [4.36, 36], [4.36, 35.98], [4.34, 35.98], [4.32, 35.98], [4.32, 36], [4.32, 35.98], [4.3, 35.98], [4.3, 36], [4.3, 35.98], [4.28, 36], [4.3, 36], [4.28, 36], [4.3, 36], [4.28, 36], [4.26, 36], [4.24, 36], [4.24, 36.02], [4.22, 36.02], [4.2, 36.02], [4.18, 36.02], [4.16, 36.02], [4.14, 36.02], [4.14, 36], [4.12, 36], [4.1, 36], [4.08, 36], [4.1, 36], [4.08, 36], [4.1, 36.02], [4.08, 36.02], [4.1, 36.02], [4.08, 36.02], [4.08, 36.04], [4.06, 36.04], [4.06, 36.02], [4.08, 36.02], [4.06, 36.02], [4.08, 36.02], [4.08, 36], [4.06, 36], [4.06, 35.98], [4.04, 35.98], [4.04, 35.96], [4.04, 35.94], [4.02, 35.94], [4.02, 35.92], [4.02, 35.9], [4.02, 35.88], [4.04, 35.88], [4.02, 35.88], [4.04, 35.88], [4.02, 35.88], [4.04, 35.88], [4.04, 35.86], [4.02, 35.86], [4, 35.86], [3.98, 35.86], [3.98, 35.88], [3.96, 35.88], [3.94, 35.88], [3.94, 35.9], [3.92, 35.88], [3.92, 35.9], [3.9, 35.9], [3.9, 35.88], [3.88, 35.88], [3.88, 35.86], [3.86, 35.86], [3.84, 35.86], [3.82, 35.86], [3.8, 35.86], [3.8, 35.88], [3.8, 35.9], [3.78, 35.9], [3.76, 35.9], [3.74, 35.9], [3.74, 35.92], [3.72, 35.92], [3.72, 35.94], [3.7, 35.94], [3.68, 35.94], [3.66, 35.94], [3.64, 35.94], [3.64, 35.92], [3.62, 35.92], [3.6, 35.92], [3.62, 35.9], [3.62, 35.88], [3.6, 35.88], [3.58, 35.88], [3.58, 35.86], [3.6, 35.86], [3.6, 35.84], [3.58, 35.84], [3.56, 35.84], [3.54, 35.82], [3.52, 35.82], [3.5, 35.82], [3.52, 35.82], [3.52, 35.8], [3.52, 35.78], [3.54, 35.78], [3.54, 35.76], [3.54, 35.74], [3.54, 35.7], [3.54, 35.66], [3.52, 35.66], [3.52, 35.68], [3.5, 35.68], [3.5, 35.7], [3.48, 35.72], [3.48, 35.74], [3.46, 35.74], [3.46, 35.76], [3.46, 35.78], [3.44, 35.78], [3.44, 35.8], [3.42, 35.8], [3.42, 35.82], [3.4, 35.82], [3.38, 35.82], [3.38, 35.8], [3.38, 35.78], [3.4, 35.78], [3.38, 35.78], [3.38, 35.76], [3.36, 35.76]]] } }, { type: "Feature", properties: { code: 29, fr: "Mascara", ar: "\u0645\u0639\u0633\u0643\u0631", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[-0.52, 35.44], [-0.5, 35.44], [-0.5, 35.42], [-0.48, 35.42], [-0.48, 35.44], [-0.46, 35.44], [-0.44, 35.44], [-0.44, 35.46], [-0.42, 35.46], [-0.42, 35.44], [-0.4, 35.44], [-0.4, 35.42], [-0.42, 35.42], [-0.42, 35.4], [-0.4, 35.4], [-0.42, 35.4], [-0.42, 35.38], [-0.42, 35.36], [-0.4, 35.36], [-0.38, 35.36], [-0.36, 35.36], [-0.34, 35.36], [-0.34, 35.38], [-0.32, 35.38], [-0.32, 35.4], [-0.3, 35.4], [-0.3, 35.38], [-0.3, 35.36], [-0.28, 35.36], [-0.28, 35.38], [-0.28, 35.36], [-0.26, 35.36], [-0.24, 35.36], [-0.22, 35.36], [-0.2, 35.36], [-0.2, 35.34], [-0.2, 35.36], [-0.18, 35.36], [-0.18, 35.34], [-0.18, 35.36], [-0.18, 35.34], [-0.16, 35.34], [-0.16, 35.32], [-0.18, 35.32], [-0.18, 35.3], [-0.2, 35.3], [-0.2, 35.28], [-0.22, 35.28], [-0.24, 35.28], [-0.24, 35.26], [-0.24, 35.24], [-0.22, 35.24], [-0.22, 35.26], [-0.2, 35.26], [-0.18, 35.26], [-0.18, 35.28], [-0.16, 35.28], [-0.14, 35.28], [-0.14, 35.26], [-0.12, 35.26], [-0.14, 35.26], [-0.16, 35.26], [-0.18, 35.26], [-0.18, 35.24], [-0.2, 35.24], [-0.2, 35.22], [-0.18, 35.22], [-0.2, 35.22], [-0.2, 35.2], [-0.22, 35.2], [-0.2, 35.2], [-0.2, 35.18], [-0.22, 35.18], [-0.2, 35.18], [-0.22, 35.18], [-0.2, 35.18], [-0.18, 35.18], [-0.18, 35.16], [-0.18, 35.14], [-0.18, 35.12], [-0.16, 35.12], [-0.14, 35.12], [-0.12, 35.12], [-0.12, 35.14], [-0.12, 35.16], [-0.1, 35.16], [-0.08, 35.16], [-0.08, 35.14], [-0.1, 35.14], [-0.08, 35.14], [-0.08, 35.12], [-0.08, 35.1], [-0.06, 35.1], [-0.04, 35.1], [-0.02, 35.1], [-0.02, 35.08], [0, 35.08], [0, 35.1], [0.02, 35.1], [0.04, 35.1], [0.06, 35.1], [0.06, 35.08], [0.08, 35.08], [0.1, 35.08], [0.1, 35.06], [0.12, 35.06], [0.12, 35.08], [0.12, 35.06], [0.14, 35.06], [0.16, 35.06], [0.16, 35.08], [0.16, 35.06], [0.18, 35.06], [0.18, 35.04], [0.16, 35.04], [0.18, 35.04], [0.18, 35.02], [0.2, 35.02], [0.22, 35.02], [0.24, 35.02], [0.24, 35.04], [0.26, 35.04], [0.26, 35.02], [0.26, 35.04], [0.28, 35.04], [0.28, 35.06], [0.3, 35.06], [0.32, 35.06], [0.32, 35.08], [0.34, 35.08], [0.34, 35.06], [0.36, 35.06], [0.36, 35.04], [0.38, 35.04], [0.38, 35.06], [0.4, 35.06], [0.4, 35.04], [0.42, 35.04], [0.44, 35.04], [0.44, 35.06], [0.46, 35.06], [0.46, 35.08], [0.48, 35.08], [0.48, 35.1], [0.5, 35.12], [0.52, 35.14], [0.52, 35.16], [0.54, 35.16], [0.54, 35.18], [0.56, 35.18], [0.58, 35.18], [0.58, 35.2], [0.58, 35.18], [0.58, 35.2], [0.6, 35.2], [0.6, 35.22], [0.6, 35.2], [0.6, 35.22], [0.6, 35.2], [0.6, 35.22], [0.6, 35.24], [0.6, 35.26], [0.62, 35.26], [0.64, 35.26], [0.62, 35.26], [0.62, 35.28], [0.64, 35.28], [0.62, 35.28], [0.64, 35.28], [0.64, 35.3], [0.66, 35.3], [0.68, 35.3], [0.68, 35.32], [0.68, 35.3], [0.7, 35.3], [0.72, 35.3], [0.74, 35.3], [0.74, 35.28], [0.76, 35.28], [0.78, 35.28], [0.78, 35.3], [0.78, 35.28], [0.8, 35.28], [0.82, 35.28], [0.82, 35.3], [0.84, 35.3], [0.82, 35.3], [0.84, 35.3], [0.84, 35.32], [0.86, 35.32], [0.86, 35.34], [0.86, 35.36], [0.86, 35.38], [0.88, 35.38], [0.9, 35.38], [0.9, 35.4], [0.88, 35.4], [0.88, 35.42], [0.86, 35.42], [0.84, 35.42], [0.84, 35.44], [0.82, 35.44], [0.82, 35.46], [0.82, 35.44], [0.8, 35.44], [0.8, 35.46], [0.78, 35.46], [0.76, 35.46], [0.74, 35.46], [0.72, 35.46], [0.72, 35.48], [0.7, 35.48], [0.68, 35.48], [0.66, 35.48], [0.64, 35.48], [0.62, 35.5], [0.6, 35.5], [0.6, 35.52], [0.58, 35.52], [0.56, 35.52], [0.54, 35.52], [0.52, 35.52], [0.5, 35.52], [0.5, 35.54], [0.48, 35.54], [0.48, 35.56], [0.46, 35.56], [0.44, 35.56], [0.44, 35.58], [0.44, 35.56], [0.42, 35.56], [0.4, 35.56], [0.4, 35.58], [0.38, 35.58], [0.38, 35.56], [0.36, 35.56], [0.34, 35.56], [0.32, 35.56], [0.3, 35.56], [0.3, 35.58], [0.32, 35.58], [0.3, 35.58], [0.32, 35.58], [0.3, 35.58], [0.28, 35.58], [0.3, 35.58], [0.3, 35.6], [0.28, 35.6], [0.3, 35.6], [0.3, 35.62], [0.28, 35.62], [0.28, 35.64], [0.28, 35.66], [0.26, 35.66], [0.28, 35.66], [0.26, 35.66], [0.26, 35.68], [0.26, 35.7], [0.24, 35.7], [0.22, 35.7], [0.22, 35.72], [0.22, 35.7], [0.2, 35.7], [0.2, 35.72], [0.18, 35.72], [0.18, 35.7], [0.16, 35.7], [0.16, 35.68], [0.16, 35.7], [0.14, 35.7], [0.14, 35.68], [0.14, 35.7], [0.12, 35.7], [0.1, 35.7], [0.1, 35.72], [0.08, 35.72], [0.06, 35.74], [0.04, 35.74], [0.02, 35.74], [0, 35.74], [0, 35.72], [-0.02, 35.72], [0, 35.72], [-0.02, 35.72], [-0.04, 35.72], [-0.06, 35.72], [-0.06, 35.74], [-0.08, 35.74], [-0.1, 35.74], [-0.1, 35.76], [-0.1, 35.78], [-0.12, 35.78], [-0.12, 35.76], [-0.14, 35.76], [-0.14, 35.74], [-0.16, 35.74], [-0.16, 35.72], [-0.18, 35.72], [-0.18, 35.7], [-0.18, 35.72], [-0.18, 35.7], [-0.2, 35.7], [-0.22, 35.7], [-0.24, 35.7], [-0.24, 35.72], [-0.26, 35.72], [-0.26, 35.74], [-0.26, 35.72], [-0.28, 35.72], [-0.28, 35.7], [-0.28, 35.68], [-0.3, 35.68], [-0.28, 35.68], [-0.26, 35.68], [-0.28, 35.66], [-0.3, 35.66], [-0.32, 35.66], [-0.32, 35.64], [-0.34, 35.64], [-0.34, 35.62], [-0.36, 35.62], [-0.36, 35.6], [-0.38, 35.6], [-0.4, 35.6], [-0.38, 35.6], [-0.38, 35.58], [-0.38, 35.56], [-0.4, 35.56], [-0.4, 35.54], [-0.4, 35.52], [-0.42, 35.52], [-0.44, 35.52], [-0.46, 35.52], [-0.48, 35.52], [-0.48, 35.5], [-0.46, 35.5], [-0.46, 35.48], [-0.48, 35.48], [-0.48, 35.46], [-0.5, 35.46], [-0.52, 35.46], [-0.52, 35.44]]] } }, { type: "Feature", properties: { code: 30, fr: "Ouargla", ar: "\u0648\u0631\u0642\u0644\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[3, 29.08], [3.02, 29.06], [3.04, 29.06], [3.06, 29.04], [3.08, 29.02], [3.1, 29], [3.14, 28.98], [3.22, 28.92], [3.34, 28.82], [3.5, 28.72], [3.58, 28.66], [3.76, 28.52], [3.76, 28.5], [3.88, 28.58], [4, 28.66], [4.14, 28.76], [4.22, 28.8], [4.28, 28.84], [4.34, 28.88], [4.38, 28.9], [4.42, 28.94], [4.46, 28.96], [4.52, 29], [4.68, 29.1], [4.78, 29.16], [4.88, 29.24], [4.96, 29.28], [5, 29.3], [5.02, 29.32], [5.06, 29.34], [5.12, 29.38], [5.18, 29.42], [5.26, 29.46], [5.36, 29.54], [5.44, 29.58], [5.5, 29.62], [5.58, 29.66], [5.66, 29.72], [5.72, 29.76], [5.78, 29.78], [5.84, 29.82], [5.92, 29.84], [5.96, 29.86], [6, 29.88], [6.26, 30], [6.44, 30.08], [6.5, 30.06], [6.56, 30.04], [6.58, 30.04], [6.78, 30.08], [7, 30.12], [7.06, 30.14], [7.08, 30.14], [7.24, 30.18], [7.58, 30.24], [7.8, 30.28], [7.94, 30.3], [7.96, 30.3], [7.98, 30.3], [8, 30.3], [8.06, 30.32], [8.24, 30.34], [8.54, 30.4], [8.76, 30.44], [8.92, 30.46], [8.98, 30.48], [9, 30.48], [9.02, 30.48], [9.06, 30.5], [9.14, 30.5], [9.28, 30.52], [9.48, 30.56], [9.36, 31], [9.22, 31.52], [9.2, 31.6], [9.2, 31.64], [9.18, 31.66], [9.18, 31.68], [9.1, 32], [9.06, 32.08], [8.5, 32.06], [8.46, 32.06], [8.2, 32.06], [8.06, 32.04], [8.02, 32.04], [8, 32.04], [7.98, 32.04], [7.94, 32.04], [7.88, 32.04], [7.74, 32.04], [7.54, 32.02], [7.28, 32], [7.26, 32], [7.24, 32], [7.2, 32.02], [7.16, 32.02], [7.08, 32.06], [7.06, 32.06], [7.04, 32.08], [7.02, 32.08], [7, 32.1], [6.96, 32.12], [6.88, 32.14], [6.76, 32.18], [6.58, 32.24], [6.56, 32.24], [6.52, 32.26], [6.48, 32.28], [6.4, 32.3], [6.36, 32.32], [6.32, 32.32], [6.32, 32.34], [6.3, 32.36], [6.28, 32.38], [6.26, 32.42], [6.24, 32.44], [6.2, 32.48], [6.18, 32.52], [6.16, 32.54], [6.14, 32.58], [6.12, 32.6], [6.1, 32.62], [6.12, 32.78], [6.14, 32.9], [6, 32.84], [5.94, 32.9], [5.92, 32.96], [5.9, 32.98], [5.88, 33], [5.84, 33.02], [5.78, 33.08], [5.76, 33.1], [5.78, 33.16], [5.78, 33.18], [5.78, 33.2], [5.78, 33.22], [5.78, 33.24], [5.78, 33.26], [5.8, 33.26], [5.72, 33.34], [5.72, 33.4], [5.28, 33.42], [5.26, 33.4], [5.26, 33.38], [5.24, 33.36], [5.22, 33.36], [5.2, 33.38], [5.2, 33.4], [5.18, 33.4], [5.18, 33.42], [5.16, 33.42], [5.16, 33.44], [5.14, 33.44], [5.12, 33.44], [5.12, 33.46], [5.1, 33.46], [5.1, 33.48], [5.08, 33.48], [5.08, 33.5], [5.06, 33.5], [5.04, 33.48], [5.04, 33.46], [5.02, 33.42], [5, 33.4], [4.98, 33.38], [4.96, 33.34], [4.94, 33.3], [4.94, 33.26], [4.94, 33.2], [4.96, 33.14], [4.98, 33.06], [5, 33], [5, 32.98], [5, 32.96], [5, 32.94], [5.02, 32.92], [5.02, 32.9], [5.02, 32.88], [5.02, 32.86], [5.02, 32.84], [5, 32.82], [4.98, 32.8], [4.94, 32.74], [4.86, 32.62], [4.82, 32.54], [4.8, 32.5], [4.78, 32.5], [4.66, 32.38], [4.56, 32.3], [4.46, 32.22], [4.46, 32.2], [4.46, 32.18], [4.44, 32.14], [4.44, 32.12], [4.44, 32.08], [4.44, 32.04], [4.44, 32.02], [4.44, 32], [4.42, 32], [4.42, 31.92], [4.42, 31.8], [4.42, 31.78], [4.42, 31.72], [4.42, 31.62], [4.4, 31.56], [4.4, 31.54], [4.34, 31.4], [4.26, 31.24], [4.24, 31.22], [4.2, 31.08], [4.18, 31], [4.16, 30.98], [4.16, 30.96], [4.16, 30.94], [4.14, 30.9], [4.12, 30.84], [4.08, 30.76], [4.06, 30.68], [4.04, 30.6], [4.02, 30.58], [4.02, 30.54], [4, 30.52], [4, 30.5], [3.96, 30.42], [3.94, 30.36], [3.92, 30.28], [3.88, 30.18], [3.86, 30.12], [3.84, 30.06], [3.82, 30.02], [3.82, 30], [3.8, 29.94], [3.78, 29.88], [3.76, 29.86], [3.76, 29.84], [3.76, 29.82], [3.74, 29.8], [3.72, 29.8], [3.72, 29.78], [3.7, 29.78], [3.68, 29.78], [3.68, 29.76], [3.68, 29.74], [3.66, 29.72], [3.66, 29.68], [3.62, 29.66], [3.6, 29.62], [3.56, 29.56], [3.54, 29.5], [3.52, 29.48], [3.46, 29.38], [3.42, 29.32], [3.4, 29.26], [3.38, 29.24], [3.36, 29.22], [3.32, 29.2], [3.28, 29.18], [3.22, 29.16], [3.16, 29.14], [3.1, 29.12], [3.06, 29.1], [3.02, 29.1], [3, 29.08]]] } }, { type: "Feature", properties: { code: 31, fr: "Oran", ar: "\u0648\u0647\u0631\u0627\u0646", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "MultiPolygon", coordinates: [[[[-1.14, 35.72], [-1.12, 35.72], [-1.14, 35.72], [-1.12, 35.72], [-1.14, 35.72], [-1.12, 35.72], [-1.14, 35.72]]], [[[-1.06, 35.64], [-1.04, 35.64], [-1.04, 35.62], [-1.06, 35.62], [-1.04, 35.62], [-1.04, 35.6], [-1.02, 35.6], [-1.02, 35.58], [-1, 35.58], [-1, 35.56], [-0.98, 35.56], [-0.96, 35.56], [-0.96, 35.54], [-0.98, 35.52], [-0.98, 35.5], [-1, 35.5], [-1.02, 35.5], [-1.02, 35.48], [-1.02, 35.46], [-1, 35.46], [-1.02, 35.46], [-1, 35.46], [-1.02, 35.46], [-1, 35.46], [-1, 35.44], [-1, 35.46], [-1, 35.44], [-1, 35.46], [-1, 35.48], [-1, 35.46], [-1, 35.48], [-0.98, 35.48], [-0.96, 35.48], [-0.98, 35.48], [-0.98, 35.5], [-0.96, 35.5], [-0.96, 35.48], [-0.94, 35.48], [-0.92, 35.48], [-0.9, 35.48], [-0.88, 35.48], [-0.86, 35.48], [-0.84, 35.48], [-0.82, 35.48], [-0.82, 35.5], [-0.8, 35.5], [-0.78, 35.5], [-0.76, 35.5], [-0.76, 35.52], [-0.74, 35.52], [-0.72, 35.52], [-0.7, 35.52], [-0.68, 35.52], [-0.66, 35.52], [-0.64, 35.52], [-0.64, 35.54], [-0.62, 35.54], [-0.62, 35.52], [-0.62, 35.5], [-0.6, 35.5], [-0.6, 35.48], [-0.6, 35.46], [-0.6, 35.44], [-0.58, 35.44], [-0.58, 35.42], [-0.6, 35.42], [-0.62, 35.42], [-0.62, 35.4], [-0.6, 35.38], [-0.62, 35.38], [-0.62, 35.36], [-0.62, 35.34], [-0.6, 35.34], [-0.58, 35.34], [-0.58, 35.36], [-0.56, 35.36], [-0.54, 35.36], [-0.54, 35.38], [-0.56, 35.38], [-0.56, 35.4], [-0.54, 35.4], [-0.54, 35.42], [-0.52, 35.42], [-0.52, 35.44], [-0.52, 35.46], [-0.5, 35.46], [-0.48, 35.46], [-0.48, 35.48], [-0.46, 35.48], [-0.46, 35.5], [-0.48, 35.5], [-0.48, 35.52], [-0.46, 35.52], [-0.44, 35.52], [-0.42, 35.52], [-0.4, 35.52], [-0.4, 35.54], [-0.4, 35.56], [-0.38, 35.56], [-0.38, 35.58], [-0.38, 35.6], [-0.4, 35.6], [-0.38, 35.6], [-0.36, 35.6], [-0.36, 35.62], [-0.34, 35.62], [-0.34, 35.64], [-0.32, 35.64], [-0.32, 35.66], [-0.3, 35.66], [-0.28, 35.66], [-0.26, 35.68], [-0.28, 35.68], [-0.3, 35.68], [-0.28, 35.68], [-0.28, 35.7], [-0.28, 35.72], [-0.26, 35.72], [-0.26, 35.74], [-0.26, 35.72], [-0.24, 35.72], [-0.24, 35.7], [-0.22, 35.7], [-0.2, 35.7], [-0.18, 35.7], [-0.18, 35.72], [-0.18, 35.7], [-0.18, 35.72], [-0.16, 35.72], [-0.16, 35.74], [-0.14, 35.74], [-0.14, 35.76], [-0.12, 35.76], [-0.12, 35.78], [-0.14, 35.78], [-0.14, 35.8], [-0.16, 35.8], [-0.18, 35.8], [-0.18, 35.82], [-0.18, 35.8], [-0.2, 35.8], [-0.22, 35.8], [-0.24, 35.8], [-0.24, 35.82], [-0.22, 35.82], [-0.24, 35.82], [-0.24, 35.8], [-0.24, 35.82], [-0.24, 35.8], [-0.24, 35.82], [-0.26, 35.82], [-0.28, 35.82], [-0.3, 35.82], [-0.3, 35.84], [-0.3, 35.86], [-0.3, 35.84], [-0.3, 35.86], [-0.3, 35.84], [-0.3, 35.86], [-0.3, 35.88], [-0.32, 35.88], [-0.32, 35.9], [-0.34, 35.9], [-0.32, 35.9], [-0.34, 35.9], [-0.36, 35.9], [-0.38, 35.9], [-0.4, 35.9], [-0.4, 35.88], [-0.4, 35.9], [-0.4, 35.88], [-0.42, 35.88], [-0.44, 35.88], [-0.46, 35.88], [-0.48, 35.88], [-0.46, 35.88], [-0.48, 35.88], [-0.5, 35.88], [-0.48, 35.88], [-0.48, 35.86], [-0.48, 35.84], [-0.48, 35.82], [-0.5, 35.82], [-0.48, 35.82], [-0.5, 35.82], [-0.5, 35.8], [-0.5, 35.78], [-0.52, 35.78], [-0.52, 35.76], [-0.54, 35.76], [-0.54, 35.78], [-0.56, 35.78], [-0.54, 35.78], [-0.56, 35.78], [-0.56, 35.76], [-0.58, 35.76], [-0.58, 35.74], [-0.6, 35.74], [-0.6, 35.72], [-0.62, 35.72], [-0.64, 35.72], [-0.62, 35.72], [-0.64, 35.72], [-0.64, 35.7], [-0.64, 35.72], [-0.64, 35.7], [-0.64, 35.72], [-0.64, 35.7], [-0.64, 35.72], [-0.64, 35.7], [-0.66, 35.7], [-0.66, 35.72], [-0.64, 35.72], [-0.62, 35.72], [-0.64, 35.72], [-0.66, 35.72], [-0.68, 35.72], [-0.66, 35.72], [-0.68, 35.72], [-0.7, 35.72], [-0.7, 35.74], [-0.7, 35.72], [-0.68, 35.72], [-0.7, 35.72], [-0.7, 35.74], [-0.72, 35.74], [-0.74, 35.74], [-0.76, 35.74], [-0.78, 35.74], [-0.78, 35.76], [-0.8, 35.76], [-0.8, 35.78], [-0.8, 35.76], [-0.82, 35.76], [-0.84, 35.76], [-0.84, 35.74], [-0.84, 35.72], [-0.86, 35.72], [-0.88, 35.72], [-0.88, 35.7], [-0.9, 35.7], [-0.9, 35.72], [-0.92, 35.72], [-0.94, 35.72], [-0.96, 35.72], [-0.96, 35.7], [-0.98, 35.7], [-0.98, 35.68], [-0.98, 35.7], [-0.98, 35.68], [-1, 35.68], [-1.02, 35.68], [-1.04, 35.68], [-1.04, 35.66], [-1.06, 35.66], [-1.04, 35.66], [-1.06, 35.66], [-1.06, 35.64]]]] } }, { type: "Feature", properties: { code: 32, fr: "El Bayadh", ar: "\u0627\u0644\u0628\u064A\u0636", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[-0.42, 31.64], [-0.4, 31.62], [-0.4, 31.6], [-0.38, 31.58], [-0.36, 31.56], [-0.36, 31.54], [-0.38, 31.54], [-0.38, 31.52], [-0.4, 31.52], [-0.4, 31.5], [-0.4, 31.48], [-0.4, 31.46], [-0.4, 31.44], [-0.38, 31.42], [-0.38, 31.4], [-0.36, 31.38], [-0.36, 31.36], [-0.34, 31.36], [-0.32, 31.36], [-0.32, 31.34], [-0.3, 31.34], [-0.28, 31.32], [-0.26, 31.32], [-0.26, 31.3], [-0.24, 31.3], [-0.24, 31.28], [-0.22, 31.28], [-0.24, 31.26], [-0.24, 31.24], [-0.24, 31.22], [-0.26, 31.2], [-0.26, 31.18], [-0.26, 31.16], [-0.24, 31.14], [-0.22, 31.14], [-0.2, 31.12], [-0.18, 31.1], [-0.16, 31.1], [-0.14, 31.08], [-0.12, 31.06], [-0.1, 31.04], [-0.08, 31.04], [-0.06, 31.02], [-0.04, 31.02], [-0.04, 31], [-0.02, 30.98], [0, 30.98], [0.02, 30.96], [0.04, 30.96], [0.04, 30.94], [0.06, 30.94], [0.08, 30.92], [0.1, 30.9], [0.12, 30.9], [0.12, 30.88], [0.14, 30.88], [0.16, 30.86], [0.18, 30.86], [0.2, 30.84], [0.2, 30.82], [0.22, 30.82], [0.24, 30.8], [0.26, 30.8], [0.28, 30.78], [0.3, 30.78], [0.3, 30.76], [0.32, 30.74], [0.34, 30.74], [0.36, 30.72], [0.38, 30.7], [0.64, 30.86], [0.82, 30.98], [0.86, 31], [0.94, 31.04], [1, 31.08], [1.04, 31.12], [1.1, 31.14], [1.22, 31.22], [1.24, 31.22], [1.36, 31.28], [1.5, 31.36], [1.62, 31.42], [1.68, 31.46], [1.76, 31.5], [1.84, 31.54], [1.9, 31.58], [1.94, 31.6], [1.98, 31.62], [2, 31.62], [2.02, 31.64], [2.04, 31.64], [2.04, 31.66], [2.06, 31.66], [2.08, 31.68], [2.14, 31.74], [2.2, 31.8], [2.24, 31.84], [2.28, 31.86], [2.28, 31.9], [2.26, 31.94], [2.26, 31.96], [2.26, 31.98], [2.26, 32], [2.26, 32.02], [2.26, 32.04], [2.26, 32.06], [2.26, 32.08], [2.26, 32.1], [2.24, 32.12], [2.24, 32.14], [2.24, 32.16], [2.24, 32.18], [2.24, 32.2], [2.26, 32.2], [2.26, 32.22], [2.28, 32.22], [2.3, 32.22], [2.32, 32.24], [2.36, 32.26], [2.34, 32.3], [2.34, 32.36], [2.32, 32.42], [2.3, 32.48], [2.28, 32.54], [2.28, 32.56], [2.26, 32.62], [2.26, 32.68], [2.24, 32.74], [2.24, 32.8], [2.24, 32.82], [2.22, 32.82], [2.24, 32.82], [2.22, 32.84], [2.22, 32.86], [2.22, 32.88], [2.2, 32.9], [2.18, 32.9], [2.18, 32.92], [2.18, 32.94], [2.16, 32.94], [2.16, 32.96], [2.16, 32.98], [2.14, 33], [2.14, 33.02], [2.12, 33.04], [2.1, 33.06], [2.1, 33.08], [2.1, 33.1], [2.12, 33.1], [2.12, 33.12], [2.1, 33.14], [2.08, 33.14], [2.08, 33.16], [2.1, 33.16], [2.26, 33.16], [2.28, 33.2], [2.28, 33.22], [2.28, 33.24], [2.28, 33.26], [2.28, 33.28], [2.28, 33.32], [2.26, 33.3], [2.22, 33.3], [2.18, 33.3], [2.1, 33.32], [2.04, 33.34], [2.02, 33.34], [2.02, 33.36], [2.02, 33.4], [2, 33.4], [1.98, 33.4], [1.98, 33.42], [1.96, 33.42], [1.94, 33.42], [1.92, 33.42], [1.9, 33.42], [1.88, 33.42], [1.9, 33.44], [1.9, 33.46], [1.9, 33.48], [1.9, 33.5], [1.9, 33.52], [1.9, 33.54], [1.92, 33.56], [1.92, 33.58], [1.94, 33.58], [1.94, 33.6], [1.92, 33.6], [1.9, 33.6], [1.9, 33.62], [1.88, 33.62], [1.88, 33.64], [1.9, 33.64], [1.88, 33.64], [1.88, 33.66], [1.86, 33.66], [1.84, 33.66], [1.84, 33.68], [1.82, 33.68], [1.82, 33.66], [1.82, 33.68], [1.82, 33.7], [1.8, 33.7], [1.82, 33.7], [1.82, 33.72], [1.82, 33.74], [1.8, 33.74], [1.8, 33.76], [1.82, 33.76], [1.82, 33.78], [1.82, 33.8], [1.8, 33.8], [1.8, 33.82], [1.8, 33.84], [1.78, 33.84], [1.76, 33.84], [1.76, 33.86], [1.76, 33.88], [1.74, 33.88], [1.72, 33.88], [1.72, 33.9], [1.7, 33.9], [1.68, 33.9], [1.66, 33.9], [1.64, 33.9], [1.64, 33.88], [1.62, 33.88], [1.6, 33.88], [1.58, 33.88], [1.58, 33.86], [1.56, 33.86], [1.54, 33.88], [1.52, 33.88], [1.52, 33.9], [1.5, 33.9], [1.5, 33.92], [1.48, 33.92], [1.48, 33.94], [1.46, 33.94], [1.44, 33.94], [1.42, 33.96], [1.4, 33.96], [1.38, 33.98], [1.36, 33.98], [1.36, 34], [1.36, 34.02], [1.38, 34.02], [1.36, 34.02], [1.36, 34.04], [1.34, 34.04], [1.36, 34.06], [1.34, 34.06], [1.34, 34.08], [1.32, 34.08], [1.32, 34.1], [1.32, 34.12], [1.3, 34.12], [1.3, 34.14], [1.28, 34.14], [1.28, 34.16], [1.28, 34.18], [1.26, 34.18], [1.28, 34.18], [1.26, 34.18], [1.28, 34.18], [1.28, 34.2], [1.26, 34.2], [1.24, 34.2], [1.22, 34.2], [1.2, 34.2], [1.18, 34.2], [1.16, 34.2], [1.14, 34.2], [1.12, 34.2], [1.1, 34.2], [1.08, 34.2], [1.06, 34.2], [1.04, 34.2], [1.02, 34.2], [1.02, 34.22], [1.02, 34.24], [1.02, 34.26], [1.02, 34.28], [1.02, 34.3], [1.04, 34.3], [1.04, 34.32], [1.04, 34.34], [1.04, 34.36], [1.04, 34.38], [1, 34.4], [0.96, 34.4], [0.94, 34.4], [0.92, 34.4], [0.9, 34.4], [0.88, 34.42], [0.86, 34.42], [0.8, 34.42], [0.76, 34.44], [0.74, 34.44], [0.72, 34.44], [0.7, 34.44], [0.7, 34.42], [0.68, 34.42], [0.66, 34.42], [0.66, 34.4], [0.64, 34.4], [0.64, 34.38], [0.62, 34.38], [0.6, 34.38], [0.6, 34.36], [0.58, 34.36], [0.58, 34.34], [0.56, 34.34], [0.54, 34.34], [0.52, 34.34], [0.52, 34.32], [0.5, 34.32], [0.5, 34.34], [0.5, 34.36], [0.48, 34.36], [0.46, 34.38], [0.44, 34.4], [0.42, 34.4], [0.4, 34.38], [0.36, 34.38], [0.34, 34.36], [0.3, 34.32], [0.24, 34.34], [0.18, 34.34], [0.18, 34.36], [0.16, 34.36], [0.16, 34.38], [0.14, 34.38], [0.12, 34.4], [0.1, 34.4], [0.1, 34.42], [0.08, 34.42], [0.06, 34.42], [0.04, 34.42], [0.02, 34.42], [0.02, 34.44], [0, 34.44], [-0.02, 34.44], [-0.02, 34.42], [-0.02, 34.4], [0, 34.4], [0, 34.38], [0, 34.36], [0.02, 34.36], [0.02, 34.34], [0.02, 34.32], [0.02, 34.3], [0.02, 34.28], [0.02, 34.26], [0.04, 34.26], [0.04, 34.24], [0.04, 34.22], [0.02, 34.22], [0, 34.22], [0, 34.2], [-0.02, 34.18], [-0.02, 34.16], [-0.04, 34.16], [-0.04, 34.14], [-0.04, 34.12], [-0.06, 34.12], [-0.06, 34.1], [-0.08, 34.08], [-0.06, 34.08], [-0.06, 34.06], [-0.06, 34.04], [-0.06, 34.02], [-0.04, 34.02], [-0.04, 34], [-0.06, 34], [-0.06, 33.98], [-0.06, 34], [-0.04, 34], [-0.02, 34], [0, 34], [0, 34.02], [0.02, 34.02], [0.04, 34.02], [0.06, 34], [0.08, 34], [0.06, 33.98], [0.06, 33.96], [0.06, 33.94], [0.06, 33.92], [0.06, 33.9], [0.08, 33.88], [0.1, 33.88], [0.1, 33.86], [0.12, 33.86], [0.12, 33.84], [0.12, 33.82], [0.14, 33.82], [0.16, 33.8], [0.14, 33.8], [0.12, 33.78], [0.1, 33.78], [0.08, 33.78], [0.08, 33.76], [0.08, 33.74], [0.08, 33.72], [0.1, 33.7], [0.1, 33.68], [0.1, 33.66], [0.1, 33.64], [0.12, 33.64], [0.1, 33.62], [0.08, 33.58], [0.08, 33.54], [0.06, 33.5], [0.06, 33.48], [0.04, 33.42], [0.02, 33.34], [0.02, 33.32], [0.02, 33.3], [0.02, 33.28], [0, 33.26], [0, 33.24], [0, 33.22], [0, 33.2], [0, 33.18], [0, 33.16], [-0.02, 33.16], [-0.02, 33.14], [-0.02, 33.12], [-0.02, 33.1], [0, 33.1], [0, 33.08], [0.02, 33.08], [0.02, 33.06], [0.02, 33.04], [0.02, 33.02], [0, 33.02], [0, 33], [-0.02, 33], [0, 33], [0.02, 32.98], [0, 32.96], [0, 32.94], [0, 32.92], [-0.02, 32.92], [-0.04, 32.9], [-0.06, 32.9], [-0.08, 32.88], [-0.08, 32.86], [-0.1, 32.84], [-0.1, 32.82], [-0.08, 32.8], [-0.06, 32.8], [-0.06, 32.78], [-0.06, 32.76], [-0.06, 32.74], [-0.04, 32.72], [-0.02, 32.72], [-0.02, 32.7], [-0.02, 32.68], [-0.04, 32.66], [-0.04, 32.62], [-0.02, 32.62], [-0.02, 32.6], [-0.02, 32.58], [-0.02, 32.56], [-0.02, 32.54], [-0.04, 32.52], [-0.06, 32.48], [-0.06, 32.46], [-0.08, 32.44], [-0.1, 32.42], [-0.1, 32.4], [-0.12, 32.38], [-0.12, 32.36], [-0.14, 32.34], [-0.16, 32.34], [-0.16, 32.32], [-0.14, 32.3], [-0.16, 32.28], [-0.16, 32.26], [-0.16, 32.24], [-0.18, 32.22], [-0.18, 32.2], [-0.2, 32.2], [-0.2, 32.18], [-0.2, 32.16], [-0.22, 32.18], [-0.24, 32.18], [-0.26, 32.18], [-0.28, 32.18], [-0.3, 32.16], [-0.32, 32.16], [-0.34, 32.14], [-0.34, 32.12], [-0.36, 32.1], [-0.38, 32.08], [-0.36, 32.06], [-0.38, 32.06], [-0.38, 32.04], [-0.38, 32.02], [-0.4, 32], [-0.4, 31.98], [-0.4, 31.96], [-0.4, 31.94], [-0.4, 31.92], [-0.38, 31.92], [-0.38, 31.9], [-0.38, 31.88], [-0.36, 31.86], [-0.36, 31.84], [-0.36, 31.82], [-0.36, 31.8], [-0.38, 31.8], [-0.38, 31.78], [-0.38, 31.76], [-0.4, 31.76], [-0.4, 31.74], [-0.38, 31.72], [-0.38, 31.7], [-0.36, 31.68], [-0.38, 31.68], [-0.38, 31.66], [-0.4, 31.66], [-0.42, 31.64]]] } }, { type: "Feature", properties: { code: 33, fr: "Illizi", ar: "\u0625\u0644\u064A\u0632\u064A", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[5.64, 28.1], [5.66, 28], [5.68, 27.92], [5.7, 27.82], [5.72, 27.68], [5.74, 27.58], [5.76, 27.48], [5.78, 27.42], [5.78, 27.28], [5.78, 27.18], [5.76, 27.1], [5.76, 27.08], [5.8, 27.04], [5.86, 27], [5.86, 26.98], [5.9, 26.96], [5.94, 26.92], [6, 26.88], [6.02, 26.86], [6.04, 26.86], [6.06, 26.82], [6.08, 26.8], [6.12, 26.78], [6.14, 26.74], [6.18, 26.72], [6.22, 26.68], [6.24, 26.68], [6.24, 26.66], [6.26, 26.66], [6.26, 26.64], [6.28, 26.64], [6.28, 26.62], [6.3, 26.62], [6.3, 26.6], [6.3, 26.58], [6.3, 26.56], [6.32, 26.56], [6.32, 26.54], [6.3, 26.54], [6.3, 26.52], [6.28, 26.52], [6.28, 26.5], [6.26, 26.5], [6.26, 26.48], [6.24, 26.48], [6.24, 26.46], [6.22, 26.46], [6.2, 26.46], [6.18, 26.44], [6.18, 26.42], [6.16, 26.42], [6.16, 26.4], [6.18, 26.4], [6.18, 26.38], [6.16, 26.38], [6.16, 26.36], [6.16, 26.34], [6.14, 26.34], [6.14, 26.32], [6.16, 26.32], [6.16, 26.3], [6.18, 26.3], [6.18, 26.28], [6.2, 26.26], [6.22, 26.26], [6.24, 26.26], [6.24, 26.24], [6.26, 26.26], [6.26, 26.24], [6.28, 26.24], [6.28, 26.22], [6.28, 26.2], [6.3, 26.2], [6.32, 26.2], [6.32, 26.18], [6.34, 26.18], [6.34, 26.16], [6.36, 26.16], [6.36, 26.12], [6.38, 26.08], [6.4, 26.04], [6.4, 26.02], [6.42, 26], [6.58, 25.56], [7, 25.4], [7.24, 25.26], [7.44, 25.24], [7.46, 25.24], [7.46, 25.22], [7.48, 25.22], [7.5, 25.22], [7.5, 25.2], [7.52, 25.2], [7.54, 25.2], [7.56, 25.18], [7.58, 25.18], [7.58, 25.2], [7.6, 25.2], [7.62, 25.22], [7.64, 25.22], [7.66, 25.22], [7.68, 25.22], [7.7, 25.24], [7.72, 25.24], [7.74, 25.24], [7.82, 25.22], [7.84, 25.22], [7.86, 25.22], [7.88, 25.22], [7.9, 25.22], [7.92, 25.22], [7.94, 25.22], [7.94, 25.24], [7.94, 25.26], [7.96, 25.26], [7.96, 25.28], [7.96, 25.3], [7.98, 25.32], [7.98, 25.34], [8, 25.34], [8.02, 25.34], [8.02, 25.36], [8.02, 25.38], [8.04, 25.38], [8.14, 25.46], [8.16, 25.46], [8.18, 25.46], [8.2, 25.46], [8.22, 25.46], [8.24, 25.46], [8.24, 25.48], [8.26, 25.48], [8.28, 25.48], [8.28, 25.46], [8.3, 25.46], [8.32, 25.46], [8.34, 25.46], [8.34, 25.48], [8.36, 25.48], [8.34, 25.48], [8.36, 25.48], [8.36, 25.5], [8.34, 25.5], [8.36, 25.5], [8.36, 25.52], [8.36, 25.54], [8.38, 25.54], [8.4, 25.54], [8.42, 25.56], [8.44, 25.56], [8.62, 25.64], [8.7, 25.64], [8.84, 25.44], [8.84, 25.42], [8.86, 25.42], [8.88, 25.42], [8.86, 25.4], [8.88, 25.38], [8.88, 25.36], [8.88, 25.34], [8.9, 25.34], [8.94, 25.28], [9, 25.22], [9.06, 25.14], [10.04, 25.16], [10.04, 25.36], [9.98, 25.42], [9.76, 25.72], [9.54, 26], [9.4, 26.2], [9.42, 26.2], [9.42, 26.22], [9.44, 26.22], [9.44, 26.24], [9.46, 26.24], [9.46, 26.26], [9.46, 26.28], [9.46, 26.3], [9.48, 26.3], [9.48, 26.32], [9.48, 26.34], [9.5, 26.34], [9.5, 26.36], [9.5, 26.38], [9.52, 26.38], [9.76, 26.48], [9.86, 26.52], [9.92, 26.64], [9.9, 26.74], [9.92, 26.86], [9.92, 26.88], [9.9, 26.88], [9.9, 26.9], [9.88, 26.9], [9.88, 26.92], [9.86, 26.94], [9.86, 26.96], [9.86, 26.98], [9.84, 27], [9.84, 27.04], [9.84, 27.06], [9.84, 27.08], [9.84, 27.1], [9.82, 27.1], [9.82, 27.12], [9.82, 27.14], [9.82, 27.16], [9.8, 27.16], [9.8, 27.18], [9.8, 27.2], [9.8, 27.22], [9.8, 27.24], [9.78, 27.24], [9.78, 27.26], [9.78, 27.28], [9.78, 27.3], [9.78, 27.32], [9.8, 27.32], [9.8, 27.34], [9.8, 27.36], [9.78, 27.36], [9.78, 27.38], [9.8, 27.38], [9.8, 27.4], [9.8, 27.42], [9.82, 27.42], [9.8, 27.42], [9.8, 27.44], [9.82, 27.44], [9.82, 27.46], [9.82, 27.48], [9.84, 27.48], [9.84, 27.5], [9.86, 27.5], [9.86, 27.52], [9.86, 27.54], [9.88, 27.56], [9.82, 27.56], [9.82, 27.58], [9.84, 27.58], [9.86, 27.58], [9.86, 27.6], [9.88, 27.6], [9.9, 27.62], [9.9, 27.64], [9.92, 27.68], [9.92, 27.7], [9.94, 27.74], [9.94, 27.76], [9.94, 27.78], [9.94, 27.8], [9.94, 27.82], [9.94, 27.84], [9.94, 27.86], [9.96, 27.86], [9.96, 27.88], [9.92, 28], [9.92, 28.02], [9.9, 28.08], [9.88, 28.16], [9.86, 28.2], [9.84, 28.24], [9.84, 28.28], [9.84, 28.32], [9.84, 28.4], [9.86, 28.46], [9.86, 28.54], [9.9, 28.68], [9.9, 28.74], [9.9, 28.76], [9.9, 28.8], [9.9, 28.84], [9.88, 28.88], [9.88, 28.92], [9.88, 28.96], [9.88, 29], [9.88, 29.02], [9.86, 29.06], [9.86, 29.1], [9.84, 29.14], [9.84, 29.18], [9.82, 29.22], [9.82, 29.26], [9.82, 29.28], [9.8, 29.32], [9.8, 29.36], [9.78, 29.4], [9.78, 29.42], [9.76, 29.46], [9.74, 29.5], [9.72, 29.56], [9.7, 29.58], [9.7, 29.6], [9.68, 29.64], [9.66, 29.68], [9.64, 29.72], [9.62, 29.76], [9.58, 29.82], [9.54, 29.9], [9.54, 29.92], [9.5, 29.94], [9.46, 30], [9.44, 30], [9.42, 30.02], [9.42, 30.04], [9.4, 30.06], [9.4, 30.08], [9.4, 30.1], [9.4, 30.12], [9.4, 30.14], [9.4, 30.16], [9.4, 30.18], [9.42, 30.18], [9.44, 30.18], [9.46, 30.18], [9.46, 30.2], [9.48, 30.2], [9.5, 30.22], [9.52, 30.22], [9.54, 30.22], [9.56, 30.22], [9.56, 30.26], [9.48, 30.56], [9.28, 30.52], [9.14, 30.5], [9.06, 30.5], [9.02, 30.48], [9, 30.48], [8.98, 30.48], [8.92, 30.46], [8.76, 30.44], [8.54, 30.4], [8.24, 30.34], [8.06, 30.32], [8, 30.3], [7.98, 30.3], [7.96, 30.3], [7.94, 30.3], [7.8, 30.28], [7.58, 30.24], [7.24, 30.18], [7.08, 30.14], [7.06, 30.14], [7, 30.12], [6.78, 30.08], [6.58, 30.04], [6.56, 30.04], [6.5, 30.06], [6.44, 30.08], [6.26, 30], [6, 29.88], [5.96, 29.86], [5.92, 29.84], [5.84, 29.82], [5.78, 29.78], [5.72, 29.76], [5.72, 29.66], [5.72, 29.54], [5.72, 29.4], [5.72, 29.28], [5.72, 29.16], [5.72, 29.06], [5.72, 29.02], [5.72, 29], [5.72, 28.44], [5.64, 28.1]]] } }, { type: "Feature", properties: { code: 34, fr: "Bordj Bou Arreridj", ar: "\u0628\u0631\u062C \u0628\u0648\u0639\u0631\u064A\u0631\u064A\u062C", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[4.06, 36.04], [4.08, 36.04], [4.08, 36.02], [4.1, 36.02], [4.08, 36.02], [4.1, 36.02], [4.08, 36], [4.1, 36], [4.08, 36], [4.1, 36], [4.12, 36], [4.14, 36], [4.14, 36.02], [4.16, 36.02], [4.18, 36.02], [4.2, 36.02], [4.22, 36.02], [4.24, 36.02], [4.24, 36], [4.26, 36], [4.28, 36], [4.3, 36], [4.28, 36], [4.3, 36], [4.28, 36], [4.3, 35.98], [4.3, 36], [4.3, 35.98], [4.32, 35.98], [4.32, 36], [4.32, 35.98], [4.34, 35.98], [4.36, 35.98], [4.36, 36], [4.38, 36], [4.4, 36], [4.4, 36.02], [4.42, 36], [4.42, 36.02], [4.44, 36.02], [4.44, 36.04], [4.46, 36.04], [4.48, 36.04], [4.5, 36.04], [4.5, 36.02], [4.48, 36.02], [4.5, 36.02], [4.5, 36], [4.5, 35.98], [4.5, 35.96], [4.52, 35.96], [4.5, 35.96], [4.52, 35.96], [4.52, 35.94], [4.52, 35.92], [4.54, 35.92], [4.52, 35.92], [4.5, 35.92], [4.48, 35.92], [4.46, 35.92], [4.46, 35.9], [4.46, 35.92], [4.46, 35.9], [4.46, 35.88], [4.44, 35.88], [4.44, 35.86], [4.42, 35.86], [4.42, 35.84], [4.42, 35.82], [4.44, 35.82], [4.46, 35.82], [4.48, 35.82], [4.5, 35.82], [4.52, 35.82], [4.54, 35.82], [4.56, 35.82], [4.54, 35.82], [4.54, 35.84], [4.54, 35.86], [4.54, 35.84], [4.54, 35.86], [4.56, 35.86], [4.54, 35.86], [4.56, 35.86], [4.58, 35.86], [4.6, 35.88], [4.6, 35.86], [4.6, 35.84], [4.58, 35.84], [4.58, 35.82], [4.6, 35.82], [4.6, 35.8], [4.62, 35.8], [4.62, 35.82], [4.64, 35.82], [4.64, 35.84], [4.66, 35.84], [4.68, 35.84], [4.7, 35.84], [4.7, 35.86], [4.72, 35.86], [4.74, 35.86], [4.76, 35.86], [4.78, 35.86], [4.8, 35.86], [4.82, 35.86], [4.84, 35.86], [4.84, 35.88], [4.84, 35.86], [4.86, 35.86], [4.88, 35.86], [4.88, 35.84], [4.9, 35.84], [4.9, 35.82], [4.92, 35.82], [4.94, 35.82], [4.96, 35.82], [4.96, 35.8], [4.96, 35.78], [4.96, 35.76], [4.98, 35.76], [4.98, 35.78], [4.98, 35.76], [5, 35.76], [5, 35.78], [5.02, 35.78], [5.04, 35.78], [5.04, 35.8], [5.04, 35.82], [5.04, 35.84], [5.04, 35.86], [5.06, 35.86], [5.06, 35.84], [5.06, 35.86], [5.06, 35.84], [5.08, 35.84], [5.1, 35.84], [5.12, 35.84], [5.12, 35.86], [5.14, 35.86], [5.12, 35.86], [5.12, 35.88], [5.12, 35.9], [5.12, 35.92], [5.12, 35.94], [5.12, 35.96], [5.12, 35.98], [5.12, 36], [5.14, 36], [5.14, 36.02], [5.16, 36.02], [5.18, 36.02], [5.18, 36.04], [5.18, 36.06], [5.18, 36.08], [5.2, 36.08], [5.18, 36.08], [5.18, 36.1], [5.16, 36.1], [5.16, 36.12], [5.18, 36.12], [5.18, 36.14], [5.2, 36.14], [5.18, 36.14], [5.18, 36.16], [5.16, 36.16], [5.18, 36.16], [5.16, 36.16], [5.16, 36.18], [5.16, 36.2], [5.14, 36.2], [5.14, 36.22], [5.12, 36.22], [5.12, 36.2], [5.12, 36.22], [5.1, 36.22], [5.1, 36.24], [5.12, 36.24], [5.1, 36.24], [5.08, 36.24], [5.08, 36.26], [5.1, 36.26], [5.08, 36.26], [5.08, 36.28], [5.06, 36.28], [5.06, 36.3], [5.04, 36.3], [5.06, 36.3], [5.04, 36.3], [5.06, 36.3], [5.04, 36.3], [5.02, 36.3], [5.02, 36.32], [5, 36.32], [4.98, 36.32], [4.98, 36.3], [4.96, 36.3], [4.94, 36.3], [4.92, 36.3], [4.9, 36.3], [4.88, 36.3], [4.86, 36.3], [4.84, 36.3], [4.82, 36.3], [4.8, 36.3], [4.8, 36.32], [4.78, 36.32], [4.78, 36.34], [4.78, 36.36], [4.8, 36.36], [4.8, 36.38], [4.78, 36.38], [4.8, 36.38], [4.8, 36.4], [4.78, 36.4], [4.78, 36.42], [4.76, 36.42], [4.74, 36.42], [4.72, 36.44], [4.72, 36.42], [4.72, 36.4], [4.72, 36.38], [4.7, 36.38], [4.68, 36.38], [4.68, 36.36], [4.66, 36.36], [4.64, 36.36], [4.62, 36.36], [4.62, 36.34], [4.62, 36.32], [4.6, 36.32], [4.6, 36.3], [4.6, 36.28], [4.62, 36.28], [4.62, 36.26], [4.6, 36.26], [4.58, 36.26], [4.56, 36.26], [4.56, 36.24], [4.54, 36.24], [4.54, 36.26], [4.52, 36.26], [4.52, 36.24], [4.5, 36.22], [4.5, 36.24], [4.5, 36.22], [4.48, 36.22], [4.46, 36.22], [4.44, 36.22], [4.42, 36.22], [4.4, 36.22], [4.4, 36.24], [4.38, 36.24], [4.38, 36.26], [4.38, 36.28], [4.36, 36.28], [4.36, 36.26], [4.34, 36.26], [4.34, 36.24], [4.34, 36.26], [4.34, 36.24], [4.32, 36.24], [4.3, 36.24], [4.28, 36.24], [4.28, 36.26], [4.26, 36.26], [4.26, 36.24], [4.24, 36.24], [4.24, 36.22], [4.24, 36.2], [4.22, 36.2], [4.2, 36.2], [4.2, 36.18], [4.18, 36.18], [4.16, 36.18], [4.14, 36.18], [4.16, 36.18], [4.16, 36.16], [4.16, 36.14], [4.14, 36.14], [4.14, 36.12], [4.16, 36.12], [4.14, 36.12], [4.14, 36.1], [4.14, 36.08], [4.12, 36.08], [4.12, 36.06], [4.1, 36.06], [4.1, 36.04], [4.08, 36.04], [4.06, 36.04]]] } }, { type: "Feature", properties: { code: 35, fr: "Boumerd\xE8s", ar: "\u0628\u0648\u0645\u0631\u062F\u0627\u0633", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[3.22, 36.66], [3.24, 36.66], [3.24, 36.64], [3.26, 36.64], [3.26, 36.62], [3.28, 36.62], [3.28, 36.64], [3.3, 36.64], [3.3, 36.62], [3.28, 36.62], [3.28, 36.6], [3.28, 36.58], [3.3, 36.58], [3.28, 36.58], [3.28, 36.56], [3.3, 36.56], [3.32, 36.56], [3.3, 36.56], [3.32, 36.56], [3.34, 36.56], [3.36, 36.56], [3.38, 36.56], [3.4, 36.56], [3.4, 36.54], [3.4, 36.56], [3.42, 36.56], [3.44, 36.56], [3.46, 36.56], [3.46, 36.58], [3.48, 36.58], [3.48, 36.6], [3.5, 36.6], [3.48, 36.6], [3.5, 36.6], [3.5, 36.62], [3.52, 36.62], [3.52, 36.6], [3.54, 36.6], [3.56, 36.6], [3.58, 36.6], [3.6, 36.6], [3.6, 36.58], [3.62, 36.58], [3.64, 36.58], [3.66, 36.58], [3.68, 36.58], [3.68, 36.6], [3.7, 36.6], [3.7, 36.58], [3.72, 36.58], [3.74, 36.58], [3.74, 36.6], [3.74, 36.62], [3.72, 36.62], [3.72, 36.64], [3.74, 36.64], [3.74, 36.66], [3.74, 36.64], [3.74, 36.66], [3.74, 36.64], [3.76, 36.64], [3.76, 36.66], [3.76, 36.64], [3.78, 36.64], [3.78, 36.66], [3.8, 36.66], [3.8, 36.64], [3.78, 36.64], [3.8, 36.64], [3.82, 36.64], [3.82, 36.66], [3.82, 36.68], [3.84, 36.68], [3.86, 36.68], [3.88, 36.68], [3.86, 36.68], [3.86, 36.7], [3.84, 36.7], [3.84, 36.72], [3.86, 36.72], [3.86, 36.74], [3.86, 36.76], [3.88, 36.76], [3.88, 36.78], [3.9, 36.78], [3.9, 36.76], [3.92, 36.76], [3.92, 36.78], [3.92, 36.76], [3.94, 36.76], [3.94, 36.78], [3.96, 36.78], [3.98, 36.78], [3.98, 36.8], [4, 36.8], [4, 36.82], [4.02, 36.82], [4.02, 36.84], [4.04, 36.84], [4.04, 36.86], [4.04, 36.88], [4.04, 36.9], [4.02, 36.9], [4, 36.9], [3.98, 36.9], [3.96, 36.9], [3.94, 36.9], [3.92, 36.9], [3.92, 36.92], [3.9, 36.92], [3.88, 36.92], [3.86, 36.92], [3.84, 36.92], [3.84, 36.9], [3.82, 36.9], [3.8, 36.9], [3.78, 36.9], [3.76, 36.9], [3.74, 36.88], [3.72, 36.88], [3.72, 36.86], [3.7, 36.86], [3.7, 36.84], [3.68, 36.84], [3.66, 36.84], [3.64, 36.84], [3.64, 36.82], [3.62, 36.82], [3.6, 36.82], [3.6, 36.8], [3.58, 36.8], [3.56, 36.8], [3.54, 36.8], [3.54, 36.78], [3.52, 36.78], [3.5, 36.78], [3.5, 36.76], [3.48, 36.76], [3.46, 36.76], [3.44, 36.76], [3.42, 36.76], [3.42, 36.78], [3.4, 36.78], [3.38, 36.78], [3.36, 36.78], [3.36, 36.76], [3.34, 36.76], [3.36, 36.76], [3.38, 36.76], [3.38, 36.74], [3.38, 36.72], [3.36, 36.72], [3.34, 36.72], [3.32, 36.72], [3.3, 36.72], [3.3, 36.7], [3.28, 36.7], [3.26, 36.7], [3.26, 36.72], [3.26, 36.7], [3.26, 36.68], [3.24, 36.68], [3.22, 36.66]]] } }, { type: "Feature", properties: { code: 36, fr: "El Tarf", ar: "\u0627\u0644\u0637\u0627\u0631\u0641", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[7.66, 36.66], [7.68, 36.66], [7.68, 36.64], [7.7, 36.64], [7.7, 36.66], [7.68, 36.66], [7.7, 36.66], [7.72, 36.66], [7.74, 36.66], [7.74, 36.64], [7.74, 36.62], [7.76, 36.62], [7.76, 36.6], [7.78, 36.6], [7.78, 36.58], [7.78, 36.56], [7.78, 36.54], [7.8, 36.54], [7.82, 36.54], [7.82, 36.56], [7.84, 36.56], [7.84, 36.54], [7.84, 36.56], [7.84, 36.54], [7.84, 36.56], [7.86, 36.56], [7.86, 36.54], [7.86, 36.56], [7.88, 36.56], [7.88, 36.54], [7.9, 36.54], [7.92, 36.54], [7.92, 36.52], [7.94, 36.52], [7.94, 36.5], [7.96, 36.5], [7.94, 36.5], [7.94, 36.48], [7.96, 36.48], [7.96, 36.46], [7.98, 36.46], [8, 36.46], [8, 36.48], [8, 36.46], [8.02, 36.46], [8.02, 36.44], [8.02, 36.42], [8.02, 36.4], [8.04, 36.4], [8.06, 36.4], [8.06, 36.42], [8.08, 36.44], [8.1, 36.44], [8.12, 36.46], [8.12, 36.44], [8.12, 36.46], [8.14, 36.44], [8.16, 36.44], [8.16, 36.46], [8.16, 36.48], [8.16, 36.5], [8.18, 36.5], [8.18, 36.52], [8.2, 36.5], [8.2, 36.52], [8.22, 36.52], [8.24, 36.52], [8.24, 36.54], [8.26, 36.54], [8.24, 36.54], [8.26, 36.54], [8.28, 36.54], [8.3, 36.54], [8.32, 36.54], [8.32, 36.56], [8.32, 36.58], [8.34, 36.58], [8.36, 36.58], [8.36, 36.6], [8.38, 36.6], [8.4, 36.6], [8.4, 36.62], [8.42, 36.62], [8.44, 36.62], [8.46, 36.62], [8.46, 36.64], [8.46, 36.66], [8.48, 36.66], [8.46, 36.66], [8.48, 36.68], [8.48, 36.7], [8.48, 36.72], [8.46, 36.72], [8.46, 36.74], [8.48, 36.74], [8.46, 36.74], [8.46, 36.76], [8.46, 36.74], [8.44, 36.74], [8.42, 36.74], [8.42, 36.76], [8.44, 36.76], [8.42, 36.76], [8.44, 36.76], [8.42, 36.76], [8.44, 36.76], [8.46, 36.76], [8.46, 36.78], [8.48, 36.78], [8.5, 36.78], [8.52, 36.78], [8.54, 36.78], [8.56, 36.78], [8.58, 36.78], [8.58, 36.8], [8.6, 36.8], [8.62, 36.8], [8.64, 36.8], [8.66, 36.8], [8.66, 36.82], [8.68, 36.82], [8.68, 36.84], [8.66, 36.84], [8.66, 36.86], [8.66, 36.84], [8.66, 36.86], [8.64, 36.86], [8.62, 36.86], [8.62, 36.88], [8.64, 36.88], [8.62, 36.88], [8.64, 36.88], [8.62, 36.88], [8.64, 36.9], [8.64, 36.92], [8.66, 36.92], [8.64, 36.92], [8.64, 36.94], [8.62, 36.94], [8.6, 36.94], [8.6, 36.92], [8.58, 36.92], [8.6, 36.92], [8.58, 36.92], [8.58, 36.94], [8.58, 36.92], [8.58, 36.94], [8.58, 36.92], [8.58, 36.94], [8.56, 36.92], [8.54, 36.92], [8.52, 36.92], [8.52, 36.9], [8.5, 36.9], [8.48, 36.9], [8.46, 36.9], [8.44, 36.9], [8.42, 36.9], [8.4, 36.9], [8.4, 36.92], [8.38, 36.92], [8.36, 36.92], [8.34, 36.92], [8.32, 36.92], [8.3, 36.92], [8.28, 36.92], [8.26, 36.92], [8.26, 36.94], [8.24, 36.94], [8.24, 36.96], [8.24, 36.94], [8.24, 36.96], [8.22, 36.96], [8.22, 36.94], [8.2, 36.94], [8.18, 36.94], [8.18, 36.92], [8.16, 36.92], [8.14, 36.92], [8.14, 36.9], [8.14, 36.92], [8.14, 36.9], [8.12, 36.9], [8.1, 36.9], [8.08, 36.9], [8.08, 36.88], [8.06, 36.88], [8.04, 36.88], [8, 36.86], [7.96, 36.84], [7.94, 36.84], [7.92, 36.84], [7.9, 36.84], [7.88, 36.84], [7.86, 36.84], [7.84, 36.84], [7.82, 36.84], [7.82, 36.82], [7.84, 36.82], [7.82, 36.82], [7.8, 36.82], [7.78, 36.82], [7.78, 36.8], [7.78, 36.78], [7.76, 36.78], [7.74, 36.78], [7.72, 36.78], [7.72, 36.76], [7.7, 36.76], [7.7, 36.74], [7.68, 36.74], [7.68, 36.72], [7.7, 36.72], [7.7, 36.7], [7.7, 36.68], [7.7, 36.7], [7.68, 36.7], [7.68, 36.68], [7.66, 36.68], [7.66, 36.66]]] } }, { type: "Feature", properties: { code: 37, fr: "Tindouf", ar: "\u062A\u0646\u062F\u0648\u0641", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[-8.66, 28.24], [-8.66, 28.22], [-8.66, 28.18], [-8.66, 28.16], [-8.66, 28.12], [-8.66, 28.08], [-8.66, 28.04], [-8.66, 28], [-8.66, 27.98], [-8.66, 27.96], [-8.66, 27.94], [-8.66, 27.92], [-8.66, 27.9], [-8.66, 27.88], [-8.66, 27.86], [-8.66, 27.84], [-8.66, 27.82], [-8.66, 27.8], [-8.66, 27.66], [-8.66, 27.6], [-8.66, 27.52], [-8.66, 27.46], [-8.66, 27.38], [-8.66, 27.32], [-8.58, 27.26], [-8.56, 27.26], [-8.54, 27.24], [-8.52, 27.24], [-8.52, 27.22], [-8.5, 27.22], [-8.44, 27.18], [-8.38, 27.14], [-8.3, 27.1], [-8.24, 27.06], [-8.18, 27.04], [-8.18, 27.02], [-8.16, 27.02], [-8.14, 27], [-8.1, 26.98], [-8.06, 26.96], [-8, 26.92], [-7.94, 26.88], [-7.88, 26.86], [-7.84, 26.82], [-7.74, 26.76], [-7.7, 26.74], [-7.64, 26.7], [-7.58, 26.66], [-7.5, 26.62], [-7.4, 26.56], [-7.32, 26.52], [-7.26, 26.48], [-7.16, 26.42], [-7.08, 26.38], [-7.06, 26.36], [-7.02, 26.34], [-7, 26.32], [-6.9, 26.26], [-6.84, 26.22], [-6.74, 26.18], [-6.66, 26.12], [-6.58, 26.06], [-6.52, 26.04], [-6.5, 26.02], [-6.48, 26], [-6.46, 26], [-6.44, 25.98], [-6.38, 25.96], [-6.32, 25.92], [-6.24, 25.86], [-6.18, 25.82], [-6.16, 25.82], [-6.12, 25.78], [-6.08, 25.76], [-6.06, 25.76], [-6.04, 25.74], [-6, 25.72], [-5.96, 25.7], [-5.94, 25.68], [-5.9, 25.66], [-5.86, 25.64], [-5.8, 25.6], [-5.72, 25.54], [-5.66, 25.52], [-5.6, 25.54], [-5.56, 25.56], [-5.52, 25.56], [-5.48, 25.58], [-5.44, 25.6], [-5.38, 25.62], [-5.34, 25.64], [-5.26, 25.66], [-5.22, 25.66], [-5.2, 25.68], [-5.14, 25.7], [-5.1, 25.72], [-5, 25.82], [-4.98, 25.82], [-4.98, 25.84], [-4.96, 25.86], [-4.94, 25.86], [-4.92, 25.88], [-4.9, 25.9], [-4.9, 25.92], [-4.88, 25.94], [-4.84, 25.96], [-4.84, 25.98], [-4.82, 26], [-4.8, 26], [-4.78, 26], [-4.74, 26], [-4.68, 26], [-4.6, 26], [-4.5, 26.02], [-4.44, 26.02], [-4.38, 26.02], [-4.32, 26.02], [-4.3, 26.02], [-4.26, 26.02], [-4.22, 26.02], [-4.2, 26.02], [-4.18, 26.04], [-4.18, 26.06], [-4.16, 26.08], [-4.16, 26.1], [-4.16, 26.12], [-4.14, 26.12], [-4.14, 26.14], [-4.14, 26.16], [-4.14, 26.18], [-4.12, 26.18], [-4.12, 26.2], [-4.12, 26.22], [-4.1, 26.24], [-4.1, 26.26], [-4.08, 26.26], [-4.08, 26.28], [-4.06, 26.3], [-4.06, 26.32], [-4.04, 26.34], [-4.02, 26.34], [-4.02, 26.36], [-3.98, 26.4], [-3.94, 26.46], [-3.92, 26.5], [-3.9, 26.52], [-3.88, 26.56], [-3.86, 26.58], [-3.84, 26.58], [-3.84, 26.6], [-3.84, 26.62], [-3.82, 26.62], [-3.82, 26.64], [-3.8, 26.64], [-3.8, 26.66], [-3.78, 26.66], [-3.78, 26.68], [-3.78, 26.7], [-3.76, 26.7], [-3.74, 26.72], [-3.72, 26.72], [-3.72, 26.74], [-3.7, 26.74], [-3.7, 26.76], [-3.68, 26.76], [-3.68, 26.78], [-3.66, 26.78], [-3.64, 26.78], [-3.62, 26.78], [-3.62, 26.8], [-3.6, 26.8], [-3.58, 26.82], [-3.56, 26.82], [-3.54, 26.82], [-3.52, 26.82], [-3.52, 26.84], [-3.5, 26.84], [-3.48, 26.84], [-3.46, 26.84], [-3.46, 26.82], [-3.44, 26.82], [-3.42, 26.82], [-3.4, 26.82], [-3.38, 26.82], [-3.36, 26.82], [-3.34, 26.82], [-3.32, 26.82], [-3.3, 26.82], [-3.28, 26.82], [-3.24, 26.82], [-3.22, 26.82], [-3.2, 26.82], [-3.18, 26.82], [-3.16, 26.84], [-3.14, 26.84], [-3.14, 26.86], [-3.12, 26.86], [-3.1, 26.86], [-3.1, 26.88], [-3.1, 26.9], [-3.1, 26.92], [-3.08, 26.94], [-3.08, 26.96], [-3.08, 26.98], [-3.06, 26.98], [-3.08, 27], [-3.08, 27.02], [-3.06, 27.02], [-3.06, 27.04], [-3.06, 27.06], [-3.04, 27.06], [-3.04, 27.08], [-3.04, 27.1], [-3.04, 27.12], [-3.02, 27.12], [-3.02, 27.14], [-3.02, 27.16], [-3, 27.18], [-3, 27.2], [-3, 27.22], [-3, 27.24], [-2.98, 27.24], [-2.98, 27.26], [-2.98, 27.28], [-2.98, 27.3], [-3.02, 27.3], [-3.06, 27.3], [-3.1, 27.3], [-3.16, 27.32], [-3.22, 27.32], [-3.28, 27.32], [-3.36, 27.32], [-3.4, 27.34], [-3.48, 27.34], [-3.52, 27.34], [-3.56, 27.34], [-3.64, 27.4], [-3.7, 27.44], [-3.72, 27.46], [-3.78, 27.5], [-3.84, 27.56], [-3.88, 27.62], [-3.94, 27.66], [-3.98, 27.7], [-3.98, 27.76], [-3.98, 27.82], [-3.98, 27.88], [-3.98, 27.94], [-4, 28], [-4.06, 28.1], [-4.12, 28.2], [-4.18, 28.28], [-4.22, 28.34], [-4.28, 28.44], [-4.32, 28.48], [-4.34, 28.54], [-4.36, 28.6], [-4.38, 28.66], [-4.4, 28.72], [-4.42, 28.8], [-4.44, 28.86], [-4.48, 28.92], [-4.5, 29], [-4.52, 29.06], [-4.54, 29.12], [-4.58, 29.18], [-4.6, 29.26], [-4.62, 29.3], [-4.74, 29.34], [-4.82, 29.38], [-4.88, 29.42], [-4.96, 29.42], [-5.06, 29.42], [-5.16, 29.42], [-5.26, 29.42], [-5.36, 29.46], [-5.5, 29.56], [-5.52, 29.54], [-5.52, 29.52], [-5.54, 29.52], [-5.54, 29.5], [-5.56, 29.5], [-5.56, 29.48], [-5.58, 29.48], [-5.58, 29.5], [-5.6, 29.5], [-5.6, 29.48], [-5.62, 29.5], [-5.64, 29.5], [-5.66, 29.5], [-5.66, 29.52], [-5.68, 29.52], [-5.68, 29.54], [-5.7, 29.54], [-5.7, 29.52], [-5.72, 29.52], [-5.74, 29.52], [-5.76, 29.52], [-5.76, 29.54], [-5.74, 29.54], [-5.74, 29.56], [-5.72, 29.56], [-5.72, 29.58], [-5.72, 29.6], [-5.74, 29.6], [-5.76, 29.6], [-5.78, 29.6], [-5.8, 29.6], [-5.82, 29.6], [-5.84, 29.6], [-5.86, 29.6], [-5.88, 29.6], [-5.9, 29.6], [-5.92, 29.6], [-5.94, 29.6], [-5.96, 29.6], [-5.96, 29.58], [-5.98, 29.58], [-6, 29.58], [-6.02, 29.58], [-6.02, 29.56], [-6.04, 29.56], [-6.06, 29.56], [-6.08, 29.56], [-6.1, 29.56], [-6.1, 29.58], [-6.12, 29.56], [-6.12, 29.58], [-6.14, 29.58], [-6.16, 29.58], [-6.18, 29.58], [-6.2, 29.58], [-6.22, 29.58], [-6.24, 29.58], [-6.24, 29.56], [-6.26, 29.56], [-6.28, 29.56], [-6.28, 29.58], [-6.3, 29.56], [-6.32, 29.56], [-6.34, 29.56], [-6.36, 29.56], [-6.38, 29.56], [-6.4, 29.54], [-6.4, 29.56], [-6.42, 29.56], [-6.44, 29.56], [-6.46, 29.56], [-6.48, 29.56], [-6.5, 29.54], [-6.52, 29.54], [-6.52, 29.52], [-6.54, 29.52], [-6.56, 29.52], [-6.58, 29.52], [-6.6, 29.52], [-6.62, 29.52], [-6.64, 29.52], [-6.66, 29.52], [-6.68, 29.52], [-6.7, 29.52], [-6.72, 29.5], [-6.74, 29.5], [-6.74, 29.48], [-6.76, 29.48], [-6.76, 29.46], [-6.78, 29.46], [-6.8, 29.46], [-6.82, 29.46], [-6.84, 29.46], [-6.84, 29.48], [-6.86, 29.48], [-6.88, 29.48], [-6.9, 29.48], [-6.9, 29.5], [-6.92, 29.5], [-6.94, 29.5], [-6.96, 29.5], [-6.98, 29.5], [-7, 29.5], [-7.02, 29.5], [-7.04, 29.5], [-7.06, 29.5], [-7.08, 29.52], [-7.1, 29.52], [-7.12, 29.52], [-7.14, 29.52], [-7.16, 29.52], [-7.18, 29.52], [-7.18, 29.5], [-7.2, 29.5], [-7.22, 29.5], [-7.24, 29.48], [-7.26, 29.48], [-7.26, 29.46], [-7.28, 29.46], [-7.28, 29.44], [-7.3, 29.44], [-7.3, 29.42], [-7.32, 29.42], [-7.34, 29.4], [-7.36, 29.38], [-7.38, 29.38], [-7.4, 29.38], [-7.42, 29.38], [-7.44, 29.38], [-7.44, 29.36], [-7.46, 29.36], [-7.48, 29.36], [-7.5, 29.36], [-7.52, 29.36], [-7.54, 29.36], [-7.56, 29.36], [-7.58, 29.38], [-7.6, 29.38], [-7.6, 29.36], [-7.62, 29.36], [-7.62, 29.34], [-7.62, 29.32], [-7.64, 29.32], [-7.64, 29.3], [-7.66, 29.3], [-7.68, 29.3], [-7.7, 29.28], [-7.72, 29.28], [-7.74, 29.28], [-7.74, 29.26], [-7.76, 29.26], [-7.78, 29.26], [-7.78, 29.24], [-7.8, 29.24], [-7.82, 29.22], [-7.82, 29.2], [-7.84, 29.2], [-7.86, 29.2], [-7.88, 29.2], [-7.88, 29.18], [-7.9, 29.18], [-7.92, 29.16], [-7.94, 29.16], [-7.94, 29.14], [-7.96, 29.12], [-7.98, 29.12], [-7.98, 29.1], [-8, 29.1], [-8.02, 29.1], [-8.02, 29.08], [-8.04, 29.08], [-8.06, 29.08], [-8.06, 29.06], [-8.08, 29.06], [-8.08, 29.04], [-8.1, 29.04], [-8.12, 29.04], [-8.12, 29.02], [-8.14, 29.02], [-8.16, 29], [-8.18, 29], [-8.2, 28.98], [-8.22, 28.98], [-8.24, 28.96], [-8.26, 28.96], [-8.26, 28.94], [-8.28, 28.94], [-8.3, 28.92], [-8.32, 28.92], [-8.32, 28.9], [-8.34, 28.9], [-8.34, 28.88], [-8.36, 28.88], [-8.38, 28.86], [-8.4, 28.84], [-8.42, 28.84], [-8.42, 28.82], [-8.44, 28.8], [-8.46, 28.8], [-8.46, 28.78], [-8.48, 28.78], [-8.5, 28.78], [-8.52, 28.78], [-8.52, 28.76], [-8.54, 28.76], [-8.56, 28.76], [-8.58, 28.74], [-8.6, 28.74], [-8.62, 28.72], [-8.64, 28.7], [-8.64, 28.68], [-8.66, 28.68], [-8.66, 28.66], [-8.66, 28.64], [-8.66, 28.58], [-8.66, 28.5], [-8.66, 28.46], [-8.66, 28.42], [-8.66, 28.4], [-8.66, 28.34], [-8.66, 28.32], [-8.66, 28.3], [-8.66, 28.24]]] } }, { type: "Feature", properties: { code: 38, fr: "Tissemsilt", ar: "\u062A\u064A\u0633\u0645\u0633\u064A\u0644\u062A", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[1.26, 35.68], [1.26, 35.66], [1.28, 35.66], [1.28, 35.64], [1.3, 35.62], [1.3, 35.64], [1.32, 35.62], [1.34, 35.62], [1.34, 35.64], [1.34, 35.66], [1.34, 35.68], [1.34, 35.7], [1.34, 35.72], [1.36, 35.72], [1.36, 35.7], [1.36, 35.72], [1.36, 35.7], [1.38, 35.7], [1.38, 35.68], [1.4, 35.68], [1.42, 35.68], [1.44, 35.68], [1.44, 35.66], [1.44, 35.68], [1.46, 35.68], [1.46, 35.66], [1.46, 35.68], [1.48, 35.68], [1.48, 35.66], [1.5, 35.66], [1.5, 35.64], [1.5, 35.62], [1.5, 35.6], [1.52, 35.6], [1.54, 35.6], [1.56, 35.6], [1.56, 35.62], [1.56, 35.6], [1.56, 35.62], [1.58, 35.62], [1.58, 35.6], [1.58, 35.62], [1.58, 35.6], [1.58, 35.62], [1.6, 35.62], [1.6, 35.6], [1.6, 35.58], [1.62, 35.58], [1.62, 35.56], [1.64, 35.56], [1.64, 35.54], [1.66, 35.54], [1.68, 35.54], [1.7, 35.54], [1.7, 35.56], [1.7, 35.58], [1.72, 35.58], [1.72, 35.56], [1.72, 35.54], [1.74, 35.54], [1.74, 35.56], [1.76, 35.56], [1.78, 35.56], [1.8, 35.56], [1.82, 35.56], [1.82, 35.54], [1.82, 35.56], [1.84, 35.56], [1.84, 35.54], [1.84, 35.56], [1.84, 35.54], [1.86, 35.54], [1.86, 35.56], [1.88, 35.56], [1.9, 35.56], [1.92, 35.56], [1.94, 35.56], [1.96, 35.56], [1.98, 35.56], [1.98, 35.58], [1.98, 35.6], [2, 35.6], [2.02, 35.6], [2.04, 35.6], [2.02, 35.6], [2.02, 35.58], [2, 35.58], [2.02, 35.58], [2.04, 35.58], [2.06, 35.58], [2.08, 35.58], [2.08, 35.56], [2.08, 35.54], [2.1, 35.54], [2.12, 35.54], [2.12, 35.56], [2.14, 35.56], [2.16, 35.56], [2.18, 35.56], [2.2, 35.56], [2.22, 35.56], [2.24, 35.56], [2.26, 35.56], [2.26, 35.58], [2.26, 35.6], [2.28, 35.6], [2.28, 35.62], [2.28, 35.64], [2.28, 35.62], [2.28, 35.64], [2.26, 35.64], [2.24, 35.64], [2.22, 35.64], [2.2, 35.64], [2.2, 35.66], [2.18, 35.66], [2.16, 35.66], [2.14, 35.66], [2.14, 35.68], [2.16, 35.68], [2.14, 35.68], [2.14, 35.7], [2.16, 35.7], [2.14, 35.7], [2.14, 35.72], [2.16, 35.72], [2.16, 35.74], [2.18, 35.74], [2.2, 35.74], [2.22, 35.74], [2.22, 35.72], [2.24, 35.72], [2.26, 35.72], [2.28, 35.74], [2.28, 35.76], [2.28, 35.78], [2.28, 35.8], [2.3, 35.8], [2.3, 35.82], [2.3, 35.84], [2.32, 35.84], [2.32, 35.86], [2.32, 35.88], [2.3, 35.88], [2.28, 35.88], [2.26, 35.88], [2.24, 35.88], [2.24, 35.9], [2.22, 35.9], [2.22, 35.92], [2.2, 35.92], [2.18, 35.92], [2.18, 35.94], [2.16, 35.94], [2.16, 35.92], [2.16, 35.94], [2.14, 35.94], [2.14, 35.92], [2.14, 35.94], [2.14, 35.92], [2.14, 35.94], [2.14, 35.96], [2.12, 35.96], [2.1, 35.96], [2.08, 35.96], [2.06, 35.96], [2.06, 35.94], [2.04, 35.94], [2.02, 35.94], [2, 35.94], [1.98, 35.94], [1.98, 35.96], [2, 35.96], [2, 35.98], [1.98, 35.98], [1.98, 35.96], [1.96, 35.96], [1.96, 35.94], [1.94, 35.94], [1.92, 35.92], [1.9, 35.92], [1.9, 35.9], [1.88, 35.9], [1.88, 35.88], [1.88, 35.86], [1.86, 35.86], [1.86, 35.88], [1.86, 35.86], [1.84, 35.86], [1.82, 35.86], [1.82, 35.88], [1.82, 35.9], [1.8, 35.9], [1.8, 35.92], [1.78, 35.92], [1.76, 35.92], [1.74, 35.92], [1.72, 35.92], [1.7, 35.92], [1.68, 35.92], [1.68, 35.94], [1.68, 35.92], [1.68, 35.94], [1.66, 35.94], [1.68, 35.94], [1.66, 35.94], [1.68, 35.94], [1.66, 35.94], [1.64, 35.94], [1.64, 35.96], [1.64, 35.94], [1.64, 35.96], [1.62, 35.96], [1.62, 35.98], [1.62, 35.96], [1.62, 35.98], [1.6, 35.98], [1.6, 36], [1.58, 36], [1.6, 36], [1.58, 36], [1.58, 36.02], [1.56, 36.02], [1.56, 36.04], [1.56, 36.02], [1.54, 36.02], [1.54, 36], [1.52, 36], [1.52, 35.98], [1.5, 35.98], [1.5, 36], [1.5, 35.98], [1.52, 35.98], [1.5, 35.98], [1.52, 35.98], [1.52, 35.96], [1.5, 35.96], [1.5, 35.94], [1.48, 35.94], [1.46, 35.94], [1.44, 35.94], [1.42, 35.94], [1.44, 35.94], [1.42, 35.94], [1.4, 35.94], [1.4, 35.92], [1.42, 35.92], [1.4, 35.92], [1.4, 35.9], [1.4, 35.88], [1.38, 35.88], [1.4, 35.88], [1.38, 35.88], [1.4, 35.88], [1.4, 35.86], [1.4, 35.84], [1.38, 35.84], [1.4, 35.84], [1.4, 35.82], [1.42, 35.82], [1.42, 35.84], [1.42, 35.82], [1.4, 35.82], [1.4, 35.8], [1.4, 35.78], [1.38, 35.78], [1.36, 35.78], [1.34, 35.78], [1.34, 35.8], [1.32, 35.8], [1.32, 35.82], [1.32, 35.8], [1.3, 35.8], [1.28, 35.8], [1.3, 35.8], [1.28, 35.8], [1.28, 35.78], [1.28, 35.76], [1.28, 35.74], [1.28, 35.72], [1.28, 35.7], [1.26, 35.7], [1.26, 35.68]]] } }, { type: "Feature", properties: { code: 39, fr: "El Oued", ar: "\u0627\u0644\u0648\u0627\u062F\u064A", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[5.96, 34.38], [5.98, 34.32], [5.98, 34.22], [6.08, 34.16], [6.12, 34.06], [6.14, 33.92], [6.16, 33.92], [6.16, 33.94], [6.18, 33.94], [6.18, 33.92], [6.18, 33.94], [6.2, 33.94], [6.22, 33.94], [6.22, 33.96], [6.24, 33.96], [6.24, 33.94], [6.26, 33.94], [6.24, 33.94], [6.26, 33.94], [6.26, 33.92], [6.26, 33.9], [6.28, 33.9], [6.28, 33.92], [6.28, 33.94], [6.28, 33.92], [6.3, 33.86], [6.3, 33.82], [6.3, 33.76], [6.32, 33.72], [6.32, 33.66], [6.32, 33.64], [6.34, 33.62], [6.34, 33.6], [6.36, 33.58], [6.36, 33.56], [6.36, 33.54], [6.38, 33.5], [6.4, 33.48], [6.4, 33.44], [6.4, 33.42], [6.42, 33.42], [6.42, 33.4], [6.42, 33.38], [6.44, 33.36], [6.44, 33.34], [6.44, 33.32], [6.46, 33.3], [6.46, 33.28], [6.48, 33.26], [6.48, 33.24], [6.48, 33.22], [6.5, 33.22], [6.5, 33.2], [6.5, 33.18], [6.5, 33.16], [6.52, 33.12], [6.54, 33.08], [6.54, 33.06], [6.56, 33.02], [6.56, 33], [6.58, 32.98], [6.6, 32.9], [6.64, 32.78], [6.66, 32.72], [6.68, 32.7], [6.68, 32.68], [6.7, 32.68], [6.7, 32.64], [6.72, 32.62], [6.76, 32.6], [6.78, 32.56], [6.78, 32.54], [6.82, 32.48], [6.88, 32.42], [6.92, 32.36], [6.96, 32.3], [7, 32.26], [7.02, 32.24], [7.04, 32.2], [7.1, 32.16], [7.12, 32.12], [7.2, 32.04], [7.24, 32], [7.26, 32], [7.28, 32], [7.54, 32.02], [7.74, 32.04], [7.88, 32.04], [7.94, 32.04], [7.98, 32.04], [8, 32.04], [8.02, 32.04], [8.06, 32.04], [8.2, 32.06], [8.46, 32.06], [8.5, 32.06], [9.06, 32.08], [8.8, 32.24], [8.78, 32.24], [8.58, 32.36], [8.52, 32.42], [8.36, 32.5], [8.36, 32.52], [8.32, 32.82], [8.24, 32.92], [8.16, 33], [8.16, 33.02], [8.14, 33.02], [8.14, 33.04], [8.12, 33.04], [8.12, 33.06], [8.12, 33.08], [8.12, 33.1], [8.1, 33.1], [8.08, 33.12], [8.06, 33.12], [8.04, 33.12], [8.04, 33.14], [8.02, 33.14], [8, 33.14], [8, 33.16], [7.98, 33.16], [7.96, 33.16], [7.94, 33.16], [7.94, 33.18], [7.92, 33.18], [7.9, 33.18], [7.88, 33.18], [7.86, 33.18], [7.84, 33.18], [7.84, 33.2], [7.82, 33.2], [7.82, 33.22], [7.82, 33.24], [7.8, 33.24], [7.8, 33.26], [7.8, 33.28], [7.78, 33.28], [7.78, 33.3], [7.78, 33.32], [7.74, 33.32], [7.74, 33.38], [7.74, 33.42], [7.64, 33.58], [7.6, 33.64], [7.58, 33.68], [7.58, 33.7], [7.56, 33.72], [7.56, 33.78], [7.52, 33.8], [7.54, 33.84], [7.54, 33.86], [7.52, 33.9], [7.54, 33.94], [7.54, 33.98], [7.56, 34], [7.56, 34.02], [7.54, 34.04], [7.54, 34.06], [7.54, 34.08], [7.56, 34.08], [7.58, 34.08], [7.58, 34.1], [7.6, 34.1], [7.58, 34.1], [7.6, 34.1], [7.6, 34.12], [7.62, 34.12], [7.62, 34.14], [7.64, 34.18], [7.66, 34.2], [7.68, 34.2], [7.68, 34.18], [7.7, 34.18], [7.72, 34.18], [7.74, 34.18], [7.76, 34.2], [7.78, 34.2], [7.8, 34.2], [7.8, 34.22], [7.8, 34.24], [7.78, 34.24], [7.72, 34.26], [7.68, 34.26], [7.66, 34.26], [7.64, 34.26], [7.62, 34.26], [7.6, 34.26], [7.58, 34.26], [7.56, 34.26], [7.54, 34.26], [7.52, 34.26], [7.5, 34.28], [7.46, 34.28], [7.42, 34.28], [7.4, 34.28], [7.38, 34.28], [7.36, 34.3], [7.32, 34.32], [7.28, 34.32], [7.26, 34.32], [7.24, 34.34], [7.22, 34.34], [7.2, 34.34], [7.16, 34.34], [7.08, 34.34], [7.02, 34.34], [7.02, 34.32], [7.02, 34.3], [7.02, 34.28], [7.02, 34.26], [7.02, 34.2], [7.02, 34.16], [6.94, 34.18], [6.92, 34.18], [6.92, 34.2], [6.9, 34.2], [6.88, 34.2], [6.86, 34.22], [6.84, 34.22], [6.82, 34.22], [6.82, 34.24], [6.8, 34.24], [6.78, 34.24], [6.78, 34.26], [6.76, 34.26], [6.76, 34.28], [6.74, 34.28], [6.72, 34.28], [6.72, 34.3], [6.7, 34.3], [6.7, 34.32], [6.7, 34.34], [6.7, 34.36], [6.7, 34.38], [6.68, 34.38], [6.68, 34.36], [6.68, 34.34], [6.66, 34.34], [6.64, 34.32], [6.62, 34.32], [6.62, 34.3], [6.6, 34.3], [6.6, 34.28], [6.58, 34.28], [6.56, 34.28], [6.54, 34.28], [6.52, 34.28], [6.52, 34.3], [6.5, 34.3], [6.5, 34.32], [6.48, 34.32], [6.48, 34.34], [6.46, 34.34], [6.44, 34.34], [6.44, 34.36], [6.42, 34.36], [6.4, 34.36], [6.38, 34.36], [6.36, 34.36], [6.34, 34.38], [6.32, 34.38], [6.32, 34.4], [6.3, 34.4], [6.28, 34.4], [6.26, 34.4], [6.24, 34.42], [6.22, 34.42], [6.2, 34.42], [6.18, 34.42], [6.16, 34.42], [6.14, 34.42], [6.12, 34.42], [6.1, 34.42], [6.08, 34.42], [6.06, 34.42], [6.06, 34.4], [6.04, 34.4], [6.02, 34.4], [6, 34.4], [5.98, 34.4], [5.96, 34.4], [5.96, 34.38]]] } }, { type: "Feature", properties: { code: 40, fr: "Khenchela", ar: "\u062E\u0646\u0634\u0644\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[6.5, 35.02], [6.52, 35.02], [6.54, 35.02], [6.54, 35], [6.54, 34.98], [6.56, 34.98], [6.56, 34.96], [6.56, 34.94], [6.58, 34.94], [6.6, 34.94], [6.6, 34.92], [6.58, 34.92], [6.58, 34.9], [6.56, 34.9], [6.58, 34.9], [6.6, 34.9], [6.6, 34.88], [6.58, 34.88], [6.56, 34.86], [6.56, 34.84], [6.56, 34.82], [6.56, 34.8], [6.58, 34.8], [6.58, 34.78], [6.6, 34.78], [6.62, 34.78], [6.62, 34.8], [6.64, 34.8], [6.64, 34.82], [6.66, 34.82], [6.66, 34.84], [6.66, 34.86], [6.68, 34.86], [6.7, 34.86], [6.72, 34.86], [6.72, 34.84], [6.7, 34.84], [6.72, 34.84], [6.72, 34.82], [6.74, 34.82], [6.74, 34.8], [6.76, 34.8], [6.74, 34.8], [6.74, 34.78], [6.74, 34.76], [6.78, 34.76], [6.76, 34.76], [6.76, 34.74], [6.76, 34.72], [6.76, 34.7], [6.74, 34.7], [6.74, 34.68], [6.74, 34.66], [6.74, 34.64], [6.74, 34.62], [6.74, 34.6], [6.74, 34.58], [6.74, 34.56], [6.74, 34.54], [6.72, 34.54], [6.72, 34.52], [6.72, 34.5], [6.7, 34.5], [6.7, 34.48], [6.68, 34.48], [6.68, 34.46], [6.7, 34.44], [6.7, 34.42], [6.7, 34.4], [6.72, 34.4], [6.7, 34.4], [6.72, 34.4], [6.7, 34.4], [6.7, 34.38], [6.7, 34.36], [6.7, 34.34], [6.7, 34.32], [6.7, 34.3], [6.72, 34.3], [6.72, 34.28], [6.74, 34.28], [6.76, 34.28], [6.76, 34.26], [6.78, 34.26], [6.78, 34.24], [6.8, 34.24], [6.82, 34.24], [6.82, 34.22], [6.84, 34.22], [6.86, 34.22], [6.88, 34.2], [6.9, 34.2], [6.92, 34.2], [6.92, 34.18], [6.94, 34.18], [7.02, 34.16], [7.02, 34.2], [7.02, 34.26], [7.02, 34.28], [7.02, 34.3], [7.02, 34.32], [7.02, 34.34], [7.08, 34.34], [7.16, 34.34], [7.2, 34.34], [7.22, 34.34], [7.24, 34.34], [7.24, 34.4], [7.24, 34.44], [7.24, 34.46], [7.26, 34.46], [7.26, 34.48], [7.26, 34.5], [7.26, 34.52], [7.28, 34.52], [7.28, 34.54], [7.3, 34.54], [7.3, 34.56], [7.3, 34.58], [7.32, 34.58], [7.32, 34.6], [7.34, 34.6], [7.34, 34.62], [7.34, 34.64], [7.36, 34.64], [7.36, 34.66], [7.38, 34.66], [7.38, 34.68], [7.38, 34.7], [7.4, 34.7], [7.4, 34.72], [7.4, 34.74], [7.38, 34.74], [7.38, 34.76], [7.4, 34.76], [7.38, 34.76], [7.38, 34.78], [7.36, 34.78], [7.36, 34.8], [7.38, 34.8], [7.38, 34.82], [7.38, 34.84], [7.4, 34.84], [7.4, 34.86], [7.4, 34.88], [7.4, 34.9], [7.4, 34.92], [7.38, 34.92], [7.38, 34.94], [7.36, 34.94], [7.36, 34.96], [7.38, 34.96], [7.36, 34.96], [7.34, 34.96], [7.32, 34.96], [7.3, 34.96], [7.3, 34.94], [7.28, 34.94], [7.28, 34.92], [7.26, 34.92], [7.26, 34.9], [7.26, 34.88], [7.24, 34.88], [7.26, 34.88], [7.26, 34.86], [7.26, 34.88], [7.28, 34.88], [7.26, 34.88], [7.26, 34.86], [7.28, 34.86], [7.26, 34.86], [7.26, 34.84], [7.28, 34.84], [7.26, 34.84], [7.26, 34.82], [7.26, 34.84], [7.26, 34.86], [7.24, 34.86], [7.24, 34.88], [7.24, 34.9], [7.22, 34.9], [7.24, 34.9], [7.24, 34.92], [7.24, 34.94], [7.24, 34.96], [7.26, 34.98], [7.26, 35], [7.28, 35], [7.28, 35.02], [7.3, 35.02], [7.3, 35.04], [7.3, 35.06], [7.32, 35.06], [7.34, 35.06], [7.34, 35.08], [7.36, 35.08], [7.38, 35.08], [7.38, 35.1], [7.4, 35.1], [7.4, 35.12], [7.42, 35.14], [7.42, 35.16], [7.44, 35.16], [7.44, 35.18], [7.42, 35.18], [7.42, 35.2], [7.4, 35.2], [7.4, 35.22], [7.4, 35.24], [7.38, 35.24], [7.4, 35.24], [7.4, 35.26], [7.42, 35.26], [7.42, 35.28], [7.44, 35.28], [7.42, 35.28], [7.4, 35.28], [7.4, 35.3], [7.4, 35.32], [7.4, 35.34], [7.42, 35.34], [7.42, 35.36], [7.4, 35.36], [7.42, 35.36], [7.4, 35.36], [7.4, 35.38], [7.4, 35.4], [7.42, 35.4], [7.44, 35.4], [7.46, 35.4], [7.48, 35.4], [7.48, 35.42], [7.5, 35.42], [7.52, 35.42], [7.54, 35.42], [7.54, 35.44], [7.52, 35.44], [7.52, 35.46], [7.52, 35.48], [7.5, 35.48], [7.5, 35.46], [7.5, 35.48], [7.48, 35.48], [7.48, 35.5], [7.48, 35.52], [7.46, 35.52], [7.46, 35.54], [7.46, 35.52], [7.44, 35.52], [7.44, 35.5], [7.44, 35.52], [7.42, 35.52], [7.44, 35.52], [7.44, 35.54], [7.42, 35.54], [7.4, 35.56], [7.38, 35.56], [7.38, 35.58], [7.38, 35.56], [7.36, 35.56], [7.36, 35.54], [7.34, 35.54], [7.34, 35.52], [7.36, 35.52], [7.34, 35.52], [7.32, 35.52], [7.3, 35.52], [7.3, 35.5], [7.3, 35.52], [7.3, 35.54], [7.3, 35.56], [7.32, 35.56], [7.32, 35.58], [7.3, 35.6], [7.28, 35.6], [7.28, 35.62], [7.26, 35.62], [7.24, 35.62], [7.22, 35.62], [7.22, 35.6], [7.22, 35.62], [7.22, 35.6], [7.22, 35.62], [7.2, 35.62], [7.18, 35.62], [7.16, 35.62], [7.14, 35.62], [7.12, 35.62], [7.12, 35.6], [7.12, 35.58], [7.1, 35.58], [7.1, 35.56], [7.08, 35.56], [7.08, 35.54], [7.06, 35.54], [7.06, 35.56], [7.04, 35.56], [7.02, 35.56], [7, 35.56], [7.02, 35.56], [7.02, 35.58], [7.02, 35.6], [7.02, 35.62], [7, 35.62], [6.98, 35.62], [6.96, 35.62], [6.94, 35.62], [6.92, 35.62], [6.9, 35.62], [6.88, 35.62], [6.86, 35.62], [6.84, 35.62], [6.84, 35.6], [6.84, 35.62], [6.84, 35.6], [6.84, 35.62], [6.82, 35.62], [6.8, 35.62], [6.8, 35.64], [6.78, 35.66], [6.78, 35.68], [6.76, 35.68], [6.76, 35.66], [6.76, 35.64], [6.76, 35.62], [6.76, 35.6], [6.78, 35.6], [6.78, 35.58], [6.8, 35.58], [6.8, 35.56], [6.78, 35.56], [6.78, 35.54], [6.76, 35.54], [6.76, 35.52], [6.78, 35.52], [6.76, 35.52], [6.76, 35.5], [6.74, 35.5], [6.74, 35.48], [6.72, 35.48], [6.7, 35.48], [6.68, 35.48], [6.68, 35.5], [6.68, 35.48], [6.66, 35.48], [6.64, 35.48], [6.64, 35.46], [6.64, 35.48], [6.62, 35.46], [6.62, 35.48], [6.62, 35.46], [6.6, 35.46], [6.6, 35.44], [6.58, 35.44], [6.58, 35.42], [6.56, 35.42], [6.58, 35.42], [6.58, 35.4], [6.58, 35.38], [6.6, 35.38], [6.58, 35.38], [6.58, 35.36], [6.58, 35.34], [6.58, 35.32], [6.6, 35.32], [6.62, 35.32], [6.64, 35.32], [6.64, 35.3], [6.62, 35.3], [6.62, 35.28], [6.6, 35.28], [6.58, 35.28], [6.58, 35.26], [6.56, 35.26], [6.56, 35.24], [6.54, 35.24], [6.54, 35.22], [6.56, 35.22], [6.56, 35.2], [6.56, 35.18], [6.56, 35.16], [6.56, 35.14], [6.54, 35.14], [6.52, 35.14], [6.52, 35.12], [6.5, 35.12], [6.5, 35.1], [6.5, 35.08], [6.52, 35.08], [6.52, 35.06], [6.52, 35.04], [6.5, 35.04], [6.5, 35.02]]] } }, { type: "Feature", properties: { code: 41, fr: "Souk Ahras", ar: "\u0633\u0648\u0642 \u0623\u0647\u0631\u0627\u0633", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[7.28, 36.18], [7.3, 36.16], [7.28, 36.16], [7.3, 36.16], [7.3, 36.14], [7.32, 36.14], [7.32, 36.12], [7.32, 36.1], [7.34, 36.1], [7.32, 36.1], [7.34, 36.1], [7.34, 36.08], [7.34, 36.06], [7.36, 36.06], [7.34, 36.06], [7.36, 36.06], [7.36, 36.04], [7.36, 36.02], [7.38, 36.02], [7.36, 36.02], [7.36, 36], [7.38, 36], [7.38, 35.98], [7.4, 35.98], [7.4, 35.96], [7.42, 35.96], [7.42, 35.94], [7.44, 35.94], [7.42, 35.94], [7.42, 35.92], [7.44, 35.92], [7.46, 35.9], [7.48, 35.9], [7.5, 35.9], [7.5, 35.88], [7.52, 35.88], [7.54, 35.88], [7.56, 35.88], [7.56, 35.86], [7.54, 35.86], [7.56, 35.86], [7.56, 35.84], [7.56, 35.82], [7.56, 35.84], [7.56, 35.82], [7.58, 35.82], [7.58, 35.8], [7.6, 35.8], [7.6, 35.82], [7.62, 35.82], [7.64, 35.82], [7.66, 35.82], [7.68, 35.82], [7.7, 35.82], [7.68, 35.82], [7.68, 35.84], [7.66, 35.84], [7.68, 35.84], [7.68, 35.86], [7.7, 35.86], [7.68, 35.86], [7.68, 35.88], [7.7, 35.88], [7.72, 35.88], [7.72, 35.9], [7.72, 35.92], [7.72, 35.94], [7.74, 35.94], [7.76, 35.94], [7.76, 35.92], [7.78, 35.94], [7.78, 35.92], [7.8, 35.92], [7.8, 35.9], [7.82, 35.9], [7.82, 35.88], [7.82, 35.9], [7.84, 35.9], [7.86, 35.88], [7.88, 35.9], [7.88, 35.88], [7.9, 35.88], [7.9, 35.9], [7.92, 35.9], [7.92, 35.92], [7.92, 35.9], [7.92, 35.92], [7.94, 35.92], [7.94, 35.94], [7.96, 35.94], [7.96, 35.92], [7.96, 35.94], [7.98, 35.94], [7.98, 35.96], [8, 35.96], [8.02, 35.96], [8, 35.98], [8.02, 35.98], [8.04, 35.98], [8.04, 35.96], [8.04, 35.98], [8.06, 35.98], [8.06, 35.96], [8.08, 35.96], [8.08, 35.98], [8.1, 35.98], [8.12, 35.98], [8.12, 36], [8.12, 35.98], [8.12, 36], [8.14, 36], [8.16, 36], [8.16, 35.98], [8.16, 36], [8.16, 35.98], [8.18, 35.98], [8.18, 36], [8.18, 35.98], [8.18, 36], [8.2, 36], [8.22, 36], [8.22, 35.98], [8.24, 35.98], [8.24, 35.96], [8.26, 35.96], [8.28, 35.96], [8.3, 35.96], [8.3, 35.98], [8.3, 36], [8.3, 36.02], [8.3, 36.04], [8.3, 36.06], [8.32, 36.06], [8.32, 36.08], [8.34, 36.08], [8.34, 36.1], [8.34, 36.12], [8.34, 36.14], [8.32, 36.14], [8.32, 36.16], [8.3, 36.16], [8.3, 36.18], [8.32, 36.18], [8.32, 36.2], [8.34, 36.2], [8.34, 36.22], [8.36, 36.22], [8.36, 36.24], [8.36, 36.26], [8.34, 36.26], [8.34, 36.28], [8.36, 36.28], [8.36, 36.3], [8.38, 36.3], [8.4, 36.3], [8.38, 36.3], [8.38, 36.32], [8.38, 36.34], [8.38, 36.36], [8.4, 36.36], [8.4, 36.38], [8.4, 36.4], [8.4, 36.42], [8.38, 36.42], [8.36, 36.44], [8.34, 36.44], [8.32, 36.44], [8.3, 36.44], [8.28, 36.44], [8.26, 36.44], [8.24, 36.44], [8.22, 36.44], [8.2, 36.44], [8.2, 36.46], [8.2, 36.44], [8.2, 36.46], [8.18, 36.46], [8.16, 36.46], [8.16, 36.44], [8.14, 36.44], [8.12, 36.46], [8.12, 36.44], [8.12, 36.46], [8.1, 36.44], [8.08, 36.44], [8.06, 36.42], [8.06, 36.4], [8.04, 36.4], [8.02, 36.4], [8.02, 36.42], [8.02, 36.44], [8.02, 36.46], [8, 36.46], [8, 36.48], [8, 36.46], [7.98, 36.46], [7.96, 36.46], [7.94, 36.46], [7.94, 36.44], [7.92, 36.44], [7.9, 36.44], [7.9, 36.42], [7.88, 36.42], [7.86, 36.42], [7.86, 36.4], [7.86, 36.42], [7.84, 36.42], [7.82, 36.42], [7.82, 36.4], [7.8, 36.4], [7.82, 36.4], [7.82, 36.38], [7.8, 36.38], [7.82, 36.36], [7.84, 36.36], [7.84, 36.34], [7.84, 36.32], [7.86, 36.32], [7.84, 36.32], [7.84, 36.3], [7.82, 36.3], [7.8, 36.3], [7.78, 36.3], [7.78, 36.28], [7.76, 36.28], [7.76, 36.3], [7.74, 36.3], [7.72, 36.3], [7.72, 36.28], [7.72, 36.26], [7.7, 36.26], [7.68, 36.26], [7.66, 36.26], [7.66, 36.24], [7.64, 36.24], [7.62, 36.24], [7.62, 36.22], [7.62, 36.24], [7.6, 36.24], [7.58, 36.24], [7.58, 36.22], [7.58, 36.24], [7.56, 36.24], [7.54, 36.24], [7.54, 36.22], [7.52, 36.22], [7.5, 36.22], [7.48, 36.22], [7.46, 36.22], [7.46, 36.2], [7.44, 36.2], [7.42, 36.2], [7.42, 36.22], [7.42, 36.2], [7.42, 36.22], [7.4, 36.22], [7.4, 36.2], [7.4, 36.22], [7.38, 36.22], [7.36, 36.22], [7.34, 36.22], [7.32, 36.22], [7.32, 36.24], [7.32, 36.22], [7.3, 36.22], [7.3, 36.2], [7.28, 36.2], [7.28, 36.18]]] } }, { type: "Feature", properties: { code: 42, fr: "Tipaza", ar: "\u062A\u064A\u0628\u0627\u0632\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[1.64, 36.48], [1.64, 36.46], [1.64, 36.44], [1.66, 36.44], [1.66, 36.42], [1.68, 36.42], [1.68, 36.4], [1.7, 36.4], [1.7, 36.38], [1.7, 36.36], [1.72, 36.36], [1.72, 36.38], [1.74, 36.38], [1.76, 36.38], [1.76, 36.4], [1.78, 36.4], [1.78, 36.42], [1.78, 36.44], [1.8, 36.44], [1.82, 36.44], [1.82, 36.42], [1.82, 36.44], [1.84, 36.44], [1.86, 36.44], [1.88, 36.44], [1.9, 36.44], [1.92, 36.44], [1.92, 36.42], [1.94, 36.42], [1.96, 36.42], [1.98, 36.42], [2, 36.42], [2.02, 36.42], [2.04, 36.42], [2.06, 36.42], [2.08, 36.42], [2.08, 36.44], [2.1, 36.44], [2.12, 36.44], [2.14, 36.44], [2.16, 36.44], [2.18, 36.44], [2.2, 36.44], [2.22, 36.44], [2.22, 36.42], [2.22, 36.44], [2.24, 36.44], [2.24, 36.42], [2.26, 36.42], [2.28, 36.42], [2.3, 36.42], [2.32, 36.42], [2.34, 36.42], [2.36, 36.42], [2.38, 36.42], [2.4, 36.42], [2.42, 36.42], [2.44, 36.42], [2.46, 36.42], [2.48, 36.42], [2.5, 36.42], [2.52, 36.42], [2.5, 36.42], [2.5, 36.44], [2.52, 36.44], [2.52, 36.46], [2.54, 36.46], [2.56, 36.46], [2.58, 36.46], [2.6, 36.46], [2.62, 36.46], [2.62, 36.48], [2.62, 36.5], [2.6, 36.5], [2.6, 36.52], [2.62, 36.52], [2.64, 36.52], [2.66, 36.52], [2.66, 36.54], [2.68, 36.54], [2.68, 36.56], [2.68, 36.54], [2.68, 36.56], [2.7, 36.56], [2.72, 36.56], [2.72, 36.58], [2.74, 36.58], [2.76, 36.58], [2.78, 36.58], [2.78, 36.6], [2.8, 36.6], [2.82, 36.6], [2.82, 36.62], [2.84, 36.62], [2.82, 36.62], [2.82, 36.64], [2.8, 36.64], [2.82, 36.64], [2.8, 36.64], [2.8, 36.66], [2.82, 36.66], [2.82, 36.68], [2.8, 36.68], [2.8, 36.7], [2.8, 36.68], [2.78, 36.68], [2.76, 36.68], [2.74, 36.68], [2.74, 36.66], [2.74, 36.68], [2.74, 36.66], [2.72, 36.66], [2.7, 36.66], [2.7, 36.64], [2.68, 36.64], [2.66, 36.64], [2.66, 36.62], [2.64, 36.62], [2.62, 36.62], [2.62, 36.6], [2.6, 36.6], [2.58, 36.6], [2.56, 36.6], [2.54, 36.6], [2.54, 36.58], [2.54, 36.6], [2.52, 36.6], [2.5, 36.6], [2.48, 36.6], [2.5, 36.6], [2.48, 36.6], [2.5, 36.6], [2.48, 36.6], [2.46, 36.6], [2.48, 36.6], [2.46, 36.6], [2.48, 36.6], [2.46, 36.6], [2.48, 36.6], [2.46, 36.6], [2.44, 36.6], [2.46, 36.6], [2.44, 36.6], [2.42, 36.6], [2.4, 36.6], [2.4, 36.62], [2.4, 36.64], [2.38, 36.64], [2.36, 36.64], [2.34, 36.64], [2.32, 36.64], [2.3, 36.64], [2.28, 36.64], [2.28, 36.62], [2.26, 36.62], [2.24, 36.62], [2.22, 36.62], [2.2, 36.62], [2.2, 36.6], [2.18, 36.6], [2.18, 36.62], [2.2, 36.62], [2.18, 36.62], [2.18, 36.6], [2.16, 36.6], [2.14, 36.6], [2.14, 36.58], [2.12, 36.58], [2.1, 36.58], [2.08, 36.58], [2.06, 36.58], [2.08, 36.58], [2.06, 36.58], [2.04, 36.58], [2.04, 36.56], [2.04, 36.58], [2.04, 36.56], [2.02, 36.58], [2.02, 36.56], [2, 36.56], [1.98, 36.56], [1.96, 36.56], [1.94, 36.56], [1.94, 36.58], [1.92, 36.58], [1.9, 36.58], [1.9, 36.56], [1.88, 36.58], [1.9, 36.58], [1.88, 36.58], [1.88, 36.56], [1.88, 36.58], [1.88, 36.56], [1.88, 36.58], [1.88, 36.56], [1.86, 36.56], [1.86, 36.58], [1.86, 36.56], [1.86, 36.58], [1.86, 36.56], [1.84, 36.56], [1.82, 36.56], [1.8, 36.56], [1.78, 36.56], [1.76, 36.56], [1.74, 36.56], [1.72, 36.56], [1.7, 36.56], [1.7, 36.54], [1.68, 36.54], [1.68, 36.52], [1.66, 36.52], [1.66, 36.5], [1.68, 36.5], [1.66, 36.5], [1.66, 36.48], [1.68, 36.48], [1.68, 36.5], [1.68, 36.48], [1.66, 36.48], [1.64, 36.48]]] } }, { type: "Feature", properties: { code: 43, fr: "Mila", ar: "\u0645\u064A\u0644\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[5.74, 36.56], [5.74, 36.54], [5.76, 36.54], [5.76, 36.52], [5.76, 36.5], [5.76, 36.48], [5.74, 36.48], [5.74, 36.46], [5.76, 36.46], [5.76, 36.44], [5.78, 36.44], [5.76, 36.44], [5.76, 36.42], [5.78, 36.42], [5.8, 36.42], [5.82, 36.42], [5.82, 36.4], [5.82, 36.38], [5.8, 36.38], [5.82, 36.38], [5.8, 36.36], [5.84, 36.34], [5.86, 36.34], [5.86, 36.32], [5.88, 36.32], [5.86, 36.32], [5.86, 36.3], [5.88, 36.3], [5.88, 36.28], [5.88, 36.26], [5.9, 36.26], [5.9, 36.24], [5.92, 36.24], [5.94, 36.24], [5.94, 36.22], [5.96, 36.22], [5.96, 36.2], [5.94, 36.2], [5.92, 36.2], [5.92, 36.18], [5.92, 36.16], [5.92, 36.14], [5.92, 36.12], [5.92, 36.1], [5.94, 36.1], [5.96, 36.1], [5.98, 36.1], [6, 36.1], [6, 36.08], [5.98, 36.08], [6, 36.08], [6, 36.06], [6, 36.04], [6, 36.02], [6, 36], [5.98, 36], [5.98, 35.98], [6, 35.98], [5.98, 35.98], [6, 35.98], [6, 35.96], [5.98, 35.96], [6, 35.96], [6.02, 35.96], [6.02, 35.94], [6.02, 35.92], [6, 35.92], [5.98, 35.92], [5.98, 35.9], [5.96, 35.9], [5.98, 35.9], [6, 35.9], [6.02, 35.9], [6.02, 35.88], [6.04, 35.9], [6.06, 35.9], [6.06, 35.88], [6.08, 35.88], [6.1, 35.88], [6.12, 35.88], [6.14, 35.88], [6.16, 35.88], [6.16, 35.9], [6.16, 35.92], [6.16, 35.94], [6.18, 35.94], [6.2, 35.94], [6.2, 35.96], [6.22, 35.96], [6.24, 35.96], [6.26, 35.96], [6.26, 35.98], [6.28, 35.98], [6.28, 35.96], [6.3, 35.96], [6.32, 35.96], [6.3, 35.96], [6.3, 35.98], [6.32, 35.98], [6.34, 35.98], [6.36, 35.98], [6.36, 36], [6.38, 36], [6.38, 36.02], [6.4, 36.02], [6.4, 36.04], [6.4, 36.06], [6.4, 36.08], [6.42, 36.08], [6.4, 36.08], [6.42, 36.08], [6.4, 36.08], [6.4, 36.1], [6.4, 36.12], [6.42, 36.14], [6.44, 36.14], [6.44, 36.16], [6.46, 36.16], [6.48, 36.16], [6.5, 36.16], [6.52, 36.16], [6.52, 36.18], [6.54, 36.18], [6.54, 36.2], [6.52, 36.2], [6.54, 36.2], [6.54, 36.22], [6.52, 36.22], [6.52, 36.24], [6.5, 36.24], [6.5, 36.26], [6.48, 36.26], [6.46, 36.26], [6.46, 36.24], [6.44, 36.24], [6.44, 36.26], [6.42, 36.26], [6.42, 36.24], [6.42, 36.26], [6.42, 36.24], [6.42, 36.26], [6.4, 36.26], [6.4, 36.28], [6.42, 36.3], [6.44, 36.3], [6.44, 36.32], [6.42, 36.32], [6.4, 36.32], [6.4, 36.34], [6.38, 36.34], [6.38, 36.36], [6.36, 36.36], [6.34, 36.36], [6.34, 36.34], [6.32, 36.34], [6.3, 36.34], [6.32, 36.34], [6.32, 36.36], [6.32, 36.38], [6.34, 36.38], [6.34, 36.4], [6.36, 36.4], [6.36, 36.42], [6.36, 36.44], [6.34, 36.44], [6.34, 36.46], [6.36, 36.46], [6.36, 36.48], [6.36, 36.5], [6.34, 36.5], [6.36, 36.5], [6.38, 36.5], [6.38, 36.48], [6.38, 36.5], [6.4, 36.5], [6.42, 36.5], [6.44, 36.5], [6.46, 36.5], [6.48, 36.5], [6.48, 36.52], [6.5, 36.52], [6.5, 36.54], [6.5, 36.56], [6.5, 36.58], [6.52, 36.58], [6.5, 36.58], [6.48, 36.58], [6.46, 36.58], [6.44, 36.58], [6.42, 36.58], [6.4, 36.58], [6.4, 36.6], [6.38, 36.6], [6.36, 36.6], [6.34, 36.6], [6.34, 36.62], [6.32, 36.62], [6.3, 36.62], [6.28, 36.62], [6.26, 36.62], [6.26, 36.6], [6.24, 36.6], [6.24, 36.58], [6.22, 36.58], [6.2, 36.58], [6.18, 36.58], [6.16, 36.58], [6.14, 36.58], [6.14, 36.6], [6.12, 36.6], [6.1, 36.6], [6.08, 36.6], [6.06, 36.6], [6.06, 36.62], [6.04, 36.62], [6.04, 36.6], [6.02, 36.6], [6.02, 36.62], [6, 36.62], [5.98, 36.62], [5.98, 36.6], [5.96, 36.6], [5.96, 36.58], [5.94, 36.58], [5.94, 36.56], [5.92, 36.56], [5.9, 36.56], [5.88, 36.56], [5.86, 36.56], [5.86, 36.54], [5.84, 36.54], [5.84, 36.56], [5.82, 36.56], [5.8, 36.56], [5.78, 36.56], [5.78, 36.58], [5.78, 36.56], [5.76, 36.56], [5.76, 36.58], [5.76, 36.56], [5.74, 36.56]]] } }, { type: "Feature", properties: { code: 44, fr: "A\xEFn Defla", ar: "\u0639\u064A\u0646 \u0627\u0644\u062F\u0641\u0644\u0649", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[1.52, 36.38], [1.52, 36.36], [1.54, 36.36], [1.52, 36.36], [1.54, 36.36], [1.54, 36.34], [1.52, 36.34], [1.54, 36.34], [1.54, 36.32], [1.56, 36.32], [1.56, 36.3], [1.58, 36.3], [1.58, 36.28], [1.6, 36.28], [1.6, 36.3], [1.6, 36.28], [1.58, 36.28], [1.58, 36.26], [1.56, 36.26], [1.56, 36.24], [1.54, 36.24], [1.56, 36.24], [1.58, 36.24], [1.6, 36.24], [1.58, 36.24], [1.6, 36.24], [1.6, 36.22], [1.6, 36.24], [1.62, 36.24], [1.62, 36.22], [1.64, 36.22], [1.64, 36.2], [1.62, 36.2], [1.6, 36.2], [1.6, 36.18], [1.58, 36.18], [1.56, 36.18], [1.58, 36.18], [1.58, 36.16], [1.56, 36.16], [1.58, 36.16], [1.58, 36.14], [1.56, 36.14], [1.58, 36.14], [1.58, 36.12], [1.6, 36.12], [1.62, 36.12], [1.64, 36.12], [1.64, 36.1], [1.62, 36.1], [1.64, 36.1], [1.62, 36.1], [1.62, 36.08], [1.64, 36.08], [1.64, 36.06], [1.66, 36.06], [1.66, 36.04], [1.68, 36.04], [1.66, 36.04], [1.66, 36.02], [1.68, 36.02], [1.7, 36.02], [1.7, 36], [1.7, 35.98], [1.72, 35.98], [1.72, 36], [1.72, 35.98], [1.72, 35.96], [1.7, 35.96], [1.72, 35.96], [1.72, 35.94], [1.7, 35.94], [1.7, 35.92], [1.72, 35.92], [1.74, 35.92], [1.76, 35.92], [1.78, 35.92], [1.8, 35.92], [1.8, 35.9], [1.82, 35.9], [1.82, 35.88], [1.82, 35.86], [1.84, 35.86], [1.86, 35.86], [1.86, 35.88], [1.86, 35.86], [1.88, 35.86], [1.88, 35.88], [1.88, 35.9], [1.9, 35.9], [1.9, 35.92], [1.92, 35.92], [1.94, 35.94], [1.96, 35.94], [1.96, 35.96], [1.98, 35.96], [1.98, 35.98], [2, 35.98], [2, 35.96], [1.98, 35.96], [1.98, 35.94], [2, 35.94], [2.02, 35.94], [2.04, 35.94], [2.06, 35.94], [2.06, 35.96], [2.08, 35.96], [2.1, 35.96], [2.12, 35.96], [2.14, 35.96], [2.14, 35.94], [2.14, 35.92], [2.14, 35.94], [2.14, 35.92], [2.14, 35.94], [2.16, 35.94], [2.16, 35.92], [2.16, 35.94], [2.18, 35.94], [2.18, 35.92], [2.2, 35.92], [2.22, 35.92], [2.22, 35.9], [2.24, 35.9], [2.24, 35.88], [2.26, 35.88], [2.28, 35.88], [2.3, 35.88], [2.32, 35.88], [2.32, 35.9], [2.34, 35.9], [2.36, 35.9], [2.34, 35.9], [2.36, 35.9], [2.36, 35.92], [2.34, 35.92], [2.36, 35.92], [2.36, 35.94], [2.34, 35.94], [2.34, 35.96], [2.36, 35.96], [2.38, 35.96], [2.38, 35.94], [2.38, 35.96], [2.38, 35.94], [2.38, 35.96], [2.4, 35.96], [2.4, 35.94], [2.42, 35.94], [2.44, 35.94], [2.44, 35.96], [2.46, 35.96], [2.46, 35.98], [2.44, 35.98], [2.46, 35.98], [2.46, 36], [2.46, 36.02], [2.46, 36.04], [2.46, 36.06], [2.48, 36.06], [2.5, 36.04], [2.5, 36.06], [2.52, 36.06], [2.52, 36.08], [2.54, 36.08], [2.56, 36.08], [2.56, 36.1], [2.58, 36.1], [2.6, 36.1], [2.6, 36.12], [2.58, 36.12], [2.6, 36.12], [2.6, 36.14], [2.58, 36.14], [2.6, 36.14], [2.58, 36.14], [2.6, 36.14], [2.58, 36.14], [2.58, 36.16], [2.6, 36.16], [2.58, 36.16], [2.56, 36.16], [2.56, 36.18], [2.54, 36.18], [2.56, 36.18], [2.54, 36.18], [2.52, 36.18], [2.52, 36.2], [2.5, 36.2], [2.5, 36.22], [2.52, 36.22], [2.5, 36.22], [2.5, 36.24], [2.48, 36.24], [2.5, 36.24], [2.5, 36.26], [2.52, 36.26], [2.52, 36.28], [2.52, 36.3], [2.52, 36.32], [2.54, 36.32], [2.56, 36.32], [2.58, 36.3], [2.58, 36.32], [2.6, 36.32], [2.62, 36.32], [2.62, 36.34], [2.6, 36.34], [2.58, 36.34], [2.56, 36.34], [2.56, 36.36], [2.56, 36.38], [2.58, 36.38], [2.56, 36.38], [2.54, 36.38], [2.52, 36.38], [2.52, 36.4], [2.5, 36.4], [2.5, 36.42], [2.5, 36.4], [2.5, 36.42], [2.5, 36.4], [2.5, 36.42], [2.5, 36.4], [2.5, 36.42], [2.48, 36.42], [2.48, 36.4], [2.48, 36.42], [2.46, 36.42], [2.44, 36.42], [2.42, 36.42], [2.4, 36.42], [2.38, 36.42], [2.36, 36.42], [2.34, 36.42], [2.32, 36.42], [2.3, 36.42], [2.28, 36.42], [2.26, 36.42], [2.24, 36.42], [2.24, 36.44], [2.22, 36.44], [2.22, 36.42], [2.22, 36.44], [2.2, 36.44], [2.18, 36.44], [2.16, 36.44], [2.14, 36.44], [2.12, 36.44], [2.1, 36.44], [2.08, 36.44], [2.08, 36.42], [2.06, 36.42], [2.04, 36.42], [2.02, 36.42], [2, 36.42], [1.98, 36.42], [1.96, 36.42], [1.94, 36.42], [1.92, 36.42], [1.92, 36.44], [1.9, 36.44], [1.88, 36.44], [1.86, 36.44], [1.84, 36.44], [1.82, 36.44], [1.82, 36.42], [1.82, 36.44], [1.8, 36.44], [1.78, 36.44], [1.78, 36.42], [1.78, 36.4], [1.76, 36.4], [1.76, 36.38], [1.74, 36.38], [1.72, 36.38], [1.72, 36.36], [1.7, 36.36], [1.7, 36.38], [1.7, 36.4], [1.68, 36.4], [1.68, 36.42], [1.66, 36.42], [1.66, 36.44], [1.64, 36.44], [1.64, 36.46], [1.64, 36.44], [1.62, 36.44], [1.62, 36.42], [1.6, 36.42], [1.58, 36.42], [1.58, 36.4], [1.56, 36.4], [1.54, 36.4], [1.54, 36.38], [1.52, 36.38]]] } }, { type: "Feature", properties: { code: 45, fr: "Na\xE2ma", ar: "\u0627\u0644\u0646\u0639\u0627\u0645\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[-1.74, 33.7], [-1.72, 33.7], [-1.72, 33.68], [-1.7, 33.68], [-1.68, 33.68], [-1.66, 33.68], [-1.64, 33.68], [-1.64, 33.66], [-1.64, 33.64], [-1.62, 33.62], [-1.6, 33.62], [-1.6, 33.6], [-1.6, 33.58], [-1.6, 33.56], [-1.6, 33.54], [-1.58, 33.52], [-1.6, 33.52], [-1.6, 33.5], [-1.62, 33.5], [-1.62, 33.48], [-1.62, 33.46], [-1.62, 33.44], [-1.64, 33.42], [-1.64, 33.4], [-1.66, 33.4], [-1.66, 33.38], [-1.66, 33.36], [-1.66, 33.34], [-1.66, 33.32], [-1.66, 33.3], [-1.66, 33.28], [-1.68, 33.28], [-1.66, 33.28], [-1.66, 33.26], [-1.64, 33.26], [-1.64, 33.24], [-1.64, 33.22], [-1.62, 33.22], [-1.6, 33.22], [-1.6, 33.2], [-1.6, 33.18], [-1.58, 33.18], [-1.58, 33.16], [-1.58, 33.14], [-1.56, 33.14], [-1.56, 33.12], [-1.54, 33.12], [-1.54, 33.1], [-1.52, 33.1], [-1.5, 33.1], [-1.5, 33.08], [-1.48, 33.08], [-1.48, 33.06], [-1.46, 33.06], [-1.46, 33.04], [-1.48, 33.02], [-1.48, 33], [-1.48, 32.98], [-1.5, 32.96], [-1.52, 32.96], [-1.54, 32.96], [-1.52, 32.94], [-1.5, 32.9], [-1.4, 32.76], [-1.38, 32.74], [-1.36, 32.74], [-1.32, 32.72], [-1.3, 32.7], [-1.28, 32.7], [-1.26, 32.7], [-1.26, 32.68], [-1.22, 32.66], [-1.18, 32.64], [-1.12, 32.6], [-1.1, 32.58], [-1.04, 32.54], [-1.02, 32.54], [-1, 32.52], [-1, 32.5], [-1.02, 32.5], [-1.02, 32.48], [-1.04, 32.48], [-1.04, 32.46], [-1.06, 32.46], [-1.08, 32.44], [-1.1, 32.44], [-1.1, 32.42], [-1.12, 32.42], [-1.12, 32.4], [-1.12, 32.38], [-1.14, 32.38], [-1.14, 32.36], [-1.14, 32.34], [-1.12, 32.34], [-1.12, 32.32], [-1.1, 32.32], [-1.08, 32.32], [-1.06, 32.32], [-1.06, 32.3], [-1.06, 32.28], [-1.06, 32.26], [-1.08, 32.24], [-1.08, 32.22], [-1.08, 32.2], [-1.06, 32.2], [-1.04, 32.2], [-1.02, 32.2], [-1, 32.2], [-1, 32.18], [-1, 32.16], [-1, 32.14], [-0.98, 32.14], [-0.98, 32.16], [-0.96, 32.16], [-0.94, 32.16], [-0.94, 32.18], [-0.92, 32.18], [-0.9, 32.18], [-0.88, 32.2], [-0.86, 32.2], [-0.84, 32.2], [-0.84, 32.22], [-0.82, 32.22], [-0.8, 32.24], [-0.78, 32.24], [-0.76, 32.26], [-0.74, 32.26], [-0.74, 32.28], [-0.58, 32.24], [-0.42, 32.2], [-0.34, 32.26], [-0.22, 32.24], [-0.16, 32.34], [-0.14, 32.34], [-0.12, 32.36], [-0.12, 32.38], [-0.1, 32.4], [-0.1, 32.42], [-0.08, 32.44], [-0.06, 32.46], [-0.06, 32.48], [-0.04, 32.52], [-0.02, 32.54], [-0.02, 32.56], [-0.02, 32.58], [-0.02, 32.6], [-0.02, 32.62], [-0.04, 32.62], [-0.04, 32.66], [-0.02, 32.68], [-0.02, 32.7], [-0.02, 32.72], [-0.04, 32.72], [-0.06, 32.74], [-0.06, 32.76], [-0.06, 32.78], [-0.06, 32.8], [-0.08, 32.8], [-0.1, 32.82], [-0.1, 32.84], [-0.08, 32.86], [-0.08, 32.88], [-0.06, 32.9], [-0.04, 32.9], [-0.02, 32.92], [0, 32.92], [0, 32.94], [0, 32.96], [0.02, 32.98], [0, 33], [-0.02, 33], [0, 33], [0, 33.02], [0.02, 33.02], [0.02, 33.04], [0.02, 33.06], [0.02, 33.08], [0, 33.08], [0, 33.1], [-0.02, 33.1], [-0.02, 33.12], [-0.02, 33.14], [-0.02, 33.16], [0, 33.16], [0, 33.18], [0, 33.2], [0, 33.22], [0, 33.24], [0, 33.26], [0.02, 33.28], [0.02, 33.3], [0.02, 33.32], [0.02, 33.34], [0.04, 33.42], [0.06, 33.48], [0.06, 33.5], [0.08, 33.54], [0.08, 33.58], [0.1, 33.62], [0.12, 33.64], [0.1, 33.64], [0.1, 33.66], [0.1, 33.68], [0.1, 33.7], [0.08, 33.72], [0.08, 33.74], [0.08, 33.76], [0.08, 33.78], [0.1, 33.78], [0.12, 33.78], [0.14, 33.8], [0.16, 33.8], [0.14, 33.82], [0.12, 33.82], [0.12, 33.84], [0.12, 33.86], [0.1, 33.86], [0.1, 33.88], [0.08, 33.88], [0.06, 33.9], [0.06, 33.92], [0.06, 33.94], [0.06, 33.96], [0.06, 33.98], [0.08, 34], [0.06, 34], [0.04, 34.02], [0.02, 34.02], [0, 34.02], [0, 34], [-0.02, 34], [-0.04, 34], [-0.06, 34], [-0.06, 33.98], [-0.06, 34], [-0.04, 34], [-0.04, 34.02], [-0.06, 34.02], [-0.06, 34.04], [-0.06, 34.06], [-0.06, 34.08], [-0.08, 34.08], [-0.1, 34.08], [-0.12, 34.08], [-0.12, 34.1], [-0.14, 34.1], [-0.14, 34.08], [-0.16, 34.08], [-0.18, 34.08], [-0.18, 34.06], [-0.2, 34.06], [-0.22, 34.06], [-0.24, 34.04], [-0.26, 34.04], [-0.26, 34.02], [-0.28, 34], [-0.28, 33.98], [-0.3, 33.98], [-0.3, 33.96], [-0.32, 33.96], [-0.34, 33.96], [-0.36, 33.94], [-0.34, 33.92], [-0.36, 33.9], [-0.36, 33.92], [-0.36, 33.94], [-0.38, 33.94], [-0.4, 33.94], [-0.38, 33.96], [-0.38, 33.98], [-0.4, 34], [-0.4, 34.02], [-0.4, 34.04], [-0.4, 34.06], [-0.42, 34.06], [-0.44, 34.08], [-0.44, 34.1], [-0.44, 34.12], [-0.46, 34.12], [-0.48, 34.14], [-0.48, 34.16], [-0.48, 34.18], [-0.48, 34.22], [-0.48, 34.24], [-0.5, 34.26], [-0.5, 34.28], [-0.52, 34.28], [-0.54, 34.3], [-0.56, 34.3], [-0.58, 34.3], [-0.6, 34.32], [-0.62, 34.32], [-0.64, 34.3], [-0.7, 34.28], [-0.78, 34.24], [-0.78, 34.22], [-0.8, 34.22], [-0.8, 34.24], [-0.82, 34.24], [-0.84, 34.24], [-0.86, 34.24], [-0.88, 34.24], [-0.9, 34.24], [-0.92, 34.26], [-0.94, 34.26], [-0.94, 34.24], [-0.94, 34.26], [-0.94, 34.24], [-0.96, 34.24], [-0.96, 34.26], [-0.96, 34.28], [-0.98, 34.28], [-1, 34.26], [-1.02, 34.26], [-1.02, 34.24], [-1.04, 34.24], [-1.06, 34.22], [-1.08, 34.22], [-1.08, 34.24], [-1.1, 34.26], [-1.12, 34.26], [-1.12, 34.28], [-1.14, 34.28], [-1.16, 34.26], [-1.18, 34.26], [-1.2, 34.26], [-1.2, 34.24], [-1.22, 34.24], [-1.22, 34.22], [-1.24, 34.22], [-1.24, 34.2], [-1.26, 34.2], [-1.28, 34.2], [-1.3, 34.2], [-1.3, 34.22], [-1.32, 34.22], [-1.34, 34.2], [-1.36, 34.2], [-1.38, 34.2], [-1.4, 34.2], [-1.42, 34.2], [-1.44, 34.2], [-1.46, 34.2], [-1.48, 34.2], [-1.5, 34.2], [-1.5, 34.18], [-1.52, 34.18], [-1.52, 34.16], [-1.54, 34.16], [-1.56, 34.16], [-1.56, 34.14], [-1.58, 34.14], [-1.6, 34.14], [-1.6, 34.12], [-1.62, 34.12], [-1.64, 34.1], [-1.66, 34.1], [-1.66, 34.08], [-1.66, 34.06], [-1.66, 34.04], [-1.66, 34.02], [-1.66, 34], [-1.68, 33.92], [-1.7, 33.9], [-1.7, 33.86], [-1.68, 33.82], [-1.68, 33.8], [-1.68, 33.78], [-1.68, 33.76], [-1.7, 33.76], [-1.7, 33.74], [-1.72, 33.74], [-1.74, 33.7]]] } }, { type: "Feature", properties: { code: 46, fr: "A\xEFn T\xE9mouchent", ar: "\u0639\u064A\u0646 \u062A\u0645\u0648\u0634\u0646\u062A", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[-1.58, 35.24], [-1.58, 35.22], [-1.56, 35.22], [-1.54, 35.22], [-1.54, 35.2], [-1.56, 35.2], [-1.56, 35.18], [-1.54, 35.18], [-1.52, 35.18], [-1.54, 35.18], [-1.52, 35.18], [-1.52, 35.16], [-1.5, 35.16], [-1.48, 35.16], [-1.46, 35.16], [-1.44, 35.16], [-1.44, 35.18], [-1.46, 35.18], [-1.44, 35.18], [-1.44, 35.2], [-1.42, 35.2], [-1.42, 35.22], [-1.4, 35.2], [-1.38, 35.2], [-1.38, 35.22], [-1.36, 35.22], [-1.36, 35.2], [-1.34, 35.2], [-1.32, 35.2], [-1.3, 35.2], [-1.3, 35.18], [-1.3, 35.2], [-1.28, 35.2], [-1.26, 35.2], [-1.24, 35.2], [-1.26, 35.2], [-1.24, 35.2], [-1.24, 35.18], [-1.22, 35.18], [-1.22, 35.2], [-1.22, 35.18], [-1.2, 35.18], [-1.2, 35.16], [-1.2, 35.18], [-1.18, 35.18], [-1.18, 35.16], [-1.16, 35.16], [-1.14, 35.16], [-1.12, 35.16], [-1.14, 35.16], [-1.12, 35.16], [-1.14, 35.16], [-1.14, 35.14], [-1.12, 35.14], [-1.1, 35.14], [-1.08, 35.14], [-1.08, 35.12], [-1.06, 35.12], [-1.04, 35.12], [-1.04, 35.1], [-1.02, 35.1], [-1.02, 35.08], [-1.02, 35.1], [-1, 35.1], [-0.98, 35.1], [-0.98, 35.12], [-0.96, 35.12], [-0.96, 35.14], [-0.96, 35.16], [-0.94, 35.16], [-0.96, 35.16], [-0.96, 35.18], [-0.94, 35.16], [-0.94, 35.18], [-0.92, 35.18], [-0.9, 35.18], [-0.9, 35.2], [-0.9, 35.18], [-0.9, 35.2], [-0.88, 35.2], [-0.88, 35.22], [-0.9, 35.22], [-0.9, 35.24], [-0.9, 35.26], [-0.88, 35.26], [-0.88, 35.28], [-0.86, 35.28], [-0.86, 35.3], [-0.84, 35.3], [-0.84, 35.32], [-0.82, 35.32], [-0.82, 35.3], [-0.8, 35.3], [-0.78, 35.3], [-0.76, 35.3], [-0.76, 35.32], [-0.74, 35.32], [-0.76, 35.32], [-0.74, 35.32], [-0.76, 35.32], [-0.76, 35.34], [-0.74, 35.34], [-0.72, 35.34], [-0.7, 35.34], [-0.68, 35.34], [-0.66, 35.34], [-0.66, 35.36], [-0.64, 35.36], [-0.62, 35.36], [-0.62, 35.38], [-0.6, 35.38], [-0.62, 35.4], [-0.62, 35.42], [-0.6, 35.42], [-0.58, 35.42], [-0.58, 35.44], [-0.6, 35.44], [-0.6, 35.46], [-0.6, 35.48], [-0.6, 35.5], [-0.62, 35.5], [-0.62, 35.52], [-0.62, 35.54], [-0.64, 35.54], [-0.64, 35.52], [-0.66, 35.52], [-0.68, 35.52], [-0.7, 35.52], [-0.72, 35.52], [-0.74, 35.52], [-0.76, 35.52], [-0.76, 35.5], [-0.78, 35.5], [-0.8, 35.5], [-0.82, 35.5], [-0.82, 35.48], [-0.84, 35.48], [-0.86, 35.48], [-0.88, 35.48], [-0.9, 35.48], [-0.92, 35.48], [-0.94, 35.48], [-0.96, 35.48], [-0.96, 35.5], [-0.98, 35.5], [-0.98, 35.48], [-0.96, 35.48], [-0.98, 35.48], [-1, 35.48], [-1, 35.46], [-1, 35.48], [-1, 35.46], [-1, 35.44], [-1, 35.46], [-1, 35.44], [-1, 35.46], [-1.02, 35.46], [-1, 35.46], [-1.02, 35.46], [-1, 35.46], [-1.02, 35.46], [-1.02, 35.48], [-1.02, 35.5], [-1, 35.5], [-0.98, 35.5], [-0.98, 35.52], [-0.96, 35.54], [-0.96, 35.56], [-0.98, 35.56], [-1, 35.56], [-1, 35.58], [-1.02, 35.58], [-1.02, 35.6], [-1.04, 35.6], [-1.04, 35.62], [-1.06, 35.62], [-1.04, 35.62], [-1.04, 35.64], [-1.06, 35.64], [-1.08, 35.64], [-1.06, 35.64], [-1.08, 35.64], [-1.06, 35.64], [-1.08, 35.64], [-1.08, 35.62], [-1.1, 35.62], [-1.12, 35.62], [-1.12, 35.6], [-1.14, 35.6], [-1.14, 35.58], [-1.14, 35.6], [-1.14, 35.58], [-1.16, 35.58], [-1.14, 35.58], [-1.16, 35.58], [-1.18, 35.58], [-1.2, 35.58], [-1.2, 35.56], [-1.2, 35.58], [-1.2, 35.56], [-1.2, 35.54], [-1.2, 35.52], [-1.22, 35.52], [-1.2, 35.52], [-1.22, 35.52], [-1.22, 35.5], [-1.22, 35.48], [-1.22, 35.46], [-1.24, 35.46], [-1.24, 35.44], [-1.24, 35.42], [-1.26, 35.42], [-1.24, 35.42], [-1.26, 35.42], [-1.24, 35.42], [-1.26, 35.42], [-1.26, 35.4], [-1.26, 35.38], [-1.28, 35.38], [-1.26, 35.38], [-1.28, 35.38], [-1.28, 35.36], [-1.3, 35.36], [-1.3, 35.34], [-1.3, 35.36], [-1.3, 35.34], [-1.3, 35.36], [-1.32, 35.36], [-1.32, 35.34], [-1.32, 35.36], [-1.32, 35.34], [-1.34, 35.34], [-1.34, 35.32], [-1.36, 35.32], [-1.38, 35.32], [-1.38, 35.3], [-1.4, 35.3], [-1.38, 35.3], [-1.4, 35.3], [-1.38, 35.3], [-1.4, 35.3], [-1.38, 35.3], [-1.4, 35.3], [-1.42, 35.3], [-1.44, 35.3], [-1.46, 35.3], [-1.48, 35.3], [-1.48, 35.28], [-1.5, 35.28], [-1.52, 35.28], [-1.54, 35.28], [-1.56, 35.28], [-1.56, 35.26], [-1.58, 35.26], [-1.58, 35.24]]] } }, { type: "Feature", properties: { code: 47, fr: "Gharda\xEFa", ar: "\u063A\u0631\u062F\u0627\u064A\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[2.24, 32.8], [2.24, 32.74], [2.26, 32.68], [2.26, 32.62], [2.28, 32.56], [2.28, 32.54], [2.52, 32.34], [2.96, 32.18], [3.26, 32.12], [3.28, 32.12], [3.28, 32.1], [3.3, 32.1], [3.32, 32.1], [3.34, 32.1], [3.36, 32.1], [3.82, 32.02], [3.84, 32.02], [3.86, 32.02], [3.88, 32.02], [3.88, 32], [3.9, 32], [3.92, 32], [3.92, 31.98], [3.94, 31.98], [3.94, 32], [3.96, 32], [3.96, 31.98], [3.96, 32], [3.98, 32], [3.98, 31.98], [4, 31.98], [4.02, 31.98], [4.02, 31.96], [4.04, 31.96], [4.06, 31.96], [4.06, 31.94], [4.08, 31.94], [4.1, 31.94], [4.12, 31.94], [4.14, 31.94], [4.16, 31.94], [4.18, 31.94], [4.18, 31.92], [4.2, 31.92], [4.2, 31.9], [4.22, 31.9], [4.22, 31.88], [4.24, 31.88], [4.26, 31.88], [4.26, 31.86], [4.28, 31.86], [4.3, 31.86], [4.3, 31.84], [4.32, 31.84], [4.34, 31.84], [4.36, 31.84], [4.36, 31.82], [4.38, 31.82], [4.38, 31.84], [4.4, 31.84], [4.4, 31.82], [4.4, 31.8], [4.42, 31.8], [4.42, 31.92], [4.42, 32], [4.44, 32], [4.44, 32.02], [4.44, 32.04], [4.44, 32.08], [4.44, 32.12], [4.44, 32.14], [4.46, 32.18], [4.46, 32.2], [4.46, 32.22], [4.56, 32.3], [4.66, 32.38], [4.78, 32.5], [4.8, 32.5], [4.82, 32.54], [4.86, 32.62], [4.94, 32.74], [4.98, 32.8], [5, 32.82], [5.02, 32.84], [5.02, 32.86], [5, 32.86], [4.98, 32.86], [4.94, 32.88], [4.78, 32.92], [4.6, 32.96], [4.48, 32.98], [4.48, 33], [4.46, 33], [4.42, 33], [4.38, 33], [4.36, 33], [4.34, 33], [4.3, 33], [4.22, 33], [4.16, 33.02], [4.14, 33.02], [4.12, 33.02], [4.1, 33.02], [4.08, 33.02], [4.06, 33.02], [4.02, 33.02], [4, 33.02], [3.98, 33.02], [3.96, 33.02], [3.94, 33.02], [3.92, 33.02], [3.9, 33.02], [3.88, 33.02], [3.88, 33.04], [3.86, 33.02], [3.84, 33.02], [3.84, 33.04], [3.82, 33.04], [3.8, 33.04], [3.78, 33.04], [3.78, 33.06], [3.76, 33.06], [3.74, 33.06], [3.74, 33.04], [3.72, 33.04], [3.72, 33.06], [3.7, 33.06], [3.68, 33.06], [3.66, 33.06], [3.66, 33.08], [3.66, 33.06], [3.64, 33.06], [3.64, 33.04], [3.62, 33.04], [3.62, 33.06], [3.62, 33.04], [3.6, 33.04], [3.58, 33.04], [3.58, 33.02], [3.56, 33.02], [3.38, 33.02], [3.36, 33.02], [3.34, 33.02], [3.24, 33.02], [3.22, 33.02], [3.22, 33], [3.24, 33], [3.26, 32.98], [3.28, 32.98], [3.32, 32.96], [3.38, 32.92], [3.38, 32.86], [3.4, 32.82], [3.34, 32.82], [3.18, 32.86], [3.06, 32.88], [3.02, 32.9], [3, 32.9], [2.98, 32.9], [2.92, 32.88], [2.88, 32.88], [2.86, 32.88], [2.84, 32.88], [2.84, 32.86], [2.82, 32.86], [2.8, 32.86], [2.78, 32.86], [2.78, 32.84], [2.76, 32.84], [2.74, 32.84], [2.72, 32.84], [2.68, 32.84], [2.62, 32.84], [2.52, 32.82], [2.42, 32.82], [2.36, 32.82], [2.24, 32.8]]] } }, { type: "Feature", properties: { code: 48, fr: "Relizane", ar: "\u063A\u0644\u064A\u0632\u0627\u0646", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[0.22, 35.7], [0.24, 35.7], [0.26, 35.7], [0.26, 35.68], [0.26, 35.66], [0.28, 35.66], [0.26, 35.66], [0.28, 35.66], [0.28, 35.64], [0.28, 35.62], [0.3, 35.62], [0.3, 35.6], [0.28, 35.6], [0.3, 35.6], [0.3, 35.58], [0.28, 35.58], [0.3, 35.58], [0.32, 35.58], [0.3, 35.58], [0.32, 35.58], [0.3, 35.58], [0.3, 35.56], [0.32, 35.56], [0.34, 35.56], [0.36, 35.56], [0.38, 35.56], [0.38, 35.58], [0.4, 35.58], [0.4, 35.56], [0.42, 35.56], [0.44, 35.56], [0.44, 35.58], [0.44, 35.56], [0.46, 35.56], [0.48, 35.56], [0.48, 35.54], [0.5, 35.54], [0.5, 35.52], [0.52, 35.52], [0.54, 35.52], [0.56, 35.52], [0.58, 35.52], [0.6, 35.52], [0.6, 35.5], [0.62, 35.5], [0.64, 35.48], [0.66, 35.48], [0.68, 35.48], [0.7, 35.48], [0.72, 35.48], [0.72, 35.46], [0.74, 35.46], [0.76, 35.46], [0.78, 35.46], [0.8, 35.46], [0.8, 35.44], [0.82, 35.44], [0.82, 35.46], [0.82, 35.44], [0.84, 35.44], [0.84, 35.46], [0.86, 35.46], [0.84, 35.46], [0.86, 35.46], [0.86, 35.44], [0.88, 35.44], [0.88, 35.46], [0.88, 35.48], [0.9, 35.48], [0.9, 35.5], [0.9, 35.52], [0.92, 35.52], [0.9, 35.52], [0.92, 35.52], [0.9, 35.52], [0.92, 35.52], [0.92, 35.54], [0.94, 35.54], [0.96, 35.54], [0.94, 35.54], [0.96, 35.54], [0.96, 35.56], [0.98, 35.56], [0.98, 35.58], [1, 35.58], [1, 35.56], [1.02, 35.56], [1.02, 35.58], [1.02, 35.6], [1.04, 35.6], [1.06, 35.6], [1.06, 35.62], [1.06, 35.64], [1.08, 35.64], [1.08, 35.62], [1.1, 35.62], [1.12, 35.62], [1.12, 35.64], [1.12, 35.62], [1.14, 35.62], [1.16, 35.62], [1.16, 35.64], [1.18, 35.64], [1.18, 35.66], [1.2, 35.66], [1.22, 35.66], [1.22, 35.68], [1.24, 35.68], [1.26, 35.68], [1.26, 35.7], [1.28, 35.7], [1.28, 35.72], [1.28, 35.74], [1.28, 35.76], [1.28, 35.78], [1.28, 35.8], [1.3, 35.8], [1.28, 35.8], [1.3, 35.8], [1.32, 35.8], [1.32, 35.82], [1.32, 35.8], [1.34, 35.8], [1.34, 35.78], [1.36, 35.78], [1.38, 35.78], [1.4, 35.78], [1.4, 35.8], [1.4, 35.82], [1.42, 35.82], [1.42, 35.84], [1.42, 35.82], [1.4, 35.82], [1.4, 35.84], [1.38, 35.84], [1.4, 35.84], [1.4, 35.86], [1.38, 35.86], [1.36, 35.86], [1.38, 35.86], [1.36, 35.88], [1.36, 35.9], [1.34, 35.9], [1.34, 35.92], [1.32, 35.92], [1.32, 35.94], [1.3, 35.94], [1.3, 35.96], [1.3, 35.98], [1.28, 35.98], [1.28, 35.96], [1.26, 35.96], [1.24, 35.96], [1.22, 35.96], [1.2, 35.96], [1.2, 35.94], [1.18, 35.94], [1.16, 35.94], [1.14, 35.96], [1.12, 35.96], [1.12, 35.98], [1.12, 35.96], [1.12, 35.98], [1.12, 35.96], [1.12, 35.98], [1.1, 35.98], [1.08, 35.98], [1.08, 36], [1.06, 36], [1.06, 36.02], [1.06, 36.04], [1.04, 36.02], [1.02, 36.02], [1.02, 36.04], [1.04, 36.04], [1.02, 36.04], [1, 36.04], [1, 36.02], [0.98, 36.02], [0.96, 36.02], [0.96, 36.04], [0.94, 36.04], [0.96, 36.04], [0.96, 36.06], [0.94, 36.06], [0.92, 36.08], [0.92, 36.06], [0.92, 36.08], [0.92, 36.1], [0.92, 36.08], [0.9, 36.08], [0.9, 36.1], [0.92, 36.1], [0.94, 36.1], [0.94, 36.12], [0.94, 36.14], [0.94, 36.12], [0.94, 36.14], [0.94, 36.16], [0.92, 36.16], [0.92, 36.18], [0.92, 36.2], [0.9, 36.2], [0.92, 36.2], [0.9, 36.22], [0.88, 36.22], [0.86, 36.22], [0.84, 36.22], [0.84, 36.2], [0.84, 36.22], [0.82, 36.22], [0.82, 36.2], [0.8, 36.2], [0.78, 36.2], [0.76, 36.2], [0.74, 36.2], [0.72, 36.2], [0.7, 36.2], [0.68, 36.2], [0.7, 36.2], [0.7, 36.18], [0.68, 36.18], [0.66, 36.18], [0.66, 36.16], [0.66, 36.14], [0.66, 36.16], [0.64, 36.16], [0.64, 36.14], [0.62, 36.14], [0.62, 36.12], [0.6, 36.12], [0.62, 36.12], [0.6, 36.12], [0.6, 36.1], [0.62, 36.1], [0.6, 36.1], [0.62, 36.1], [0.62, 36.08], [0.64, 36.08], [0.64, 36.06], [0.66, 36.06], [0.66, 36.04], [0.64, 36.04], [0.64, 36.02], [0.66, 36.02], [0.66, 36], [0.64, 36], [0.66, 36], [0.64, 36], [0.66, 36], [0.64, 36], [0.62, 36], [0.6, 36], [0.6, 35.98], [0.58, 35.98], [0.56, 35.98], [0.56, 36], [0.54, 36], [0.54, 35.98], [0.52, 35.98], [0.52, 35.96], [0.52, 35.98], [0.5, 35.98], [0.48, 35.98], [0.46, 35.98], [0.46, 36], [0.46, 35.98], [0.44, 35.98], [0.44, 35.96], [0.42, 35.96], [0.44, 35.96], [0.44, 35.94], [0.44, 35.92], [0.46, 35.92], [0.48, 35.92], [0.46, 35.92], [0.46, 35.9], [0.48, 35.9], [0.46, 35.9], [0.46, 35.88], [0.44, 35.88], [0.46, 35.88], [0.46, 35.86], [0.46, 35.84], [0.44, 35.84], [0.42, 35.84], [0.42, 35.82], [0.4, 35.82], [0.4, 35.8], [0.38, 35.8], [0.4, 35.8], [0.38, 35.8], [0.36, 35.8], [0.34, 35.8], [0.34, 35.78], [0.32, 35.78], [0.3, 35.78], [0.32, 35.78], [0.3, 35.78], [0.3, 35.76], [0.28, 35.76], [0.26, 35.76], [0.28, 35.76], [0.28, 35.74], [0.26, 35.74], [0.24, 35.74], [0.24, 35.72], [0.24, 35.7], [0.22, 35.7]]] } }, { type: "Feature", properties: { code: 49, fr: "Timimoun", ar: "\u062A\u064A\u0645\u064A\u0645\u0648\u0646", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[-0.92, 28.98], [-0.66, 28.84], [-0.26, 28.56], [-0.22, 28.52], [-0.04, 28.5], [0, 28.5], [0.02, 28.48], [0.18, 28.44], [0.4, 28.38], [0.74, 28.44], [0.98, 28.48], [1, 28.5], [1.18, 28.56], [1.66, 28.56], [1.68, 28.56], [1.7, 28.56], [1.72, 28.56], [1.74, 28.56], [1.76, 28.56], [1.78, 28.56], [1.78, 28.58], [1.8, 28.58], [1.8, 28.56], [1.82, 28.56], [1.84, 28.56], [1.86, 28.56], [1.86, 28.54], [1.86, 28.52], [1.88, 28.52], [1.88, 28.5], [1.9, 28.5], [1.9, 28.52], [1.92, 28.52], [1.92, 28.5], [1.94, 28.5], [1.96, 28.5], [1.98, 28.5], [2, 28.5], [2, 28.48], [1.98, 28.48], [2, 28.48], [2.02, 28.64], [2.02, 28.66], [2.02, 28.68], [2.02, 28.7], [2.02, 28.72], [2.02, 28.74], [2.02, 28.8], [2.02, 28.82], [2.04, 28.86], [2.04, 28.9], [2.04, 28.94], [2.06, 28.98], [2.06, 29], [2.1, 29.08], [2.08, 29.18], [2.06, 29.26], [2.02, 29.42], [2.02, 29.44], [2, 29.54], [1.96, 29.74], [1.92, 29.92], [1.9, 30], [1.9, 30.02], [1.92, 30.06], [1.92, 30.1], [1.94, 30.14], [1.94, 30.2], [1.96, 30.24], [1.98, 30.3], [2, 30.38], [2, 30.4], [2, 30.42], [2.02, 30.44], [2.02, 30.48], [2.02, 30.5], [2.02, 30.54], [2.02, 30.74], [2.02, 30.86], [2.04, 30.94], [2.04, 30.98], [2.04, 31], [2.04, 31.1], [2.06, 31.38], [2.06, 31.66], [2.04, 31.66], [2.04, 31.64], [2.02, 31.64], [2, 31.62], [1.98, 31.62], [1.94, 31.6], [1.9, 31.58], [1.84, 31.54], [1.76, 31.5], [1.68, 31.46], [1.62, 31.42], [1.5, 31.36], [1.36, 31.28], [1.24, 31.22], [1.22, 31.22], [1.1, 31.14], [1.04, 31.12], [1, 31.08], [0.94, 31.04], [0.86, 31], [0.82, 30.98], [0.64, 30.86], [0.38, 30.7], [0.22, 30.54], [0, 30.32], [-0.02, 30.28], [-0.06, 30.22], [-0.08, 30.2], [-0.1, 30.16], [-0.12, 30.14], [-0.14, 30.1], [-0.16, 30.08], [-0.18, 30.04], [-0.2, 30.02], [-0.22, 30.02], [-0.24, 30], [-0.26, 30], [-0.28, 29.98], [-0.32, 29.96], [-0.38, 29.9], [-0.48, 29.86], [-0.56, 29.8], [-0.62, 29.76], [-0.64, 29.74], [-0.64, 29.72], [-0.66, 29.68], [-0.66, 29.66], [-0.68, 29.62], [-0.68, 29.56], [-0.7, 29.56], [-0.68, 29.5], [-0.68, 29.44], [-0.66, 29.36], [-0.64, 29.32], [-0.64, 29.3], [-0.64, 29.28], [-0.64, 29.26], [-0.66, 29.24], [-0.66, 29.2], [-0.66, 29.18], [-0.7, 29.14], [-0.76, 29.1], [-0.82, 29.06], [-0.84, 29.04], [-0.88, 29], [-0.92, 28.98]]] } }, { type: "Feature", properties: { code: 50, fr: "Bordj Badji Mokhtar", ar: "\u0628\u0631\u062C \u0628\u0627\u062C\u064A \u0645\u062E\u062A\u0627\u0631", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[-4.84, 25], [-4.78, 24.98], [-4.74, 24.94], [-4.68, 24.9], [-4.64, 24.88], [-4.58, 24.84], [-4.48, 24.78], [-4.38, 24.7], [-4.3, 24.66], [-4.2, 24.58], [-4.1, 24.52], [-4, 24.46], [-3.9, 24.4], [-3.82, 24.34], [-3.7, 24.28], [-3.6, 24.2], [-3.54, 24.16], [-3.44, 24.1], [-3.34, 24.04], [-3.26, 23.98], [-3.18, 23.92], [-3.08, 23.86], [-2.98, 23.8], [-2.9, 23.74], [-2.8, 23.68], [-2.7, 23.62], [-2.6, 23.56], [-2.5, 23.48], [-2.4, 23.42], [-2.26, 23.32], [-2.16, 23.26], [-2.06, 23.2], [-1.96, 23.14], [-1.86, 23.08], [-1.76, 23], [-1.66, 22.96], [-1.58, 22.9], [-1.5, 22.84], [-1.4, 22.78], [-1.3, 22.72], [-1.22, 22.66], [-1.12, 22.6], [-1.02, 22.54], [-0.92, 22.46], [-0.82, 22.4], [-0.72, 22.34], [-0.62, 22.28], [-0.52, 22.2], [-0.4, 22.14], [-0.26, 22.04], [-0.16, 21.98], [-0.06, 21.92], [-0.02, 21.88], [0.04, 21.84], [0.14, 21.78], [0.24, 21.72], [0.34, 21.66], [0.4, 21.62], [0.5, 21.54], [0.6, 21.48], [0.7, 21.42], [0.8, 21.34], [0.9, 21.28], [0.98, 21.24], [1.08, 21.18], [1.16, 21.12], [1.16, 21.1], [1.16, 21.08], [1.18, 21.06], [1.2, 21], [1.18, 21], [1.18, 20.98], [1.18, 20.96], [1.2, 20.96], [1.2, 20.94], [1.2, 20.92], [1.18, 20.9], [1.18, 20.84], [1.18, 20.82], [1.16, 20.82], [1.16, 20.8], [1.16, 20.78], [1.16, 20.76], [1.16, 20.74], [1.18, 20.74], [1.18, 20.72], [1.2, 20.72], [1.22, 20.72], [1.24, 20.72], [1.24, 20.74], [1.26, 20.74], [1.28, 20.74], [1.3, 20.74], [1.32, 20.74], [1.34, 20.72], [1.34, 20.7], [1.36, 20.68], [1.38, 20.68], [1.38, 20.66], [1.4, 20.66], [1.42, 20.66], [1.44, 20.66], [1.44, 20.64], [1.46, 20.64], [1.48, 20.64], [1.5, 20.62], [1.52, 20.62], [1.54, 20.62], [1.56, 20.62], [1.56, 20.6], [1.58, 20.6], [1.6, 20.6], [1.6, 20.58], [1.62, 20.58], [1.64, 20.56], [1.64, 20.54], [1.66, 20.54], [1.66, 20.52], [1.66, 20.5], [1.68, 20.5], [1.68, 20.48], [1.66, 20.48], [1.66, 20.46], [1.66, 20.44], [1.68, 20.44], [1.66, 20.42], [1.66, 20.4], [1.68, 20.4], [1.7, 20.4], [1.7, 20.38], [1.72, 20.38], [1.72, 20.36], [1.74, 20.36], [1.76, 20.36], [1.76, 20.34], [1.78, 20.34], [1.78, 20.32], [1.78, 20.3], [1.8, 20.3], [1.82, 20.3], [1.82, 20.28], [1.82, 20.3], [1.84, 20.3], [1.86, 20.3], [1.88, 20.3], [1.88, 20.28], [1.9, 20.28], [1.9, 20.26], [1.9, 20.24], [1.92, 20.24], [1.92, 20.22], [1.94, 20.24], [1.94, 20.26], [1.96, 20.26], [1.98, 20.26], [1.98, 20.24], [2, 20.24], [2.02, 20.24], [2.02, 20.26], [2.04, 20.26], [2.06, 20.26], [2.08, 20.26], [2.08, 20.24], [2.1, 20.24], [2.12, 20.24], [2.14, 20.24], [2.14, 20.26], [2.16, 20.26], [2.18, 20.26], [2.18, 20.28], [2.2, 20.28], [2.18, 20.28], [2.2, 20.3], [2.18, 20.3], [2.2, 20.3], [2.2, 20.32], [2.22, 20.32], [2.22, 20.3], [2.24, 20.3], [2.26, 20.3], [2.28, 20.3], [2.28, 20.28], [2.3, 20.28], [2.32, 20.28], [2.32, 20.26], [2.3, 20.26], [2.3, 20.24], [2.32, 20.24], [2.32, 20.22], [2.34, 20.22], [2.34, 20.2], [2.36, 20.2], [2.36, 20.18], [2.36, 20.16], [2.38, 20.16], [2.38, 20.14], [2.4, 20.14], [2.4, 20.12], [2.4, 20.1], [2.38, 20.1], [2.38, 20.08], [2.38, 20.06], [2.38, 20.04], [2.38, 20.02], [2.38, 20.04], [2.4, 20.04], [2.4, 20.06], [2.4, 20.08], [2.42, 20.08], [2.44, 20.08], [2.46, 20.08], [2.46, 20.1], [2.48, 20.1], [2.5, 20.1], [2.48, 20.2], [2.44, 20.3], [2.4, 20.42], [2.36, 20.5], [2.3, 20.56], [2.26, 20.62], [2.24, 20.68], [2.24, 20.74], [2.26, 20.8], [2.26, 20.86], [2.22, 20.96], [2.22, 21.04], [2.2, 21.08], [2.16, 21.16], [2.14, 21.22], [2.1, 21.28], [2.04, 21.34], [2, 21.4], [1.96, 21.42], [1.92, 21.46], [1.86, 21.5], [1.84, 21.52], [1.82, 21.58], [1.82, 21.64], [1.8, 21.7], [1.78, 21.78], [1.78, 21.8], [1.78, 21.82], [1.76, 21.82], [1.74, 21.82], [1.7, 21.82], [1.68, 21.82], [1.64, 21.84], [1.6, 21.84], [1.56, 21.82], [1.5, 21.82], [1.48, 21.82], [1.44, 21.8], [1.42, 21.8], [1.42, 22.2], [1.42, 22.66], [1.42, 22.88], [1.42, 23.3], [1.42, 23.36], [1.42, 23.38], [1.42, 23.48], [1.42, 23.72], [1.42, 23.84], [1.42, 23.96], [1.42, 24], [1.2, 24.06], [0.86, 24.14], [0.34, 24.26], [0.08, 24.32], [0.02, 24.34], [0, 24.36], [-0.64, 24.5], [-1.36, 24.68], [-2.04, 24.82], [-2.64, 24.96], [-2.8, 24.98], [-2.82, 25], [-2.84, 25], [-2.86, 25], [-2.92, 25.02], [-3, 25.04], [-3.24, 25.08], [-3.5, 25.14], [-3.68, 25.18], [-4, 25.24], [-4.02, 25.24], [-4.2, 25.2], [-4.5, 25.1], [-4.84, 25]]] } }, { type: "Feature", properties: { code: 51, fr: "Ouled Djellal", ar: "\u0623\u0648\u0644\u0627\u062F \u062C\u0644\u0627\u0644", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[4.18, 34.22], [4.18, 34.2], [4.16, 34.2], [4.14, 34.2], [4.16, 34.18], [4.18, 34.18], [4.18, 34.16], [4.2, 34.14], [4.24, 34.16], [4.26, 34.14], [4.28, 34.14], [4.28, 34.12], [4.3, 34.12], [4.28, 34.12], [4.28, 34.1], [4.28, 34.08], [4.3, 34.08], [4.32, 34.06], [4.34, 34.06], [4.38, 34.06], [4.4, 34.06], [4.44, 34.04], [4.42, 34.02], [4.4, 34.04], [4.38, 34.04], [4.38, 34.02], [4.36, 34.02], [4.34, 34.02], [4.34, 34], [4.32, 34], [4.32, 33.98], [4.3, 33.98], [4.28, 33.96], [4.26, 33.98], [4.26, 33.96], [4.26, 33.98], [4.24, 33.98], [4.24, 33.96], [4.22, 33.96], [4.24, 33.94], [4.24, 33.92], [4.26, 33.92], [4.28, 33.92], [4.28, 33.9], [4.3, 33.9], [4.32, 33.9], [4.34, 33.9], [4.36, 33.9], [4.36, 33.88], [4.38, 33.88], [4.38, 33.86], [4.4, 33.86], [4.42, 33.86], [4.44, 33.84], [4.46, 33.84], [4.48, 33.84], [4.5, 33.84], [4.52, 33.82], [4.54, 33.82], [4.56, 33.82], [4.56, 33.8], [4.58, 33.8], [4.58, 33.78], [4.6, 33.78], [4.6, 33.76], [4.62, 33.74], [4.64, 33.74], [4.66, 33.74], [4.68, 33.74], [4.7, 33.74], [4.72, 33.74], [4.72, 33.72], [4.74, 33.72], [4.76, 33.72], [4.76, 33.7], [4.76, 33.68], [4.8, 33.7], [4.84, 33.7], [4.86, 33.7], [4.86, 33.68], [4.88, 33.68], [4.88, 33.66], [4.9, 33.64], [4.9, 33.66], [4.92, 33.66], [4.94, 33.66], [4.94, 33.64], [4.96, 33.64], [4.98, 33.64], [5, 33.64], [5.02, 33.62], [5.08, 33.6], [5.06, 33.58], [5.06, 33.5], [5.08, 33.5], [5.08, 33.48], [5.1, 33.48], [5.1, 33.46], [5.12, 33.46], [5.12, 33.44], [5.14, 33.44], [5.16, 33.44], [5.16, 33.42], [5.18, 33.42], [5.18, 33.4], [5.2, 33.4], [5.2, 33.38], [5.22, 33.36], [5.24, 33.36], [5.26, 33.38], [5.26, 33.4], [5.28, 33.42], [5.28, 33.44], [5.3, 33.44], [5.3, 33.46], [5.32, 33.46], [5.32, 33.48], [5.32, 33.5], [5.3, 33.5], [5.3, 33.52], [5.3, 33.54], [5.28, 33.54], [5.28, 33.56], [5.28, 33.58], [5.28, 33.6], [5.28, 33.62], [5.28, 33.64], [5.28, 33.66], [5.28, 33.68], [5.28, 33.7], [5.28, 33.72], [5.28, 33.74], [5.24, 33.8], [5.22, 33.82], [5.22, 33.84], [5.24, 33.86], [5.26, 33.88], [5.26, 33.9], [5.26, 33.94], [5.26, 33.96], [5.28, 33.98], [5.28, 34], [5.3, 34], [5.3, 34.02], [5.32, 34.04], [5.32, 34.06], [5.34, 34.06], [5.34, 34.08], [5.36, 34.12], [5.36, 34.16], [5.34, 34.18], [5.32, 34.2], [5.28, 34.24], [5.24, 34.26], [5.22, 34.28], [5.2, 34.28], [5.22, 34.3], [5.22, 34.34], [5.24, 34.34], [5.24, 34.36], [5.26, 34.36], [5.24, 34.36], [5.24, 34.38], [5.22, 34.38], [5.22, 34.4], [5.2, 34.4], [5.18, 34.4], [5.18, 34.42], [5.2, 34.42], [5.2, 34.44], [5.22, 34.44], [5.24, 34.44], [5.24, 34.46], [5.26, 34.46], [5.28, 34.46], [5.26, 34.46], [5.26, 34.48], [5.24, 34.48], [5.24, 34.5], [5.26, 34.5], [5.28, 34.5], [5.3, 34.5], [5.3, 34.52], [5.28, 34.52], [5.28, 34.54], [5.28, 34.56], [5.3, 34.56], [5.3, 34.58], [5.28, 34.6], [5.28, 34.64], [5.26, 34.64], [5.26, 34.66], [5.24, 34.66], [5.24, 34.68], [5.22, 34.68], [5.22, 34.7], [5.2, 34.7], [5.2, 34.72], [5.18, 34.72], [5.18, 34.74], [5.16, 34.74], [5.14, 34.74], [5.12, 34.74], [5.12, 34.76], [5.14, 34.78], [5.14, 34.8], [5.14, 34.82], [5.12, 34.82], [5.12, 34.84], [5.12, 34.86], [5.1, 34.86], [5.08, 34.86], [5.08, 34.84], [5.06, 34.84], [5.04, 34.84], [5.02, 34.84], [5, 34.84], [4.98, 34.84], [4.96, 34.86], [4.94, 34.86], [4.92, 34.86], [4.9, 34.86], [4.9, 34.84], [4.88, 34.84], [4.86, 34.84], [4.84, 34.84], [4.82, 34.84], [4.8, 34.84], [4.8, 34.82], [4.78, 34.82], [4.76, 34.82], [4.76, 34.84], [4.76, 34.82], [4.74, 34.82], [4.72, 34.82], [4.7, 34.82], [4.7, 34.8], [4.68, 34.8], [4.68, 34.78], [4.66, 34.78], [4.66, 34.76], [4.66, 34.78], [4.64, 34.76], [4.62, 34.76], [4.62, 34.74], [4.64, 34.74], [4.64, 34.72], [4.66, 34.72], [4.68, 34.72], [4.68, 34.7], [4.66, 34.7], [4.64, 34.7], [4.64, 34.68], [4.62, 34.68], [4.62, 34.7], [4.6, 34.7], [4.58, 34.7], [4.58, 34.68], [4.56, 34.68], [4.54, 34.68], [4.52, 34.68], [4.52, 34.66], [4.5, 34.66], [4.48, 34.66], [4.46, 34.66], [4.44, 34.66], [4.42, 34.66], [4.4, 34.66], [4.38, 34.66], [4.36, 34.66], [4.34, 34.66], [4.32, 34.66], [4.3, 34.66], [4.28, 34.66], [4.28, 34.64], [4.26, 34.64], [4.24, 34.62], [4.24, 34.6], [4.24, 34.58], [4.22, 34.58], [4.2, 34.58], [4.2, 34.56], [4.18, 34.56], [4.18, 34.54], [4.16, 34.54], [4.14, 34.54], [4.14, 34.52], [4.16, 34.52], [4.16, 34.5], [4.16, 34.48], [4.16, 34.46], [4.16, 34.44], [4.16, 34.42], [4.16, 34.4], [4.18, 34.4], [4.18, 34.38], [4.2, 34.38], [4.2, 34.36], [4.2, 34.38], [4.2, 34.36], [4.22, 34.36], [4.22, 34.34], [4.24, 34.34], [4.22, 34.34], [4.22, 34.32], [4.24, 34.32], [4.24, 34.3], [4.26, 34.3], [4.28, 34.28], [4.3, 34.28], [4.3, 34.26], [4.28, 34.26], [4.26, 34.26], [4.28, 34.26], [4.28, 34.24], [4.26, 34.24], [4.24, 34.24], [4.22, 34.24], [4.22, 34.22], [4.2, 34.22], [4.2, 34.24], [4.18, 34.24], [4.18, 34.22]]] } }, { type: "Feature", properties: { code: 52, fr: "B\xE9ni Abb\xE8s", ar: "\u0628\u0646\u064A \u0639\u0628\u0627\u0633", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[-5.5, 29.56], [-5.36, 29.46], [-5.26, 29.42], [-5.16, 29.42], [-5.06, 29.42], [-4.96, 29.42], [-4.88, 29.42], [-4.82, 29.38], [-4.74, 29.34], [-4.62, 29.3], [-4.6, 29.26], [-4.58, 29.18], [-4.54, 29.12], [-4.52, 29.06], [-4.5, 29], [-4.48, 28.92], [-4.44, 28.86], [-4.42, 28.8], [-4.4, 28.72], [-4.38, 28.66], [-4.36, 28.6], [-4.34, 28.54], [-4.32, 28.48], [-4.28, 28.44], [-4.22, 28.34], [-4.18, 28.28], [-4.12, 28.2], [-4.06, 28.1], [-4, 28], [-3.98, 27.94], [-3.98, 27.88], [-3.98, 27.82], [-3.98, 27.76], [-3.98, 27.7], [-3.94, 27.66], [-3.88, 27.62], [-3.84, 27.56], [-3.78, 27.5], [-3.72, 27.46], [-3.7, 27.44], [-3.64, 27.4], [-3.56, 27.34], [-3.52, 27.34], [-3.48, 27.34], [-3.4, 27.34], [-3.36, 27.32], [-3.28, 27.32], [-3.22, 27.32], [-3.16, 27.32], [-3.1, 27.3], [-3.06, 27.3], [-3.02, 27.3], [-2.98, 27.3], [-3, 27.32], [-3.04, 27.34], [-3.04, 27.36], [-3.02, 27.36], [-3.02, 27.38], [-3.02, 27.4], [-3, 27.42], [-3, 27.44], [-3, 27.46], [-3, 27.48], [-2.98, 27.48], [-2.98, 27.5], [-2.98, 27.52], [-2.98, 27.54], [-2.96, 27.54], [-2.96, 27.56], [-2.96, 27.58], [-2.96, 27.6], [-2.94, 27.6], [-2.94, 27.62], [-2.94, 27.64], [-2.94, 27.66], [-2.92, 27.68], [-2.92, 27.7], [-2.92, 27.72], [-2.9, 27.72], [-2.9, 27.74], [-2.9, 27.76], [-2.9, 27.78], [-2.88, 27.78], [-2.88, 27.8], [-2.88, 27.82], [-2.86, 27.82], [-2.86, 27.84], [-2.84, 27.84], [-2.84, 27.86], [-2.82, 27.86], [-2.82, 27.88], [-2.8, 27.88], [-2.8, 27.9], [-2.78, 27.9], [-2.78, 27.92], [-2.76, 27.92], [-2.76, 27.94], [-2.74, 27.94], [-2.74, 27.96], [-2.72, 27.96], [-2.72, 27.98], [-2.72, 28], [-2.7, 28], [-2.7, 28.02], [-2.68, 28.02], [-2.68, 28.04], [-2.66, 28.04], [-2.66, 28.06], [-2.64, 28.08], [-2.64, 28.1], [-2.62, 28.1], [-2.64, 28.12], [-2.64, 28.14], [-2.62, 28.14], [-2.62, 28.16], [-2.6, 28.16], [-2.6, 28.18], [-2.6, 28.2], [-2.58, 28.2], [-2.58, 28.22], [-2.56, 28.24], [-2.54, 28.24], [-2.52, 28.26], [-2.5, 28.28], [-2.48, 28.3], [-2.46, 28.32], [-2.42, 28.34], [-2.38, 28.36], [-2.36, 28.38], [-2.32, 28.42], [-2.3, 28.42], [-2.28, 28.46], [-2.24, 28.48], [-2.22, 28.52], [-2.2, 28.54], [-2.18, 28.58], [-2.16, 28.6], [-2.12, 28.64], [-2.1, 28.66], [-2.08, 28.7], [-2.06, 28.72], [-2.04, 28.76], [-2.02, 28.78], [-2, 28.8], [-1.96, 28.8], [-1.9, 28.82], [-1.86, 28.84], [-1.7, 28.88], [-1.6, 28.9], [-1.46, 28.94], [-1.42, 28.96], [-1.32, 28.96], [-1.22, 28.96], [-1.14, 28.96], [-1.06, 28.98], [-1.04, 28.98], [-1, 28.98], [-0.92, 28.98], [-0.88, 29], [-0.84, 29.04], [-0.82, 29.06], [-0.76, 29.1], [-0.7, 29.14], [-0.66, 29.18], [-0.66, 29.2], [-0.66, 29.24], [-0.64, 29.26], [-0.64, 29.28], [-0.64, 29.3], [-0.64, 29.32], [-0.66, 29.36], [-0.68, 29.44], [-0.68, 29.5], [-0.7, 29.56], [-0.68, 29.56], [-0.68, 29.62], [-0.66, 29.66], [-0.66, 29.68], [-0.64, 29.72], [-0.64, 29.74], [-0.62, 29.76], [-0.56, 29.8], [-0.48, 29.86], [-0.38, 29.9], [-0.32, 29.96], [-0.28, 29.98], [-0.26, 30], [-0.24, 30], [-0.22, 30.02], [-0.2, 30.02], [-0.18, 30.04], [-0.16, 30.08], [-0.14, 30.1], [-0.12, 30.14], [-0.1, 30.16], [-0.08, 30.2], [-0.06, 30.22], [-0.02, 30.28], [0, 30.32], [0.22, 30.54], [0.38, 30.7], [0.28, 30.72], [0.18, 30.72], [0.1, 30.74], [0.08, 30.74], [0.06, 30.74], [0.02, 30.74], [0, 30.74], [0, 30.72], [-0.02, 30.72], [-0.04, 30.72], [-0.08, 30.72], [-0.1, 30.72], [-0.12, 30.72], [-0.18, 30.72], [-0.24, 30.74], [-0.3, 30.74], [-0.36, 30.78], [-0.44, 30.82], [-0.52, 30.84], [-0.58, 30.88], [-0.64, 30.88], [-0.74, 30.86], [-0.84, 30.86], [-0.92, 30.86], [-0.94, 30.86], [-0.96, 30.86], [-0.98, 30.84], [-1, 30.84], [-1, 30.86], [-1.02, 30.86], [-1.04, 30.86], [-1.06, 30.86], [-1.08, 30.84], [-1.1, 30.84], [-1.16, 30.84], [-1.2, 30.82], [-1.26, 30.82], [-1.32, 30.8], [-1.34, 30.8], [-1.36, 30.8], [-1.38, 30.8], [-1.4, 30.8], [-1.42, 30.82], [-1.46, 30.82], [-1.5, 30.82], [-1.52, 30.82], [-1.56, 30.82], [-1.58, 30.82], [-1.62, 30.82], [-1.66, 30.8], [-1.7, 30.8], [-1.76, 30.8], [-1.8, 30.78], [-1.82, 30.78], [-1.84, 30.78], [-1.88, 30.76], [-1.9, 30.76], [-1.92, 30.74], [-1.96, 30.74], [-1.98, 30.72], [-2, 30.72], [-2.02, 30.72], [-2.04, 30.72], [-2.06, 30.72], [-2.1, 30.7], [-2.14, 30.7], [-2.18, 30.7], [-2.22, 30.7], [-2.28, 30.7], [-2.32, 30.68], [-2.36, 30.68], [-2.36, 30.7], [-2.38, 30.7], [-2.38, 30.72], [-2.4, 30.72], [-2.42, 30.74], [-2.44, 30.74], [-2.46, 30.72], [-2.48, 30.72], [-2.5, 30.72], [-2.52, 30.72], [-2.54, 30.72], [-2.56, 30.7], [-2.58, 30.7], [-2.6, 30.66], [-2.64, 30.64], [-2.68, 30.62], [-2.7, 30.6], [-2.74, 30.56], [-2.78, 30.54], [-2.8, 30.52], [-2.84, 30.52], [-2.86, 30.52], [-2.9, 30.5], [-2.92, 30.5], [-2.94, 30.5], [-2.98, 30.5], [-3, 30.5], [-3, 30.48], [-3.04, 30.48], [-3.1, 30.48], [-3.18, 30.46], [-3.28, 30.42], [-3.38, 30.4], [-3.5, 30.38], [-3.56, 30.36], [-3.58, 30.36], [-3.58, 30.4], [-3.58, 30.42], [-3.58, 30.46], [-3.6, 30.52], [-3.6, 30.54], [-3.6, 30.58], [-3.6, 30.6], [-3.62, 30.6], [-3.64, 30.64], [-3.66, 30.66], [-3.68, 30.66], [-3.7, 30.66], [-3.72, 30.66], [-3.72, 30.64], [-3.74, 30.64], [-3.76, 30.64], [-3.76, 30.62], [-3.78, 30.62], [-3.78, 30.6], [-3.8, 30.6], [-3.82, 30.6], [-3.82, 30.58], [-3.82, 30.6], [-3.84, 30.6], [-3.86, 30.6], [-3.88, 30.6], [-3.88, 30.62], [-3.9, 30.6], [-3.92, 30.6], [-3.96, 30.6], [-3.98, 30.6], [-4, 30.6], [-4.02, 30.6], [-4.04, 30.6], [-4.06, 30.58], [-4.08, 30.58], [-4.1, 30.58], [-4.12, 30.58], [-4.14, 30.58], [-4.16, 30.58], [-4.2, 30.56], [-4.24, 30.56], [-4.26, 30.54], [-4.28, 30.54], [-4.3, 30.54], [-4.32, 30.52], [-4.42, 30.44], [-4.48, 30.38], [-4.56, 30.32], [-4.58, 30.3], [-4.6, 30.28], [-4.64, 30.26], [-4.7, 30.24], [-4.74, 30.22], [-4.8, 30.2], [-4.82, 30.2], [-4.88, 30.16], [-4.9, 30.16], [-4.92, 30.14], [-4.94, 30.14], [-4.96, 30.14], [-4.98, 30.12], [-5, 30.1], [-5.02, 30.08], [-5.04, 30.06], [-5.06, 30.04], [-5.08, 30.02], [-5.1, 30.02], [-5.12, 30], [-5.14, 30], [-5.16, 29.98], [-5.18, 29.98], [-5.18, 29.96], [-5.2, 29.96], [-5.22, 29.94], [-5.24, 29.94], [-5.24, 29.92], [-5.26, 29.92], [-5.28, 29.9], [-5.28, 29.88], [-5.3, 29.86], [-5.3, 29.84], [-5.32, 29.84], [-5.32, 29.82], [-5.32, 29.8], [-5.32, 29.78], [-5.32, 29.76], [-5.34, 29.76], [-5.34, 29.74], [-5.36, 29.74], [-5.36, 29.72], [-5.38, 29.72], [-5.44, 29.64], [-5.5, 29.56]]] } }, { type: "Feature", properties: { code: 53, fr: "In Salah", ar: "\u0639\u064A\u0646 \u0635\u0627\u0644\u062D", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[0.94, 26.24], [0.94, 26.22], [0.94, 26.2], [0.96, 26.18], [0.96, 26.16], [0.98, 26.14], [1, 26.12], [1, 26.1], [1.06, 26], [1.06, 25.98], [1.08, 25.96], [1.42, 25.52], [1.42, 25], [1.44, 24.98], [1.44, 24.92], [1.44, 24.82], [1.44, 24.64], [1.52, 24.74], [1.64, 24.8], [1.76, 24.88], [1.9, 24.96], [1.92, 25], [1.94, 25.22], [1.98, 25.36], [2, 25.5], [2, 25.52], [2.02, 25.52], [2.02, 25.54], [2.02, 25.56], [2.04, 25.56], [2.04, 25.58], [2.04, 25.6], [2.06, 25.6], [2.06, 25.62], [2.06, 25.64], [2.08, 25.64], [2.08, 25.66], [2.08, 25.68], [2.1, 25.68], [2.1, 25.7], [2.1, 25.72], [2.12, 25.72], [2.14, 25.72], [2.14, 25.7], [2.14, 25.68], [2.16, 25.68], [2.18, 25.68], [2.2, 25.68], [2.22, 25.68], [2.24, 25.68], [2.26, 25.68], [2.28, 25.68], [2.3, 25.68], [2.32, 25.68], [2.32, 25.66], [2.34, 25.66], [2.34, 25.64], [2.36, 25.64], [2.38, 25.64], [2.4, 25.64], [2.42, 25.64], [2.42, 25.62], [2.44, 25.62], [2.46, 25.6], [2.48, 25.6], [2.5, 25.6], [2.52, 25.6], [2.54, 25.58], [2.56, 25.58], [2.58, 25.58], [2.6, 25.58], [2.62, 25.58], [2.62, 25.56], [2.64, 25.56], [2.66, 25.54], [2.68, 25.54], [2.68, 25.52], [2.7, 25.52], [2.7, 25.5], [2.72, 25.5], [2.74, 25.48], [2.76, 25.48], [2.78, 25.48], [2.8, 25.48], [2.82, 25.48], [2.84, 25.48], [2.86, 25.48], [2.88, 25.48], [2.9, 25.48], [2.92, 25.48], [2.94, 25.48], [2.96, 25.46], [2.98, 25.46], [3, 25.46], [3.02, 25.46], [3.04, 25.46], [3.06, 25.46], [3.08, 25.46], [3.1, 25.46], [3.12, 25.46], [3.14, 25.46], [3.16, 25.46], [3.18, 25.48], [3.2, 25.48], [3.2, 25.5], [3.22, 25.52], [3.24, 25.54], [3.26, 25.54], [3.28, 25.56], [3.28, 25.58], [3.28, 25.6], [3.3, 25.62], [3.32, 25.62], [3.34, 25.62], [3.36, 25.62], [3.36, 25.6], [3.38, 25.6], [3.38, 25.58], [3.38, 25.56], [3.4, 25.54], [3.4, 25.52], [3.4, 25.5], [3.4, 25.48], [3.4, 25.46], [3.4, 25.44], [3.4, 25.42], [3.42, 25.4], [3.44, 25.4], [3.46, 25.38], [3.48, 25.36], [3.5, 25.36], [3.52, 25.36], [3.54, 25.38], [3.56, 25.4], [3.58, 25.4], [3.6, 25.4], [3.62, 25.4], [3.64, 25.38], [3.66, 25.38], [3.68, 25.38], [3.7, 25.4], [3.72, 25.4], [3.74, 25.42], [3.76, 25.44], [3.78, 25.46], [3.8, 25.46], [3.82, 25.48], [3.84, 25.5], [3.86, 25.52], [3.88, 25.52], [3.88, 25.54], [3.9, 25.54], [3.92, 25.56], [3.92, 25.58], [3.94, 25.6], [3.92, 25.62], [3.92, 25.64], [3.9, 25.66], [3.88, 25.66], [3.88, 25.68], [3.86, 25.7], [3.86, 25.72], [3.86, 25.74], [3.86, 25.76], [3.84, 25.76], [3.84, 25.78], [3.82, 25.78], [3.82, 25.8], [3.82, 25.82], [3.82, 25.84], [3.82, 25.86], [3.82, 25.88], [3.84, 25.9], [3.84, 25.92], [3.84, 25.94], [3.86, 25.96], [3.86, 25.98], [3.88, 26], [3.86, 26.02], [3.86, 26.04], [3.86, 26.06], [3.86, 26.08], [3.84, 26.1], [3.84, 26.12], [3.84, 26.14], [3.82, 26.14], [3.8, 26.16], [3.8, 26.18], [3.8, 26.2], [3.78, 26.2], [3.78, 26.22], [3.76, 26.24], [3.74, 26.24], [3.76, 26.26], [3.76, 26.28], [3.78, 26.3], [3.8, 26.3], [3.84, 26.28], [3.84, 26.26], [3.84, 26.24], [3.84, 26.22], [3.86, 26.22], [3.88, 26.22], [3.9, 26.22], [3.9, 26.2], [3.92, 26.2], [3.94, 26.2], [3.96, 26.2], [3.94, 26.2], [3.94, 26.18], [3.96, 26.18], [3.96, 26.2], [3.98, 26.2], [4, 26.2], [4, 26.18], [4.02, 26.18], [4.04, 26.2], [4.08, 26.24], [4.12, 26.28], [4.16, 26.3], [4.18, 26.34], [4.22, 26.36], [4.24, 26.38], [4.3, 26.4], [4.32, 26.42], [4.34, 26.44], [4.34, 26.46], [4.36, 26.48], [4.36, 26.5], [4.38, 26.5], [4.4, 26.54], [4.42, 26.54], [4.44, 26.54], [4.46, 26.54], [4.48, 26.54], [4.5, 26.54], [4.52, 26.54], [4.54, 26.54], [4.56, 26.54], [4.56, 26.52], [4.58, 26.52], [4.58, 26.5], [4.58, 26.48], [4.6, 26.48], [4.62, 26.48], [4.64, 26.48], [4.66, 26.48], [4.64, 26.5], [4.66, 26.5], [4.66, 26.52], [4.68, 26.52], [4.7, 26.52], [4.7, 26.5], [4.7, 26.48], [4.72, 26.48], [4.72, 26.46], [4.74, 26.46], [4.76, 26.46], [4.78, 26.46], [4.8, 26.46], [4.8, 26.48], [4.82, 26.48], [4.82, 26.5], [4.84, 26.5], [4.86, 26.5], [4.86, 26.52], [4.86, 26.54], [4.86, 26.56], [4.88, 26.56], [4.9, 26.56], [4.9, 26.54], [4.92, 26.54], [4.92, 26.52], [4.92, 26.5], [4.92, 26.48], [4.94, 26.48], [4.94, 26.5], [4.94, 26.52], [4.94, 26.54], [4.96, 26.54], [4.96, 26.56], [4.96, 26.58], [4.96, 26.6], [4.96, 26.62], [4.98, 26.62], [5, 26.62], [5, 26.64], [5.02, 26.64], [5.02, 26.66], [5.04, 26.66], [5.04, 26.68], [5.06, 26.7], [5.08, 26.72], [5.1, 26.74], [5.1, 26.76], [5.12, 26.76], [5.12, 26.78], [5.14, 26.78], [5.14, 26.8], [5.14, 26.82], [5.14, 26.84], [5.14, 26.86], [5.14, 26.88], [5.16, 26.88], [5.18, 26.88], [5.18, 26.9], [5.2, 26.9], [5.22, 26.9], [5.22, 26.92], [5.24, 26.92], [5.24, 26.94], [5.24, 26.96], [5.24, 26.98], [5.26, 26.98], [5.26, 27], [5.28, 27], [5.28, 27.02], [5.28, 27.04], [5.3, 27.04], [5.3, 27.06], [5.3, 27.08], [5.32, 27.08], [5.32, 27.1], [5.32, 27.12], [5.32, 27.14], [5.32, 27.16], [5.3, 27.16], [5.3, 27.18], [5.3, 27.2], [5.3, 27.22], [5.32, 27.22], [5.32, 27.24], [5.34, 27.24], [5.34, 27.26], [5.48, 27.38], [5.78, 27.42], [5.76, 27.48], [5.74, 27.58], [5.72, 27.68], [5.7, 27.82], [5.68, 27.92], [5.66, 28], [5.64, 28.1], [5.72, 28.44], [5.72, 29], [5.72, 29.02], [5.72, 29.06], [5.72, 29.16], [5.72, 29.28], [5.72, 29.4], [5.72, 29.54], [5.72, 29.66], [5.72, 29.76], [5.66, 29.72], [5.58, 29.66], [5.5, 29.62], [5.44, 29.58], [5.36, 29.54], [5.26, 29.46], [5.18, 29.42], [5.12, 29.38], [5.06, 29.34], [5.02, 29.32], [5, 29.3], [4.96, 29.28], [4.88, 29.24], [4.78, 29.16], [4.68, 29.1], [4.52, 29], [4.46, 28.96], [4.42, 28.94], [4.38, 28.9], [4.34, 28.88], [4.28, 28.84], [4.22, 28.8], [4.14, 28.76], [4, 28.66], [3.88, 28.58], [3.76, 28.5], [3.76, 28.52], [3.58, 28.66], [3.5, 28.72], [3.34, 28.82], [3.22, 28.92], [3.14, 28.98], [3.1, 29], [3.08, 29.02], [3.06, 29.04], [3.04, 29.06], [3.02, 29.06], [3, 29.08], [2.72, 29.06], [2.56, 29.06], [2.54, 29.04], [2.5, 29.04], [2.44, 29.02], [2.38, 29], [2.36, 29], [2.34, 29], [2.32, 28.98], [2.28, 28.98], [2.22, 28.96], [2.16, 28.94], [2.08, 28.92], [2.06, 28.9], [2.04, 28.9], [2.04, 28.86], [2.02, 28.82], [2.02, 28.8], [2.02, 28.74], [2.02, 28.72], [2.02, 28.7], [2.02, 28.68], [2.02, 28.66], [2.02, 28.64], [2, 28.48], [1.96, 28.34], [1.82, 28.14], [1.8, 28], [1.8, 27.94], [1.78, 27.84], [1.78, 27.76], [1.7, 27.62], [1.7, 27.58], [1.7, 27.38], [1.78, 27.28], [1.78, 27.26], [1.74, 27.2], [1.7, 27.12], [1.66, 27.04], [1.66, 27.02], [1.66, 27], [1.66, 26.98], [1.66, 26.96], [1.66, 26.94], [1.66, 26.9], [1.64, 26.84], [1.64, 26.76], [1.64, 26.72], [1.64, 26.7], [1.64, 26.68], [1.64, 26.66], [1.62, 26.66], [1.62, 26.64], [1.6, 26.64], [1.58, 26.64], [1.56, 26.64], [1.56, 26.62], [1.54, 26.62], [1.54, 26.64], [1.52, 26.64], [1.5, 26.64], [1.5, 26.62], [1.5, 26.64], [1.48, 26.64], [1.46, 26.64], [1.46, 26.66], [1.44, 26.66], [1.42, 26.66], [1.4, 26.66], [1.38, 26.66], [1.36, 26.66], [1.34, 26.66], [1.34, 26.64], [1.32, 26.64], [1.3, 26.64], [1.3, 26.62], [1.3, 26.6], [1.28, 26.6], [1.28, 26.58], [1.28, 26.56], [1.26, 26.56], [1.26, 26.54], [1.24, 26.54], [1.24, 26.52], [1.22, 26.5], [1.2, 26.5], [1.2, 26.48], [1.18, 26.46], [1.16, 26.44], [1.14, 26.42], [1.12, 26.4], [1.1, 26.38], [1.08, 26.36], [1.06, 26.36], [1.04, 26.34], [1.02, 26.32], [1, 26.3], [0.98, 26.28], [0.96, 26.26], [0.94, 26.24]]] } }, { type: "Feature", properties: { code: 54, fr: "In Guezzam", ar: "\u0639\u064A\u0646 \u0642\u0632\u0627\u0645", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[1.78, 21.8], [1.78, 21.78], [1.8, 21.7], [1.82, 21.64], [1.82, 21.58], [1.84, 21.52], [1.86, 21.5], [1.92, 21.46], [1.96, 21.42], [2, 21.4], [2.04, 21.34], [2.1, 21.28], [2.14, 21.22], [2.16, 21.16], [2.2, 21.08], [2.22, 21.04], [2.22, 20.96], [2.26, 20.86], [2.26, 20.8], [2.24, 20.74], [2.24, 20.68], [2.26, 20.62], [2.3, 20.56], [2.36, 20.5], [2.4, 20.42], [2.44, 20.3], [2.48, 20.2], [2.5, 20.1], [2.48, 20.1], [2.48, 20.08], [2.5, 20.1], [2.5, 20.08], [2.52, 20.08], [2.52, 20.1], [2.52, 20.08], [2.54, 20.08], [2.54, 20.06], [2.56, 20.06], [2.56, 20.04], [2.58, 20.04], [2.6, 20.04], [2.62, 20.04], [2.62, 20.06], [2.64, 20.06], [2.64, 20.04], [2.66, 20.06], [2.66, 20.08], [2.68, 20.08], [2.66, 20.08], [2.68, 20.08], [2.68, 20.1], [2.7, 20.1], [2.7, 20.08], [2.7, 20.06], [2.7, 20.04], [2.72, 20.04], [2.72, 20.02], [2.72, 20], [2.74, 20], [2.76, 20], [2.76, 19.98], [2.78, 19.98], [2.8, 19.98], [2.82, 19.98], [2.82, 19.96], [2.84, 19.96], [2.84, 19.98], [2.86, 19.98], [2.86, 19.96], [2.88, 19.96], [2.9, 19.96], [2.92, 19.96], [2.94, 19.96], [2.96, 19.96], [2.98, 19.96], [2.98, 19.94], [3, 19.94], [3.02, 19.94], [3.02, 19.92], [3.04, 19.92], [3.06, 19.92], [3.06, 19.9], [3.08, 19.9], [3.1, 19.9], [3.1, 19.88], [3.12, 19.88], [3.14, 19.88], [3.14, 19.86], [3.16, 19.86], [3.2, 19.84], [3.22, 19.84], [3.24, 19.84], [3.26, 19.84], [3.26, 19.82], [3.26, 19.8], [3.24, 19.8], [3.24, 19.78], [3.24, 19.76], [3.24, 19.74], [3.24, 19.72], [3.22, 19.72], [3.24, 19.7], [3.24, 19.68], [3.24, 19.66], [3.26, 19.64], [3.24, 19.62], [3.24, 19.6], [3.24, 19.58], [3.24, 19.56], [3.26, 19.54], [3.26, 19.52], [3.26, 19.5], [3.24, 19.5], [3.24, 19.48], [3.26, 19.48], [3.26, 19.46], [3.26, 19.44], [3.24, 19.44], [3.22, 19.44], [3.2, 19.44], [3.2, 19.42], [3.2, 19.4], [3.18, 19.38], [3.18, 19.36], [3.18, 19.34], [3.2, 19.32], [3.2, 19.3], [3.2, 19.28], [3.18, 19.26], [3.18, 19.24], [3.16, 19.24], [3.16, 19.22], [3.16, 19.2], [3.14, 19.2], [3.12, 19.18], [3.12, 19.16], [3.12, 19.14], [3.12, 19.12], [3.14, 19.12], [3.16, 19.12], [3.16, 19.1], [3.18, 19.1], [3.2, 19.1], [3.2, 19.08], [3.22, 19.08], [3.22, 19.06], [3.24, 19.06], [3.24, 19.04], [3.26, 19.04], [3.28, 19.04], [3.28, 19.02], [3.3, 19.02], [3.3, 19], [3.32, 19], [3.34, 19], [3.34, 18.98], [3.36, 18.96], [3.52, 19], [3.6, 19.02], [3.66, 19.02], [3.82, 19.06], [3.96, 19.08], [4, 19.1], [4.1, 19.12], [4.2, 19.14], [4.26, 19.14], [4.34, 19.14], [4.36, 19.16], [4.38, 19.16], [4.42, 19.16], [4.44, 19.18], [4.48, 19.18], [4.5, 19.18], [4.54, 19.2], [4.58, 19.2], [4.68, 19.22], [4.74, 19.24], [4.8, 19.24], [4.84, 19.26], [4.9, 19.26], [4.96, 19.28], [4.98, 19.28], [5, 19.28], [5.08, 19.3], [5.18, 19.32], [5.3, 19.34], [5.42, 19.36], [5.54, 19.4], [5.64, 19.42], [5.74, 19.44], [5.82, 19.44], [5.88, 19.5], [5.94, 19.56], [5.98, 19.6], [6, 19.6], [6.12, 19.72], [6.24, 19.8], [6.34, 19.9], [6.44, 19.98], [6.46, 20], [6.52, 20.06], [6.6, 20.12], [6.74, 20.24], [6.9, 20.38], [7, 20.46], [7.02, 20.48], [7.08, 20.52], [7.14, 20.58], [7.22, 20.64], [7.28, 20.7], [7.34, 20.74], [7.42, 20.8], [7.46, 20.84], [7.48, 20.86], [7.56, 20.9], [7.72, 21], [7.74, 21.02], [7.76, 21.02], [7.76, 21.04], [7.78, 21.04], [7.8, 21.04], [7.7, 21.08], [7.66, 21.08], [7.64, 21.08], [7.6, 21.12], [7.56, 21.16], [7.54, 21.18], [7.48, 21.22], [7.42, 21.24], [7.36, 21.28], [7.32, 21.3], [7.3, 21.3], [7.3, 21.28], [7.3, 21.26], [7.3, 21.24], [7.28, 21.24], [7.28, 21.22], [7.28, 21.24], [7.26, 21.24], [7.24, 21.24], [7.24, 21.26], [7.22, 21.26], [7.2, 21.26], [7.2, 21.28], [7.18, 21.28], [7.18, 21.3], [7.16, 21.3], [7.14, 21.3], [7.12, 21.3], [7.12, 21.32], [7.12, 21.34], [7.12, 21.36], [7.1, 21.38], [7.1, 21.36], [7.08, 21.36], [7.06, 21.36], [7.04, 21.36], [7.04, 21.38], [7.02, 21.38], [7, 21.4], [7.02, 21.4], [7.02, 21.42], [7, 21.42], [7, 21.4], [7, 21.42], [7, 21.4], [6.98, 21.4], [6.98, 21.42], [6.98, 21.44], [6.96, 21.44], [6.96, 21.46], [6.94, 21.46], [6.92, 21.46], [6.9, 21.46], [6.9, 21.48], [6.88, 21.48], [6.88, 21.5], [6.86, 21.5], [6.86, 21.52], [6.84, 21.52], [6.82, 21.52], [6.82, 21.54], [6.8, 21.54], [6.78, 21.54], [6.76, 21.54], [6.74, 21.54], [6.72, 21.54], [6.7, 21.54], [6.68, 21.54], [6.66, 21.54], [6.64, 21.56], [6.62, 21.56], [6.6, 21.56], [6.58, 21.56], [6.56, 21.56], [6.54, 21.56], [6.52, 21.56], [6.5, 21.54], [6.52, 21.54], [6.54, 21.54], [6.54, 21.52], [6.54, 21.5], [6.52, 21.5], [6.52, 21.48], [6.5, 21.48], [6.5, 21.46], [6.5, 21.44], [6.48, 21.42], [6.48, 21.4], [6.48, 21.38], [6.48, 21.36], [6.48, 21.34], [6.48, 21.32], [6.46, 21.32], [6.46, 21.3], [6.44, 21.3], [6.44, 21.28], [6.42, 21.28], [6.42, 21.26], [6.42, 21.24], [6.4, 21.24], [6.4, 21.22], [6.4, 21.2], [6.38, 21.2], [6.38, 21.18], [6.36, 21.18], [6.34, 21.18], [6.34, 21.16], [6.34, 21.14], [6.32, 21.14], [6.32, 21.12], [6.32, 21.1], [6.32, 21.08], [6.32, 21.06], [6.3, 21.06], [6.3, 21.04], [6.28, 21.04], [6.28, 21.02], [6.28, 21], [6.28, 20.98], [6.28, 20.96], [6.28, 20.94], [6.28, 20.92], [6.26, 20.9], [6.22, 20.9], [6.16, 20.9], [6.12, 20.9], [6.06, 20.9], [6.02, 20.9], [6, 20.9], [5.98, 20.9], [5.96, 20.9], [5.94, 20.9], [5.92, 20.9], [5.9, 20.92], [5.84, 20.92], [5.82, 20.92], [5.76, 20.94], [5.74, 20.96], [5.72, 20.96], [5.72, 20.98], [5.72, 21], [5.72, 21.02], [5.68, 21.02], [5.6, 21.02], [5.5, 21.04], [5.38, 21.04], [5.36, 21.06], [5.32, 21.06], [5.22, 21.1], [5.14, 21.12], [5.04, 21.16], [5, 21.16], [4.98, 21.18], [4.96, 21.18], [4.94, 21.18], [4.92, 21.18], [4.9, 21.18], [4.88, 21.18], [4.86, 21.18], [4.84, 21.18], [4.84, 21.2], [4.82, 21.2], [4.82, 21.18], [4.82, 21.2], [4.8, 21.2], [4.78, 21.2], [4.76, 21.2], [4.76, 21.22], [4.74, 21.22], [4.74, 21.2], [4.72, 21.2], [4.72, 21.18], [4.72, 21.16], [4.7, 21.16], [4.7, 21.14], [4.68, 21.14], [4.68, 21.12], [4.68, 21.1], [4.68, 21.08], [4.68, 21.06], [4.68, 21.04], [4.68, 21.02], [4.68, 21], [4.68, 20.98], [4.7, 20.98], [4.7, 20.96], [4.7, 20.94], [4.72, 20.94], [4.72, 20.92], [4.7, 20.9], [4.7, 20.88], [4.7, 20.86], [4.68, 20.86], [4.68, 20.84], [4.68, 20.82], [4.68, 20.8], [4.66, 20.8], [4.66, 20.78], [4.66, 20.76], [4.66, 20.74], [4.64, 20.74], [4.64, 20.72], [4.64, 20.7], [4.64, 20.68], [4.62, 20.68], [4.62, 20.66], [4.6, 20.66], [4.6, 20.64], [4.6, 20.62], [4.58, 20.62], [4.58, 20.64], [4.56, 20.64], [4.54, 20.64], [4.52, 20.66], [4.52, 20.64], [4.5, 20.64], [4.48, 20.64], [4.48, 20.62], [4.46, 20.62], [4.46, 20.6], [4.44, 20.6], [4.42, 20.58], [4.4, 20.58], [4.4, 20.56], [4.38, 20.56], [4.38, 20.54], [4.38, 20.52], [4.36, 20.52], [4.34, 20.52], [4.34, 20.5], [4.32, 20.5], [4.28, 20.48], [4.2, 20.46], [4.18, 20.46], [4.02, 20.44], [4.02, 20.46], [4.02, 20.48], [4.02, 20.5], [4.02, 20.52], [4.02, 20.54], [4.02, 20.56], [4.02, 20.58], [4.02, 20.6], [4.04, 20.6], [4.04, 20.62], [4.04, 20.64], [4.04, 20.66], [4.04, 20.68], [4.04, 20.7], [4.04, 20.72], [4.02, 20.72], [4.04, 20.74], [4.04, 20.76], [4.04, 20.78], [4.04, 20.8], [4.04, 20.82], [4.04, 20.84], [4.04, 20.86], [4.04, 20.88], [4.06, 20.88], [4.06, 20.9], [4.04, 20.9], [4.04, 20.92], [4.04, 20.94], [4.04, 20.96], [4.04, 20.98], [4.02, 21], [4.04, 21], [4.04, 21.02], [4.04, 21.04], [4.02, 21.04], [4.02, 21.06], [4.02, 21.08], [4, 21.08], [3.98, 21.08], [3.98, 21.1], [3.96, 21.12], [3.94, 21.12], [3.94, 21.14], [3.92, 21.14], [3.9, 21.14], [3.9, 21.16], [3.88, 21.16], [3.86, 21.16], [3.84, 21.16], [3.82, 21.16], [3.8, 21.16], [3.78, 21.2], [3.76, 21.22], [3.74, 21.22], [3.72, 21.24], [3.7, 21.26], [3.68, 21.26], [3.66, 21.26], [3.64, 21.26], [3.62, 21.26], [3.6, 21.26], [3.58, 21.26], [3.58, 21.28], [3.56, 21.28], [3.54, 21.28], [3.52, 21.28], [3.5, 21.28], [3.48, 21.28], [3.48, 21.3], [3.46, 21.3], [3.46, 21.32], [3.44, 21.32], [3.44, 21.34], [3.44, 21.36], [3.44, 21.38], [3.44, 21.4], [3.42, 21.4], [3.44, 21.4], [3.44, 21.42], [3.36, 21.42], [3.3, 21.42], [3.3, 21.44], [3.28, 21.48], [3.26, 21.54], [3.22, 21.58], [3.2, 21.64], [3.18, 21.68], [3.16, 21.74], [3.14, 21.78], [3.12, 21.84], [3.1, 21.9], [3.08, 21.9], [3.08, 21.88], [3.06, 21.88], [3.04, 21.88], [3.02, 21.86], [3, 21.84], [2.98, 21.84], [2.96, 21.84], [2.94, 21.82], [2.92, 21.82], [2.88, 21.82], [2.86, 21.82], [2.84, 21.82], [2.82, 21.82], [2.8, 21.82], [2.76, 21.82], [2.74, 21.82], [2.66, 21.82], [2.54, 21.82], [2.38, 21.82], [2.16, 21.82], [2.02, 21.82], [1.88, 21.82], [1.78, 21.8]]] } }, { type: "Feature", properties: { code: 55, fr: "Touggourt", ar: "\u062A\u0642\u0631\u062A", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[5.72, 33.4], [5.72, 33.34], [5.8, 33.26], [5.78, 33.26], [5.78, 33.24], [5.78, 33.22], [5.78, 33.2], [5.78, 33.18], [5.78, 33.16], [5.76, 33.1], [5.78, 33.08], [5.84, 33.02], [5.88, 33], [5.9, 32.98], [5.92, 32.96], [5.94, 32.9], [6, 32.84], [6.14, 32.9], [6.12, 32.78], [6.1, 32.62], [6.12, 32.6], [6.14, 32.58], [6.16, 32.54], [6.18, 32.52], [6.2, 32.48], [6.24, 32.44], [6.26, 32.42], [6.28, 32.38], [6.3, 32.36], [6.32, 32.34], [6.32, 32.32], [6.36, 32.32], [6.4, 32.3], [6.48, 32.28], [6.52, 32.26], [6.56, 32.24], [6.58, 32.24], [6.76, 32.18], [6.88, 32.14], [6.96, 32.12], [7, 32.1], [7.02, 32.08], [7.04, 32.08], [7.06, 32.06], [7.08, 32.06], [7.16, 32.02], [7.2, 32.02], [7.24, 32], [7.2, 32.04], [7.12, 32.12], [7.1, 32.16], [7.04, 32.2], [7.02, 32.24], [7, 32.26], [6.96, 32.3], [6.92, 32.36], [6.88, 32.42], [6.82, 32.48], [6.78, 32.54], [6.78, 32.56], [6.76, 32.6], [6.72, 32.62], [6.7, 32.64], [6.7, 32.68], [6.68, 32.68], [6.68, 32.7], [6.66, 32.72], [6.64, 32.78], [6.6, 32.9], [6.58, 32.98], [6.56, 33], [6.56, 33.02], [6.54, 33.06], [6.54, 33.08], [6.52, 33.12], [6.5, 33.16], [6.5, 33.18], [6.5, 33.2], [6.5, 33.22], [6.48, 33.22], [6.48, 33.24], [6.48, 33.26], [6.46, 33.28], [6.46, 33.3], [6.44, 33.32], [6.44, 33.34], [6.44, 33.36], [6.42, 33.38], [6.42, 33.4], [6.42, 33.42], [6.4, 33.42], [6.4, 33.44], [6.4, 33.48], [6.38, 33.5], [6.36, 33.54], [6.36, 33.56], [6.36, 33.58], [6.34, 33.6], [6.34, 33.62], [6.32, 33.64], [6.32, 33.66], [6.32, 33.72], [6.3, 33.76], [6.3, 33.82], [6.3, 33.86], [6.28, 33.92], [6.28, 33.94], [6.28, 33.92], [6.28, 33.9], [6.26, 33.9], [6.26, 33.92], [6.26, 33.94], [6.24, 33.94], [6.26, 33.94], [6.24, 33.94], [6.24, 33.96], [6.22, 33.96], [6.22, 33.94], [6.2, 33.94], [6.18, 33.94], [6.18, 33.92], [6.18, 33.94], [6.16, 33.94], [6.16, 33.92], [6.14, 33.92], [6.14, 33.9], [6.12, 33.9], [6.12, 33.88], [6.1, 33.88], [6.1, 33.86], [6.1, 33.88], [6.08, 33.88], [6.08, 33.86], [6.06, 33.86], [6.06, 33.88], [6.06, 33.9], [6.04, 33.9], [6.04, 33.88], [6.02, 33.88], [6.02, 33.86], [6.04, 33.86], [6.02, 33.86], [6.02, 33.84], [6.02, 33.82], [6.04, 33.82], [6.04, 33.8], [6.04, 33.78], [6.06, 33.78], [6.06, 33.76], [6.06, 33.74], [6.06, 33.72], [6.06, 33.7], [6.04, 33.7], [6.04, 33.68], [6.06, 33.68], [6.06, 33.66], [6.06, 33.64], [6.06, 33.62], [6.04, 33.62], [6.02, 33.62], [6, 33.6], [6, 33.58], [6.02, 33.58], [6.02, 33.56], [6.04, 33.56], [6.04, 33.54], [6.04, 33.52], [6.06, 33.52], [6.08, 33.52], [6.08, 33.5], [6.08, 33.48], [6.08, 33.46], [6.08, 33.44], [6.08, 33.42], [6.08, 33.4], [5.72, 33.4]]] } }, { type: "Feature", properties: { code: 56, fr: "Djanet", ar: "\u062C\u0627\u0646\u062A", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[6.58, 25.52], [6.6, 25.5], [6.62, 25.5], [6.62, 25.48], [6.64, 25.48], [6.64, 25.46], [6.66, 25.46], [6.66, 25.44], [6.68, 25.42], [6.68, 25.4], [6.7, 25.4], [6.7, 25.38], [6.72, 25.38], [6.72, 25.36], [6.72, 25.34], [6.74, 25.34], [6.74, 25.32], [6.76, 25.32], [6.76, 25.3], [6.78, 25.3], [6.78, 25.28], [6.8, 25.26], [6.8, 25.24], [6.82, 25.24], [6.82, 25.22], [6.82, 25.2], [6.82, 25.18], [6.84, 25.18], [6.84, 25.16], [6.84, 25.14], [6.84, 25.12], [6.86, 25.12], [6.86, 25.1], [6.86, 25.08], [6.88, 25.08], [6.88, 25.06], [6.9, 25.04], [6.9, 25.02], [6.9, 25], [6.92, 25], [6.92, 24.98], [6.94, 24.98], [6.94, 24.96], [6.96, 24.94], [6.96, 24.92], [6.98, 24.92], [6.98, 24.9], [6.98, 24.88], [7, 24.88], [7, 24.86], [7, 24.84], [7.02, 24.84], [7.02, 24.82], [7.04, 24.82], [7.04, 24.8], [7.06, 24.8], [7.08, 24.78], [7.1, 24.78], [7.1, 24.76], [7.12, 24.76], [7.14, 24.76], [7.16, 24.76], [7.18, 24.76], [7.2, 24.74], [7.2, 24.76], [7.22, 24.76], [7.24, 24.76], [7.26, 24.76], [7.28, 24.76], [7.3, 24.76], [7.3, 24.74], [7.54, 24.42], [7.52, 24.4], [7.52, 24.38], [7.52, 24.34], [7.52, 24.28], [7.52, 24.26], [7.52, 24.24], [7.52, 24.16], [7.52, 24.1], [7.52, 24.04], [7.52, 24], [7.52, 23.96], [7.54, 23.92], [7.54, 23.84], [7.54, 23.82], [7.64, 23.62], [7.74, 23.36], [7.72, 23.32], [7.68, 23.3], [7.66, 23.28], [7.74, 23.22], [7.78, 23.18], [7.84, 23.14], [7.9, 23.1], [7.92, 23.08], [7.94, 23.1], [7.98, 23.1], [8, 23.1], [8.06, 23.1], [8.08, 23.12], [8.14, 23.12], [8.2, 23.14], [8.28, 23.16], [8.38, 23.18], [8.44, 23.18], [8.54, 23.2], [8.64, 23.22], [8.72, 23.26], [8.82, 23.32], [9, 23.42], [9, 23.44], [9.22, 23.56], [9.26, 23.56], [9.5, 23.56], [9.8, 23.56], [9.82, 23.54], [9.84, 23.54], [9.84, 23.52], [9.86, 23.52], [9.88, 23.52], [9.88, 23.5], [9.9, 23.5], [9.92, 23.5], [9.94, 23.5], [9.96, 23.5], [9.98, 23.5], [9.98, 23.48], [10, 23.48], [10.02, 23.46], [10.04, 23.46], [10.04, 23.44], [10.06, 23.44], [10.08, 23.44], [10.1, 23.42], [10.12, 23.42], [10.14, 23.4], [10.16, 23.4], [10.16, 23.38], [10.18, 23.38], [10.2, 23.38], [10.2, 23.36], [10.22, 23.36], [10.24, 23.34], [10.24, 23.32], [10.26, 23.32], [10.28, 23.32], [10.28, 23.3], [10.26, 23.28], [10.26, 23.26], [10.26, 23.24], [10.26, 23.22], [10.26, 23.2], [10.26, 23.18], [10.26, 23.16], [10.26, 23.12], [10.26, 23.1], [10.26, 23.08], [10.26, 23.06], [10.26, 23.02], [10.26, 23], [10.26, 22.96], [10.26, 22.9], [10.26, 22.76], [10.24, 22.5], [10.52, 22.66], [10.68, 22.74], [10.84, 22.84], [10.96, 22.92], [10.98, 22.92], [11, 22.94], [11.1, 23], [11.3, 23.12], [11.42, 23.18], [11.52, 23.24], [11.72, 23.36], [11.86, 23.44], [12, 23.52], [11.84, 23.8], [11.74, 24], [11.6, 24.26], [11.58, 24.26], [11.56, 24.26], [11.56, 24.24], [11.54, 24.24], [11.52, 24.24], [11.5, 24.22], [11.48, 24.22], [11.46, 24.22], [11.44, 24.22], [11.44, 24.2], [11.42, 24.2], [11.14, 24.4], [11.12, 24.4], [11.1, 24.4], [11.08, 24.42], [11.06, 24.42], [11.04, 24.42], [11.04, 24.44], [11.04, 24.46], [11.02, 24.46], [11.02, 24.48], [11, 24.48], [10.98, 24.48], [10.98, 24.5], [10.96, 24.5], [10.96, 24.52], [10.96, 24.54], [10.94, 24.54], [10.92, 24.54], [10.9, 24.56], [10.88, 24.56], [10.86, 24.56], [10.84, 24.56], [10.84, 24.58], [10.82, 24.56], [10.8, 24.56], [10.8, 24.54], [10.8, 24.52], [10.78, 24.52], [10.76, 24.52], [10.76, 24.54], [10.74, 24.54], [10.74, 24.56], [10.72, 24.56], [10.72, 24.58], [10.7, 24.58], [10.68, 24.58], [10.66, 24.58], [10.66, 24.56], [10.64, 24.56], [10.64, 24.58], [10.64, 24.56], [10.62, 24.56], [10.62, 24.58], [10.6, 24.56], [10.58, 24.56], [10.58, 24.54], [10.56, 24.54], [10.54, 24.54], [10.52, 24.54], [10.5, 24.54], [10.48, 24.54], [10.46, 24.54], [10.44, 24.54], [10.42, 24.54], [10.4, 24.54], [10.38, 24.54], [10.36, 24.54], [10.34, 24.56], [10.32, 24.56], [10.32, 24.58], [10.3, 24.6], [10.28, 24.6], [10.28, 24.62], [10.26, 24.62], [10.24, 24.64], [10.22, 24.64], [10.22, 24.66], [10.2, 24.66], [10.2, 24.68], [10.2, 24.7], [10.18, 24.72], [10.18, 24.74], [10.16, 24.74], [10.16, 24.76], [10.16, 24.78], [10.14, 24.8], [10.14, 24.82], [10.12, 24.82], [10.12, 24.84], [10.1, 24.84], [10.1, 24.86], [10.1, 24.88], [10.08, 24.9], [10.08, 24.92], [10.06, 24.92], [10.06, 24.94], [10.04, 24.96], [10.04, 24.98], [10.04, 25], [10.04, 25.04], [10.04, 25.08], [10.04, 25.16], [9.06, 25.14], [9, 25.22], [8.94, 25.28], [8.9, 25.34], [8.88, 25.34], [8.88, 25.36], [8.88, 25.38], [8.86, 25.4], [8.88, 25.42], [8.86, 25.42], [8.84, 25.42], [8.84, 25.44], [8.7, 25.64], [8.62, 25.64], [8.44, 25.56], [8.42, 25.56], [8.4, 25.54], [8.38, 25.54], [8.36, 25.54], [8.36, 25.52], [8.36, 25.5], [8.34, 25.5], [8.36, 25.5], [8.36, 25.48], [8.34, 25.48], [8.36, 25.48], [8.34, 25.48], [8.34, 25.46], [8.32, 25.46], [8.3, 25.46], [8.28, 25.46], [8.28, 25.48], [8.26, 25.48], [8.24, 25.48], [8.24, 25.46], [8.22, 25.46], [8.2, 25.46], [8.18, 25.46], [8.16, 25.46], [8.14, 25.46], [8.04, 25.38], [8.02, 25.38], [8.02, 25.36], [8.02, 25.34], [8, 25.34], [7.98, 25.34], [7.98, 25.32], [7.96, 25.3], [7.96, 25.28], [7.96, 25.26], [7.94, 25.26], [7.94, 25.24], [7.94, 25.22], [7.92, 25.22], [7.9, 25.22], [7.88, 25.22], [7.86, 25.22], [7.84, 25.22], [7.82, 25.22], [7.74, 25.24], [7.72, 25.24], [7.7, 25.24], [7.68, 25.22], [7.66, 25.22], [7.64, 25.22], [7.62, 25.22], [7.6, 25.2], [7.58, 25.2], [7.58, 25.18], [7.56, 25.18], [7.54, 25.2], [7.52, 25.2], [7.5, 25.2], [7.5, 25.22], [7.48, 25.22], [7.46, 25.22], [7.46, 25.24], [7.44, 25.24], [7.24, 25.26], [7, 25.4], [6.58, 25.56], [6.58, 25.52]]] } }, { type: "Feature", properties: { code: 57, fr: "El M'Ghair", ar: "\u0627\u0644\u0645\u063A\u064A\u0631", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[5.18, 34.42], [5.18, 34.4], [5.2, 34.4], [5.22, 34.4], [5.22, 34.38], [5.24, 34.38], [5.24, 34.36], [5.26, 34.36], [5.24, 34.36], [5.24, 34.34], [5.22, 34.34], [5.22, 34.3], [5.2, 34.28], [5.22, 34.28], [5.24, 34.26], [5.28, 34.24], [5.32, 34.2], [5.34, 34.18], [5.36, 34.16], [5.36, 34.12], [5.34, 34.08], [5.34, 34.06], [5.32, 34.06], [5.32, 34.04], [5.3, 34.02], [5.3, 34], [5.28, 34], [5.28, 33.98], [5.26, 33.96], [5.26, 33.94], [5.26, 33.9], [5.26, 33.88], [5.24, 33.86], [5.22, 33.84], [5.22, 33.82], [5.24, 33.8], [5.28, 33.74], [5.28, 33.72], [5.28, 33.7], [5.28, 33.68], [5.28, 33.66], [5.28, 33.64], [5.28, 33.62], [5.28, 33.6], [5.28, 33.58], [5.28, 33.56], [5.28, 33.54], [5.3, 33.54], [5.3, 33.52], [5.3, 33.5], [5.32, 33.5], [5.32, 33.48], [5.32, 33.46], [5.3, 33.46], [5.3, 33.44], [5.28, 33.44], [5.28, 33.42], [5.72, 33.4], [6.08, 33.4], [6.08, 33.42], [6.08, 33.44], [6.08, 33.46], [6.08, 33.48], [6.08, 33.5], [6.08, 33.52], [6.06, 33.52], [6.04, 33.52], [6.04, 33.54], [6.04, 33.56], [6.02, 33.56], [6.02, 33.58], [6, 33.58], [6, 33.6], [6.02, 33.62], [6.04, 33.62], [6.06, 33.62], [6.06, 33.64], [6.06, 33.66], [6.06, 33.68], [6.04, 33.68], [6.04, 33.7], [6.06, 33.7], [6.06, 33.72], [6.06, 33.74], [6.06, 33.76], [6.06, 33.78], [6.04, 33.78], [6.04, 33.8], [6.04, 33.82], [6.02, 33.82], [6.02, 33.84], [6.02, 33.86], [6.04, 33.86], [6.02, 33.86], [6.02, 33.88], [6.04, 33.88], [6.04, 33.9], [6.06, 33.9], [6.06, 33.88], [6.06, 33.86], [6.08, 33.86], [6.08, 33.88], [6.1, 33.88], [6.1, 33.86], [6.1, 33.88], [6.12, 33.88], [6.12, 33.9], [6.14, 33.9], [6.14, 33.92], [6.12, 34.06], [6.08, 34.16], [5.98, 34.22], [5.98, 34.32], [5.96, 34.38], [5.94, 34.38], [5.92, 34.38], [5.9, 34.38], [5.9, 34.4], [5.88, 34.4], [5.86, 34.4], [5.84, 34.4], [5.82, 34.4], [5.8, 34.4], [5.78, 34.4], [5.7, 34.42], [5.68, 34.42], [5.66, 34.42], [5.6, 34.42], [5.56, 34.42], [5.54, 34.42], [5.54, 34.44], [5.52, 34.44], [5.5, 34.44], [5.48, 34.44], [5.46, 34.44], [5.44, 34.44], [5.42, 34.44], [5.4, 34.44], [5.4, 34.46], [5.38, 34.46], [5.36, 34.46], [5.36, 34.48], [5.34, 34.48], [5.32, 34.48], [5.32, 34.5], [5.3, 34.5], [5.3, 34.52], [5.3, 34.5], [5.28, 34.5], [5.26, 34.5], [5.24, 34.5], [5.24, 34.48], [5.26, 34.48], [5.26, 34.46], [5.28, 34.46], [5.26, 34.46], [5.24, 34.46], [5.24, 34.44], [5.22, 34.44], [5.2, 34.44], [5.2, 34.42], [5.18, 34.42]]] } }, { type: "Feature", properties: { code: 58, fr: "El Meniaa", ar: "\u0627\u0644\u0645\u0646\u064A\u0639\u0629", source: "fr33dz Algeria-geojson (ODbL)" }, geometry: { type: "Polygon", coordinates: [[[1.9, 30.02], [1.9, 30], [1.92, 29.92], [1.96, 29.74], [2, 29.54], [2.02, 29.44], [2.02, 29.42], [2.06, 29.26], [2.08, 29.18], [2.1, 29.08], [2.06, 29], [2.06, 28.98], [2.04, 28.94], [2.04, 28.9], [2.06, 28.9], [2.08, 28.92], [2.16, 28.94], [2.22, 28.96], [2.28, 28.98], [2.32, 28.98], [2.34, 29], [2.36, 29], [2.38, 29], [2.44, 29.02], [2.5, 29.04], [2.54, 29.04], [2.56, 29.06], [2.72, 29.06], [3, 29.08], [3.02, 29.1], [3.06, 29.1], [3.1, 29.12], [3.16, 29.14], [3.22, 29.16], [3.28, 29.18], [3.32, 29.2], [3.36, 29.22], [3.38, 29.24], [3.4, 29.26], [3.42, 29.32], [3.46, 29.38], [3.52, 29.48], [3.54, 29.5], [3.56, 29.56], [3.6, 29.62], [3.62, 29.66], [3.66, 29.68], [3.66, 29.72], [3.68, 29.74], [3.68, 29.76], [3.68, 29.78], [3.7, 29.78], [3.72, 29.78], [3.72, 29.8], [3.74, 29.8], [3.76, 29.82], [3.76, 29.84], [3.76, 29.86], [3.78, 29.88], [3.8, 29.94], [3.82, 30], [3.82, 30.02], [3.84, 30.06], [3.86, 30.12], [3.88, 30.18], [3.92, 30.28], [3.94, 30.36], [3.96, 30.42], [4, 30.5], [4, 30.52], [4.02, 30.54], [4.02, 30.58], [4.04, 30.6], [4.06, 30.68], [4.08, 30.76], [4.12, 30.84], [4.14, 30.9], [4.16, 30.94], [4.16, 30.96], [4.16, 30.98], [4.18, 31], [4.2, 31.08], [4.24, 31.22], [4.26, 31.24], [4.34, 31.4], [4.4, 31.54], [4.4, 31.56], [4.42, 31.62], [4.42, 31.72], [4.42, 31.78], [4.42, 31.8], [4.4, 31.8], [4.4, 31.82], [4.4, 31.84], [4.38, 31.84], [4.38, 31.82], [4.36, 31.82], [4.36, 31.84], [4.34, 31.84], [4.32, 31.84], [4.3, 31.84], [4.3, 31.86], [4.28, 31.86], [4.26, 31.86], [4.26, 31.88], [4.24, 31.88], [4.22, 31.88], [4.22, 31.9], [4.2, 31.9], [4.2, 31.92], [4.18, 31.92], [4.18, 31.94], [4.16, 31.94], [4.14, 31.94], [4.12, 31.94], [4.1, 31.94], [4.08, 31.94], [4.06, 31.94], [4.06, 31.96], [4.04, 31.96], [4.02, 31.96], [4.02, 31.98], [4, 31.98], [3.98, 31.98], [3.98, 32], [3.96, 32], [3.96, 31.98], [3.96, 32], [3.94, 32], [3.94, 31.98], [3.92, 31.98], [3.92, 32], [3.9, 32], [3.88, 32], [3.88, 32.02], [3.86, 32.02], [3.84, 32.02], [3.82, 32.02], [3.36, 32.1], [3.34, 32.1], [3.32, 32.1], [3.3, 32.1], [3.28, 32.1], [3.28, 32.12], [3.26, 32.12], [2.96, 32.18], [2.52, 32.34], [2.28, 32.54], [2.3, 32.48], [2.32, 32.42], [2.34, 32.36], [2.34, 32.3], [2.36, 32.26], [2.32, 32.24], [2.3, 32.22], [2.28, 32.22], [2.26, 32.22], [2.26, 32.2], [2.24, 32.2], [2.24, 32.18], [2.24, 32.16], [2.24, 32.14], [2.24, 32.12], [2.26, 32.1], [2.26, 32.08], [2.26, 32.06], [2.26, 32.04], [2.26, 32.02], [2.26, 32], [2.26, 31.98], [2.26, 31.96], [2.26, 31.94], [2.28, 31.9], [2.28, 31.86], [2.24, 31.84], [2.2, 31.8], [2.14, 31.74], [2.08, 31.68], [2.06, 31.66], [2.06, 31.38], [2.04, 31.1], [2.04, 31], [2.04, 30.98], [2.04, 30.94], [2.02, 30.86], [2.02, 30.74], [2.02, 30.54], [2.02, 30.5], [2.02, 30.48], [2.02, 30.44], [2, 30.42], [2, 30.4], [2, 30.38], [1.98, 30.3], [1.96, 30.24], [1.94, 30.2], [1.94, 30.14], [1.92, 30.1], [1.92, 30.06], [1.9, 30.02]]] } }] };

// src/reports.js
var CATEGORIES = ["fire", "smoke", "road", "flood", "animal", "heat", "other"];
var MAX_PER_HOUR = 10;
var SALT = "radbalek-v1";
function reportKey(now, rand) {
  const inv = String(1e13 - now.getTime()).padStart(14, "0");
  return `r:${inv}:${rand}`;
}
__name(reportKey, "reportKey");
async function clientKey(request) {
  const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(SALT + ip));
  return [...new Uint8Array(buf.slice(0, 8))].map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(clientKey, "clientKey");
function corsHeaders(extra = {}) {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type",
    ...extra
  };
}
__name(corsHeaders, "corsHeaders");
var json = /* @__PURE__ */ __name((obj, status = 200, extra = {}) => new Response(JSON.stringify(obj), {
  status,
  headers: corsHeaders({ "content-type": "application/json; charset=utf-8", ...extra })
}), "json");
async function handleWilayasList() {
  return json(WILAYAS.map((w) => ({ code: w.code, fr: w.fr, ar: w.ar })), 200, {
    "cache-control": "public, max-age=86400"
  });
}
__name(handleWilayasList, "handleWilayasList");
async function handleCreateReport(request, env, wilayasGeojson, now = /* @__PURE__ */ new Date()) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const category = String(body.category || "");
  if (!CATEGORIES.includes(category)) return json({ error: "bad category" }, 400);
  const ck = await clientKey(request);
  const rl = Number(await env.EWS_KV.get(`rl:${ck}`) || 0);
  if (rl >= MAX_PER_HOUR) return json({ error: "rate limit" }, 429);
  let wilaya = null;
  let lat = body.lat === null || body.lat === void 0 ? NaN : Number(body.lat);
  let lon = body.lon === null || body.lon === void 0 ? NaN : Number(body.lon);
  const inDz = lat >= 18.9 && lat <= 37.3 && lon >= -8.7 && lon <= 12;
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !inDz) lat = lon = null;
  if (lat !== null) {
    const resolved = makeWilayaResolver(wilayasGeojson)(lat, lon);
    if (resolved) wilaya = resolved.code;
    lat = Math.round(lat * 1e3) / 1e3;
    lon = Math.round(lon * 1e3) / 1e3;
  }
  if (!wilaya && body.wilaya) {
    const w = wilayaByCode(Number(body.wilaya));
    if (w) wilaya = w.code;
  }
  if (!wilaya && lat === null) return json({ error: "need wilaya or position" }, 400);
  const report = {
    id: reportKey(now, Math.random().toString(36).slice(2, 6)),
    at: now.toISOString(),
    category,
    wilaya,
    lat,
    lon,
    description: String(body.description || "").slice(0, 280).replace(/[<>]/g, ""),
    lang: ["fr", "ar", "en"].includes(body.lang) ? body.lang : "fr",
    status: "new",
    confirms: 0,
    ck
  };
  await env.EWS_KV.put(report.id, JSON.stringify(report), { expirationTtl: 60 * 60 * 24 * 180 });
  try {
    await env.EWS_KV.put(`rl:${ck}`, String(rl + 1), { expirationTtl: 3600 });
  } catch {
  }
  const { ck: _omit, ...pub } = report;
  return json({ ok: true, report: pub }, 201);
}
__name(handleCreateReport, "handleCreateReport");
async function handleConfirmReport(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const id = String(body.id || "");
  if (!/^r:\d{14}:[a-z0-9]+$/.test(id)) return json({ error: "bad id" }, 400);
  const raw = await env.EWS_KV.get(id);
  if (!raw) return json({ error: "not found" }, 404);
  const ck = await clientKey(request);
  const rl = Number(await env.EWS_KV.get(`cf:${ck}`) || 0);
  if (rl >= 20) return json({ error: "rate limit" }, 429);
  const marker = `rc:${id}:${ck}`;
  if (await env.EWS_KV.get(marker)) return json({ ok: true, already: true });
  try {
    await env.EWS_KV.put(`cf:${ck}`, String(rl + 1), { expirationTtl: 3600 });
  } catch {
  }
  const report = JSON.parse(raw);
  if (report.ck === ck) return json({ ok: true, own: true });
  report.confirms += 1;
  if (report.confirms >= 3) report.status = "community-confirmed";
  await env.EWS_KV.put(id, JSON.stringify(report), { expirationTtl: 60 * 60 * 24 * 180 });
  try {
    await env.EWS_KV.put(marker, "1", { expirationTtl: 60 * 60 * 24 * 30 });
  } catch {
  }
  return json({ ok: true, confirms: report.confirms, status: report.status });
}
__name(handleConfirmReport, "handleConfirmReport");
var HIDDEN = /* @__PURE__ */ new Set(["spam", "rejected"]);
async function handleFeedback(request, env) {
  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const type = ["bug", "idea", "comment"].includes(b.type) ? b.type : "comment";
  const text = String(b.text || "").slice(0, 600).replace(/[<>]/g, "").trim();
  const rating = Number.isInteger(b.rating) && b.rating >= 1 && b.rating <= 5 ? b.rating : null;
  if (!text && !rating) return json({ error: "empty" }, 400);
  const ck = await clientKey(request);
  const rl = Number(await env.EWS_KV.get(`fbrl:${ck}`) || 0);
  if (rl >= 3) return json({ error: "rate limit" }, 429);
  const inv = String(1e13 - Date.now()).padStart(14, "0");
  await env.EWS_KV.put(
    `fb:${inv}:${Math.random().toString(36).slice(2, 6)}`,
    JSON.stringify({
      at: (/* @__PURE__ */ new Date()).toISOString(),
      type,
      rating,
      text,
      version: String(b.version || "").slice(0, 20),
      lang: ["fr", "ar", "en"].includes(b.lang) ? b.lang : "fr"
    }),
    { expirationTtl: 60 * 60 * 24 * 365 }
  );
  try {
    await env.EWS_KV.put(`fbrl:${ck}`, String(rl + 1), { expirationTtl: 3600 });
  } catch {
  }
  return json({ ok: true }, 201);
}
__name(handleFeedback, "handleFeedback");
async function listReports(env, limit, { includeHidden = false } = {}) {
  const listed = await env.EWS_KV.list({ prefix: "r:", limit });
  const out = [];
  for (const k of listed.keys) {
    const raw = await env.EWS_KV.get(k.name);
    if (!raw) continue;
    let pub;
    try {
      const { ck: _omit, ...rest } = JSON.parse(raw);
      pub = rest;
    } catch {
      continue;
    }
    if (!includeHidden && HIDDEN.has(pub.status)) continue;
    out.push(pub);
  }
  return out;
}
__name(listReports, "listReports");
async function handleListReports(url, env) {
  const limit = Math.min(Number(url.searchParams.get("limit") || 100), 200);
  const reports = await listReports(env, limit);
  return json({ count: reports.length, reports });
}
__name(handleListReports, "handleListReports");
async function handleExportCsv(env) {
  const reports = await listReports(env, 1e3);
  const esc = /* @__PURE__ */ __name((v) => v === null || v === void 0 ? "" : /[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : String(v), "esc");
  const rows = [
    "id,at,category,wilaya,lat,lon,description,lang,status,confirms",
    ...reports.map((r) => [r.id, r.at, r.category, r.wilaya, r.lat, r.lon, r.description, r.lang, r.status, r.confirms].map(esc).join(","))
  ];
  return new Response(rows.join("\n"), {
    headers: corsHeaders({
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="radbalek-reports.csv"'
    })
  });
}
__name(handleExportCsv, "handleExportCsv");

// src/ai.js
var MODEL = "gemini-flash-lite-latest";
var json2 = /* @__PURE__ */ __name((o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: corsHeaders({ "content-type": "application/json; charset=utf-8" }) }), "json");
async function geminiGenerate(env, { system, contents, maxTokens = 400, temperature = 0.4, noThinking = false, model = MODEL }) {
  const cfg = { temperature, maxOutputTokens: maxTokens };
  if (noThinking) cfg.thinkingConfig = { thinkingBudget: 0 };
  const body = { contents, generationConfig: cfg };
  if (system) body.systemInstruction = { parts: [{ text: system }] };
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "x-goog-api-key": env.GEMINI_API_KEY.trim(), "content-type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!r.ok) throw new Error(`gemini ${r.status}: ${(await r.text()).slice(0, 500)}`);
  const j = await r.json();
  return (j.candidates?.[0]?.content?.parts?.[0]?.text || "").trim();
}
__name(geminiGenerate, "geminiGenerate");
async function rateOk(env, request, cap = 40) {
  const ip = request.headers.get("cf-connecting-ip") || "0";
  const key = `air:${ip}`;
  const n = Number(await env.EWS_KV.get(key) || 0);
  if (n >= cap) return false;
  try {
    await env.EWS_KV.put(key, String(n + 1), { expirationTtl: 3600 });
  } catch {
  }
  return true;
}
__name(rateOk, "rateOk");
var LANG_NAME = {
  ar: "the user's language (Arabic or Algerian darija)",
  en: "English",
  fr: "French"
};
async function handleChat(request, env) {
  if (!env.GEMINI_API_KEY) return json2({ error: "ai disabled" }, 503);
  if (!await rateOk(env, request)) return json2({ error: "rate limit" }, 429);
  let b;
  try {
    b = await request.json();
  } catch {
    return json2({ error: "bad json" }, 400);
  }
  const lang = ["fr", "ar", "en"].includes(b.lang) ? b.lang : "fr";
  const system = `You are the assistant of Rad Balek (\u0631\u062F \u0628\u0627\u0644\u0643), an early-warning app for Algeria covering heatwaves, wildfires, floods, earthquakes, storms and road danger. Always answer in ${LANG_NAME[lang]}, briefly and clearly, with practical safety advice. For any real emergency, remind the user to call Protection Civile (14 or 1021). Never give a medical diagnosis. Stay strictly on safety, weather, hazards, first aid, and using the app; if asked something off-topic, gently steer back to safety. Be calm and reassuring, never alarmist.

Current situation for this user:
${String(b.context || "").slice(0, 1500)}`;
  const contents = (b.messages || []).slice(-12).map((m) => ({ role: m.role === "user" ? "user" : "model", parts: [{ text: String(m.text || "").slice(0, 1e3) }] }));
  if (!contents.length) return json2({ error: "no message" }, 400);
  try {
    const text = await geminiGenerate(env, { system, contents, maxTokens: 260, temperature: 0.4 });
    return json2({ text });
  } catch (e) {
    return json2({ error: String(e.message).slice(0, 160) }, 502);
  }
}
__name(handleChat, "handleChat");
async function handleCategory(request, env) {
  if (!env.GEMINI_API_KEY) return json2({ error: "ai disabled" }, 503);
  if (!await rateOk(env, request)) return json2({ error: "rate limit" }, 429);
  let b;
  try {
    b = await request.json();
  } catch {
    return json2({ error: "bad json" }, 400);
  }
  const text = String(b.text || "").slice(0, 280);
  if (text.trim().length < 4) return json2({ category: null });
  try {
    const out = await geminiGenerate(env, {
      contents: [{ role: "user", parts: [{ text: `A citizen in Algeria describes a hazard (Arabic, darija or French): "${text}". Reply with EXACTLY one word matching the hazard: fire, smoke, road, flood, animal, heat, other.` }] }],
      maxTokens: 12,
      temperature: 0
    });
    const word = out.toLowerCase().replace(/[^a-z]/g, "");
    const cats = ["fire", "smoke", "road", "flood", "animal", "heat", "other"];
    return json2({ category: cats.includes(word) ? word : null });
  } catch (e) {
    return json2({ error: String(e.message).slice(0, 120) }, 502);
  }
}
__name(handleCategory, "handleCategory");

// src/admin.js
var json3 = /* @__PURE__ */ __name((o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: corsHeaders({ "content-type": "application/json; charset=utf-8" }) }), "json");
function adminKeyOf(request, url) {
  const m = (request.headers.get("authorization") || "").match(/^Bearer\s+(.+)$/i);
  return (m ? m[1] : url.searchParams.get("key")) || "";
}
__name(adminKeyOf, "adminKeyOf");
async function adminAuthed(request, url, env) {
  if (!env.ADMIN_KEY) return false;
  const ip = request.headers.get("cf-connecting-ip") || "0";
  const rlKey = `adminrl:${ip}`;
  const fails = Number(await env.EWS_KV.get(rlKey) || 0);
  if (fails >= 10) return false;
  if (adminKeyOf(request, url) === env.ADMIN_KEY) return true;
  try {
    await env.EWS_KV.put(rlKey, String(fails + 1), { expirationTtl: 3600 });
  } catch {
  }
  return false;
}
__name(adminAuthed, "adminAuthed");
async function handleAdminList(request, url, env) {
  if (!await adminAuthed(request, url, env)) return json3({ error: "forbidden" }, 403);
  const prefix = url.searchParams.get("kind") === "feedback" ? "fb:" : "r:";
  const listed = await env.EWS_KV.list({ prefix, limit: 100 });
  const out = [];
  for (const k of listed.keys) {
    const raw = await env.EWS_KV.get(k.name);
    if (raw) {
      const item = JSON.parse(raw);
      if (!item.id) item.id = k.name;
      out.push(item);
    }
  }
  return json3({ count: out.length, reports: out });
}
__name(handleAdminList, "handleAdminList");
async function handleModerate(request, url, env) {
  if (!await adminAuthed(request, url, env)) return json3({ error: "forbidden" }, 403);
  let b;
  try {
    b = await request.json();
  } catch {
    return json3({ error: "invalid json" }, 400);
  }
  if (!["verified", "rejected"].includes(b.status)) return json3({ error: "bad status" }, 400);
  const raw = await env.EWS_KV.get(String(b.id || ""));
  if (!raw) return json3({ error: "not found" }, 404);
  const report = JSON.parse(raw);
  report.status = b.status;
  await env.EWS_KV.put(report.id, JSON.stringify(report), { expirationTtl: 60 * 60 * 24 * 180 });
  return json3({ ok: true, id: report.id, status: report.status });
}
__name(handleModerate, "handleModerate");
async function handleAdminOverview(request, url, env) {
  if (!await adminAuthed(request, url, env)) return json3({ error: "forbidden" }, 403);
  const [latestRaw, pushRaw, appRaw] = await Promise.all([
    env.EWS_KV.get("latest"),
    env.EWS_KV.get("push:last"),
    env.EWS_KV.get("app:latest")
  ]);
  const parse = /* @__PURE__ */ __name((s) => {
    try {
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  }, "parse");
  const snap = parse(latestRaw);
  const sources = {};
  for (const i of snap && snap.incidents || []) {
    const s = sources[i.source] || (sources[i.source] = { count: 0, newest: null });
    s.count++;
    if (i.observedAt && (!s.newest || i.observedAt > s.newest)) s.newest = i.observedAt;
  }
  return json3({
    now: (/* @__PURE__ */ new Date()).toISOString(),
    generatedAt: snap ? snap.generatedAt : null,
    stats: snap ? snap.stats : null,
    errors: snap && snap.errors || [],
    alerts: (snap && snap.alerts || []).map((a) => ({
      hazard: a.hazard,
      color: a.color,
      event: a.event,
      wilayas: (a.wilayas || []).length,
      expires: a.expires || null
    })),
    sources,
    push: parse(pushRaw),
    appLatest: parse(appRaw),
    config: { gemini: !!env.GEMINI_API_KEY, push: !!env.FIREBASE_SA, firms: !!env.FIRMS_MAP_KEY }
  });
}
__name(handleAdminOverview, "handleAdminOverview");
async function handleAdminAppLatest(request, url, env) {
  if (!await adminAuthed(request, url, env)) return json3({ error: "forbidden" }, 403);
  let b;
  try {
    b = await request.json();
  } catch {
    return json3({ error: "invalid json" }, 400);
  }
  const version = String(b.version || "").trim();
  if (!/^\d+\.\d+\.\d+$/.test(version)) return json3({ error: "version must be x.y.z" }, 400);
  const https = /* @__PURE__ */ __name((s) => /^https:\/\/\S+$/.test(s), "https");
  const tag2 = String(b.tag || "v" + version).trim().slice(0, 60);
  const page = String(b.url || "").trim();
  const apk = String(b.apk || "").trim();
  if (page && !https(page)) return json3({ error: "url must be https" }, 400);
  if (apk && !https(apk)) return json3({ error: "apk must be https" }, 400);
  const doc = {
    version,
    tag: tag2,
    url: page || void 0,
    apk: apk || void 0,
    notes: String(b.notes || "").slice(0, 500) || void 0,
    at: (/* @__PURE__ */ new Date()).toISOString()
  };
  await env.EWS_KV.put("app:latest", JSON.stringify(doc));
  return json3({ ok: true, appLatest: doc });
}
__name(handleAdminAppLatest, "handleAdminAppLatest");
var CATS = ["fire", "smoke", "road", "flood", "animal", "heat", "other"];
async function geminiModerate(env, report) {
  if (!env.GEMINI_API_KEY || !report.description) return null;
  const text = String(report.description).slice(0, 400);
  try {
    const out = await geminiGenerate(env, {
      contents: [{ role: "user", parts: [{ text: `You moderate citizen hazard reports for an Algerian emergency-warning app. A user submitted category "${report.category}" with text (Arabic, Algerian darija, or French): "${text}". Err strongly toward KEEPING a genuine hazard report even if short, misspelled, in rough darija, or containing a rude word. Classify:
- SPAM = advertising/promotion, insults or harassment of people, vulgar/obscene/sexual language, hate speech, jokes, random gibberish, or anything clearly NOT reporting a real danger. Profanity in Arabic, Algerian darija, or French counts as SPAM ONLY when the message is not a genuine hazard report.
- MISMATCH = a real hazard report but the wrong category; then give the correct one.
- OK = a plausible hazard report \u2014 keep it even if it contains a swear word, as long as it describes a real danger.
Reply with ONE token only: OK, or SPAM, or MISMATCH:<category> where <category> is one of ${CATS.join("/")}.` }] }],
      maxTokens: 12,
      temperature: 0
    });
    const s = (out || "").trim().toUpperCase();
    if (s.startsWith("SPAM")) return { verdict: "spam" };
    if (s.startsWith("MISMATCH")) {
      const cat = (s.split(":")[1] || "").toLowerCase().replace(/[^a-z]/g, "");
      return { verdict: "mismatch", category: CATS.includes(cat) ? cat : null };
    }
    if (s.startsWith("OK")) return { verdict: "ok" };
    return null;
  } catch {
    return null;
  }
}
__name(geminiModerate, "geminiModerate");
async function triageReport(env, pub) {
  const m = await geminiModerate(env, pub);
  if (!m) return;
  const raw = await env.EWS_KV.get(pub.id);
  if (!raw) return;
  const r = JSON.parse(raw);
  if (r.status !== "new") return;
  if (m.verdict === "spam") {
    r.status = "spam";
    r.moderatedBy = "ai";
  } else {
    r.status = "auto-ok";
    if (m.verdict === "mismatch" && m.category && m.category !== r.category) {
      r.categoryOriginal = r.category;
      r.category = m.category;
    }
  }
  try {
    await env.EWS_KV.put(r.id, JSON.stringify(r), { expirationTtl: 60 * 60 * 24 * 180 });
  } catch {
  }
}
__name(triageReport, "triageReport");
async function handleTestPush(request, env, ctx) {
  let b;
  try {
    b = await request.json();
  } catch {
    return json3({ error: "invalid json" }, 400);
  }
  const token = String(b.token || "");
  if (token.length < 50 || token.length > 400) return json3({ error: "bad token" }, 400);
  if (!env.FIREBASE_SA) return json3({ error: "push disabled" }, 503);
  const ip = request.headers.get("cf-connecting-ip") || "0.0.0.0";
  const rlKey = `tp:${ip}`;
  const n = Number(await env.EWS_KV.get(rlKey) || 0);
  if (n >= 12) return json3({ error: "rate limit" }, 429);
  const sa = JSON.parse(env.FIREBASE_SA);
  const at = await getAccessToken(sa, env);
  try {
    await env.EWS_KV.put(rlKey, String(n + 1), { expirationTtl: 3600 });
  } catch {
  }
  const send = /* @__PURE__ */ __name(async () => {
    await new Promise((r) => setTimeout(r, 8e3));
    await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: "POST",
      headers: { authorization: `Bearer ${at}`, "content-type": "application/json" },
      body: JSON.stringify({
        message: {
          token,
          // Data-only RED: exercises the exact native siren path a real red
          // alert uses (forced alarm volume + full-screen + insistent loop).
          data: {
            kind: "self-test",
            color: "red",
            headline_fr: "\u{1F534} Rad Balek \u2014 test \u2713",
            headline_ar: "\u0627\u0644\u062A\u0646\u0628\u064A\u0647\u0627\u062A \u062A\u0639\u0645\u0644 \u2014 Vos alertes fonctionnent.",
            alertId: "self-test",
            hazard: "other"
          },
          android: { priority: "HIGH" }
        }
      })
    });
  }, "send");
  if (ctx) ctx.waitUntil(send());
  else await send();
  return json3({ ok: true, delayed: 8 });
}
__name(handleTestPush, "handleTestPush");
function liteSnapshot(full) {
  const s = JSON.parse(full);
  return JSON.stringify({
    generatedAt: s.generatedAt,
    stats: s.stats,
    alerts: s.alerts,
    // Keep ALL ground-truth incidents (DGPC fires, roads); cap only satellite clusters.
    incidents: [
      ...(s.incidents || []).filter((i) => i.source !== "firms"),
      ...(s.incidents || []).filter((i) => i.source === "firms").slice(0, 90)
    ].map((i) => ({
      id: i.id,
      source: i.source,
      hazard: i.hazard,
      status: i.status,
      wilayas: i.wilayas,
      commune: i.commune,
      detections: i.detections,
      totalFrp: i.totalFrp,
      corroborated: i.corroborated,
      possibleIndustrial: i.possibleIndustrial,
      lat: i.lat,
      lon: i.lon,
      mag: i.mag,
      observedAt: i.observedAt,
      // Text sources (Algerian press, dgpc.dz) render their own headline,
      // named source and article link — the map-pin sources (FIRMS, quakes)
      // don't need them, so this only fattens a handful of incidents.
      ...i.source === "press" || i.source === "dgpc-web" ? { headline: i.headline, link: i.link, sourceName: i.sourceName } : {}
    }))
  });
}
__name(liteSnapshot, "liteSnapshot");

// src/adminui.js
var ADMIN_HTML = `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="theme-color" content="#006A60">
<title>Rad Balek \u2014 Contr\xF4le</title>
<style>
:root{--p:#006A60;--bg:#F5FAF8;--s1:#EFF5F2;--s2:#E2E9E6;--tx:#171D1B;--mut:#5c6663;
--red:#BA1A1A;--redc:#FFDAD6;--org:#964900;--orgc:#FFDCC2;--grn:#1D6E37;--grnc:#C9EFCF;--yel:#6D5E00;--yelc:#F0E395}
@media(prefers-color-scheme:dark){:root{--bg:#0E1513;--s1:#161D1B;--s2:#232A28;--tx:#DDE4E1;--mut:#93a09c;
--red:#FFB4AB;--redc:#7B1712;--org:#FFB77C;--orgc:#6B3200;--grn:#8FD69B;--grnc:#1D5430;--yel:#DCC94B;--yelc:#524800}}
*{box-sizing:border-box;margin:0}body{font-family:"Segoe UI",Roboto,"Noto Naskh Arabic",sans-serif;background:var(--bg);color:var(--tx);padding:14px;max-width:760px;margin:0 auto}
h1{font-size:18px;display:flex;align-items:center;gap:8px;margin-bottom:4px}
.sub{font-size:12px;color:var(--mut);margin-bottom:14px}
.bar{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
.pill{background:var(--s1);border-radius:99px;padding:6px 12px;font-size:12px;font-weight:600}
.pill b{font-size:13px}
.card{background:var(--s1);border-radius:16px;padding:13px;margin-bottom:10px}
.row{display:flex;gap:10px;align-items:flex-start}
.tx{flex:1;min-width:0}
.t1{font-size:14px;font-weight:700}
.t2{font-size:12.5px;color:var(--mut);margin-top:2px;word-break:break-word}
.err{color:var(--red);font-weight:600}
.st{font-size:10.5px;font-weight:700;padding:3px 9px;border-radius:99px;display:inline-block;margin-top:6px}
.s-new{background:var(--yelc);color:var(--yel)}.s-auto-ok{background:var(--s2);color:var(--mut)}
.s-flagged{background:var(--redc);color:var(--red)}.s-community-confirmed{background:var(--orgc);color:var(--org)}
.s-verified{background:var(--grnc);color:var(--grn)}.s-rejected{background:var(--s2);color:var(--mut);text-decoration:line-through}
.acts{display:flex;gap:8px;margin-top:9px;flex-wrap:wrap}
button{font:inherit;font-weight:700;font-size:12.5px;border:0;border-radius:99px;padding:8px 16px;cursor:pointer}
button:disabled{opacity:.6;cursor:wait}
.ok{background:var(--grnc);color:var(--grn)}.no{background:var(--redc);color:var(--red)}
.ghost{background:var(--s2);color:var(--tx)}
input{font:inherit;width:100%;padding:10px 14px;border-radius:12px;border:1px solid var(--s2);background:var(--bg);color:var(--tx)}
label{font-size:11px;font-weight:600;color:var(--mut);display:block;margin:9px 0 3px}
canvas{width:100%;height:90px;display:block;margin-top:8px}
#login{margin:40px auto;max-width:340px;text-align:center}
.hide{display:none}
</style></head><body>
<div id="login">
  <h1 style="justify-content:center">\u{1F6E1}\uFE0F Rad Balek \u2014 Contr\xF4le</h1>
  <p class="sub">Cl\xE9 administrateur</p>
  <input id="key" type="password" placeholder="ADMIN_KEY">
  <button class="ghost" style="margin-top:10px;width:100%" onclick="saveKey()">Entrer</button>
</div>
<div id="app" class="hide">
  <h1>\u{1F6E1}\uFE0F Contr\xF4le <span style="font-size:11px;color:var(--mut);font-weight:400" id="upd"></span></h1>
  <p class="sub" id="subline"></p>
  <div class="bar">
    <button class="ghost" id="tabO" onclick="setTab('overview')">\u{1F3E0} Syst\xE8me</button>
    <button class="ghost" id="tabR" onclick="setTab('reports')">\u{1F4CB} Signalements</button>
    <button class="ghost" id="tabF" onclick="setTab('feedback')">\u{1F4AC} Avis</button>
    <button class="ghost" id="tabV" onclick="setTab('version')">\u{1F680} Version</button>
  </div>
  <div class="bar" id="stats"></div>
  <div id="list"></div>
</div>
<script>
const CATS={fire:"\u{1F525} Feu",smoke:"\u{1F4A8} Fum\xE9e",road:"\u{1F697} Route",flood:"\u{1F30A} Oued/Crue",animal:"\u{1F43E} Animal",heat:"\u{1F321}\uFE0F Chaleur",other:"\u2139\uFE0F Autre"};
const FBT={bug:"\u{1F41E} Probl\xE8me",idea:"\u{1F4A1} Id\xE9e",comment:"\u{1F4AC} Avis"};
const HAZ={heat:"\u{1F321}\uFE0F",fire:"\u{1F525}",flood:"\u{1F30A}",storm:"\u26C8\uFE0F",wind:"\u{1F4A8}",quake:"\u{1F30D}",road:"\u{1F697}",rain:"\u{1F327}\uFE0F",other:"\u26A0\uFE0F"};
const NAMES={};
let KEY=localStorage.getItem("rb_admin_key")||"";
let TAB=localStorage.getItem("rb_admin_tab")||"overview";
let GH={at:0,data:null};
function setTab(t){TAB=t;localStorage.setItem("rb_admin_tab",t);boot()}
// Key travels in the Authorization header only \u2014 never in the URL.
const auth=()=>({headers:{authorization:"Bearer "+KEY}});
const esc=s=>String(s==null?"":s).replace(/</g,"&lt;");
const attr=s=>String(s==null?"":s).replace(/"/g,"&quot;");
function ago(iso){if(!iso)return"\u2014";const m=Math.round((Date.now()-Date.parse(iso))/60000);
  if(m<1)return"\xE0 l\u2019instant";if(m<60)return"il y a "+m+" min";if(m<48*60)return"il y a "+Math.round(m/60)+" h";return"il y a "+Math.round(m/1440)+" j"}
function saveKey(){KEY=document.getElementById("key").value.trim();localStorage.setItem("rb_admin_key",KEY);boot()}
function reveal(){document.getElementById("login").classList.add("hide");document.getElementById("app").classList.remove("hide")}
async function aget(p){const r=await fetch(p,auth());
  if(r.status===403){localStorage.removeItem("rb_admin_key");KEY="";alert("Cl\xE9 invalide");return null}
  reveal();return r.json()}
async function boot(){
  if(!KEY)return;
  [["tabO","overview"],["tabR","reports"],["tabF","feedback"],["tabV","version"]].forEach(x=>{
    document.getElementById(x[0]).style.background=TAB===x[1]?"var(--grnc)":"var(--s2)"});
  document.getElementById("upd").textContent="\xB7 "+new Date().toLocaleTimeString("fr",{hour:"2-digit",minute:"2-digit"});
  if(TAB==="overview"){const o=await aget("/v1/admin/overview");if(!o)return;
    let h=[];try{h=await(await fetch("/v1/history.json")).json()}catch(e){}
    paintOverview(o,h);return}
  if(TAB==="version"){const o=await aget("/v1/admin/overview");if(!o)return;
    const rel=await ghReleases();paintVersion(o,rel);return}
  const r=await fetch("/v1/admin/reports"+(TAB==="feedback"?"?kind=feedback":""),auth());
  if(r.status===403){localStorage.removeItem("rb_admin_key");KEY="";alert("Cl\xE9 invalide");return}
  reveal();
  if(!Object.keys(NAMES).length){
    try{(await (await fetch("/v1/wilayas.json")).json()).forEach(w=>NAMES[w.code]=w.fr)}catch(e){}
  }
  const data=await r.json();
  if(TAB==="feedback"){paintFb(data.reports||[]);return}
  let snap=null,push=null;
  try{snap=await (await fetch("/v1/alerts.json?lite=1")).json()}catch(e){}
  try{push=await (await fetch("/v1/push-status.json")).json()}catch(e){}
  paint(data.reports||[],snap,push);
}
// ---- \u{1F3E0} Syst\xE8me ----
function paintOverview(o,hist){
  document.getElementById("subline").textContent="\xC9tat du pipeline, des sources et des notifications \u2014 rafra\xEEchi chaque minute.";
  const st=o.stats||{},bc=st.byColor||{},p=o.push||{},cfg=o.config||{},src=o.sources||{};
  const age=o.generatedAt?Math.round((Date.now()-Date.parse(o.generatedAt))/60000):null;
  // Cron runs every 10 min: >15 = late (orange), >30 = stalled (red).
  const ageS=age==null||age>30?' style="background:var(--redc);color:var(--red)"':(age>15?' style="background:var(--orgc);color:var(--org)"':"");
  const ck=b=>b?"\u2713":'<span class="err">\u2717</span>';
  document.getElementById("stats").innerHTML=
    '<span class="pill"'+ageS+'>\u23F1 donn\xE9es: <b>'+(age==null?"\u2014":age+" min")+'</b></span>'+
    '<span class="pill">\u{1F534} <b>'+(bc.red||0)+'</b> \xB7 \u{1F7E0} <b>'+(bc.orange||0)+'</b> \xB7 \u{1F7E1} <b>'+(bc.yellow||0)+'</b></span>'+
    '<span class="pill">\u{1F9EF} incidents: <b>'+(st.incidents||0)+'</b></span>'+
    '<span class="pill">\u{1F4E8} push: <b>'+(p.sent==null?"\u2013":p.sent)+'</b> \xB7 '+(p.at?ago(p.at):"jamais")+(p.fatal?' \xB7 <span class="err">panne</span>':"")+'</span>'+
    '<span class="pill">\u{1F916} IA '+ck(cfg.gemini)+' \xB7 \u{1F4E8} FCM '+ck(cfg.push)+' \xB7 \u{1F6F0}\uFE0F FIRMS '+ck(cfg.firms)+'</span>';
  const errFor=n=>{const e=(o.errors||[]).find(x=>x.source===n);return e?e.error:null};
  const KNOWN=["onm","firms","dgpc-telegram","dgpc-web","usgs","craag","press"];
  const rows=[
    ["onm","\u{1F321}\uFE0F M\xE9t\xE9o Alg\xE9rie (ONM)",(st.onmEntries||0)+" entr\xE9es \xB7 "+(st.activeAlerts||0)+" vigilances actives"],
    ["firms","\u{1F6F0}\uFE0F NASA FIRMS",st.firmsSkipped?"cl\xE9 absente":((st.fireClusters||0)+" foyers d\xE9tect\xE9s")],
    ["dgpc-telegram","\u{1F692} Protection Civile (Telegram)",(st.dgpcPosts||0)+" posts"+(st.dgpcSitrep?" \xB7 sitrep "+ago(st.dgpcSitrep.postedAt):"")],
    ["dgpc-web","\u{1F3DB}\uFE0F Protection Civile (dgpc.dz)",(st.dgpcWebPosts||0)+" articles"],
    ["usgs","\u{1F30D} S\xE9ismes (EMSC/USGS)",((src.usgs&&src.usgs.count)||0)+" s\xE9ismes"+(src.usgs&&src.usgs.newest?" \xB7 dernier "+ago(src.usgs.newest):"")],
    ["craag","\u{1F1E9}\u{1F1FF} CRAAG",(st.craagRows||0)+" lignes"],
    ["press","\u{1F4F0} Presse alg\xE9rienne",(st.pressItems||0)+" articles"]
  ].map(r=>{const e=errFor(r[0]);
    return '<div style="margin-top:8px"><div class="t1" style="font-size:13px">'+(e?"\u{1F534} ":"\u{1F7E2} ")+r[1]+
      '</div><div class="t2">'+(e?'<span class="err">'+esc(e).slice(0,220)+"</span>":r[2])+"</div></div>"}).join("");
  const extraErr=(o.errors||[]).filter(x=>!KNOWN.includes(x.source));
  const CH={red:["var(--redc)","var(--red)"],orange:["var(--orgc)","var(--org)"],yellow:["var(--yelc)","var(--yel)"],green:["var(--grnc)","var(--grn)"]};
  const alerts=(o.alerts||[]).slice(0,10).map(a=>{const c=CH[a.color]||["var(--s2)","var(--mut)"];
    return '<div class="t2" style="margin-top:6px">'+(HAZ[a.hazard]||"\u26A0\uFE0F")+" "+esc(a.event||a.hazard)+" \u2014 "+a.wilayas+
      ' wilaya(s) <span class="st" style="margin:0;background:'+c[0]+";color:"+c[1]+'">'+a.color+"</span></div>"}).join("")
    ||'<div class="t2" style="margin-top:6px">Aucune vigilance active.</div>';
  const pline=p.at?("Dernier cycle "+ago(p.at)+" \xB7 envoy\xE9s <b>"+(p.sent==null?"\u2013":p.sent)+"</b> \xB7 d\xE9dupliqu\xE9s <b>"+(p.deduped==null?"\u2013":p.deduped)+"</b>"+
      (p.heartbeats?" \xB7 heartbeats "+p.heartbeats:"")+
      ((p.errors&&p.errors.length)?' \xB7 <span class="err">'+p.errors.length+" erreurs</span>":"")+
      (p.fatal?'<br><span class="err">FATAL: '+esc(p.fatal)+"</span>":"")):"Jamais ex\xE9cut\xE9.";
  document.getElementById("list").innerHTML=
    '<div class="card"><div class="row"><div class="tx"><div class="t1">\u2699\uFE0F Actions</div>'+
    '<div class="t2">Le cron collecte toutes les 10 min \u2014 ce bouton force une collecte imm\xE9diate (sans push).</div>'+
    '<div class="acts"><button class="ok" id="btnRefresh" onclick="refreshPipeline()">\u{1F504} Rafra\xEEchir le pipeline</button></div>'+
    "</div></div></div>"+
    '<div class="card"><div class="t1">\u{1F4E1} Sources</div>'+rows+
    (extraErr.length?'<div class="t2" style="margin-top:8px"><span class="err">'+extraErr.map(x=>esc(x.source+": "+x.error).slice(0,220)).join("<br>")+"</span></div>":"")+"</div>"+
    '<div class="card"><div class="t1">\u{1F6A8} Vigilances actives</div>'+alerts+"</div>"+
    '<div class="card"><div class="t1">\u{1F4C8} Historique (\u{1F534} rouge / \u{1F7E0} orange)</div><canvas id="cv"></canvas><div class="t2" id="cvhint"></div></div>'+
    '<div class="card"><div class="t1">\u{1F4E8} Notifications</div><div class="t2" style="margin-top:6px">'+pline+"</div></div>";
  requestAnimationFrame(function(){drawChart(hist)});
}
function drawChart(hist){
  const cv=document.getElementById("cv");if(!cv)return;
  const hint=document.getElementById("cvhint");
  if(!hist||!hist.length){if(hint)hint.textContent="Pas encore d\u2019historique.";return}
  const pts=hist.slice(0,168).reverse();
  const reds=pts.map(x=>((x.stats||{}).byColor||{}).red||0);
  const orgs=pts.map(x=>((x.stats||{}).byColor||{}).orange||0);
  const dpr=window.devicePixelRatio||1,W=cv.clientWidth,H=cv.clientHeight;
  cv.width=W*dpr;cv.height=H*dpr;
  const ctx=cv.getContext("2d");ctx.scale(dpr,dpr);
  const mx=Math.max(1,Math.max.apply(null,reds),Math.max.apply(null,orgs));
  const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  const line=(arr,col)=>{ctx.beginPath();
    arr.forEach((v,i)=>{const x=arr.length>1?i/(arr.length-1)*W:0,y=H-4-(v/mx)*(H-10);
      if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y)});
    ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke()};
  line(orgs,css("--org"));line(reds,css("--red"));
  if(hint)hint.textContent=pts.length+" relev\xE9s horaires \xB7 pic: "+mx+" \xB7 maintenant: "+reds[reds.length-1]+" rouge / "+orgs[orgs.length-1]+" orange";
}
async function refreshPipeline(){
  const b=document.getElementById("btnRefresh");b.disabled=true;b.textContent="\u23F3 Collecte en cours\u2026";
  try{
    const r=await fetch("/v1/admin/refresh",{method:"POST",headers:{authorization:"Bearer "+KEY}});
    const j=await r.json().catch(()=>({}));
    b.textContent=r.ok?"\u2713 Collect\xE9 ("+((j.byColor&&j.byColor.red)||0)+" rouge, "+(j.errors||0)+" erreurs)":"\xC9chec "+r.status;
  }catch(e){b.textContent="\xC9chec r\xE9seau"}
  setTimeout(function(){b.disabled=false;boot()},1400);
}
// ---- \u{1F680} Version ----
async function ghReleases(){
  // Fetched browser-side (the Worker cannot reach GitHub) and cached 10 min
  // so the 60s auto-refresh never trips the unauthenticated API rate limit.
  if(GH.data&&Date.now()-GH.at<600000)return GH.data;
  try{const r=await fetch("https://api.github.com/repos/MzrIslem/RadBalek/releases?per_page=10");
    if(!r.ok)throw 0;GH={at:Date.now(),data:await r.json()};return GH.data}catch(e){return GH.data}
}
function paintVersion(o,rels){
  document.getElementById("subline").textContent="Publier ici met \xE0 jour la banni\xE8re de mise \xE0 jour dans l\u2019app (d\xE9lai ~15 min, cache edge).";
  const al=o.appLatest||{};
  const sum=r=>(r.assets||[]).reduce(function(x,a){return x+(a.download_count||0)},0);
  const dl=(rels||[]).reduce(function(s,r){return s+sum(r)},0);
  document.getElementById("stats").innerHTML=
    '<span class="pill">\u{1F4F1} banni\xE8re: <b>'+esc(al.version||"\u2014")+"</b></span>"+
    '<span class="pill">\u2B07\uFE0F t\xE9l\xE9chargements GitHub: <b>'+(rels?dl:"\u2013")+"</b></span>";
  const rows=(rels||[]).map(function(r){
    return '<div style="margin-top:8px"><div class="t1" style="font-size:13px">'+esc(r.tag_name)+
      (r.prerelease?' <span class="st s-auto-ok" style="margin:0">pre</span>':"")+
      '</div><div class="t2">'+new Date(r.published_at).toLocaleDateString("fr")+" \xB7 \u2B07\uFE0F "+sum(r)+
      ((r.assets||[]).length?" \u2014 "+(r.assets||[]).map(function(a){return esc(a.name)+" ("+(a.download_count||0)+")"}).join(", "):"")+
      "</div></div>"}).join("")
    ||'<div class="t2" style="margin-top:6px">GitHub indisponible (limite API ?) \u2014 r\xE9essayez dans quelques minutes.</div>';
  document.getElementById("list").innerHTML=
    '<div class="card"><div class="t1">\u{1F680} Publier une version (banni\xE8re in-app)</div>'+
    '<label>Version (x.y.z)</label><input id="v_version" value="'+attr(al.version||"")+'" placeholder="0.9.8">'+
    '<label>Tag GitHub</label><input id="v_tag" value="'+attr(al.tag||"")+'" placeholder="v0.9.8-beta">'+
    '<label>Lien APK (https)</label><input id="v_apk" value="'+attr(al.apk||"")+'">'+
    '<label>Page de la release (https)</label><input id="v_url" value="'+attr(al.url||"")+'">'+
    '<label>Notes (optionnel)</label><input id="v_notes" value="'+attr(al.notes||"")+'">'+
    '<div class="acts"><button class="ok" onclick="publishVersion()">\u{1F4E4} Publier</button></div>'+
    '<div class="t2" id="vmsg" style="margin-top:7px">'+(al.at?"Derni\xE8re publication: "+ago(al.at):"")+"</div></div>"+
    '<div class="card"><div class="t1">\u{1F4E6} Releases GitHub (MzrIslem/RadBalek)</div>'+rows+"</div>";
}
async function publishVersion(){
  const v=function(id){return document.getElementById(id).value.trim()};
  const body={version:v("v_version"),tag:v("v_tag"),apk:v("v_apk"),url:v("v_url"),notes:v("v_notes")};
  const m=document.getElementById("vmsg");m.textContent="\u23F3 Publication\u2026";
  try{
    const r=await fetch("/v1/admin/app-latest",{method:"POST",
      headers:{"content-type":"application/json",authorization:"Bearer "+KEY},
      body:JSON.stringify(body)});
    const j=await r.json().catch(()=>({}));
    m.textContent=r.ok?"\u2713 Publi\xE9 \u2014 les apps verront la mise \xE0 jour sous ~15 min.":"\xC9chec: "+(j.error||r.status);
  }catch(e){m.textContent="\xC9chec r\xE9seau"}
}
// ---- \u{1F4AC} Avis ----
function paintFb(items){
  document.getElementById("subline").textContent="Avis, bugs et id\xE9es envoy\xE9s depuis l\u2019app.";
  const stars=n=>n?("\u2605".repeat(n)+"\u2606".repeat(5-n)):"";
  const avg=items.filter(f=>f.rating).reduce((s,f,_,a)=>s+f.rating/a.length,0);
  document.getElementById("stats").innerHTML=
    '<span class="pill">\u{1F4AC} <b>'+items.length+'</b> avis</span>'+
    (avg?'<span class="pill">\u2B50 moyenne <b>'+avg.toFixed(1)+'</b>/5</span>':"")+
    '<span class="pill">\u{1F41E} <b>'+items.filter(f=>f.type==="bug").length+'</b> \xB7 \u{1F4A1} <b>'+items.filter(f=>f.type==="idea").length+'</b></span>';
  document.getElementById("list").innerHTML=items.map(f=>
    '<div class="card"><div class="row"><div class="tx">'+
    '<div class="t1">'+(FBT[f.type]||f.type)+(f.rating?' \u2014 <span style="color:#e2a500">'+stars(f.rating)+'</span>':"")+'</div>'+
    '<div class="t2">'+new Date(f.at).toLocaleString("fr")+(f.version?' \xB7 v'+f.version:"")+(f.lang?' \xB7 '+f.lang:"")+
    (f.text?'<br>\xAB '+esc(f.text)+' \xBB':"")+'</div>'+
    '</div></div></div>').join("")||'<p class="sub">Aucun avis pour le moment.</p>';
}
// ---- \u{1F4CB} Signalements ----
function paint(reports,snap,push){
  document.getElementById("subline").textContent="V\xE9rifier = badge \xAB v\xE9rifi\xE9 \xBB public \xB7 Rejeter = masqu\xE9. Gemini pr\xE9-trie (auto-ok / flagged) quand la cl\xE9 est configur\xE9e.";
  const by={};reports.forEach(r=>by[r.status]=(by[r.status]||0)+1);
  const bc=snap&&snap.stats?snap.stats.byColor:{};
  document.getElementById("stats").innerHTML=
    '<span class="pill">\u{1F534} <b>'+(bc.red||0)+'</b></span><span class="pill">\u{1F7E0} <b>'+(bc.orange||0)+'</b></span>'+
    '<span class="pill">\u{1F4E8} push: <b>'+(push?(push.sent??"\u2013"):"\u2013")+'</b> env \xB7 <b>'+(push?(push.deduped??"\u2013"):"\u2013")+'</b> d\xE9dup</span>'+
    '<span class="pill">\u{1F4CB} <b>'+reports.length+'</b> signalements \xB7 \xE0 traiter: <b>'+((by["new"]||0)+(by["flagged"]||0)+(by["auto-ok"]||0)+(by["community-confirmed"]||0))+'</b></span>';
  const order={"flagged":0,"new":1,"community-confirmed":2,"auto-ok":3,"verified":4,"rejected":5};
  reports.sort((a,b)=>(order[a.status]??9)-(order[b.status]??9)||(a.at<b.at?1:-1));
  document.getElementById("list").innerHTML=reports.map(r=>
    '<div class="card"><div class="row"><div class="tx">'+
    '<div class="t1">'+(CATS[r.category]||r.category)+' \u2014 '+(NAMES[r.wilaya]||("W"+(r.wilaya||"?")))+'</div>'+
    '<div class="t2">'+new Date(r.at).toLocaleString("fr")+(r.lat?' \xB7 '+r.lat.toFixed(3)+","+r.lon.toFixed(3):"")+
    (r.description?'<br>\xAB '+r.description.replace(/</g,"&lt;")+' \xBB':"")+
    ' \xB7 \u{1F44D} '+(r.confirms||0)+'</div>'+
    '<span class="st s-'+r.status+'">'+r.status+'</span>'+
    ((r.status!=="verified"&&r.status!=="rejected")?
      '<div class="acts"><button class="ok" onclick="mod(\\''+r.id+'\\',\\'verified\\')">\u2713 V\xE9rifier</button>'+
      '<button class="no" onclick="mod(\\''+r.id+'\\',\\'rejected\\')">\u2715 Rejeter</button></div>':"")+
    '</div></div></div>').join("")||'<p class="sub">Aucun signalement.</p>';
}
async function mod(id,status){
  const r=await fetch("/v1/admin/moderate",{method:"POST",
    headers:{"content-type":"application/json",authorization:"Bearer "+KEY},
    body:JSON.stringify({id:id,status:status})});
  if(r.ok)boot();else alert("\xC9chec: "+r.status);
}
boot();
setInterval(boot,60000);
<\/script></body></html>`;

// src/fwi.js
var DMC_DAY_LENGTH = [6.5, 7.5, 9, 12.8, 13.9, 13.9, 12.4, 10.9, 9.4, 8, 7, 6];
var DC_DAY_LENGTH = [-1.6, -1.6, -1.6, 0.9, 3.8, 5.8, 6.4, 5, 2.4, 0.4, -1.6, -1.6];
var FWI_STARTUP = { ffmc: 85, dmc: 6, dc: 15 };
function fwiStep({ t, h, w, p, month }, prev = FWI_STARTUP) {
  t = Number.isFinite(t) ? t : 15;
  h = Number.isFinite(h) ? Math.min(100, Math.max(1, h)) : 50;
  w = Number.isFinite(w) ? Math.max(0, w) : 5;
  p = Number.isFinite(p) ? Math.max(0, p) : 0;
  const li = Math.min(11, Math.max(0, (month || 1) - 1));
  let mo = 147.2 * (101 - prev.ffmc) / (59.5 + prev.ffmc);
  if (p > 0.5) {
    const rf = p - 0.5;
    const base = 42.5 * rf * Math.exp(-100 / (251 - mo)) * (1 - Math.exp(-6.93 / rf));
    mo = mo > 150 ? mo + base + 15e-4 * (mo - 150) ** 2 * Math.sqrt(rf) : mo + base;
    if (mo > 250) mo = 250;
  }
  const ed = 0.942 * h ** 0.679 + 11 * Math.exp((h - 100) / 10) + 0.18 * (21.1 - t) * (1 - Math.exp(-0.115 * h));
  let m;
  if (mo > ed) {
    const ko = 0.424 * (1 - (h / 100) ** 1.7) + 0.0694 * Math.sqrt(w) * (1 - (h / 100) ** 8);
    m = ed + (mo - ed) * 10 ** -(ko * 0.581 * Math.exp(0.0365 * t));
  } else {
    const ew = 0.618 * h ** 0.753 + 10 * Math.exp((h - 100) / 10) + 0.18 * (21.1 - t) * (1 - Math.exp(-0.115 * h));
    if (mo < ew) {
      const kl = 0.424 * (1 - ((100 - h) / 100) ** 1.7) + 0.0694 * Math.sqrt(w) * (1 - ((100 - h) / 100) ** 8);
      m = ew - (ew - mo) * 10 ** -(kl * 0.581 * Math.exp(0.0365 * t));
    } else {
      m = mo;
    }
  }
  let ffmc = 59.5 * (250 - m) / (147.2 + m);
  ffmc = Math.min(101, Math.max(0, ffmc));
  const td = Math.max(t, -1.1);
  const rk = 1.894 * (td + 1.1) * (100 - h) * DMC_DAY_LENGTH[li] * 1e-4;
  let dmc;
  if (p > 1.5) {
    const re = 0.92 * p - 1.27;
    const m0 = 20 + Math.exp(5.6348 - prev.dmc / 43.43);
    let b;
    if (prev.dmc <= 33) b = 100 / (0.5 + 0.3 * prev.dmc);
    else if (prev.dmc <= 65) b = 14 - 1.3 * Math.log(prev.dmc);
    else b = 6.2 * Math.log(prev.dmc) - 17.2;
    const mr = m0 + 1e3 * re / (48.77 + b * re);
    dmc = Math.max(244.72 - 43.43 * Math.log(Math.max(mr - 20, 1e-6)), 0) + rk;
  } else {
    dmc = prev.dmc + rk;
  }
  if (!Number.isFinite(dmc) || dmc < 0) dmc = 0;
  const tc = Math.max(t, -2.8);
  let pe = (0.36 * (tc + 2.8) + DC_DAY_LENGTH[li]) / 2;
  if (pe < 0) pe = 0;
  let dc;
  if (p > 2.8) {
    const rd = 0.83 * p - 1.27;
    const qo = 800 * Math.exp(-prev.dc / 400);
    const qr = qo + 3.937 * rd;
    dc = Math.max(400 * Math.log(800 / Math.max(qr, 1e-6)), 0) + pe;
  } else {
    dc = prev.dc + pe;
  }
  if (!Number.isFinite(dc) || dc < 0) dc = 0;
  const fW = Math.exp(0.05039 * w);
  const fF = 91.9 * Math.exp(-0.1386 * m) * (1 + m ** 5.31 / 493e5);
  const isi = 0.208 * fW * fF;
  let bui;
  if (dmc <= 0.4 * dc) {
    bui = 0.8 * dmc * dc / (dmc + 0.4 * dc || 1e-6);
  } else {
    bui = dmc - (1 - 0.8 * dc / (dmc + 0.4 * dc || 1e-6)) * (0.92 + (0.0114 * dmc) ** 1.7);
  }
  if (!Number.isFinite(bui) || bui < 0) bui = 0;
  const fD = bui <= 80 ? 0.626 * bui ** 0.809 + 2 : 1e3 / (25 + 108.64 * Math.exp(-0.023 * bui));
  const bb = 0.1 * isi * fD;
  let fwi = bb > 1 ? Math.exp(2.72 * (0.434 * Math.log(bb)) ** 0.647) : bb;
  if (!Number.isFinite(fwi) || fwi < 0) fwi = 0;
  return { ffmc, dmc, dc, isi, bui, fwi };
}
__name(fwiStep, "fwiStep");
function fwiClass(fwi) {
  if (!Number.isFinite(fwi)) return null;
  if (fwi < 11.2) return "low";
  if (fwi < 21.3) return "moderate";
  if (fwi < 38) return "high";
  if (fwi < 50) return "veryHigh";
  if (fwi < 70) return "extreme";
  return "veryExtreme";
}
__name(fwiClass, "fwiClass");
function fwiSeries(days, from = 0) {
  let prev = { ...FWI_STARTUP };
  const out = [];
  for (let i = 0; i < days.length; i++) {
    const r = fwiStep(days[i], prev);
    prev = { ffmc: r.ffmc, dmc: r.dmc, dc: r.dc };
    if (i >= from) out.push({ fwi: Math.round(r.fwi * 10) / 10, class: fwiClass(r.fwi) });
  }
  return out;
}
__name(fwiSeries, "fwiSeries");

// src/weather.js
var FWI_SPINUP_DAYS = 14;
async function handleWeather(env, geo) {
  const cached = await env.EWS_KV.get("weather");
  if (cached)
    return new Response(cached, {
      headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "public, max-age=300" }
    });
  const cents = [];
  for (const f of geo.features) {
    const g = f.geometry;
    const rings = g.type === "Polygon" ? [g.coordinates] : g.coordinates;
    let mnLo = 99, mnLa = 99, mxLo = -99, mxLa = -99;
    for (const poly of rings)
      for (const [lo, la] of poly[0]) {
        if (lo < mnLo) mnLo = lo;
        if (la < mnLa) mnLa = la;
        if (lo > mxLo) mxLo = lo;
        if (la > mxLa) mxLa = la;
      }
    cents.push({ code: f.properties.code, lat: (mnLa + mxLa) / 2, lon: (mnLo + mxLo) / 2 });
  }
  const lats = cents.map((c) => c.lat.toFixed(3)).join(",");
  const lons = cents.map((c) => c.lon.toFixed(3)).join(",");
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,apparent_temperature&daily=apparent_temperature_max,temperature_2m_max,relative_humidity_2m_min,wind_speed_10m_max,precipitation_sum&past_days=${FWI_SPINUP_DAYS}&forecast_days=3&timezone=UTC`;
  const aqUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lats}&longitude=${lons}&current=european_aqi,pm2_5,pm10&timezone=UTC`;
  const [res, aqRes] = await Promise.all([
    fetch(url, { headers: { "user-agent": "radbalek/0.1" } }),
    fetch(aqUrl, { headers: { "user-agent": "radbalek/0.1" } }).catch(() => null)
  ]);
  if (!res.ok) return new Response('{"error":"upstream"}', { status: 502, headers: { "access-control-allow-origin": "*" } });
  let data;
  try {
    data = await res.json();
  } catch {
    return new Response('{"error":"upstream body"}', { status: 502, headers: { "access-control-allow-origin": "*" } });
  }
  const arr = Array.isArray(data) ? data : [data];
  let aqArr = [];
  try {
    if (aqRes && aqRes.ok) {
      const aq = await aqRes.json();
      aqArr = Array.isArray(aq) ? aq : [aq];
    }
  } catch {
  }
  const aqBand = /* @__PURE__ */ __name((v) => v == null ? null : v <= 20 ? "good" : v <= 40 ? "fair" : v <= 60 ? "moderate" : v <= 80 ? "poor" : "veryPoor", "aqBand");
  const riskOf = /* @__PURE__ */ __name((feels) => feels == null ? null : feels >= 45 ? "extreme" : feels >= 40 ? "high" : feels >= 35 ? "moderate" : "low", "riskOf");
  const out = {
    at: (/* @__PURE__ */ new Date()).toISOString(),
    source: "Open-Meteo.com",
    wilayas: cents.map((c, i) => {
      const cur = arr[i]?.current || {};
      const daily = arr[i]?.daily || {};
      const dmax = daily.apparent_temperature_max || [];
      const P = FWI_SPINUP_DAYS;
      const today = dmax[P] ?? null;
      const d1 = dmax[P + 1] ?? null;
      const d2 = dmax[P + 2] ?? null;
      const next48 = d1 != null && d2 != null ? Math.max(d1, d2) : d1 ?? today;
      let trend = "flat";
      if (today != null && next48 != null) trend = next48 > today + 2 ? "up" : next48 < today - 2 ? "down" : "flat";
      let fire = null;
      try {
        const times = daily.time || [];
        const series = times.map((d, j) => ({
          t: daily.temperature_2m_max?.[j],
          h: daily.relative_humidity_2m_min?.[j],
          w: daily.wind_speed_10m_max?.[j],
          p: daily.precipitation_sum?.[j],
          month: Number(String(d).slice(5, 7)) || 1
        }));
        if (series.length > P) {
          const r = fwiSeries(series, P);
          const fuel = c.lat >= 34.5 ? "forest" : c.lat >= 32.5 ? "steppe" : "desert";
          if (r[0]) fire = { fwi: r[0].fwi, class: r[0].class, d1: r[1] ?? null, d2: r[2] ?? null, fuel };
        }
      } catch {
      }
      return {
        code: c.code,
        t: cur.temperature_2m ?? null,
        feels: cur.apparent_temperature ?? null,
        rh: cur.relative_humidity_2m ?? null,
        wind: cur.wind_speed_10m ?? null,
        f: { today, peak48: next48, trend, risk: riskOf(Math.max(today ?? -99, next48 ?? -99)) },
        fire,
        aq: (() => {
          const c2 = aqArr[i]?.current;
          if (!c2) return null;
          return { aqi: c2.european_aqi ?? null, pm25: c2.pm2_5 ?? null, pm10: c2.pm10 ?? null, band: aqBand(c2.european_aqi) };
        })()
      };
    })
  };
  const body = JSON.stringify(out);
  try {
    await env.EWS_KV.put("weather", body, { expirationTtl: 1800 });
  } catch {
  }
  return new Response(body, {
    headers: { "content-type": "application/json; charset=utf-8", "access-control-allow-origin": "*", "cache-control": "public, max-age=300" }
  });
}
__name(handleWeather, "handleWeather");

// src/watchdog.js
var ADMIN_TOPIC = "admin";
var COOLDOWN_S = 3600;
var STALE_MS = 35 * 60 * 1e3;
async function notifyAdmin(env, kind, title, body) {
  if (!env.FIREBASE_SA) return false;
  const flag = `wd:${kind}`;
  try {
    if (await env.EWS_KV.get(flag)) return false;
  } catch {
    return false;
  }
  try {
    const sa = JSON.parse(env.FIREBASE_SA);
    const at = await getAccessToken(sa, env);
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: "POST",
      headers: { authorization: `Bearer ${at}`, "content-type": "application/json" },
      body: JSON.stringify({
        message: {
          topic: ADMIN_TOPIC,
          notification: { title, body: String(body).slice(0, 200) },
          // Audible but NOT the red siren — a backend outage is urgent for the
          // maintainer, it is not a civil emergency.
          android: { priority: "HIGH", notification: { channel_id: "orange_s2" } },
          data: { kind: "admin", watchdog: String(kind) }
        }
      })
    });
    if (!res.ok) return false;
    try {
      await env.EWS_KV.put(flag, "1", { expirationTtl: COOLDOWN_S });
    } catch {
    }
    return true;
  } catch {
    return false;
  }
}
__name(notifyAdmin, "notifyAdmin");
async function watchPipeline(env, snap, pushSummary) {
  try {
    const errors = snap.errors || [];
    const names = errors.map((e) => e.source);
    if (names.includes("onm")) {
      const e = errors.find((x) => x.source === "onm");
      await notifyAdmin(
        env,
        "onm",
        "\u26A0\uFE0F Rad Balek \u2014 ONM en panne",
        `La source officielle ONM \xE9choue : ${e && e.error ? e.error : "erreur inconnue"}`
      );
    } else if (names.length >= 4) {
      await notifyAdmin(
        env,
        "sources",
        "\u26A0\uFE0F Rad Balek \u2014 sources en panne",
        `${names.length}/7 sources \xE9chouent : ${names.join(", ")}`
      );
    }
    if (pushSummary && (pushSummary.fatal || !pushSummary.sent && (pushSummary.errors || []).length >= 3)) {
      await notifyAdmin(
        env,
        "push",
        "\u{1F534} Rad Balek \u2014 envoi des alertes en panne",
        pushSummary.fatal || `0 envoy\xE9, ${(pushSummary.errors || []).length} erreurs : ${JSON.stringify((pushSummary.errors || []).slice(0, 2))}`
      );
    }
    if (snap.stats && snap.stats.onmEntries > 0 && snap.stats.activeAlerts === 0) {
      await notifyAdmin(
        env,
        "parse",
        "\u26A0\uFE0F Rad Balek \u2014 flux ONM illisible",
        `${snap.stats.onmEntries} entr\xE9es, 0 alerte active \u2014 le parsing a d\xE9riv\xE9.`
      );
    }
  } catch {
  }
}
__name(watchPipeline, "watchPipeline");
async function watchStale(env, generatedAt) {
  try {
    const age = Date.now() - Date.parse(generatedAt);
    if (!(age > STALE_MS)) return;
    await notifyAdmin(
      env,
      "stale",
      "\u{1F534} Rad Balek \u2014 collecte arr\xEAt\xE9e",
      `Aucune collecte depuis ${Math.round(age / 6e4)} min : le cron ne tourne plus.`
    );
  } catch {
  }
}
__name(watchStale, "watchStale");

// worker.js
var worker_default = {
  async scheduled(_event, env, ctx) {
    ctx.waitUntil(refresh(env, true));
  },
  async fetch(req, env, ctx) {
    const url = new URL(req.url);
    const path = url.pathname;
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders() });
    if (path === "/healthz") return new Response("ok");
    const CACHE_TTL = {
      "/v1/alerts.json": 120,
      // Edge caches are PER-COLO: Algerian traffic spreads over several POPs,
      // so each TTL miss costs a list+N-gets per colo. 600/1800 keeps the
      // read/list fan-out inside the free quota even from 3-4 colos.
      "/v1/reports.json": 600,
      "/v1/reports.csv": 1800,
      // 1 list + up to 1000 gets — must be cached hard
      "/v1/history.json": 300,
      // kills the 168-get burst per history open
      "/v1/weather.json": 600,
      // NOTE: /v1/fwi.png and /v1/burnt.png are intentionally NOT edge-cached.
      // MapServer returns errors as 200 + HTML, and an edge-cached error page
      // can't be purged on workers.dev — it froze the fire-risk layer for a
      // day. Their handler validates the PNG and serves from KV (daily) instead.
      "/v1/app.json": 900
    };
    const cacheable = req.method === "GET" && CACHE_TTL[path];
    const cacheKey = (() => {
      const keep = new URLSearchParams();
      if (url.searchParams.get("lite")) keep.set("lite", "1");
      const lim = url.searchParams.get("limit");
      if (lim && /^\d{1,3}$/.test(lim)) keep.set("limit", lim);
      const q = keep.toString();
      return `https://c${path}${q ? "?" + q : ""}`;
    })();
    if (cacheable) {
      const hit = await caches.default.match(cacheKey);
      if (hit) return hit;
    }
    const store = /* @__PURE__ */ __name((resp) => {
      if (cacheable && resp.status === 200) {
        const copy = new Response(resp.clone().body, resp);
        copy.headers.set("cache-control", `public, max-age=${CACHE_TTL[path]}`);
        ctx.waitUntil(caches.default.put(cacheKey, copy));
      }
      return resp;
    }, "store");
    if (path === "/v1/alerts.json") {
      let body = await env.EWS_KV.get("latest");
      if (!body) {
        try {
          const snap = await refresh(env);
          body = JSON.stringify(snap);
        } catch (err) {
          return new Response("refresh failed: " + err.message, { status: 500, headers: corsHeaders() });
        }
      }
      const gen = /"generatedAt":"([^"]+)"/.exec(body);
      if (gen) ctx.waitUntil(watchStale(env, gen[1]));
      if (url.searchParams.get("lite")) body = liteSnapshot(body);
      return store(new Response(body, {
        headers: corsHeaders({
          "content-type": "application/json; charset=utf-8",
          "cache-control": "public, max-age=120"
        })
      }));
    }
    if (path === "/v1/reports" && req.method === "POST") {
      const resp = await handleCreateReport(req, env, wilayas_default);
      if (resp.status === 201 && env.GEMINI_API_KEY) {
        const created = await resp.clone().json();
        ctx.waitUntil(triageReport(env, created.report));
      }
      return resp;
    }
    if (path === "/admin")
      return new Response(ADMIN_HTML, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
    if (path === "/v1/admin/reports") return handleAdminList(req, url, env);
    if (path === "/v1/admin/moderate" && req.method === "POST") return handleModerate(req, url, env);
    if (path === "/v1/admin/overview") return handleAdminOverview(req, url, env);
    if (path === "/v1/admin/app-latest" && req.method === "POST") return handleAdminAppLatest(req, url, env);
    if (path === "/v1/admin/refresh" && req.method === "POST") {
      if (!await adminAuthed(req, url, env))
        return new Response(JSON.stringify({ error: "forbidden" }), {
          status: 403,
          headers: corsHeaders({ "content-type": "application/json; charset=utf-8" })
        });
      try {
        const snap = await refresh(env);
        return new Response(
          JSON.stringify({ ok: true, generatedAt: snap.generatedAt, byColor: snap.stats.byColor, errors: snap.errors.length }),
          { headers: corsHeaders({ "content-type": "application/json; charset=utf-8" }) }
        );
      } catch (err) {
        return new Response(JSON.stringify({ error: String(err && err.message) }), {
          status: 500,
          headers: corsHeaders({ "content-type": "application/json; charset=utf-8" })
        });
      }
    }
    if (path === "/v1/test-push" && req.method === "POST") return handleTestPush(req, env, ctx);
    if (path === "/v1/fwi.png" || path === "/v1/burnt.png") {
      const day = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const burnt = path === "/v1/burnt.png";
      const kvKey = burnt ? `burnt:${day}` : `fwi:${day}`;
      const layer = burnt ? "modis.ba" : "mf010.fwi";
      const isPng = /* @__PURE__ */ __name((buf) => {
        if (!buf || buf.byteLength < 8) return false;
        const b = new Uint8Array(buf, 0, 8);
        return b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71;
      }, "isPng");
      let img = await env.EWS_KV.get(kvKey, "arrayBuffer");
      if (!isPng(img)) {
        const r = await fetch(
          `https://maps.effis.emergency.copernicus.eu/effis?service=WMS&version=1.1.1&request=GetMap&layers=${layer}&styles=default${burnt ? "" : `&time=${day}`}&srs=EPSG:4326&bbox=-8.7,18.9,12.0,37.3&width=1024&height=910&format=image/png&transparent=true`,
          { headers: { "user-agent": "radbalek/0.2 (+ews Algeria)", accept: "image/png,*/*" } }
        );
        if (!r.ok) return new Response("effis " + r.status, { status: 502, headers: corsHeaders() });
        const buf = await r.arrayBuffer();
        if (!isPng(buf)) return new Response("effis: non-image response", { status: 502, headers: corsHeaders() });
        img = buf;
        try {
          await env.EWS_KV.put(kvKey, img, { expirationTtl: 86400 });
        } catch {
        }
      }
      return new Response(img, {
        headers: corsHeaders({ "content-type": "image/png", "cache-control": "public, max-age=10800" })
      });
    }
    if (path === "/v1/ai/chat" && req.method === "POST") return handleChat(req, env);
    if (path === "/v1/ai/category" && req.method === "POST") return handleCategory(req, env);
    if (path === "/v1/weather.json") return store(await handleWeather(env, wilayas_default));
    if (path === "/v1/wilayas.json") return handleWilayasList();
    if (path === "/v1/boundaries.json")
      return new Response(JSON.stringify(wilayas_default), {
        headers: corsHeaders({ "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=86400" })
      });
    if (path === "/v1/app.json") {
      const raw = await env.EWS_KV.get("app:latest");
      return store(new Response(raw || "{}", {
        headers: corsHeaders({ "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=900" })
      }));
    }
    if (path === "/v1/feedback" && req.method === "POST") return handleFeedback(req, env);
    if (path === "/v1/reports/confirm" && req.method === "POST") return handleConfirmReport(req, env);
    if (path === "/v1/reports.json") return store(await handleListReports(url, env));
    if (path === "/v1/reports.csv") return store(await handleExportCsv(env));
    if (path === "/v1/push-status.json") {
      const raw = await env.EWS_KV.get("push:last") || '{"neverRan":true}';
      return new Response(raw, {
        headers: corsHeaders({ "content-type": "application/json; charset=utf-8", "cache-control": "no-store" })
      });
    }
    if (path === "/v1/history.json") {
      let body = await env.EWS_KV.get("history:doc");
      if (!body) {
        const listed = await env.EWS_KV.list({ prefix: "s:", limit: 168 });
        const out = [];
        for (const k of listed.keys) {
          const raw = await env.EWS_KV.get(k.name);
          if (raw) out.push(JSON.parse(raw));
        }
        body = JSON.stringify(out);
      }
      return store(new Response(body, {
        headers: corsHeaders({ "content-type": "application/json; charset=utf-8", "cache-control": "public, max-age=300" })
      }));
    }
    return new Response("Rad Balek (\u0631\u062F \u0628\u0627\u0644\u0643) ingest \u2014 /v1/alerts.json /v1/reports.json /v1/history.json", {
      status: 200,
      headers: corsHeaders()
    });
  }
};
async function reconcileFires(env, snap) {
  try {
    const fires = (snap.incidents || []).filter((i) => i.source === "firms");
    if (!snap.stats.firmsSkipped) {
      try {
        const body = JSON.stringify(fires);
        let prev = null;
        try {
          prev = JSON.stringify(JSON.parse(await env.EWS_KV.get("firms:last") || "{}").fires ?? null);
        } catch {
        }
        if (body !== prev) await env.EWS_KV.put("firms:last", JSON.stringify({ at: snap.generatedAt, fires }));
      } catch {
      }
      return;
    }
    const raw = await env.EWS_KV.get("firms:last");
    if (!raw) return;
    const cached = JSON.parse(raw);
    const fresh = Date.parse(snap.generatedAt) - Date.parse(cached.at) < 3 * 3600 * 1e3;
    if (!fresh || !cached.fires || !cached.fires.length) return;
    for (const f of cached.fires) f.stale = true;
    snap.incidents.push(...cached.fires);
    snap.stats.fireClusters = cached.fires.length;
    snap.stats.incidents = snap.incidents.length;
    snap.stats.firmsFromCache = true;
  } catch {
  }
}
__name(reconcileFires, "reconcileFires");
async function refresh(env, doPush = false) {
  const snap = await runPipeline({
    firmsMapKey: env.FIRMS_MAP_KEY || null,
    wilayasGeojson: wilayas_default
  });
  await reconcileFires(env, snap);
  try {
    await env.EWS_KV.put("latest", JSON.stringify(snap));
  } catch {
  }
  if (!doPush) return snap;
  const now = new Date(snap.generatedAt);
  try {
    const pushSummary = await sendPush(env, snap.notifications, snap.alerts, snap.errors, snap.stats.onmEntries);
    const eventful = pushSummary.sent || pushSummary.heartbeats || pushSummary.allclear || (pushSummary.errors || []).length;
    if (eventful || now.getUTCMinutes() < 10) {
      try {
        await env.EWS_KV.put("push:last", JSON.stringify({ at: snap.generatedAt, ...pushSummary }));
      } catch {
      }
    }
    await watchPipeline(env, snap, pushSummary);
  } catch (err) {
    try {
      await env.EWS_KV.put("push:last", JSON.stringify({ at: snap.generatedAt, fatal: String(err.message) }));
    } catch {
    }
    await watchPipeline(env, snap, { fatal: String(err.message) });
  }
  try {
    if (now.getUTCMinutes() < 10) {
      const inv = String(1e13 - now.getTime()).padStart(14, "0");
      const entry = { at: snap.generatedAt, stats: snap.stats, reds: snap.alerts.filter((a) => a.color === "red").map((a) => ({ hazard: a.hazard, wilayas: a.wilayas.map((w) => w.code) })) };
      try {
        await env.EWS_KV.put(`s:${inv}`, JSON.stringify(entry), { expirationTtl: 60 * 60 * 24 * 365 });
      } catch {
      }
      try {
        const doc = JSON.parse(await env.EWS_KV.get("history:doc") || "[]");
        if (!doc.length || doc[0].at !== entry.at) doc.unshift(entry);
        await env.EWS_KV.put("history:doc", JSON.stringify(doc.slice(0, 168)), { expirationTtl: 60 * 60 * 24 * 30 });
      } catch {
      }
    }
  } catch {
  }
  return snap;
}
__name(refresh, "refresh");
export {
  worker_default as default
};
//# sourceMappingURL=worker.js.map
