// Protection Civile Algérienne official Telegram channel (@DGPCDZ).
// We read the public web preview (t.me/s/...) — no auth, no API key.
// Posts are Arabic. The daily wildfire situation reports are structured
// enough to parse with rules; other posts get keyword classification
// (optionally refined by an LLM later in the pipeline).

import { htmlToText, attr } from "./xml.js";
import { wilayaInArabicText, wilayaRef } from "./wilayas.js";
import { matchRule } from "./rules.js";

export const DGPC_CHANNEL = "DGPCDZ";

// Verified public Protection Civile / incident channels. Add wilaya-level
// handles here once confirmed live (t.me/s/<handle> must return posts) —
// guessed handles 302-redirect and are silently skipped below.
export const CHANNELS = ["DGPCDZ"];

async function fetchOne(fetchFn, channel) {
  // redirect:manual so a 302 stays visible: t.me redirects private/nonexistent
  // channels to a landing page that would otherwise parse as "0 posts".
  const res = await fetchFn(`https://t.me/s/${channel}`, {
    headers: { "user-agent": "Mozilla/5.0 (compatible; aisx-ews/0.1)" },
    redirect: "manual",
  });
  if (res.status !== 200) return []; // 302 = private/nonexistent; skip, don't throw
  return parseChannelPage(await res.text(), channel);
}

export async function fetchDgpcPosts(fetchFn = fetch, channels = CHANNELS) {
  const list = Array.isArray(channels) ? channels : [channels];
  const results = await Promise.allSettled(list.map((c) => fetchOne(fetchFn, c)));
  const posts = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  if (!posts.length && list.length === 1) throw new Error(`t.me/s/${list[0]} empty`);
  return posts;
}

export function parseChannelPage(html, channel = DGPC_CHANNEL) {
  const posts = [];
  const re = new RegExp(`data-post="${channel}/(\\d+)"[\\s\\S]*?(?=data-post="${channel}/\\d+"|$)`, "g");
  let m;
  while ((m = re.exec(html))) {
    const block = m[0];
    const textMatch = block.match(/tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/);
    const text = textMatch ? htmlToText(textMatch[1]) : "";
    const datetime = attr(block, "time", "datetime");
    if (!text) continue;
    posts.push(classifyPost({ id: `${channel}/${m[1]}`, postedAt: datetime, text }));
  }
  return posts;
}

const KIND_RULES = [
  [/الحالة العامة لحرائق|حرائق الغطاء النباتي/, "fire-sitrep"],
  [/حريق/, "fire"],
  [/حادث(?:ة)? مرور|حوادث المرور|اصطدام|انحراف.*مركبة/, "road-crash"],
  [/غرق|شاطئ|سباحة/, "drowning"],
  [/اختناق|غاز|تسرب/, "gas"],
  [/زلزال|هزة/, "earthquake"],
  [/موجة حر|ارتفاع درجات الحرارة/, "heat"],
];

function classifyPost(post) {
  const kind = matchRule(KIND_RULES, post.text, "other");
  const out = { ...post, kind, wilaya: null, incidents: [], stats: null };
  out.wilaya = wilayaRef(wilayaInArabicText(post.text));

  if (kind === "fire-sitrep") {
    const parsed = parseFireSitrep(post.text);
    out.incidents = parsed.incidents;
    out.stats = parsed.stats;
  }
  if (kind === "road-crash") out.casualties = extractCasualties(post.text);
  return out;
}

// Daily DGPC vegetation-fire sitrep:
//   status sections marked "العمليات الجارية" / "الحراسة" / "أخمدت نهائيا",
//   wilaya headers "ولاية X", incident bullets "* حريق ... بالمكان المسمى P ببلدية C".
export function parseFireSitrep(text) {
  const incidents = [];
  const stats = {};
  const num = (re) => {
    const m = text.match(re);
    return m ? Number(toWesternDigits(m[1])) : null;
  };
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
      const w = wilayaRef(wilayaInArabicText(wm[0]));
      if (w) wilaya = w;
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

function extractCasualties(text) {
  const t = toWesternDigits(text);
  const dead = (t.match(/(\d+)\s*(?:قتيل|قتلى|وفاة|وفيات|متوفي)/) || [])[1];
  const injured = (t.match(/(\d+)\s*(?:جريح|جرحى|مصاب)/) || [])[1];
  return { dead: dead ? Number(dead) : null, injured: injured ? Number(injured) : null };
}

export function toWesternDigits(s) {
  return s.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}
