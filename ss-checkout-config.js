/* ============================================================
   Secret Systems — /get-started checkout configuration
   One place to configure the four HighLevel checkout destinations
   and the Supabase validation endpoint. Nothing here is a secret —
   HighLevel checkout URLs and the Supabase project's public
   anon/publishable key are safe to ship in browser code.

   HOW CHECKOUT WORKS
   This site does not process payment itself. /get-started/ collects
   the customer's package + optional Growth Suite + promo code, sends
   that selection to a Supabase Edge Function for validation
   (server-side, so a browser can't forge a discount), then redirects
   the browser to the matching HighLevel branded checkout page below.
   HighLevel owns the actual charge; Secret Systems' own site never
   sees card data.

   BILLING MODEL
   - Website only (regular or promo): the one-time website price is
     due today. Website Care ($149/mo regular, $59/mo promo) begins
     billing only after a 30-day trial — never shown as part of
     "due today."
   - Website + Growth Suite (regular or promo): the one-time website
     price plus the first Growth Suite payment are due today. Website
     Care is included in the $297/mo Growth Suite price — there is no
     separate Website Care charge and no 30-day trial on this tier.

   IMPORTANT: the exact GoHighLevel checkout summary for each of the
   four links below must be manually verified by the business owner
   to match this billing model (in particular, that the two
   website-only links actually have a 30-day trial configured on the
   Website Care price) before real customers use them. This file
   only controls what secretsystems.io displays and which link a
   customer is sent to — it cannot see or change HighLevel's own
   configured pricing. */
window.SS_CHECKOUT_CONFIG = {
  /* Supabase project (matches website-questionnaire's project). */
  SUPABASE_URL: "https://govjiysytpxfjvfiabfo.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_kO93_eTPkLNpW30r_jP_Jw_tcZqnNb3",
  VALIDATE_ENDPOINT: "https://govjiysytpxfjvfiabfo.supabase.co/functions/v1/validate-checkout",

  /* Four exact production HighLevel payment links. Do not modify.
     Each must have its own post-successful-payment redirect pointed
     at https://secretsystems.io/website-questionnaire/ — never on
     checkout page load or an abandoned/failed payment. */
  HIGHLEVEL_URLS: {
    // $3,500 due today; $149/mo Website Care after a 30-day trial
    regular_website: "https://links.secretsystems.io/payment-link/6aa496c4e9a073174b3b5e89",
    // $3,797 due today ($3,500 + first $297 Growth Suite payment); $297/mo after, Website Care included
    regular_website_growth: "https://links.secretsystems.io/payment-link/6aa49b14e9a073174b3b5e97",
    // $500 due today; $59/mo Website Care after a 30-day trial (promo code "five")
    promo_website: "https://links.secretsystems.io/payment-link/6aa49bf9e9a073174b3b5e99",
    // $797 due today ($500 + first $297 Growth Suite payment); $297/mo after, Website Care included (promo code "five")
    promo_website_growth: "https://links.secretsystems.io/payment-link/6aa49c70e9a073174b3b5e9a"
  },

  /* Display-only pricing shown before the customer submits anything.
     The Supabase edge function is the authoritative source once a
     selection + promo code is actually validated — this copy exists
     so the page can render instantly without waiting on a network
     round trip, and must be kept in sync with the edge function's
     PRICING constant by hand if prices ever change. */
  DISPLAY_PRICING: {
    regular: { websiteOnce: 3500, careMonthly: 149, careStandardMonthly: 149 },
    promo: { websiteOnce: 500, careMonthly: 59, careStandardMonthly: 59 },
    growthSuiteMonthly: 297,
    growthSuiteStandardMonthly: 497
  },

  /* The word "five" is the actual code the validate-checkout edge
     function accepts (not the digit "5"). Never surfaced in visible
     page content or placeholders — see the security notes in
     get-started.js. */
  PROMO_CODE_DISPLAY: ""
};
