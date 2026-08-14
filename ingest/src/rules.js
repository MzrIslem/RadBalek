// Text classification: ordered [regex, value] tables, first match wins. The
// tables are domain data and stay with their modules; only the matcher is
// shared.
//
// Order matters and is load-bearing: the DGPC fire *sitrep* pattern must be
// tested before the plain /حريق/ pattern, or every daily bulletin is
// misclassified as an individual fire incident.

// First rule whose regex matches `text`, else `fallback`.
export function matchRule(rules, text, fallback = null) {
  if (!text) return fallback;
  for (const [re, value] of rules) if (re.test(text)) return value;
  return fallback;
}

// Ascending-threshold scale -> band label, for the published cut-offs this
// project must reproduce exactly (EFFIS fire-danger classes, European AQI, heat
// risk). `bands` is [[upperBound, label], ...] plus `top`, the label for
// everything above the last bound.
//
// `inclusive` picks which side the boundary falls on, and is NOT cosmetic: the
// EFFIS classes are published as `fwi < 11.2` while the European AQI bands are
// published as `aqi <= 20`, so a single convention would shift one scale by one
// band at every boundary value.
export function bandOf(bands, value, top, { inclusive = false } = {}) {
  if (!Number.isFinite(value)) return null;
  for (const [bound, label] of bands) if (inclusive ? value <= bound : value < bound) return label;
  return top;
}
