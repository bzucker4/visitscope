(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.VisitScopeQualify = api;
})(typeof self !== "undefined" ? self : this, function () {
  function getPath(obj, path) {
    return String(path || "").split(".").reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
  }

  function isEmpty(value) {
    return value == null || value === "" || (Array.isArray(value) && value.length === 0);
  }

  function asNumber(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function compare(ctx, cond) {
    if (!cond || (typeof cond === "object" && !Object.keys(cond).length)) return true;
    if (cond.all) return cond.all.every((item) => compare(ctx, item));
    if (cond.any) return cond.any.some((item) => compare(ctx, item));
    if (cond.not) return !compare(ctx, cond.not);

    const value = cond.field ? getPath(ctx, cond.field) : undefined;
    const expected = cond.value;
    switch (cond.op) {
      case "eq": return value == expected;
      case "neq": return value != expected;
      case "in": return Array.isArray(expected) && expected.includes(value);
      case "gte": return asNumber(value) >= asNumber(expected);
      case "lte": return asNumber(value) <= asNumber(expected);
      case "gt": return asNumber(value) > asNumber(expected);
      case "lt": return asNumber(value) < asNumber(expected);
      case "empty": return isEmpty(value);
      case "notEmpty": return !isEmpty(value);
      case "countGte": return (Array.isArray(value) ? value.length : 0) >= asNumber(expected);
      case "countLte": return (Array.isArray(value) ? value.length : 0) <= asNumber(expected);
      case "includes": return Array.isArray(value) && value.includes(expected);
      default: return false;
    }
  }

  function applyPart(ctx, part) {
    if (part.when && !compare(ctx, part.when)) return 0;
    const value = getPath(ctx, part.field);
    if (part.map) return asNumber(part.map[value]);
    if (part.countTimes) {
      const count = Array.isArray(value) ? value.length : asNumber(value);
      const raw = count * part.countTimes;
      return part.cap != null ? Math.min(part.cap, raw) : raw;
    }
    if (part.ratioTimes) return Math.max(0, Math.min(1, asNumber(value))) * part.ratioTimes;
    if (part.ratioFrom100) return asNumber(value) * part.ratioFrom100;
    if (part.notEmpty) return isEmpty(value) ? 0 : asNumber(part.add);
    if (part.add != null) {
      if (part.eq != null && value != part.eq) return 0;
      if (part.gte != null && !(asNumber(value) >= part.gte)) return 0;
      if (part.lt != null && !(asNumber(value) < part.lt)) return 0;
      return asNumber(part.add);
    }
    return 0;
  }

  function scoreDimension(ctx, config) {
    const score = Math.max(0, Math.min(100, (config.base || 0) + (config.parts || []).reduce((sum, part) => sum + applyPart(ctx, part), 0)));
    const band = [...(config.bands || [])].sort((a, b) => b.min - a.min).find((item) => score >= item.min) || { level: "Low", summary: "" };
    return { score: Math.round(score), level: band.level, summary: band.summary };
  }

  function fieldMissing(ctx, spec) {
    const value = getPath(ctx, spec.path);
    if (spec.minCount) return !Array.isArray(value) || value.length < spec.minCount;
    if (spec.min != null) return asNumber(value) < spec.min;
    return isEmpty(value);
  }

  function collectGaps(ctx, rules) {
    const missing = [];
    (rules.requiredFields || []).forEach((spec) => {
      if (fieldMissing(ctx, spec)) missing.push({ id: spec.id, label: spec.label, required: true });
    });
    (rules.recommendedFields || []).forEach((spec) => {
      if (fieldMissing(ctx, spec)) missing.push({ id: spec.id, label: spec.label, required: false });
    });
    return missing;
  }

  function buildContext(intake, photoInfo) {
    const photos = photoInfo || { count: 0, filledSlots: 0, recommended: 0, slots: [] };
    const recommended = Math.max(photos.recommended || 0, 1);
    const selectedNeeds = intake.service === "estate" ? (intake.categories || []) : (intake.needs || []);
    return {
      ...intake,
      contact: intake.contact || {},
      extraAreas: intake.extraAreas || [],
      selectedNeeds,
      photoCount: photos.count || 0,
      photoSlotsFilled: photos.filledSlots || 0,
      recommendedPhotoCount: photos.recommended || 0,
      photoCoverage: Math.min(1, (photos.filledSlots || 0) / recommended),
      yearsNum: asNumber(intake.years),
      bedroomsNum: asNumber(intake.bedrooms),
      decisionMakersNum: asNumber(intake.decisionMakers),
      outOfStateNum: asNumber(intake.outOfState)
    };
  }

  function recommendedPhotoSlots(intake, business) {
    const photos = (business && business.photos) || { base: [], extraAreaMap: {}, byService: {}, max: 9 };
    const slots = [...(photos.base || [])];
    (intake.extraAreas || []).forEach((area) => {
      if (photos.extraAreaMap && photos.extraAreaMap[area]) slots.push(photos.extraAreaMap[area]);
    });
    ((photos.byService && photos.byService[intake.service]) || []).forEach((slot) => slots.push(slot));
    return [...new Set(slots)].slice(0, photos.max || 9);
  }

  function summarizePhotos(intake, photos, business) {
    const recommended = recommendedPhotoSlots(intake, business || {});
    const items = photos || [];
    const bySlot = {};
    items.forEach((photo) => {
      const key = photo.slot || photo.label;
      if (!bySlot[key]) bySlot[key] = [];
      bySlot[key].push(photo);
    });
    return {
      recommended,
      count: items.length,
      filledSlots: recommended.filter((slot) => (bySlot[slot] || []).length > 0).length,
      checklist: recommended.map((slot) => ({
        label: slot,
        count: (bySlot[slot] || []).length,
        photos: bySlot[slot] || []
      })),
      extras: items.filter((photo) => !recommended.includes(photo.slot || photo.label))
    };
  }

  function qualify(intake, photos, rules, business) {
    const photoSummary = summarizePhotos(intake, photos, business);
    const ctx = buildContext(intake, {
      count: photoSummary.count,
      filledSlots: photoSummary.filledSlots,
      recommended: photoSummary.recommended.length
    });
    const missing = collectGaps(ctx, rules);
    ctx.missingRequiredCount = missing.filter((item) => item.required).length;
    ctx.missingCount = missing.length;

    const complexity = scoreDimension(ctx, rules.dimensions.complexity);
    ctx.complexity = complexity.level;
    ctx.complexityScore = complexity.score;

    const urgency = scoreDimension(ctx, rules.dimensions.urgency);
    ctx.urgency = urgency.level;
    ctx.urgencyScore = urgency.score;

    const informationQuality = scoreDimension(ctx, rules.dimensions.informationQuality);
    ctx.informationQuality = informationQuality.level;
    ctx.informationQualityScore = informationQuality.score;

    const readiness = scoreDimension(ctx, rules.dimensions.readiness);
    ctx.readiness = readiness.level;
    ctx.readinessScore = readiness.score;

    const signals = (rules.signals || [])
      .filter((signal) => compare(ctx, signal.when))
      .map((signal) => ({ id: signal.id, label: signal.label }));

    const nextStep = (rules.nextSteps || []).find((step) => compare(ctx, step.when)) || {
      id: "call_default",
      badge: "CALL FIRST",
      title: "Call to review the inquiry.",
      summary: "Start with a conversation before scheduling a visit.",
      statusHint: "call"
    };

    return {
      readiness,
      complexity,
      urgency,
      informationQuality,
      signals,
      missing,
      photos: photoSummary,
      nextStep: {
        id: nextStep.id,
        badge: nextStep.badge,
        title: nextStep.title,
        summary: nextStep.summary,
        statusHint: nextStep.statusHint
      }
    };
  }

  function statusLabel(rules, status) {
    const found = (rules.statuses || []).find((item) => item.id === status);
    return found ? found.label : status;
  }

  return { getPath, compare, qualify, recommendedPhotoSlots, summarizePhotos, statusLabel };
});
