# Rad Balek — رد بالك

**Early warning for Algeria: heatwaves, wildfires, floods, earthquakes, storms and road danger.**
Protecting people, vegetation and animals across all 58 wilayas.

> ⚠️ **Not an official government service.** Rad Balek is an independent, community-built
> relay of publicly available data. It does **not** replace official instructions.
> In an emergency, call **Protection Civile: 14 or 1021**.

---

## Why this exists

Algeria has real hazards — deadly summer heatwaves, wildfires that consume forests and
villages, flash floods in the oueds, and seismic risk along the northern fault system.
Official warnings exist, but they are scattered across a weather-bureau website, Telegram
posts and Facebook pages. There is no single app that pushes a life-saving alert to a
citizen's phone and makes it **impossible to sleep through**.

Rad Balek is an attempt to fill that gap.

## What it does

- **Relays official vigilance alerts** (Météo Algérie / ONM) per wilaya, in French and Arabic.
- **Wakes you up for red alerts** — a full-screen alert over the lockscreen with a
  civil-defense siren on the *alarm* stream, so it rings **even in silent mode**, plus a
  spoken announcement in Arabic and French for anyone who can't read the screen.
- **Maps live wildfire hotspots** from NASA FIRMS satellite detections, cross-checked
  against Protection Civile field reports, with detection time and fire intensity.
- **Tracks earthquakes** (EMSC), road incidents, air quality, and 48-hour heat forecasts.
- **Citizen reports** — anyone can report a danger; the community confirms it.
- **One-tap emergency** — 14 / 17 / 1055 and an "I'm safe" (أنا بخير) SMS to family.

## Architecture

```
Data sources ──► Cloudflare Worker (ingest, every 10 min) ──► Flutter app (Android)
                 │                                            │
                 ├─ normalizes to a trilingual snapshot        ├─ FCM topic per wilaya+hazard
                 ├─ dedupes + pushes FCM (red = data-only)     ├─ native siren + lockscreen alert
                 └─ serves /v1/*.json (edge-cached)            └─ offline cache of last snapshot
```

- **`ingest/`** — Cloudflare Worker: fetches sources, normalizes, dedupes, pushes FCM,
  serves the JSON API. Runs on a 10-minute cron.
- **`app/`** — Flutter app (Android). Native Kotlin handles the red-alert siren and the
  full-screen lockscreen alert, because notification-channel sounds are suppressed by
  some OEMs in silent mode.

### Data sources & attribution

| Source | Data | Licence |
|---|---|---|
| Météo Algérie (ONM) | Official vigilance alerts (CAP) | CC BY 4.0 |
| Protection Civile (DGPC) | Field incident reports | Public posts |
| NASA FIRMS | Satellite fire hotspots (VIIRS/MODIS) | Public domain |
| EMSC | Earthquakes | Open |
| Open-Meteo | Temperature, wind, humidity, air quality | CC BY 4.0 |
| Copernicus EFFIS | Fire Weather Index | Copernicus licence |
| OpenStreetMap / CARTO | Map tiles | ODbL |

## Running it yourself

**You need your own Firebase project** — push notifications are sent from a service
account you control.

```bash
# 1. App
cd app
cp ../google-services.json.example android/app/google-services.json   # fill in your values
flutter pub get
flutter run

# 2. Worker
cd ingest
npx wrangler deploy
```

Secrets the worker expects (set with `npx wrangler secret put NAME`):

| Secret | Purpose |
|---|---|
| `FIREBASE_SA` | Firebase service-account JSON (sends push) |
| `FIRMS_MAP_KEY` | NASA FIRMS API key (satellite fires) |
| `GEMINI_API_KEY` | Optional — AI assistant + report triage |

**Nothing secret is committed to this repository.** Signing keys, service accounts and API
tokens are gitignored. If you fork this, use your own.

## Contributing

Contributions are very welcome, especially:

- **More Algerian data sources** — official (CRAAG, DGF, ANRH) or community feeds.
- **Translations** — Arabic wording, Algerian darija phrasing, Tamazight.
- **Accessibility** — this app is meant for elderly and low-literacy users too.
- **iOS support** — currently Android only.

Please keep the safety-first principle: **an alert must never depend on a network call,
a cloud API, or a permission the user might not have granted.**

## Team

- **[Mezouar Islem](https://github.com/MzrIslem)** — author
- **Claude Code** (Anthropic) — coder

Made in Algeria 🇩🇿, for Algeria.

## Security

No secrets are committed to this repository — signing keys, service accounts and
API tokens are gitignored and injected at runtime. See [SECURITY.md](SECURITY.md)
for the vulnerability-disclosure policy, secret-management model and data handling.

**Privacy:** built privacy-by-design, in line with **Loi n° 18-07** (Algeria's
personal-data-protection law) and GDPR principles — minimal data, no account, no
tracking, no third-party sharing. Details in [SECURITY.md](SECURITY.md#data-protection--loi-n-18-07-algérie--gdpr).

## Licence

MIT — see [LICENSE](LICENSE). Copyright © 2026 Mezouar Islem. Data from the sources above
remains under its own licence and must keep its attribution.

## Disclaimer

Rad Balek is provided "as is", without warranty of any kind. It is an informational tool
built by volunteers and is **not affiliated with, endorsed by, or operated by** Météo
Algérie, the Protection Civile, or any Algerian government body. Alerts may be delayed,
incomplete or wrong. **Always follow official instructions.**
