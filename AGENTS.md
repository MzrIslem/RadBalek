# Rad Balek (رد بالك) — Repo Rules (Algerian Early Warning System)

This folder is its **own git repo** (`MzrIslem/RadBalek`). Commit ONLY here when working on the EWS.

## Structure
- Flutter Android app with native lockscreen siren channels.
- `ingest/` — Cloudflare Worker ingestion engine (NASA FIRMS, EMSC, Météo Algérie feeds).

## Rules
- Alerts must degrade gracefully offline — never depend on an ungranted permission or failed network call.
- Firebase FCM keys and worker secrets stay out of git.
- Commit prefix: `feat(ews):` / `fix(ews):`.
