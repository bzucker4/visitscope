/*
 * VisitScope first-party assessment.
 *
 * Drives the 7-step adaptive form in assessment.html:
 *  - persists a draft in localStorage while the client answers
 *  - shows only the photo slots that apply
 *  - compresses photos to data URLs so a brief can be generated fully client-side
 *  - on submit, scores the assessment (scoring.js) and saves it to the provider inbox
 */
(function () {
  'use strict';

  var cfg = window.VISITSCOPE_CONFIG || window.PREVISIT_CONFIG || {};
  var Scoring = window.VisitScopeScoring;
  var STORAGE_KEY = cfg.storageKey || 'visitscope.assessments';
  var DRAFT_KEY = cfg.draftKey || 'visitscope.draft';
  var TOTAL_STEPS = 7;

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  if (!$('.assessment-card')) return; // only runs on the assessment page

  if (cfg.accent) document.documentElement.style.setProperty('--accent', cfg.accent);
  if (cfg.accentDark) document.documentElement.style.setProperty('--accent-dark', cfg.accentDark);

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>'"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c];
    });
  }

  // ---- state ------------------------------------------------------------
  function freshState() {
    return {
      idempotencyKey: '',
      helpTypes: [], situation: '', situationNote: '', propertyType: '', bedrooms: '', yearsOccupied: '', city: '',
      contents: '', sorting: '', extraAreas: [], access: '',
      timeline: '', selling: '', decisionMakers: '', outOfTown: '', contact: { name: '', phone: '', email: '' },
      services: [], servicesTouched: false, photos: {}, notes: ''
    };
  }
  var state = freshState();

  // ---- persistence ------------------------------------------------------
  function loadDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      var d = JSON.parse(raw);
      var merged = freshState();
      Object.keys(merged).forEach(function (k) { if (d[k] !== undefined) merged[k] = d[k]; });
      merged.contact = { name: '', phone: '', email: '' };
      if (d.contact) Object.keys(merged.contact).forEach(function (k) { if (d.contact[k]) merged.contact[k] = d.contact[k]; });
      return merged;
    } catch (e) { return null; }
  }
  function saveDraft() {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(state)); } catch (e) { /* quota — ignore draft */ }
  }
  function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch (e) {} }

  // Submitted assessments now live on the server (Netlify Blobs); the browser only
  // keeps a pre-submit draft. STORAGE_KEY is retained for reference/compat.

  // ---- steps / navigation ----------------------------------------------
  var steps = $$('.step');
  var current = 0;

  function updateProgress() {
    var shell = $('#progressShell');
    var isResult = current >= TOTAL_STEPS;
    if (shell) shell.classList.toggle('hidden', isResult);
    var stepNum = Math.min(current + 1, TOTAL_STEPS);
    var pct = isResult ? 100 : Math.round((current / (TOTAL_STEPS - 1)) * 100);
    if ($('#progressBar')) $('#progressBar').style.width = pct + '%';
    if ($('#progressPct')) $('#progressPct').textContent = pct + '%';
    if ($('#stepLabel')) $('#stepLabel').textContent = 'Step ' + stepNum + ' of ' + TOTAL_STEPS;
  }

  function showStep(i) {
    current = Math.max(0, Math.min(i, steps.length - 1));
    steps.forEach(function (s, n) { s.classList.toggle('hidden', n !== current); });
    if (current === 4) prefillServices();
    if (current === 5) renderPhotos();
    if (current === 6) renderReview();
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  var validators = {
    0: function () { return state.helpTypes.length ? '' : 'Please choose at least one option.'; },
    1: function () { return state.situation ? '' : 'Please pick what best describes the situation.'; },
    2: function () {
      if (!state.contents) return 'Let us know how full the home is.';
      if (!state.sorting) return 'Let us know where sorting stands.';
      return '';
    },
    3: function () {
      if (!state.timeline) return 'Please choose a desired completion.';
      if (!state.contact.name.trim()) return 'Please add a name so we know who to reach.';
      var email = state.contact.email.trim();
      var phone = state.contact.phone.trim();
      if (!email && !phone) return 'Add an email or phone so the team can follow up.';
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "That email doesn't look right.";
      return '';
    }
  };

  function goNext() {
    var errEl = steps[current] ? steps[current].querySelector('[data-error]') : null;
    var msg = validators[current] ? validators[current]() : '';
    if (msg) { if (errEl) errEl.textContent = msg; return; }
    if (errEl) errEl.textContent = '';
    showStep(current + 1);
  }
  function goBack() {
    var errEl = steps[current] ? steps[current].querySelector('[data-error]') : null;
    if (errEl) errEl.textContent = '';
    showStep(current - 1);
  }

  // ---- services pre-check ----------------------------------------------
  var HELP_TO_SERVICES = {
    'Downsizing': ['Downsizing', 'Sorting'],
    'Senior move or relocation': ['Senior move management', 'Packing'],
    'Professional organizing': ['Sorting'],
    'Estate transition': ['Sorting', 'Removal'],
    'Estate cleanout': ['Removal', 'Donation coordination'],
    'Preparing a home for sale': ['Home sale prep', 'Removal'],
    'Sorting belongings': ['Sorting'],
    'Donation or disposal coordination': ['Donation coordination', 'Removal']
  };
  function prefillServices() {
    if (state.servicesTouched) return;
    var pre = [];
    state.helpTypes.forEach(function (h) {
      (HELP_TO_SERVICES[h] || []).forEach(function (s) { if (pre.indexOf(s) === -1) pre.push(s); });
    });
    if (state.selling === 'Yes' && pre.indexOf('Home sale prep') === -1) pre.push('Home sale prep');
    state.services = pre;
    $$('[data-array-input="services"]').forEach(function (cb) { cb.checked = pre.indexOf(cb.value) !== -1; });
    saveDraft();
  }

  // ---- photos -----------------------------------------------------------
  function updatePhotoMeter() {
    var slots = Scoring.requestedPhotoSlots(state);
    var filled = slots.filter(function (s) { return state.photos[s] && state.photos[s].length; }).length;
    if ($('#photoCount')) $('#photoCount').textContent = filled;
    if ($('#photoRecommended')) $('#photoRecommended').textContent = slots.length;
    if ($('#photoMeter')) $('#photoMeter').style.width = Math.round(filled / Math.max(slots.length, 1) * 100) + '%';
  }

  function renderPhotos() {
    var grid = $('#photoGrid');
    if (!grid) return;
    var slots = Scoring.requestedPhotoSlots(state);
    grid.innerHTML = slots.map(function (slot) {
      var imgs = state.photos[slot] || [];
      var has = imgs.length > 0;
      var thumb = has ? '<img class="photo-thumb" src="' + imgs[0] + '" alt="">' : '';
      return '<label class="photo-card' + (has ? ' done' : '') + '">' +
        '<input type="file" accept="image/*" capture="environment" multiple data-photo="' + esc(slot) + '">' +
        thumb +
        '<div class="photo-top"><span class="photo-icon">▧</span><span class="photo-status">' +
          (has ? ('✓ ' + imgs.length + ' added') : 'Add photo') + '</span></div>' +
        '<div><strong>' + esc(slot) + '</strong><small>Wide shot if you can</small></div>' +
        '</label>';
    }).join('');
    $$('input[data-photo]', grid).forEach(function (inp) {
      inp.addEventListener('change', function () { handlePhotoInput(inp); });
    });
    updatePhotoMeter();
  }

  function handlePhotoInput(inp) {
    var slot = inp.getAttribute('data-photo');
    var files = Array.prototype.slice.call(inp.files || []);
    if (!files.length) return;
    var card = inp.closest('.photo-card');
    var statusEl = card ? card.querySelector('.photo-status') : null;
    if (statusEl) statusEl.textContent = 'Working…';
    var tooBig = files.some(function (f) { return f.size > 12 * 1024 * 1024; });
    Promise.all(files.map(readAndCompress)).then(function (urls) {
      urls = urls.filter(Boolean);
      state.photos[slot] = (state.photos[slot] || []).concat(urls);
      saveDraft();
      renderPhotos();
      var errEl = steps[5].querySelector('[data-error]');
      if (errEl) errEl.textContent = tooBig ? 'Large photos were compressed to save space.' : '';
    }).catch(function () {
      if (statusEl) statusEl.textContent = 'Could not read that file';
    });
  }

  // Downscale to <=1280px on the long edge and export JPEG to keep records small.
  function readAndCompress(file) {
    return new Promise(function (resolve) {
      if (!file.type || file.type.indexOf('image/') !== 0) { resolve(null); return; }
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          try {
            var maxDim = 1280;
            var scale = Math.min(1, maxDim / Math.max(img.width, img.height));
            var cw = Math.max(1, Math.round(img.width * scale));
            var ch = Math.max(1, Math.round(img.height * scale));
            var canvas = document.createElement('canvas');
            canvas.width = cw; canvas.height = ch;
            canvas.getContext('2d').drawImage(img, 0, 0, cw, ch);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } catch (e) { resolve(reader.result); }
        };
        img.onerror = function () { resolve(reader.result); };
        img.src = reader.result;
      };
      reader.onerror = function () { resolve(null); };
      reader.readAsDataURL(file);
    });
  }

  // ---- review -----------------------------------------------------------
  function renderReview() {
    var recap = $('#reviewRecap');
    if (!recap) return;
    var slots = Scoring.requestedPhotoSlots(state);
    var photoCount = slots.reduce(function (n, s) { return n + ((state.photos[s] || []).length); }, 0);
    var home = [state.bedrooms ? state.bedrooms + ' BR' : '', state.propertyType].filter(Boolean).join(' · ');
    var rows = [
      ['Help', state.helpTypes.join(', ') || '—'],
      ['Situation', state.situation || '—'],
      ['Home', home || '—'],
      ['Contents', state.contents || '—'],
      ['Sorting', state.sorting || '—'],
      ['Timeline', state.timeline || '—'],
      ['Preparing to sell', state.selling || '—'],
      ['Contact', state.contact.name || '—'],
      ['City / ZIP', state.city || '—'],
      ['Photos', photoCount + ' added']
    ];
    recap.innerHTML = rows.map(function (r) {
      return '<div>' + esc(r[0]) + '<strong>' + esc(r[1]) + '</strong></div>';
    }).join('');
  }

  // ---- submit -----------------------------------------------------------
  function genKey() {
    return 'vs-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8) + Math.random().toString(36).slice(2, 6);
  }

  function buildPayload() {
    return {
      idempotencyKey: state.idempotencyKey,
      helpTypes: state.helpTypes.slice(),
      situation: state.situation,
      situationNote: state.situationNote,
      propertyType: state.propertyType,
      bedrooms: state.bedrooms,
      yearsOccupied: state.yearsOccupied,
      city: state.city,
      contents: state.contents,
      sorting: state.sorting,
      extraAreas: state.extraAreas.slice(),
      access: state.access,
      timeline: state.timeline,
      selling: state.selling,
      decisionMakers: state.decisionMakers,
      outOfTown: state.outOfTown,
      contact: { name: state.contact.name, phone: state.contact.phone, email: state.contact.email },
      services: state.services.slice(),
      photos: state.photos,
      notes: state.notes
    };
  }

  var submitting = false;
  function submit() {
    if (submitting) return;
    var msg = validators[3]();
    if (msg) {
      showStep(3);
      var e3 = steps[3].querySelector('[data-error]');
      if (e3) e3.textContent = msg;
      return;
    }
    var btn = $('#submitBtn');
    var errEl = steps[6].querySelector('[data-error]');
    if (errEl) errEl.textContent = '';
    submitting = true;
    if (btn) { btn.disabled = true; btn.textContent = 'Submitting…'; }

    fetch('/api/submit', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(buildPayload())
    }).then(function (resp) {
      return resp.json().then(function (data) { return { ok: resp.ok, data: data }; });
    }).then(function (res) {
      if (!res.ok || !res.data.id) throw new Error((res.data && res.data.error) || 'submit failed');
      clearDraft();
      var briefLink = $('#resultBriefLink');
      if (briefLink) briefLink.href = 'brief.html?id=' + encodeURIComponent(res.data.id);
      showStep(7);
    }).catch(function (e) {
      submitting = false;
      if (btn) { btn.disabled = false; btn.textContent = 'Submit assessment'; }
      if (errEl) errEl.textContent = 'Could not submit (' + (e.message || e) + '). Please try again.';
    });
  }

  // ---- settings (branding + services) -----------------------------------
  function renderServices(services) {
    var wrap = document.querySelector('[data-array="services"]');
    if (!wrap || !services || !services.length) return;
    var selected = state.services.slice();
    wrap.innerHTML = services.map(function (v) {
      var checked = selected.indexOf(v) !== -1 ? ' checked' : '';
      return '<label><input type="checkbox" data-array-input="services" value="' + esc(v) + '"' + checked + '><span>' + esc(v) + '</span></label>';
    }).join('');
    $$('[data-array-input="services"]', wrap).forEach(function (cb) {
      cb.addEventListener('change', function () {
        state.services = $$('[data-array-input="services"]').filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
        state.servicesTouched = true;
        saveDraft();
      });
    });
  }

  function applySettings(s) {
    if (!s) return;
    if ($('#businessName')) $('#businessName').textContent = s.businessName || 'VisitScope';
    if ($('#businessMark')) {
      if (s.logoUrl) $('#businessMark').innerHTML = '<img src="' + esc(s.logoUrl) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">';
      else $('#businessMark').textContent = s.businessInitials || 'V';
    }
    renderServices(s.services);
    if (current === 4 && !state.servicesTouched) prefillServices();
  }

  function loadSettings() {
    fetch('/api/settings').then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) { if (d && d.settings) applySettings(d.settings); })
      .catch(function () { /* offline / no backend — static defaults remain */ });
  }

  // ---- hydrate UI from state -------------------------------------------
  function hydrateUI() {
    $$('[data-pill]').forEach(function (group) {
      var key = group.getAttribute('data-pill');
      $$('button', group).forEach(function (b) { if (b.getAttribute('data-value') === state[key]) b.classList.add('selected'); });
    });
    $$('[data-choice]').forEach(function (group) {
      var key = group.getAttribute('data-choice');
      $$('.choice-card', group).forEach(function (c) { if (c.getAttribute('data-value') === state[key]) c.classList.add('selected'); });
    });
    $$('[data-array-input]').forEach(function (cb) {
      var key = cb.getAttribute('data-array-input');
      if ((state[key] || []).indexOf(cb.value) !== -1) cb.checked = true;
    });
    $$('[data-field]').forEach(function (inp) {
      var key = inp.getAttribute('data-field');
      if (state[key] != null && state[key] !== '') inp.value = state[key];
    });
    $$('[data-contact]').forEach(function (inp) {
      var k = inp.getAttribute('data-contact');
      if (state.contact[k]) inp.value = state.contact[k];
    });
  }

  // ---- wire events ------------------------------------------------------
  function wire() {
    $$('[data-pill]').forEach(function (group) {
      var key = group.getAttribute('data-pill');
      $$('button', group).forEach(function (btn) {
        btn.addEventListener('click', function () {
          state[key] = btn.getAttribute('data-value');
          $$('button', group).forEach(function (x) { x.classList.remove('selected'); });
          btn.classList.add('selected');
          saveDraft();
        });
      });
    });
    $$('[data-choice]').forEach(function (group) {
      var key = group.getAttribute('data-choice');
      $$('.choice-card', group).forEach(function (card) {
        card.addEventListener('click', function () {
          state[key] = card.getAttribute('data-value');
          $$('.choice-card', group).forEach(function (x) { x.classList.remove('selected'); });
          card.classList.add('selected');
          saveDraft();
        });
      });
    });
    $$('[data-array-input]').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var key = cb.getAttribute('data-array-input');
        state[key] = $$('[data-array-input="' + key + '"]').filter(function (x) { return x.checked; }).map(function (x) { return x.value; });
        if (key === 'services') state.servicesTouched = true;
        if (key === 'extraAreas') renderPhotos();
        saveDraft();
      });
    });
    $$('[data-field]').forEach(function (inp) {
      inp.addEventListener('input', function () {
        state[inp.getAttribute('data-field')] = inp.value;
        if (inp.getAttribute('data-field') === 'bedrooms') renderPhotos();
        saveDraft();
      });
    });
    $$('[data-contact]').forEach(function (inp) {
      inp.addEventListener('input', function () { state.contact[inp.getAttribute('data-contact')] = inp.value; saveDraft(); });
    });
    $$('[data-next]').forEach(function (b) { b.addEventListener('click', goNext); });
    $$('[data-back]').forEach(function (b) { b.addEventListener('click', goBack); });
    if ($('#submitBtn')) $('#submitBtn').addEventListener('click', submit);
    if ($('#editFromReview')) $('#editFromReview').addEventListener('click', function () { showStep(0); });
    if ($('#businessName')) $('#businessName').textContent = cfg.businessName || 'VisitScope';
    if ($('#businessMark')) $('#businessMark').textContent = cfg.businessInitials || 'V';
  }

  // ---- init -------------------------------------------------------------
  var draft = loadDraft();
  if (draft) state = draft;
  if (!state.idempotencyKey) { state.idempotencyKey = genKey(); saveDraft(); }
  wire();
  hydrateUI();
  loadSettings();
  showStep(0);
})();
