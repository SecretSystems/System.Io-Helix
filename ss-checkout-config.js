/* ============================================================
   Secret Systems — /get-started checkout configuration
   One place to configure the four HighLevel checkout destinations
   and the Supabase validation endpoint. Nothing here is a secret —
   HighLevel checkout URLs and the Supabase project's public
   anon/publishable key are safe to ship in browser code.

   HOW CHECKOUT WORKS
   This site does not process payment itself. /get-started/ collects
   the customer's package + optional add-on + promo code, sends that
   selection to a Supabase Edge Function for validation (server-side,
   so a browser can't forge a discount), then redirects the browser
   to the matching HighLevel branded checkout page below. HighLevel
   owns the actual charge; Secret Systems' own site never sees card
   data.

   Leave a HIGHLEVEL_URLS value as "" to keep that destination OFF —
   the page will show an honest "checkout isn't connected yet"
   message instead of redirecting somewhere broken.
   ============================================================ */
window.SS_CHECKOUT_CONFIG = {
  /* Supabase project (matches website-questionnaire's project). */
  SUPABASE_URL: "https://govjiysytpxfjvfiabfo.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_kO93_eTPkLNpW30r_jP_Jw_tcZqnNb3",
  VALIDATE_ENDPOINT: "https://govjiysytpxfjvfiabfo.supabase.co/functions/v1/validate-checkout",

  /* Four HighLevel checkout destinations, one per package/promo
     combination. Each must be a HighLevel-hosted checkout page (or
     payment link) configured with the matching one-time + recurring
     prices, and its own post-purchase redirect pointed at:
       https://secretsystems.io/get-started/thank-you/
     See the owner-action checklist in the final report for exact
     setup steps. */
  HIGHLEVEL_URLS: {
    // $3,500 once + $149/mo Website Care
    regular_website: "",
    // $3,500 once + $149/mo Website Care + $297/mo Growth Suite
    regular_website_growth: "",
    // $500 once + $59/mo Website Care (promo code "five")
    promo_website: "",
    // $500 once + $59/mo Website Care + $297/mo Growth Suite (promo code "five")
    promo_website_growth: ""
  },

  /* Display-only pricing shown before the customer submits anything.
     The Supabase edge function is the authoritative source once a
     selection + promo code is actually validated — this copy exists
     so the page can render instantly without waiting on a network
     round trip, and must be kept in sync with the edge function's
     PRICING constant by hand if prices ever change. */
  DISPLAY_PRICING: {
    regular: { websiteOnce: 3500, careMonthly: 149 },
    promo: { websiteOnce: 500, careMonthly: 59 },
    growthSuiteMonthly: 297
  },

  PROMO_CODE_DISPLAY: "five"
};
