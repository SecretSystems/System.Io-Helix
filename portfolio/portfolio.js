/* ============================================================
   Secret Systems — Selected Work portfolio carousel
   ------------------------------------------------------------
   Reads SS_PORTFOLIO (portfolio/portfolio-data.js). Renders two
   independent carousels (Websites / Apps & Systems) sharing one
   segmented tab control. Vanilla JS, no dependencies — matches
   this repo's static-site architecture (no bundler, no npm).

   Performance: the whole module is deferred until the section is
   near the viewport (IntersectionObserver) or the page has gone
   idle, so it never competes with the hero's frame animation for
   the main thread on first paint. Only the single active card's
   iframe is ever loaded; every other card shows its poster image.
   ============================================================ */
(function(){
  "use strict";

  var ssReduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion:reduce)").matches;

  var SANDBOX = "allow-scripts allow-same-origin allow-forms allow-popups";
  /* Deliberately excludes: allow-modals, allow-downloads, allow-popups-to-escape-sandbox,
     allow-top-navigation, microphone/camera/geolocation permissions, and clipboard access.
     None of the seven preview sites need those for their public marketing/demo pages, so
     they're left out rather than granted "just in case". */

  var section = document.getElementById("portfolio-section");
  if(!section || typeof SS_PORTFOLIO === "undefined") return;

  var GROUPS = ["websites", "apps"];
  var state = {
    activeGroup: "websites",
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
    var dotsWrap = panel.querySelector("[data-dots]");
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

      var cover = document.createElement("div");
      cover.className = "portfolio-cover";

      var sheen = document.createElement("div");
      sheen.className = "portfolio-card-corner-sheen";

      var exitBtn = document.createElement("button");
      exitBtn.type = "button";
      exitBtn.className = "portfolio-exit-btn";
      exitBtn.setAttribute("aria-label", "Exit preview");
      exitBtn.title = "Exit preview";
      exitBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" stroke="currentColor" fill="none" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
      exitBtn.addEventListener("click", function(e){ e.stopPropagation(); exitInteraction(group); });

      inner.appendChild(chrome);
      inner.appendChild(preview);
      inner.appendChild(loading);
      inner.appendChild(cover);
      inner.appendChild(sheen);
      inner.appendChild(exitBtn);
      card.appendChild(inner);
      track.appendChild(card);

      return { el: card, inner: inner, preview: preview, poster: poster, loading: loading, cover: cover, exitBtn: exitBtn, project: project, iframeEl: null, iframeLoaded: false };
    });

    dotsWrap.innerHTML = cfg.projects.map(function(p, i){
      return '<button type="button" class="portfolio-dot" role="tab" aria-label="Go to ' + escapeHtml(p.name) + '" data-dot-index="' + i + '"></button>';
    }).join("");
    var dotEls = Array.prototype.slice.call(dotsWrap.querySelectorAll(".portfolio-dot"));

    var ctrl = {
      group: group,
      cfg: cfg,
      root: root,
      track: track,
      cards: cards,
      dotEls: dotEls,
      metaWrap: metaWrap,
      panel: panel,
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
    initDots(ctrl);
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

    ctrl.dotEls.forEach(function(d, i){ d.classList.toggle("is-active", i === idx); d.setAttribute("aria-selected", i === idx ? "true" : "false"); });

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
    iframe.sandbox = SANDBOX;
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
      active.loading.classList.add("is-hidden");
      active.poster.style.opacity = "0";
      updateInteractAvailability(ctrl, idx);
    }
    function markFailed(){
      if(active.iframeLoaded) return;
      active.loading.classList.add("is-hidden");
      active.poster.style.opacity = "1"; // explicit fallback: never leave a broken/blank iframe visible
      updateInteractAvailability(ctrl, idx);
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

  /* "Interact With Preview" only becomes usable once the iframe has actually
     finished loading — never for a fallback poster, and never for a live
     project whose iframe is still loading or failed to load. */
  function updateInteractAvailability(ctrl, idx){
    if(state.index[ctrl.group] !== idx) return; // slide changed while this was pending
    var interactBtn = ctrl.metaWrap.querySelector("[data-interact-btn]");
    if(!interactBtn) return;
    var card = ctrl.cards[idx];
    var ready = card.project.previewMode === "live" && card.iframeLoaded;
    interactBtn.disabled = !ready;
    interactBtn.title = ready ? "" : "A live preview isn't available for this project — use Open Live Site instead.";
  }

  function renderMeta(ctrl){
    var idx = state.index[ctrl.group];
    var p = ctrl.cards[idx].project;
    ctrl.metaWrap.innerHTML =
      '<p class="portfolio-meta-category">' + escapeHtml(p.category) + '</p>' +
      '<h3 class="portfolio-meta-name">' + escapeHtml(p.name) + '</h3>' +
      '<p class="portfolio-meta-desc">' + escapeHtml(p.description) + '</p>' +
      '<p class="portfolio-meta-position">' + (idx + 1) + ' / ' + ctrl.cards.length + '</p>' +
      '<div class="portfolio-actions">' +
        '<button type="button" class="btn-ghost" data-interact-btn>Interact With Preview</button>' +
        '<a class="btn-primary" href="' + escapeHtml(p.url) + '" target="_blank" rel="noopener noreferrer">' + escapeHtml(p.secondaryLabel || "Open Live Site") + ' →</a>' +
      '</div>';

    var interactBtn = ctrl.metaWrap.querySelector("[data-interact-btn]");
    // Disabled until the iframe actually finishes loading (see
    // updateInteractAvailability, called from activateSlide's load/error/
    // timeout handlers) — never enabled for a project that only has a
    // fallback poster, and never enabled speculatively while a live
    // project's iframe is still in flight or failed.
    interactBtn.disabled = true;
    interactBtn.title = "A live preview isn't available for this project — use Open Live Site instead.";
    interactBtn.addEventListener("click", function(){ enterInteraction(ctrl.group); });
    updateInteractAvailability(ctrl, idx);

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

  function enterInteraction(group){
    var ctrl = carousels[group];
    var idx = state.index[group];
    ctrl.cards[idx].el.classList.add("is-interactive");
    var iframe = ctrl.cards[idx].iframeEl;
    if(iframe) iframe.setAttribute("tabindex", "0");
  }
  function exitInteraction(group){
    var ctrl = carousels[group];
    var idx = state.index[group];
    ctrl.cards[idx].el.classList.remove("is-interactive");
    var iframe = ctrl.cards[idx].iframeEl;
    if(iframe) iframe.setAttribute("tabindex", "-1");
    ctrl.root.focus({ preventScroll: true });
  }

  /* ── Drag / swipe physics: 1:1 tracking, vertical-scroll preserved until axis is clearly horizontal ── */
  function initDrag(ctrl){
    var el = ctrl.root;
    var pointerId = null;
    var moved = 0;

    function pointerDown(e){
      if(e.target.closest(".portfolio-nav, .portfolio-exit-btn, [data-interact-btn]")) return;
      var activeCard = ctrl.cards[state.index[ctrl.group]];
      if(activeCard.el.classList.contains("is-interactive")) return; // let interaction mode own the gesture
      pointerId = e.pointerId;
      ctrl.dragging = true;
      ctrl.dragAxisLocked = null;
      ctrl.startX = e.clientX; ctrl.startY = e.clientY;
      moved = 0;
      el.setPointerCapture && el.setPointerCapture(pointerId);
    }

    function pointerMove(e){
      if(!ctrl.dragging || e.pointerId !== pointerId) return;
      var dx = e.clientX - ctrl.startX;
      var dy = e.clientY - ctrl.startY;

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

  function initDots(ctrl){
    ctrl.dotEls.forEach(function(d, i){
      d.addEventListener("click", function(){ goTo(ctrl.group, i); });
    });
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

  /* ── Tabs ── */
  function initTabs(){
    var tabsWrap = section.querySelector(".portfolio-tabs");
    var tabs = Array.prototype.slice.call(section.querySelectorAll(".portfolio-tab"));
    tabs.forEach(function(tab){
      tab.addEventListener("click", function(){ switchGroup(tab.dataset.group); });
    });
    tabsWrap.addEventListener("keydown", function(e){
      if(e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      var otherGroup = state.activeGroup === "websites" ? "apps" : "websites";
      switchGroup(otherGroup);
      section.querySelector('#portfolio-tab-' + (otherGroup === "websites" ? "websites" : "apps")).focus();
    });
  }

  function switchGroup(group){
    if(group === state.activeGroup) return;
    state.activeGroup = group;
    var tabsWrap = section.querySelector(".portfolio-tabs");
    tabsWrap.dataset.active = group;

    GROUPS.forEach(function(g){
      var tab = document.getElementById("portfolio-tab-" + g);
      var panel = document.getElementById("portfolio-panel-" + g);
      var isActive = g === group;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
      tab.tabIndex = isActive ? 0 : -1;
      panel.hidden = !isActive;
    });

    // (re)activate the correct iframe for the now-visible group, none for the hidden one
    var hiddenGroup = group === "websites" ? "apps" : "websites";
    carousels[hiddenGroup].cards.forEach(function(c){
      if(c.iframeEl){ c.iframeEl.remove(); c.iframeEl = null; c.iframeLoaded = false; c.loading.classList.add("is-hidden"); }
      c.el.classList.remove("is-interactive");
    });
    layout(carousels[group], false);
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

  function init(){
    GROUPS.forEach(buildCarousel);
    initTabs();
    initPerfGate();
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
