/*
 * VisitScope scoring fixtures.
 *
 * Five representative assessments plus the expected scoring outcomes.
 * Runs in the browser (window.VisitScopeFixtures) or Node (module.exports),
 * and is exercised by scoring.test.html.
 *
 * `expect` only pins the fields the product spec commits to; the runner
 * compares those and ignores the rest.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
  root.VisitScopeFixtures = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // Tiny 1x1 transparent PNG — stands in for an uploaded photo in fixtures.
  var IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  function fill(slots) {
    var photos = {};
    slots.forEach(function (slot) { photos[slot] = [IMG]; });
    return photos;
  }

  var fixtures = [
    {
      name: '1. Jane Miller equivalent — complete, urgent, complex',
      assessment: {
        helpTypes: ['Senior move or relocation', 'Downsizing'],
        situation: 'Parent moving to assisted living',
        propertyType: 'Single-family home',
        bedrooms: 4,
        yearsOccupied: 38,
        city: 'Rochester, NY',
        contents: 'Heavy',
        sorting: 'Not started',
        extraAreas: ['Basement', 'Attic', 'Garage'],
        access: 'Basement stairs',
        timeline: '30 days',
        selling: 'Yes',
        decisionMakers: 3,
        outOfTown: 2,
        contact: { name: 'Jane Miller', phone: '(555) 555-0148', email: 'jane@example.com' },
        services: ['Sorting', 'Downsizing', 'Packing', 'Donation coordination', 'Removal', 'Home sale prep'],
        photos: fill(['Front / entry', 'Living room', 'Kitchen', 'Primary bedroom', 'Most challenging space', 'Basement', 'Garage', 'Attic']),
        notes: 'Two siblings live out of state. Realtor wants the home ready next month.'
      },
      expect: { readiness: 'High', complexity: 'High', urgency: 'High', infoQuality: 'Complete', nextStep: 'onsite' }
    },

    {
      name: '2. Small 1BR, light contents, flexible timing, good photos',
      assessment: {
        helpTypes: ['Professional organizing'],
        situation: 'Getting organized',
        propertyType: 'Apartment',
        bedrooms: 1,
        yearsOccupied: 6,
        city: 'Ithaca, NY',
        contents: 'Light',
        sorting: 'Mostly done',
        extraAreas: [],
        access: '',
        timeline: 'Flexible',
        selling: 'No',
        decisionMakers: 1,
        outOfTown: 0,
        contact: { name: 'Sam Rivera', phone: '(555) 555-0112', email: 'sam@example.com' },
        services: ['Sorting'],
        photos: fill(['Front / entry', 'Living room', 'Kitchen', 'Primary bedroom', 'Most challenging space']),
        notes: ''
      },
      expect: { complexity: 'Low', urgency: 'Low', infoQuality: 'Complete', nextStep: 'call' }
    },

    {
      name: '3. Huge house, no photos, almost no answers',
      assessment: {
        helpTypes: [],
        situation: '',
        propertyType: '',
        bedrooms: 6,
        yearsOccupied: '',
        city: '',
        contents: '',
        sorting: '',
        extraAreas: [],
        access: '',
        timeline: '',
        selling: '',
        decisionMakers: '',
        outOfTown: '',
        contact: {},
        services: [],
        photos: {},
        notes: ''
      },
      expect: { readiness: 'Low', infoQuality: 'Thin', nextStep: 'more-info' }
    },

    {
      name: '4. 30-day sale, heavy basement + garage, 3 siblings',
      assessment: {
        helpTypes: ['Estate transition', 'Preparing a home for sale'],
        situation: 'Estate after a death',
        propertyType: 'Single-family home',
        bedrooms: 3,
        yearsOccupied: 25,
        city: 'Buffalo, NY',
        contents: 'Heavy',
        sorting: 'In progress',
        extraAreas: ['Basement', 'Garage'],
        access: 'Packed garage, narrow basement stairs',
        timeline: '30 days',
        selling: 'Yes',
        decisionMakers: 3,
        outOfTown: 1,
        contact: { name: 'Dana Fox', phone: '(555) 555-0175', email: 'dana@example.com' },
        services: ['Sorting', 'Removal', 'Home sale prep'],
        photos: {},
        notes: 'Three siblings sharing decisions; house lists next month.'
      },
      expect: { complexity: 'High', urgency: 'High', nextStep: 'onsite' }
    },

    {
      name: '5. Organizing only, 2 rooms, already sorted',
      assessment: {
        helpTypes: ['Professional organizing'],
        situation: 'Downsizing in place',
        propertyType: 'Condo',
        bedrooms: 2,
        yearsOccupied: 12,
        city: 'Syracuse, NY',
        contents: 'Light',
        sorting: 'Mostly done',
        extraAreas: [],
        access: '',
        timeline: 'Flexible',
        selling: 'No',
        decisionMakers: 1,
        outOfTown: 0,
        contact: { name: 'Pat Lee', phone: '(555) 555-0130', email: 'pat@example.com' },
        services: ['Sorting'],
        photos: fill(['Front / entry', 'Living room']),
        notes: 'Just two rooms to finish.'
      },
      expect: { complexity: 'Low', urgency: 'Low', nextStep: 'call' }
    }
  ];

  return fixtures;
});
