// Netlify Blobs storage for VisitScope.
//
// Stores:
//   "assessments" — full records under key <id>, plus an "__index__" summary list,
//                   plus dedupe keys "idemp:<key>".
//   "photos"      — uploaded image bytes under key "<id>/<n>" with metadata.
//   "config"      — provider settings under key "settings".
//
// In production, Netlify Blobs is configured automatically. For local dev/tests
// where the Blobs environment isn't provisioned (e.g. `netlify dev --offline`),
// we transparently fall back to a filesystem-backed store with the same interface.
'use strict';

var blobs = require('@netlify/blobs');
var fs = require('fs');
var os = require('os');
var path = require('path');

// ---- filesystem fallback (dev/test only) --------------------------------
function makeLocalStore(name) {
  var base = process.env.BLOBS_LOCAL_DIR || path.join(os.tmpdir(), 'vs-blobs');
  var dir = path.join(base, name);
  fs.mkdirSync(dir, { recursive: true });
  function file(key) { return path.join(dir, encodeURIComponent(key)); }
  function toBuffer(value) {
    if (Buffer.isBuffer(value)) return value;
    if (value instanceof ArrayBuffer) return Buffer.from(value);
    if (ArrayBuffer.isView(value)) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
    return Buffer.from(String(value));
  }
  return {
    async get(key, opts) {
      try {
        var b = fs.readFileSync(file(key));
        if (opts && opts.type === 'json') return JSON.parse(b.toString('utf8'));
        if (opts && opts.type === 'arrayBuffer') return b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
        return b.toString('utf8');
      } catch (e) { return null; }
    },
    async set(key, value, opts) {
      fs.writeFileSync(file(key), toBuffer(value));
      if (opts && opts.metadata) fs.writeFileSync(file(key) + '.meta.json', JSON.stringify(opts.metadata));
    },
    async setJSON(key, obj) { fs.writeFileSync(file(key), JSON.stringify(obj)); },
    async getWithMetadata(key, opts) {
      try {
        var b = fs.readFileSync(file(key));
        var meta = {};
        try { meta = JSON.parse(fs.readFileSync(file(key) + '.meta.json').toString('utf8')); } catch (e) {}
        var data = (opts && opts.type === 'arrayBuffer')
          ? b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength)
          : b.toString('utf8');
        return { data: data, metadata: meta };
      } catch (e) { return null; }
    }
  };
}

var USE_LOCAL = null;
function store(name) {
  if (USE_LOCAL === null) {
    try { blobs.getStore('__probe__'); USE_LOCAL = false; }
    catch (e) { USE_LOCAL = true; }
  }
  return USE_LOCAL ? makeLocalStore(name) : blobs.getStore(name);
}

function assessments() { return store('assessments'); }
function photos() { return store('photos'); }
function config() { return store('config'); }

var INDEX_KEY = '__index__';

async function getIndex() {
  try {
    var list = await assessments().get(INDEX_KEY, { type: 'json' });
    return Array.isArray(list) ? list : [];
  } catch (e) { return []; }
}
async function setIndex(list) { await assessments().setJSON(INDEX_KEY, list); }
async function addSummary(summary) {
  var list = await getIndex();
  list.unshift(summary);
  await setIndex(list);
}
async function updateSummaryStatus(id, status) {
  var list = await getIndex();
  var changed = false;
  for (var i = 0; i < list.length; i++) {
    if (list[i].id === id) { list[i].status = status; changed = true; break; }
  }
  if (changed) await setIndex(list);
  return changed;
}

async function getRecord(id) {
  try { return await assessments().get(id, { type: 'json' }); } catch (e) { return null; }
}
async function setRecord(id, record) { await assessments().setJSON(id, record); }

async function getIdempotent(key) {
  if (!key) return null;
  try { return await assessments().get('idemp:' + key, { type: 'text' }); } catch (e) { return null; }
}
async function setIdempotent(key, id) {
  if (!key) return;
  await assessments().set('idemp:' + key, id);
}

// Per-IP submit rate limiting (timestamps stored under "rl:<ip>").
async function getRate(ip) {
  try { var a = await assessments().get('rl:' + ip, { type: 'json' }); return Array.isArray(a) ? a : []; }
  catch (e) { return []; }
}
async function setRate(ip, times) { await assessments().setJSON('rl:' + ip, times); }

async function savePhoto(id, n, buffer, contentType, slot) {
  var key = id + '/' + n;
  await photos().set(key, buffer, { metadata: { contentType: contentType || 'image/jpeg', slot: slot || '' } });
  return key;
}
async function getPhoto(key) {
  try {
    var res = await photos().getWithMetadata(key, { type: 'arrayBuffer' });
    if (!res) return null;
    return { data: res.data, contentType: (res.metadata && res.metadata.contentType) || 'image/jpeg' };
  } catch (e) { return null; }
}

module.exports = {
  assessments: assessments,
  photos: photos,
  config: config,
  getIndex: getIndex,
  setIndex: setIndex,
  addSummary: addSummary,
  updateSummaryStatus: updateSummaryStatus,
  getRecord: getRecord,
  setRecord: setRecord,
  getIdempotent: getIdempotent,
  setIdempotent: setIdempotent,
  getRate: getRate,
  setRate: setRate,
  savePhoto: savePhoto,
  getPhoto: getPhoto
};
