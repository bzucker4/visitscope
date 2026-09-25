// New-submission email notification via Resend REST API (uses global fetch).
// Best-effort: never throws; returns a small status object.
'use strict';

function esc(v) {
  return String(v == null ? '' : v).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; });
}

async function notifyNewSubmission(record, settings, baseUrl) {
  var apiKey = process.env.RESEND_API_KEY;
  var to = (settings && settings.notifyEmail) || process.env.NOTIFY_EMAIL || '';
  if (!apiKey) return { sent: false, skipped: true, reason: 'RESEND_API_KEY not set' };
  if (!to) return { sent: false, skipped: true, reason: 'notifyEmail not configured' };

  var from = process.env.RESEND_FROM || 'VisitScope <onboarding@resend.dev>';
  var c = record.contact || {};
  var s = record.scores || {};
  var brand = (settings && settings.businessName) || 'VisitScope';
  var briefUrl = (baseUrl || process.env.URL || '') + '/brief.html?id=' + encodeURIComponent(record.id);

  var rows = [
    ['Name', c.name], ['Email', c.email], ['Phone', c.phone], ['City', record.city],
    ['Help', (record.helpTypes || []).join(', ')], ['Situation', record.situation],
    ['Timeline', record.timeline], ['Preparing to sell', record.selling],
    ['Recommended next step', s.nextStep && s.nextStep.label],
    ['Urgency', s.urgency], ['Complexity', s.complexity], ['Info quality', s.infoQuality],
    ['Photos', record.photoCount]
  ];
  var html = '<div style="font-family:Inter,Arial,sans-serif;color:#25221f">' +
    '<h2 style="font-family:Georgia,serif;font-weight:500">New ' + esc(brand) + ' assessment</h2>' +
    '<table style="border-collapse:collapse">' +
    rows.map(function (r) {
      return '<tr><td style="padding:4px 12px 4px 0;color:#756d64">' + esc(r[0]) + '</td><td style="padding:4px 0"><b>' + esc(r[1] || '—') + '</b></td></tr>';
    }).join('') +
    '</table>' +
    '<p style="margin-top:16px"><a href="' + esc(briefUrl) + '" style="background:#765d4f;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none">Open the project brief</a></p>' +
    '</div>';

  try {
    var resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' },
      body: JSON.stringify({ from: from, to: [to], subject: 'New ' + brand + ' assessment — ' + (c.name || 'New submission'), html: html })
    });
    if (!resp.ok) {
      var text = await resp.text();
      return { sent: false, error: 'resend ' + resp.status + ': ' + text.slice(0, 200) };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, error: String(e && e.message || e) };
  }
}

module.exports = { notifyNewSubmission: notifyNewSubmission };
