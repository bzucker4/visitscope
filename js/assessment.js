(function () {
  const business = window.VISITSCOPE_BUSINESS || {};
  const rules = window.VISITSCOPE_RULES;
  const qualifyApi = window.VisitScopeQualify;
  const store = window.VisitScopeStore;
  const ui = window.VisitScopeShared;
  const { $, $$ } = ui;

  const state = {
    service: "",
    situation: "",
    propertyType: "",
    bedrooms: "",
    years: "",
    fullness: "",
    extraAreas: [],
    sorted: "",
    needs: [],
    categories: [],
    removed: "",
    destination: "",
    moveDate: "",
    deadline: "",
    salePrep: "",
    decisionMakers: "",
    outOfState: "",
    access: "",
    notes: "",
    contact: {},
    photos: {}
  };

  const steps = $$(".step");
  let current = 0;
  let inquiryId = null;

  ui.applyBrand(business);
  $("#completeLead").textContent = business.copy && business.copy.completeLead || $("#completeLead").textContent;

  function showStep(index) {
    current = Math.max(0, Math.min(index, steps.length - 1));
    steps.forEach((step, n) => step.classList.toggle("hidden", n !== current));
    const pct = current === 0 ? 0 : Math.round((current / (steps.length - 1)) * 100);
    $("#progressBar").style.width = pct + "%";
    $("#progressText").textContent = pct + "%";
    $("#stepLabel").textContent = current === 0 ? "Getting started" : current === steps.length - 1 ? "Complete" : `Step ${Math.min(current, 8)} of 8`;
    $("#progressShell").classList.toggle("hidden", current === steps.length - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function selectGroup(group, value, el) {
    state[group] = value;
    $$(`[data-group="${group}"]`).forEach((node) => node.classList.remove("selected"));
    el.classList.add("selected");
    if (group === "service") {
      renderSituation();
      renderDetails();
      renderPhotos();
    }
  }

  function selectPill(group, value, el) {
    state[group] = value;
    $$(`[data-pill-group="${group}"] button`).forEach((node) => node.classList.remove("selected"));
    el.classList.add("selected");
  }

  function choiceCard(group, item, icon) {
    return `<button class="choice-card" type="button" data-group="${group}" data-value="${ui.escapeHtml(item.value)}"><span class="choice-icon">${icon || "○"}</span><span><strong>${ui.escapeHtml(item.label)}</strong><small>${ui.escapeHtml(item.brief || item.detail || "")}</small></span><span class="chevron">›</span></button>`;
  }

  function renderServices() {
    $("#serviceChoices").innerHTML = (business.services || []).map((item) => choiceCard("service", item)).join("");
    $$("#serviceChoices .choice-card").forEach((el) => el.addEventListener("click", () => selectGroup("service", el.dataset.value, el)));
  }

  function renderSituation() {
    const service = state.service || "organizer";
    const items = (business.situations || {})[service] || [];
    $("#situationTitle").textContent = (business.situationTitles || {})[service] || "What is prompting the project?";
    $("#situationChoices").innerHTML = items.map((item) => choiceCard("situation", item)).join("");
    $$("#situationChoices .choice-card").forEach((el) => el.addEventListener("click", () => selectGroup("situation", el.dataset.value, el)));
  }

  function renderProperty() {
    $("#propertyChoices").innerHTML = (business.propertyTypes || []).map((item) => choiceCard("propertyType", { ...item, detail: "" }, "⌂")).join("");
    $$("#propertyChoices .choice-card").forEach((el) => el.addEventListener("click", () => selectGroup("propertyType", el.dataset.value, el)));
    $("#extraAreaChoices").innerHTML = (business.extraAreas || []).map((area) => `<label><input type="checkbox" data-array="extraAreas" value="${ui.escapeHtml(area)}"><span>${ui.escapeHtml(area)}</span></label>`).join("");
    $$("#extraAreaChoices input").forEach((cb) => cb.addEventListener("change", () => {
      state.extraAreas = $$('input[data-array="extraAreas"]:checked').map((node) => node.value);
      renderPhotos();
    }));
  }

  function renderPills(id, group, options) {
    const root = $(id);
    root.innerHTML = (options || []).map((item) => `<button type="button" data-value="${ui.escapeHtml(item.value)}"><strong>${ui.escapeHtml(item.label)}</strong>${item.detail ? `<small>${ui.escapeHtml(item.detail)}</small>` : ""}</button>`).join("");
    $$("button", root).forEach((el) => el.addEventListener("click", () => {
      if (root.classList.contains("level-grid") || root.closest("[data-pill-group]") || root.id === "fullnessChoices") {
        if (group === "fullness") {
          state.fullness = el.dataset.value;
          $$("#fullnessChoices button").forEach((node) => node.classList.remove("selected"));
          el.classList.add("selected");
        } else {
          selectPill(group, el.dataset.value, el);
        }
      }
    }));
  }

  function renderDetails() {
    const detail = (business.details || {})[state.service || "organizer"] || { title: "What may need to happen?", needs: [] };
    $("#detailsTitle").textContent = detail.title;
    let html = `<div class="detail-checks">${detail.needs.map((need) => `<label><input type="checkbox" data-detail value="${ui.escapeHtml(need)}"><span>${ui.escapeHtml(need)}</span></label>`).join("")}</div>`;
    if (detail.estate) {
      html += `<div class="field"><label>Have desirable items already been removed?</label><div class="pill-grid" data-pill-group="removed">${(business.removed || []).map((item) => `<button type="button" data-value="${ui.escapeHtml(item.value)}">${ui.escapeHtml(item.label)}</button>`).join("")}</div></div>`;
    }
    if (detail.senior) {
      html += `<div class="two-col"><div class="field"><label for="destination">Moving to <span>optional</span></label><input id="destination" placeholder="Apartment, assisted living, family home..."></div><div class="field"><label for="moveDate">Target move date <span>optional</span></label><input id="moveDate" type="date"></div></div>`;
    }
    $("#detailsContent").innerHTML = html;
    $$("[data-detail]").forEach((cb) => cb.addEventListener("change", () => {
      const values = $$("[data-detail]:checked").map((node) => node.value);
      if (state.service === "estate") state.categories = values;
      else state.needs = values;
    }));
    $$("#detailsContent [data-pill-group] button").forEach((el) => el.addEventListener("click", () => selectPill(el.closest("[data-pill-group]").dataset.pillGroup, el.dataset.value, el)));
    const dest = $("#destination");
    const date = $("#moveDate");
    if (dest) dest.addEventListener("input", () => { state.destination = dest.value; });
    if (date) date.addEventListener("input", () => { state.moveDate = date.value; });
  }

  function photoList() {
    return qualifyApi.recommendedPhotoSlots(state, business);
  }

  function renderPhotos() {
    const list = photoList();
    $("#photoRecommended").textContent = list.length;
    $("#photoGrid").innerHTML = list.map((name, i) => `<label class="photo-card" data-photo-card="p${i}"><input type="file" accept="image/*" multiple data-photo="p${i}" data-label="${ui.escapeHtml(name)}"><div class="photo-top"><span class="photo-icon">▧</span><span class="photo-status">Add photo</span></div><div><strong>${ui.escapeHtml(name)}</strong><small>Wide-angle view if possible</small></div></label>`).join("");
    $$("input[data-photo]").forEach((input) => input.addEventListener("change", async () => {
      const files = [...input.files].slice(0, 3);
      const slot = input.dataset.photo;
      const label = input.dataset.label;
      const card = input.closest(".photo-card");
      try {
        state.photos[slot] = await Promise.all(files.map((file) => ui.fileToPhoto(file, slot, label)));
      } catch (err) {
        card.querySelector(".photo-status").textContent = "Could not add photo";
        return;
      }
      card.classList.toggle("done", state.photos[slot].length > 0);
      card.querySelector(".photo-status").textContent = state.photos[slot].length ? `✓ ${state.photos[slot].length} added` : "Add photo";
      updatePhotoProgress();
    }));
    updatePhotoProgress();
  }

  function updatePhotoProgress() {
    const filled = Object.values(state.photos).filter((items) => items && items.length).length;
    const recommended = photoList().length;
    $("#photoCount").textContent = filled;
    $("#photoMeter").style.width = Math.min(100, Math.round((filled / Math.max(recommended, 1)) * 100)) + "%";
  }

  function requireState(keys) {
    return keys.every((key) => {
      const value = state[key];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    });
  }

  function nextFrom(index, required) {
    const err = steps[index].querySelector(".error");
    if (required.length && !requireState(required)) {
      if (err) err.textContent = "Please choose an option to continue.";
      return;
    }
    if (err) err.textContent = "";
    showStep(index + 1);
  }

  [["#bedrooms", "bedrooms"], ["#years", "years"], ["#decisionMakers", "decisionMakers"], ["#outOfState", "outOfState"], ["#notes", "notes"], ["#access", "access"]].forEach(([sel, key]) => {
    const el = $(sel);
    if (el) el.addEventListener("input", (event) => { state[key] = event.target.value; });
  });

  $$("[data-next]").forEach((btn) => btn.addEventListener("click", () => nextFrom(Number(btn.dataset.next), (btn.dataset.require || "").split(",").filter(Boolean))));
  $$("[data-back]").forEach((btn) => btn.addEventListener("click", () => showStep(Number(btn.dataset.back))));

  function flattenedPhotos() {
    return Object.values(state.photos).flat().filter(Boolean);
  }

  function serviceLabel() {
    return ui.lookupLabel(business.services, state.service, "Project");
  }

  function makeConsumerSummary() {
    const first = (state.contact.name || "there").split(/\s+/)[0];
    $("#leadFirstName").textContent = first;
    const rows = [
      ["Service", serviceLabel()],
      ["Home", `${state.bedrooms ? state.bedrooms + " bedrooms · " : ""}${ui.lookupLabel(business.propertyTypes, state.propertyType, "Property details added")}`],
      ["Contents", ui.lookupLabel(business.fullness, state.fullness)],
      ["Timeline", ui.lookupLabel(business.deadline, state.deadline)],
      ["Photos", `${flattenedPhotos().length} selected`]
    ];
    $("#consumerSummary").innerHTML = `<div class="consumer-summary-grid">${rows.map(([k, v]) => `<div>${ui.escapeHtml(k)}<strong>${ui.escapeHtml(v)}</strong></div>`).join("")}</div>`;
  }

  async function submitAssessment() {
    state.contact = {
      name: $("#name").value.trim(),
      email: $("#email").value.trim(),
      phone: $("#phone").value.trim(),
      zip: $("#zip").value.trim()
    };
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.contact.email);
    if (!state.contact.name || !emailOk || !/^\d{5}(-\d{4})?$/.test(state.contact.zip) || !$("#consent").checked) {
      $("#contactError").textContent = "Please enter your name, a valid email, ZIP code, and confirm contact permission.";
      return;
    }
    $("#contactError").textContent = "";

    const intake = {
      service: state.service,
      situation: state.situation,
      propertyType: state.propertyType,
      bedrooms: state.bedrooms,
      years: state.years,
      fullness: state.fullness,
      extraAreas: state.extraAreas,
      sorted: state.sorted,
      needs: state.needs,
      categories: state.categories,
      removed: state.removed,
      destination: state.destination,
      moveDate: state.moveDate,
      deadline: state.deadline,
      salePrep: state.salePrep,
      decisionMakers: state.decisionMakers,
      outOfState: state.outOfState,
      access: state.access,
      notes: state.notes,
      contact: state.contact
    };
    const photos = flattenedPhotos();
    const qualification = qualifyApi.qualify(intake, photos, rules, business);
    const record = await store.save({
      id: inquiryId || store.createId(),
      status: "new",
      intake,
      photos,
      activity: [{ at: new Date().toISOString(), action: "submitted", note: "Client submitted the project assessment." }]
    });
    inquiryId = record.id;
    makeConsumerSummary();
    const briefLink = $("#viewBusinessBrief");
    briefLink.href = `brief.html?id=${encodeURIComponent(record.id)}`;
    showStep(9);
  }

  $("#contactNext").addEventListener("click", () => {
    submitAssessment().catch((err) => {
      $("#contactError").textContent = err.message || "Could not save this assessment in this browser.";
    });
  });
  $("#editAssessment").addEventListener("click", () => showStep(1));
  $("#consultationBtn").addEventListener("click", () => {
    if (business.consultationUrl) window.open(business.consultationUrl, "_blank");
    else if (business.contactPhone) location.href = `tel:${business.contactPhone}`;
    else location.href = `mailto:${business.contactEmail || "hello@example.com"}?subject=${encodeURIComponent("Consultation request")}`;
  });

  renderServices();
  renderSituation();
  renderProperty();
  renderPills("#fullnessChoices", "fullness", business.fullness);
  renderPills("#sortedChoices", "sorted", business.sorted);
  renderPills("#deadlineChoices", "deadline", business.deadline);
  renderPills("#salePrepChoices", "salePrep", business.salePrep);
  renderDetails();
  renderPhotos();
  showStep(0);
})();
