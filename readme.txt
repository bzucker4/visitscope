VISITSCOPE PRE-CONSULTATION MVP

Zero-build static site. Deploy by publishing this folder (Netlify drop-in).

Client
- assessment.html: guided intake, photos, submit

Operator
- queue.html: inquiry queue and statuses
- brief.html?id=...: project brief and next-step actions
- brief.html: marketing example brief

Configuration (edit these, not the app)
- config/business.js: brand, services, questions, copy
- config/rules.js: qualification dimensions, signals, missing fields, recommended next step

Core application
- js/qualify.js: deterministic rule engine
- js/store.js: IndexedDB inquiries + photos
- js/assessment.js, js/queue.js, js/brief.js: workflow UI

Not included: billing, homeowner accounts, general CRM, AI chat.

Local notes
- Inquiries stay in this browser. A client phone and an operator desktop do not share data.
- Clearing site data clears the queue.
- Optional operatorPin in business.js gates the queue and live briefs.
- node --test tests/qualify.test.js
