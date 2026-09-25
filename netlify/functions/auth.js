// Provider access gate.
//   GET  /api/auth            -> { authed: bool }
//   POST /api/auth {passcode} -> sets session cookie on success
//   POST /api/auth {logout:1} -> clears session cookie
'use strict';

var http = require('./_lib/http');
var auth = require('./_lib/auth');

exports.handler = async function (event) {
  var m = http.method(event);

  if (m === 'GET') {
    return http.json(200, { authed: auth.isProvider(event) });
  }

  if (m === 'POST') {
    var body = http.parseBody(event);
    if (body.logout) {
      return http.json(200, { authed: false }, { 'set-cookie': auth.clearCookieHeader() });
    }
    if (!process.env.PROVIDER_PASSCODE) {
      return http.json(500, { error: 'provider passcode not configured on the server' });
    }
    if (!auth.passcodeMatches(body.passcode)) {
      return http.json(401, { error: 'incorrect passcode' });
    }
    return http.json(200, { authed: true }, { 'set-cookie': auth.cookieHeader(auth.issueToken()) });
  }

  return http.json(405, { error: 'method not allowed' });
};
