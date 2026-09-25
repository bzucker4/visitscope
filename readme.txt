VISITSCOPE V1

Netlify-ready static site. First-party project-intake loop — no backend, no build step, no third-party app.

Pages
- index.html          VisitScope marketing page (assessment/brief links stay on-domain)
- assessment.html     First-party guided assessment (7 adaptive steps)
- brief.html          Example Jane Miller brief (brief.html?example=1)
- brief.html?id=...    Live brief rendered from a saved assessment
- inbox.html          Provider inbox of submissions (internal, no auth for v1)
- scoring.test.html   Runs the 5 scoring fixtures in the browser

Scripts
- config.js           Brand/config
- scoring.js          Pure scoring function (browser + Node)
- scoring.fixtures.js Five scoring fixtures
- app.js              Assessment engine (localStorage draft, photo capture, submit)
- brief.js            Brief renderer (example + live)
- inbox.js            Provider inbox

Data
- Assessments are stored in localStorage under "visitscope.assessments".
- Photos are stored as compressed data URLs inside each assessment record.
- A draft is kept under "visitscope.draft" while a client fills out the form.
