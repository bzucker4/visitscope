(function () {
  const business = window.VISITSCOPE_BUSINESS || {};
  const rules = window.VISITSCOPE_RULES;
  const store = window.VisitScopeStore;
  const qualifyApi = window.VisitScopeQualify;
  const ui = window.VisitScopeShared;
  const { $, $$ } = ui;

  ui.applyBrand(business);

  let filter = "all";

  function showApp() {
    $("#pinGate").classList.add("hidden");
    $("#queueApp").classList.remove("hidden");
    renderFilters();
    renderQueue();
  }

  function renderFilters() {
    const items = [{ id: "all", label: "All" }].concat(rules.statuses || []);
    $("#statusFilters").innerHTML = items.map((item) => `<button type="button" data-filter="${item.id}" class="${item.id === filter ? "is-active" : ""}">${ui.escapeHtml(item.label)}</button>`).join("");
    $$("#statusFilters button").forEach((btn) => btn.addEventListener("click", () => {
      filter = btn.dataset.filter;
      renderFilters();
      renderQueue();
    }));
  }

  async function renderQueue() {
    const inquiries = await store.list();
    const visible = inquiries.filter((item) => filter === "all" || item.status === filter);
    if (!visible.length) {
      $("#queueList").innerHTML = `<div class="empty-queue"><h3>No inquiries in this view</h3><p>Submit the client assessment to create a project brief, or add the sample inquiry in demo mode.</p><a class="cta-primary" href="assessment.html">Open the assessment</a></div>`;
      return;
    }
    $("#queueList").innerHTML = visible.map((inquiry) => {
      const qualification = qualifyApi.qualify(inquiry.intake, inquiry.photos, rules, business);
      const status = ui.statusMeta(rules, inquiry.status);
      return `<a class="inquiry-card" href="brief.html?id=${encodeURIComponent(inquiry.id)}">
        <div class="inquiry-top">
          <div>
            <small>${ui.escapeHtml(ui.formatDate(inquiry.createdAt))}</small>
            <strong>${ui.escapeHtml(inquiry.intake.contact && inquiry.intake.contact.name || "Untitled inquiry")}</strong>
            <span>${ui.escapeHtml([inquiry.intake.contact && inquiry.intake.contact.zip, ui.lookupLabel(business.services, inquiry.intake.service, "Project")].filter(Boolean).join(" · "))}</span>
          </div>
          <span class="status-chip status-${ui.escapeHtml(inquiry.status)}">${ui.escapeHtml(status.label)}</span>
        </div>
        <div class="inquiry-metrics">
          <div><span>Readiness</span><strong>${ui.escapeHtml(qualification.readiness.level)}</strong></div>
          <div><span>Complexity</span><strong>${ui.escapeHtml(qualification.complexity.level)}</strong></div>
          <div><span>Urgency</span><strong>${ui.escapeHtml(qualification.urgency.level)}</strong></div>
          <div><span>Info</span><strong>${ui.escapeHtml(qualification.informationQuality.level)}</strong></div>
        </div>
        <div class="inquiry-next"><span>Recommended next step</span><strong>${ui.escapeHtml(qualification.nextStep.title)}</strong></div>
      </a>`;
    }).join("");
  }

  function placeholderPhoto(label, index, count) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="520"><rect fill="#d8cfc4" width="100%" height="100%"/><rect x="24" y="24" width="752" height="472" fill="#f7f3ef" stroke="#6e5648" stroke-width="3"/><text x="50%" y="46%" text-anchor="middle" fill="#5e493e" font-family="Georgia,serif" font-size="34">${label}</text><text x="50%" y="58%" text-anchor="middle" fill="#7a5c4b" font-family="sans-serif" font-size="18">Sample photo ${count}</text></svg>`;
    return { slot: "p" + index, label, name: `${label}-${count}.svg`, dataUrl: "data:image/svg+xml;utf8," + encodeURIComponent(svg) };
  }

  function sampleInquiry() {
    const photoPlan = [
      ["Front / entry", 1],
      ["Living room", 2],
      ["Kitchen", 2],
      ["Primary bedroom", 2],
      ["Basement", 3],
      ["Garage", 2],
      ["Attic", 1]
    ];
    const photos = [];
    photoPlan.forEach(([label, count], index) => {
      for (let n = 1; n <= count; n += 1) photos.push(placeholderPhoto(label, index, n));
    });
    return {
      status: "new",
      intake: {
        service: "downsizing",
        situation: "assisted",
        propertyType: "single-family",
        bedrooms: "4",
        years: "38",
        fullness: "heavy",
        extraAreas: ["Basement", "Garage", "Attic"],
        sorted: "no",
        needs: ["Sorting", "Deciding what to keep", "Donation coordination", "Packing", "Removal / cleanout", "Home sale preparation"],
        categories: [],
        removed: "",
        destination: "",
        moveDate: "",
        deadline: "month",
        salePrep: "yes",
        decisionMakers: "3",
        outOfState: "2",
        access: "Basement stairs",
        notes: "Mom has lived here since the 1980s. We need help deciding what goes with her, what can be donated and what should be removed. Two siblings live out of state. The realtor would like the house ready next month.",
        contact: { name: "Jane Miller", email: "jane@example.com", phone: "(555) 555-0148", zip: "14607" }
      },
      photos,
      activity: [{ at: new Date().toISOString(), action: "submitted", note: "Sample inquiry loaded for demo review." }]
    };
  }

  if (!ui.operatorUnlocked(business)) {
    $("#pinGate").classList.remove("hidden");
    $("#unlockQueue").addEventListener("click", () => {
      if (ui.unlockOperator(business, $("#operatorPin").value)) showApp();
      else $("#pinError").textContent = "That PIN does not match the business configuration.";
    });
  } else {
    showApp();
  }

  $("#seedSample").addEventListener("click", async () => {
    await store.save(sampleInquiry());
    renderQueue();
  });
  $("#clearQueue").addEventListener("click", async () => {
    if (confirm("Clear all locally stored inquiries on this browser?")) {
      await store.clear();
      renderQueue();
    }
  });
})();
