/* ============================================================
   Secret Systems — Streaming TV / CTV platform data
   Single source of truth for every platform fact shown across the
   /streaming-tv-advertising/ page cluster (main page + platform
   sub-pages). Update THIS file when a minimum, targeting capability,
   or source link changes — every page pulls from here so nothing
   drifts out of sync.

   accessTier meanings:
     "direct"    — Secret Systems can configure a campaign directly
                   inside that platform's own self-service ad manager.
     "aggregator"— Inventory can be reached through a broader CTV/DSP
                   platform Secret Systems uses, not a direct 1:1
                   self-service account with that network.
     "unconfirmed" — Not currently confirmed; excluded from firm claims.

   IMPORTANT: verify minimumSpend + targeting against sourceUrl before
   reusing this data after ~90 days — these terms change without notice.
   ============================================================ */
window.SS_CTV_PLATFORMS = [
  {
    id: "hulu-disney",
    name: "Hulu / Disney+",
    shortName: "Hulu & Disney+",
    accessTier: "direct",
    platformTool: "Disney Campaign Manager (self-service)",
    minimumSpend: "$500 per campaign (media spend)",
    minimumSpendNote: "Self-service minimum for the Disney Campaign Manager tool. Premium/high-reach formats are sold separately through Disney's direct sales team at much higher budgets.",
    cpmRange: "Commonly cited in the $20–$50 CPM range depending on targeting and seasonality — confirm current rate card before quoting.",
    inventory: ["Hulu", "Disney+ (ad-supported tier, where available)"],
    targeting: ["Age & gender", "Viewer interests / genre affinity", "Household & geographic targeting (platform-dependent)"],
    retargeting: "unconfirmed",
    firstPartyAudiences: "unconfirmed",
    lastVerified: "2026-09-09",
    sourceUrl: "https://www.disneycampaignmanager.com/introducing-hulu-ad-manager-a-self-service-advertising-solution-for-streaming-tv/",
    sourceLabel: "Disney Campaign Manager — Hulu Ad Manager announcement"
  },
  {
    id: "paramount",
    name: "Paramount+ / Pluto TV",
    shortName: "Paramount+ & Pluto TV",
    accessTier: "direct",
    platformTool: "Paramount Ads Manager (self-service)",
    minimumSpend: "$500 minimum campaign budget (media spend); tiered bundles run higher ($5,000 / $10,000) for expanded reach",
    minimumSpendNote: "The entry-level self-service minimum is $500. Broader placement bundles across more of the Paramount portfolio require larger minimum commitments.",
    cpmRange: "CPMs starting near $7 on lower tiers, scaling with targeting precision and placement — confirm current rate card before quoting.",
    inventory: ["Paramount+", "Pluto TV", "CBS", "CBS Sports", "MTV", "Comedy Central", "additional Paramount-owned channels"],
    targeting: ["National, state, DMA, or ZIP-code-level geography", "Age, gender, household income bands", "Lifestyle / behavior segments", "Content-category placement (sports, news, comedy, etc.)"],
    retargeting: "supported",
    retargetingNote: "Paramount Ads Manager's campaign builder references audience retargeting during setup.",
    firstPartyAudiences: "unconfirmed",
    lastVerified: "2026-09-09",
    sourceUrl: "https://adsmanager.paramount.com/",
    sourceLabel: "Paramount Ads Manager — official self-service platform"
  },
  {
    id: "roku",
    name: "Roku",
    shortName: "Roku",
    accessTier: "direct",
    platformTool: "Roku Ads Manager (self-service)",
    minimumSpend: "Commonly reported around $500 per campaign in third-party guides; Roku's own help documentation does not publish a fixed minimum — confirm current terms at signup.",
    minimumSpendNote: "Treat the $500 figure as a planning estimate, not a guaranteed official minimum, until confirmed inside the live Roku Ads Manager account setup.",
    cpmRange: "Widely reported in the $20–$60 CPM range depending on targeting and format — confirm current rate card before quoting.",
    inventory: ["The Roku Channel and ad-supported content across apps on Roku devices"],
    targeting: ["State, ZIP code, or DMA geography (one geography type per targeting rule)", "Demographic targeting (age, gender; income excluded for political ads)"],
    retargeting: "supported",
    retargetingNote: "Roku Ads Manager supports a website pixel for retargeting site visitors and building custom audiences, including excluding people who already converted.",
    firstPartyAudiences: "supported",
    firstPartyAudiencesNote: "Custom audience uploads are supported through Roku Ads Manager's audience tools.",
    lastVerified: "2026-09-09",
    sourceUrl: "https://help.ads.roku.com/en/articles/7191978-location-targeting",
    sourceLabel: "Roku Self-Serve Help Center — Location targeting"
  },
  {
    id: "broader-ctv",
    name: "Peacock, Max, Tubi, Discovery+, HGTV, Food Network, Prime Video, Sling, YouTube TV & other CTV inventory",
    shortName: "Broader CTV Inventory",
    accessTier: "aggregator",
    platformTool: "Reached through a supported CTV / demand-side advertising platform, not a direct 1:1 self-service account with each network",
    minimumSpend: "Varies by platform and campaign; a written plan specifies the media-spend minimum for the exact inventory selected.",
    minimumSpendNote: "Direct self-service access to these networks individually is either enterprise-priced (commonly $25,000+ for a direct Peacock buy, for example) or not available the way Hulu, Paramount+, and Roku's tools are. Where included, it is through broader programmatic/CTV inventory rather than a direct account with that network.",
    cpmRange: "Varies significantly by network and targeting; confirmed at the planning stage per campaign.",
    inventory: ["Peacock", "Max", "Tubi", "Discovery+", "HGTV", "Food Network", "Amazon Fire TV placements", "Prime Video (ad-supported tier, where available)", "Sling", "YouTube TV", "other ad-supported CTV apps depending on the campaign's platform"],
    targeting: ["Geographic and audience targeting available through the aggregating platform used for that campaign; specifics vary by inventory source"],
    retargeting: "unconfirmed",
    firstPartyAudiences: "unconfirmed",
    lastVerified: "2026-09-09",
    sourceUrl: "",
    sourceLabel: "Availability and terms vary by campaign — confirmed with the client at the planning stage before any spend commitment",
    isAggregate: true
  }
];

/* Disclaimer text reused wherever platform logos/claims appear. */
window.SS_CTV_DISCLAIMER = "Platform availability, inventory and targeting options vary by campaign. Secret Systems is an independent advertising service and is not affiliated with or endorsed by the streaming platforms shown unless explicitly stated.";
window.SS_CTV_MINIMUMS_NOTE = "Platform minimums are media spend and do not include Secret Systems creative or management fees. Minimums and inventory can change — confirm current terms before final budget commitment.";
