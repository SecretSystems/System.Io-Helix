/* ============================================================
   Secret Systems — Website Questionnaire app
   Vanilla JS, no framework/build step (matches the rest of the
   site). State lives in a single `state` object; rendering is a
   set of small render functions keyed by field type. Autosave
   writes to localStorage immediately (so nothing is ever lost
   even offline) and debounces a Supabase draft upsert on top.
   ============================================================ */
(function(){
  "use strict";

  var SCHEMA = window.SS_QUESTIONNAIRE_SCHEMA;
  var VERSION = window.SS_QUESTIONNAIRE_VERSION;
  var backend = window.SSQuestionnaireBackend;
  var ssReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  var LS_KEY = "ss_questionnaire_v1";
  var LS_DRAFT_ID_KEY = "ss_questionnaire_draft_id";

  /* ── State ── */
  var state = {
    started: false,
    submitted: false,
    sectionIndex: 0,
    answers: {},         // { [questionId]: value }
    files: {},           // { [questionId]: [{name,size,type,path,fileId,status,progress,localPreview}] }
    sectionStatus: {},   // { [sectionId]: "not_started" | "in_progress" | "complete" }
                          // Explicit only for optional sections (set when the client
                          // confirms them). Required sections are always derived live
                          // from their star-question answers -- see sectionStatusFor().
    draftId: null,        // submission row id (also the storage path segment)
    remoteStatus: "idle"  // idle | saving | saved | offline | error
  };

  var els = {};
  var saveTimer = null;
  var remoteSaveTimer = null;

  /* ============================================================
     Persistence
     ============================================================ */
  function getOrCreateDraftId(){
    var id = null;
    try { id = localStorage.getItem(LS_DRAFT_ID_KEY); } catch(e){}
    if (!id){
      id = (crypto && crypto.randomUUID) ? crypto.randomUUID() : ("qn-" + Date.now() + "-" + Math.random().toString(16).slice(2));
      try { localStorage.setItem(LS_DRAFT_ID_KEY, id); } catch(e){}
    }
    return id;
  }

  function loadLocal(){
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch(e){ return null; }
  }

  function saveLocalImmediate(){
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        sectionIndex: state.sectionIndex,
        answers: state.answers,
        files: state.files,
        sectionStatus: state.sectionStatus,
        savedAt: Date.now(),
        version: VERSION
      }));
    } catch(e){ /* storage full/unavailable -- fail silently, in-memory state still holds */ }
  }

  function scheduleSave(){
    showSaveIndicator("saving");
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function(){
      saveLocalImmediate();
      showSaveIndicator("saved");
    }, 500);

    if (backend.isConfigured()){
      if (remoteSaveTimer) clearTimeout(remoteSaveTimer);
      remoteSaveTimer = setTimeout(function(){
        backend.upsertDraft(state.draftId, buildDraftFields()).then(function(res){
          state.remoteStatus = res.ok ? "saved" : "offline";
        });
      }, 1500);
    }
  }

  function buildDraftFields(){
    return {
      businessName: state.answers.businessName || null,
      contactName: state.answers.contactName || null,
      email: state.answers.email || null,
      phone: state.answers.phone || null,
      answers: buildStructuredPayload(),
      currentSection: SCHEMA[state.sectionIndex] ? SCHEMA[state.sectionIndex].id : null,
      completionPercentage: overallPercent()
    };
  }

  var saveIndicatorTimer = null;
  function showSaveIndicator(mode){
    if (!els.saveIndicator) return;
    els.saveIndicator.classList.add("is-visible");
    els.saveIndicator.classList.toggle("is-saving", mode === "saving");
    els.saveIndicator.querySelector(".qn-save-text").textContent = mode === "saving" ? "Saving…" : "Saved";
    if (saveIndicatorTimer) clearTimeout(saveIndicatorTimer);
    if (mode === "saved"){
      saveIndicatorTimer = setTimeout(function(){
        els.saveIndicator.classList.remove("is-visible");
      }, 2200);
    }
  }

  /* ============================================================
     Conditional logic
     ============================================================ */
  function conditionMet(cond){
    if (!cond) return true;
    var val = state.answers[cond.field];
    if (cond.equals !== undefined) return val === cond.equals;
    if (cond.in) return cond.in.indexOf(val) !== -1;
    if (cond.includes) return Array.isArray(val) && val.indexOf(cond.includes) !== -1;
    return true;
  }

  /* ============================================================
     Field renderers -- each returns a DOM node for the input area
     (label/helper wrapper is added by renderQuestion)
     ============================================================ */
  function onAnswerChange(id, value){
    state.answers[id] = value;
    scheduleSave();
  }

  function renderText(q, type){
    var input = document.createElement("input");
    input.type = type || "text";
    input.className = "qn-input";
    input.id = "q_" + q.id;
    input.value = state.answers[q.id] || "";
    if (q.placeholder) input.placeholder = q.placeholder;
    if (type === "tel") input.autocomplete = "tel";
    if (type === "email") input.autocomplete = "email";
    if (type === "url") input.autocomplete = "url";
    input.addEventListener("input", function(){
      input.classList.toggle("is-filled", !!input.value);
      onAnswerChange(q.id, input.value);
      refreshConditionalVisibility();
    });
    if (input.value) input.classList.add("is-filled");
    return input;
  }

  function renderTextarea(q){
    var wrap = document.createElement("div");
    var ta = document.createElement("textarea");
    ta.className = "qn-textarea";
    ta.id = "q_" + q.id;
    ta.value = state.answers[q.id] || "";
    ta.rows = 4;
    ta.addEventListener("input", function(){
      autoGrow(ta);
      onAnswerChange(q.id, ta.value);
    });
    wrap.appendChild(ta);
    setTimeout(function(){ autoGrow(ta); }, 0);
    return wrap;
  }
  function autoGrow(ta){
    ta.style.height = "auto";
    ta.style.height = Math.max(110, ta.scrollHeight) + "px";
  }

  function renderRadioCards(q){
    var wrap = document.createElement("div");
    wrap.className = "qn-card-group" + (q.options.length <= 2 ? " qn-yesno" : "");
    q.options.forEach(function(opt){
      var card = document.createElement("button");
      card.type = "button";
      card.className = "qn-card";
      card.textContent = opt.label;
      card.setAttribute("aria-pressed", String(state.answers[q.id] === opt.value));
      if (state.answers[q.id] === opt.value) card.classList.add("is-selected");
      card.addEventListener("click", function(){
        state.answers[q.id] = opt.value;
        wrap.querySelectorAll(".qn-card").forEach(function(c){ c.classList.remove("is-selected"); c.setAttribute("aria-pressed","false"); });
        card.classList.add("is-selected");
        card.setAttribute("aria-pressed", "true");
        scheduleSave();
        refreshConditionalVisibility();
      });
      wrap.appendChild(card);
    });
    return wrap;
  }

  function renderSelectCards(q){
    var wrap = document.createElement("div");
    wrap.className = "qn-select-cards";
    q.options.forEach(function(opt){
      var card = document.createElement("button");
      card.type = "button";
      card.className = "qn-select-card";
      card.textContent = opt.label;
      card.setAttribute("aria-pressed", String(state.answers[q.id] === opt.value));
      if (state.answers[q.id] === opt.value) card.classList.add("is-selected");
      card.addEventListener("click", function(){
        state.answers[q.id] = opt.value;
        wrap.querySelectorAll(".qn-select-card").forEach(function(c){ c.classList.remove("is-selected"); c.setAttribute("aria-pressed","false"); });
        card.classList.add("is-selected");
        card.setAttribute("aria-pressed", "true");
        scheduleSave();
        refreshConditionalVisibility();
      });
      wrap.appendChild(card);
    });
    return wrap;
  }

  function renderChips(q){
    var wrap = document.createElement("div");
    wrap.className = "qn-chips";
    var selected = Array.isArray(state.answers[q.id]) ? state.answers[q.id].slice() : [];
    q.options.forEach(function(opt){
      var chip = document.createElement("button");
      chip.type = "button";
      chip.className = "qn-chip";
      chip.textContent = opt.label;
      var isSel = selected.indexOf(opt.value) !== -1;
      chip.setAttribute("aria-pressed", String(isSel));
      if (isSel) chip.classList.add("is-selected");
      chip.addEventListener("click", function(){
        var idx = selected.indexOf(opt.value);
        if (idx === -1){ selected.push(opt.value); chip.classList.add("is-selected"); chip.setAttribute("aria-pressed","true"); }
        else { selected.splice(idx, 1); chip.classList.remove("is-selected"); chip.setAttribute("aria-pressed","false"); }
        state.answers[q.id] = selected.slice();
        scheduleSave();
      });
      wrap.appendChild(chip);
    });
    return wrap;
  }

  function renderCheckboxes(q){
    var wrap = document.createElement("div");
    wrap.className = "qn-checkbox-list";
    var selected = Array.isArray(state.answers[q.id]) ? state.answers[q.id].slice() : [];
    q.options.forEach(function(opt){
      var row = document.createElement("div");
      row.className = "qn-checkbox-row";
      row.setAttribute("role", "checkbox");
      row.tabIndex = 0;
      var isSel = selected.indexOf(opt.value) !== -1;
      row.setAttribute("aria-checked", String(isSel));
      if (isSel) row.classList.add("is-checked");
      row.innerHTML = '<span class="qn-checkbox-box"><svg viewBox="0 0 24 24"><path d="M4 12l6 6L20 6"/></svg></span><span class="qn-checkbox-label"></span>';
      row.querySelector(".qn-checkbox-label").textContent = opt.label;
      function toggle(){
        var idx = selected.indexOf(opt.value);
        if (idx === -1){ selected.push(opt.value); row.classList.add("is-checked"); row.setAttribute("aria-checked","true"); }
        else { selected.splice(idx, 1); row.classList.remove("is-checked"); row.setAttribute("aria-checked","false"); }
        state.answers[q.id] = selected.slice();
        scheduleSave();
        refreshConditionalVisibility();
      }
      row.addEventListener("click", toggle);
      row.addEventListener("keydown", function(e){ if (e.key === " " || e.key === "Enter"){ e.preventDefault(); toggle(); } });
      wrap.appendChild(row);
    });
    return wrap;
  }

  function renderAddress(q){
    var wrap = document.createElement("div");
    wrap.className = "qn-address-grid";
    var val = state.answers[q.id] || {};
    var fields = [
      { key: "street", ph: "Street address", full: true },
      { key: "city", ph: "City" },
      { key: "state", ph: "State" },
      { key: "zip", ph: "ZIP code" }
    ];
    fields.forEach(function(f){
      var input = document.createElement("input");
      input.type = "text";
      input.className = "qn-input" + (f.full ? " qn-field-full" : "");
      input.placeholder = f.ph;
      input.value = val[f.key] || "";
      input.addEventListener("input", function(){
        val[f.key] = input.value;
        state.answers[q.id] = val;
        scheduleSave();
      });
      wrap.appendChild(input);
    });
    return wrap;
  }

  function renderRepeater(q){
    var wrap = document.createElement("div");
    var items = Array.isArray(state.answers[q.id]) ? state.answers[q.id] : [];
    if (items.length === 0) items = [makeEmptyRepeaterItem(q)];

    function renderItems(){
      wrap.querySelectorAll(".qn-repeater-item").forEach(function(n){ n.remove(); });
      var addBtn = wrap.querySelector(".qn-repeater-add");
      items.forEach(function(item, idx){
        var row = document.createElement("div");
        row.className = "qn-repeater-item";
        var fieldsWrap = document.createElement("div");
        fieldsWrap.className = "qn-repeater-item-fields";
        q.subfields.forEach(function(sf){
          var input = document.createElement("input");
          input.type = sf.type === "url" ? "url" : "text";
          input.className = "qn-input";
          input.placeholder = sf.placeholder || "";
          input.value = item[sf.id] || "";
          input.addEventListener("input", function(){
            item[sf.id] = input.value;
            state.answers[q.id] = items;
            scheduleSave();
          });
          fieldsWrap.appendChild(input);
        });
        row.appendChild(fieldsWrap);
        if (items.length > 1){
          var rm = document.createElement("button");
          rm.type = "button";
          rm.className = "qn-repeater-remove";
          rm.setAttribute("aria-label", "Remove " + (q.itemLabel || "item"));
          rm.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>';
          rm.addEventListener("click", function(){
            items.splice(idx, 1);
            state.answers[q.id] = items;
            scheduleSave();
            renderItems();
          });
          row.appendChild(rm);
        }
        wrap.insertBefore(row, addBtn);
      });
    }

    var addBtn = document.createElement("button");
    addBtn.type = "button";
    addBtn.className = "qn-repeater-add";
    addBtn.textContent = q.addLabel || "+ Add another";
    addBtn.addEventListener("click", function(){
      items.push(makeEmptyRepeaterItem(q));
      state.answers[q.id] = items;
      scheduleSave();
      renderItems();
    });
    wrap.appendChild(addBtn);
    renderItems();
    return wrap;
  }
  function makeEmptyRepeaterItem(q){
    var obj = {};
    q.subfields.forEach(function(sf){ obj[sf.id] = ""; });
    return obj;
  }

  /* ── File upload ── */
  function humanFileSize(bytes){
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024*1024) return (bytes/1024).toFixed(1) + " KB";
    return (bytes/(1024*1024)).toFixed(1) + " MB";
  }

  function renderFileUpload(q){
    var wrap = document.createElement("div");
    if (!state.files[q.id]) state.files[q.id] = [];

    var uploader = document.createElement("div");
    uploader.className = "qn-uploader";
    uploader.tabIndex = 0;
    uploader.setAttribute("role", "button");
    uploader.innerHTML =
      '<div class="qn-uploader-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"/></svg></div>' +
      '<div class="qn-uploader-text">Drop files here or <strong style="color:var(--cyan);">choose files</strong></div>' +
      '<div class="qn-uploader-sub">' + (q.accept ? q.accept.replace(/\./g, "").toUpperCase() : "") + '</div>' +
      '<input type="file" ' + (q.multiple !== false ? "multiple" : "") + (q.accept ? ' accept="' + q.accept + '"' : '') + '>';
    var fileInput = uploader.querySelector('input[type=file]');
    var fileList = document.createElement("div");
    fileList.className = "qn-file-list";

    function handleFiles(fileArr){
      Array.prototype.slice.call(fileArr).forEach(function(file){
        var isDup = (state.files[q.id] || []).some(function(f){
          return f.name === file.name && f.size === file.size && f.status !== "error";
        });
        if (isDup) return;
        addFile(q, file, fileList);
      });
    }
    fileInput.addEventListener("change", function(){ handleFiles(fileInput.files); fileInput.value = ""; });
    uploader.addEventListener("click", function(e){ if (e.target !== fileInput) fileInput.click(); });
    uploader.addEventListener("keydown", function(e){ if (e.key === "Enter" || e.key === " "){ e.preventDefault(); fileInput.click(); } });
    ["dragenter","dragover"].forEach(function(evt){
      uploader.addEventListener(evt, function(e){ e.preventDefault(); uploader.classList.add("is-dragover"); });
    });
    ["dragleave","drop"].forEach(function(evt){
      uploader.addEventListener(evt, function(e){ e.preventDefault(); uploader.classList.remove("is-dragover"); });
    });
    uploader.addEventListener("drop", function(e){
      if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    });

    wrap.appendChild(uploader);
    wrap.appendChild(fileList);

    if (!backend.isConfigured()){
      var note = document.createElement("p");
      note.className = "qn-uploader-disabled-note";
      note.textContent = "File storage isn't connected yet — your file will be listed here and remembered, but won't finish uploading until Secret Systems finishes connecting storage. Everything else in the questionnaire works normally.";
      wrap.appendChild(note);
    }

    renderFileList(q, fileList);
    return wrap;
  }

  function addFile(q, file, fileListEl){
    var entry = { name: file.name, size: file.size, type: file.type, status: "pending", progress: 0, path: null, fileId: null };
    state.files[q.id].push(entry);
    renderFileList(q, fileListEl);
    scheduleSave();

    if (!backend.isConfigured()){
      entry.status = "waiting_for_storage";
      renderFileList(q, fileListEl);
      return;
    }
    ensureDraftRowExists().then(function(){
      uploadWithRetry(q, entry, file, fileListEl, 0);
    });
  }

  /* A file's metadata row has a foreign key to the submission row, so
     opening a section straight from a dashboard card and uploading a
     file as the very first action (before any question autosave has
     had a chance to create that row) would otherwise 409 on insert.
     scheduleSave() alone isn't enough here because it debounces the
     remote write; this awaits one immediately, once, before upload. */
  var draftRowEnsured = false;
  function ensureDraftRowExists(){
    if (draftRowEnsured) return Promise.resolve();
    return backend.upsertDraft(state.draftId, buildDraftFields()).then(function(){
      draftRowEnsured = true;
    });
  }

  function uploadWithRetry(q, entry, file, fileListEl, attempt){
    entry.status = "uploading";
    renderFileList(q, fileListEl);
    backend.uploadFile(state.draftId, fileCategory(q), file).then(function(res){
      if (res.ok){
        entry.status = "done";
        entry.path = res.path;
        entry.fileId = res.fileId;
        renderFileList(q, fileListEl);
        scheduleSave();
      } else if (res.reason === "too_large"){
        entry.status = "error";
        entry.errorMessage = "File is larger than " + humanFileSize(res.maxSize) + " — the maximum allowed.";
        renderFileList(q, fileListEl);
      } else if (attempt < 2){
        setTimeout(function(){ uploadWithRetry(q, entry, file, fileListEl, attempt + 1); }, 1200 * (attempt + 1));
      } else {
        entry.status = "error";
        entry.errorMessage = "Upload failed after retrying — try again.";
        renderFileList(q, fileListEl);
        scheduleSave();
      }
    });
  }

  var CATEGORY_MAP = {
    logo: "logos", "brand-materials": "branding", general: "photos",
    projects: "projects", "before-after": "photos", team: "team",
    logos: "logos", documents: "documents", videos: "videos"
  };
  function fileCategory(q){
    var folder = q.bucketFolder || q.id;
    return CATEGORY_MAP[folder] || "other";
  }

  function renderFileList(q, fileListEl){
    fileListEl.innerHTML = "";
    (state.files[q.id] || []).forEach(function(entry, idx){
      var row = document.createElement("div");
      row.className = "qn-file-row";
      var thumb = document.createElement("div");
      thumb.className = "qn-file-thumb";
      thumb.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 5h16v14H4zM4 15l4-4 4 4 4-6 4 6"/></svg>';
      var info = document.createElement("div");
      info.className = "qn-file-info";
      var statusText = entry.status === "done" ? humanFileSize(entry.size)
        : entry.status === "uploading" ? "Uploading…"
        : entry.status === "error" ? (entry.errorMessage || "Upload failed — try again")
        : entry.status === "waiting_for_storage" ? "Saved — will upload once storage is connected"
        : humanFileSize(entry.size);
      info.innerHTML = '<div class="qn-file-name"></div><div class="qn-file-meta' + (entry.status === "error" ? " is-error" : "") + '"></div>';
      info.querySelector(".qn-file-name").textContent = entry.name;
      info.querySelector(".qn-file-meta").textContent = statusText;
      var rm = document.createElement("button");
      rm.type = "button";
      rm.className = "qn-file-remove";
      rm.setAttribute("aria-label", "Remove file");
      rm.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18"/></svg>';
      rm.addEventListener("click", function(){
        var removed = state.files[q.id].splice(idx, 1)[0];
        if (removed && removed.path && removed.fileId) backend.removeFile(removed.fileId, removed.path);
        renderFileList(q, fileListEl);
        scheduleSave();
      });
      row.appendChild(thumb); row.appendChild(info); row.appendChild(rm);
      fileListEl.appendChild(row);
    });
  }

  /* ============================================================
     Question + section rendering
     ============================================================ */
  function renderQuestion(q){
    if (q.type === "heading"){
      var hb = document.createElement("div");
      hb.className = "qn-heading-block";
      hb.dataset.qid = q.id;
      var hl = document.createElement("div");
      hl.className = "qn-q-label";
      hl.textContent = q.label;
      hb.appendChild(hl);
      if (q.helper){
        var hh = document.createElement("p");
        hh.className = "qn-q-helper";
        hh.textContent = q.helper;
        hb.appendChild(hh);
      }
      return hb;
    }

    var block = document.createElement("div");
    block.className = "qn-question";
    block.dataset.qid = q.id;

    var label = document.createElement("label");
    label.className = "qn-q-label";
    label.setAttribute("for", "q_" + q.id);
    label.textContent = q.label;
    if (q.star){
      var star = document.createElement("span");
      star.className = "qn-star";
      star.textContent = "★";
      star.setAttribute("aria-label", "Most important question");
      label.appendChild(star);
    }
    block.appendChild(label);

    if (q.helper){
      var helper = document.createElement("p");
      helper.className = "qn-q-helper";
      helper.textContent = q.helper;
      block.appendChild(helper);
    }

    var field;
    switch (q.type){
      case "text": field = renderText(q, "text"); break;
      case "phone": field = renderText(q, "tel"); break;
      case "email": field = renderText(q, "email"); break;
      case "url": field = renderText(q, "url"); break;
      case "textarea": field = renderTextarea(q); break;
      case "radio-cards": field = renderRadioCards(q); break;
      case "select-cards": field = renderSelectCards(q); break;
      case "chips": field = renderChips(q); break;
      case "checkboxes": field = renderCheckboxes(q); break;
      case "address": field = renderAddress(q); break;
      case "repeater": field = renderRepeater(q); break;
      case "fileupload": field = renderFileUpload(q); break;
      default: field = renderText(q, "text");
    }
    if (!label.hasAttribute("for") || q.type === "radio-cards" || q.type === "select-cards" || q.type === "chips" || q.type === "checkboxes" || q.type === "address" || q.type === "repeater" || q.type === "fileupload"){
      label.removeAttribute("for");
    }
    block.appendChild(field);

    if (q.condition){
      block.classList.add("qn-conditional");
      block.dataset.condField = q.condition.field;
    }

    return block;
  }

  /* ============================================================
     Scroll + focus management
     The page itself (documentElement/body) is the scrolling
     element here — there is no inner overflow container — so we
     reset window scroll on every section change. html has global
     `scroll-behavior:smooth` (ss-shared.css) which would make a
     plain scrollTo(0,0) animate and feel delayed on navigation, so
     navigation resets go through the native element property
     instead, which ignores CSS smooth-scroll.
     ============================================================ */
  function resetScrollToTop(){
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  function focusHeading(el){
    if (!el) return;
    resetScrollToTop();
    el.focus({ preventScroll: true });
  }

  function refreshConditionalVisibility(){
    if (!els.sectionBody) return;
    els.sectionBody.querySelectorAll(".qn-conditional").forEach(function(node){
      var qid = node.dataset.qid;
      var section = SCHEMA[state.sectionIndex];
      var q = section.questions.filter(function(x){ return x.id === qid; })[0];
      if (!q) return;
      var show = conditionMet(q.condition);
      node.classList.toggle("is-open", show);
    });
  }

  function renderSection(){
    var section = SCHEMA[state.sectionIndex];
    els.sectionEyebrow.textContent = "Section " + (state.sectionIndex + 1) + " of " + SCHEMA.length;
    els.sectionTitle.textContent = section.title;

    els.sectionBody.innerHTML = "";

    if (section.securityNotice){
      var notice = document.createElement("div");
      notice.className = "qn-security-notice";
      notice.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" style="flex-shrink:0;"><rect x="5" y="10" width="14" height="10" rx="1.5"/><path d="M8 10V7a4 4 0 018 0v3"/></svg><span></span>';
      notice.querySelector("span").textContent = section.securityNotice;
      els.sectionBody.appendChild(notice);
    }
    if (section.intro){
      var introBox = document.createElement("div");
      introBox.className = "qn-section-intro";
      introBox.innerHTML = '<div class="qn-section-intro-headline"></div><div class="qn-section-intro-body"></div>';
      introBox.querySelector(".qn-section-intro-headline").textContent = section.intro.headline;
      introBox.querySelector(".qn-section-intro-body").textContent = section.intro.body;
      els.sectionBody.appendChild(introBox);
    }

    section.questions.forEach(function(q){
      els.sectionBody.appendChild(renderQuestion(q));
    });

    els.sectionValidation.hidden = true;

    refreshConditionalVisibility();
    updateRail();
    updateProgress();
    updateControls();
    focusHeading(els.sectionTitle);
  }

  /* ── Required-question validation (blocks Continue on required sections) ── */
  function validateCurrentSection(){
    var sIdx = state.sectionIndex;
    if (!isSectionRequired(sIdx)) return { ok: true };
    var missing = missingRequiredQuestions(sIdx);
    els.sectionBody.querySelectorAll(".qn-question.has-error").forEach(function(n){ n.classList.remove("has-error"); });
    if (missing.length === 0){
      els.sectionValidation.hidden = true;
      return { ok: true };
    }
    missing.forEach(function(q){
      var block = els.sectionBody.querySelector('.qn-question[data-qid="' + q.id + '"]');
      if (block) block.classList.add("has-error");
    });
    els.sectionValidation.hidden = false;
    els.sectionValidation.textContent = missing.length === 1
      ? "Please answer “" + missing[0].label + "” before continuing."
      : "Please answer the " + missing.length + " highlighted required questions before continuing.";
    var firstBlock = els.sectionBody.querySelector('.qn-question[data-qid="' + missing[0].id + '"]');
    if (firstBlock) firstBlock.scrollIntoView({ block: "center", behavior: ssReduce ? "auto" : "smooth" });
    return { ok: false };
  }

  function transitionToSection(newIndex){
    showScreen("questionnaire");
    if (ssReduce){
      state.sectionIndex = newIndex;
      renderSection();
      saveLocalImmediate();
      return;
    }
    els.sectionBody.classList.add("is-transitioning");
    setTimeout(function(){
      state.sectionIndex = newIndex;
      renderSection();
      els.sectionBody.classList.remove("is-transitioning");
      saveLocalImmediate();
    }, 180);
  }

  /* ============================================================
     Progress / rail
     ============================================================ */
  function isAnswered(id){
    var v = state.answers[id];
    if (Array.isArray(v)) return v.length > 0;
    if (v && typeof v === "object") return Object.keys(v).some(function(k){ return !!v[k]; });
    return !!v;
  }
  function isAnySectionAnswered(sIdx){
    return SCHEMA[sIdx].questions.some(function(q){ return isAnswered(q.id); });
  }
  function overallPercent(){
    var total = 0, done = 0;
    SCHEMA.forEach(function(section){
      section.questions.filter(function(q){ return q.type !== "heading"; }).forEach(function(q){
        total++;
        if (isAnswered(q.id)) done++;
      });
    });
    return total ? Math.round((done/total)*100) : 0;
  }

  /* ============================================================
     Dashboard card status
     Required sections: status is always derived live from the
     star-question answers (never stored as an explicit flag), so a
     required card can never say "Complete" while a required answer
     is actually missing.
     Optional sections: "complete" only exists once the client
     explicitly confirms the section (Continue at its bottom), and
     that confirmation is what's persisted in state.sectionStatus.
     Editing an already-confirmed optional section keeps it complete.
     ============================================================ */
  function requiredQuestionsFor(sIdx){
    return SCHEMA[sIdx].questions.filter(function(q){ return q.star && q.type !== "heading"; });
  }
  function missingRequiredQuestions(sIdx){
    return requiredQuestionsFor(sIdx).filter(function(q){ return !isAnswered(q.id); });
  }
  function isSectionRequired(sIdx){
    return !!SCHEMA[sIdx].required;
  }
  function sectionStatusFor(sIdx){
    var section = SCHEMA[sIdx];
    if (isSectionRequired(sIdx)){
      var required = requiredQuestionsFor(sIdx);
      if (required.length === 0) return isAnySectionAnswered(sIdx) ? "complete" : "not_started";
      var missing = missingRequiredQuestions(sIdx);
      if (missing.length === 0) return "complete";
      return missing.length < required.length || isAnySectionAnswered(sIdx) ? "in_progress" : "not_started";
    }
    var stored = state.sectionStatus[section.id];
    if (stored === "complete") return "complete";
    return isAnySectionAnswered(sIdx) ? "in_progress" : "not_started";
  }
  function allRequiredComplete(){
    return SCHEMA.every(function(section, idx){
      return !isSectionRequired(idx) || sectionStatusFor(idx) === "complete";
    });
  }
  function completedSectionCount(){
    return SCHEMA.filter(function(section, idx){ return sectionStatusFor(idx) === "complete"; }).length;
  }
  function confirmOptionalSectionComplete(sIdx){
    var section = SCHEMA[sIdx];
    if (isSectionRequired(sIdx)) return;
    state.sectionStatus[section.id] = "complete";
  }

  function updateRail(){
    if (!els.rail) return;
    els.rail.querySelectorAll(".qn-rail-item").forEach(function(item, idx){
      item.classList.toggle("is-active", idx === state.sectionIndex);
      item.classList.toggle("is-complete", sectionStatusFor(idx) === "complete" && idx !== state.sectionIndex);
    });
    els.railPct.textContent = Math.round((completedSectionCount() / SCHEMA.length) * 100) + "%";
  }

  function updateProgress(){
    var pct = Math.round(((state.sectionIndex) / SCHEMA.length) * 100);
    els.progressFill.style.width = pct + "%";
    if (els.mobileProgressFill) els.mobileProgressFill.style.width = pct + "%";
    els.mobileSectionLabel.textContent = "Section " + (state.sectionIndex + 1) + " of " + SCHEMA.length;
    els.mobilePct.textContent = overallPercent() + "% complete";
  }

  function updateControls(){
    var isFirst = state.sectionIndex === 0;
    els.btnPrev.hidden = isFirst;
    els.controls.classList.toggle("qn-controls-first", isFirst);
    var isLast = state.sectionIndex === SCHEMA.length - 1;
    els.btnNext.textContent = isLast ? "Review Answers →" : "Continue →";
  }

  /* ============================================================
     Rail build (once)
     ============================================================ */
  function buildRail(){
    els.rail.querySelector(".qn-rail-list").innerHTML = "";
    SCHEMA.forEach(function(section, idx){
      var item = document.createElement("button");
      item.type = "button";
      item.className = "qn-rail-item";
      item.innerHTML = '<span class="qn-rail-dot"></span><span></span>';
      item.querySelector("span:last-child").textContent = section.short;
      item.addEventListener("click", function(){ transitionToSection(idx); });
      els.rail.querySelector(".qn-rail-list").appendChild(item);
    });
  }

  /* ============================================================
     Dashboard (nine-card home screen)
     ============================================================ */
  function cardActionLabel(idx, status){
    if (status === "complete") return "Edit";
    if (status === "in_progress") return "Continue →";
    return idx === 0 ? "Start Here →" : "Start Section →";
  }
  function cardStatusLabel(status){
    if (status === "complete") return "Complete";
    if (status === "in_progress") return "In progress";
    return "Not started";
  }

  function renderDashboard(){
    var grid = els.cardsGrid;
    grid.innerHTML = "";
    SCHEMA.forEach(function(section, idx){
      var status = sectionStatusFor(idx);
      var card = document.createElement("div");
      card.className = "qn-dcard" + (status === "complete" ? " is-complete" : status === "in_progress" ? " is-in-progress" : "");
      card.setAttribute("role", "listitem");

      var top = document.createElement("div");
      top.className = "qn-dcard-top";
      var num = document.createElement("span");
      num.className = "qn-dcard-number";
      num.textContent = "0" + (idx + 1);
      top.appendChild(num);
      if (status === "complete"){
        var check = document.createElement("span");
        check.className = "qn-dcard-check";
        check.innerHTML = '<svg viewBox="0 0 24 24"><path d="M4 12l6 6L20 6"/></svg>';
        top.appendChild(check);
      } else {
        var tag = document.createElement("span");
        tag.className = "qn-dcard-tag" + (section.required ? " is-required" : "");
        tag.textContent = section.required ? "Required" : "Optional";
        top.appendChild(tag);
      }
      card.appendChild(top);

      var title = document.createElement("div");
      title.className = "qn-dcard-title";
      title.textContent = section.title;
      card.appendChild(title);

      var desc = document.createElement("p");
      desc.className = "qn-dcard-desc";
      desc.textContent = section.cardDescription || "";
      card.appendChild(desc);

      var statusRow = document.createElement("div");
      statusRow.className = "qn-dcard-status-row";
      statusRow.innerHTML = '<span class="qn-dcard-status-dot"></span><span class="qn-dcard-status-text"></span>';
      statusRow.querySelector(".qn-dcard-status-text").textContent = cardStatusLabel(status);
      card.appendChild(statusRow);

      var actions = document.createElement("div");
      actions.className = "qn-dcard-actions";
      var actionBtn = document.createElement("button");
      actionBtn.type = "button";
      actionBtn.className = "qn-dcard-action" + (status === "complete" ? " is-edit" : "");
      actionBtn.textContent = cardActionLabel(idx, status);
      actionBtn.addEventListener("click", function(){ openSectionFromDashboard(idx); });
      actions.appendChild(actionBtn);
      card.appendChild(actions);

      grid.appendChild(card);
    });

    updateDashboardProgress();
    renderCardDots();
  }

  function updateDashboardProgress(){
    var done = completedSectionCount();
    els.dashProgressFill.style.width = Math.round((done / SCHEMA.length) * 100) + "%";
    els.dashProgressLabel.textContent = done + " of " + SCHEMA.length + " sections complete";
  }

  function renderCardDots(){
    if (!els.cardsDots) return;
    els.cardsDots.innerHTML = "";
    if (window.innerWidth > 640) return;
    SCHEMA.forEach(function(section, idx){
      var dot = document.createElement("span");
      dot.className = "qn-cards-dot" + (idx === 0 ? " is-active" : "");
      els.cardsDots.appendChild(dot);
    });
    var count = document.createElement("span");
    count.className = "qn-cards-dots-count";
    count.textContent = "1 / " + SCHEMA.length;
    els.cardsDots.appendChild(count);

    var grid = els.cardsGrid;
    var updateActive = function(){
      var cards = grid.querySelectorAll(".qn-dcard");
      var dots = els.cardsDots.querySelectorAll(".qn-cards-dot");
      var center = grid.scrollLeft + grid.clientWidth / 2;
      var activeIdx = 0;
      cards.forEach(function(c, i){
        if (c.offsetLeft <= center) activeIdx = i;
      });
      dots.forEach(function(d, i){ d.classList.toggle("is-active", i === activeIdx); });
      var countEl = els.cardsDots.querySelector(".qn-cards-dots-count");
      if (countEl) countEl.textContent = (activeIdx + 1) + " / " + SCHEMA.length;
    };
    if (!grid.dataset.dotsBound){
      grid.addEventListener("scroll", function(){ updateActive(); }, { passive: true });
      grid.dataset.dotsBound = "1";
    }
  }

  function scrollCardIntoView(idx){
    if (window.innerWidth > 640) return;
    var grid = els.cardsGrid;
    var card = grid.querySelectorAll(".qn-dcard")[idx];
    if (card) card.scrollIntoView({ block: "nearest", inline: "start", behavior: ssReduce ? "auto" : "smooth" });
  }

  function openSectionFromDashboard(idx){
    transitionToSection(idx);
  }

  function returnToDashboard(fromIdx){
    showScreen("welcome");
    resetScrollToTop();
    renderDashboard();
    if (typeof fromIdx === "number") scrollCardIntoView(fromIdx);
  }

  /* ============================================================
     Review screen
     ============================================================ */
  function formatAnswerForReview(q){
    var v = state.answers[q.id];
    if (q.type === "fileupload"){
      var files = state.files[q.id] || [];
      return files.length ? files.map(function(f){ return f.name; }).join(", ") : "";
    }
    if (q.type === "repeater"){
      if (!Array.isArray(v) || !v.length) return "";
      return v.map(function(item){
        return q.subfields.map(function(sf){ return item[sf.id]; }).filter(Boolean).join(" — ");
      }).filter(Boolean).join("\n");
    }
    if (q.type === "address"){
      if (!v) return "";
      return [v.street, v.city, v.state, v.zip].filter(Boolean).join(", ");
    }
    if (Array.isArray(v)){
      if (!v.length) return "";
      var opts = q.options || [];
      return v.map(function(val){
        var opt = opts.filter(function(o){ return o.value === val; })[0];
        return opt ? opt.label : val;
      }).join(", ");
    }
    if (q.options && v){
      var found = q.options.filter(function(o){ return o.value === v; })[0];
      return found ? found.label : v;
    }
    return v || "";
  }

  function renderReview(){
    els.reviewList.innerHTML = "";
    SCHEMA.forEach(function(section, sIdx){
      var status = sectionStatusFor(sIdx);
      var card = document.createElement("div");
      card.className = "qn-review-card";

      var badgeClass = status === "complete" ? "is-complete" : status === "in_progress" ? "is-in-progress" : "is-skipped";
      var badgeText = status === "complete" ? "Complete" : status === "in_progress" ? "In progress" : (section.required ? "Incomplete" : "Skipped");

      var head = document.createElement("div");
      head.className = "qn-review-card-head";
      head.innerHTML =
        '<div class="qn-review-card-title"><span class="qn-review-check"><svg viewBox="0 0 24 24"><path d="M4 12l6 6L20 6"/></svg></span><span></span></div>' +
        '<span class="qn-review-status-badge ' + badgeClass + '"></span>' +
        (section.required ? '' : '<span class="qn-review-flag" style="color:var(--muted);">Optional</span>') +
        '<button type="button" class="qn-review-edit">Edit</button>';
      head.querySelector(".qn-review-card-title span:last-child").textContent = section.title;
      head.querySelector(".qn-review-status-badge").textContent = badgeText;
      head.querySelector(".qn-review-check").style.opacity = status === "complete" ? "1" : ".25";
      head.querySelector(".qn-review-edit").addEventListener("click", function(){
        transitionToReview(false);
        transitionToSection(sIdx);
      });
      card.appendChild(head);

      var body = document.createElement("div");
      body.className = "qn-review-body";
      section.questions.filter(function(q){ return q.type !== "heading"; }).forEach(function(q){
        if (q.condition && !conditionMet(q.condition)) return;
        var val = formatAnswerForReview(q);
        var row = document.createElement("div");
        row.className = "qn-review-row";
        row.innerHTML = '<span class="qn-review-row-label"></span><span class="qn-review-row-value"></span>';
        row.querySelector(".qn-review-row-label").textContent = q.label;
        var valEl = row.querySelector(".qn-review-row-value");
        if (val){ valEl.textContent = val; } else { valEl.textContent = "Skipped"; valEl.classList.add("is-empty"); }
        body.appendChild(row);
      });
      card.appendChild(body);
      els.reviewList.appendChild(card);
    });

    var ready = allRequiredComplete();
    els.btnSubmit.hidden = !ready;
    els.reviewIncompleteNotice.hidden = ready;
  }

  /* ============================================================
     Structured payload
     ============================================================ */
  var SECTION_KEY_MAP = {
    basics: "basics", whatYouDo: "services", serviceArea: "serviceArea",
    customerContact: "customerContact", differentiators: "differentiators",
    branding: "branding", assets: "assets", technical: "technical", growth: "growth"
  };
  function buildStructuredPayload(){
    var out = { client: {}, metadata: {} };
    SCHEMA.forEach(function(section){
      var key = SECTION_KEY_MAP[section.id] || section.id;
      var bucket = {};
      section.questions.filter(function(q){ return q.type !== "heading"; }).forEach(function(q){
        bucket[q.id] = state.answers[q.id] !== undefined ? state.answers[q.id] : null;
        if (q.type === "fileupload"){
          bucket[q.id + "_files"] = (state.files[q.id] || []).map(function(f){
            return { name: f.name, size: f.size, type: f.type, path: f.path, status: f.status };
          });
        }
      });
      out[key] = bucket;
    });
    out.client = {
      businessName: state.answers.businessName || null,
      phone: state.answers.phone || null,
      email: state.answers.email || null
    };
    out.metadata = {
      submittedAt: new Date().toISOString(),
      questionnaireVersion: VERSION,
      draftId: state.draftId,
      sectionStatus: state.sectionStatus
    };
    return out;
  }

  /* ============================================================
     Screen transitions
     ============================================================ */
  function showScreen(name){
    ["welcome", "questionnaire", "review", "success"].forEach(function(s){
      els["screen_" + s].hidden = s !== name;
    });
  }

  function transitionToReview(focus){
    renderReview();
    showScreen("review");
    if (focus !== false) focusHeading(els.reviewTitle);
    saveLocalImmediate();
  }

  /* ============================================================
     Submission
     ============================================================ */
  var submitting = false;
  function handleSubmit(){
    if (submitting) return;
    submitting = true;
    els.btnSubmit.disabled = true;
    els.btnSubmit.innerHTML = '<span class="qn-spinner"></span> Sending…';
    els.submitError.hidden = true;

    if (!backend.isConfigured()){
      // No backend connected yet -- keep everything local, show an honest error rather than a fake success.
      submitting = false;
      els.btnSubmit.disabled = false;
      els.btnSubmit.textContent = "Send Questionnaire";
      els.submitError.hidden = false;
      els.submitError.querySelector(".qn-submit-error-body").textContent =
        "Submission storage isn't connected yet on the Secret Systems side. Your answers are saved on this device — nothing is lost. Please try again shortly, or reach out to Secret Systems directly.";
      return;
    }

    backend.submitQuestionnaire(state.draftId, buildDraftFields()).then(function(res){
      submitting = false;
      if (res.ok){
        state.submitted = true;
        try { localStorage.removeItem(LS_KEY); } catch(e){}
        renderSuccess();
        showScreen("success");
        requestAnimationFrame(function(){ els.successInner.classList.add("is-shown"); });
      } else {
        els.btnSubmit.disabled = false;
        els.btnSubmit.textContent = "Send Questionnaire";
        els.submitError.hidden = false;
        els.submitError.querySelector(".qn-submit-error-body").textContent =
          "Your answers are still saved on this device. Please try again.";
      }
    });
  }

  function renderSuccess(){
    var anyFiles = Object.keys(state.files).some(function(k){ return (state.files[k]||[]).length > 0; });
    els.successFilesNote.hidden = !anyFiles;
    els.successAddPhotos.hidden = !!anyFiles;
  }

  /* ============================================================
     Wire up
     ============================================================ */
  function collectEls(){
    els.saveIndicator = document.getElementById("qnSaveIndicator");
    els.screen_welcome = document.getElementById("qnWelcome");
    els.screen_questionnaire = document.getElementById("qnQuestionnaire");
    els.screen_review = document.getElementById("qnReview");
    els.screen_success = document.getElementById("qnSuccess");
    els.welcomeInner = document.getElementById("qnWelcomeInner");
    els.cardsGrid = document.getElementById("qnCardsGrid");
    els.cardsDots = document.getElementById("qnCardsDots");
    els.dashProgressFill = document.getElementById("qnDashProgressFill");
    els.dashProgressLabel = document.getElementById("qnDashProgressLabel");
    els.rail = document.getElementById("qnRail");
    els.railPct = document.getElementById("qnRailPct");
    els.sectionEyebrow = document.getElementById("qnSectionEyebrow");
    els.sectionTitle = document.getElementById("qnSectionTitle");
    els.sectionBody = document.getElementById("qnSectionBody");
    els.sectionValidation = document.getElementById("qnSectionValidation");
    els.progressFill = document.getElementById("qnProgressFill");
    els.mobileProgressFill = document.getElementById("qnMobileProgressFill");
    els.mobileSectionLabel = document.getElementById("qnMobileSectionLabel");
    els.mobilePct = document.getElementById("qnMobilePct");
    els.btnPrev = document.getElementById("qnBtnPrev");
    els.btnNext = document.getElementById("qnBtnNext");
    els.controls = document.querySelector(".qn-controls");
    els.backToIntro = document.getElementById("qnBackToIntro");
    els.backToIntroBottom = document.getElementById("qnBackToIntroBottom");
    els.reviewTitle = document.getElementById("qnReviewTitle");
    els.reviewList = document.getElementById("qnReviewList");
    els.reviewIncompleteNotice = document.getElementById("qnReviewIncompleteNotice");
    els.btnSubmit = document.getElementById("qnBtnSubmit");
    els.btnBackToEdit = document.getElementById("qnBtnBackToEdit");
    els.submitError = document.getElementById("qnSubmitError");
    els.btnRetry = document.getElementById("qnBtnRetry");
    els.successInner = document.getElementById("qnSuccessInner");
    els.successFilesNote = document.getElementById("qnSuccessFilesNote");
    els.successAddPhotos = document.getElementById("qnSuccessAddPhotos");
  }

  function init(){
    collectEls();
    state.draftId = getOrCreateDraftId();

    if (backend.isConfigured()) backend.ensureSession();

    var saved = loadLocal();
    if (saved && (Object.keys(saved.answers||{}).length || Object.keys(saved.files||{}).length)){
      state.answers = saved.answers || {};
      state.files = saved.files || {};
      state.sectionStatus = saved.sectionStatus || {};
      state.sectionIndex = saved.sectionIndex || 0;
    }

    buildRail();
    renderDashboard();

    els.btnPrev.addEventListener("click", function(){
      if (state.sectionIndex > 0) transitionToSection(state.sectionIndex - 1);
    });
    els.btnNext.addEventListener("click", function(){
      var current = state.sectionIndex;
      if (isSectionRequired(current)){
        var v = validateCurrentSection();
        if (!v.ok) return;
      } else {
        confirmOptionalSectionComplete(current);
      }
      scheduleSave();
      if (current < SCHEMA.length - 1){
        transitionToSection(current + 1);
      } else {
        transitionToReview();
      }
    });
    els.btnBackToEdit.addEventListener("click", function(){
      returnToDashboard(null);
    });
    els.btnSubmit.addEventListener("click", handleSubmit);
    els.btnRetry.addEventListener("click", handleSubmit);

    var backToOverview = function(){
      returnToDashboard(state.sectionIndex);
    };
    els.backToIntro.addEventListener("click", backToOverview);
    els.backToIntroBottom.addEventListener("click", backToOverview);

    requestAnimationFrame(function(){ els.welcomeInner.classList.add("is-shown"); });
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
