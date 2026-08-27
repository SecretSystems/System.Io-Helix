/* ============================================================
   Secret Systems — Review Sign product page + cart logic
   Static-site architecture: no backend, no live payment API.
   Checkout hands off to a Stripe Payment Link per style (see
   reviews/STRIPE_SETUP.md). Cart is client-side only (localStorage),
   scoped to this browser/device — it does not sync across devices
   and is not a real order until Stripe checkout completes.
   ============================================================ */
(function(){
  "use strict";

  /* ── EDITABLE CONFIG — fill these in as real facts become available.
     Anything left "" or null is treated as "not yet decided" and is
     hidden from customers rather than shown as a guess. ── */
  var FULFILLMENT = {
    PRODUCTION_TIME: "",      // e.g. "2-3 business days"
    SHIPPING_ESTIMATE: "",    // e.g. "3-5 business days after production"
    FREE_SHIPPING_THRESHOLD: null, // e.g. 75 (dollars) — null disables the free-shipping message entirely
    RETURN_POLICY: "",        // e.g. "30-day replacement guarantee"
    WARRANTY: ""              // e.g. "1-year defect warranty"
  };

  /* Only used if a real product video exists — leave "" to hide the "See it in action" button */
  var PRODUCT_VIDEO_URL = "";

  var PLATFORMS = [
    { slug:"google", name:"Google", icon:'<circle cx="12" cy="12" r="9"/><path d="M8 12h8M12 8v8"/>' },
    { slug:"instagram", name:"Instagram", icon:'<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="12" cy="12" r="3.5"/><circle cx="17" cy="7" r="1"/>' },
    { slug:"tripadvisor", name:"TripAdvisor", icon:'<circle cx="8" cy="13" r="4"/><circle cx="16" cy="13" r="4"/><path d="M2 8h20M8 8V6a4 4 0 0 1 8 0v2"/>' },
    { slug:"facebook", name:"Facebook", icon:'<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M13 20v-6h2l.5-3H13V9c0-1 .5-1.5 1.5-1.5H15V5h-2c-2 0-3 1.2-3 3.3V11H8v3h2v6"/>' },
    { slug:"yelp", name:"Yelp", icon:'<circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 2"/>' },
    { slug:"custom", name:"Website / Custom", icon:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.7 2.6 15.3 0 18M12 3c-2.6 2.7-2.6 15.3 0 18"/>' }
  ];

  /* Two tiers only: Signature Black (fixed design, cheapest) and Custom Design
     (customer uploads their own design, priced higher). No preset style gallery. */
  var TIERS = {
    signature: { slug:"signature", name:"Signature Black", price:25, img:"/reviews/assets/nfc-review-cards.png", paymentLink:"" },
    custom:    { slug:"custom",    name:"Custom Design",   price:40, img:"/reviews/assets/nfc-review-cards.png", paymentLink:"" }
  };

  /* Gallery shows real photos of the Signature Black sign — the only fixed
     design that exists as a physical product right now. Custom Design has
     no preset photo since the design comes from the customer's own upload. */
  var GALLERY_IMAGES = [
    { img:"/reviews/assets/nfc-review-cards.png", name:"Signature Black sign, black and white finish" },
    { img:"/reviews/assets/styles/style-standard-blackwhite.jpg", name:"Signature Black sign with dimensions" }
  ];
  var SIGN_SIZE = "120mm × 140mm × 50mm base"; // the only size currently available
  var FALLBACK_LINK = "/contact/";
  var CART_KEY = "ss_reviews_cart_v1";
  var SAVE_KEY = "ss_reviews_saved_v1";

  function platformBySlug(slug){ return PLATFORMS.filter(function(p){ return p.slug === slug; })[0] || PLATFORMS[0]; }

  /* ── Analytics — fires through window.gtag only if GA4 is actually configured; otherwise a safe no-op ── */
  function track(eventName, params){
    try{
      if(typeof window.gtag === "function"){
        window.gtag("event", eventName, params || {});
      }
    }catch(e){ /* never let analytics break the page */ }
  }

  /* ── State ── */
  var state = {
    tier: "signature",
    price: 25,
    platform: "google",
    qty: 1,
    destUrl: "",
    bizName: "",
    orderNote: "",
    logoFile: null,
    logoDataUrl: ""
  };

  document.addEventListener("DOMContentLoaded", function(){
    initHeader();
    initGallery();
    initSaveButton();
    initPlatformGrid();
    initTierGrid();
    initQty();
    initFields();
    initUpload();
    initGuideToggle();
    initFaqToggles();
    initBuyButtons();
    initStickyBarVisibility();
    initCart();
    initZoom();
    updateAll();
    track("product_viewed", { item_name: "Custom NFC + QR Review Sign" });
  });

  /* ── Header (back / search / share / cart badge) ── */
  function initHeader(){
    var backBtn = document.getElementById("pdpBack");
    backBtn.addEventListener("click", function(){
      if(document.referrer && document.referrer.indexOf(location.host) !== -1){ history.back(); }
      else { location.href = "/"; }
    });

    var searchToggle = document.getElementById("pdpSearchToggle");
    var searchRow = document.getElementById("pdpSearchRow");
    searchToggle.addEventListener("click", function(){
      var open = searchRow.classList.toggle("is-open");
      searchToggle.setAttribute("aria-expanded", String(open));
      if(open) document.getElementById("pdpSearchInput").focus();
    });

    var shareBtn = document.getElementById("pdpShare");
    shareBtn.addEventListener("click", function(){
      var shareData = { title: document.title, url: location.href };
      if(navigator.share){
        navigator.share(shareData).catch(function(){ /* user cancelled — ignore */ });
      } else if(navigator.clipboard){
        navigator.clipboard.writeText(location.href).then(function(){
          announce("Link copied to clipboard");
        }).catch(function(){});
      }
    });

    document.getElementById("pdpCartOpen").addEventListener("click", openCart);
  }

  var liveRegion;
  function announce(msg){
    if(!liveRegion){
      liveRegion = document.createElement("div");
      liveRegion.className = "sr-only";
      liveRegion.setAttribute("role", "status");
      liveRegion.setAttribute("aria-live", "polite");
      document.body.appendChild(liveRegion);
    }
    liveRegion.textContent = msg;
  }

  /* ── Gallery ── */
  function initGallery(){
    var track_ = document.getElementById("pdpGalleryTrack");
    var dotsWrap = document.getElementById("pdpGalleryDots");
    var thumbRow = document.getElementById("pdpThumbRow");
    var counter = document.getElementById("pdpGalleryCounter");
    var videoFab = document.getElementById("pdpVideoFab");

    var slides = GALLERY_IMAGES;

    track_.innerHTML = slides.map(function(s, i){
      return '<div class="pdp-gallery-slide" data-index="' + i + '" role="group" aria-roledescription="slide" aria-label="' + (i+1) + ' of ' + slides.length + '">' +
        '<img src="' + s.img + '" alt="' + s.name + ' review sign shown in a real business setting" loading="' + (i === 0 ? "eager" : "lazy") + '"/>' +
        '</div>';
    }).join("");

    dotsWrap.innerHTML = slides.map(function(s, i){
      return '<button type="button" class="pdp-gallery-dot' + (i === 0 ? " is-active" : "") + '" role="tab" aria-label="Photo ' + (i+1) + '" data-index="' + i + '"></button>';
    }).join("");

    thumbRow.innerHTML = slides.map(function(s, i){
      return '<button type="button" class="pdp-thumb' + (i === 0 ? " is-active" : "") + '" data-index="' + i + '" aria-label="View photo ' + (i+1) + ': ' + s.name + '"><img src="' + s.img + '" alt="" loading="lazy"/></button>';
    }).join("");

    if(PRODUCT_VIDEO_URL){
      videoFab.style.display = "flex";
      videoFab.addEventListener("click", function(){
        track("video_played", { video_url: PRODUCT_VIDEO_URL });
        window.open(PRODUCT_VIDEO_URL, "_blank", "noopener");
      });
    }

    var slideEls = track_.querySelectorAll(".pdp-gallery-slide");
    var dotEls = dotsWrap.querySelectorAll(".pdp-gallery-dot");
    var thumbEls = thumbRow.querySelectorAll(".pdp-thumb");
    var galleryInteracted = false;

    function setActive(i){
      dotEls.forEach(function(d, di){ d.classList.toggle("is-active", di === i); });
      thumbEls.forEach(function(t, ti){ t.classList.toggle("is-active", ti === i); });
      counter.textContent = (i + 1) + " / " + slides.length;
    }

    function goTo(i, behavior){
      i = Math.max(0, Math.min(slides.length - 1, i));
      slideEls[i].scrollIntoView({ behavior: behavior || "smooth", block: "nearest", inline: "start" });
      setActive(i);
    }

    setActive(0);

    dotEls.forEach(function(d){ d.addEventListener("click", function(){ goTo(parseInt(d.dataset.index, 10)); notifyInteract(); }); });
    thumbEls.forEach(function(t){ t.addEventListener("click", function(){ goTo(parseInt(t.dataset.index, 10)); notifyInteract(); }); });

    var scrollTimeout;
    track_.addEventListener("scroll", function(){
      notifyInteract();
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(function(){
        var idx = Math.round(track_.scrollLeft / track_.clientWidth);
        if(idx >= 0 && idx < slideEls.length) setActive(idx);
      }, 100);
    }, { passive: true });

    function notifyInteract(){
      if(!galleryInteracted){ galleryInteracted = true; track("gallery_interacted", {}); }
    }

    // tap-to-zoom
    slideEls.forEach(function(slide, i){
      slide.addEventListener("click", function(){ openZoom(slides[i].img, slides[i].name); });
    });
  }

  function initZoom(){
    var overlay = document.getElementById("pdpZoomOverlay");
    var img = document.getElementById("pdpZoomImg");
    var closeBtn = document.getElementById("pdpZoomClose");
    window.openZoom = function(src, alt){
      img.src = src;
      img.alt = alt || "";
      overlay.classList.add("is-open");
      document.body.style.overflow = "hidden";
      closeBtn.focus();
    };
    function close(){
      overlay.classList.remove("is-open");
      document.body.style.overflow = "";
    }
    closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", function(e){ if(e.target === overlay) close(); });
    document.addEventListener("keydown", function(e){ if(e.key === "Escape" && overlay.classList.contains("is-open")) close(); });
  }

  /* ── Save / wishlist (localStorage, single-item since there's one product) ── */
  function initSaveButton(){
    var btn = document.getElementById("pdpSaveBtn");
    var label = document.getElementById("pdpSaveLabel");
    var saved = false;
    try{ saved = localStorage.getItem(SAVE_KEY) === "1"; }catch(e){}
    function render(){
      btn.classList.toggle("is-saved", saved);
      btn.setAttribute("aria-pressed", String(saved));
      label.textContent = saved ? "Saved" : "Save for later";
    }
    render();
    btn.addEventListener("click", function(){
      saved = !saved;
      try{ localStorage.setItem(SAVE_KEY, saved ? "1" : "0"); }catch(e){}
      render();
      announce(saved ? "Saved for later" : "Removed from saved items");
    });
  }

  /* ── Platform grid ── */
  function initPlatformGrid(){
    var grid = document.getElementById("pdpPlatformGrid");
    function render(){
      grid.innerHTML = PLATFORMS.map(function(p){
        var selected = state.platform === p.slug;
        return '<button type="button" class="pdp-platform-card' + (selected ? " is-selected" : "") + '" data-slug="' + p.slug + '" role="radio" aria-checked="' + selected + '">' +
          '<svg viewBox="0 0 24 24" aria-hidden="true">' + p.icon + '</svg><span>' + p.name + '</span></button>';
      }).join("");
      grid.querySelectorAll(".pdp-platform-card").forEach(function(card){
        card.addEventListener("click", function(){
          state.platform = card.dataset.slug;
          track("product_option_selected", { option: "platform", value: state.platform });
          render();
          updateAll();
        });
      });
    }
    render();
  }

  /* ── Tier grid ── */
  function initTierGrid(){
    var cards = document.querySelectorAll(".pdp-tier-card");
    cards.forEach(function(card){
      card.addEventListener("click", function(){
        cards.forEach(function(c){ c.classList.remove("is-selected"); c.setAttribute("aria-checked", "false"); });
        card.classList.add("is-selected");
        card.setAttribute("aria-checked", "true");
        state.tier = card.dataset.tier;
        state.price = parseInt(card.dataset.price, 10);
        var isCustom = state.tier === "custom";
        document.getElementById("pdpSizeSection").style.display = isCustom ? "block" : "none";
        document.getElementById("pdpNameField").style.display = isCustom ? "block" : "none";
        document.getElementById("pdpUploadField").style.display = isCustom ? "block" : "none";
        track("product_option_selected", { option: "tier", value: state.tier });
        updateAll();
      });
    });
  }

  /* ── Quantity ── */
  function initQty(){
    var value = document.getElementById("pdpQtyValue");
    document.getElementById("pdpQtyMinus").addEventListener("click", function(){
      if(state.qty > 1){ state.qty--; value.textContent = state.qty; updateAll(); }
    });
    document.getElementById("pdpQtyPlus").addEventListener("click", function(){
      state.qty++; value.textContent = state.qty; updateAll();
    });
  }

  /* ── Text fields ── */
  function isLikelyUrl(v){
    if(!v) return false;
    return /^https?:\/\/.+\..+/i.test(v.trim());
  }
  function initFields(){
    var destUrl = document.getElementById("pdpDestUrl");
    var destField = document.getElementById("pdpLinkField");
    var bizName = document.getElementById("pdpBizName");
    var orderNote = document.getElementById("pdpOrderNote");
    var customizationStarted = false;

    function markStarted(){
      if(!customizationStarted){ customizationStarted = true; track("customization_started", {}); }
    }

    destUrl.addEventListener("input", function(){
      markStarted();
      state.destUrl = destUrl.value;
      if(destField.classList.contains("has-error")) destField.classList.toggle("has-error", !isLikelyUrl(destUrl.value) && destUrl.value.length > 0);
      updateAll();
    });
    destUrl.addEventListener("blur", function(){
      destField.classList.toggle("has-error", destUrl.value.length > 0 && !isLikelyUrl(destUrl.value));
    });

    bizName.addEventListener("input", function(){ markStarted(); state.bizName = bizName.value; updateAll(); });
    orderNote.addEventListener("input", function(){ state.orderNote = orderNote.value; });
  }

  /* ── Logo upload (client-side preview only — no server exists to store it; the file itself
     travels as an order note instruction, matching what the checkout hand-off can actually do) ── */
  function initUpload(){
    var zone = document.getElementById("pdpUploadZone");
    var input = document.getElementById("pdpLogoUpload");
    var preview = document.getElementById("pdpUploadPreview");
    var previewImg = document.getElementById("pdpUploadPreviewImg");
    var previewName = document.getElementById("pdpUploadPreviewName");
    var removeBtn = document.getElementById("pdpUploadRemove");

    zone.addEventListener("click", function(){ input.click(); });
    input.addEventListener("change", function(){
      var file = input.files && input.files[0];
      if(!file) return;
      state.logoFile = file;
      var reader = new FileReader();
      reader.onload = function(e){
        state.logoDataUrl = e.target.result;
        previewImg.src = state.logoDataUrl;
        previewName.textContent = file.name;
        preview.classList.add("is-visible");
        zone.style.display = "none";
        track("customization_started", { field: "design_upload" });
        updateAll();
      };
      reader.readAsDataURL(file);
    });
    removeBtn.addEventListener("click", function(){
      state.logoFile = null;
      state.logoDataUrl = "";
      input.value = "";
      preview.classList.remove("is-visible");
      zone.style.display = "block";
      updateAll();
    });
  }

  /* ── "Can't find my link" guide ── */
  function initGuideToggle(){
    var toggle = document.getElementById("pdpGuideToggle");
    var body = document.getElementById("pdpGuideBody");
    toggle.addEventListener("click", function(){
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      body.classList.toggle("is-open", !open);
    });
  }

  function initFaqToggles(){
    document.querySelectorAll(".faq-q").forEach(function(b){
      b.addEventListener("click", function(){
        var e = b.getAttribute("aria-expanded") === "true";
        b.setAttribute("aria-expanded", String(!e));
      });
    });
  }

  /* ── Validation ── */
  function requiredFieldsComplete(){
    if(!isLikelyUrl(state.destUrl)) return false;
    if(state.tier === "custom"){
      if(!state.bizName.trim()) return false;
      if(!state.logoFile) return false;
    }
    return true;
  }

  function lineTotal(){ return state.price * state.qty; }

  /* ── Update everything derived from state (single source of truth) ── */
  function updateAll(){
    var tierInfo = TIERS[state.tier];
    var platform = platformBySlug(state.platform);
    var total = lineTotal();
    var ready = requiredFieldsComplete();
    var isCustom = state.tier === "custom";

    document.getElementById("pdpPrice").textContent = state.price;
    document.getElementById("sumTier").textContent = tierInfo.name;
    document.getElementById("sumDesignRow").style.display = isCustom ? "flex" : "none";
    document.getElementById("sumStyle").textContent = state.logoFile ? state.logoFile.name : "Awaiting upload";
    document.getElementById("sumPlatform").textContent = platform.name;
    document.getElementById("sumQty").textContent = state.qty;
    document.getElementById("sumTotal").textContent = total;
    document.getElementById("pdpStickyPrice").textContent = total;

    var buyBtns = [
      document.getElementById("pdpBuyNowMobile"),
      document.getElementById("pdpBuyNowDesktop")
    ];
    buyBtns.forEach(function(b){ if(b) b.disabled = !ready; });
  }

  /* ── Buy / cart button wiring ── */
  function buildCartItem(){
    var tierInfo = TIERS[state.tier];
    var platform = platformBySlug(state.platform);
    return {
      id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
      tier: state.tier,
      tierName: tierInfo.name,
      img: tierInfo.img,
      platform: platform.name,
      qty: state.qty,
      price: state.price,
      destUrl: state.destUrl,
      bizName: state.bizName,
      orderNote: state.orderNote,
      hasLogo: !!state.logoFile,
      logoName: state.logoFile ? state.logoFile.name : "",
      size: state.tier === "custom" ? SIGN_SIZE : ""
    };
  }

  function initBuyButtons(){
    var addCartBtns = [document.getElementById("pdpAddCartMobile"), document.getElementById("pdpAddCartDesktop")];
    var buyNowBtns = [document.getElementById("pdpBuyNowMobile"), document.getElementById("pdpBuyNowDesktop")];

    addCartBtns.forEach(function(btn){
      btn.addEventListener("click", function(){
        if(!requiredFieldsComplete()){
          focusFirstError();
          return;
        }
        setLoading(btn, true);
        var item = buildCartItem();
        addToCart(item);
        track("add_to_cart", { tier: item.tier, quantity: item.qty, value: item.price * item.qty });
        setTimeout(function(){
          setLoading(btn, false);
          announce("Added to cart");
          openCart();
        }, 260);
      });
    });

    buyNowBtns.forEach(function(btn){
      btn.addEventListener("click", function(){
        if(!requiredFieldsComplete()){
          focusFirstError();
          return;
        }
        setLoading(btn, true);
        var item = buildCartItem();
        track("buy_now", { tier: item.tier, quantity: item.qty, value: item.price * item.qty });
        goToCheckout([item]);
      });
    });
  }

  function focusFirstError(){
    var destUrl = document.getElementById("pdpDestUrl");
    var destField = document.getElementById("pdpLinkField");
    var bizName = document.getElementById("pdpBizName");
    var uploadZone = document.getElementById("pdpUploadZone");
    if(!isLikelyUrl(state.destUrl)){
      destField.classList.add("has-error");
      destUrl.scrollIntoView({ behavior: "smooth", block: "center" });
      destUrl.focus();
      announce("Please enter your destination link before continuing");
      return;
    }
    if(state.tier === "custom" && !state.bizName.trim()){
      bizName.scrollIntoView({ behavior: "smooth", block: "center" });
      bizName.focus();
      announce("Please enter your business name before continuing");
      return;
    }
    if(state.tier === "custom" && !state.logoFile){
      uploadZone.scrollIntoView({ behavior: "smooth", block: "center" });
      announce("Please upload your design file before continuing");
    }
  }

  function setLoading(btn, loading){
    btn.classList.toggle("is-loading", loading);
    btn.disabled = loading;
  }

  /* ── Sticky bar visibility: hide while the desktop buy buttons are on-screen isn't needed
     since CSS already hides it at >=960px; on mobile it's always visible but must never
     cover the footer's focusable links when the page is fully scrolled — handled by
     footer bottom padding on .pdp-shell. ── */
  function initStickyBarVisibility(){
    // Sticky bar is always shown on mobile per spec; nothing dynamic needed beyond CSS.
  }

  /* ── Cart (localStorage-backed, client-side only) ── */
  function readCart(){
    try{
      var raw = localStorage.getItem(CART_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){ return []; }
  }
  function writeCart(items){
    try{ localStorage.setItem(CART_KEY, JSON.stringify(items)); }catch(e){}
  }
  function addToCart(item){
    var items = readCart();
    items.push(item);
    writeCart(items);
    renderCart();
  }
  var lastRemoved = null;
  var lastRemovedIndex = -1;
  function removeFromCart(id){
    var items = readCart();
    var idx = -1;
    items.forEach(function(it, i){ if(it.id === id) idx = i; });
    if(idx === -1) return;
    lastRemoved = items[idx];
    lastRemovedIndex = idx;
    items.splice(idx, 1);
    writeCart(items);
    renderCart(true);
  }
  function undoRemove(){
    if(!lastRemoved) return;
    var items = readCart();
    items.splice(Math.min(lastRemovedIndex, items.length), 0, lastRemoved);
    writeCart(items);
    lastRemoved = null;
    renderCart();
  }
  function updateCartQty(id, qty){
    var items = readCart();
    items.forEach(function(it){ if(it.id === id) it.qty = Math.max(1, qty); });
    writeCart(items);
    renderCart();
  }

  function cartTotal(items){
    return items.reduce(function(sum, it){ return sum + (it.price * it.qty); }, 0);
  }

  function renderCart(showUndo){
    var items = readCart();
    var body = document.getElementById("pdpCartBody");
    var foot = document.getElementById("pdpCartFoot");
    var badge = document.getElementById("pdpCartBadge");
    var totalCount = items.reduce(function(s, it){ return s + it.qty; }, 0);

    badge.textContent = totalCount;
    badge.style.display = totalCount > 0 ? "flex" : "none";

    var undoHtml = (showUndo && lastRemoved) ?
      '<div class="pdp-cart-undo"><span>Item removed.</span><button type="button" id="pdpUndoBtn">Undo</button></div>' : "";

    if(items.length === 0){
      body.innerHTML = undoHtml + '<div class="pdp-cart-empty" id="pdpCartEmpty">Your cart is empty. Build a sign above to get started.</div>';
      var undoBtnEmpty = document.getElementById("pdpUndoBtn");
      if(undoBtnEmpty) undoBtnEmpty.addEventListener("click", function(){ undoRemove(); });
      foot.style.display = "none";
      return;
    }

    body.innerHTML = undoHtml + items.map(function(it){
      return '<div class="pdp-cart-item" data-id="' + it.id + '">' +
        '<img src="' + it.img + '" alt="' + it.tierName + '"/>' +
        '<div class="pdp-cart-item-info">' +
          '<b>' + it.tierName + (it.hasLogo ? " — " + it.logoName : "") + '</b>' +
          '<span>Destination: ' + it.platform + (it.bizName ? " · " + it.bizName : "") + '</span>' +
          '<div class="pdp-cart-item-actions">' +
            '<span class="pdp-cart-item-price">$' + (it.price * it.qty) + '</span>' +
            '<div class="pdp-cart-item-links">' +
              '<button type="button" class="pdp-cart-edit" data-id="' + it.id + '">Edit</button>' +
              '<button type="button" class="pdp-cart-remove" data-id="' + it.id + '">Remove</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }).join("");

    var undoBtn = document.getElementById("pdpUndoBtn");
    if(undoBtn) undoBtn.addEventListener("click", function(){ undoRemove(); });

    body.querySelectorAll(".pdp-cart-remove").forEach(function(b){
      b.addEventListener("click", function(){ removeFromCart(b.dataset.id); });
    });
    body.querySelectorAll(".pdp-cart-edit").forEach(function(b){
      b.addEventListener("click", function(){ closeCart(); document.getElementById("pdpDestUrl").scrollIntoView({ behavior: "smooth", block: "center" }); });
    });

    document.getElementById("pdpCartTotal").textContent = cartTotal(items);
    foot.style.display = "block";

    var checkoutBtn = document.getElementById("pdpCheckoutBtn");
    checkoutBtn.onclick = function(e){
      e.preventDefault();
      goToCheckout(items);
    };
  }

  function initCart(){
    var backdrop = document.getElementById("pdpCartBackdrop");
    var panel = document.getElementById("pdpCartPanel");
    var closeBtn = document.getElementById("pdpCartClose");
    backdrop.addEventListener("click", closeCart);
    closeBtn.addEventListener("click", closeCart);
    document.addEventListener("keydown", function(e){ if(e.key === "Escape" && panel.classList.contains("is-open")) closeCart(); });
    renderCart();
  }
  function openCart(){
    document.getElementById("pdpCartBackdrop").classList.add("is-open");
    document.getElementById("pdpCartPanel").classList.add("is-open");
    document.body.style.overflow = "hidden";
    renderCart();
    document.getElementById("pdpCartClose").focus();
  }
  function closeCart(){
    document.getElementById("pdpCartBackdrop").classList.remove("is-open");
    document.getElementById("pdpCartPanel").classList.remove("is-open");
    document.body.style.overflow = "";
  }

  /* ── Checkout hand-off ──
     This static site has no backend to run a custom one-page checkout
     with card fields, address validation, and tax calculation. Real
     payment happens on Stripe's own hosted Payment Link page, which
     already includes express pay (Apple Pay/Google Pay when enabled
     in Stripe), card entry, and address collection. We take the order
     configuration up to the door of checkout, then hand off cleanly. */
  function goToCheckout(items){
    track("checkout_started", { value: cartTotal(items), items: items.length });
    var first = items[0];
    var tierInfo = TIERS[first.tier] || TIERS.signature;
    var link = tierInfo.paymentLink && tierInfo.paymentLink.length ? tierInfo.paymentLink : FALLBACK_LINK;
    if(link !== FALLBACK_LINK){
      track("payment_attempted", { provider: "stripe" });
    }
    window.location.href = link;
  }

  // expose for the zoom overlay wiring above
  window.__pdpTrack = track;
})();
