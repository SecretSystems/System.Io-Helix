/* ============================================================
   Secret Systems — Selected Work portfolio data
   ------------------------------------------------------------
   Single source of truth for the homepage "Selected Work"
   carousel. Add, remove, or reorder projects here — the
   carousel (portfolio/portfolio.js) reads this array only.

   @typedef {Object} PortfolioProject
   @property {string} id            - stable slug, used for DOM ids and state keys
   @property {string} name          - display name
   @property {string} category      - short category label shown above the name
   @property {string} description   - one-sentence description
   @property {string} url           - live site URL ("Open Live Site" target)
   @property {string} [previewUrl]  - URL loaded in the sandboxed iframe when
                    previewMode is "live", if different from `url` (e.g. a
                    dedicated embed-safe route on the same project that
                    permits framing from this site). Falls back to `url`
                    when omitted.
   @property {'live'|'fallback'} previewMode
       'live'     - safe to load in a sandboxed iframe (verified: no
                    X-Frame-Options/CSP block, no console-breaking errors)
       'fallback' - iframe embedding is blocked or was judged unsafe to
                    show live (auth-gated, or would expose real user data);
                    always shows the static poster instead
   @property {string} poster        - path to the WebP poster image (used for
                    every inactive card, and as the loading/placeholder state
                    for 'live' cards before the iframe finishes loading)
   @property {string} posterAlt     - descriptive alt text for the poster image
   @property {string} [fallbackReason] - human-readable reason recorded for the
                    implementation report when previewMode is 'fallback'
   ============================================================ */

var SS_PORTFOLIO = {
  websites: {
    label: "Websites",
    defaultId: "light-the-season",
    projects: [
      {
        id: "light-the-season",
        name: "Light The Season",
        category: "Seasonal Service Website",
        description: "Professional Christmas light installation website built for local SEO, conversion, and seasonal visual impact.",
        url: "https://www.lighttheseasons.com/",
        previewUrl: "https://www.lighttheseasons.com/portfolio-preview",
        previewMode: "live",
        poster: "/portfolio/assets/poster-light-the-season.webp",
        posterAlt: "Light The Season homepage: a nighttime photo of a house with warm white Christmas lights along the roofline and driveway, with the headline \"Christmas lights designed to stop traffic — not ruin your weekend.\""
      },
      {
        id: "cajun-pressure",
        name: "Cajun Pressure",
        category: "Local Service Website",
        description: "Local service website for pressure washing and exterior cleaning in Lafayette, Louisiana.",
        url: "https://cajunpressure.com/",
        previewMode: "live",
        poster: "/portfolio/assets/poster-cajun-pressure.webp",
        posterAlt: "Cajun Pressure homepage with a bold \"Exterior Cleaning Done Right\" headline over a photo of a pressure-washing crew cleaning a metal building."
      },
      {
        id: "fineline-construction",
        name: "Fineline Construction of Louisiana",
        category: "Local Service Website",
        description: "Bathroom-remodeling and construction website designed to present services and generate local leads.",
        url: "https://fineline-construction-of-louisiana.vercel.app/",
        previewMode: "live",
        poster: "/portfolio/assets/poster-fineline-construction.webp",
        posterAlt: "Fineline Construction of Louisiana homepage with the headline \"The Difference Is The Fine Line\" over a warmly lit bathroom remodel photo."
      }
    ]
  },
  apps: {
    label: "Apps & Systems",
    defaultId: "exchange-time",
    projects: [
      {
        id: "exchange-time",
        name: "Exchange Time",
        category: "Workforce Coordination System",
        description: "Fire-department exchange-time, scheduling, approval, and workforce coordination system.",
        url: "https://et.fireservicetools.com/",
        previewUrl: "https://et.fireservicetools.com/portfolio-demo",
        previewMode: "live",
        poster: "/portfolio/assets/poster-exchange-time.webp",
        posterAlt: "Exchange Time brand mark — an orange rounded-square icon with a cycle/exchange glyph on a dark background, with the name \"Exchange Time\" and the tagline \"Fire-department scheduling & workforce coordination.\""
      },
      {
        id: "light-the-season-fireworks",
        name: "Light The Season Fireworks",
        category: "E-Commerce Storefront",
        description: "Online fireworks storefront created for America's 250th celebration.",
        url: "https://fireworks.lighttheseasons.com/shop",
        previewMode: "live",
        poster: "/portfolio/assets/poster-fireworks.webp",
        posterAlt: "Light The Season Fireworks shop page showing a dark red-and-gold \"Shop All Fireworks\" header above a grid of Black Cat firework product photos."
      },
      {
        id: "loan-ready-os",
        name: "Loan Ready OS",
        category: "Operating System",
        description: "A guided operating system for organizing the information and steps required to become loan-ready.",
        url: "https://loan-ready-os.vercel.app/",
        previewMode: "live",
        poster: "/portfolio/assets/poster-loan-ready-os.webp",
        posterAlt: "Loan Ready OS landing page with the headline \"The credit improvement operating system\" beside a loan-readiness dashboard showing progress bars and credit scores."
      },
      {
        id: "commandroom-os",
        name: "CommandRoom OS",
        category: "Operating System",
        description: "A centralized operating dashboard designed to manage multiple business functions from one command room.",
        url: "https://commandroom-os.vercel.app/",
        previewMode: "live",
        poster: "/portfolio/assets/poster-commandroom-os.webp",
        posterAlt: "CommandRoom OS dashboard showing a \"Today\" view with business alerts, a trade board entry, a weekly hitch calendar, and an inbox of triage items."
      }
    ]
  }
};
