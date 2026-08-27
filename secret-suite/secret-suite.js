/* ============================================================
   Secret Suite — page behavior
   Reads SS_SUITE_APPS / SS_SUITE_CATEGORIES / SS_SUITE_STATUSES
   from secret-suite-data.js. Handles search, filters, sort,
   catalog rendering (editorial rows + mobile cards), and the
   category-collapsible calculator. No external APIs, no build step.
   ============================================================ */
(function(){
  "use strict";

  var STATUS_LABELS = {
    available: "Available",
    beta: "Beta",
    in_development: "In development",
    planned: "Planned"
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

  /* ── Competitor block: one container, one diagonal line, real logo or wordmark fallback ── */
  function competitorBlockHtml(app, logoSize){
    var logoHtml;
    if(app.logoSlug){
      logoHtml = '<span class="competitor-logo"><img src="/secret-suite/assets/competitor-logos/' + encodeURIComponent(app.logoSlug) + '.svg" alt="" width="' + logoSize + '" height="' + logoSize + '" loading="lazy" onerror="this.closest(\'.competitor-block\').classList.add(\'logo-failed\')"/></span>';
    } else {
      logoHtml = '';
    }
    var nameHtml = app.logoSlug
      ? '<span class="competitor-name">' + escapeHtml(app.paidAlternative) + '</span>'
      : '<span class="competitor-logo-word">' + escapeHtml(app.paidAlternative) + '</span>';
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

  function getFilteredApps(){
    var q = document.getElementById("searchInput").value.trim().toLowerCase();
    var cat = document.getElementById("categoryFilter").value;
    var status = document.getElementById("statusFilter").value;
    var sort = document.getElementById("sortSelect").value;

    var result = SS_SUITE_APPS.filter(function(app){
      if(cat && app.category !== cat) return false;
      if(status && app.status !== status) return false;
      if(q){
        var hay = (app.secretName + " " + app.description + " " + app.paidAlternative + " " + app.category).toLowerCase();
        if(hay.indexOf(q) === -1) return false;
      }
      return true;
    });

    result.sort(function(a,b){
      if(sort === "popularity") return b.popularity - a.popularity;
      if(sort === "value") return effectiveMonthlyValue(b,5) - effectiveMonthlyValue(a,5);
      if(sort === "name") return a.secretName.localeCompare(b.secretName);
      return a.rank - b.rank;
    });

    return result;
  }

  function subdomainHref(app){
    if(!isValidHttpsUrl(app.subdomain)) return "#";
    return app.subdomain;
  }

  function handleAppClick(e, app){
    if(app.status !== "available"){
      e.preventDefault();
      var msg = app.secretName + " is " + (STATUS_LABELS[app.status] || app.status).toLowerCase() + " — this subdomain isn't live yet, so we've kept this link from sending you to a broken page.";
      var el = e.currentTarget;
      var container = el.closest(".row-app") || el.closest(".suite-card");
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
    return "Planned — subdomain not yet live";
  }

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
        '<span class="row-app-top">' +
          '<a class="row-app-name" href="' + escapeHtml(href) + '"' + (live ? ' target="_blank" rel="noopener"' : '') + '>' + escapeHtml(app.secretName) + '</a>' +
        '</span>' +
        '<span class="row-app-desc">' + escapeHtml(app.description) + '</span>' +
        '<span class="row-app-meta"><span class="row-app-cat">' + escapeHtml(app.category) + '</span><span class="row-dot">·</span><span class="' + statusClass + '">' + escapeHtml(statusText(app)) + '</span></span>' +
      '</span>' +
      '<span class="row-replaces-col" role="cell" aria-hidden="true">Replaces</span>' +
      '<span class="row-competitor" role="cell">' + competitorBlockHtml(app, 24) + '</span>';

    var link = row.querySelector(".row-app-name");
    link.addEventListener("click", function(e){ handleAppClick(e, app); });

    return row;
  }

  function renderCard(app){
    var div = document.createElement("div");
    div.className = "suite-card";
    var href = subdomainHref(app);
    var live = app.status === "available";
    div.innerHTML =
      '<div class="suite-card-top">' +
        '<span class="suite-card-rank">#' + app.rank + '</span>' +
      '</div>' +
      '<div class="row-app">' +
        '<a class="suite-card-name" href="' + escapeHtml(href) + '"' + (live ? ' target="_blank" rel="noopener"' : '') + '>' + escapeHtml(app.secretName) + '</a>' +
        '<p class="suite-card-desc">' + escapeHtml(app.description) + '</p>' +
        '<div class="suite-card-meta"><span>' + escapeHtml(app.category) + '</span><span class="row-dot">·</span><span>' + escapeHtml(statusText(app)) + '</span></div>' +
      '</div>' +
      '<div class="suite-card-competitor-row">' +
        '<span class="suite-card-replaces">Replaces</span>' +
      '</div>' +
      '<div style="margin-top:.5rem;">' + competitorBlockHtml(app, 26) + '</div>';
    var link = div.querySelector(".suite-card-name");
    link.addEventListener("click", function(e){ handleAppClick(e, app); });
    return div;
  }

  function announceCount(n){
    var total = SS_SUITE_APPS.length;
    document.getElementById("resultsCount").textContent = n + " of " + total + " apps";
  }

  function renderCatalog(){
    var apps = getFilteredApps();
    var rowsWrap = document.getElementById("catalogRows");
    var cardsWrap = document.getElementById("catalogCards");
    var empty = document.getElementById("emptyState");
    var list = document.getElementById("catalogList");

    rowsWrap.innerHTML = "";
    cardsWrap.innerHTML = "";

    if(apps.length === 0){
      empty.style.display = "block";
      list.style.display = "none";
      cardsWrap.style.display = "none";
    } else {
      empty.style.display = "none";
      list.style.display = "";
      cardsWrap.style.display = "";
      var rowFrag = document.createDocumentFragment();
      var cardFrag = document.createDocumentFragment();
      apps.forEach(function(app){
        rowFrag.appendChild(renderRow(app));
        cardFrag.appendChild(renderCard(app));
      });
      rowsWrap.appendChild(rowFrag);
      cardsWrap.appendChild(cardFrag);
    }
    announceCount(apps.length);
  }

  function clearFilters(){
    document.getElementById("searchInput").value = "";
    document.getElementById("categoryFilter").value = "";
    document.getElementById("statusFilter").value = "";
    document.getElementById("sortSelect").value = "rank";
    renderCatalog();
  }

  function initFilterOptions(){
    var catSel = document.getElementById("categoryFilter");
    SS_SUITE_CATEGORIES.forEach(function(cat){
      var opt = document.createElement("option");
      opt.value = cat; opt.textContent = cat;
      catSel.appendChild(opt);
    });
    var statSel = document.getElementById("statusFilter");
    SS_SUITE_STATUSES.forEach(function(st){
      var opt = document.createElement("option");
      opt.value = st; opt.textContent = STATUS_LABELS[st] || st;
      statSel.appendChild(opt);
    });
  }

  function initControls(){
    document.getElementById("searchInput").addEventListener("input", renderCatalog);
    document.getElementById("categoryFilter").addEventListener("change", renderCatalog);
    document.getElementById("statusFilter").addEventListener("change", renderCatalog);
    document.getElementById("sortSelect").addEventListener("change", renderCatalog);
    document.getElementById("clearFilters").addEventListener("click", clearFilters);
  }

  /* ── Calculator: category-collapsible, progressive disclosure ── */
  var CALC_STORAGE_KEY = "ss_secret_suite_calc_v2";

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
    SS_SUITE_CATEGORIES.forEach(function(cat){ byCategory[cat] = []; });
    SS_SUITE_APPS.forEach(function(app){ byCategory[app.category].push(app); });

    var catFrag = document.createDocumentFragment();
    var categoryCheckboxes = {};
    var appCheckboxes = {};

    SS_SUITE_CATEGORIES.forEach(function(cat, catIndex){
      var apps = byCategory[cat];
      if(!apps.length) return;

      var catEl = document.createElement("div");
      catEl.className = "calc-category";

      var headerId = "calc-cat-header-" + catIndex;
      var bodyId = "calc-cat-body-" + catIndex;

      var header = document.createElement("div");
      header.className = "calc-cat-header-row";
      header.style.cssText = "display:flex;align-items:center;";

      var catCb = document.createElement("input");
      catCb.type = "checkbox";
      catCb.className = "calc-cat-checkbox";
      catCb.id = headerId + "-cb";
      catCb.setAttribute("aria-label", "Select all " + cat + " apps");

      var toggleBtn = document.createElement("button");
      toggleBtn.type = "button";
      toggleBtn.className = "calc-cat-header";
      toggleBtn.id = headerId;
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.setAttribute("aria-controls", bodyId);
      toggleBtn.innerHTML =
        '<span class="calc-cat-header-left"><span class="calc-cat-name">' + escapeHtml(cat) + '</span><span class="calc-cat-count">' + apps.length + ' app' + (apps.length===1?'':'s') + '</span></span>' +
        '<span class="calc-cat-caret" aria-hidden="true">▾</span>';

      var headerRow = document.createElement("div");
      headerRow.style.cssText = "display:flex;align-items:center;gap:.7rem;";
      headerRow.appendChild(catCb);
      headerRow.appendChild(toggleBtn);
      catEl.appendChild(headerRow);

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

      catEl.appendChild(body);
      catFrag.appendChild(catEl);
      categoryCheckboxes[cat] = catCb;

      toggleBtn.addEventListener("click", function(){
        var isOpen = catEl.classList.toggle("open");
        toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
      });

      catCb.addEventListener("change", function(){
        apps.forEach(function(app){
          selected[app.slug] = catCb.checked;
          if(appCheckboxes[app.slug]) appCheckboxes[app.slug].checked = catCb.checked;
        });
        computeAndRender();
      });
    });

    catsWrap.appendChild(catFrag);

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

      SS_SUITE_CATEGORIES.forEach(syncCategoryCheckbox);
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
    renderCatalog();
    initCalculator();
    initReviewedDates();
    initVerifiedTotals();
  });
})();
