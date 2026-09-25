// Small HTTP helpers shared by VisitScope functions.
'use strict';

function json(statusCode, obj, extraHeaders) {
  return {
    statusCode: statusCode,
    headers: Object.assign({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }, extraHeaders || {}),
    body: JSON.stringify(obj)
  };
}

function parseBody(event) {
  if (!event || !event.body) return {};
  try {
    var raw = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
    return JSON.parse(raw || '{}');
  } catch (e) { return {}; }
}

function getHeader(event, name) {
  var h = event.headers || {};
  return h[name] || h[name.toLowerCase()] || h[name.toUpperCase()] || '';
}

function parseCookies(event) {
  var raw = getHeader(event, 'cookie');
  var out = {};
  raw.split(';').forEach(function (part) {
    var i = part.indexOf('=');
    if (i > -1) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function method(event) {
  return (event.httpMethod || (event.requestContext && event.requestContext.http && event.requestContext.http.method) || 'GET').toUpperCase();
}

module.exports = { json: json, parseBody: parseBody, getHeader: getHeader, parseCookies: parseCookies, method: method };
