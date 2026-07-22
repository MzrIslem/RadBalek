// Unified, CAP-aligned alert model + trilingual headlines + FCM topic names.
//
// Two classes of information, kept apart on purpose:
//   alerts    -> official (ONM) : may notify loudly
//   incidents -> observations (FIRMS satellite, DGPC Telegram) : map pins,
//                silent by default, promoted only by curation rules.

const SEVERITY_COLOR = { Moderate: "yellow", Severe: "orange", Extreme: "red" }; // ONM ladder 1/2/3

const HAZARD_LABELS = {
  heat: { fr: "Canicule", en: "Heat wave", ar: "موجة حر" },
  storm: { fr: "Orages", en: "Thunderstorms", ar: "عواصف رعدية" },
  wind: { fr: "Vent fort", en: "Strong wind", ar: "رياح قوية" },
  sandstorm: { fr: "Tempête de sable", en: "Sandstorm", ar: "عاصفة رملية" },
  flood: { fr: "Pluies/Inondations", en: "Rain/Flooding", ar: "أمطار وفيضانات" },
  cold: { fr: "Froid/Neige", en: "Cold/Snow", ar: "برد وثلوج" },
  fire: { fr: "Feu de forêt", en: "Wildfire", ar: "حريق غابة" },
  road: { fr: "Danger routier", en: "Road hazard", ar: "خطر على الطريق" },
  other: { fr: "Alerte", en: "Alert", ar: "تنبيه" },
};

const SEVERITY_LABELS = {
  yellow: { fr: "vigilance jaune", en: "yellow alert", ar: "تحذير أصفر" },
  orange: { fr: "vigilance orange", en: "orange alert", ar: "تحذير برتقالي" },
  red: { fr: "vigilance rouge", en: "red alert", ar: "تحذير أحمر" },
};

export function severityColor(severity) {
  return SEVERITY_COLOR[severity] || "yellow";
}

export function normalizeOnm(onmAlert) {
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
    sourceName: "Météo Algérie (ONM)",
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
      fr: `${h.fr} — ${s.fr} — ${wFr}`,
      en: `${h.en} — ${s.en} — ${wFr}`,
      ar: `${h.ar} — ${s.ar} — ولاية ${wAr}`,
    },
    link: onmAlert.capUrl,
  };
}

export function normalizeFireCluster(cluster, wilayaProps, { corroborated = false, possibleIndustrial = false } = {}) {
  const w = wilayaProps ? { code: wilayaProps.code, fr: wilayaProps.fr, ar: wilayaProps.ar } : null;
  const where = { fr: w ? w.fr : "Algérie", ar: w ? `ولاية ${w.ar}` : "الجزائر" };
  return {
    corroborated, // DGPC reports ongoing fires in the same wilaya
    possibleIndustrial, // inside a known oil/gas flare basin — likely not a wildfire
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
      fr: `Point chaud satellite (${cluster.count} détections) — ${where.fr}`,
      en: `Satellite hotspot (${cluster.count} detections) — ${where.fr}`,
      ar: `نقطة حرارية عبر الأقمار الصناعية (${cluster.count} رصد) — ${where.ar}`,
    },
  };
}

export function normalizeDgpcIncident(inc, postId, postedAt) {
  const w = inc.wilaya;
  const typeAr = inc.type === "forest" ? "حريق غابة" : "حريق أدغال وأحراش";
  const typeFr = inc.type === "forest" ? "Feu de forêt" : "Feu de broussailles";
  const where = [inc.place, inc.commune].filter(Boolean).join("، ");
  return {
    id: `dgpc:${postId}:${w ? w.code : 0}:${(inc.place || "").slice(0, 24)}`,
    class: "incident",
    source: "dgpc-telegram",
    sourceName: "Protection Civile (Telegram)",
    hazard: "fire",
    status: inc.status, // ongoing | contained | extinguished
    observedAt: postedAt,
    wilayas: w ? [w] : [],
    place: inc.place,
    commune: inc.commune,
    headline: {
      fr: `${typeFr} (${statusFr(inc.status)}) — ${inc.commune || ""}${w ? ", " + w.fr : ""}`,
      en: `${typeFr} (${inc.status}) — ${inc.commune || ""}${w ? ", " + w.fr : ""}`,
      ar: `${typeAr} (${statusAr(inc.status)}) — ${where}${w ? " — ولاية " + w.ar : ""}`,
    },
    textAr: inc.textAr,
  };
}

function statusFr(s) {
  return { ongoing: "en cours", contained: "maîtrisé, sous surveillance", extinguished: "éteint" }[s] || s;
}
function statusAr(s) {
  return { ongoing: "عملية جارية", contained: "تحت الحراسة", extinguished: "أُخمد نهائياً" }[s] || s;
}

// FCM topic naming: w{code}_{hazard}_{color}. The app subscribes per wilaya
// to the hazards the user opted into; red topics are always on for
// subscribed wilayas.
export function fcmTopicsFor(item) {
  if (item.class !== "alert") return [];
  // Yellow is never pushed (in-app only) — emitting its topics put them into
  // the active-topics set, so a yellow EXPIRING sent a "✅ Fin d'alerte" for an
  // alert users were never notified about.
  if (item.color === "yellow") return [];
  return item.wilayas.map((w) => `w${w.code}_${item.hazard}_${item.color}`);
}
