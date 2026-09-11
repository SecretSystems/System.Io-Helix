/* ============================================================
   Secret Systems — Questionnaire Supabase adapter
   Thin, isolated interface between the questionnaire app and
   Supabase. Nothing outside this file talks to Supabase directly,
   so the backend can be swapped or reconfigured without touching
   app.js.

   Configuration lives in window.SS_QUESTIONNAIRE_CONFIG below.
   Only the publishable/anon key belongs in frontend code — that
   key is safe to expose by design (Supabase's Row Level Security
   policies are what actually protect the data, not secrecy of the
   key). The service role key must NEVER appear here or anywhere
   in the browser bundle.

   Auth model: every visitor gets an invisible anonymous Supabase
   session (no login UI). Rows are owned by that session's
   auth.uid() and RLS restricts all reads/writes to matching rows.
   ============================================================ */
window.SS_QUESTIONNAIRE_CONFIG = {
  SUPABASE_URL: "https://govjiysytpxfjvfiabfo.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_kO93_eTPkLNpW30r_jP_Jw_tcZqnNb3",

  /* Private storage bucket for questionnaire file uploads.
     Path structure: {owner-id}/{submission-id}/{category}/{safe-filename} */
  STORAGE_BUCKET: "website-questionnaire-assets",

  /* Matches storage bucket's file_size_limit (bytes). */
  MAX_FILE_SIZE: 52428800,

  TABLE_SUBMISSIONS: "website_questionnaire_submissions",
  TABLE_FILES: "website_questionnaire_files"
};

(function(){
  var cfg = window.SS_QUESTIONNAIRE_CONFIG;
  var client = null;
  var ready = !!(cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase);
  var authReadyPromise = null;

  if (ready) {
    client = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
    });
  }

  function isConfigured(){ return ready; }

  /* ── Invisible anonymous auth ──
     Reuses a persisted session if one exists (localStorage, handled
     by the client), otherwise silently creates one. No UI, no
     visible account. Resolves to { ok, userId } or { ok:false }. */
  function ensureSession(){
    if (!ready) return Promise.resolve({ ok: false, reason: "not_configured" });
    if (authReadyPromise) return authReadyPromise;

    authReadyPromise = client.auth.getSession().then(function(res){
      if (res.data && res.data.session && res.data.session.user){
        return { ok: true, userId: res.data.session.user.id };
      }
      return client.auth.signInAnonymously().then(function(signInRes){
        if (signInRes.error || !signInRes.data.user) {
          return { ok: false, reason: "auth_error", error: signInRes.error };
        }
        return { ok: true, userId: signInRes.data.user.id };
      });
    }).catch(function(error){
      return { ok: false, reason: "network", error: error };
    });

    return authReadyPromise;
  }

  /* ── Draft / submission persistence ──
     One row per client in website_questionnaire_submissions.
     Starts as status "draft" on first meaningful input, upserted on
     every autosave tick, flips to "submitted" on final submit. */
  function upsertDraft(submissionId, fields){
    if (!ready) return Promise.resolve({ ok: false, reason: "not_configured" });
    return ensureSession().then(function(session){
      if (!session.ok) return session;
      var row = {
        id: submissionId,
        owner_id: session.userId,
        business_name: fields.businessName || null,
        contact_name: fields.contactName || null,
        email: fields.email || null,
        phone: fields.phone || null,
        answers: fields.answers || {},
        current_section: fields.currentSection || null,
        completion_percentage: fields.completionPercentage || 0
      };
      return client.from(cfg.TABLE_SUBMISSIONS).upsert(row, { onConflict: "id" }).then(function(res){
        if (res.error) return { ok: false, reason: "error", error: res.error };
        return { ok: true };
      });
    }).catch(function(error){
      return { ok: false, reason: "network", error: error };
    });
  }

  function fetchDraft(submissionId){
    if (!ready) return Promise.resolve({ ok: false, reason: "not_configured" });
    return ensureSession().then(function(session){
      if (!session.ok) return session;
      return client.from(cfg.TABLE_SUBMISSIONS).select("*").eq("id", submissionId).maybeSingle()
        .then(function(res){
          if (res.error) return { ok: false, reason: "error", error: res.error };
          if (!res.data) return { ok: false, reason: "not_found" };
          return { ok: true, row: res.data };
        });
    }).catch(function(error){
      return { ok: false, reason: "network", error: error };
    });
  }

  /* Finds the most recent draft owned by this session, regardless of
     which submissionId localStorage remembers (covers a cleared
     localStorage on the same authenticated browser session). */
  function fetchLatestDraftForSession(){
    if (!ready) return Promise.resolve({ ok: false, reason: "not_configured" });
    return ensureSession().then(function(session){
      if (!session.ok) return session;
      return client.from(cfg.TABLE_SUBMISSIONS).select("*")
        .eq("owner_id", session.userId).eq("status", "draft")
        .order("updated_at", { ascending: false }).limit(1).maybeSingle()
        .then(function(res){
          if (res.error) return { ok: false, reason: "error", error: res.error };
          if (!res.data) return { ok: false, reason: "not_found" };
          return { ok: true, row: res.data };
        });
    }).catch(function(error){
      return { ok: false, reason: "network", error: error };
    });
  }

  /* ── File uploads ──
     Files are stored under {owner-id}/{submission-id}/{category}/{filename}
     in the private bucket, with a matching metadata row. */
  function uploadFile(submissionId, category, file, onProgress){
    if (!ready) return Promise.resolve({ ok: false, reason: "not_configured" });
    if (file.size > cfg.MAX_FILE_SIZE){
      return Promise.resolve({ ok: false, reason: "too_large", maxSize: cfg.MAX_FILE_SIZE });
    }
    return ensureSession().then(function(session){
      if (!session.ok) return session;
      var safeName = sanitizeFilename(file.name);
      var path = session.userId + "/" + submissionId + "/" + category + "/" + Date.now() + "-" + safeName;
      return client.storage.from(cfg.STORAGE_BUCKET).upload(path, file, {
        cacheControl: "3600",
        upsert: false
      }).then(function(res){
        if (res.error) return { ok: false, reason: "error", error: res.error };
        return client.from(cfg.TABLE_FILES).insert({
          submission_id: submissionId,
          owner_id: session.userId,
          category: category,
          storage_path: path,
          original_filename: file.name,
          mime_type: file.type || null,
          file_size: file.size
        }).select("id").single().then(function(insertRes){
          if (insertRes.error){
            client.storage.from(cfg.STORAGE_BUCKET).remove([path]);
            return { ok: false, reason: "error", error: insertRes.error };
          }
          return { ok: true, path: path, fileId: insertRes.data.id, name: file.name, size: file.size, type: file.type };
        });
      });
    }).catch(function(error){
      return { ok: false, reason: "network", error: error };
    });
  }

  function removeFile(fileId, path){
    if (!ready) return Promise.resolve({ ok: false, reason: "not_configured" });
    return ensureSession().then(function(session){
      if (!session.ok) return session;
      return client.storage.from(cfg.STORAGE_BUCKET).remove([path]).then(function(res){
        if (res.error) return { ok: false, reason: "error", error: res.error };
        return client.from(cfg.TABLE_FILES).delete().eq("id", fileId).then(function(delRes){
          if (delRes.error) return { ok: false, reason: "error", error: delRes.error };
          return { ok: true };
        });
      });
    }).catch(function(error){
      return { ok: false, reason: "network", error: error };
    });
  }

  function sanitizeFilename(name){
    return String(name).replace(/[^a-zA-Z0-9._-]/g, "_").slice(-140);
  }

  /* ── Final submission ──
     Flips the existing draft row to status "submitted". Guarded by
     RLS (owner-only) and a client-side in-flight flag in app.js to
     prevent duplicate submissions from double-clicks. */
  function submitQuestionnaire(submissionId, fields){
    if (!ready) return Promise.resolve({ ok: false, reason: "not_configured" });
    return ensureSession().then(function(session){
      if (!session.ok) return session;
      return client.from(cfg.TABLE_SUBMISSIONS).update({
        business_name: fields.businessName || null,
        contact_name: fields.contactName || null,
        email: fields.email || null,
        phone: fields.phone || null,
        answers: fields.answers || {},
        current_section: fields.currentSection || null,
        completion_percentage: fields.completionPercentage || 0,
        status: "submitted",
        submitted_at: new Date().toISOString()
      }).eq("id", submissionId).eq("owner_id", session.userId).eq("status", "draft")
        .select("id").maybeSingle().then(function(res){
          if (res.error) return { ok: false, reason: "error", error: res.error };
          if (!res.data) return { ok: false, reason: "already_submitted_or_missing" };
          return { ok: true };
        });
    }).catch(function(error){
      return { ok: false, reason: "network", error: error };
    });
  }

  window.SSQuestionnaireBackend = {
    isConfigured: isConfigured,
    ensureSession: ensureSession,
    upsertDraft: upsertDraft,
    fetchDraft: fetchDraft,
    fetchLatestDraftForSession: fetchLatestDraftForSession,
    uploadFile: uploadFile,
    removeFile: removeFile,
    submitQuestionnaire: submitQuestionnaire
  };
})();
