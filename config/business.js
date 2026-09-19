window.VISITSCOPE_BUSINESS = {
  brandName: "VisitScope",
  businessName: "Sample Home Transitions",
  businessInitials: "HT",
  contactEmail: "hello@example.com",
  contactPhone: "",
  consultationUrl: "",
  accent: "#765d4f",
  accentDark: "#5e493e",
  demoMode: true,
  operatorPin: "",
  services: [
    { value: "organizer", label: "Professional organizing", brief: "A room, storage area, or whole home needs a better system." },
    { value: "downsizing", label: "Downsizing", brief: "Belongings need to be reduced before a move or sale." },
    { value: "estate", label: "Estate sale", brief: "A home’s contents need evaluation, sale, or removal." },
    { value: "senior", label: "Senior move", brief: "A move connected to aging, care, or family support." }
  ],
  situations: {
    organizer: [
      { value: "organizing", label: "Getting organized", detail: "A room, storage area, or whole home needs a better system." },
      { value: "declutter", label: "Decluttering", detail: "Too many belongings or crowded spaces are making the home hard to use." },
      { value: "move", label: "Preparing for a move", detail: "The home needs organizing before packing or listing." },
      { value: "life", label: "Life transition", detail: "A change in the household is prompting the project." }
    ],
    downsizing: [
      { value: "smaller", label: "Moving to a smaller home", detail: "Belongings need to be reduced before a move." },
      { value: "assisted", label: "Move to assisted living", detail: "A parent or relative is moving into a smaller setting." },
      { value: "sale", label: "Preparing the home for sale", detail: "The property needs to be simplified and readied for listing." },
      { value: "future", label: "Planning ahead", detail: "Downsizing is proactive rather than urgent." }
    ],
    estate: [
      { value: "death", label: "Death / inherited property", detail: "Family is managing a loved one’s home or belongings." },
      { value: "sale", label: "Preparing property for sale", detail: "Contents need evaluation before the home is listed or cleared." },
      { value: "executor", label: "Executor / estate responsibility", detail: "You are coordinating decisions for an estate." },
      { value: "other", label: "Other estate transition", detail: "Another situation is prompting the evaluation." }
    ],
    senior: [
      { value: "assisted", label: "Move to assisted living", detail: "A parent or relative is moving into a smaller setting." },
      { value: "family", label: "Moving closer to family", detail: "The move is connected to family support or care." },
      { value: "smaller", label: "Moving to a smaller home", detail: "The move involves downsizing and sorting." },
      { value: "care", label: "Care transition", detail: "A change in care needs is prompting the move." }
    ]
  },
  situationTitles: {
    organizer: "What is prompting the organizing project?",
    downsizing: "What is prompting the downsizing?",
    estate: "What is prompting the estate evaluation?",
    senior: "What is prompting the move?"
  },
  propertyTypes: [
    { value: "single-family", label: "Single-family home" },
    { value: "condo", label: "Condo / townhome" },
    { value: "apartment", label: "Apartment" },
    { value: "other", label: "Other property" }
  ],
  extraAreas: ["Basement", "Garage", "Attic", "Shed / outbuilding"],
  fullness: [
    { value: "light", label: "Light", detail: "Most rooms are easy to walk through." },
    { value: "average", label: "Average", detail: "Typical household belongings." },
    { value: "heavy", label: "Heavy", detail: "Many rooms are crowded or stacked." },
    { value: "extreme", label: "Very full", detail: "Access or movement is difficult." }
  ],
  sorted: [
    { value: "yes", label: "Mostly sorted" },
    { value: "partial", label: "Partly sorted" },
    { value: "no", label: "Not started" }
  ],
  deadline: [
    { value: "week", label: "Within 7 days" },
    { value: "month", label: "Within 30 days" },
    { value: "quarter", label: "Within 90 days" },
    { value: "flexible", label: "Flexible" }
  ],
  salePrep: [
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
    { value: "unsure", label: "Not sure" }
  ],
  details: {
    organizer: {
      title: "What kind of help would be useful?",
      needs: ["Decluttering", "Sorting decisions", "Donation coordination", "Storage systems", "Paperwork organization", "Packing / unpacking", "Whole-home organizing", "One or two focused spaces"]
    },
    downsizing: {
      title: "What may need to happen before the move?",
      needs: ["Sorting", "Deciding what to keep", "Donation coordination", "Packing", "Furniture planning", "Removal / cleanout", "Home sale preparation", "Family coordination"]
    },
    estate: {
      title: "What types of contents are still present?",
      needs: ["Furniture", "Jewelry", "Tools", "Collectibles", "Art / décor", "Books / records", "Vehicles", "Large / specialty items"],
      estate: true
    },
    senior: {
      title: "What support may be needed?",
      needs: ["Sorting", "Downsizing", "Packing", "Floor-plan planning", "Mover coordination", "Donation coordination", "Unpacking / setup", "Removal / cleanout"],
      senior: true
    }
  },
  removed: [
    { value: "none", label: "No / very little" },
    { value: "some", label: "Some items" },
    { value: "most", label: "Most items" },
    { value: "unsure", label: "Not sure" }
  ],
  photos: {
    base: ["Front / entry", "Living room", "Kitchen", "Primary bedroom"],
    extraAreaMap: {
      "Basement": "Basement",
      "Garage": "Garage",
      "Attic": "Attic",
      "Shed / outbuilding": "Shed / outbuilding"
    },
    byService: {
      estate: ["Potential sale items"],
      organizer: ["Most challenging space"]
    },
    max: 9
  },
  copy: {
    assessmentKicker: "Project assessment",
    introTitle: "Tell us about the home and the project.",
    introLead: "A short guided assessment helps your team understand scope, timing, and photos before anyone visits.",
    completeTitle: "Your project details were sent.",
    completeLead: "The team will review the assessment and follow up with the next step.",
    missingInfoSubject: "A few more details would help us prepare",
    missingInfoIntro: "Thank you for the project details. To prepare for a consultation, we still need:"
  }
};

window.PREVISIT_CONFIG = window.VISITSCOPE_BUSINESS;
