/* ============================================================
   Secret Suite — page behavior
   Reads SS_SUITE_APPS / SS_SUITE_CATEGORIES / SS_SUITE_STATUSES
   from secret-suite-data.js and SS_SUITE_ICON_PATHS from
   secret-suite-icons.js. Handles search, filters, sort, the
   comparison/grid view toggle, mobile filter drawer, and the
   two-column category-grid calculator. No external APIs, no
   build step.
   ============================================================ */
(function(){
  "use strict";

  var STATUS_LABELS = {
    available: "Available",
    beta: "Beta",
    in_development: "In development",
    planned: "Planned"
  };

  var CATEGORY_SHORT_LABELS = {
    "Design and Content": "Design",
    "Communication": "Communication",
    "Productivity": "Productivity",
    "Sales and Marketing": "Sales & Marketing",
    "Business Operations": "Operations",
    "Finance": "Finance",
    "Development": "Development",
    "Infrastructure": "Infrastructure",
    "AI and Data": "AI & Data",
    "Personal Tools": "Personal"
  };

  function fmtMoney(n){
    return "$" + n.toLocaleString("en-US", {minimumFractionDigits: 2, maximumFractionDigits: 2});
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, function(c){
      return {"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c];
    });
  }

  function isValidHttpsUrl(url){
    try{
      var u = new URL(url);
      return u.protocol === "https:";
    }catch(e){ return false; }
  }

  function secretIconHtml(app, extraAttrs){
    var paths = (typeof SS_SUITE_ICON_PATHS !== "undefined" && SS_SUITE_ICON_PATHS[app.slug]) || "";
    return '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"' + (extraAttrs||'') + '>' + paths + '</svg>';
  }

  /* ── Competitor block: one container, one diagonal line, real logo, name only when logo doesn't already show it ── */
  function competitorBlockHtml(app, logoHeight){
    var ext = app.logoExt || "svg";
    var logoHtml = app.logoSlug
      ? '<span class="competitor-logo"><img src="/secret-suite/assets/competitor-logos/' + encodeURIComponent(app.logoSlug) + '.' + ext + '" alt="" style="height:' + logoHeight + 'px" loading="lazy" onerror="this.closest(\'.competitor-block\').classList.add(\'logo-failed\')"/></span>'
      : '';
    var nameHtml = (!app.logoIncludesName)
      ? '<span class="competitor-name">' + escapeHtml(app.paidAlternative) + '</span>'
      : '<span class="competitor-name is-spacer" aria-hidden="true">&nbsp;</span>';
    return (
      '<span class="competitor-block" role="img" aria-label="' + escapeHtml(app.paidAlternative) + ' — cancelled, replaced">' +
        logoHtml +
        '<span class="competitor-text">' + nameHtml + '<span class="competitor-price">' + escapeHtml(app.priceBasisNote) + '</span></span>' +
      '</span>'
    );
  }

  /* ── Filtering / search / sort ── */
  function effectiveMonthlyValue(app, teamSize){
    if(app.priceBasis === "peruser") return app.representativeMonthlyPrice * teamSize;
    if(app.priceBasis === "merged") return 0;
    return app.representativeMonthlyPrice;
  }

  function getState(){
    return {
      q: document.getElementById("searchInput").value.trim().toLowerCase(),
      cat: document.getElementById("categoryFilter").value,
      status: document.getElementById("statusFilter").value,
      sort: document.getElementById("sortSelect").value
    };
  }

  function getFilteredApps(){
    var s = getState();
    var result = SS_SUITE_APPS.filter(function(app){
      if(s.cat && app.category !== s.cat) return false;
      if(s.status && app.status !== s.status) return false;
      if(s.q){
        var hay = (app.secretName + " " + app.description + " " + app.paidAlternative + " " + app.category).toLowerCase();
        if(hay.indexOf(s.q) === -1) return false;
      }
      return true;
    });

    result.sort(function(a,b){
      if(s.sort === "popularity") return b.popularity - a.popularity;
      if(s.sort === "value") return effectiveMonthlyValue(b,5) - effectiveMonthlyValue(a,5);
      if(s.sort === "name") return a.secretName.localeCompare(b.secretName);
      return a.rank - b.rank;
    });

    return result;
  }

  function subdomainHref(app){
    if(!isValidHttpsUrl(app.subdomain)) return "#";
    return app.subdomain;
  }

  function handleAppClick(e, app, containerSelector){
    if(app.status !== "available"){
      e.preventDefault();
      var msg = app.secretName + " is " + (STATUS_LABELS[app.status] || app.status).toLowerCase() + " — this subdomain isn't live yet, so we've kept this link from sending you to a broken page.";
      var el = e.currentTarget;
      var container = el.closest(containerSelector) || el.parentElement;
      if(!container) return;
      var existing = container.querySelector(".planned-note");
      if(existing) existing.remove();
      var note = document.createElement("div");
      note.className = "planned-note";
      note.setAttribute("role","status");
      note.textContent = msg;
      container.appendChild(note);
    }
  }

  function statusText(app){
    if(app.status === "available") return "Available now";
    if(app.status === "beta") return "In beta";
    if(app.status === "in_development") return "In development";
    return "Planned";
  }

  var SWAP_ARROW_SVG = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M4 12h16M14 6l6 6-6 6"/></svg>';
  var REPLACES_HEADER_SVG = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M4 12h16M14 6l6 6-6 6"/></svg>';

  /* ── Comparison view: desktop row ── */
  function renderRow(app){
    var row = document.createElement("div");
    row.className = "cat-row";
    row.setAttribute("role","row");

    var href = subdomainHref(app);
    var live = app.status === "available";
    var statusClass = "status-tag" + (live ? " is-available" : app.status === "beta" ? " is-beta" : app.status === "in_development" ? " is-in_development" : "");

    row.innerHTML =
      '<span class="row-rank" role="cell">' + app.rank + '</span>' +
      '<span class="row-app" role="cell">' +
        '<span class="row-app-icon">' + secretIconHtml(app) + '</span>' +
        '<span class="row-app-text">' +
          '<a class="row-app-name" href="' + escapeHtml(href) + '"' + (live ? ' target="_blank" rel="noopener"' : '') + '>' + escapeHtml(app.secretName) + '</a>' +
          '<span class="row-app-desc">' + escapeHtml(app.description) + '</span>' +
          '<span class="row-app-meta"><span class="row-app-cat">' + escapeHtml(app.category) + '</span><span class="row-dot">·</span><span class="' + statusClass + '">' + escapeHtml(statusText(app)) + '</span></span>' +
        '</span>' +
      '</span>' +
      '<span class="row-replaces-col" role="cell" aria-hidden="true">' + SWAP_ARROW_SVG + '</span>' +
      '<span class="row-competitor" role="cell">' + competitorBlockHtml(app, 24) + '</span>';

    var link = row.querySelector(".row-app-name");
    link.addEventListener("click", function(e){ handleAppClick(e, app, ".row-app"); });

    return row;
  }

  /* ── Comparison view: mobile parallel card ── */
  function renderCard(app){
    var div = document.createElement("div");
    div.className = "suite-card";
    var href = subdomainHref(app);
    var live = app.status === "available";
    var statusClass = "suite-card-status" + (live ? " is-available" : "");

    div.innerHTML =
      '<div class="suite-card-row">' +
        '<div class="suite-card-secret">' +
          '<div class="suite-card-secret-top">' +
            '<span class="suite-card-icon">' + secretIconHtml(app) + '</span>' +
            '<a class="suite-card-name" href="' + escapeHtml(href) + '"' + (live ? ' target="_blank" rel="noopener"' : '') + '>' + escapeHtml(app.secretName) + '</a>' +
          '</div>' +
          '<span class="suite-card-desc">' + escapeHtml(app.description) + '</span>' +
          '<span class="' + statusClass + '">' + escapeHtml(statusText(app)) + '</span>' +
        '</div>' +
        '<div class="suite-card-center">' + SWAP_ARROW_SVG + '</div>' +
        '<div class="suite-card-competitor">' + competitorBlockHtml(app, 20) + '</div>' +
      '</div>';

    var link = div.querySelector(".suite-card-name");
    link.addEventListener("click", function(e){ handleAppClick(e, app, ".suite-card"); });
    return div;
  }

  /* ── Grid view: recognizable competitor logo up front; tap flips the
     tile to reveal the Secret Systems app that replaces it ── */
  function renderGridTile(app){
    var wrap = document.createElement("div");
    wrap.className = "grid-tile";

    var ext = app.logoExt || "svg";
    var frontLogo = app.logoSlug
      ? '<span class="grid-tile-logo"><img src="/secret-suite/assets/competitor-logos/' + encodeURIComponent(app.logoSlug) + '.' + ext + '" alt="" loading="lazy"/></span>'
      : '<span class="grid-tile-logo grid-tile-logo-word">' + escapeHtml(app.paidAlternative) + '</span>';
    var frontName = (!app.logoIncludesName) ? '<span class="grid-tile-competitor-name">' + escapeHtml(app.paidAlternative) + '</span>' : '';

    var front = document.createElement("button");
    front.type = "button";
    front.className = "grid-tile-face grid-tile-front";
    front.setAttribute("aria-label", "Show the Secret Systems app that replaces " + app.paidAlternative);
    front.innerHTML = frontLogo + frontName;

    var href = subdomainHref(app);
    var live = app.status === "available";
    var statusDotClass = "grid-tile-status" + (live ? " is-available" : app.status === "beta" ? " is-beta" : app.status === "in_development" ? " is-in_development" : "");

    var back = document.createElement("div");
    back.className = "grid-tile-face grid-tile-back";
    var backLink = document.createElement("a");
    backLink.className = "grid-tile-back-link";
    backLink.href = href;
    if(live){ backLink.target = "_blank"; backLink.rel = "noopener"; }
    backLink.innerHTML =
      '<span class="grid-tile-icon">' + secretIconHtml(app) + '</span>' +
      '<span class="grid-tile-name">' + escapeHtml(app.secretName) + '</span>' +
      '<span class="' + statusDotClass + '" aria-hidden="true"></span>';
    backLink.setAttribute("aria-label", app.secretName + " — replaces " + app.paidAlternative + " — " + statusText(app));
    backLink.addEventListener("click", function(e){ handleAppClick(e, app, ".grid-tile-back"); });

    var backBtn = document.createElement("button");
    backBtn.type = "button";
    backBtn.className = "grid-tile-back-flip";
    backBtn.setAttribute("aria-label", "Back to " + app.paidAlternative);
    backBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M10 6l-6 6 6 6M4 12h16"/></svg>';

    back.appendChild(backBtn);
    back.appendChild(backLink);

    var flipped = false;
    function setFlipped(next){
      flipped = next;
      wrap.classList.toggle("is-flipped", flipped);
      front.setAttribute("aria-expanded", flipped ? "true" : "false");
    }
    front.setAttribute("aria-expanded", "false");
    front.addEventListener("click", function(){ setFlipped(true); });
    backBtn.addEventListener("click", function(){ setFlipped(false); });

    wrap.appendChild(front);
    wrap.appendChild(back);
    return wrap;
  }

  function announceCount(n){
    var total = SS_SUITE_APPS.length;
    var text = n + " of " + total + " apps";
    var desktopEl = document.getElementById("resultsCount");
    var mobileEl = document.getElementById("mobileResultsCount");
    if(desktopEl) desktopEl.textContent = text;
    if(mobileEl) mobileEl.textContent = text;
  }

  /* ── View state (comparison | grid), persisted ── */
  var VIEW_STORAGE_KEY = "ss_secret_suite_view_v1";
  function getStoredView(){
    try{
      var v = localStorage.getItem(VIEW_STORAGE_KEY);
      return (v === "grid") ? "grid" : "comparison";
    }catch(e){ return "comparison"; }
  }
  function storeView(view){
    try{ localStorage.setItem(VIEW_STORAGE_KEY, view); }catch(e){ /* ignore */ }
  }

  var currentView = getStoredView();

  function applyViewToggleButtons(){
    var btns = document.querySelectorAll(".view-toggle-btn");
    btns.forEach(function(btn){
      var pressed = btn.getAttribute("data-view") === currentView;
      btn.setAttribute("aria-pressed", pressed ? "true" : "false");
    });
  }

  function renderCatalog(){
    var apps = getFilteredApps();
    var rowsWrap = document.getElementById("catalogRows");
    var cardsWrap = document.getElementById("catalogCards");
    var gridWrap = document.getElementById("gridView");
    var empty = document.getElementById("emptyState");
    var list = document.getElementById("catalogList");

    rowsWrap.innerHTML = "";
    cardsWrap.innerHTML = "";
    gridWrap.innerHTML = "";

    var isComparison = currentView === "comparison";
    list.classList.toggle("active", isComparison);
    cardsWrap.classList.toggle("active", isComparison);
    gridWrap.classList.toggle("active", !isComparison);
    list.style.display = isComparison ? "" : "none";
    cardsWrap.style.display = isComparison ? "" : "none";

    if(apps.length === 0){
      empty.style.display = "block";
    } else {
      empty.style.display = "none";
      if(isComparison){
        var rowFrag = document.createDocumentFragment();
        var cardFrag = document.createDocumentFragment();
        apps.forEach(function(app){
          rowFrag.appendChild(renderRow(app));
          cardFrag.appendChild(renderCard(app));
        });
        rowsWrap.appendChild(rowFrag);
        cardsWrap.appendChild(cardFrag);
      } else {
        var gridFrag = document.createDocumentFragment();
        apps.forEach(function(app){
          gridFrag.appendChild(renderGridTile(app));
        });
        gridWrap.appendChild(gridFrag);
      }
    }
    announceCount(apps.length);
  }

  function setView(view){
    currentView = (view === "grid") ? "grid" : "comparison";
    storeView(currentView);
    applyViewToggleButtons();
    renderCatalog();
  }

  function clearFilters(){
    document.getElementById("searchInput").value = "";
    document.getElementById("categoryFilter").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("sortSelect").value = "rank";
    syncMobileControlsFromDesktop();
    updateFilterCount();
    renderCatalog();
  }

  function initFilterOptions(){
    [document.getElementById("categoryFilter"), document.getElementById("panelCategoryFilter")].forEach(function(catSel){
      if(!catSel) return;
      SS_SUITE_CATEGORIES.forEach(function(cat){
        var opt = document.createElement("option");
        opt.value = cat; opt.textContent = cat;
        catSel.appendChild(opt);
      });
    });
    [document.getElementById("statusFilter"), document.getElementById("panelStatusFilter")].forEach(function(statSel){
      if(!statSel) return;
      SS_SUITE_STATUSES.forEach(function(st){
        var opt = document.createElement("option");
        opt.value = st; opt.textContent = STATUS_LABELS[st] || st;
        statSel.appendChild(opt);
      });
    });
  }

  /* ── Mobile filter panel (bottom sheet) ── */
  var lastFocusedBeforePanel = null;

  function openFilterPanel(){
    var backdrop = document.getElementById("filterPanelBackdrop");
    var panel = document.getElementById("filterPanel");
    lastFocusedBeforePanel = document.activeElement;
    backdrop.classList.add("open");
    panel.classList.add("open");
    document.body.style.overflow = "hidden";
    var firstField = panel.querySelector("select, input, button");
    if(firstField) firstField.focus();
    document.addEventListener("keydown", onPanelKeydown);
  }

  function closeFilterPanel(){
    var backdrop = document.getElementById("filterPanelBackdrop");
    var panel = document.getElementById("filterPanel");
    backdrop.classList.remove("open");
    panel.classList.remove("open");
    document.body.style.overflow = "";
    document.removeEventListener("keydown", onPanelKeydown);
    var filtersBtn = document.getElementById("mobileFiltersBtn");
    if(filtersBtn) filtersBtn.focus();
  }

  function onPanelKeydown(e){
    if(e.key === "Escape"){
      closeFilterPanel();
      return;
    }
    if(e.key === "Tab"){
      var panel = document.getElementById("filterPanel");
      var focusables = panel.querySelectorAll('select, input, button, a[href]');
      if(!focusables.length) return;
      var first = focusables[0], last = focusables[focusables.length - 1];
      if(e.shiftKey && document.activeElement === first){
        e.preventDefault(); last.focus();
      } else if(!e.shiftKey && document.activeElement === last){
        e.preventDefault(); first.focus();
      }
    }
  }

  function syncMobileControlsFromDesktop(){
    var panelCat = document.getElementById("panelCategoryFilter");
    var panelStatus = document.getElementById("panelStatusFilter");
    var panelSort = document.getElementById("panelSortSelect");
    var mobileSearch = document.getElementById("mobileSearchInput");
    if(panelCat) panelCat.value = document.getElementById("categoryFilter").value;
    if(panelStatus) panelStatus.value = document.getElementById("statusFilter").value;
    if(panelSort) panelSort.value = document.getElementById("sortSelect").value;
    if(mobileSearch) mobileSearch.value = document.getElementById("searchInput").value;
  }

  function updateFilterCount(){
    var s = getState();
    var count = (s.cat ? 1 : 0) + (s.status ? 1 : 0) + (s.sort !== "rank" ? 1 : 0);
    var badge = document.getElementById("mobileFiltersCount");
    var clearLink = document.getElementById("mobileClearLink");
    if(badge){
      if(count > 0){ badge.textContent = String(count); badge.style.display = "flex"; }
      else { badge.style.display = "none"; }
    }
    if(clearLink){
      clearLink.style.display = (count > 0 || s.q) ? "inline" : "none";
    }
  }

  function initMobileControls(){
    var mobileSearch = document.getElementById("mobileSearchInput");
    var desktopSearch = document.getElementById("searchInput");
    var filtersBtn = document.getElementById("mobileFiltersBtn");
    var closeBtn = document.getElementById("filterPanelClose");
    var backdrop = document.getElementById("filterPanelBackdrop");
    var applyBtn = document.getElementById("filterPanelApply");
    var clearBtnPanel = document.getElementById("filterPanelClear");
    var clearLinkRow2 = document.getElementById("mobileClearLink");

    if(mobileSearch){
      mobileSearch.addEventListener("input", function(){
        desktopSearch.value = mobileSearch.value;
        renderCatalog();
        updateFilterCount();
      });
    }
    if(filtersBtn) filtersBtn.addEventListener("click", openFilterPanel);
    if(closeBtn) closeBtn.addEventListener("click", closeFilterPanel);
    if(backdrop) backdrop.addEventListener("click", function(e){ if(e.target === backdrop) closeFilterPanel(); });

    var panelCat = document.getElementById("panelCategoryFilter");
    var panelStatus = document.getElementById("panelStatusFilter");
    var panelSort = document.getElementById("panelSortSelect");
    if(panelCat) panelCat.addEventListener("change", function(){ document.getElementById("categoryFilter").value = panelCat.value; renderCatalog(); updateFilterCount(); });
    if(panelStatus) panelStatus.addEventListener("change", function(){ document.getElementById("statusFilter").value = panelStatus.value; renderCatalog(); updateFilterCount(); });
    if(panelSort) panelSort.addEventListener("change", function(){ document.getElementById("sortSelect").value = panelSort.value; renderCatalog(); updateFilterCount(); });

    if(applyBtn) applyBtn.addEventListener("click", closeFilterPanel);
    if(clearBtnPanel) clearBtnPanel.addEventListener("click", function(){ clearFilters(); closeFilterPanel(); });
    if(clearLinkRow2) clearLinkRow2.addEventListener("click", clearFilters);
  }

  function initControls(){
    document.getElementById("searchInput").addEventListener("input", function(){ renderCatalog(); syncMobileControlsFromDesktop(); updateFilterCount(); });
    document.getElementById("categoryFilter").addEventListener("change", function(){ renderCatalog(); syncMobileControlsFromDesktop(); updateFilterCount(); });
    document.getElementById("statusFilter").addEventListener("change", function(){ renderCatalog(); syncMobileControlsFromDesktop(); updateFilterCount(); });
    document.getElementById("sortSelect").addEventListener("change", function(){ renderCatalog(); syncMobileControlsFromDesktop(); updateFilterCount(); });
    document.getElementById("clearFilters").addEventListener("click", clearFilters);

    document.querySelectorAll(".view-toggle-btn").forEach(function(btn){
      btn.addEventListener("click", function(){ setView(btn.getAttribute("data-view")); });
    });
  }

  /* ── Calculator: two-column, five-row fixed category grid ── */
  var CALC_STORAGE_KEY = "ss_secret_suite_calc_v2";

  var FIXED_CATEGORY_ORDER = [
    "Design and Content", "Communication",
    "Productivity", "Sales and Marketing",
    "Business Operations", "Finance",
    "Development", "Infrastructure",
    "AI and Data", "Personal Tools"
  ];

  function loadCalcState(){
    try{
      var raw = localStorage.getItem(CALC_STORAGE_KEY);
      if(!raw) return null;
      var parsed = JSON.parse(raw);
      if(parsed && typeof parsed === "object") return parsed;
    }catch(e){ /* localStorage unavailable or corrupt — fall back to defaults */ }
    return null;
  }

  function saveCalcState(state){
    try{ localStorage.setItem(CALC_STORAGE_KEY, JSON.stringify(state)); }catch(e){ /* ignore quota/privacy errors */ }
  }

  function initCalculator(){
    var teamInput = document.getElementById("teamSize");
    var teamNum = document.getElementById("teamSizeNum");
    var catsWrap = document.getElementById("calcCategories");
    var selectAllBtn = document.getElementById("calcSelectAll");
    var resetBtn = document.getElementById("calcReset");
    var selectedCountEl = document.getElementById("calcSelectedCount");

    var saved = loadCalcState();
    var selected = {};
    SS_SUITE_APPS.forEach(function(app){
      selected[app.slug] = saved && saved.selected ? !!saved.selected[app.slug] : true;
    });
    var teamSize = saved && saved.teamSize ? Math.min(100, Math.max(1, saved.teamSize)) : SS_SUITE_TEAM_SIZE_DEFAULT;
    teamInput.value = teamSize;
    teamNum.textContent = teamSize;

    var byCategory = {};
    FIXED_CATEGORY_ORDER.forEach(function(cat){ byCategory[cat] = []; });
    SS_SUITE_APPS.forEach(function(app){ byCategory[app.category].push(app); });

    var catFrag = document.createDocumentFragment();
    var categoryCheckboxes = {};
    var appCheckboxes = {};

    FIXED_CATEGORY_ORDER.forEach(function(cat, catIndex){
      var apps = byCategory[cat];

      var headerId = "calc-cat-header-" + catIndex;
      var bodyId = "calc-cat-body-" + catIndex;

      // catEl is itself the direct grid item (tile) so its sibling body
      // can also be a direct grid item and legally span both columns.
      var catEl = document.createElement("div");
      catEl.className = "calc-category";
      catEl.style.cssText = "display:flex;align-items:center;";

      var catCb = document.createElement("input");
      catCb.type = "checkbox";
      catCb.className = "calc-cat-checkbox";
      catCb.id = headerId + "-cb";
      catCb.setAttribute("aria-label", "Select all " + cat + " apps");

      var toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "calc-cat-tile";
      toggleBtn.id = headerId;
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.setAttribute("aria-controls", bodyId);
      var shortLabel = CATEGORY_SHORT_LABELS[cat] || cat;
      toggleBtn.innerHTML =
        '<span class="calc-cat-text">' +
          '<span class="calc-cat-name"><span class="full">' + escapeHtml(cat) + '</span><span class="short">' + escapeHtml(shortLabel) + '</span></span>' +
          '<span class="calc-cat-count">' + apps.length + ' app' + (apps.length===1?'':'s') + '</span>' +
        '</span>' +
        '<span class="calc-cat-caret" aria-hidden="true">▾</span>';

      catEl.appendChild(catCb);
      catEl.appendChild(toggleBtn);
      catFrag.appendChild(catEl);

      var body = document.createElement("div");
      body.className = "calc-cat-body";
      body.id = bodyId;
      body.setAttribute("role", "group");
      body.setAttribute("aria-labelledby", headerId);

      apps.forEach(function(app){
        var row = document.createElement("div");
        row.className = "calc-app-row";
        var cbId = "calc-app-" + app.slug;
        var cb = document.createElement("input");
        cb.type = "checkbox";
        cb.id = cbId;
        cb.checked = selected[app.slug];
        cb.setAttribute("data-slug", app.slug);
        var label = document.createElement("label");
        label.setAttribute("for", cbId);
        label.innerHTML = '<span class="can">' + escapeHtml(app.secretName) + '</span> <span class="cap">replaces ' + escapeHtml(app.paidAlternative) + ' · ' + escapeHtml(app.priceBasisNote) + '</span>';
        row.appendChild(cb);
        row.appendChild(label);
        body.appendChild(row);
        appCheckboxes[app.slug] = cb;
      });

      catFrag.appendChild(body);
      categoryCheckboxes[cat] = catCb;

      toggleBtn.addEventListener("click", function(){
        var isOpen = catEl.classList.toggle("open");
        body.classList.toggle("open", isOpen);
        toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      catCb.addEventListener("click", function(e){ e.stopPropagation(); });
      catCb.addEventListener("change", function(){
        apps.forEach(function(app){
          selected[app.slug] = catCb.checked;
          if(appCheckboxes[app.slug]) appCheckboxes[app.slug].checked = catCb.checked;
        });
        computeAndRender();
      });
    });

    catsWrap.appendChild(catFrag);
    catsWrap.classList.add("calc-cat-grid");

    function syncCategoryCheckbox(cat){
      var apps = byCategory[cat];
      var allOn = apps.every(function(a){ return selected[a.slug]; });
      var noneOn = apps.every(function(a){ return !selected[a.slug]; });
      var cb = categoryCheckboxes[cat];
      if(!cb) return;
      cb.checked = allOn;
      cb.indeterminate = !allOn && !noneOn;
    }

    function computeAndRender(){
      var monthly = 0;
      SS_SUITE_APPS.forEach(function(app){
        if(!selected[app.slug]) return;
        monthly += effectiveMonthlyValue(app, teamSize);
      });
      var selectedCount = SS_SUITE_APPS.filter(function(a){ return selected[a.slug]; }).length;
      document.getElementById("calcMonthly").textContent = fmtMoney(monthly);
      document.getElementById("calcAnnual").textContent = fmtMoney(monthly * 12);
      selectedCountEl.textContent = selectedCount + " of " + SS_SUITE_APPS.length + " apps selected";
      selectAllBtn.textContent = selectedCount === SS_SUITE_APPS.length ? "Deselect all" : "Select all";

      FIXED_CATEGORY_ORDER.forEach(syncCategoryCheckbox);
      saveCalcState({teamSize: teamSize, selected: selected});
    }

    catsWrap.addEventListener("change", function(e){
      var cb = e.target;
      if(cb && cb.matches('.calc-app-row input[type=checkbox]')){
        selected[cb.getAttribute("data-slug")] = cb.checked;
        computeAndRender();
      }
    });

    teamInput.addEventListener("input", function(){
      teamSize = parseInt(teamInput.value, 10) || 1;
      teamNum.textContent = teamSize;
      computeAndRender();
    });

    selectAllBtn.addEventListener("click", function(){
      var allSelected = SS_SUITE_APPS.every(function(a){ return selected[a.slug]; });
      var next = !allSelected;
      SS_SUITE_APPS.forEach(function(app){
        selected[app.slug] = next;
        if(appCheckboxes[app.slug]) appCheckboxes[app.slug].checked = next;
      });
      computeAndRender();
    });

    resetBtn.addEventListener("click", function(){
      teamSize = SS_SUITE_TEAM_SIZE_DEFAULT;
      teamInput.value = teamSize;
      teamNum.textContent = teamSize;
      SS_SUITE_APPS.forEach(function(app){
        selected[app.slug] = true;
        if(appCheckboxes[app.slug]) appCheckboxes[app.slug].checked = true;
      });
      computeAndRender();
    });

    computeAndRender();
  }

  function initReviewedDates(){
    var el1 = document.getElementById("pricingReviewedDate");
    if(el1) el1.textContent = SS_SUITE_PRICING_REVIEWED;
    var el2 = document.getElementById("stripReviewed");
    if(el2) el2.textContent = SS_SUITE_PRICING_REVIEWED;
  }

  function initVerifiedTotals(){
    var fixedTotal = SS_SUITE_APPS.reduce(function(sum, app){ return sum + effectiveMonthlyValue(app, SS_SUITE_TEAM_SIZE_DEFAULT); }, 0);
    var annual = fixedTotal * 12;
    var monthlyStr = fmtMoney(fixedTotal);
    var annualStr = fmtMoney(annual);
    var heroM = document.getElementById("heroMonthly");
    var heroA = document.getElementById("heroAnnual");
    var methodTotal = document.getElementById("methodTotal");
    if(heroM) heroM.textContent = monthlyStr;
    if(heroA) heroA.textContent = annualStr;
    if(methodTotal) methodTotal.textContent = monthlyStr + "/month";
  }

  document.addEventListener("DOMContentLoaded", function(){
    initFilterOptions();
    initControls();
    initMobileControls();
    applyViewToggleButtons();
    renderCatalog();
    updateFilterCount();
    initCalculator();
    initReviewedDates();
    initVerifiedTotals();
  });
})();
