// POST /api/status {id, status} — update an inquiry's status. Gated.
'use strict';

var http = require('./_lib/http');
var auth = require('./_lib/auth');
var store = require('./_lib/store');

var ALLOWED = ['New', 'Call first', 'Schedule', 'Refer', 'Done'];

exports.handler = async function (event) {
  if (http.method(event) !== 'POST') return http.json(405, { error: 'method not allowed' });
  var denied = auth.requireProvider(event);
  if (denied) return denied;

  var body = http.parseBody(event);
  var id = body.id;
  var status = body.status;
  if (!id || ALLOWED.indexOf(status) === -1) return http.json(400, { error: 'valid id and status required' });

  var record = await store.getRecord(id);
  if (!record) return http.json(404, { error: 'not found' });

  record.status = status;
  await store.setRecord(id, record);
  await store.updateSummaryStatus(id, status);

  return http.json(200, { id: id, status: status });
};
