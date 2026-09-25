/*
 * VisitScope scoring — pure, dependency-free.
 *
 * Usage (browser):  const result = VisitScopeScoring.score(assessment)
 * Usage (node/test): const { score } = require('./scoring.js')
 *
 * Input:  an assessment record (see data shape in README / app.js)
 * Output: { readiness, complexity, urgency, infoQuality, signals, services, nextStep }
 *
 * The function never mutates its input.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.VisitScopeScoring = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Canonical photo slot names. These strings must match everywhere they are
  // used (assessment form, scoring, brief rendering) so records stay consistent.
  var BASE_SLOTS = ['Front / entry', 'Living room', 'Kitchen', 'Most challenging space'];
  var AREA_SLOTS = ['Basement', 'Garage', 'Attic'];

  function toInt(value) {
    var n = parseInt(value, 10);
    return isNaN(n) ? 0 : n;
  }

  function arr(value) {
    return Array.isArray(value) ? value : [];
  }

  // The set of photo slots we actually ask this client for, given their answers.
  function requestedPhotoSlots(a) {
    a = a || {};
    var slots = ['Front / entry', 'Living room', 'Kitchen'];
    if (toInt(a.bedrooms) > 0) slots.push('Primary bedroom');
    slots.push('Most challenging space');
    var extra = arr(a.extraAreas);
    AREA_SLOTS.forEach(function (name) {
      if (extra.indexOf(name) !== -1) slots.push(name);
    });
    return slots;
  }

  function filledPhotoSlots(a, slots) {
    var photos = (a && a.photos) || {};
    return slots.filter(function (slot) {
      return Array.isArray(photos[slot]) && photos[slot].length > 0;
    });
  }

  function hasContact(a) {
    var c = (a && a.contact) || {};
    return !!(c.name && (c.email || c.phone));
  }

  // How many of the core project fields the family actually answered.
  function answeredDepth(a) {
    a = a || {};
    var checks = [
      arr(a.helpTypes).length > 0,
      !!a.situation,
      !!a.propertyType,
      !!a.contents,
      !!a.sorting,
      !!a.timeline,
      arr(a.services).length > 0,
      hasContact(a)
    ];
    return checks.filter(Boolean).length;
  }

  // Conservative "out of scope" hook. Kept intentionally strict so refer is rare.
  // Configurable qualification knobs. Defaults reproduce the original behaviour.
  var DEFAULT_Q = {
    urgentTimelines: ['ASAP', '30 days'],
    completePhotoRatio: 0.6,
    heavyIsComplex: true,
    minDecisionMakersComplex: 3,
    minExtraAreasComplex: 3
  };
  function mergeQ(settings) {
    var q = {};
    Object.keys(DEFAULT_Q).forEach(function (k) { q[k] = DEFAULT_Q[k]; });
    var s = (settings && settings.qualification) || settings || {};
    Object.keys(DEFAULT_Q).forEach(function (k) { if (s[k] !== undefined && s[k] !== null) q[k] = s[k]; });
    if (!Array.isArray(q.urgentTimelines)) q.urgentTimelines = DEFAULT_Q.urgentTimelines;
    return q;
  }

  function looksOutOfScope(a) {
    a = a || {};
    var help = arr(a.helpTypes);
    var onlyOther = help.length === 1 && help[0] === 'Other';
    var noHomeContext = !a.propertyType && !a.contents && !a.sorting && arr(a.extraAreas).length === 0;
    var noServices = arr(a.services).length === 0;
    return onlyOther && noHomeContext && noServices;
  }

  var HELP_TO_SERVICES = {
    'Downsizing': ['Downsizing', 'Sorting'],
    'Senior move or relocation': ['Senior move management', 'Packing'],
    'Professional organizing': ['Sorting'],
    'Estate transition': ['Sorting', 'Removal'],
    'Estate cleanout': ['Removal', 'Donation coordination'],
    'Preparing a home for sale': ['Home sale prep', 'Removal'],
    'Sorting belongings': ['Sorting'],
    'Donation or disposal coordination': ['Donation coordination', 'Removal']
  };

  function inferServices(a) {
    var out = [];
    arr(a.helpTypes).forEach(function (help) {
      (HELP_TO_SERVICES[help] || []).forEach(function (svc) {
        if (out.indexOf(svc) === -1) out.push(svc);
      });
    });
    if (a.selling === 'Yes' && out.indexOf('Home sale prep') === -1) out.push('Home sale prep');
    if (a.contents === 'Heavy' && out.indexOf('Sorting') === -1) out.push('Sorting');
    return out;
  }

  function resolveServices(a) {
    var out = [];
    // Provider/client-selected services win; inference fills gaps.
    arr(a.services).forEach(function (svc) {
      if (svc && out.indexOf(svc) === -1) out.push(svc);
    });
    inferServices(a).forEach(function (svc) {
      if (out.indexOf(svc) === -1) out.push(svc);
    });
    return out;
  }

  function score(a, settings) {
    a = a || {};
    var q = mergeQ(settings);

    var contents = a.contents || '';
    var sorting = a.sorting || '';
    var timeline = a.timeline || '';
    var selling = a.selling || '';
    var extraAreas = arr(a.extraAreas);
    var decisionMakers = toInt(a.decisionMakers);
    var outOfTown = toInt(a.outOfTown);
    var bedrooms = toInt(a.bedrooms);

    // --- Urgency -----------------------------------------------------------
    var urgency = 'Low';
    if (q.urgentTimelines.indexOf(timeline) !== -1) {
      urgency = 'High';
    } else if (timeline === '60–90 days' || timeline === '60-90 days') {
      urgency = 'Medium';
    }
    if (selling === 'Yes') {
      if (timeline === 'Flexible' || timeline === '') {
        if (urgency === 'Low') urgency = 'Medium';
      } else {
        urgency = 'High'; // home is listing soon
      }
    }

    // --- Complexity --------------------------------------------------------
    var heavy = contents === 'Heavy' && q.heavyIsComplex;
    var notStarted = sorting === 'Not started';
    var manyAreas = extraAreas.length >= q.minExtraAreasComplex;
    var manyDecision = decisionMakers >= q.minDecisionMakersComplex;

    var complexity;
    if (heavy || notStarted || manyAreas || manyDecision) {
      complexity = 'High';
    } else if (
      contents === 'Moderate' ||
      sorting === 'In progress' ||
      extraAreas.length >= 1 ||
      decisionMakers >= 2 ||
      bedrooms >= 4
    ) {
      complexity = 'Medium';
    } else {
      complexity = 'Low';
    }

    // --- Information quality -----------------------------------------------
    var slots = requestedPhotoSlots(a);
    var filled = filledPhotoSlots(a, slots).length;
    var photoRatio = slots.length ? filled / slots.length : 0;
    var contactOk = hasContact(a);

    var infoQuality;
    if (contactOk && photoRatio >= q.completePhotoRatio) {
      infoQuality = 'Complete';
    } else if (filled > 0) {
      infoQuality = 'Partial';
    } else {
      // No photos at all.
      infoQuality = answeredDepth(a) >= 5 ? 'Partial' : 'Thin';
    }

    // --- Readiness ---------------------------------------------------------
    var readiness;
    if (infoQuality === 'Thin') {
      readiness = 'Low';
    } else if (infoQuality === 'Complete') {
      readiness = 'High';
    } else {
      readiness = 'Medium';
    }

    // --- Next step ---------------------------------------------------------
    var nextStep;
    if (looksOutOfScope(a)) {
      nextStep = {
        key: 'refer',
        label: 'Likely refer or decline',
        reason: 'The request does not look like a home-transition project we handle. Consider referring the family to a better-fit resource.'
      };
    } else if (infoQuality === 'Thin') {
      nextStep = {
        key: 'more-info',
        label: 'Request more photos or details',
        reason: 'There is not enough information yet to plan a visit. Ask for guided photos and a few more answers before scheduling.'
      };
    } else if (complexity === 'High' && (urgency === 'High' || urgency === 'Medium')) {
      nextStep = {
        key: 'onsite',
        label: 'Schedule a full in-home consultation',
        reason: 'Large, time-sensitive project with enough detail to justify an onsite assessment.'
      };
    } else {
      nextStep = {
        key: 'call',
        label: 'Call first',
        reason: complexity === 'High'
          ? 'Sizable project but timing is flexible — a call can confirm scope before booking a visit.'
          : 'Focused project or partial information — a short call is the efficient next step.'
      };
    }

    // --- Signals -----------------------------------------------------------
    var signals = [];
    if (timeline === 'ASAP') signals.push('Wants to start as soon as possible');
    else if (timeline === '30 days') signals.push('Deadline within 30 days');
    else if (timeline === '60–90 days' || timeline === '60-90 days') signals.push('Target within 60–90 days');
    if (selling === 'Yes') signals.push('Preparing property for sale');
    if (contents === 'Heavy') signals.push('Heavy contents');
    if (notStarted) signals.push('Sorting not started');
    else if (sorting === 'In progress') signals.push('Sorting in progress');
    if (bedrooms >= 4 || manyAreas) signals.push('Large property scope');
    if (extraAreas.length >= 1) signals.push(extraAreas.join(', ') + ' to cover');
    if (manyDecision) signals.push(decisionMakers + ' decision-makers');
    if (outOfTown > 0) signals.push(outOfTown + ' decision-maker' + (outOfTown > 1 ? 's' : '') + ' out of town');
    if (a.access) signals.push('Access note: ' + a.access);
    if (infoQuality === 'Complete') signals.push('Strong photo coverage');
    else if (filled === 0) signals.push('No photos yet');

    return {
      readiness: readiness,
      complexity: complexity,
      urgency: urgency,
      infoQuality: infoQuality,
      signals: signals,
      services: resolveServices(a),
      nextStep: nextStep
    };
  }

  return {
    score: score,
    requestedPhotoSlots: requestedPhotoSlots,
    filledPhotoSlots: filledPhotoSlots,
    BASE_SLOTS: BASE_SLOTS,
    AREA_SLOTS: AREA_SLOTS
  };
});
