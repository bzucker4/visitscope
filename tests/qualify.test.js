const test = require("node:test");
const assert = require("node:assert/strict");
const qualifyApi = require("../js/qualify.js");
const rules = require("../config/rules.js");

const business = {
  photos: {
    base: ["Front / entry", "Living room", "Kitchen", "Primary bedroom"],
    extraAreaMap: { Basement: "Basement", Garage: "Garage", Attic: "Attic" },
    byService: { organizer: ["Most challenging space"] },
    max: 9
  }
};

function janeMiller() {
  return {
    intake: {
      service: "downsizing",
      situation: "assisted",
      propertyType: "single-family",
      bedrooms: "4",
      years: "38",
      fullness: "heavy",
      extraAreas: ["Basement", "Garage", "Attic"],
      sorted: "no",
      needs: ["Sorting", "Downsizing", "Packing", "Donation coordination", "Removal", "Home sale preparation"],
      deadline: "month",
      salePrep: "yes",
      decisionMakers: "3",
      outOfState: "2",
      notes: "Realtor would like the house ready next month.",
      contact: { name: "Jane Miller", email: "jane@example.com", phone: "(555) 555-0148", zip: "14607" }
    },
    photos: [
      { slot: "p0", label: "Front / entry" }, { slot: "p1", label: "Living room" }, { slot: "p1", label: "Living room" },
      { slot: "p2", label: "Kitchen" }, { slot: "p2", label: "Kitchen" }, { slot: "p3", label: "Primary bedroom" }, { slot: "p3", label: "Primary bedroom" },
      { slot: "p4", label: "Basement" }, { slot: "p4", label: "Basement" }, { slot: "p4", label: "Basement" }, { slot: "p5", label: "Garage" }, { slot: "p5", label: "Garage" },
      { slot: "p6", label: "Attic" }
    ]
  };
}

test("Jane Miller intake recommends an in-home consultation", () => {
  const sample = janeMiller();
  const result = qualifyApi.qualify(sample.intake, sample.photos, rules, business);
  assert.equal(result.readiness.level, "High");
  assert.equal(result.complexity.level, "High");
  assert.equal(result.urgency.level, "High");
  assert.equal(result.informationQuality.level, "Complete");
  assert.equal(result.nextStep.id, "visit");
  assert.ok(result.signals.some((signal) => signal.id === "deadline_30"));
  assert.ok(result.signals.some((signal) => signal.id === "sorting_not_started"));
  assert.ok(result.signals.some((signal) => signal.id === "sale_prep"));
  assert.ok(result.signals.some((signal) => signal.id === "large_scope"));
  assert.equal(result.photos.filledSlots, result.photos.recommended.length);
  assert.ok(!result.missing.some((item) => item.id === "photoCoverage"));
});

test("sparse intake requests missing information", () => {
  const result = qualifyApi.qualify({
    service: "organizer",
    situation: "",
    extraAreas: [],
    needs: [],
    contact: { name: "Pat", email: "pat@example.com", zip: "14607" }
  }, [], rules, business);
  assert.equal(result.informationQuality.level, "Incomplete");
  assert.equal(result.readiness.level, "Low");
  assert.equal(result.nextStep.id, "request_info");
  assert.ok(result.missing.some((item) => item.id === "photos"));
  assert.ok(result.missing.some((item) => item.id === "deadline"));
});

test("low-scope flexible project recommends a call first", () => {
  const result = qualifyApi.qualify({
    service: "organizer",
    situation: "organizing",
    propertyType: "condo",
    bedrooms: "2",
    years: "6",
    fullness: "light",
    extraAreas: [],
    sorted: "yes",
    needs: ["Storage systems"],
    deadline: "flexible",
    salePrep: "no",
    decisionMakers: "1",
    notes: "One closet and a pantry.",
    contact: { name: "Alex Kim", email: "alex@example.com", zip: "14620" }
  }, [{ label: "Kitchen" }, { label: "Living room" }], rules, business);
  assert.equal(result.complexity.level, "Low");
  assert.equal(result.urgency.level, "Low");
  assert.equal(result.nextStep.id, "call");
});

test("changing a rule band changes the result without new application logic", () => {
  const sample = janeMiller();
  const tweaked = JSON.parse(JSON.stringify(rules));
  tweaked.dimensions.urgency.bands = [
    { min: 40, level: "High", summary: "Raised bar" },
    { min: 0, level: "Low", summary: "Everything else" }
  ];
  const result = qualifyApi.qualify(sample.intake, sample.photos, tweaked, business);
  assert.equal(result.urgency.level, "Low");
});
