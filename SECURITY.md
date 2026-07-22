# Security Policy

Rad Balek is a public-safety application. We take the security and integrity of
the app, its backend, and its users' data seriously.

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Report privately through GitHub's **[Security Advisories](https://github.com/MzrIslem/RadBalek/security/advisories/new)**
("Report a vulnerability"), or by contacting the maintainer, **Mezouar Islem**.

Please include:

- a description of the issue and its impact,
- steps to reproduce (a proof of concept if possible),
- the affected version or commit.

We aim to acknowledge reports within **72 hours** and to provide a remediation
timeline after triage. Please give us a reasonable window to fix an issue before
any public disclosure (coordinated disclosure).

## Scope

In scope: this repository (the Flutter app and the Cloudflare Worker), and the
production API it talks to.

Out of scope: denial-of-service testing against the live API, social
engineering, and reports about third-party data sources (ONM, NASA FIRMS, EMSC,
CRAAG, dgpc.dz) — report those to the source.

## Secret management

No secrets are committed to this repository. The following are **required to run
the project but must never be in version control**, and are enforced by
[`.gitignore`](.gitignore):

| Secret | Where it lives |
|---|---|
| App signing keystore (`*.jks`, `key.properties`) | Local build machine only |
| Firebase service account (`firebase-sa.json`) | Cloudflare Worker secret |
| Cloudflare API token (`cf-env.ps1`) | Local machine only |
| NASA FIRMS / Gemini API keys | Cloudflare Worker secrets (`wrangler secret put`) |
| Firebase client config (`google-services.json`) | Per-developer; see the `.example` template |

Worker secrets are injected at the edge via `wrangler secret put NAME` and are
never present in the source. Contributors bring their own Firebase project and
keys — see [`google-services.json.example`](google-services.json.example) and
[`ingest/wrangler.toml.example`](ingest/wrangler.toml.example).

If you believe a secret has been committed, treat it as compromised: **rotate it
immediately**, then report it so history can be scrubbed.

## Data handling

The app collects the minimum needed to deliver alerts:

- **Approximate location** — resolved once to a wilaya, to subscribe to the right
  alert topics. Not tracked continuously; not sent to third parties.
- **FCM registration token** — to deliver push notifications.
- **Citizen reports** — text, category and wilaya the user chooses to submit;
  no account or personal identifier is required.

## Data protection — Loi n° 18-07 (Algérie) / GDPR

Rad Balek is designed to comply with **Loi n° 18-07 du 10 juin 2018** relative à
la protection des personnes physiques dans le traitement des données à caractère
personnel — Algeria's personal-data-protection law — and follows the same
principles as the EU GDPR (RGPD):

- **Minimisation** — only data strictly necessary to deliver an alert is
  processed (approximate wilaya + push token). Nothing else.
- **Finalité (purpose limitation)** — data is used solely to deliver hazard
  alerts. It is never sold, profiled, monetised, or shared with third parties.
- **Anonymat** — no account, name, phone number or email is required to use the
  app; citizen reports are anonymous.
- **Consentement** — location and notification permissions are requested
  explicitly, and the app still delivers national alerts without them.
- **Droits de la personne** — a user can stop all processing at any time by
  revoking a permission or uninstalling; no server-side profile persists.

Rad Balek is an independent tool and is not a registered data controller with
the ANPDP; this section states the privacy-by-design principles the project
follows, not a formal certification.

## Supported versions

Only the latest released version receives security fixes.
