# Rad Balek (رد بالك) — ingest backend

Early warnings to safeguard **people, vegetation and animals** across all 58 wilayas.

**Deployed:** https://aisx-ews-ingest.md-mezouar.workers.dev (cron every 10 min)

| Endpoint | What |
|---|---|
| `GET /v1/alerts.json` | Latest normalized snapshot (official alerts + observed incidents) |
| `GET /v1/wilayas.json` | The 58 wilayas (code, fr, ar) |
| `POST /v1/reports` | Citizen report `{category, wilaya\|lat+lon, description?, lang}` — categories: fire, smoke, road, flood, animal, heat, other |
| `POST /v1/reports/confirm` | Community confirmation `{id}` (no self-confirm; ≥3 → community-confirmed) |
| `GET /v1/reports.json` | Recent citizen reports |
| `GET /v1/reports.csv` | Full export for analysis |
| `GET /v1/history.json` | Hourly stats snapshots (7-day window served; 1-year retention) |

## Push notifications (FCM)

Policy: yellow = in-app only (never pushed) · orange = normal push · red =
high-priority (`red_alerts` channel, time-sensitive on iOS). Topics
`w{code}_{hazard}_{color}`; dedupe via KV `sent:*` (3-day TTL); max 80
sends/cycle; check `/v1/push-status.json`.

Setup once the Firebase project exists:
1. Firebase console → ⚙ Project settings → **Service accounts** → *Generate new
   private key* → save as `C:\AISX\algeria-ews\firebase-sa.json` (gitignored).
2. Validate: `node scripts/test-push.js`
3. Deploy the secret: `Get-Content ..\firebase-sa.json -Raw | npx wrangler secret put FIREBASE_SA`

## Analytics

Reports and hourly snapshots are stored flat in KV (180-day / 1-year TTL) and export
via CSV/JSON — pull `reports.csv` + `history.json` into pandas/Sheets for
per-wilaya trends, alert-vs-report correlation, seasonal patterns. Anti-abuse:
5 reports/hour per client, salted-hash client key (no raw IP stored), coords
rounded to ~110 m, Algeria-bbox validation. **Planned:** migrate to D1 (SQL)
once the API token gains the `Account → D1 → Edit` permission — same data model.

Multi-source early-warning ingest for Algeria: wildfire, heatwave/weather, road.
Dependency-free ESM JavaScript — the same `src/` runs on Node 18+ locally and on
Cloudflare Workers unchanged.

## Sources

| Source | What | Auth |
|---|---|---|
| ONM CAP feed (`ametvigilance.meteo.dz`) | Official per-wilaya vigilance alerts (heat, storm, wind, sandstorm) in CAP v1.2, CC BY 4.0 | none |
| Protection Civile Telegram (`t.me/s/DGPCDZ`) | Daily fire sitreps (per-wilaya, per-commune, status) + road crashes, Arabic | none |
| NASA FIRMS | Satellite active-fire hotspots (VIIRS ×3 + MODIS), clustered into fire events | free `FIRMS_MAP_KEY` — <https://firms.modaps.eosdis.nasa.gov/api/map_key/> |
| GDACS RSS | Orange/Red multi-hazard escalation events | none |

## Run locally

```
node scripts/harvest-polygons.js   # builds data/wilayas.geojson from ONM CAP files (re-run occasionally until 58/58)
set FIRMS_MAP_KEY=...              # optional
node run.js                        # writes out/alerts.json + prints summary
```

## Deploy (Cloudflare Workers, free plan)

```
wrangler kv namespace create EWS_KV     # put id into wrangler.toml
wrangler secret put FIRMS_MAP_KEY       # optional
wrangler deploy
```

Cron runs every 10 min; snapshot served at `GET /v1/alerts.json` (CORS open,
2 min cache). The mobile app reads this endpoint and subscribes to FCM topics.

## Output model (CAP-aligned)

Two strictly separated classes:

- `alerts[]` — official (ONM, GDACS). Fields: `hazard`, `severity`
  (Moderate/Severe/Extreme), `color` (yellow/orange/red — ONM ladder 1/2/3),
  `urgency`, `certainty`, `onset`, `expires`, `wilayas[{code,fr,ar}]`,
  `headline{fr,en,ar}`, `link`. These may notify loudly.
- `incidents[]` — observations (FIRMS clusters, DGPC fires with
  status ongoing/contained/extinguished, road crashes). Map pins, silent.

`notifications[]` — FCM topic fan-out plan: topic `w{code}_{hazard}_{color}`
per alert (e.g. `w16_heat_red`).

## TODO

- FCM HTTP v1 send in `worker.js` (needs Firebase project + service account; diff against KV `sent` set)
- Gemini Flash classification pass for unstructured DGPC posts (road casualties phrasing varies; current regex is best-effort)
- Remaining 13 wilaya polygons (accumulate via `harvest`, or import once from another CC-licensed set)
- EFFIS `mf010.fwi` fire-danger WMS layer for the app's map
- State/dedupe across runs (KV `sent` set) so repeat alerts don't re-notify
