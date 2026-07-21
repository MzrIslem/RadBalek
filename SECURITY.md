# Security Policy

Rad Balek is a public-safety application. We take the security and integrity of
the app, its backend, and its users' data seriously.

## Reporting a vulnerability

**Please do not open a public issue for security vulnerabilities.**

Report privately through GitHub's **[Security Advisories](https://github.com/Krizotiros/RadBalek/security/advisories/new)**
("Report a vulnerability"), or by contacting the maintainers at **YoushopDZ**.

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

## Supported versions

Only the latest released version receives security fixes.
