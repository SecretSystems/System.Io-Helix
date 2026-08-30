/* ============================================================
   Secret Systems — Google Review Stand product page
   Single standardized product, quantity-only. Secret Systems
   fulfills directly; checkout happens on a branded GoHighLevel
   (GHL) checkout page — this static site never touches payment,
   inventory, or shipping.
   ============================================================ */
(function(){
  "use strict";

  /* ── EDITABLE CONFIG ──
     PRICE: current per-unit price shown on the page.
     GHL_CHECKOUT_URL: the branded GoHighLevel checkout link for this
     product (e.g. hosted at checkout.secretsystems.io). Leave "" until
     a real checkout page exists — the page stays fully functional and
     falls back to /contact/ so the CTA is never a dead link. */
  var REVIEW_STAND_CONFIG = {
    PRICE: 25,
    GHL_CHECKOUT_URL: ""
  };

  var FALLBACK_LINK = "/contact/";
  var UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  function track(eventName, params){
    try{
      if(typeof window.gtag === "function"){
        window.gtag("event", eventName, params || {});
      }
    }catch(e){ /* never let analytics break the page */ }
  }

  var qty = 1;

  document.addEventListener("DOMContentLoaded", function(){
    document.getElementById("rsPrice").textContent = REVIEW_STAND_CONFIG.PRICE;
    initQty();
    initOrderButton();
    track("view_review_stand", { item_name: "Google Review Stand", price: REVIEW_STAND_CONFIG.PRICE });
    initFaqToggles();
  });

  function initQty(){
    var value = document.getElementById("rsQtyValue");
    document.getElementById("rsQtyMinus").addEventListener("click", function(){
      if(qty > 1){ qty--; value.textContent = qty; }
    });
    document.getElementById("rsQtyPlus").addEventListener("click", function(){
      qty++; value.textContent = qty;
    });
  }

  function getIncomingUtmParams(){
    var params = new URLSearchParams(window.location.search);
    var out = {};
    UTM_KEYS.forEach(function(key){
      if(params.has(key)) out[key] = params.get(key);
    });
    return out;
  }

  function appendUtmParams(url, utmParams){
    var keys = Object.keys(utmParams);
    if(!keys.length) return url;
    var joined = keys.map(function(k){ return encodeURIComponent(k) + "=" + encodeURIComponent(utmParams[k]); }).join("&");
    return url + (url.indexOf("?") === -1 ? "?" : "&") + joined;
  }

  function initOrderButton(){
    var btn = document.getElementById("rsOrderBtn");
    btn.addEventListener("click", function(){
      var value = REVIEW_STAND_CONFIG.PRICE * qty;
      track("begin_review_stand_checkout", { item_name: "Google Review Stand", quantity: qty, value: value });

      var target = REVIEW_STAND_CONFIG.GHL_CHECKOUT_URL && REVIEW_STAND_CONFIG.GHL_CHECKOUT_URL.length
        ? REVIEW_STAND_CONFIG.GHL_CHECKOUT_URL
        : FALLBACK_LINK;

      target = appendUtmParams(target, getIncomingUtmParams());

      window.location.href = target;
    });
  }

  function initFaqToggles(){
    document.querySelectorAll(".faq-q").forEach(function(b){
      b.addEventListener("click", function(){
        var expanded = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!expanded));
      });
    });
  }
})();
