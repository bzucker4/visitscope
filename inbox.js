/*
 * VisitScope provider inbox (internal).
 * - Gated by a shared passcode (server-issued session cookie).
 * - Reads submissions, statuses, and settings from the Netlify Functions API,
 *   so the inbox works from any device/browser.
 */
(function () {
  'use strict';

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return Array.prototype.slice.call(document.querySelectorAll(s)); };
  var STATUSES = ['New', 'Call first', 'Schedule', 'Refer', 'Done'];

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>'"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c];
    });
  }
  function show(el, on) { if (el) el.classList.toggle('hidden', !on); }

  function api(path, opts) {
    return fetch(path, Object.assign({ headers: { 'content-type': 'application/json' } }, opts || {}))
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, status: r.status, d: d }; }); });
  }

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }
  function urgencyClass(u) { return 'u-' + String(u || '').toLowerCase(); }

  // ---- gate -------------------------------------------------------------
  function showGate(msg) {
    show($('#gateView'), true);
    show($('#providerView'), false);
    show($('#logoutBtn'), false);
    if (msg) $('#gateError').textContent = msg;
  }
  function showProvider() {
    show($('#gateView'), false);
    show($('#providerView'), true);
    show($('#logoutBtn'), true);
    loadList();
    loadSettings();
  }

  $('#gateForm').addEventListener('submit', function (e) {
    e.preventDefault();
    $('#gateError').textContent = '';
    var passcode = $('#passcode').value;
    api('/api/auth', { method: 'POST', body: JSON.stringify({ passcode: passcode }) }).then(function (res) {
      if (res.ok && res.d.authed) { $('#passcode').value = ''; showProvider(); }
      else $('#gateError').textContent = res.d.error || 'Incorrect passcode.';
    }).catch(function () { $('#gateError').textContent = 'Network error. Try again.'; });
  });

  $('#logoutBtn').addEventListener('click', function () {
    api('/api/auth', { method: 'POST', body: JSON.stringify({ logout: 1 }) }).then(function () { showGate(); });
  });

  // ---- submissions ------------------------------------------------------
  function loadList() {
    var root = $('#inboxRoot');
    root.innerHTML = '<p class="inbox-sub">Loading…</p>';
    api('/api/list').then(function (res) {
      if (res.status === 401) { showGate('Your session expired. Enter the passcode again.'); return; }
      if (!res.ok) { root.innerHTML = '<p class="inbox-sub">Could not load submissions.</p>'; return; }
      renderList(res.d.submissions || []);
    }).catch(function () { root.innerHTML = '<p class="inbox-sub">Network error loading submissions.</p>'; });
  }

  function renderList(list) {
    var root = $('#inboxRoot');
    $('#inboxCount').textContent = list.length ? (list.length + (list.length === 1 ? ' submission' : ' submissions')) : '';
    if (!list.length) {
      root.innerHTML =
        '<div class="inbox-empty"><div class="inbox-empty-mark">▧</div>' +
        '<h2>No assessments yet.</h2><p>Send a client to <a href="assessment.html">/assessment.html</a> and their brief will show up here.</p></div>';
      return;
    }
    root.innerHTML = '<div class="inbox-grid">' + list.map(function (s) {
      var status = s.status || 'New';
      var options = STATUSES.map(function (st) {
        return '<option value="' + esc(st) + '"' + (st === status ? ' selected' : '') + '>' + esc(st) + '</option>';
      }).join('');
      return '<article class="inbox-card">' +
        '<div class="inbox-card-top">' +
          '<div><strong>' + esc(s.name || 'New submission') + '</strong>' +
          '<span>' + esc(s.city || '—') + ' · ' + esc(fmtDate(s.createdAt)) + '</span></div>' +
          '<span class="status-chip status-' + esc(status.toLowerCase().replace(/\s+/g, '-')) + '">' + esc(status) + '</span>' +
        '</div>' +
        '<div class="inbox-metrics">' +
          '<div><span>Next step</span><b>' + esc(s.nextStepLabel || '—') + '</b></div>' +
          '<div><span>Urgency</span><b class="' + urgencyClass(s.urgency) + '">' + esc(s.urgency || '—') + '</b></div>' +
          '<div><span>Complexity</span><b>' + esc(s.complexity || '—') + '</b></div>' +
          '<div><span>Photos</span><b>' + (s.photoCount || 0) + '</b></div>' +
        '</div>' +
        '<div class="inbox-card-actions">' +
          '<a class="btn btn-primary" href="brief.html?id=' + encodeURIComponent(s.id) + '">Open brief</a>' +
          '<label class="status-select">Status <select data-id="' + esc(s.id) + '">' + options + '</select></label>' +
        '</div>' +
      '</article>';
    }).join('') + '</div>';

    $$('#inboxRoot select[data-id]').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var id = sel.getAttribute('data-id');
        var prev = sel.getAttribute('data-prev') || 'New';
        api('/api/status', { method: 'POST', body: JSON.stringify({ id: id, status: sel.value }) }).then(function (res) {
          if (res.status === 401) { showGate('Your session expired. Enter the passcode again.'); return; }
          if (res.ok) loadList();
          else sel.value = prev;
        });
      });
    });
  }

  // ---- settings ---------------------------------------------------------
  $('#settingsToggle').addEventListener('click', function () {
    var panel = $('#settingsPanel');
    show(panel, panel.classList.contains('hidden'));
  });

  function loadSettings() {
    api('/api/settings').then(function (res) {
      if (!res.ok || !res.d.settings) return;
      var s = res.d.settings;
      $('#setName').value = s.businessName || '';
      $('#setInitials').value = s.businessInitials || '';
      $('#setLogo').value = s.logoUrl || '';
      $('#setNotify').value = s.notifyEmail || '';
      $('#setServices').value = (s.services || []).join('\n');
      var q = s.qualification || {};
      $$('#setUrgent input').forEach(function (cb) { cb.checked = (q.urgentTimelines || []).indexOf(cb.value) !== -1; });
      $('#setRatio').value = q.completePhotoRatio != null ? Math.round(q.completePhotoRatio * 100) : 60;
      $('#setDM').value = q.minDecisionMakersComplex != null ? q.minDecisionMakersComplex : 3;
      $('#setAreas').value = q.minExtraAreasComplex != null ? q.minExtraAreasComplex : 3;
      $('#setHeavy').checked = q.heavyIsComplex !== false;
      // reflect brand in nav
      $('#navBrand').textContent = s.businessName || 'VisitScope';
      if (s.logoUrl) $('#navMark').innerHTML = '<img src="' + esc(s.logoUrl) + '" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:inherit">';
      else $('#navMark').textContent = s.businessInitials || 'V';
    });
  }

  $('#settingsSave').addEventListener('click', function () {
    var msg = $('#settingsMsg');
    msg.textContent = '';
    var services = $('#setServices').value.split('\n').map(function (x) { return x.trim(); }).filter(Boolean);
    var urgent = $$('#setUrgent input').filter(function (cb) { return cb.checked; }).map(function (cb) { return cb.value; });
    var payload = {
      settings: {
        businessName: $('#setName').value.trim(),
        brandName: $('#setName').value.trim(),
        businessInitials: $('#setInitials').value.trim(),
        logoUrl: $('#setLogo').value.trim(),
        notifyEmail: $('#setNotify').value.trim(),
        services: services,
        qualification: {
          urgentTimelines: urgent,
          completePhotoRatio: Math.max(0, Math.min(1, (parseFloat($('#setRatio').value) || 60) / 100)),
          heavyIsComplex: $('#setHeavy').checked,
          minDecisionMakersComplex: parseInt($('#setDM').value, 10) || 3,
          minExtraAreasComplex: parseInt($('#setAreas').value, 10) || 3
        }
      }
    };
    api('/api/settings', { method: 'POST', body: JSON.stringify(payload) }).then(function (res) {
      if (res.status === 401) { showGate('Your session expired. Enter the passcode again.'); return; }
      msg.style.color = res.ok ? '#3d6f5d' : '#a04640';
      msg.textContent = res.ok ? 'Saved.' : (res.d.error || 'Could not save.');
      if (res.ok) loadSettings();
    });
  });

  // ---- init -------------------------------------------------------------
  api('/api/auth').then(function (res) {
    if (res.ok && res.d.authed) showProvider();
    else showGate();
  }).catch(function () { showGate('Backend unavailable.'); });

  // remember previous status value for revert-on-error
  document.addEventListener('focusin', function (e) {
    if (e.target && e.target.matches && e.target.matches('#inboxRoot select[data-id]')) {
      e.target.setAttribute('data-prev', e.target.value);
    }
  });
})();
