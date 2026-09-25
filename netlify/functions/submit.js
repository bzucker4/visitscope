// POST /api/submit — persist a homeowner assessment.
// Scores it (shared scoring.js), stores photos in Blobs, dedupes, rate-limits,
// caps photo count/size, and emails the provider.
'use strict';

var crypto = require('crypto');
var http = require('./_lib/http');
var store = require('./_lib/store');
var settingsLib = require('./_lib/settings');
var email = require('./_lib/email');
var scoring = require('../../scoring.js');

// Photo + payload caps. Netlify synchronous functions hard-limit the request
// body at ~6 MB (base64), so we keep our graceful caps below that: oversize
// requests get a friendly 413 instead of a dropped connection.
var MAX_PER_SLOT = 6;
var MAX_TOTAL_PHOTOS = 18;
var MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;  // 1.5 MB per photo (client compresses to ~150 KB)
var MAX_BODY_BYTES = 5 * 1024 * 1024;     // 5 MB total request body (< platform limit)

// Dedupe + rate limit
var DEDUPE_WINDOW_MS = 10 * 60 * 1000;
var RATE_WINDOW_MS = 10 * 60 * 1000;
var RATE_MAX_PER_WINDOW = 5;
var RATE_DAY_MS = 24 * 60 * 60 * 1000;
var RATE_MAX_PER_DAY = 30;

function genId() { return 'vs-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7); }

function contentHash(p) {
  var c = p.contact || {};
  var basis = [c.email || '', c.name || '', (p.helpTypes || []).join(','), p.timeline || '', p.contents || '', p.situation || ''].join('|').toLowerCase();
  return crypto.createHash('sha256').update(basis).digest('hex').slice(0, 24);
}

function decodeDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  var m = dataUrl.match(/^data:([^;,]+)?(;base64)?,(.*)$/);
  if (!m) return null;
  var contentType = m[1] || 'application/octet-stream';
  var isB64 = !!m[2];
  var buf = isB64 ? Buffer.from(m[3], 'base64') : Buffer.from(decodeURIComponent(m[3]), 'utf8');
  return { contentType: contentType, buffer: buf };
}

function baseUrlFrom(event) {
  if (process.env.URL) return process.env.URL;
  var proto = http.getHeader(event, 'x-forwarded-proto') || 'https';
  var host = http.getHeader(event, 'host');
  return host ? proto + '://' + host : '';
}

function clientIp(event) {
  return http.getHeader(event, 'x-nf-client-connection-ip') ||
    (http.getHeader(event, 'x-forwarded-for') || '').split(',')[0].trim() ||
    'unknown';
}

function bodyByteLength(event) {
  if (!event.body) return 0;
  if (event.isBase64Encoded) return Math.floor(event.body.length * 3 / 4);
  return Buffer.byteLength(event.body, 'utf8');
}

exports.handler = async function (event) {
  if (http.method(event) !== 'POST') return http.json(405, { error: 'method not allowed' });

  // Reject oversized bodies up front.
  if (bodyByteLength(event) > MAX_BODY_BYTES) {
    return http.json(413, { error: 'Submission too large. Please use fewer or smaller photos.' });
  }

  var p = http.parseBody(event);
  var contact = p.contact || {};
  var name = (contact.name || '').trim();
  var hasChannel = (contact.email || '').trim() || (contact.phone || '').trim();
  if (!name || !hasChannel) return http.json(400, { error: 'name and an email or phone are required' });

  // Idempotent replays never count against the rate limit.
  var existing = await store.getIdempotent(p.idempotencyKey);
  if (existing) return http.json(200, { id: existing, duplicate: true });

  // Per-IP rate limit.
  var ip = clientIp(event);
  var now = Date.now();
  var times = (await store.getRate(ip)).filter(function (t) { return now - t < RATE_DAY_MS; });
  var inWindow = times.filter(function (t) { return now - t < RATE_WINDOW_MS; }).length;
  if (inWindow >= RATE_MAX_PER_WINDOW || times.length >= RATE_MAX_PER_DAY) {
    return http.json(429, { error: 'Too many submissions from this connection. Please try again later.' },
      { 'retry-after': String(Math.ceil(RATE_WINDOW_MS / 1000)) });
  }

  // Content-hash dedupe window (double-submit protection beyond idempotency key).
  var hash = contentHash(p);
  var index = await store.getIndex();
  var recent = index.filter(function (s) {
    return s.hash === hash && s.createdAt && (now - new Date(s.createdAt).getTime()) < DEDUPE_WINDOW_MS;
  })[0];
  if (recent) {
    if (p.idempotencyKey) await store.setIdempotent(p.idempotencyKey, recent.id);
    return http.json(200, { id: recent.id, duplicate: true });
  }

  var settings = await settingsLib.getSettings();
  var scores = scoring.score(p, settings);
  var id = genId();

  // Store photos in Blobs (capped by count and per-photo size); keep only refs.
  var photoRefs = {};
  var total = 0;
  var skipped = 0;
  var photosIn = p.photos && typeof p.photos === 'object' ? p.photos : {};
  var slots = Object.keys(photosIn);
  for (var si = 0; si < slots.length; si++) {
    var slot = slots[si];
    var arr = Array.isArray(photosIn[slot]) ? photosIn[slot] : [];
    for (var pi = 0; pi < arr.length && pi < MAX_PER_SLOT && total < MAX_TOTAL_PHOTOS; pi++) {
      var decoded = decodeDataUrl(arr[pi]);
      if (!decoded) { skipped++; continue; }
      if (decoded.buffer.length > MAX_PHOTO_BYTES) { skipped++; continue; }
      var key = await store.savePhoto(id, total, decoded.buffer, decoded.contentType, slot);
      if (!photoRefs[slot]) photoRefs[slot] = [];
      photoRefs[slot].push({ key: key, type: decoded.contentType });
      total++;
    }
  }

  var record = {
    id: id,
    createdAt: new Date(now).toISOString(),
    status: 'New',
    helpTypes: p.helpTypes || [],
    situation: p.situation || '',
    situationNote: p.situationNote || '',
    propertyType: p.propertyType || '',
    bedrooms: p.bedrooms || '',
    yearsOccupied: p.yearsOccupied || '',
    city: p.city || '',
    contents: p.contents || '',
    sorting: p.sorting || '',
    extraAreas: p.extraAreas || [],
    access: p.access || '',
    timeline: p.timeline || '',
    selling: p.selling || '',
    decisionMakers: p.decisionMakers || '',
    outOfTown: p.outOfTown || '',
    contact: { name: name, phone: contact.phone || '', email: contact.email || '' },
    services: p.services || [],
    photos: photoRefs,
    photoCount: total,
    photosSkipped: skipped,
    notes: p.notes || '',
    scores: scores,
    idempotencyKey: p.idempotencyKey || '',
    hash: hash
  };

  await store.setRecord(id, record);
  await store.addSummary({
    id: id, createdAt: record.createdAt, name: name, city: record.city,
    status: 'New', urgency: scores.urgency, complexity: scores.complexity,
    nextStepLabel: scores.nextStep.label, nextStepKey: scores.nextStep.key,
    photoCount: total, hash: hash
  });
  if (p.idempotencyKey) await store.setIdempotent(p.idempotencyKey, id);

  // Record this submission's timestamp for rate limiting.
  times.push(now);
  await store.setRate(ip, times);

  var mail = await email.notifyNewSubmission(record, settings, baseUrlFrom(event));

  return http.json(200, { id: id, emailed: !!mail.sent, emailStatus: mail, photosStored: total, photosSkipped: skipped });
};
