// GET /api/get?id=<id> — return one assessment as a brief-ready record.
// Requires the provider session cookie. Unauthenticated callers get a neutral
// "received" acknowledgement — never family data.
'use strict';

var http = require('./_lib/http');
var auth = require('./_lib/auth');
var store = require('./_lib/store');

exports.handler = async function (event) {
  // Family / public: acknowledge receipt only, reveal nothing (and don't confirm existence).
  if (!auth.isProvider(event)) return http.json(200, { received: true });

  var id = (event.queryStringParameters && event.queryStringParameters.id) || '';
  if (!id) return http.json(400, { error: 'id required' });

  var record = await store.getRecord(id);
  if (!record) return http.json(404, { error: 'not found' });

  var photos = {};
  Object.keys(record.photos || {}).forEach(function (slot) {
    photos[slot] = (record.photos[slot] || []).map(function (ref) {
      return '/api/photo?key=' + encodeURIComponent(ref.key);
    });
  });

  var out = Object.assign({}, record, { photos: photos });
  delete out.idempotencyKey;
  delete out.hash;
  return http.json(200, { record: out });
};
