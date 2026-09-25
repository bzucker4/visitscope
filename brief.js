/*
 * VisitScope brief renderer.
 *
 * - brief.html            → Jane Miller example (marketing demo)
 * - brief.html?example=1  → same example, explicitly
 * - brief.html?id=<id>    → live brief read from localStorage (visitscope.assessments)
 * - brief.html#id=<id>    → same, hash form
 *
 * Live and example briefs share one renderer so the visual structure stays identical.
 */
(function () {
  'use strict';

  var cfg = window.VISITSCOPE_CONFIG || window.PREVISIT_CONFIG || {};
  var Scoring = window.VisitScopeScoring;
  var STORAGE_KEY = cfg.storageKey || 'visitscope.assessments';

  var $ = function (s) { return document.querySelector(s); };

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>'"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c];
    });
  }

  // Neutral placeholder tile used by the example brief.
  var PLACEHOLDER = 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120">' +
    '<rect width="160" height="120" fill="#efe7dd"/>' +
    '<g fill="#c3b3a3"><circle cx="80" cy="52" r="16"/><rect x="34" y="86" width="92" height="7" rx="3.5"/></g></svg>');

  function placeholders(n) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(PLACEHOLDER);
    return out;
  }

  function exampleRecord() {
    return {
      id: 'example',
      createdAt: '2026-01-01T00:00:00.000Z',
      status: 'New',
      helpTypes: ['Senior move or relocation', 'Downsizing', 'Preparing a home for sale'],
      situation: 'Parent moving to assisted living',
      propertyType: 'Single-family home',
      bedrooms: 4,
      yearsOccupied: 38,
      city: 'Rochester, NY',
      contents: 'Heavy',
      sorting: 'Not started',
      extraAreas: ['Basement', 'Attic', 'Garage'],
      access: 'Basement stairs',
      timeline: '30 days',
      selling: 'Yes',
      decisionMakers: 3,
      outOfTown: 2,
      contact: { name: 'Jane Miller', phone: '(555) 555-0148', email: 'jane@example.com' },
      services: ['Sorting', 'Downsizing', 'Packing', 'Donation coordination', 'Removal', 'Home sale prep'],
      photos: {
        'Front / entry': placeholders(1),
        'Living room': placeholders(2),
        'Kitchen': placeholders(2),
        'Primary bedroom': placeholders(2),
        'Most challenging space': placeholders(1),
        'Basement': placeholders(3),
        'Garage': placeholders(2),
        'Attic': placeholders(1)
      },
      notes: 'Mom has lived here since the 1980s. We need help deciding what goes with her, what can be donated and what should be removed. Two siblings live out of state. The realtor would like the house ready next month.'
    };
  }

  function getParam(name) {
    var q = new RegExp('[?&]' + name + '=([^&#]*)');
    var m = window.location.search.match(q) || window.location.hash.match(new RegExp('[#&]' + name + '=([^&]*)'));
    return m ? decodeURIComponent(m[1]) : null;
  }

  var READINESS_NOTE = { High: 'Ready for consultation', Medium: 'Some detail still pending', Low: 'Needs more information' };
  var COMPLEXITY_NOTE = { High: 'Multiple spaces and needs', Medium: 'A few areas involved', Low: 'Focused scope' };
  var URGENCY_NOTE = { High: 'Time-sensitive', Medium: 'Moderate timeline', Low: 'Flexible timing' };
  var INFO_NOTE = { Complete: 'Strong photo coverage', Partial: 'Some gaps remain', Thin: 'Sparse so far' };
  var BADGE = { onsite: 'IN-HOME CONSULTATION', call: 'CALL FIRST', 'more-info': 'REQUEST MORE INFO', refer: 'REFER OR DECLINE' };

  function dlRow(term, def) {
    return '<div><dt>' + esc(term) + '</dt><dd>' + esc(def || 'Not provided') + '</dd></div>';
  }

  function renderPhotos(record) {
    var slots = Scoring.requestedPhotoSlots(record);
    // include any stored slots that aren't in the requested set (defensive)
    Object.keys(record.photos || {}).forEach(function (s) { if (slots.indexOf(s) === -1) slots.push(s); });
    return slots.map(function (slot) {
      var imgs = (record.photos && record.photos[slot]) || [];
      var body = imgs.length
        ? '<div class="brief-photo-thumbs">' + imgs.map(function (src) {
            return '<span class="brief-photo-thumb"><img src="' + src + '" alt="' + esc(slot) + '"></span>';
          }).join('') + '</div>'
        : '<div class="brief-photo-empty">Not provided</div>';
      return '<div class="brief-photo-slot' + (imgs.length ? '' : ' missing') + '">' +
        '<div class="brief-photo-head"><strong>' + esc(slot) + '</strong>' +
        '<span>' + (imgs.length ? imgs.length + ' photo' + (imgs.length > 1 ? 's' : '') : '—') + '</span></div>' +
        body + '</div>';
    }).join('');
  }

  function render(record, opts) {
    opts = opts || {};
    var scores = record.scores || Scoring.score(record);
    var c = record.contact || {};
    var contactLine = [record.city, c.email, c.phone].filter(Boolean).join(' · ');

    var snapshot =
      dlRow('Situation', record.situation) +
      dlRow('Property', [record.bedrooms ? record.bedrooms + '-bedroom' : '', record.propertyType].filter(Boolean).join(' ')) +
      dlRow('Years occupied', record.yearsOccupied ? record.yearsOccupied + ' years' : '') +
      dlRow('Contents', record.contents) +
      dlRow('Sorting', record.sorting) +
      dlRow('Additional spaces', (record.extraAreas || []).join(', '));

    var timing =
      dlRow('Desired completion', record.timeline) +
      dlRow('Preparing property for sale', record.selling) +
      dlRow('Decision-makers', record.decisionMakers) +
      dlRow('Out of town', record.outOfTown) +
      dlRow('Access concern', record.access) +
      dlRow('Help requested', (record.helpTypes || []).join(', '));

    var signals = (scores.signals && scores.signals.length)
      ? scores.signals.map(function (s) { return '<span>✓ ' + esc(s) + '</span>'; }).join('')
      : '<span>No standout signals</span>';

    var services = (scores.services && scores.services.length)
      ? scores.services.map(function (s) { return '<span>' + esc(s) + '</span>'; }).join('')
      : '<span>To be determined</span>';

    var html =
      '<section class="full-brief">' +
        '<div class="full-brief-head">' +
          '<div>' +
            '<span class="tiny-label">VISITSCOPE PROJECT BRIEF</span>' +
            '<h2>' + esc(c.name || 'New submission') + '</h2>' +
            '<p>' + esc(contactLine || 'Contact details pending') + '</p>' +
          '</div>' +
          '<div class="brief-badge"><span>Recommended next step</span><strong>' + esc(BADGE[scores.nextStep.key] || scores.nextStep.label) + '</strong></div>' +
        '</div>' +
        '<div class="brief-summary-row">' +
          '<div><span>Project readiness</span><strong>' + esc(scores.readiness) + '</strong><small>' + esc(READINESS_NOTE[scores.readiness] || '') + '</small></div>' +
          '<div><span>Scope complexity</span><strong>' + esc(scores.complexity) + '</strong><small>' + esc(COMPLEXITY_NOTE[scores.complexity] || '') + '</small></div>' +
          '<div><span>Urgency</span><strong>' + esc(scores.urgency) + '</strong><small>' + esc(URGENCY_NOTE[scores.urgency] || '') + '</small></div>' +
          '<div><span>Information quality</span><strong>' + esc(scores.infoQuality) + '</strong><small>' + esc(INFO_NOTE[scores.infoQuality] || '') + '</small></div>' +
        '</div>' +
        '<div class="brief-columns">' +
          '<div class="brief-panel"><h3>Project snapshot</h3><dl class="brief-dl">' + snapshot + '</dl></div>' +
          '<div class="brief-panel"><h3>Timing &amp; decision signals</h3><dl class="brief-dl">' + timing + '</dl></div>' +
        '</div>' +
        '<div class="brief-panel full-width priority-reasons"><h3>Project signals</h3><div class="reason-grid">' + signals + '</div></div>' +
        '<div class="brief-panel full-width"><h3>Services likely needed</h3><div class="signal-row large">' + services + '</div></div>' +
        '<div class="brief-panel full-width"><h3>Guided photos</h3><div class="brief-photos">' + renderPhotos(record) + '</div></div>' +
        '<div class="recommendation-box"><div><span>Recommended next step</span><h3>' + esc(scores.nextStep.label) + '</h3><p>' + esc(scores.nextStep.reason) + '</p></div></div>' +
        '<div class="brief-panel full-width"><h3>Notes from client</h3><p class="client-note">' + esc(record.notes || 'None provided.') + '</p></div>' +
      '</section>';

    $('#briefRoot').innerHTML = html;

    if (opts.isExample) {
      $('#briefKicker').textContent = 'Example brief';
      $('#briefHeadline').textContent = 'This is what arrives before the consultation.';
      $('#briefSub').textContent = 'Example only, using sample data. In a live project the provider receives a brief built from the client’s own answers and photos.';
      $('#briefBottomCta').innerHTML = '<p>See how a brief gets created.</p><a class="cta-primary" href="assessment.html">Try the assessment →</a>';
    } else {
      $('#briefKicker').textContent = 'Live brief';
      $('#briefHeadline').textContent = c.name ? c.name + '’s project' : 'Project brief';
      var when = record.createdAt ? new Date(record.createdAt).toLocaleString() : '';
      $('#briefSub').textContent = 'Submitted ' + when + '. Generated from the client’s assessment.';
      $('#briefBottomCta').innerHTML = '<p>Manage this and other submissions.</p><a class="cta-primary" href="inbox.html">Back to provider inbox →</a>';
    }
  }

  function renderNotFound(id) {
    $('#briefKicker').textContent = 'Brief not found';
    $('#briefHeadline').textContent = 'We couldn’t find that brief.';
    $('#briefSub').textContent = 'No saved assessment matches id “' + id + '” in this browser.';
    $('#briefRoot').innerHTML =
      '<section class="full-brief"><p class="client-note">Live briefs are stored in this browser. This one may have been submitted on a different device, or the storage was cleared.</p>' +
      '<div class="brief-bottom-cta"><a class="cta-secondary" href="inbox.html">Open the inbox</a> <a class="cta-primary" href="assessment.html">Start an assessment</a></div></section>';
  }

  // ---- entry ------------------------------------------------------------
  var id = getParam('id');
  var wantExample = getParam('example') === '1';

  if (id && !wantExample) {
    fetch('/api/get?id=' + encodeURIComponent(id))
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (res) {
        if (res.ok && res.d && res.d.record) render(res.d.record, { isExample: false });
        else renderNotFound(id);
      })
      .catch(function () { renderNotFound(id); });
  } else {
    render(exampleRecord(), { isExample: true });
  }
})();
