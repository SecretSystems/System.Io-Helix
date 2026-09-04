/* ============================================================
   Secret Systems — Selected Work portfolio carousels
   ------------------------------------------------------------
   Reads SS_PORTFOLIO (portfolio/portfolio-data.js). Renders two
   independent, always-visible carousels (Websites, then Apps &
   Systems) stacked in one Selected Work section -- no category
   switch. Vanilla JS, no dependencies — matches this repo's
   static-site architecture (no bundler, no npm).

   Each carousel keeps its own drag/pointer state, its own active
   index, its own dots/arrows, so swiping one row never affects the
   other (see initDrag: state is captured per-controller closure,
   not shared/global).

   Performance: the whole module is deferred until the section is
   near the viewport (IntersectionObserver) or the page has gone
   idle, so it never competes with the hero's frame animation for
   the main thread on first paint. Only the single active card in
   EACH row is ever loaded; every other card shows its poster image.
   ============================================================ */
(function(){
  "use strict";

  var ssReduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;

  /* Minimal default sandbox for any project that doesn't declare its own
     (see portfolio-data.js's per-project `sandbox`): scripts + same-origin
     only, no forms, no popups. Every current project sets an explicit
     value scoped to what it actually needs -- e.g. a marketing site with a
     real contact form gets allow-forms, a read-only map does not. None of
     them are granted allow-modals, allow-downloads,
     allow-popups-to-escape-sandbox, allow-top-navigation, or any device
     permission (camera/mic/geolocation/clipboard). */
  var DEFAULT_SANDBOX = "allow-scripts allow-same-origin";

  var section = document.getElementById("portfolio-section");
  if(!section || typeof SS_PORTFOLIO === "undefined") return;

  var GROUPS = ["websites", "apps"];
  var state = {
    index: { websites: 0, apps: 0 }
  };

  /* seed default indices from each group's declared defaultId */
  GROUPS.forEach(function(g){
    var cfg = SS_PORTFOLIO[g];
    var defIdx = cfg.projects.findIndex(function(p){ return p.id === cfg.defaultId; });
    state.index[g] = defIdx >= 0 ? defIdx : 0;
  });

  var carousels = {}; // group -> controller

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];
    });
  }

  /* ── Build one carousel's cards + dots (once) ── */
  function buildCarousel(group){
    var cfg = SS_PORTFOLIO[group];
    var root = section.querySelector('.portfolio-carousel[data-carousel="' + group + '"]');
    var track = root.querySelector("[data-track]");
    var panel = root.closest(".portfolio-panel");
    var metaWrap = panel.querySelector("[data-meta]");

    var cards = cfg.projects.map(function(project, i){
      var card = document.createElement("div");
      card.className = "portfolio-card";
      card.dataset.index = i;
      card.setAttribute("role", "group");
      card.setAttribute("aria-roledescription", "slide");
      card.setAttribute("aria-label", (i + 1) + " of " + cfg.projects.length + ": " + project.name);

      var inner = document.createElement("div");
      inner.className = "portfolio-card-inner";

      var chrome = document.createElement("div");
      chrome.className = "portfolio-chrome";
      chrome.innerHTML = '<span class="portfolio-chrome-dot"></span><span class="portfolio-chrome-dot"></span><span class="portfolio-chrome-dot"></span>';

      var preview = document.createElement("div");
      preview.className = "portfolio-preview";
      var poster = document.createElement("img");
      poster.src = project.poster;
      poster.alt = project.posterAlt || project.name;
      poster.loading = "lazy";
      poster.decoding = "async";
      preview.appendChild(poster);

      var loading = document.createElement("div");
      loading.className = "portfolio-loading is-hidden";
      loading.innerHTML = '<span class="spin" aria-hidden="true"></span>';

      /* ── Interaction shield ──
         Sits over the live iframe until the visitor deliberately taps/clicks
         the preview. While the shield is present, pointer events land on the
         card (not the iframe), so the page keeps scrolling and the carousel
         keeps swiping normally. A small "Tap to interact" hint communicates
         what a tap on the preview will do. Removing the shield (see
         enterInteraction) hands pointer events to the iframe itself. */
      var cover = document.createElement("div");
      cover.className = "portfolio-cover";
      var hint = document.createElement("div");
      hint.className = "portfolio-tap-hint";
      hint.innerHTML = '<span class="portfolio-tap-hint-pill">' + PLAY_ICON + 'Tap to interact</span>';
      hint.setAttribute("aria-hidden", "true"); // decorative; the card itself carries the real label
      cover.appendChild(hint);

      var sheen = document.createElement("div");
      sheen.className = "portfolio-card-corner-sheen";

      /* ── Open Live (bottom-right) — the only remaining corner control.
         Lives INSIDE portfolio-card-inner so it sits above the iframe
         (z-index) and is excluded from the drag/pointerdown handler. ── */
      var openLiveWrap = document.createElement("div");
      openLiveWrap.className = "portfolio-corner portfolio-corner-right";
      var openLiveLink = document.createElement("a");
      openLiveLink.className = "portfolio-corner-btn portfolio-open-btn";
      openLiveLink.href = project.url;
      openLiveLink.target = "_blank";
      openLiveLink.rel = "noopener noreferrer";
      openLiveLink.addEventListener("click", function(e){ e.stopPropagation(); });
      openLiveLink.addEventListener("pointerdown", function(e){ e.stopPropagation(); });
      var openLivePill = document.createElement("span");
      openLivePill.className = "portfolio-corner-pill";
      openLivePill.innerHTML = 'Open Live<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17L17 7M7 7h10v10"/></svg>';
      openLiveLink.appendChild(openLivePill);
      var openLiveLabel = escapeHtml(project.secondaryLabel || (group === "websites" ? "Open Live Site" : "Open Live App"));
      openLiveLink.setAttribute("aria-label", openLiveLabel);
      openLiveWrap.appendChild(openLiveLink);

      inner.appendChild(chrome);
      inner.appendChild(preview);
      inner.appendChild(loading);
      inner.appendChild(cover);
      inner.appendChild(sheen);
      inner.appendChild(openLiveWrap);
      card.appendChild(inner);
      track.appendChild(card);

      var card_ = { el: card, inner: inner, preview: preview, poster: poster, loading: loading, cover: cover,
        openLiveWrap: openLiveWrap,
        project: project, iframeEl: null, iframeLoaded: false };

      /* The shield itself is the activation control: a deliberate tap/click
         on the preview (not hover) removes it and hands the gesture to the
         real iframe. This is wired inside initDrag's pointerUp (not a
         `click` listener here) because setPointerCapture on the carousel
         root redirects the synthesized click away from this element --
         pointerUp instead treats a near-zero-movement release that started
         on .portfolio-cover as the tap, so a genuine swipe can never
         accidentally activate the card. */

      updateCardInteractLabel(card_, group);

      return card_;
    });

    var ctrl = {
      group: group,
      cfg: cfg,
      root: root,
      track: track,
      cards: cards,
      metaWrap: metaWrap,
      panel: panel,
      navPrev: root.querySelector('[data-nav="prev"]'),
      navNext: root.querySelector('[data-nav="next"]'),
      dragging: false,
      dragAxisLocked: null, // 'x' | 'y' | null
      startX: 0, startY: 0,
      currentDX: 0,
      baseTranslate: 0,
      raf: null,
      interactiveIndex: null
    };
    carousels[group] = ctrl;

    initDrag(ctrl);
    initNav(ctrl);
    initKeyboard(ctrl);

    layout(ctrl, false);
    renderMeta(ctrl);
  }

  /* ── Position cards: active centered, neighbors peeking at edges ── */
  function layout(ctrl, animated){
    var n = ctrl.cards.length;
    var idx = state.index[ctrl.group];
    var isMobile = window.innerWidth <= 900;
    var gap = isMobile ? 0.86 : 0.62; // fraction of card width between slide centers

    ctrl.cards.forEach(function(c, i){
      var rel = i - idx;
      // shortest-path wrap for a cleaner loop feel isn't required by spec; keep linear ordering
      var cw = c.el.offsetWidth || 1;
      var x = rel * cw * gap + ctrl.currentDX;
      var isActive = i === idx;
      c.el.classList.toggle("is-active", isActive);
      c.el.setAttribute("aria-hidden", isActive ? "false" : "true");
      var scale = isActive ? 1 : 0.86;
      var opacity = Math.abs(rel) > 1 ? 0 : (isActive ? 1 : 0.55);
      c.el.style.transition = animated && !ssReduce ? "transform .5s cubic-bezier(.22,1,.36,1), opacity .4s" : "none";
      c.el.style.transform = "translate3d(" + x + "px,0,0) scale(" + scale + ")";
      c.el.style.opacity = String(opacity);
      c.el.style.zIndex = isActive ? "3" : String(2 - Math.min(Math.abs(rel), 2));
      c.el.style.pointerEvents = Math.abs(rel) <= 1 ? "auto" : "none";
    });

    if(ctrl.navPrev) ctrl.navPrev.style.display = idx <= 0 ? "none" : "flex";
    if(ctrl.navNext) ctrl.navNext.style.display = idx >= n - 1 ? "none" : "flex";

    activateSlide(ctrl, idx);
  }

  /* ── Load the active card's live iframe (only one at a time, whole page); unload the rest ── */
  function activateSlide(ctrl, idx){
    ctrl.cards.forEach(function(c, i){
      if(i === idx) return;
      // pause/unload any non-active iframe
      if(c.iframeEl){
        c.iframeEl.remove();
        c.iframeEl = null;
        c.iframeLoaded = false;
        c.loading.classList.add("is-hidden");
        c.poster.style.opacity = "1";
        updateCardInteractLabel(c, ctrl.group);
      }
      c.el.classList.remove("is-interactive");
    });

    var active = ctrl.cards[idx];
    if(!active || active.project.previewMode !== "live" || active.iframeEl) return;

    if(!sectionNearViewport && !idleFired) return; // wait for perf gate before any network request

    var iframe = document.createElement("iframe");
    iframe.src = active.project.previewUrl || active.project.url;
    iframe.loading = "lazy";
    iframe.title = active.project.name + " live preview";
    iframe.sandbox = active.project.sandbox || DEFAULT_SANDBOX;
    iframe.referrerPolicy = "no-referrer";
    iframe.setAttribute("tabindex", "-1");
    // Most preview sites are real external pages at their own desktop width,
    // shown shrunk-to-fit via the 250%/scale(.4) CSS below. A project whose
    // previewUrl is a dedicated embed route (built to fill whatever box it's
    // given, like /map-embed) opts out of that hack with full-bleed-preview
    // so it renders at the card's actual size instead of a scaled-down
    // full desktop layout.
    active.el.classList.toggle("full-bleed-preview", !!active.project.fullBleedPreview);

    active.loading.classList.remove("is-hidden");
    active.poster.style.opacity = "1"; // stays the visible fallback until load actually succeeds

    function markLoaded(){
      if(active.iframeLoaded) return; // guard against the load+timeout race firing twice
      active.iframeLoaded = true;
      active.loadFailed = false;
      active.loading.classList.add("is-hidden");
      active.poster.style.opacity = "0";
      active.el.classList.remove("is-failed");
      if(state.index[ctrl.group] === idx) updateCardInteractLabel(active, ctrl.group);
    }
    function markFailed(){
      if(active.iframeLoaded) return;
      active.loadFailed = true;
      active.loading.classList.add("is-hidden");
      active.poster.style.opacity = "1"; // explicit fallback: never leave a broken/blank iframe visible
      active.el.classList.add("is-failed"); // Open Live stays the only working control
      console.error("[portfolio] live preview failed to load: " + active.project.name + " (" + (active.project.previewUrl || active.project.url) + ")");
      if(active.iframeEl){ active.iframeEl.remove(); active.iframeEl = null; }
      if(state.index[ctrl.group] === idx) updateCardInteractLabel(active, ctrl.group);
    }

    // A frame-ancestors/X-Frame-Options block does NOT reliably fire a
    // network "error" event — Chromium still fires "load" for the blocked
    // navigation, just for an empty page instead of the real one. `load`
    // alone can't be trusted as success. contentDocument inspection isn't
    // a reliable signal either: with this sandbox policy, a genuinely
    // successful cross-origin load *also* reports contentDocument as null
    // (confirmed empirically against a known-working embed), so a null/
    // inaccessible document can't distinguish blocked from working.
    //
    // What does reliably distinguish them is timing: a blocked navigation
    // resolves `load` in a couple of milliseconds (no real network request
    // ever happens), while every one of these preview sites takes at least
    // several hundred milliseconds to actually fetch and render over a
    // real network connection — confirmed empirically: a blocked load
    // resolved in ~2ms, a genuine one in ~3760ms. MIN_REAL_LOAD_MS sits
    // far below the fast end of that gap so it can't misfire on a
    // legitimately fast CDN response, while still catching same-tick
    // blocked loads.
    var MIN_REAL_LOAD_MS = 150;
    var iframeCreatedAt = Date.now();

    iframe.addEventListener("load", function(){
      if(Date.now() - iframeCreatedAt < MIN_REAL_LOAD_MS) markFailed();
      else markLoaded();
    });
    iframe.addEventListener("error", markFailed);
    var failSafeTimer = setTimeout(function(){
      if(!active.iframeLoaded) markFailed();
    }, 6000);
    iframe.addEventListener("load", function(){ clearTimeout(failSafeTimer); });

    active.preview.appendChild(iframe);
    active.iframeEl = iframe;
  }

  var PLAY_ICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/></svg>';

  /* Sets the card's own accessible name/title for whichever interaction
     state it's in. There's no separate Interact button any more -- the
     preview itself is the control, so the label lives on the card element
     (already role="group"/aria-roledescription="slide" from buildCarousel). */
  function updateCardInteractLabel(card, group, state_){
    if(card.project.previewMode !== "live"){
      card.el.title = "";
      return;
    }
    if(state_ === "interactive"){
      card.el.title = "Interacting with " + card.project.name + " — press Escape or tap outside to exit.";
    } else if(!card.iframeLoaded){
      card.el.title = "Connecting to the live preview of " + card.project.name + "…";
    } else {
      card.el.title = "Tap to interact with " + card.project.name;
    }
  }

  function renderMeta(ctrl){
    var idx = state.index[ctrl.group];
    var p = ctrl.cards[idx].project;
    ctrl.metaWrap.innerHTML = '<h3 class="portfolio-meta-name">' + escapeHtml(p.name) + '</h3>';

    announce(p.name + ", " + (idx + 1) + " of " + ctrl.cards.length);
  }

  var announceTimer = null;
  function announce(msg){
    var live = section.querySelector("[data-portfolio-announce]");
    if(!live) return;
    clearTimeout(announceTimer);
    // brief debounce so rapid drags don't spam the screen reader
    announceTimer = setTimeout(function(){ live.textContent = msg; }, 400);
  }

  function goTo(group, idx, animated){
    var n = carousels[group].cards.length;
    idx = Math.max(0, Math.min(n - 1, idx));
    if(idx === state.index[group] && animated !== false) { layout(carousels[group], true); return; }
    state.index[group] = idx;
    layout(carousels[group], animated !== false);
    renderMeta(carousels[group]);
  }

  /* Tapping/clicking the preview shield is the ONLY way in -- there is no
     separate Interact button any more. Removing "is-interactive" restores
     the shield (portfolio-cover); adding it removes the shield's pointer
     capture (see the .portfolio-cover CSS: is-interactive sets
     pointer-events:none on the cover) and hands the gesture to the real
     iframe underneath. */
  function enterInteraction(group){
    var ctrl = carousels[group];
    var idx = state.index[group];
    var card = ctrl.cards[idx];
    if(!card.iframeLoaded) return; // nothing loaded yet -- ignore the tap
    card.el.classList.add("is-interactive");
    if(card.iframeEl) card.iframeEl.setAttribute("tabindex", "0");
    updateCardInteractLabel(card, group, "interactive");
  }
  function exitInteraction(group){
    var ctrl = carousels[group];
    var idx = state.index[group];
    var card = ctrl.cards[idx];
    if(!card.el.classList.contains("is-interactive")) return;
    card.el.classList.remove("is-interactive");
    if(card.iframeEl) card.iframeEl.setAttribute("tabindex", "-1");
    updateCardInteractLabel(card, group);
    ctrl.root.focus({ preventScroll: true });
  }
  function exitAllInteraction(){
    GROUPS.forEach(function(g){ exitInteraction(g); });
  }

  /* ── Drag / swipe physics: 1:1 tracking, vertical-scroll preserved until axis is clearly horizontal ── */
  function initDrag(ctrl){
    var el = ctrl.root;
    var pointerId = null;
    var moved = 0;
    var movedTotal = 0; // absolute distance in any direction, for tap-vs-drag detection
    var downOnCover = false;

    function pointerDown(e){
      if(e.target.closest(".portfolio-nav, .portfolio-corner")) return;
      var activeCard = ctrl.cards[state.index[ctrl.group]];
      if(activeCard.el.classList.contains("is-interactive")) return; // let interaction mode own the gesture
      pointerId = e.pointerId;
      ctrl.dragging = true;
      ctrl.dragAxisLocked = null;
      ctrl.startX = e.clientX; ctrl.startY = e.clientY;
      moved = 0;
      movedTotal = 0;
      downOnCover = !!e.target.closest(".portfolio-cover");
      // Note: el.setPointerCapture below redirects ALL subsequent pointer
      // events (and the synthesized click) to `el` regardless of where the
      // pointer physically is, which is why "tap to interact" can't be a
      // separate click listener on .portfolio-cover -- it has to be
      // detected here in the same drag gesture, as a release with near-zero
      // movement that started on the cover (see pointerUp below).
      el.setPointerCapture && el.setPointerCapture(pointerId);
    }

    function pointerMove(e){
      if(!ctrl.dragging || e.pointerId !== pointerId) return;
      var dx = e.clientX - ctrl.startX;
      var dy = e.clientY - ctrl.startY;
      movedTotal = Math.max(movedTotal, Math.abs(dx), Math.abs(dy));

      if(ctrl.dragAxisLocked === null){
        if(Math.abs(dx) > 6 || Math.abs(dy) > 6){
          ctrl.dragAxisLocked = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
        }
      }
      if(ctrl.dragAxisLocked === "y") return; // let the page scroll vertically

      e.preventDefault();
      moved = dx;
      ctrl.currentDX = dx;
      if(!ctrl.raf){
        ctrl.raf = requestAnimationFrame(function(){
          layout(ctrl, false);
          ctrl.raf = null;
        });
      }
    }

    function pointerUp(e){
      if(!ctrl.dragging || e.pointerId !== pointerId) return;
      ctrl.dragging = false;
      pointerId = null;
      // A release with negligible movement that started on the shield is a
      // deliberate tap, not a swipe -- the spec explicitly requires this be
      // an intentional click/tap, never hover, so the <6px axis-lock
      // threshold above doubles as the tap-vs-drag distinction here too.
      if(downOnCover && movedTotal < 6){
        downOnCover = false;
        ctrl.currentDX = 0;
        ctrl.dragAxisLocked = null;
        enterInteraction(ctrl.group);
        return;
      }
      downOnCover = false;
      if(ctrl.dragAxisLocked === "x"){
        var cardWidth = ctrl.cards[0].el.offsetWidth || 1;
        var threshold = cardWidth * 0.16;
        if(moved < -threshold) goTo(ctrl.group, state.index[ctrl.group] + 1);
        else if(moved > threshold) goTo(ctrl.group, state.index[ctrl.group] - 1);
        else { ctrl.currentDX = 0; layout(ctrl, true); }
      } else {
        ctrl.currentDX = 0;
      }
      ctrl.currentDX = 0;
      ctrl.dragAxisLocked = null;
    }

    el.addEventListener("pointerdown", pointerDown);
    el.addEventListener("pointermove", pointerMove, { passive: false });
    el.addEventListener("pointerup", pointerUp);
    el.addEventListener("pointercancel", pointerUp);

    // desktop wheel (trackpad horizontal swipe)
    el.addEventListener("wheel", function(e){
      if(Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      if(ctrl.wheelLock) return;
      ctrl.wheelLock = true;
      if(e.deltaX > 12) goTo(ctrl.group, state.index[ctrl.group] + 1);
      else if(e.deltaX < -12) goTo(ctrl.group, state.index[ctrl.group] - 1);
      setTimeout(function(){ ctrl.wheelLock = false; }, 400);
    }, { passive: false });
  }

  function initNav(ctrl){
    ctrl.root.querySelector('[data-nav="prev"]').addEventListener("click", function(){ goTo(ctrl.group, state.index[ctrl.group] - 1); });
    ctrl.root.querySelector('[data-nav="next"]').addEventListener("click", function(){ goTo(ctrl.group, state.index[ctrl.group] + 1); });
  }

  function initKeyboard(ctrl){
    ctrl.root.setAttribute("tabindex", "0");
    ctrl.root.setAttribute("role", "region");
    ctrl.root.setAttribute("aria-label", ctrl.cfg.label + " project carousel");
    ctrl.root.addEventListener("keydown", function(e){
      if(e.key === "ArrowRight"){ e.preventDefault(); goTo(ctrl.group, state.index[ctrl.group] + 1); }
      else if(e.key === "ArrowLeft"){ e.preventDefault(); goTo(ctrl.group, state.index[ctrl.group] - 1); }
      else if(e.key === "Escape"){ exitInteraction(ctrl.group); }
    });
  }

  /* ── Perf gate: don't touch the network for any preview until the section is
     near the viewport OR the browser reports idle (whichever comes first),
     so the hero's own scroll/canvas work is never competing for bandwidth
     or main-thread time during first paint. ── */
  var sectionNearViewport = false;
  var idleFired = false;
  var gateOpened = false;

  function onPerfGateOpen(){
    if(gateOpened) return; // whichever of viewport/idle fires first wins; ignore the second
    if(!sectionNearViewport && !idleFired) return;
    gateOpened = true;
    GROUPS.forEach(function(g){ activateSlide(carousels[g], state.index[g]); });
  }

  function initPerfGate(){
    if("IntersectionObserver" in window){
      var io = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
          if(entry.isIntersecting){
            sectionNearViewport = true;
            onPerfGateOpen();
            io.disconnect();
          }
        });
      }, { rootMargin: "600px 0px" });
      io.observe(section);
    } else {
      sectionNearViewport = true;
      onPerfGateOpen();
    }

    var idleCb = window.requestIdleCallback || function(cb){ return setTimeout(cb, 2500); };
    idleCb(function(){ idleFired = true; onPerfGateOpen(); });
  }

  /* ── Exit interaction mode from outside the carousel entirely ──
     Escape always works regardless of which element has focus. A tap/click
     anywhere outside every .portfolio-card also exits, per spec ("tapping
     outside the card exits interaction mode"). */
  function initGlobalExit(){
    document.addEventListener("keydown", function(e){
      if(e.key === "Escape") exitAllInteraction();
    });
    document.addEventListener("pointerdown", function(e){
      if(e.target.closest(".portfolio-card")) return; // inside a card -- its own handlers decide
      exitAllInteraction();
    });
  }

  function init(){
    GROUPS.forEach(buildCarousel);
    initPerfGate();
    initGlobalExit();
    window.addEventListener("resize", function(){
      GROUPS.forEach(function(g){ layout(carousels[g], false); });
    });
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
