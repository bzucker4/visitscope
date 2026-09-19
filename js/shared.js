window.VisitScopeShared = (function () {
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => [...(root || document).querySelectorAll(sel)];

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>'"]/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;"
    }[char]));
  }

  function applyBrand(business) {
    const cfg = business || {};
    document.documentElement.style.setProperty("--accent", cfg.accent || "#765d4f");
    document.documentElement.style.setProperty("--accent-dark", cfg.accentDark || "#5e493e");
    $$("[data-business-name]").forEach((el) => { el.textContent = cfg.businessName || "Your Business"; });
    $$("[data-business-mark]").forEach((el) => { el.textContent = cfg.businessInitials || initials(cfg.businessName); });
    $$("[data-brand-name]").forEach((el) => { el.textContent = cfg.brandName || "VisitScope"; });
    if (!cfg.demoMode) $$(".demo-only").forEach((el) => el.classList.add("hidden"));
  }

  function initials(name) {
    return String(name || "Your Business").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  function lookupLabel(options, value, fallback) {
    const found = (options || []).find((item) => item.value === value);
    return found ? found.label : (fallback || "Not provided");
  }

  function situationLabel(business, service, situation) {
    const items = ((business.situations || {})[service] || []);
    return lookupLabel(items, situation, situation || "Not provided");
  }

  function formatDate(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  }

  function operatorUnlocked(business) {
    if (!business.operatorPin) return true;
    return sessionStorage.getItem("visitscope.operator") === "ok";
  }

  function unlockOperator(business, pin) {
    if (!business.operatorPin || pin === business.operatorPin) {
      sessionStorage.setItem("visitscope.operator", "ok");
      return true;
    }
    return false;
  }

  function statusMeta(rules, status) {
    return (rules.statuses || []).find((item) => item.id === status) || { id: status, label: status };
  }

  async function fileToPhoto(file, slot, label) {
    const dataUrl = await compressImage(file);
    return {
      slot,
      label,
      name: file.name,
      type: "image/jpeg",
      dataUrl
    };
  }

  function compressImage(file, maxW = 1280, quality = 0.72) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const scale = Math.min(1, maxW / img.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.width * scale));
          canvas.height = Math.max(1, Math.round(img.height * scale));
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        img.onerror = () => reject(new Error("Could not read image"));
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  return {
    $, $$, escapeHtml, applyBrand, initials, lookupLabel, situationLabel,
    formatDate, operatorUnlocked, unlockOperator, statusMeta, fileToPhoto
  };
})();
