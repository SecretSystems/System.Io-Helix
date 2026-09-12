/* ============================================================
   Secret Systems — /get-started checkout page
   Vanilla JS, no framework/build step (matches the rest of the
   site). Handles: package/add-on state, promo-code validation via
   the Supabase edge function, order summary, the moving demo
   gallery, main-video offscreen pause, and redirecting to the
   configured HighLevel checkout destination.
   ============================================================ */
(function(){
  "use strict";

  var cfg = window.SS_CHECKOUT_CONFIG || {};
  var ssReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  var LS_PROMO_KEY = "ss_checkout_promo";

  var state = {
    addGrowthSuite: false,
    promoApplied: false,
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
    var growthMonthly = state.addGrowthSuite ? cfg.DISPLAY_PRICING.growthSuiteMonthly : 0;
    return {
      websiteOnce: tier.websiteOnce,
      careMonthly: tier.careMonthly,
      growthSuiteMonthly: growthMonthly,
      dueToday: tier.websiteOnce,
      monthlyRecurring: tier.careMonthly + growthMonthly
    };
  }

  function renderPricing(){
    var p = currentDisplayPricing();
    var regular = cfg.DISPLAY_PRICING.regular;

    els.websitePrice.textContent = fmtMoney(p.websiteOnce);
    els.carePrice.textContent = fmtMoney(p.careMonthly) + "/mo";

    if (state.promoApplied){
      els.websiteStrike.textContent = fmtMoney(regular.websiteOnce);
      els.websiteStrike.hidden = false;
      els.careStrike.textContent = fmtMoney(regular.careMonthly) + "/mo";
      els.careStrike.hidden = false;
    } else {
      els.websiteStrike.hidden = true;
      els.careStrike.hidden = true;
    }

    els.sumWebsite.textContent = fmtMoney(p.websiteOnce);
    els.sumCare.textContent = fmtMoney(p.careMonthly) + "/mo";

    if (state.addGrowthSuite){
      els.sumGrowthRow.hidden = false;
      els.sumGrowth.textContent = fmtMoney(cfg.DISPLAY_PRICING.growthSuiteMonthly) + "/mo";
    } else {
      els.sumGrowthRow.hidden = true;
    }

    if (state.promoApplied){
      var savedToday = regular.websiteOnce - p.websiteOnce;
      els.sumSavingsRow.hidden = false;
      els.sumSavings.textContent = "−" + fmtMoney(savedToday) + " today";
    } else {
      els.sumSavingsRow.hidden = true;
    }

    els.totalToday.textContent = fmtMoney(p.dueToday);
    els.totalMonthly.textContent = fmtMoney(p.monthlyRecurring) + "/mo";

    els.addonPrice.textContent = state.addGrowthSuite
      ? "+ " + fmtMoney(cfg.DISPLAY_PRICING.growthSuiteMonthly) + "/month added"
      : "+ " + fmtMoney(cfg.DISPLAY_PRICING.growthSuiteMonthly) + "/month if added";
  }

  /* ============================================================
     Promo code
     ============================================================ */
  function saveLocalPromo(){
    try {
      if (state.promoApplied){
        localStorage.setItem(LS_PROMO_KEY, state.promoCode);
      } else {
        localStorage.removeItem(LS_PROMO_KEY);
      }
    } catch (e){}
  }

  function loadLocalPromo(){
    try { return localStorage.getItem(LS_PROMO_KEY) || ""; } catch (e){ return ""; }
  }

  function showPromoStatus(message, isOk){
    els.promoStatus.hidden = false;
    els.promoStatus.textContent = message;
    els.promoStatus.className = "gs-promo-status " + (isOk ? "ok" : "err");
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

  function applyPromoCode(code, opts){
    var silent = opts && opts.silent;
    return validateSelection(code).then(function(result){
      if (!result.data.ok){
        if (!silent){
          showPromoStatus("That code isn't valid. Double-check it and try again.", false);
        }
        state.promoApplied = false;
        state.promoCode = "";
        state.pricing = null;
        renderPricing();
        return false;
      }
      state.pricing = result.data.pricing;
      state.promoApplied = !!result.data.promoApplied;
      state.promoCode = state.promoApplied ? code.trim() : "";
      if (state.promoApplied){
        showPromoStatus("Promo applied — pricing updated below.", true);
        trackEvent("promo_code_applied", { promo_valid: true });
      } else if (!silent && code) {
        showPromoStatus("That code isn't valid. Double-check it and try again.", false);
      }
      saveLocalPromo();
      renderPricing();
      return state.promoApplied;
    }).catch(function(){
      if (!silent) showPromoStatus("Couldn't check that code right now — please try again.", false);
      return false;
    });
  }

  /* Re-validate (silently) whenever the package selection changes, so
     an already-applied promo code's numbers stay correct against the
     new selection, and so the Growth Suite price is never affected by
     the promo per the pricing rules. */
  function revalidateCurrentSelection(){
    if (!state.promoApplied) { renderPricing(); return; }
    applyPromoCode(state.promoCode, { silent: true });
  }

  /* ============================================================
     Growth Suite toggle
     ============================================================ */
  function onGrowthToggle(){
    state.addGrowthSuite = els.growthToggle.checked;
    if (state.addGrowthSuite){
      trackEvent("growth_suite_selected", {});
    }
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
      trackEvent("checkout_completed_redirect", { destination: result.data.destinationKey });
      return { ok: true, url: url };
    }).catch(function(){
      return { ok: false, message: "We couldn't reach checkout right now. Please try again in a moment." };
    });
  }

  /* ============================================================
     Moving demo gallery
     ============================================================ */
  var GALLERY_CLIPS = [
    { base: "clip-1" }, { base: "clip-2" }, { base: "clip-3" },
    { base: "clip-4" }, { base: "clip-5" }, { base: "gateway" }
  ];
  var CLIP_BASE_PATH = "/assets/video/Demo video small/optimized/";

  function makeClipEl(clip){
    var wrap = document.createElement("div");
    wrap.className = "gs-clip";
    if (ssReduce){
      var img = document.createElement("img");
      img.src = CLIP_BASE_PATH + clip.base + "-poster.jpg";
      img.alt = "";
      img.loading = "lazy";
      wrap.appendChild(img);
      return wrap;
    }
    var video = document.createElement("video");
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "none";
    video.setAttribute("aria-hidden", "true");
    video.poster = CLIP_BASE_PATH + clip.base + "-poster.jpg";
    var sourceWebm = document.createElement("source");
    sourceWebm.src = CLIP_BASE_PATH + clip.base + ".webm";
    sourceWebm.type = "video/webm";
    var sourceMp4 = document.createElement("source");
    sourceMp4.src = CLIP_BASE_PATH + clip.base + ".mp4";
    sourceMp4.type = "video/mp4";
    video.appendChild(sourceWebm);
    video.appendChild(sourceMp4);
    wrap.appendChild(video);
    return wrap;
  }

  function buildGalleryTrack(container, clips){
    // duplicate the clip list once so the loop can reset invisibly at 50% scroll
    var doubled = clips.concat(clips);
    doubled.forEach(function(clip){ container.appendChild(makeClipEl(clip)); });
  }

  function lazyLoadGalleryVideos(){
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(".gs-clip video").forEach(function(v){ v.preload = "auto"; v.play().catch(function(){}); });
      return;
    }
    var observer = new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        var video = entry.target;
        if (entry.isIntersecting){
          if (!video.src && video.preload === "none") video.preload = "auto";
          video.play().catch(function(){});
        } else {
          video.pause();
        }
      });
    }, { rootMargin: "200px" });
    document.querySelectorAll(".gs-clip video").forEach(function(v){ observer.observe(v); });
  }

  function initGallery(){
    if (!els.trackA || !els.trackB) return;
    // Split the six clips across two rows moving in opposite directions.
    var half = Math.ceil(GALLERY_CLIPS.length / 2);
    buildGalleryTrack(els.trackA, GALLERY_CLIPS.slice(0, half));
    buildGalleryTrack(els.trackB, GALLERY_CLIPS.slice(half));
    lazyLoadGalleryVideos();
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
    els.websitePrice = document.getElementById("gs-website-price");
    els.websiteStrike = document.getElementById("gs-website-strike");
    els.carePrice = document.getElementById("gs-care-price");
    els.careStrike = document.getElementById("gs-care-strike");
    els.growthToggle = document.getElementById("gs-growth-toggle");
    els.addonPrice = document.getElementById("gs-addon-price");
    els.sumWebsite = document.getElementById("gs-sum-website");
    els.sumCare = document.getElementById("gs-sum-care");
    els.sumGrowthRow = document.getElementById("gs-sum-growth-row");
    els.sumGrowth = document.getElementById("gs-sum-growth");
    els.sumSavingsRow = document.getElementById("gs-sum-savings-row");
    els.sumSavings = document.getElementById("gs-sum-savings");
    els.totalToday = document.getElementById("gs-total-today");
    els.totalMonthly = document.getElementById("gs-total-monthly");
    els.promoToggleBtn = document.getElementById("gs-promo-toggle-btn");
    els.promoForm = document.getElementById("gs-promo-form");
    els.promoInput = document.getElementById("gs-promo-input");
    els.promoStatus = document.getElementById("gs-promo-status");
    els.summaryCta = document.getElementById("gs-summary-cta");
    els.heroCta = document.getElementById("gs-hero-cta");
    els.contactForm = document.getElementById("gs-contact-form");
    els.formError = document.getElementById("gs-form-error");
    els.finalCta = document.getElementById("gs-final-cta");
    els.trackA = document.getElementById("gs-track-a");
    els.trackB = document.getElementById("gs-track-b");
  }

  function openPromoForm(){
    els.promoForm.classList.add("is-open");
    els.promoForm.setAttribute("aria-hidden", "false");
    els.promoToggleBtn.setAttribute("aria-expanded", "true");
    els.promoInput.focus();
  }

  function init(){
    collectEls();
    renderPricing();

    if (els.growthToggle){
      els.growthToggle.addEventListener("change", onGrowthToggle);
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

    initGallery();
    initMainVideoObserver();

    // Promo URL support: https://secretsystems.io/get-started/?promo=five
    var params = new URLSearchParams(window.location.search);
    var urlPromo = params.get("promo");
    var storedPromo = loadLocalPromo();
    var promoToTry = urlPromo || storedPromo;
    if (promoToTry){
      if (els.promoForm) openPromoForm();
      if (els.promoInput) els.promoInput.value = promoToTry;
      applyPromoCode(promoToTry, { silent: !urlPromo });
    }

    trackEvent("checkout_page_viewed", {});
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
