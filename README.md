# VisitScope

Project intake for home-transition professionals. A homeowner completes a guided
assessment → a decision-ready brief is generated → the provider reviews it in a
private inbox. Static frontend + Netlify Functions + Netlify Blobs. No build step,
no framework, no database server.

## Pages

| Path | Who | Notes |
| --- | --- | --- |
| `/` (`index.html`) | Public | Marketing page |
| `/assessment.html` | Public | 7-step guided assessment |
| `/privacy.html` | Public | Privacy note (photos + contact use) |
| `/brief.html?example=1` | Public | Canned Jane Miller demo brief |
| `/brief.html?id=…` | Provider only | Live brief; unauthenticated visitors see a neutral "brief received" page |
| `/inbox.html` | Provider only | Passcode-gated. **Unlinked / hidden** — reach it by typing the URL |

## Architecture

- **Frontend:** static HTML/CSS/JS. `scoring.js` is shared with the backend.
- **Backend:** Netlify Functions in `netlify/functions/` (`submit`, `get`, `list`,
  `status`, `photo`, `auth`, `settings`). `/api/*` maps to functions via `netlify.toml`.
- **Storage:** Netlify Blobs holds submission records, photos, and settings.
  Nothing durable lives in the browser.
- **Access gate:** a single shared provider passcode → signed, HTTP-only session
  cookie (no accounts, no roles).
- **Email:** new-submission notification via Resend (best-effort; submissions still
  save if email is unconfigured).

### Hardening (single-customer)

- `/api/submit` is rate-limited per IP (5 / 10 min, 30 / day) and caps photos
  (≤6 per slot, ≤18 total, ≤5 MB each, ≤12 MB total body).
- `/api/get` and `/api/photo` require the provider cookie; families never receive
  brief data or photos — only a "brief received" acknowledgement.
- Duplicate-submit protection: client idempotency key + server content-hash window
  + submit-button lock.

## Production environment variables

Set these in **Netlify → Site configuration → Environment variables**.

| Variable | Required | Purpose | Where to get the value |
| --- | --- | --- | --- |
| `PROVIDER_PASSCODE` | **Yes** | Unlocks `/inbox.html` and authorizes brief/photo access. | **Generate a new strong secret** (e.g. `openssl rand -base64 18`). Never reuse any passcode used in local development. |
| `SESSION_SECRET` | Recommended | Signs the provider session cookie. | Random string, e.g. `openssl rand -hex 32`. Falls back to `PROVIDER_PASSCODE` if unset. |
| `RESEND_API_KEY` | For email | Lets `submit` send the notification email. If unset, submissions still save and email is skipped. | Resend dashboard → **API Keys → Create API Key** (resend.com). |
| `NOTIFY_EMAIL` | For email | Address that receives new-submission alerts. | The provider's email. Can also be set in the inbox **Settings** panel (which overrides this). |
| `RESEND_FROM` | Optional | "From" identity on emails. | An address on a domain verified in **Resend → Domains** (add DNS records), e.g. `VisitScope <hello@yourdomain.com>`. Defaults to `VisitScope <onboarding@resend.dev>` (fine for testing). |
| `BUSINESS_NAME` | Optional | Default business name shown to clients. | The business name (or set it in **Settings**). |
| `LOGO_URL` | Optional | Header logo image. | A public image URL (or set it in **Settings**). |

Do **not** set `URL` — Netlify populates it automatically and it's used to build the
brief link inside notification emails.

## Go-live checklist (10 steps)

1. **Create the site:** Netlify → *Add new site → Import from GitHub →* this repo,
   deploy branch `main`. Build settings come from `netlify.toml` (build command: none,
   publish: `.`, functions: `netlify/functions`) — just confirm them.
2. **Set environment variables** (table above). Use a **brand-new** `PROVIDER_PASSCODE`
   and a unique random `SESSION_SECRET`; never the local-dev values.
3. **Set up Resend:** create an API key; verify your sending domain (add the DNS
   records Resend gives you) or use `onboarding@resend.dev` for a first test.
4. **Deploy** and confirm all seven functions load (Netlify → *Logs → Functions*).
   Netlify Blobs is provisioned automatically — no setup.
5. **Configure the business:** open `/inbox.html`, unlock with the passcode, open
   **Settings**, set business name, logo, notification email, services, and
   qualification thresholds, and **Save**.
6. **Submit a test assessment** at `/assessment.html` (include a photo); confirm the
   client lands on the "submission confirmation / brief received" screen.
7. **Verify the inbox from another device/browser:** open `/inbox.html`, unlock, see
   the submission, open its brief (photos visible), and change its status.
8. **Verify email:** confirm the notification reached `NOTIFY_EMAIL` (check spam;
   if missing, verify the Resend domain).
9. **Verify hardening:** in a browser with no provider session, open a real
   `/brief.html?id=…` and confirm it shows "brief received" (no family data) and that
   `/api/photo` requires login; optionally confirm rapid repeat submits are rate-limited.
10. **Custom domain + HTTPS:** add the domain in *Domain management* (Netlify issues
    SSL automatically). HTTPS is required — the session cookie is `Secure` in
    production. Keep `/inbox.html` unlinked (hidden) and share the passcode privately.

## Local development

```bash
npm install
cp .env.example .env      # set PROVIDER_PASSCODE at minimum
npx netlify dev           # site + functions + local Blobs sandbox at http://localhost:8888
node scoring.selftest.js  # run scoring fixtures
```
