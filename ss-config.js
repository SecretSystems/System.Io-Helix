/* ============================================================
   Secret Systems — site configuration
   One place to activate live integrations. Leave a value as ""
   to keep that integration OFF. Nothing here is provider-specific.
   ============================================================ */
window.SS_CONFIG = {
  /* Contact-form delivery endpoint.
     Point this at your GoHighLevel inbound webhook OR any custom
     CRM/back-end URL that accepts a JSON POST. Provider-agnostic:
     the form sends the same JSON payload regardless of destination.
     Leave "" to disable online submission — the form then shows an
     honest "not active yet" message and the email/phone options. */
  FORM_ENDPOINT: "",

  /* Google Analytics 4 Measurement ID, e.g. "G-XXXXXXXXXX".
     Leave "" to keep analytics OFF (no script is loaded, no cookies). */
  GA4_ID: "",

  /* Public contact details (shown across the site). */
  EMAIL: "info@secretsystems.io",
  PHONE_DISPLAY: "(337) 258-8818",
  PHONE_TEL: "+13372588818"
};
