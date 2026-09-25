VISITSCOPE V1.1

Netlify static site + serverless backend. First-party project-intake loop with
central storage, so provider access works across devices and survives browser clears.

Pages
- index.html          Marketing page (assessment/brief links stay on-domain)
- assessment.html     First-party guided assessment (7 adaptive steps)
- brief.html          Example Jane Miller brief (brief.html?example=1)
- brief.html?id=...    Live brief rendered from a stored assessment (via API)
- inbox.html          Provider inbox — passcode-gated, reads from the API
- scoring.test.html   Runs the 5 scoring fixtures in the browser

Frontend scripts
- config.js           Static fallback brand/config
- scoring.js          Pure scoring function (browser + Node), configurable qualification
- scoring.fixtures.js Five scoring fixtures
- app.js              Assessment engine (draft in localStorage, photo capture, API submit)
- brief.js            Brief renderer (example local + live from API)
- inbox.js            Provider inbox + settings panel (API-backed, gated)

Backend (Netlify Functions, in netlify/functions/)
- submit.js           POST: score, store photos in Blobs, dedupe, email provider
- get.js              GET ?id=: one brief-ready record (photos as URLs)
- list.js             GET: inbox summaries (gated)
- status.js           POST: update inquiry status (gated)
- photo.js            GET ?key=: stream a stored photo
- auth.js             GET/POST: provider passcode gate (signed cookie)
- settings.js         GET/POST: configurable business + qualification settings
- _lib/               shared: blobs store, cookie auth, settings, email, http

Storage
- Netlify Blobs stores submission records, photos, and settings centrally.
- Nothing durable lives in the browser (only a pre-submit draft in localStorage).

Local development
- npm install
- Create .env from .env.example (set PROVIDER_PASSCODE at minimum)
- npx netlify dev   (serves site + functions + local Blobs sandbox on http://localhost:8888)
- node scoring.selftest.js   (runs scoring fixtures)

Deployment (Netlify)
- Connect the repo; no build command needed (publish = repo root).
- Set environment variables from .env.example (PROVIDER_PASSCODE required;
  RESEND_API_KEY + NOTIFY_EMAIL for email notifications).
