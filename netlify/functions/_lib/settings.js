// Provider-configurable settings (non-secret). Stored in the "config" blob store
// under key "settings"; falls back to defaults + a few env overrides.
'use strict';

var store = require('./store');

var DEFAULTS = {
  businessName: 'VisitScope',
  brandName: 'VisitScope',
  businessInitials: 'V',
  logoUrl: '',
  notifyEmail: '',
  services: ['Sorting', 'Downsizing', 'Packing', 'Donation coordination', 'Removal', 'Home sale prep', 'Senior move management'],
  qualification: {
    urgentTimelines: ['ASAP', '30 days'],
    completePhotoRatio: 0.6,
    heavyIsComplex: true,
    minDecisionMakersComplex: 3,
    minExtraAreasComplex: 3
  }
};

function withEnvOverrides(s) {
  var out = Object.assign({}, s);
  if (process.env.BUSINESS_NAME) { out.businessName = process.env.BUSINESS_NAME; out.brandName = process.env.BUSINESS_NAME; }
  if (process.env.NOTIFY_EMAIL) out.notifyEmail = process.env.NOTIFY_EMAIL;
  if (process.env.LOGO_URL) out.logoUrl = process.env.LOGO_URL;
  return out;
}

function deepMerge(base, patch) {
  var out = Array.isArray(base) ? base.slice() : Object.assign({}, base);
  if (!patch || typeof patch !== 'object') return out;
  Object.keys(patch).forEach(function (k) {
    if (patch[k] && typeof patch[k] === 'object' && !Array.isArray(patch[k])) {
      out[k] = deepMerge(base[k] || {}, patch[k]);
    } else if (patch[k] !== undefined) {
      out[k] = patch[k];
    }
  });
  return out;
}

// Precedence: DEFAULTS < env overrides < provider-saved settings.
// So the inbox Settings panel always wins; env vars are just deploy-time defaults.
async function getSettings() {
  var saved = null;
  try { saved = await store.config().get('settings', { type: 'json' }); } catch (e) { saved = null; }
  var base = withEnvOverrides(JSON.parse(JSON.stringify(DEFAULTS)));
  return deepMerge(base, saved || {});
}

// Only allow known keys to be written by the provider.
function sanitize(patch) {
  var clean = {};
  ['businessName', 'brandName', 'businessInitials', 'logoUrl', 'notifyEmail'].forEach(function (k) {
    if (typeof patch[k] === 'string') clean[k] = patch[k].slice(0, 300);
  });
  if (Array.isArray(patch.services)) {
    clean.services = patch.services.filter(function (s) { return typeof s === 'string'; }).slice(0, 30).map(function (s) { return s.slice(0, 60); });
  }
  if (patch.qualification && typeof patch.qualification === 'object') {
    var q = {};
    var src = patch.qualification;
    if (Array.isArray(src.urgentTimelines)) q.urgentTimelines = src.urgentTimelines.filter(function (t) { return typeof t === 'string'; });
    if (typeof src.completePhotoRatio === 'number') q.completePhotoRatio = Math.max(0, Math.min(1, src.completePhotoRatio));
    if (typeof src.heavyIsComplex === 'boolean') q.heavyIsComplex = src.heavyIsComplex;
    if (typeof src.minDecisionMakersComplex === 'number') q.minDecisionMakersComplex = Math.max(1, Math.round(src.minDecisionMakersComplex));
    if (typeof src.minExtraAreasComplex === 'number') q.minExtraAreasComplex = Math.max(1, Math.round(src.minExtraAreasComplex));
    clean.qualification = q;
  }
  return clean;
}

async function saveSettings(patch) {
  var current = null;
  try { current = await store.config().get('settings', { type: 'json' }); } catch (e) { current = null; }
  var merged = deepMerge(current || {}, sanitize(patch || {}));
  await store.config().setJSON('settings', merged);
  return await getSettings();
}

module.exports = { DEFAULTS: DEFAULTS, getSettings: getSettings, saveSettings: saveSettings };
