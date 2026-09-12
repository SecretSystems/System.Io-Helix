/* ============================================================
   Secret Systems — /get-started checkout page
   Vanilla JS, no framework/build step (matches the rest of the
   site). Handles: two-package selection (Website / Website +
   Growth), promo-code validation via the Supabase edge function,
   order summary, the "Judge for Yourself" video gallery, main-video
   offscreen pause, and redirecting to the configured HighLevel
   checkout destination.

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
     price or checkout URL is used.
   - The promo code is NEVER accepted from, read from, or written to
     the URL. It can only enter this page's memory via the visible
     input field, submitted through the form.
   - Raw promo codes are never sent to analytics or shown in visible
     page content.
   - HighLevel URLs are centralized in ss-checkout-config.js and are
     never modified here.
   ============================================================ */
(function(){
  "use strict";

  var cfg = window.SS_CHECKOUT_CONFIG || {};
  var ssReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  var state = {
    addGrowthSuite: false, // false = Website only, true = Website + Growth (recommended, default selected)
    promoApplied: false,   // in-memory only for this page load — never persisted, never read from storage or URL
    promoCode: "",
    pricing: null // set once validated by the edge function; falls back to DISPLAY_PRICING until then
  };

  var els = {};

  function trackEvent(name, params){
    try {
      if (typeof window.gtag === "function") window.gtag("event", name, params || {});
    } catch (e){ /* analytics must never break the page */ }
  }

  function fmtMoney(n){
    return "$" + Number(n).toLocaleString("en-US");
  }

  /* ============================================================
     Pricing (client-side display before validation, authoritative
     numbers come from the edge function once a promo is checked)
     ============================================================ */
  function currentDisplayPricing(){
    if (state.pricing) return state.pricing;
    var tier = state.promoApplied ? cfg.DISPLAY_PRICING.promo : cfg.DISPLAY_PRICING.regular;
    if (state.addGrowthSuite){
      return {
        websiteOnce: tier.websiteOnce,
        careMonthly: 0,
        growthSuiteMonthly: cfg.DISPLAY_PRICING.growthSuiteMonthly,
        dueToday: tier.websiteOnce + cfg.DISPLAY_PRICING.growthSuiteMonthly,
        monthlyRecurring: cfg.DISPLAY_PRICING.growthSuiteMonthly
      };
    }
    return {
      websiteOnce: tier.websiteOnce,
      careMonthly: tier.careMonthly,
      growthSuiteMonthly: 0,
      dueToday: tier.websiteOnce,
      monthlyRecurring: tier.careMonthly
    };
  }

  function renderCardPricing(){
    var regular = cfg.DISPLAY_PRICING.regular;
    var promo = cfg.DISPLAY_PRICING.promo;
    var tier = state.promoApplied ? promo : regular;

    // Website-only card
    els.websitePrice.textContent = fmtMoney(tier.websiteOnce);
    els.carePriceInline.textContent = fmtMoney(tier.careMonthly) + "/mo";
    els.carePrice.textContent = fmtMoney(tier.careMonthly) + "/month";
    if (state.promoApplied){
      els.websiteStrike.textContent = fmtMoney(regular.websiteOnce);
      els.websiteStrike.hidden = false;
    } else {
      els.websiteStrike.hidden = true;
    }

    // Website + Growth card
    els.growthWebsitePrice.textContent = fmtMoney(tier.websiteOnce);
    if (state.promoApplied){
      els.growthWebsiteStrike.textContent = fmtMoney(regular.websiteOnce);
      els.growthWebsiteStrike.hidden = false;
    } else {
      els.growthWebsiteStrike.hidden = true;
    }
    els.growthDueTodayNote.textContent = fmtMoney(tier.websiteOnce + cfg.DISPLAY_PRICING.growthSuiteMonthly) + " due today";
  }

  function renderSummary(){
    var p = currentDisplayPricing();
    var regular = cfg.DISPLAY_PRICING.regular;

    els.summaryPackageName.textContent = state.addGrowthSuite ? "Website + Growth" : "Website";

    if (state.addGrowthSuite){
      els.sumWebsiteLabel.textContent = "Website (one time)";
      els.sumWebsite.textContent = fmtMoney(p.websiteOnce);
      els.sumGrowthRow.hidden = false;
      els.sumGrowth.textContent = fmtMoney(p.growthSuiteMonthly);
      els.summaryMonthlyNote.innerHTML = "Then <strong>" + fmtMoney(p.monthlyRecurring) + "/mo</strong> — Website Care is included.";
    } else {
      els.sumWebsiteLabel.textContent = "Website (one time)";
      els.sumWebsite.textContent = fmtMoney(p.websiteOnce);
      els.sumGrowthRow.hidden = true;
      els.summaryMonthlyNote.innerHTML = "Then <strong>" + fmtMoney(p.careMonthly) + "/mo</strong> after your 30-day Website Care trial.";
    }

    if (state.promoApplied){
      var savedToday = regular.websiteOnce - p.websiteOnce;
      els.sumSavingsRow.hidden = false;
      els.sumSavings.textContent = "−" + fmtMoney(savedToday) + " today";
    } else {
      els.sumSavingsRow.hidden = true;
    }

    els.totalToday.textContent = fmtMoney(p.dueToday);
  }

  function renderSelectedState(){
    els.cardWebsite.classList.toggle("is-selected", !state.addGrowthSuite);
    els.cardWebsite.setAttribute("aria-pressed", String(!state.addGrowthSuite));
    els.cardGrowth.classList.toggle("is-selected", state.addGrowthSuite);
    els.cardGrowth.setAttribute("aria-pressed", String(state.addGrowthSuite));
  }

  function renderAll(){
    renderCardPricing();
    renderSelectedState();
    renderSummary();
  }

  /* ============================================================
     Promo code — server is the sole source of truth
     ============================================================ */
  function showPromoStatus(message, kind){
    els.promoStatus.hidden = false;
    els.promoStatus.textContent = message;
    els.promoStatus.className = "gs-promo-status" + (kind ? " " + kind : "");
  }

  function setPromoLoading(isLoading){
    els.promoBtn.disabled = isLoading;
    els.promoBtn.textContent = isLoading ? "Checking…" : "Apply";
    els.promoBtn.setAttribute("aria-busy", isLoading ? "true" : "false");
  }

  function currentPackageKey(){
    return state.addGrowthSuite ? "website_growth" : "website";
  }

  function validateSelection(promoCodeInput){
    return fetch(cfg.VALIDATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": cfg.SUPABASE_ANON_KEY,
        "Authorization": "Bearer " + cfg.SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        package: currentPackageKey(),
        promoCode: promoCodeInput || ""
      })
    }).then(function(res){
      return res.json().then(function(data){ return { status: res.status, data: data }; });
    });
  }

  function applyPromoCode(code){
    var trimmed = (code || "").trim();
    if (!trimmed) return Promise.resolve(false);

    trackEvent("promo_validation_started", {});
    setPromoLoading(true);

    return validateSelection(trimmed).then(function(result){
      setPromoLoading(false);
      if (!result.data.ok || !result.data.promoApplied){
        state.promoApplied = false;
        state.promoCode = "";
        state.pricing = null;
        showPromoStatus("That promotional code could not be verified. Check the code and try again.", "err");
        trackEvent("promo_validation_failed", {});
        renderAll();
        return false;
      }
      state.pricing = result.data.pricing;
      state.promoApplied = true;
      state.promoCode = trimmed;
      showPromoStatus("Promo verified. Your eligible launch pricing has been applied.", "ok");
      trackEvent("promo_validation_success", {});
      renderAll();
      return true;
    }).catch(function(){
      setPromoLoading(false);
      state.promoApplied = false;
      state.promoCode = "";
      state.pricing = null;
      showPromoStatus("That promotional code could not be verified. Check the code and try again.", "err");
      renderAll();
      return false;
    });
  }

  /* Re-validate (silently) whenever the package selection changes, so
     an already-applied promo code's numbers stay correct against the
     new selection. */
  function revalidateCurrentSelection(){
    if (!state.promoApplied) { state.pricing = null; renderAll(); return; }
    validateSelection(state.promoCode).then(function(result){
      if (result.data.ok && result.data.promoApplied){
        state.pricing = result.data.pricing;
      } else {
        state.promoApplied = false;
        state.promoCode = "";
        state.pricing = null;
      }
      renderAll();
    }).catch(function(){
      renderAll();
    });
  }

  /* ============================================================
     Package selection
     ============================================================ */
  function selectPackage(addGrowth){
    if (state.addGrowthSuite === addGrowth) return;
    state.addGrowthSuite = addGrowth;
    trackEvent("package_selected", { package: addGrowth ? "website_growth" : "website" });
    revalidateCurrentSelection();
  }

  /* ============================================================
     Checkout redirect
     ============================================================ */
  function destinationUrlFor(key){
    return (cfg.HIGHLEVEL_URLS || {})[key] || "";
  }

  function beginCheckout(contact){
    trackEvent("checkout_initiated", { has_growth_suite: state.addGrowthSuite, promo_applied: state.promoApplied });
    return validateSelection(state.promoApplied ? state.promoCode : "").then(function(result){
      if (!result.data.ok){
        return { ok: false, message: "We couldn't confirm your selection. Please refresh and try again." };
      }
      var url = destinationUrlFor(result.data.destinationKey);
      if (!url){
        return { ok: false, message: "Checkout isn't connected yet for this option. Please contact us directly to get started." };
      }
      trackEvent("checkout_redirect_started", { destination: result.data.destinationKey });
      return { ok: true, url: url };
    }).catch(function(){
      return { ok: false, message: "We couldn't reach checkout right now. Please try again in a moment." };
    });
  }

  /* ============================================================
     Judge for Yourself: video gallery
     Native controls, no autoplay. Starting one video pauses the
     others so only one ever plays at a time. Scroll-triggered
     reveal reuses the site's existing .reveal/.reveal.visible
     pattern (see ss-shared.js/ss-shared.css) with a small stagger.
     ============================================================ */
  function initGalleryVideos(){
    var videos = document.querySelectorAll(".gs-gallery-video");
    videos.forEach(function(v){
      v.addEventListener("play", function(){
        videos.forEach(function(other){
          if (other !== v && !other.paused) other.pause();
        });
      });
    });
  }

  function initGalleryReveal(){
    var cards = document.querySelectorAll("#gs-video-grid .gs-video-card");
    cards.forEach(function(card, idx){
      card.style.transitionDelay = ssReduce ? "0ms" : (idx * 90) + "ms";
    });
    // ss-shared.js already observes every .reveal element on the page
    // and adds .visible once when it enters the viewport (threshold
    // 0.1, no re-triggering), so no separate observer is needed here.
  }

  /* ============================================================
     Main video: pause when offscreen to save work
     ============================================================ */
  function initMainVideoObserver(){
    var video = els.mainVideo;
    if (!video || !("IntersectionObserver" in window)) return;
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if (entry.isIntersecting) video.play().catch(function(){});
        else video.pause();
      });
    }, { threshold: 0.15 });
    observer.observe(video);
  }

  /* ============================================================
     Wire up
     ============================================================ */
  function collectEls(){
    els.mainVideo = document.getElementById("gs-main-video");

    els.cardWebsite = document.getElementById("gs-card-website");
    els.cardGrowth = document.getElementById("gs-card-growth");

    els.websitePrice = document.getElementById("gs-website-price");
    els.websiteStrike = document.getElementById("gs-website-strike");
    els.carePriceInline = document.getElementById("gs-care-price-inline");
    els.carePrice = document.getElementById("gs-care-price");

    els.growthWebsitePrice = document.getElementById("gs-growth-website-price");
    els.growthWebsiteStrike = document.getElementById("gs-growth-website-strike");
    els.growthDueTodayNote = document.getElementById("gs-growth-due-today-note");

    els.summaryPackageName = document.getElementById("gs-summary-package-name");
    els.sumWebsiteLabel = document.getElementById("gs-sum-website-label");
    els.sumWebsite = document.getElementById("gs-sum-website");
    els.sumGrowthRow = document.getElementById("gs-sum-growth-row");
    els.sumGrowth = document.getElementById("gs-sum-growth");
    els.sumSavingsRow = document.getElementById("gs-sum-savings-row");
    els.sumSavings = document.getElementById("gs-sum-savings");
    els.totalToday = document.getElementById("gs-total-today");
    els.summaryMonthlyNote = document.getElementById("gs-summary-monthly-note");

    els.promoToggleBtn = document.getElementById("gs-promo-toggle-btn");
    els.promoForm = document.getElementById("gs-promo-form");
    els.promoInput = document.getElementById("gs-promo-input");
    els.promoBtn = document.getElementById("gs-promo-btn");
    els.promoStatus = document.getElementById("gs-promo-status");

    els.summaryCta = document.getElementById("gs-summary-cta");
    els.heroCta = document.getElementById("gs-hero-cta");
    els.ctaWebsite = document.getElementById("gs-cta-website");
    els.ctaGrowth = document.getElementById("gs-cta-growth");

    els.contactForm = document.getElementById("gs-contact-form");
    els.formError = document.getElementById("gs-form-error");
    els.finalCta = document.getElementById("gs-final-cta");
  }

  function openPromoForm(){
    els.promoForm.classList.add("is-open");
    els.promoForm.setAttribute("aria-hidden", "false");
    els.promoToggleBtn.setAttribute("aria-expanded", "true");
    els.promoInput.focus();
  }

  function initCardSelection(){
    [
      { el: els.cardWebsite, addGrowth: false },
      { el: els.cardGrowth, addGrowth: true }
    ].forEach(function(item){
      if (!item.el) return;
      item.el.setAttribute("role", "button");
      item.el.setAttribute("tabindex", "0");
      item.el.addEventListener("click", function(e){
        if (e.target.closest("a,button")) return;
        selectPackage(item.addGrowth);
      });
      item.el.addEventListener("keydown", function(e){
        if (e.target.closest("a,button")) return;
        if (e.key === "Enter" || e.key === " "){
          e.preventDefault();
          selectPackage(item.addGrowth);
        }
      });
    });
  }

  function init(){
    collectEls();
    renderAll();
    initCardSelection();

    if (els.ctaWebsite){
      els.ctaWebsite.addEventListener("click", function(e){
        e.preventDefault();
        selectPackage(false);
        document.getElementById("gs-checkout-form").scrollIntoView({ behavior: ssReduce ? "auto" : "smooth" });
      });
    }
    if (els.ctaGrowth){
      els.ctaGrowth.addEventListener("click", function(e){
        e.preventDefault();
        selectPackage(true);
        document.getElementById("gs-checkout-form").scrollIntoView({ behavior: ssReduce ? "auto" : "smooth" });
      });
    }

    if (els.promoToggleBtn){
      els.promoToggleBtn.addEventListener("click", function(){
        var isOpen = els.promoForm.classList.contains("is-open");
        if (isOpen){
          els.promoForm.classList.remove("is-open");
          els.promoForm.setAttribute("aria-hidden", "true");
          els.promoToggleBtn.setAttribute("aria-expanded", "false");
        } else {
          openPromoForm();
        }
      });
    }

    if (els.promoForm){
      els.promoForm.addEventListener("submit", function(e){
        e.preventDefault();
        var code = els.promoInput.value;
        if (!code.trim()) return;
        applyPromoCode(code);
      });
    }

    if (els.heroCta){
      els.heroCta.addEventListener("click", function(){ trackEvent("main_cta_clicked", { location: "hero" }); });
    }
    if (els.summaryCta){
      els.summaryCta.addEventListener("click", function(){ trackEvent("main_cta_clicked", { location: "summary" }); });
    }

    if (els.contactForm){
      els.contactForm.addEventListener("submit", function(e){
        e.preventDefault();
        els.formError.hidden = true;
        var businessName = document.getElementById("gs-business-name").value.trim();
        var contactName = document.getElementById("gs-contact-name").value.trim();
        var email = document.getElementById("gs-email").value.trim();
        var phone = document.getElementById("gs-phone").value.trim();

        var invalid = [];
        if (!businessName) invalid.push(document.getElementById("gs-business-name"));
        if (!contactName) invalid.push(document.getElementById("gs-contact-name"));
        if (!email || email.indexOf("@") === -1) invalid.push(document.getElementById("gs-email"));

        document.querySelectorAll("#gs-contact-form input").forEach(function(i){ i.removeAttribute("aria-invalid"); });
        if (invalid.length){
          invalid.forEach(function(i){ i.setAttribute("aria-invalid", "true"); });
          els.formError.hidden = false;
          els.formError.textContent = "Please fill in your business name, name, and a valid email before continuing.";
          invalid[0].focus();
          return;
        }

        if (els.finalCta.disabled) return; // guard against duplicate submits
        els.finalCta.disabled = true;
        var originalText = els.finalCta.textContent;
        els.finalCta.textContent = "Redirecting to checkout…";

        beginCheckout({ businessName: businessName, contactName: contactName, email: email, phone: phone }).then(function(result){
          if (result.ok){
            window.location.href = result.url;
          } else {
            els.finalCta.disabled = false;
            els.finalCta.textContent = originalText;
            els.formError.hidden = false;
            els.formError.textContent = result.message;
          }
        });
      });
    }

    initGalleryVideos();
    initGalleryReveal();
    initMainVideoObserver();

    // Deliberately no promo restoration of any kind here. Every fresh
    // page load starts at standard pricing (promoApplied = false) and
    // stays that way until the customer types a code into the visible
    // input and it is validated by the server during this page session.
    // No ?promo= URL parameter is ever read, and no stored value from
    // localStorage/sessionStorage is ever consulted.

    trackEvent("checkout_page_viewed", {});
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
