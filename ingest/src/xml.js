// Minimal tag extraction for the machine-generated feeds we consume.
// These feeds have fixed shapes; a DOM parser dependency isn't worth it and
// this keeps the module runnable on Cloudflare Workers unchanged.

export function blocks(xml, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "g");
  const out = [];
  let m;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

export function tag(xml, name) {
  const m = xml.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`));
  return m ? decodeEntities(m[1].trim()) : null;
}

export function attr(xml, tagName, attrName) {
  const m = xml.match(new RegExp(`<${tagName}[^>]*\\b${attrName}="([^"]*)"`));
  return m ? decodeEntities(m[1]) : null;
}

// Named entities WordPress emits constantly (dgpc.dz, TSA, Ennahar all do).
const NAMED = {
  nbsp: " ", rsquo: "’", lsquo: "‘", rdquo: "”", ldquo: "“",
  hellip: "…", mdash: "—", ndash: "–", eacute: "é", egrave: "è",
  ecirc: "ê", agrave: "à", acirc: "â", ccedil: "ç", ugrave: "ù", ocirc: "ô",
  icirc: "î", iuml: "ï", euml: "ë", laquo: "«", raquo: "»", deg: "°", euro: "€",
};

export function decodeEntities(s) {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&([a-zA-Z]+);/g, (m, name) => (name in NAMED ? NAMED[name] : m))
    // One malformed numeric entity must not crash decodeEntities:
    // String.fromCodePoint throws RangeError above 0x10FFFF, which used to
    // kill the WHOLE source (tag() calls this on every item). XML also
    // forbids &#0; — fromCodePoint(0) returns a NUL char, so return the raw
    // entity text for it too. Never throw.
    .replace(/&#(\d+);/g, (m, n) => {
      const cp = Number(n);
      if (cp === 0) return m;
      try {
        return String.fromCodePoint(cp);
      } catch {
        return m;
      }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (m, n) => {
      const cp = parseInt(n, 16);
      if (cp === 0) return m;
      try {
        return String.fromCodePoint(cp);
      } catch {
        return m;
      }
    })
    .replace(/&amp;/g, "&");
}

// HTML fragment -> plain text with line breaks preserved.
export function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  )
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
