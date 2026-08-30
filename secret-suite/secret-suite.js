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

  var DEPLOY_BADGE_SHORT = {
    no_hosting: "Free Forever",
    free_cloud: "Free Cloud Eligible",
    own_server: "Own Server Required",
    external_services: "External Services"
  };
  var REQUIREMENT_BADGE_SHORT = {
    none: "No Hosting",
    database: "Database",
    file_storage: "File Storage",
    email_delivery: "Email Delivery",
    docker: "Docker",
    ai_model: "AI/GPU",
    gpu: "AI/GPU",
    third_party_api: "Third-Party API",
    licensed_data: "Licensed Data",
    video_bandwidth: "Video Bandwidth",
    always_on_server: "Always-On Server"
  };

  function primaryRequirement(app){
    if(!app.requirements || !app.requirements.length || app.requirements[0] === "none") return "none";
    // Prefer the most visually informative single requirement.
    var priority = ["gpu","ai_model","docker","database","always_on_server","file_storage","email_delivery","third_party_api","licensed_data","video_bandwidth"];
    for(var i=0;i<priority.length;i++){
      if(app.requirements.indexOf(priority[i]) !== -1) return priority[i];
    }
    return app.requirements[0];
  }

  function deployBadgesHtml(app){
    var pathBadge = '<span class="deploy-badge is-path-' + app.deploymentPath + '">' + escapeHtml(DEPLOY_BADGE_SHORT[app.deploymentPath] || app.deploymentPath) + '</span>';
    var setupBadge = '<span class="deploy-badge">' + escapeHtml(app.setupLabel) + '</span>';
    var reqKey = primaryRequirement(app);
    var reqBadge = '<span class="deploy-badge">' + escapeHtml(REQUIREMENT_BADGE_SHORT[reqKey] || reqKey) + '</span>';
    return '<span class="deploy-badges">' + pathBadge + setupBadge + reqBadge + '</span>';
  }

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
    /* Secondary open-source source link — sits outside the struck-through
       comparison block itself, so the strike-through stays a single line
       across just the "cancelled, replaced" competitor claim. */
    var sourceHtml = (app.openSourceUrl && app.openSourceLabel && isValidHttpsUrl(app.openSourceUrl))
      ? '<a class="competitor-source-link" href="' + escapeHtml(app.openSourceUrl) + '" target="_blank" rel="noopener">' +
          '<svg class="competitor-source-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12.3 12.3 0 0 0-6.2 0C6.6 2.8 5.5 3.1 5.5 3.1a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4.1 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/></svg>' +
          'Source: ' + escapeHtml(app.openSourceLabel) +
        '</a>'
      : '';
    return (
      '<span class="competitor-wrap">' +
        '<span class="competitor-block" role="img" aria-label="' + escapeHtml(app.paidAlternative) + ' — cancelled, replaced">' +
          logoHtml +
          '<span class="competitor-text">' + nameHtml + '<span class="competitor-price">' + escapeHtml(app.priceBasisNote) + '</span></span>' +
        '</span>' +
        sourceHtml +
      '</span>'
    );
  }

  /* ── Filtering / search / sort ── */
  function effectiveMonthlyValue(app, teamSize){
    if(app.priceBasis === "peruser") return app.representativeMonthlyPrice * teamSize;
    if(app.priceBasis === "merged") return 0;
    return app.representativeMonthlyPrice;
  }

  /* ── Multi-group filter state ──
     Each group is an array of selected values, OR'd within the group.
     Groups are AND'd together. Category/Status remain single-select
     dropdowns (existing pattern) but participate in the same AND chain. */
  var filterState = {
    deploymentPath: [],
    setupLevel: [],
    costTier: [],
    requirements: [],
    managed: [],
    excludeDatabase: false
  };

  function getState(){
    return {
      q: document.getElementById("searchInput").value.trim().toLowerCase(),
      cat: document.getElementById("panelCategoryFilter").value,
      status: document.getElementById("panelStatusFilter").value,
      sort: document.getElementById("sortSelect").value
    };
  }

  function deploymentPriority(app){
    var d = SS_SUITE_DEPLOYMENT_PATHS.filter(function(p){ return p.value === app.deploymentPath; })[0];
    return d ? d.priority : 99;
  }

  var COST_ORDER = SS_SUITE_COST_TIERS.map(function(c){ return c.value; });

  function easiestFreeFirstCompare(a, b){
    var dp = deploymentPriority(a) - deploymentPriority(b);
    if(dp !== 0) return dp;
    var sl = a.setupLevel - b.setupLevel;
    if(sl !== 0) return sl;
    var cp = COST_ORDER.indexOf(a.diyCostTier) - COST_ORDER.indexOf(b.diyCostTier);
    if(cp !== 0) return cp;
    return b.popularity - a.popularity;
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
      if(filterState.deploymentPath.length && filterState.deploymentPath.indexOf(app.deploymentPath) === -1) return false;
      if(filterState.setupLevel.length && filterState.setupLevel.indexOf(app.setupLevel) === -1) return false;
      if(filterState.costTier.length && filterState.costTier.indexOf(app.diyCostTier) === -1) return false;
      if(filterState.managed.length && filterState.managed.indexOf(app.managedHosting) === -1) return false;
      if(filterState.requirements.length){
        var matchesAny = filterState.requirements.some(function(r){ return app.requirements.indexOf(r) !== -1; });
        if(!matchesAny) return false;
      }
      if(filterState.excludeDatabase && app.requirements.indexOf("database") !== -1) return false;
      return true;
    });

    result.sort(function(a,b){
      if(s.sort === "popularity") return b.popularity - a.popularity;
      if(s.sort === "value") return effectiveMonthlyValue(b,5) - effectiveMonthlyValue(a,5);
      if(s.sort === "name") return a.secretName.localeCompare(b.secretName);
      if(s.sort === "setup") return a.setupLevel - b.setupLevel || b.popularity - a.popularity;
      if(s.sort === "diycost") return COST_ORDER.indexOf(a.diyCostTier) - COST_ORDER.indexOf(b.diyCostTier) || b.popularity - a.popularity;
      if(s.sort === "easiest_free") return easiestFreeFirstCompare(a, b);
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
          deployBadgesHtml(app) +
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
      '</div>' +
      deployBadgesHtml(app);

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
    var mobileSearch = document.getElementById("mobileSearchInput");
    if(mobileSearch) mobileSearch.value = "";
    document.getElementById("panelCategoryFilter").value = "";
    document.getElementById("panelStatusFilter").value = "";
    document.getElementById("sortSelect").value = "easiest_free";
    var panelSort = document.getElementById("panelSortSelect");
    if(panelSort) panelSort.value = "easiest_free";
    filterState.deploymentPath = [];
    filterState.setupLevel = [];
    filterState.costTier = [];
    filterState.requirements = [];
    filterState.managed = [];
    syncCheckboxesFromState();
    syncQuickChipStates();
    updateFilterCount();
    renderActiveChips();
    renderCatalog();
    announcePolite("Filters cleared. Showing all " + SS_SUITE_APPS.length + " apps.");
  }

  function initFilterOptions(){
    var catSel = document.getElementById("panelCategoryFilter");
    if(catSel){
      SS_SUITE_CATEGORIES.forEach(function(cat){
        var opt = document.createElement("option");
        opt.value = cat; opt.textContent = cat;
        catSel.appendChild(opt);
      });
    }
    var statSel = document.getElementById("panelStatusFilter");
    if(statSel){
      SS_SUITE_STATUSES.forEach(function(st){
        var opt = document.createElement("option");
        opt.value = st; opt.textContent = STATUS_LABELS[st] || st;
        statSel.appendChild(opt);
      });
    }

    renderCheckboxGroup("filterDeploymentPath", "deploymentPath", SS_SUITE_DEPLOYMENT_PATHS.map(function(d){ return {value: d.value, label: d.label}; }));
    renderCheckboxGroup("filterSetupLevel", "setupLevel", SS_SUITE_SETUP_LEVELS.map(function(s){ return {value: s.value, label: s.label}; }));
    renderCheckboxGroup("filterCostTier", "costTier", SS_SUITE_COST_TIERS.map(function(c){ return {value: c.value, label: c.label}; }));
    renderCheckboxGroup("filterRequirements", "requirements", SS_SUITE_REQUIREMENTS.map(function(r){ return {value: r.value, label: r.label}; }));
    renderCheckboxGroup("filterManaged", "managed", SS_SUITE_MANAGED_STATUSES.map(function(m){ return {value: m.value, label: m.label}; }));
  }

  function renderCheckboxGroup(containerId, groupKey, options){
    var container = document.getElementById(containerId);
    if(!container) return;
    var frag = document.createDocumentFragment();
    options.forEach(function(opt, idx){
      var id = containerId + "-" + idx;
      var label = document.createElement("label");
      label.className = "filter-checkbox-item";
      label.setAttribute("for", id);
      var cb = document.createElement("input");
      cb.type = "checkbox";
      cb.id = id;
      cb.value = String(opt.value);
      cb.setAttribute("data-group", groupKey);
      var span = document.createElement("span");
      span.textContent = opt.label;
      label.appendChild(cb);
      label.appendChild(span);
      frag.appendChild(label);
    });
    container.appendChild(frag);
  }

  function syncCheckboxesFromState(){
    ["filterDeploymentPath","filterSetupLevel","filterCostTier","filterRequirements","filterManaged"].forEach(function(containerId){
      var container = document.getElementById(containerId);
      if(!container) return;
      container.querySelectorAll("input[type=checkbox]").forEach(function(cb){
        var groupKey = cb.getAttribute("data-group");
        var groupValues = filterState[groupKey] || [];
        var val = (groupKey === "setupLevel") ? parseInt(cb.value, 10) : cb.value;
        cb.checked = groupValues.indexOf(val) !== -1;
      });
    });
  }

  function onCheckboxGroupChange(e){
    var cb = e.target;
    if(!cb || cb.type !== "checkbox" || !cb.hasAttribute("data-group")) return;
    var groupKey = cb.getAttribute("data-group");
    var val = (groupKey === "setupLevel") ? parseInt(cb.value, 10) : cb.value;
    var arr = filterState[groupKey];
    var idx = arr.indexOf(val);
    if(cb.checked && idx === -1) arr.push(val);
    else if(!cb.checked && idx !== -1) arr.splice(idx, 1);
    syncQuickChipStates();
    updateFilterCount();
    renderActiveChips();
    renderCatalog();
  }

  /* ── Quick-filter chips ──
     Each quick filter is a named preset that sets one or more filter
     groups at once. Chips are pressed (aria-pressed) when the current
     filterState exactly satisfies the preset's condition. */
  var QUICK_FILTERS = [
    {
      key: "free_no_setup", label: "Free & No Setup",
      apply: function(){
        filterState.deploymentPath = ["no_hosting"];
        filterState.setupLevel = [1];
        filterState.costTier = ["zero"];
        filterState.requirements = ["none"];
      },
      isActive: function(){
        return arraysEqual(filterState.deploymentPath, ["no_hosting"]) &&
          arraysEqual(filterState.setupLevel, [1]) &&
          arraysEqual(filterState.costTier, ["zero"]) &&
          arraysEqual(filterState.requirements, ["none"]);
      },
      mobile: true
    },
    {
      key: "free_cloud", label: "Free Cloud",
      apply: function(){
        filterState.deploymentPath = ["free_cloud"];
        filterState.costTier = ["free_tier"];
      },
      isActive: function(){
        return arraysEqual(filterState.deploymentPath, ["free_cloud"]) && arraysEqual(filterState.costTier, ["free_tier"]);
      },
      mobile: true
    },
    {
      key: "one_click", label: "One-Click",
      apply: function(){ filterState.setupLevel = [2]; },
      isActive: function(){ return arraysEqual(filterState.setupLevel, [2]); },
      mobile: false
    },
    {
      key: "no_database", label: "No Database",
      apply: function(){ filterState.excludeDatabase = true; },
      isActive: function(){ return !!filterState.excludeDatabase; },
      mobile: false
    },
    {
      key: "managed_available", label: "Managed Available",
      apply: function(){ filterState.managed = ["available"]; },
      isActive: function(){ return arraysEqual(filterState.managed, ["available"]); },
      mobile: false
    }
  ];

  function arraysEqual(a, b){
    if(a.length !== b.length) return false;
    for(var i=0;i<a.length;i++){ if(a[i] !== b[i]) return false; }
    return true;
  }

  function resetGroupsForQuickFilters(){
    filterState.deploymentPath = [];
    filterState.setupLevel = [];
    filterState.costTier = [];
    filterState.requirements = [];
    filterState.managed = [];
    filterState.excludeDatabase = false;
  }

  function toggleQuickFilter(key){
    var qf = QUICK_FILTERS.filter(function(q){ return q.key === key; })[0];
    if(!qf) return;
    if(qf.isActive()){
      resetGroupsForQuickFilters();
    } else {
      resetGroupsForQuickFilters();
      qf.apply();
    }
    syncCheckboxesFromState();
    syncQuickChipStates();
    updateFilterCount();
    renderActiveChips();
    renderCatalog();
    announcePolite(qf.isActive() ? qf.label + " filter applied." : "Filter cleared.");
  }

  function renderQuickChips(){
    var containers = [
      { id: "desktopQuickChips", showAll: true },
      { id: "mobileQuickChips", showAll: false },
      { id: "panelQuickChips", showAll: true }
    ];
    containers.forEach(function(c){
      var el = document.getElementById(c.id);
      if(!el) return;
      el.innerHTML = "";
      QUICK_FILTERS.forEach(function(qf){
        if(!c.showAll && !qf.mobile) return;
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "quick-chip";
        btn.setAttribute("data-quick-key", qf.key);
        btn.setAttribute("aria-pressed", "false");
        btn.textContent = qf.label;
        btn.addEventListener("click", function(){ toggleQuickFilter(qf.key); });
        el.appendChild(btn);
      });
    });
  }

  function syncQuickChipStates(){
    QUICK_FILTERS.forEach(function(qf){
      var pressed = qf.isActive();
      document.querySelectorAll('[data-quick-key="' + qf.key + '"]').forEach(function(btn){
        btn.setAttribute("aria-pressed", pressed ? "true" : "false");
      });
    });
  }

  /* ── Active-filter chips (removable), reflecting every applied filter ── */
  function activeFilterEntries(){
    var entries = [];
    var s = getState();
    if(s.q) entries.push({ label: 'Search: "' + s.q + '"', clear: function(){ document.getElementById("searchInput").value = ""; var m = document.getElementById("mobileSearchInput"); if(m) m.value = ""; } });
    if(s.cat) entries.push({ label: s.cat, clear: function(){ document.getElementById("panelCategoryFilter").value = ""; } });
    if(s.status) entries.push({ label: STATUS_LABELS[s.status] || s.status, clear: function(){ document.getElementById("panelStatusFilter").value = ""; } });
    filterState.deploymentPath.forEach(function(v){
      var d = SS_SUITE_DEPLOYMENT_PATHS.filter(function(p){ return p.value === v; })[0];
      entries.push({ label: d ? d.label : v, clear: function(){ removeFromGroup("deploymentPath", v); } });
    });
    filterState.setupLevel.forEach(function(v){
      var lvl = SS_SUITE_SETUP_LEVELS.filter(function(s2){ return s2.value === v; })[0];
      entries.push({ label: lvl ? lvl.label : ("Level " + v), clear: function(){ removeFromGroup("setupLevel", v); } });
    });
    filterState.costTier.forEach(function(v){
      var c = SS_SUITE_COST_TIERS.filter(function(c2){ return c2.value === v; })[0];
      entries.push({ label: c ? c.label : v, clear: function(){ removeFromGroup("costTier", v); } });
    });
    filterState.requirements.forEach(function(v){
      var r = SS_SUITE_REQUIREMENTS.filter(function(r2){ return r2.value === v; })[0];
      entries.push({ label: r ? r.label : v, clear: function(){ removeFromGroup("requirements", v); } });
    });
    filterState.managed.forEach(function(v){
      var m = SS_SUITE_MANAGED_STATUSES.filter(function(m2){ return m2.value === v; })[0];
      entries.push({ label: m ? m.label : v, clear: function(){ removeFromGroup("managed", v); } });
    });
    if(filterState.excludeDatabase) entries.push({ label: "No Database", clear: function(){ filterState.excludeDatabase = false; } });
    return entries;
  }

  function removeFromGroup(groupKey, val){
    var arr = filterState[groupKey];
    var idx = arr.indexOf(val);
    if(idx !== -1) arr.splice(idx, 1);
  }

  function renderActiveChips(){
    var entries = activeFilterEntries();
    [document.getElementById("activeChips"), document.getElementById("activeChipsPanel")].forEach(function(wrap){
      if(!wrap) return;
      wrap.innerHTML = "";
      wrap.classList.toggle("has-chips", entries.length > 0);
      entries.forEach(function(entry){
        var chip = document.createElement("span");
        chip.className = "active-chip";
        var label = document.createElement("span");
        label.textContent = entry.label;
        var removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.setAttribute("aria-label", "Remove filter: " + entry.label);
        removeBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
        removeBtn.addEventListener("click", function(){
          entry.clear();
          syncCheckboxesFromState();
          syncQuickChipStates();
          updateFilterCount();
          renderActiveChips();
          renderCatalog();
        });
        chip.appendChild(label);
        chip.appendChild(removeBtn);
        wrap.appendChild(chip);
      });
    });
  }

  /* ── Deployment summary strip — counts computed from data, clickable ── */
  function renderDeploySummary(){
    var wrap = document.getElementById("deploySummaryRow");
    if(!wrap) return;
    var noHosting = SS_SUITE_APPS.filter(function(a){ return a.deploymentPath === "no_hosting"; }).length;
    var freeCloud = SS_SUITE_APPS.filter(function(a){ return a.deploymentPath === "free_cloud"; }).length;
    var oneClick = SS_SUITE_APPS.filter(function(a){ return a.setupLevel === 2; }).length;
    var ownServer = SS_SUITE_APPS.filter(function(a){ return a.deploymentPath === "own_server"; }).length;
    var managedAvail = SS_SUITE_APPS.filter(function(a){ return a.managedHosting === "available"; }).length;

    var items = [
      { num: noHosting, label: "Free with no hosting", primary: true, action: function(){ resetGroupsForQuickFilters(); filterState.deploymentPath = ["no_hosting"]; } },
      { num: freeCloud, label: "Free-cloud eligible", primary: false, action: function(){ resetGroupsForQuickFilters(); filterState.deploymentPath = ["free_cloud"]; } },
      { num: oneClick, label: "One-click", primary: false, action: function(){ resetGroupsForQuickFilters(); filterState.setupLevel = [2]; } },
      { num: ownServer, label: "Server required", primary: false, action: function(){ resetGroupsForQuickFilters(); filterState.deploymentPath = ["own_server"]; } },
      { num: managedAvail, label: "Managed options", primary: false, action: function(){ resetGroupsForQuickFilters(); filterState.managed = ["available"]; } }
    ];

    wrap.innerHTML = "";
    items.forEach(function(item){
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "deploy-summary-item" + (item.primary ? " is-primary" : "");
      btn.innerHTML = '<span class="deploy-summary-num">' + item.num + '</span><span class="deploy-summary-label">' + escapeHtml(item.label) + '</span>';
      btn.addEventListener("click", function(){
        item.action();
        syncCheckboxesFromState();
        syncQuickChipStates();
        updateFilterCount();
        renderActiveChips();
        renderCatalog();
        var filtersSection = document.getElementById("catalog");
        if(filtersSection) filtersSection.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      wrap.appendChild(btn);
    });
  }

  /* ── Filter panel (bottom sheet on mobile, anchored panel on desktop) ── */
  var lastFocusedBeforePanel = null;

  function announcePolite(msg){
    var live = document.getElementById("filterLiveRegion");
    if(live) live.textContent = msg;
  }

  function openFilterPanel(triggerEl){
    var backdrop = document.getElementById("filterPanelBackdrop");
    var panel = document.getElementById("filterPanel");
    lastFocusedBeforePanel = triggerEl || document.activeElement;
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
    var returnTo = lastFocusedBeforePanel || document.getElementById("mobileFiltersBtn");
    if(returnTo && typeof returnTo.focus === "function") returnTo.focus();
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

  function updateFilterCount(){
    var s = getState();
    var count = (s.cat ? 1 : 0) + (s.status ? 1 : 0) +
      filterState.deploymentPath.length + filterState.setupLevel.length +
      filterState.costTier.length + filterState.requirements.length + filterState.managed.length;
    [document.getElementById("mobileFiltersCount"), document.getElementById("desktopFiltersCount")].forEach(function(badge){
      if(!badge) return;
      if(count > 0){ badge.textContent = String(count); badge.style.display = "flex"; }
      else { badge.style.display = "none"; }
    });
    var clearLink = document.getElementById("mobileClearLink");
    if(clearLink){
      clearLink.style.display = (count > 0 || s.q) ? "inline" : "none";
    }
  }

  function initMobileControls(){
    var mobileSearch = document.getElementById("mobileSearchInput");
    var desktopSearch = document.getElementById("searchInput");
    var filtersBtn = document.getElementById("mobileFiltersBtn");
    var desktopFiltersBtn = document.getElementById("desktopFiltersBtn");
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
    if(desktopSearch){
      desktopSearch.addEventListener("input", function(){
        if(mobileSearch) mobileSearch.value = desktopSearch.value;
      });
    }
    if(filtersBtn) filtersBtn.addEventListener("click", function(){ openFilterPanel(filtersBtn); });
    if(desktopFiltersBtn) desktopFiltersBtn.addEventListener("click", function(){ openFilterPanel(desktopFiltersBtn); });
    if(closeBtn) closeBtn.addEventListener("click", closeFilterPanel);
    if(backdrop) backdrop.addEventListener("click", function(e){ if(e.target === backdrop) closeFilterPanel(); });

    var panelCat = document.getElementById("panelCategoryFilter");
    var panelStatus = document.getElementById("panelStatusFilter");
    var panelSort = document.getElementById("panelSortSelect");
    if(panelCat) panelCat.addEventListener("change", function(){ renderCatalog(); updateFilterCount(); renderActiveChips(); });
    if(panelStatus) panelStatus.addEventListener("change", function(){ renderCatalog(); updateFilterCount(); renderActiveChips(); });
    if(panelSort) panelSort.addEventListener("change", function(){ document.getElementById("sortSelect").value = panelSort.value; renderCatalog(); });

    ["filterDeploymentPath","filterSetupLevel","filterCostTier","filterRequirements","filterManaged"].forEach(function(id){
      var el = document.getElementById(id);
      if(el) el.addEventListener("change", onCheckboxGroupChange);
    });

    if(applyBtn) applyBtn.addEventListener("click", closeFilterPanel);
    if(clearBtnPanel) clearBtnPanel.addEventListener("click", function(){ clearFilters(); closeFilterPanel(); });
    if(clearLinkRow2) clearLinkRow2.addEventListener("click", clearFilters);
  }

  function initControls(){
    document.getElementById("searchInput").addEventListener("input", function(){ renderCatalog(); updateFilterCount(); });
    document.getElementById("sortSelect").addEventListener("change", function(){
      var panelSort = document.getElementById("panelSortSelect");
      if(panelSort) panelSort.value = document.getElementById("sortSelect").value;
      renderCatalog();
    });
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

  /* ── Mobile full-bleed hero: ambient marquee of competitor logos ── */
  function renderHeroMarquee(){
    var stage = document.getElementById("suiteMarqueeStage");
    if(!stage) return;
    var logoApps = SS_SUITE_APPS.filter(function(a){ return a.logoSlug; });
    if(!logoApps.length) return;

    var ROWS = 4;
    var perRow = Math.ceil(logoApps.length / ROWS);
    var speeds = [42, 55, 38, 60];
    stage.innerHTML = "";

    for(var r = 0; r < ROWS; r++){
      var rowApps = logoApps.slice(r * perRow, r * perRow + perRow);
      if(!rowApps.length) continue;
      var row = document.createElement("div");
      row.className = "suite-marquee-row" + (r % 2 === 1 ? " dir-r" : "");
      row.style.animationDuration = speeds[r % speeds.length] + "s";

      var tilesHtml = rowApps.map(function(app){
        var ext = app.logoExt || "svg";
        return '<span class="suite-marquee-tile" data-slug="' + app.slug + '"><img src="/secret-suite/assets/competitor-logos/' +
          encodeURIComponent(app.logoSlug) + '.' + ext + '" alt="" loading="lazy"/></span>';
      }).join("");
      // duplicate the row content once so the translateX(-50%) loop is seamless
      row.innerHTML = tilesHtml + tilesHtml;
      stage.appendChild(row);
    }

    function randomizeCrossouts(){
      var tiles = stage.querySelectorAll(".suite-marquee-tile");
      tiles.forEach(function(t){ t.classList.remove("is-crossed"); });
      var count = Math.round(tiles.length * 0.12);
      var used = {};
      for(var i = 0; i < count; i++){
        var idx = Math.floor(Math.random() * tiles.length);
        if(used[idx]) continue;
        used[idx] = true;
        tiles[idx].classList.add("is-crossed");
      }
    }
    randomizeCrossouts();
    if(!window.matchMedia("(prefers-reduced-motion: reduce)").matches){
      setInterval(randomizeCrossouts, 2600);
    }
  }

  document.addEventListener("DOMContentLoaded", function(){
    renderHeroMarquee();
    initFilterOptions();
    renderQuickChips();
    renderDeploySummary();
    initControls();
    initMobileControls();
    applyViewToggleButtons();
    renderCatalog();
    updateFilterCount();
    renderActiveChips();
    initCalculator();
    initReviewedDates();
    initVerifiedTotals();
  });
})();
