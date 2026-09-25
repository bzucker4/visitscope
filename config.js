// VisitScope runtime config. For v1 this represents the first-party VisitScope
// provider. To white-label, change the brand fields below.
window.VISITSCOPE_CONFIG = {
  brandName: "VisitScope",
  businessName: "VisitScope",
  businessInitials: "V",
  contactEmail: "hello@visitscope.app",
  accent: "#765d4f",
  accentDark: "#5e493e",
  storageKey: "visitscope.assessments",
  draftKey: "visitscope.draft"
};
// Backwards-compatible alias for any older references.
window.PREVISIT_CONFIG = window.VISITSCOPE_CONFIG;
