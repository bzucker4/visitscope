// GET /api/list — provider inbox summaries. Gated by the provider session cookie.
'use strict';

var http = require('./_lib/http');
var auth = require('./_lib/auth');
var store = require('./_lib/store');

exports.handler = async function (event) {
  var denied = auth.requireProvider(event);
  if (denied) return denied;

  var index = await store.getIndex();
  return http.json(200, { submissions: index });
};
