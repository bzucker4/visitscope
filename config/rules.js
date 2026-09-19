(function (root, factory) {
  const rules = factory();
  if (typeof module === "object" && module.exports) module.exports = rules;
  else root.VISITSCOPE_RULES = rules;
})(typeof self !== "undefined" ? self : this, function () {
  return {
  version: 1,
  statuses: [
    { id: "new", label: "New Inquiry" },
    { id: "needs_info", label: "Needs Info" },
    { id: "call", label: "Call" },
    { id: "visit", label: "Visit" },
    { id: "refer_decline", label: "Refer/Decline" },
    { id: "closed", label: "Closed" }
  ],
  actions: [
    { id: "request_info", label: "Request Missing Info", status: "needs_info" },
    { id: "call", label: "Call", status: "call" },
    { id: "visit", label: "Visit", status: "visit" },
    { id: "refer", label: "Refer", status: "refer_decline", outcome: "refer" },
    { id: "decline", label: "Decline", status: "refer_decline", outcome: "decline" },
    { id: "close", label: "Close", status: "closed" }
  ],
  requiredFields: [
    { id: "service", path: "service", label: "Service type" },
    { id: "situation", path: "situation", label: "Project situation" },
    { id: "propertyType", path: "propertyType", label: "Property type" },
    { id: "fullness", path: "fullness", label: "How full the home is" },
    { id: "sorted", path: "sorted", label: "Sorting status" },
    { id: "deadline", path: "deadline", label: "Desired completion window" },
    { id: "salePrep", path: "salePrep", label: "Whether the property is being prepared for sale" },
    { id: "contact.name", path: "contact.name", label: "Client name" },
    { id: "contact.email", path: "contact.email", label: "Email address" },
    { id: "contact.zip", path: "contact.zip", label: "ZIP code" }
  ],
  recommendedFields: [
    { id: "bedrooms", path: "bedrooms", label: "Bedroom count" },
    { id: "years", path: "years", label: "Years occupied" },
    { id: "decisionMakers", path: "decisionMakers", label: "Number of decision-makers" },
    { id: "needs", path: "selectedNeeds", label: "Services or contents still needed", minCount: 1 },
    { id: "photos", path: "photoCount", label: "Guided project photos", min: 1 },
    { id: "photoCoverage", path: "photoCoverage", label: "Photos of the recommended spaces", min: 0.5 },
    { id: "notes", path: "notes", label: "Client notes about the project" }
  ],
  signals: [
    { id: "deadline_30", label: "Deadline within 30 days", when: { field: "deadline", op: "in", value: ["week", "month"] } },
    { id: "deadline_7", label: "Deadline within 7 days", when: { field: "deadline", op: "eq", value: "week" } },
    { id: "large_scope", label: "Large property scope", when: { any: [
      { field: "fullness", op: "in", value: ["heavy", "extreme"] },
      { field: "extraAreas", op: "countGte", value: 2 },
      { field: "bedroomsNum", op: "gte", value: 4 }
    ] } },
    { id: "sorting_not_started", label: "Sorting not started", when: { field: "sorted", op: "eq", value: "no" } },
    { id: "sale_prep", label: "Property preparing for sale", when: { field: "salePrep", op: "eq", value: "yes" } },
    { id: "long_occupied", label: "Home occupied 30+ years", when: { field: "yearsNum", op: "gte", value: 30 } },
    { id: "out_of_state", label: "Out-of-state decision-makers", when: { field: "outOfStateNum", op: "gte", value: 1 } },
    { id: "many_decision_makers", label: "Multiple family decision-makers", when: { field: "decisionMakersNum", op: "gte", value: 3 } },
    { id: "estate_contents_remain", label: "Most estate contents still present", when: { all: [
      { field: "service", op: "eq", value: "estate" },
      { field: "removed", op: "eq", value: "none" }
    ] } },
    { id: "limited_photos", label: "Limited photo coverage", when: { field: "photoCoverage", op: "lt", value: 0.5 } }
  ],
  dimensions: {
    complexity: {
      base: 8,
      parts: [
        { field: "fullness", map: { light: 3, average: 10, heavy: 20, extreme: 28 } },
        { field: "extraAreas", countTimes: 4 },
        { field: "sorted", map: { no: 12, partial: 6, yes: 0 } },
        { field: "yearsNum", gte: 30, add: 7 },
        { field: "yearsNum", gte: 15, lt: 30, add: 3 },
        { field: "bedroomsNum", gte: 4, add: 4 },
        { field: "selectedNeeds", countTimes: 2, cap: 12 },
        { field: "removed", map: { none: 8, most: -8 } },
        { field: "outOfStateNum", gte: 1, add: 3 }
      ],
      bands: [
        { min: 42, level: "High", summary: "Multiple spaces and needs" },
        { min: 22, level: "Moderate", summary: "Standard project scope" },
        { min: 0, level: "Low", summary: "Focused or limited scope" }
      ]
    },
    urgency: {
      base: 0,
      parts: [
        { field: "deadline", map: { week: 28, month: 16, quarter: 7, flexible: 2 } },
        { field: "salePrep", map: { yes: 10, unsure: 3 } },
        { field: "situation", map: { death: 8, assisted: 6, care: 6, executor: 5 } }
      ],
      bands: [
        { min: 24, level: "High", summary: "Immediate or sale-driven timeline" },
        { min: 12, level: "Moderate", summary: "30-day target" },
        { min: 0, level: "Low", summary: "Flexible timing" }
      ]
    },
    informationQuality: {
      base: 10,
      parts: [
        { field: "service", notEmpty: true, add: 8 },
        { field: "situation", notEmpty: true, add: 8 },
        { field: "propertyType", notEmpty: true, add: 6 },
        { field: "fullness", notEmpty: true, add: 8 },
        { field: "sorted", notEmpty: true, add: 6 },
        { field: "deadline", notEmpty: true, add: 8 },
        { field: "salePrep", notEmpty: true, add: 6 },
        { field: "contact.name", notEmpty: true, add: 6 },
        { field: "contact.email", notEmpty: true, add: 6 },
        { field: "contact.zip", notEmpty: true, add: 4 },
        { field: "photoCoverage", ratioTimes: 20 },
        { field: "notes", notEmpty: true, add: 4 }
      ],
      bands: [
        { min: 78, level: "Complete", summary: "Strong photo and project coverage" },
        { min: 48, level: "Partial", summary: "Enough to start, with gaps" },
        { min: 0, level: "Incomplete", summary: "Too little to prepare a visit" }
      ]
    },
    readiness: {
      base: 12,
      parts: [
        { field: "informationQualityScore", ratioFrom100: 0.35 },
        { field: "photoCount", gte: 4, add: 16 },
        { field: "photoCount", gte: 1, lt: 4, add: 8 },
        { field: "decisionMakers", notEmpty: true, add: 8 },
        { field: "deadline", notEmpty: true, add: 8 },
        { field: "fullness", notEmpty: true, add: 8 },
        { field: "photoCount", eq: 0, add: -18 },
        { field: "missingRequiredCount", gte: 3, add: -16 },
        { field: "missingRequiredCount", eq: 0, add: 10 }
      ],
      bands: [
        { min: 62, level: "High", summary: "Ready for consultation" },
        { min: 36, level: "Moderate", summary: "Call before scheduling" },
        { min: 0, level: "Low", summary: "Need more information first" }
      ]
    }
  },
  nextSteps: [
    {
      id: "request_info",
      badge: "REQUEST INFO",
      title: "Request missing information.",
      summary: "Too little project or photo detail is available to prepare a useful consultation.",
      statusHint: "needs_info",
      when: { any: [
        { field: "informationQuality", op: "eq", value: "Incomplete" },
        { field: "readiness", op: "eq", value: "Low" },
        { field: "photoCount", op: "eq", value: 0 }
      ] }
    },
    {
      id: "visit",
      badge: "IN-HOME CONSULTATION",
      title: "Schedule a full in-home consultation.",
      summary: "Scope, timing, and information quality justify an onsite assessment.",
      statusHint: "visit",
      when: { all: [
        { field: "complexity", op: "in", value: ["High", "Moderate"] },
        { field: "informationQuality", op: "in", value: ["Complete", "Partial"] },
        { field: "readiness", op: "in", value: ["High", "Moderate"] },
        { any: [
          { field: "urgency", op: "in", value: ["High", "Moderate"] },
          { field: "complexity", op: "eq", value: "High" }
        ] }
      ] }
    },
    {
      id: "call",
      badge: "CALL FIRST",
      title: "Call to confirm details before visiting.",
      summary: "There is enough to start a conversation, but a call should confirm fit, access, and timing.",
      statusHint: "call",
      when: { any: [
        { field: "informationQuality", op: "eq", value: "Partial" },
        { field: "readiness", op: "eq", value: "Moderate" },
        { field: "complexity", op: "eq", value: "Low" }
      ] }
    },
    {
      id: "call_default",
      badge: "CALL FIRST",
      title: "Call to review the inquiry.",
      summary: "Start with a conversation to confirm the project before scheduling a visit.",
      statusHint: "call",
      when: {}
    }
  ]
};
});
