// The 58 wilayas of Algeria: code, French name (as ONM writes them), Arabic name.
// extraFr covers spelling variants seen in official sources (ONM CAP areaDesc is
// uppercase French with hyphens; normalization collapses accents/separators).

export const WILAYAS = [
  { code: 1, fr: "Adrar", ar: "أدرار" },
  { code: 2, fr: "Chlef", ar: "الشلف" },
  { code: 3, fr: "Laghouat", ar: "الأغواط" },
  { code: 4, fr: "Oum El Bouaghi", ar: "أم البواقي", extraFr: ["OUM-EL-BOUAGHI"] },
  { code: 5, fr: "Batna", ar: "باتنة" },
  { code: 6, fr: "Béjaïa", ar: "بجاية", extraFr: ["BEJAIA"] },
  { code: 7, fr: "Biskra", ar: "بسكرة" },
  { code: 8, fr: "Béchar", ar: "بشار", extraFr: ["BECHAR"] },
  { code: 9, fr: "Blida", ar: "البليدة" },
  { code: 10, fr: "Bouira", ar: "البويرة" },
  { code: 11, fr: "Tamanrasset", ar: "تمنراست", extraFr: ["TAMENGHASSET", "TAMANGHASSET", "TAMENRASSET"], extraAr: ["تمنغست"] },
  { code: 12, fr: "Tébessa", ar: "تبسة", extraFr: ["TEBESSA"] },
  { code: 13, fr: "Tlemcen", ar: "تلمسان" },
  { code: 14, fr: "Tiaret", ar: "تيارت" },
  { code: 15, fr: "Tizi Ouzou", ar: "تيزي وزو", extraFr: ["TIZI-OUZOU"] },
  { code: 16, fr: "Alger", ar: "الجزائر", extraFr: ["ALGIERS"], extraAr: ["الجزائر العاصمة"] },
  { code: 17, fr: "Djelfa", ar: "الجلفة" },
  { code: 18, fr: "Jijel", ar: "جيجل" },
  { code: 19, fr: "Sétif", ar: "سطيف", extraFr: ["SETIF"] },
  { code: 20, fr: "Saïda", ar: "سعيدة", extraFr: ["SAIDA"] },
  { code: 21, fr: "Skikda", ar: "سكيكدة" },
  { code: 22, fr: "Sidi Bel Abbès", ar: "سيدي بلعباس", extraFr: ["SIDI-BEL-ABBES"] },
  { code: 23, fr: "Annaba", ar: "عنابة" },
  { code: 24, fr: "Guelma", ar: "قالمة" },
  { code: 25, fr: "Constantine", ar: "قسنطينة" },
  { code: 26, fr: "Médéa", ar: "المدية", extraFr: ["MEDEA"] },
  { code: 27, fr: "Mostaganem", ar: "مستغانم" },
  { code: 28, fr: "M'Sila", ar: "المسيلة", extraFr: ["MSILA"] },
  { code: 29, fr: "Mascara", ar: "معسكر" },
  { code: 30, fr: "Ouargla", ar: "ورقلة", extraFr: ["OUARGLA"], extraAr: ["ورڨلة"] },
  { code: 31, fr: "Oran", ar: "وهران" },
  { code: 32, fr: "El Bayadh", ar: "البيض", extraFr: ["EL-BAYADH"] },
  { code: 33, fr: "Illizi", ar: "إليزي" },
  { code: 34, fr: "Bordj Bou Arreridj", ar: "برج بوعريريج", extraFr: ["BORDJ-BOU-ARRERIDJ", "BBA"] },
  { code: 35, fr: "Boumerdès", ar: "بومرداس", extraFr: ["BOUMERDES"] },
  { code: 36, fr: "El Tarf", ar: "الطارف", extraFr: ["EL-TARF", "EL-TAREF", "ELTAREF"] },
  { code: 37, fr: "Tindouf", ar: "تندوف" },
  { code: 38, fr: "Tissemsilt", ar: "تيسمسيلت" },
  { code: 39, fr: "El Oued", ar: "الوادي", extraFr: ["EL-OUED"] },
  { code: 40, fr: "Khenchela", ar: "خنشلة" },
  { code: 41, fr: "Souk Ahras", ar: "سوق أهراس", extraFr: ["SOUK-AHRAS"] },
  { code: 42, fr: "Tipaza", ar: "تيبازة", extraFr: ["TIPASA"] },
  { code: 43, fr: "Mila", ar: "ميلة" },
  { code: 44, fr: "Aïn Defla", ar: "عين الدفلى", extraFr: ["AIN-DEFLA", "AIN DEFLA"] },
  { code: 45, fr: "Naâma", ar: "النعامة", extraFr: ["NAAMA"] },
  { code: 46, fr: "Aïn Témouchent", ar: "عين تموشنت", extraFr: ["AIN-TEMOUCHENT"] },
  { code: 47, fr: "Ghardaïa", ar: "غرداية", extraFr: ["GHARDAIA"] },
  { code: 48, fr: "Relizane", ar: "غليزان" },
  { code: 49, fr: "Timimoun", ar: "تيميمون", extraFr: ["TIMIMOUNE"] },
  { code: 50, fr: "Bordj Badji Mokhtar", ar: "برج باجي مختار", extraFr: ["BORDJ-BADJI-MOKHTAR"] },
  { code: 51, fr: "Ouled Djellal", ar: "أولاد جلال", extraFr: ["OULED-DJELLAL"] },
  { code: 52, fr: "Béni Abbès", ar: "بني عباس", extraFr: ["BENI-ABBES", "BENI ABBES"] },
  { code: 53, fr: "In Salah", ar: "عين صالح", extraFr: ["IN-SALAH", "AIN SALAH", "AIN-SALAH"] },
  { code: 54, fr: "In Guezzam", ar: "عين قزام", extraFr: ["IN-GUEZZAM", "AIN GUEZZAM", "AIN-GUEZZAM"] },
  { code: 55, fr: "Touggourt", ar: "تقرت", extraAr: ["توقرت", "تڨرت"] },
  { code: 56, fr: "Djanet", ar: "جانت" },
  { code: 57, fr: "El M'Ghair", ar: "المغير", extraFr: ["EL-MGHAIR", "EL-MEGHAIER", "EL MGHAIR"] },
  { code: 58, fr: "El Meniaa", ar: "المنيعة", extraFr: ["EL-MENIAA", "EL-MENEA", "EL GOLEA", "EL-GOLEA", "EL MENIA", "EL-MENIA"] },
];

// Latin normalization: uppercase, strip accents, drop every separator.
export function normFr(s) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

// Arabic normalization: strip tashkeel, unify alef/ya/ta-marbuta forms.
export function normAr(s) {
  return s
    .replace(/[ً-ْٰ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

const frIndex = new Map();
const arNames = []; // [{norm, w}] longest-first so بجاية never shadows برج بوعريريج
for (const w of WILAYAS) {
  frIndex.set(normFr(w.fr), w);
  for (const v of w.extraFr || []) frIndex.set(normFr(v), w);
  arNames.push({ norm: normAr(w.ar), w });
  for (const v of w.extraAr || []) arNames.push({ norm: normAr(v), w });
}
arNames.sort((a, b) => b.norm.length - a.norm.length);

export function wilayaByFr(name) {
  return frIndex.get(normFr(name)) || null;
}

// Finds a wilaya mentioned inside Arabic free text (e.g. "ولاية تيزي وزو").
export function wilayaInArabicText(text) {
  const t = normAr(text);
  for (const { norm, w } of arNames) if (t.includes(norm)) return w;
  return null;
}

export function wilayaByCode(code) {
  return WILAYAS.find((w) => w.code === code) || null;
}

/// Accent-folded lowercase that KEEPS word separators — unlike normFr(), which
/// strips everything to bare letters and makes substring matching unsafe
/// ("Alger" lives inside "Algérie", which pinned a visa article to the capital).
function foldFr(s) {
  return String(s)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/// Every wilaya named in French free text, matched on WORD BOUNDARIES.
/// Used for press headlines and dgpc.dz posts, where a false match becomes a
/// wrong incident pin on the map.
export function wilayasInFrenchText(text, { max = 4 } = {}) {
  const hay = ` ${foldFr(text)} `;
  const found = new Map();
  for (const w of WILAYAS) {
    for (const name of [w.fr, ...(w.extraFr || [])]) {
      const needle = foldFr(name);
      if (needle.length < 4) continue; // too short to be unambiguous
      if (hay.includes(` ${needle} `)) {
        found.set(w.code, { code: w.code, fr: w.fr, ar: w.ar });
        break;
      }
    }
  }
  return [...found.values()].slice(0, max);
}
