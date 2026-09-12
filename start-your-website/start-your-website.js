/* ============================================================
   Secret Systems — /start-your-website
   Three-package selection + Promo 5 validation + HighLevel checkout
   routing. Vanilla JS, no framework/build step, matches the rest of
   the site's pattern (see /get-started/get-started.js).

   Security notes:
   - Promo eligibility is decided server-side by the existing
     validate-checkout Supabase Edge Function, every time. This file
     never decides eligibility on its own.
   - `state.promoApplied` lives ONLY in an in-memory JS variable for
     the current loaded page. It is never written to localStorage,
     sessionStorage, a cookie, or any other client-persisted store,
     and is never read from one. A page refresh or reopen always
     starts with promoApplied = false — the customer must re-enter
     and re-validate the code in that session before any promotional
     price or checkout URL is used. Setting values directly in
     localStorage/sessionStorage from devtools has no code path that
     reads them into this state, so it cannot activate promotional
     pricing or routing.
   - The promo code is NEVER accepted from, read from, or written to
     the URL (no ?promo= support). It can only enter this page's
     memory via the visible input field, submitted through the form.
   - Raw promo codes are never sent to analytics.
   - HighLevel URLs are centralized in ss-syw-config.js and are
     never modified here.
   ============================================================ */
(function () {
  "use strict";

  var cfg = window.SS_SYW_CONFIG || {};

  var state = {
    selected: "growth", // "website" | "growth" | "marketDominator" — Growth System preselected
    promoApplied: false, // in-memory only for this page load — never persisted, never read from storage or URL
    promoCode: ""
  };

  var els = {};

  function trackEvent(name, params) {
    try {
      if (typeof window.gtag === "function") window.gtag("event", name, params || {});
    } catch (e) { /* analytics must never break the page */ }
  }

  function fmtMoney(n) {
    return "$" + Number(n).toLocaleString("en-US");
  }

  /* ============================================================
     Promo validation — server is the sole source of truth
     ============================================================ */
  function validatePromo(code) {
    if (!cfg.VALIDATE_ENDPOINT) return Promise.resolve({ ok: false });
    return fetch(cfg.VALIDATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": cfg.SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + cfg.SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ package: "website", promoCode: code || "" })
    }).then(function (res) {
      return res.json().then(function (data) {
        return { status: res.status, ok: res.ok && !!data.ok && !!data.promoApplied };
      });
    }).catch(function () {
      return { ok: false, networkError: true };
    });
  }

  function setPromoStatus(message, kind) {
    els.promoStatus.hidden = false;
    els.promoStatus.textContent = message;
    els.promoStatus.className = "syw-promo-status" + (kind ? " " + kind : "");
  }

  function setPromoLoading(isLoading) {
    els.promoBtn.disabled = isLoading;
    els.promoBtn.textContent = isLoading ? "Checking…" : "Apply Code";
    els.promoBtn.setAttribute("aria-busy", isLoading ? "true" : "false");
  }

  function applyPromoCode(code) {
    var trimmed = (code || "").trim();
    if (!trimmed) return Promise.resolve(false);

    trackEvent("promo_validation_started", {});
    setPromoLoading(true);

    return validatePromo(trimmed).then(function (result) {
      setPromoLoading(false);
      if (result.ok) {
        state.promoApplied = true;
        state.promoCode = trimmed;
        setPromoStatus("Promo 5 verified. Your eligible launch pricing has been applied.", "ok");
        trackEvent("promo_validation_success", {});
        renderAll();
        return true;
      }
      state.promoApplied = false;
      state.promoCode = "";
      setPromoStatus("That promotional code could not be verified. Check the code and try again.", "err");
      trackEvent("promo_validation_failed", {});
      renderAll();
      return false;
    });
  }

  /* ============================================================
     Package selection
     ============================================================ */
  function selectPackage(key) {
    if (state.selected === key) return;
    state.selected = key;
    trackEvent("package_selected", { package: key });
    renderAll();
  }

  function currentPricing() {
    var tier = state.promoApplied ? "promo" : "regular";
    return {
      website: cfg.PRICING.website[tier],
      growth: cfg.PRICING.growth[tier],
      marketDominator: cfg.PRICING.marketDominator
    };
  }

  /* ============================================================
     Rendering
     ============================================================ */
  function renderCardPricing() {
    var p = currentPricing();

    els.websiteCarePrice.textContent = fmtMoney(p.website.monthly) + "/mo";
    if (state.promoApplied) {
      els.websiteCareStrike.hidden = false;
      els.websiteCareStrike.textContent = fmtMoney(cfg.PRICING.website.regular.monthly) + "/mo";
    } else {
      els.websiteCareStrike.hidden = true;
    }

    els.growthPrice.textContent = fmtMoney(p.growth.monthly) + "/mo";
  }

  function renderSelectedState() {
    var cards = [
      { key: "website", el: els.cardWebsite },
      { key: "growth", el: els.cardGrowth },
      { key: "marketDominator", el: els.cardMarketDominator }
    ];
    cards.forEach(function (c) {
      var isSelected = state.selected === c.key;
      c.el.classList.toggle("is-selected", isSelected);
      c.el.setAttribute("aria-pressed", isSelected ? "true" : "false");
    });
  }

  function renderSummary() {
    var p = currentPricing();

    els.summaryPackageName.textContent =
      state.selected === "website" ? "Website" :
      state.selected === "growth" ? "Growth System" : "Market Dominator";

    if (state.selected === "marketDominator") {
      els.summaryStandard.hidden = true;
      els.summaryCustom.hidden = false;
      els.summaryPromoRow.hidden = true;
      els.summaryCta.textContent = "Apply for Market Dominator";
      els.summaryCta.href = cfg.MARKET_DOMINATOR_ROUTE || "/contact/";
      els.summaryNote.textContent = "Custom approval required. A Secret Systems team member will confirm scope and pricing with you before anything is billed.";
      return;
    }

    els.summaryStandard.hidden = false;
    els.summaryCustom.hidden = true;

    var pack = state.selected === "website" ? p.website : p.growth;
    els.summaryDueToday.textContent = fmtMoney(pack.dueToday);
    els.summaryMonthly.textContent = fmtMoney(pack.monthly) + "/mo";

    if (state.selected === "growth") {
      els.summaryStandardNote.hidden = false;
      els.summaryStandardNote.textContent = "Standard rate $" + cfg.PRICING.growth.regular.standardMonthly + "/mo — currently discounted.";
    } else {
      els.summaryStandardNote.hidden = true;
    }

    if (state.promoApplied) {
      els.summaryPromoRow.hidden = false;
    } else {
      els.summaryPromoRow.hidden = true;
    }

    els.summaryCta.textContent = state.selected === "growth" ? "Build My Growth System" : "Launch My Website";
    els.summaryCta.href = "#";
    els.summaryNote.textContent = "Your selected monthly service begins immediately and renews monthly until cancelled according to your service agreement.";
  }

  function renderAll() {
    renderCardPricing();
    renderSelectedState();
    renderSummary();
  }

  /* ============================================================
     Checkout routing — centralized, exact URLs, never modified
     ============================================================ */
  function destinationFor(packageKey) {
    var urls = cfg.HIGHLEVEL_CHECKOUT_URLS || {};
    if (packageKey === "website") {
      return state.promoApplied ? urls.promoWebsite : urls.regularWebsite;
    }
    if (packageKey === "growth") {
      return state.promoApplied ? urls.promoGrowth : urls.regularGrowth;
    }
    return null;
  }

  function goToCheckout(packageKey) {
    if (packageKey === "marketDominator") {
      trackEvent("market_dominator_application_started", {});
      window.location.href = cfg.MARKET_DOMINATOR_ROUTE || "/contact/";
      return;
    }
    var url = destinationFor(packageKey);
    if (!url) {
      setPromoStatus("Checkout isn't connected yet for this option. Please contact us directly to get started.", "err");
      return;
    }
    trackEvent("checkout_redirect_started", { package: packageKey, promo_applied: state.promoApplied });
    window.location.href = url;
  }

  /* ============================================================
     Judge for Yourself: video gallery
     Native controls, no autoplay. Starting one video pauses the
     others so only one ever plays at a time.
     ============================================================ */
  function initGalleryVideos() {
    var videos = document.querySelectorAll(".syw-gallery-video");
    videos.forEach(function (v) {
      v.addEventListener("play", function () {
        videos.forEach(function (other) {
          if (other !== v && !other.paused) other.pause();
        });
      });
    });
  }

  /* ============================================================
     FAQ (matches /get-started/ interaction pattern)
     ============================================================ */
  function toggleFaq(el) {
    var open = el.parentElement.classList.toggle("open");
    el.setAttribute("aria-expanded", open ? "true" : "false");
  }
  window.sywToggleFaq = toggleFaq;

  /* ============================================================
     Wire up
     ============================================================ */
  function collectEls() {
    els.cardWebsite = document.getElementById("syw-card-website");
    els.cardGrowth = document.getElementById("syw-card-growth");
    els.cardMarketDominator = document.getElementById("syw-card-market-dominator");

    els.websiteCarePrice = document.getElementById("syw-website-care-price");
    els.websiteCareStrike = document.getElementById("syw-website-care-strike");
    els.growthPrice = document.getElementById("syw-growth-price");

    els.summaryPackageName = document.getElementById("syw-summary-package-name");
    els.summaryStandard = document.getElementById("syw-summary-standard");
    els.summaryCustom = document.getElementById("syw-summary-custom");
    els.summaryDueToday = document.getElementById("syw-summary-due-today");
    els.summaryMonthly = document.getElementById("syw-summary-monthly");
    els.summaryStandardNote = document.getElementById("syw-summary-standard-note");
    els.summaryPromoRow = document.getElementById("syw-summary-promo-row");
    els.summaryCta = document.getElementById("syw-summary-cta");
    els.summaryNote = document.getElementById("syw-summary-note");

    els.promoInput = document.getElementById("syw-promo-input");
    els.promoBtn = document.getElementById("syw-promo-btn");
    els.promoForm = document.getElementById("syw-promo-form");
    els.promoStatus = document.getElementById("syw-promo-status");

    els.ctaWebsite = document.getElementById("syw-cta-website");
    els.ctaGrowth = document.getElementById("syw-cta-growth");
    els.ctaMarketDominator = document.getElementById("syw-cta-market-dominator");

    els.offerEndNote = document.getElementById("syw-offer-end-note");
  }

  function initGrowthOfferDate() {
    if (!els.offerEndNote) return;
    var raw = cfg.growthOfferEndDate;
    if (!raw) return;
    var d = new Date(raw);
    if (isNaN(d.getTime())) return;
    var formatted = d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
    els.offerEndNote.hidden = false;
    els.offerEndNote.textContent = "This rate is available through " + formatted + ".";
  }

  function initCardSelection() {
    [
      { el: els.cardWebsite, key: "website" },
      { el: els.cardGrowth, key: "growth" },
      { el: els.cardMarketDominator, key: "marketDominator" }
    ].forEach(function (item) {
      if (!item.el) return;
      item.el.setAttribute("role", "button");
      item.el.setAttribute("tabindex", "0");
      item.el.addEventListener("click", function (e) {
        // Let inner links/buttons (the CTA itself) behave normally without
        // double-triggering selection + navigation from the card wrapper.
        if (e.target.closest("a,button")) return;
        selectPackage(item.key);
      });
      item.el.addEventListener("keydown", function (e) {
        if (e.target.closest("a,button")) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          selectPackage(item.key);
        }
      });
    });
  }

  function initCtas() {
    if (els.ctaWebsite) {
      els.ctaWebsite.addEventListener("click", function (e) {
        e.preventDefault();
        selectPackage("website");
        goToCheckout("website");
      });
    }
    if (els.ctaGrowth) {
      els.ctaGrowth.addEventListener("click", function (e) {
        e.preventDefault();
        selectPackage("growth");
        goToCheckout("growth");
      });
    }
    if (els.ctaMarketDominator) {
      els.ctaMarketDominator.addEventListener("click", function (e) {
        e.preventDefault();
        selectPackage("marketDominator");
        goToCheckout("marketDominator");
      });
    }
    if (els.summaryCta) {
      els.summaryCta.addEventListener("click", function (e) {
        e.preventDefault();
        goToCheckout(state.selected);
      });
    }
  }

  function initPromoForm() {
    if (!els.promoForm) return;
    els.promoForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var code = els.promoInput.value;
      if (!code.trim()) return;
      applyPromoCode(code);
    });
  }

  function init() {
    collectEls();
    initGrowthOfferDate();
    initCardSelection();
    initCtas();
    initPromoForm();
    initGalleryVideos();
    renderAll();

    // Deliberately no promo restoration of any kind here. Every fresh
    // page load starts at standard pricing (promoApplied = false) and
    // stays that way until the customer types a code into the visible
    // input and it is validated by the server during this page session.
    // No ?promo= URL parameter is ever read, and no stored value from
    // localStorage/sessionStorage is ever consulted.
    trackEvent("checkout_page_view", { page: "start-your-website" });
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
