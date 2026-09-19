(function () {
  const business = window.VISITSCOPE_BUSINESS || {};
  const rules = window.VISITSCOPE_RULES;
  const store = window.VisitScopeStore;
  const qualifyApi = window.VisitScopeQualify;
  const ui = window.VisitScopeShared;
  const { $ } = ui;

  ui.applyBrand(business);

  const params = new URLSearchParams(location.search);
  const inquiryId = params.get("id");

  const exampleInquiry = {
    id: "example",
    status: "new",
    createdAt: new Date().toISOString(),
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
    photos: [
      { label: "Front / entry" }, { label: "Living room" }, { label: "Living room" },
      { label: "Kitchen" }, { label: "Kitchen" }, { label: "Primary bedroom" }, { label: "Primary bedroom" },
      { label: "Basement" }, { label: "Basement" }, { label: "Basement" }, { label: "Garage" }, { label: "Garage" },
      { label: "Attic" }, { label: "Most challenging space" }
    ],
    activity: []
  };

  function locationLine(intake) {
    return [intake.contact.zip, intake.contact.email, intake.contact.phone].filter(Boolean).join(" · ");
  }

  function snapshotRows(intake) {
    return [
      ["Situation", ui.situationLabel(business, intake.service, intake.situation)],
      ["Property", `${ui.lookupLabel(business.propertyTypes, intake.propertyType)}${intake.bedrooms ? ` · ${intake.bedrooms} bedroom` : ""}`],
      ["Years occupied", intake.years || "Not provided"],
      ["Contents", ui.lookupLabel(business.fullness, intake.fullness)],
      ["Sorting", ui.lookupLabel(business.sorted, intake.sorted)],
      ["Additional spaces", (intake.extraAreas || []).join(", ") || "None selected"]
    ];
  }

  function timingRows(intake) {
    return [
      ["Desired completion", ui.lookupLabel(business.deadline, intake.deadline)],
      ["Preparing property for sale", ui.lookupLabel(business.salePrep, intake.salePrep)],
      ["Decision-makers", intake.decisionMakers || "Not provided"],
      ["Out of state", intake.outOfState || "0"],
      ["Access concern", intake.access || "None noted"],
      ["Destination", intake.destination || "Not provided"]
    ].filter((row) => row[1] !== "Not provided" || row[0] !== "Destination");
  }

  function renderDl(rows) {
    return `<dl class="brief-dl">${rows.map(([dt, dd]) => `<div><dt>${ui.escapeHtml(dt)}</dt><dd>${ui.escapeHtml(dd)}</dd></div>`).join("")}</dl>`;
  }

  function renderBrief(inquiry, live) {
    const intake = inquiry.intake;
    const qualification = qualifyApi.qualify(intake, inquiry.photos, rules, business);
    const status = ui.statusMeta(rules, inquiry.status);
    const selectedNeeds = intake.service === "estate" ? (intake.categories || []) : (intake.needs || []);
    const requiredMissing = qualification.missing.filter((item) => item.required);
    const recommendedMissing = qualification.missing.filter((item) => !item.required);
    const photoCells = qualification.photos.checklist.map((slot) => {
      const mark = slot.count ? "✓" : "–";
      return `<div>${mark} ${ui.escapeHtml(slot.label)} <span>${slot.count}</span></div>`;
    }).join("");
    const thumbs = (inquiry.photos || []).filter((photo) => photo.dataUrl).map((photo) => `<figure class="brief-photo"><img src="${photo.dataUrl}" alt="${ui.escapeHtml(photo.label || "Project photo")}"><figcaption>${ui.escapeHtml(photo.label || "Photo")}</figcaption></figure>`).join("");
    const actions = live ? `
      <div class="brief-actions">
        <button type="button" class="btn btn-secondary" data-action="request_info">Request Missing Info</button>
        <button type="button" class="btn btn-secondary" data-action="call">Call</button>
        <button type="button" class="btn btn-primary" data-action="visit">Visit</button>
        <button type="button" class="btn btn-ghost" data-action="refer">Refer</button>
        <button type="button" class="btn btn-ghost" data-action="decline">Decline</button>
        <button type="button" class="btn btn-ghost" data-action="close">Close</button>
      </div>
      <p class="action-note" id="actionNote"></p>
    ` : "";
    const activity = live && inquiry.activity && inquiry.activity.length ? `<div class="brief-panel full-width"><h3>Activity</h3><ol class="activity-list">${inquiry.activity.slice().reverse().map((item) => `<li><strong>${ui.escapeHtml(item.action.replace(/_/g, " "))}</strong><span>${ui.escapeHtml(ui.formatDate(item.at))}</span><p>${ui.escapeHtml(item.note || "")}</p></li>`).join("")}</ol></div>` : "";

    $("#briefRoot").innerHTML = `
      <div class="full-brief-head">
        <div>
          <span class="tiny-label">VISITSCOPE PROJECT BRIEF</span>
          <h2>${ui.escapeHtml(intake.contact.name || "Untitled inquiry")}</h2>
          <p>${ui.escapeHtml(locationLine(intake))}</p>
        </div>
        <div class="brief-badge">
          <span>Recommended next step</span>
          <strong>${ui.escapeHtml(qualification.nextStep.badge)}</strong>
        </div>
      </div>
      ${live ? `<div class="brief-status-row"><span class="status-chip status-${ui.escapeHtml(inquiry.status)}">${ui.escapeHtml(status.label)}</span><span class="muted-meta">Updated ${ui.escapeHtml(ui.formatDate(inquiry.updatedAt || inquiry.createdAt))}</span></div>` : ""}
      <div class="brief-summary-row">
        <div><span>Project readiness</span><strong>${ui.escapeHtml(qualification.readiness.level)}</strong><small>${ui.escapeHtml(qualification.readiness.summary)}</small></div>
        <div><span>Scope complexity</span><strong>${ui.escapeHtml(qualification.complexity.level)}</strong><small>${ui.escapeHtml(qualification.complexity.summary)}</small></div>
        <div><span>Urgency</span><strong>${ui.escapeHtml(qualification.urgency.level)}</strong><small>${ui.escapeHtml(qualification.urgency.summary)}</small></div>
        <div><span>Information quality</span><strong>${ui.escapeHtml(qualification.informationQuality.level)}</strong><small>${ui.escapeHtml(qualification.informationQuality.summary)}</small></div>
      </div>
      <div class="brief-columns">
        <div class="brief-panel"><h3>Project snapshot</h3>${renderDl(snapshotRows(intake))}</div>
        <div class="brief-panel"><h3>Timing & decision signals</h3>${renderDl(timingRows(intake))}</div>
      </div>
      <div class="brief-panel full-width priority-reasons">
        <h3>Project Signals</h3>
        <div class="reason-grid">${qualification.signals.length ? qualification.signals.map((signal) => `<span>✓ ${ui.escapeHtml(signal.label)}</span>`).join("") : "<span>No active project signals</span>"}</div>
      </div>
      <div class="brief-panel full-width">
        <h3>Missing information</h3>
        ${qualification.missing.length ? `<ul class="missing-list">${requiredMissing.map((item) => `<li data-required="true">${ui.escapeHtml(item.label)}</li>`).join("")}${recommendedMissing.map((item) => `<li>${ui.escapeHtml(item.label)}</li>`).join("")}</ul>` : `<p class="client-note">No required or recommended fields are missing.</p>`}
      </div>
      <div class="brief-panel full-width">
        <h3>Services likely needed</h3>
        <div class="signal-row large">${selectedNeeds.length ? selectedNeeds.map((need) => `<span>${ui.escapeHtml(need)}</span>`).join("") : "<span>None selected</span>"}</div>
      </div>
      <div class="brief-panel full-width">
        <h3>Photo checklist</h3>
        <div class="photo-status-grid">${photoCells}</div>
        ${thumbs ? `<div class="brief-photo-grid">${thumbs}</div>` : live ? `<p class="photo-empty">No photo files were stored with this inquiry.</p>` : ""}
      </div>
      <div class="recommendation-box">
        <div>
          <span>Recommended next step</span>
          <h3>${ui.escapeHtml(qualification.nextStep.title)}</h3>
          <p>${ui.escapeHtml(qualification.nextStep.summary)}</p>
        </div>
      </div>
      <div class="brief-panel full-width">
        <h3>Notes from client</h3>
        <p class="client-note">${ui.escapeHtml(intake.notes || "None provided.")}</p>
      </div>
      ${actions}
      ${activity}
    `;

    if (live) bindActions(inquiry, qualification);
  }

  function actionConfig(id) {
    return (rules.actions || []).find((item) => item.id === id);
  }

  function missingMessage(inquiry, qualification) {
    const names = qualification.missing.map((item) => `• ${item.label}`).join("\n");
    const intro = (business.copy && business.copy.missingInfoIntro) || "To prepare for a consultation, we still need:";
    return `${intro}\n\n${names || "• A few additional project details"}\n\nThank you,\n${business.businessName || "The team"}`;
  }

  async function applyAction(inquiry, qualification, actionId) {
    const config = actionConfig(actionId);
    if (!config) return;
    let note = "";
    if (actionId === "request_info") {
      const subject = encodeURIComponent((business.copy && business.copy.missingInfoSubject) || "A few more details would help");
      const body = encodeURIComponent(missingMessage(inquiry, qualification));
      const email = inquiry.intake.contact.email;
      if (email) window.open(`mailto:${email}?subject=${subject}&body=${body}`);
      note = qualification.missing.map((item) => item.label).join(", ") || "Requested additional project information.";
    } else if (actionId === "call") {
      if (inquiry.intake.contact.phone) window.open(`tel:${inquiry.intake.contact.phone}`);
      note = "Marked for a call.";
    } else if (actionId === "visit") {
      if (business.consultationUrl) window.open(business.consultationUrl, "_blank");
      note = "Marked for an in-home visit.";
    } else if (actionId === "refer" || actionId === "decline" || actionId === "close") {
      note = prompt(actionId === "close" ? "Optional close note" : `Why is this being ${actionId}d?`) || "";
      if ((actionId === "refer" || actionId === "decline") && !note) {
        $("#actionNote").textContent = "Add a short reason to refer or decline.";
        return;
      }
    }
    const updated = await store.update(inquiry.id, {
      status: config.status,
      outcome: config.outcome || null
    }, {
      at: new Date().toISOString(),
      action: actionId,
      note
    });
    renderBrief(updated, true);
    $("#actionNote").textContent = `${config.label} saved.`;
  }

  function bindActions(inquiry, qualification) {
    $("#briefRoot").querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => applyAction(inquiry, qualification, btn.dataset.action));
    });
  }

  async function showLive(id) {
    if (!ui.operatorUnlocked(business)) {
      $("#pinGate").classList.remove("hidden");
      $("#briefApp").classList.add("hidden");
      $("#unlockBrief").addEventListener("click", () => {
        if (ui.unlockOperator(business, $("#operatorPin").value)) {
          $("#pinGate").classList.add("hidden");
          $("#briefApp").classList.remove("hidden");
          showLive(id);
        } else {
          $("#pinError").textContent = "That PIN does not match the business configuration.";
        }
      });
      return;
    }
    const inquiry = await store.get(id);
    if (!inquiry) {
      $("#briefContext").innerHTML = `<span class="kicker">Operator view</span><h1>Inquiry not found</h1><p>This brief is not in the local queue on this browser.</p>`;
      $("#briefRoot").innerHTML = "";
      $("#briefFooter").innerHTML = `<a class="cta-primary" href="queue.html">Back to queue</a>`;
      return;
    }
    $("#briefContext").innerHTML = `<span class="kicker">Operator view</span><h1>Project brief</h1><p>Generated from the submitted intake. Qualification updates if the rules file changes.</p>`;
    $("#secondaryNav").textContent = "Queue";
    $("#secondaryNav").href = "queue.html";
    $("#primaryNav").textContent = "New assessment";
    $("#primaryNav").href = "assessment.html";
    $("#briefFooter").innerHTML = `<p>Return to the operator queue when you have chosen the next step.</p><a class="cta-primary" href="queue.html">Back to queue</a>`;
    renderBrief(inquiry, true);
  }

  if (inquiryId) {
    showLive(inquiryId).catch((err) => {
      $("#briefContext").innerHTML = `<span class="kicker">Operator view</span><h1>Could not open this brief</h1><p>${ui.escapeHtml(err.message)}</p>`;
    });
  } else {
    renderBrief(exampleInquiry, false);
  }
})();
