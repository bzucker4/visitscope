/*
 * VisitScope provider inbox (internal, no auth for v1).
 * Lists saved assessments from localStorage, links to each live brief,
 * and lets the provider set a per-submission status that persists locally.
 */
(function () {
  'use strict';

  var cfg = window.VISITSCOPE_CONFIG || window.PREVISIT_CONFIG || {};
  var Scoring = window.VisitScopeScoring;
  var STORAGE_KEY = cfg.storageKey || 'visitscope.assessments';

  var $ = function (s) { return document.querySelector(s); };
  var STATUSES = ['New', 'Call first', 'Schedule', 'Refer', 'Done'];

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>'"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c];
    });
  }

  function loadAssessments() {
    try { var raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch (e) { return []; }
  }
  function saveAssessments(list) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); return true; } catch (e) { return false; }
  }

  function photoCount(record) {
    var photos = record.photos || {};
    return Object.keys(photos).reduce(function (n, k) { return n + (photos[k] ? photos[k].length : 0); }, 0);
  }

  function scoresFor(record) { return record.scores || Scoring.score(record); }

  function fmtDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function urgencyClass(u) { return 'u-' + String(u || '').toLowerCase(); }

  function render() {
    var root = $('#inboxRoot');
    var list = loadAssessments();
    $('#inboxCount').textContent = list.length ? (list.length + (list.length === 1 ? ' submission' : ' submissions')) : '';

    if (!list.length) {
      root.innerHTML =
        '<div class="inbox-empty">' +
        '<div class="inbox-empty-mark">▧</div>' +
        '<h2>No assessments yet.</h2>' +
        '<p>Send a client to <a href="assessment.html">/assessment.html</a> and their brief will show up here.</p>' +
        '</div>';
      return;
    }

    root.innerHTML = '<div class="inbox-grid">' + list.map(function (record) {
      var s = scoresFor(record);
      var c = record.contact || {};
      var status = record.status || 'New';
      var options = STATUSES.map(function (st) {
        return '<option value="' + esc(st) + '"' + (st === status ? ' selected' : '') + '>' + esc(st) + '</option>';
      }).join('');
      return '<article class="inbox-card">' +
        '<div class="inbox-card-top">' +
          '<div><strong>' + esc(c.name || 'New submission') + '</strong>' +
          '<span>' + esc(record.city || '—') + ' · ' + esc(fmtDate(record.createdAt)) + '</span></div>' +
          '<span class="status-chip status-' + esc(status.toLowerCase().replace(/\s+/g, '-')) + '">' + esc(status) + '</span>' +
        '</div>' +
        '<div class="inbox-metrics">' +
          '<div><span>Next step</span><b>' + esc(s.nextStep.label) + '</b></div>' +
          '<div><span>Urgency</span><b class="' + urgencyClass(s.urgency) + '">' + esc(s.urgency) + '</b></div>' +
          '<div><span>Complexity</span><b>' + esc(s.complexity) + '</b></div>' +
          '<div><span>Photos</span><b>' + photoCount(record) + '</b></div>' +
        '</div>' +
        '<div class="inbox-card-actions">' +
          '<a class="btn btn-primary" href="brief.html?id=' + encodeURIComponent(record.id) + '">Open brief</a>' +
          '<label class="status-select">Status ' +
            '<select data-id="' + esc(record.id) + '">' + options + '</select>' +
          '</label>' +
        '</div>' +
      '</article>';
    }).join('') + '</div>';

    Array.prototype.slice.call(root.querySelectorAll('select[data-id]')).forEach(function (sel) {
      sel.addEventListener('change', function () {
        var id = sel.getAttribute('data-id');
        var list2 = loadAssessments();
        for (var i = 0; i < list2.length; i++) {
          if (list2[i].id === id) { list2[i].status = sel.value; break; }
        }
        saveAssessments(list2);
        render();
      });
    });
  }

  render();
})();
