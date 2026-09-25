// Node self-test: runs the scoring fixtures and exits non-zero on any failure.
// Usage: node scoring.selftest.js  (or: npm run test:scoring)
var assert = require('assert');
var score = require('./scoring.js').score;
var fixtures = require('./scoring.fixtures.js');

var failures = 0;
fixtures.forEach(function (f) {
  var r = score(f.assessment);
  var diffs = [];
  Object.keys(f.expect).forEach(function (k) {
    var got = k === 'nextStep' ? r.nextStep.key : r[k];
    if (got !== f.expect[k]) diffs.push(k + ': expected ' + f.expect[k] + ', got ' + got);
  });
  if (diffs.length) { failures++; console.error('FAIL — ' + f.name + '\n      ' + diffs.join('\n      ')); }
  else console.log('PASS — ' + f.name);
});

// A configurable-settings smoke check: relaxing the photo ratio should let a
// contact-with-one-photo record reach "Complete".
var partial = {
  contact: { name: 'A', email: 'a@b.com' },
  bedrooms: 1,
  photos: { 'Front / entry': ['x'] }
};
assert.strictEqual(score(partial).infoQuality, 'Partial', 'default ratio -> Partial');
assert.strictEqual(score(partial, { qualification: { completePhotoRatio: 0.1 } }).infoQuality, 'Complete', 'low ratio -> Complete');
console.log('PASS — configurable qualification settings');

if (failures) { console.error('\n' + failures + ' failure(s)'); process.exit(1); }
console.log('\nAll scoring checks passed.');
