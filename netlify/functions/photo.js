// GET /api/photo?key=<blobKey> — stream a stored photo. Keys are opaque (<id>/<n>).
'use strict';

var http = require('./_lib/http');
var auth = require('./_lib/auth');
var store = require('./_lib/store');

exports.handler = async function (event) {
  // Photos are family data — provider session required.
  var denied = auth.requireProvider(event);
  if (denied) return denied;

  var key = (event.queryStringParameters && event.queryStringParameters.key) || '';
  if (!key) return http.json(400, { error: 'key required' });

  var photo = await store.getPhoto(key);
  if (!photo) return http.json(404, { error: 'not found' });

  var base64 = Buffer.from(photo.data).toString('base64');
  return {
    statusCode: 200,
    headers: { 'content-type': photo.contentType, 'cache-control': 'private, max-age=3600' },
    body: base64,
    isBase64Encoded: true
  };
};
