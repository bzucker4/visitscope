// Provider access gate: a single shared passcode exchanged for a signed,
// HTTP-only session cookie. No user accounts, no roles.
'use strict';

var crypto = require('crypto');
var http = require('./http');

var COOKIE = 'vs_session';
var MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secret() {
  // SESSION_SECRET signs cookies; fall back to the passcode so local dev works
  // even if only PROVIDER_PASSCODE is set.
  return process.env.SESSION_SECRET || process.env.PROVIDER_PASSCODE || 'visitscope-dev-secret';
}

function b64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function sign(body) {
  return b64url(crypto.createHmac('sha256', secret()).update(body).digest());
}

function issueToken() {
  var payload = b64url(JSON.stringify({ exp: Date.now() + MAX_AGE * 1000 }));
  return payload + '.' + sign(payload);
}

function verifyToken(token) {
  if (!token || token.indexOf('.') === -1) return false;
  var parts = token.split('.');
  var payload = parts[0], sig = parts[1];
  var expected = sign(payload);
  // constant-time compare
  if (sig.length !== expected.length) return false;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  try {
    var data = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'));
    return data.exp && data.exp > Date.now();
  } catch (e) { return false; }
}

function cookieHeader(token) {
  var secure = process.env.NETLIFY_DEV ? '' : ' Secure;';
  return COOKIE + '=' + token + '; Path=/; HttpOnly;' + secure + ' SameSite=Lax; Max-Age=' + MAX_AGE;
}
function clearCookieHeader() {
  return COOKIE + '=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0';
}

function isProvider(event) {
  var cookies = http.parseCookies(event);
  return verifyToken(cookies[COOKIE]);
}

// Guard for gated endpoints. Returns a 401 response object if not authed, else null.
function requireProvider(event) {
  if (isProvider(event)) return null;
  return http.json(401, { error: 'unauthorized' });
}

function passcodeMatches(input) {
  var expected = process.env.PROVIDER_PASSCODE || '';
  if (!expected) return false;
  var a = Buffer.from(String(input || ''));
  var b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = {
  COOKIE: COOKIE,
  issueToken: issueToken,
  cookieHeader: cookieHeader,
  clearCookieHeader: clearCookieHeader,
  isProvider: isProvider,
  requireProvider: requireProvider,
  passcodeMatches: passcodeMatches
};
