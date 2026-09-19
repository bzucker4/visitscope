# VisitScope MVP implementation plan

Static Netlify marketing site (V4). Client intake currently redirects to Zite. `app.js` still contains a full assessment wizard and a single 0–100 score, but the matching HTML is gone. `brief.html` is a hardcoded Jane Miller example. `config.js` only holds brand/contact/demo flags.

## Reuse

- `styles.css` visual system (marketing, assessment, brief) — do not restyle
- Marketing page structure and copy
- Example brief layout: summary row, snapshot, signals, photos, recommended next step
- Assessment interaction patterns already in `app.js` and CSS (steps, choice cards, photo grid)
- Question model already in `app.js` (`situationSets`, `detailSets`, photo checklist)

## Change

- Replace the Zite redirect with an in-app assessment that submits locally
- Generate a live Project Brief from each submission (not a static example)
- Split today’s one score into four deterministic dimensions plus signals, gaps, and next step
- Add an operator queue and brief actions only — no CRM beyond this workflow
- Move company copy/questions into a business config; move scoring into a rules config
- Point marketing CTAs at the local assessment and add a discreet operator entry

## Proposed structure

```
config/business.js   company brand, services, questions, copy
config/rules.js      qualification thresholds, signals, next-step rules
js/qualify.js        rule engine (no business hardcoding)
js/store.js          IndexedDB adapter (inquiries + photos)
js/assessment.js     client intake
js/queue.js          operator list
js/brief.js          brief renderer + actions
```

Inquiry record:

- `id`, `createdAt`, `updatedAt`
- `status`: `new` | `needs_info` | `call` | `visit` | `refer_decline` | `closed`
- `outcome`: `refer` | `decline` | null
- `intake` (answers + contact)
- `photos` (slot, label, compressed image)
- `activity[]` (`at`, `action`, `note`)
- Qualification is derived at read time from `rules.js`

## Deployment

- Stay zero-build static files so Netlify drop-in deploy still works
- No new npm runtime dependencies
- IndexedDB keeps cost at $0 and avoids accounts/backends
- Same-origin only: a client phone and an operator desktop do not share data unless a later store adapter is added
- Photos stay in the browser (compressed). Clearing site data clears the queue
- Optional operator PIN in business config; empty means open access
