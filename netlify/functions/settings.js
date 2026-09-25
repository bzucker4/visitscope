// Provider-configurable settings.
//   GET  /api/settings  -> branding + services + qualification (notifyEmail only when authed)
//   POST /api/settings  -> save settings (gated)
'use strict';

var http = require('./_lib/http');
var auth = require('./_lib/auth');
var settingsLib = require('./_lib/settings');

exports.handler = async function (event) {
  var m = http.method(event);

  if (m === 'GET') {
    var s = await settingsLib.getSettings();
    var authed = auth.isProvider(event);
    var out = {
      businessName: s.businessName,
      brandName: s.brandName,
      businessInitials: s.businessInitials,
      logoUrl: s.logoUrl,
      services: s.services,
      qualification: s.qualification
    };
    if (authed) out.notifyEmail = s.notifyEmail;
    return http.json(200, { settings: out, authed: authed });
  }

  if (m === 'POST') {
    var denied = auth.requireProvider(event);
    if (denied) return denied;
    var body = http.parseBody(event);
    var saved = await settingsLib.saveSettings(body.settings || body);
    return http.json(200, { settings: saved });
  }

  return http.json(405, { error: 'method not allowed' });
};
