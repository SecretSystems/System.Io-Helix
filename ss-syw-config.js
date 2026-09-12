/* ============================================================
   Secret Systems — /start-your-website checkout configuration
   Centralized HighLevel checkout routing + display pricing for the
   three-package "Start Your Website" page. Kept separate from
   ss-checkout-config.js (the older /get-started/ page's config) so
   neither page's settings can accidentally affect the other.

   Nothing here is a secret — HighLevel checkout/payment-link URLs
   and the Supabase project's public anon/publishable key are safe
   to ship in browser code. Row Level Security and the edge
   function's server-side logic are what actually protect the data,
   not secrecy of these values.

   HOW CHECKOUT WORKS
   This page does not process payment itself. It collects the
   customer's package choice + optional Promo 5 code, validates the
   promo server-side via the existing validate-checkout Supabase
   Edge Function (so a browser can't forge eligibility), then sends
   the browser to the matching HighLevel payment link below.
   HighLevel owns the actual charge; Secret Systems' own site never
   sees card data.
   ============================================================ */
window.SS_SYW_CONFIG = {
  /* Same Supabase project used by /get-started/ and the website
     questionnaire. Reused here ONLY to check promo-code validity —
     this page does not use or trust that function's pricing/routing
     output, because its bundle math differs from this page's. */
  SUPABASE_URL: "https://govjiysytpxfjvfiabfo.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_kO93_eTPkLNpW30r_jP_Jw_tcZqnNb3",
  VALIDATE_ENDPOINT: "https://govjiysytpxfjvfiabfo.supabase.co/functions/v1/validate-checkout",

  /* Exact production HighLevel payment links. Do not modify. */
  HIGHLEVEL_CHECKOUT_URLS: {
    regularWebsite: "https://links.secretsystems.io/payment-link/6aa496c4e9a073174b3b5e89",
    promoWebsite: "https://links.secretsystems.io/payment-link/6aa49bf9e9a073174b3b5e99",
    regularGrowth: "https://links.secretsystems.io/payment-link/6aa49b14e9a073174b3b5e97",
    promoGrowth: "https://links.secretsystems.io/payment-link/6aa49c70e9a073174b3b5e9a"
  },

  /* Market Dominator is a high-touch, custom-approval service. It is
     never routed to a payment link — the customer must speak with
     Secret Systems before being charged. */
  MARKET_DOMINATOR_ROUTE: "/contact/",

  /* Display pricing. Due-today figures = the one-time website price
     plus the first month of whichever single recurring charge
     applies to that package (Website Care for Website; the Growth
     System fee — which already includes Website Care — for Growth).
     Market Dominator has no checkout total; it is quoted after a
     consultation. */
  PRICING: {
    website: {
      regular: { dueToday: 3649, monthly: 149, websiteOnce: 3500, careMonthly: 149 },
      promo: { dueToday: 559, monthly: 59, websiteOnce: 500, careMonthly: 59 }
    },
    growth: {
      regular: { dueToday: 3797, monthly: 297, standardMonthly: 497, websiteOnce: 3500 },
      promo: { dueToday: 797, monthly: 297, standardMonthly: 497, websiteOnce: 500 }
    },
    marketDominator: {
      startingMonthly: 1997
    }
  },

  /* Optional ISO date string (e.g. "2026-12-31T23:59:59-06:00") for
     the Growth System "limited-time rate." Leave "" to show
     "Limited-Time Rate" without any deadline — never invent one. */
  growthOfferEndDate: ""

  /* No promo code value is stored here. The visible offer is named
     "Promo 5"; the actual code the shared validate-checkout edge
     function accepts is the word "five" (not the digit "5") — see
     that function and /get-started/ for the authoritative value.
     It is intentionally not surfaced in this file or in the page's
     promo input placeholder, since the code isn't meant to be
     publicly discoverable from view-source. Server-side validation,
     not code secrecy, is what actually protects promo eligibility. */
};
