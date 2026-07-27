// Canadian Forest Fire Weather Index (CFFWIS) — the same system EFFIS runs for
// Europe, so our numbers land on EFFIS's published class boundaries instead of
// a home-grown scale.
//
// Van Wagner & Pickett (1985), "Equations and FORTRAN program for the Canadian
// Forest Fire Weather Index System", Canadian Forestry Service Technical Report 33.
//
// Inputs are the standard noon-ish fire-weather observations. Open-Meteo does
// not publish noon values directly, so we use the daily peak-fire-weather
// proxies (max temperature, MIN relative humidity, max wind, 24h precipitation)
// — the conservative choice, since those are the conditions that actually drive
// ignition and spread.
//
// FFMC/DMC/DC are CUMULATIVE: each day's value depends on the previous day's.
// We spin them up over a run of past days from standard startup values, which
// is why weather.js requests past_days.

// Day-length factors (46°N standard table, Jan..Dec). EFFIS applies the same
// standard table across Europe including the Mediterranean.
const DMC_DAY_LENGTH = [6.5, 7.5, 9.0, 12.8, 13.9, 13.9, 12.4, 10.9, 9.4, 8.0, 7.0, 6.0];
const DC_DAY_LENGTH = [-1.6, -1.6, -1.6, 0.9, 3.8, 5.8, 6.4, 5.0, 2.4, 0.4, -1.6, -1.6];

// Standard startup values for a spring/dry-season start (Van Wagner 1987).
export const FWI_STARTUP = { ffmc: 85, dmc: 6, dc: 15 };

/// One day's step. t=°C, h=RH %, w=wind km/h, p=24h precip mm, month=1..12.
/// Returns the new codes plus the derived indices.
export function fwiStep({ t, h, w, p, month }, prev = FWI_STARTUP) {
  // Guard the inputs: a null from upstream must not poison the whole run.
  t = Number.isFinite(t) ? t : 15;
  h = Number.isFinite(h) ? Math.min(100, Math.max(1, h)) : 50;
  w = Number.isFinite(w) ? Math.max(0, w) : 5;
  p = Number.isFinite(p) ? Math.max(0, p) : 0;
  const li = Math.min(11, Math.max(0, (month || 1) - 1));

  // --- Fine Fuel Moisture Code ---
  let mo = (147.2 * (101 - prev.ffmc)) / (59.5 + prev.ffmc);
  if (p > 0.5) {
    const rf = p - 0.5;
    const base = 42.5 * rf * Math.exp(-100 / (251 - mo)) * (1 - Math.exp(-6.93 / rf));
    mo = mo > 150 ? mo + base + 0.0015 * (mo - 150) ** 2 * Math.sqrt(rf) : mo + base;
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
  let ffmc = (59.5 * (250 - m)) / (147.2 + m);
  ffmc = Math.min(101, Math.max(0, ffmc));

  // --- Duff Moisture Code ---
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
    const mr = m0 + (1000 * re) / (48.77 + b * re);
    dmc = Math.max(244.72 - 43.43 * Math.log(Math.max(mr - 20, 1e-6)), 0) + rk;
  } else {
    dmc = prev.dmc + rk;
  }
  if (!Number.isFinite(dmc) || dmc < 0) dmc = 0;

  // --- Drought Code ---
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

  // --- Initial Spread Index ---
  const fW = Math.exp(0.05039 * w);
  const fF = 91.9 * Math.exp(-0.1386 * m) * (1 + m ** 5.31 / 4.93e7);
  const isi = 0.208 * fW * fF;

  // --- Buildup Index ---
  let bui;
  if (dmc <= 0.4 * dc) {
    bui = (0.8 * dmc * dc) / (dmc + 0.4 * dc || 1e-6);
  } else {
    bui = dmc - (1 - (0.8 * dc) / (dmc + 0.4 * dc || 1e-6)) * (0.92 + (0.0114 * dmc) ** 1.7);
  }
  if (!Number.isFinite(bui) || bui < 0) bui = 0;

  // --- Fire Weather Index ---
  const fD = bui <= 80 ? 0.626 * bui ** 0.809 + 2 : 1000 / (25 + 108.64 * Math.exp(-0.023 * bui));
  const bb = 0.1 * isi * fD;
  let fwi = bb > 1 ? Math.exp(2.72 * (0.434 * Math.log(bb)) ** 0.647) : bb;
  if (!Number.isFinite(fwi) || fwi < 0) fwi = 0;

  return { ffmc, dmc, dc, isi, bui, fwi };
}

// EFFIS danger classes — the PUBLISHED boundaries, so "très élevé" means the
// same thing here as on the European fire-danger map.
// https://forest-fire.emergency.copernicus.eu/about-effis/technical-background/fire-danger-forecast
export function fwiClass(fwi) {
  if (!Number.isFinite(fwi)) return null;
  if (fwi < 11.2) return "low";
  if (fwi < 21.3) return "moderate";
  if (fwi < 38.0) return "high";
  if (fwi < 50.0) return "veryHigh";
  if (fwi < 70.0) return "extreme";
  return "veryExtreme";
}

/// Run the cumulative codes across a series of daily observations and return
/// the FWI for each day. `days` is oldest-first; the leading spin-up days exist
/// only to warm up FFMC/DMC/DC and are dropped from the result via `from`.
export function fwiSeries(days, from = 0) {
  let prev = { ...FWI_STARTUP };
  const out = [];
  for (let i = 0; i < days.length; i++) {
    const r = fwiStep(days[i], prev);
    prev = { ffmc: r.ffmc, dmc: r.dmc, dc: r.dc };
    if (i >= from) out.push({ fwi: Math.round(r.fwi * 10) / 10, class: fwiClass(r.fwi) });
  }
  return out;
}
