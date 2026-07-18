# Phase 2 Authority Expansion — Implementation Architecture

**Date:** 2026-07-18 · **Mode:** executed in this phase (not a proposal)
**Strategy source:** `phase-2-content-strategy.md` (silo map, scoring) — this doc is the build spec. Filenames follow the owner's directive (`software-development.html` etc.), superseding the shorter names in the strategy doc.

## Current-state summary
13 live pages; pillars exist for marketing-automation (`automation.html`) and security (`security.html`); other services are sections on `services.html`. Zero articles. Honest forms (config-gated), 100/100/100 homepage Lighthouse, WebP hero (9.7 MB), robots blocks `/sites/`, vault noindexed. Full audit: `secret-systems-website-audit.md`.

## Search-intent map (one primary intent per page)
| Page | Primary intent |
|---|---|
| software-development.html | "custom software development (for my business)" — evaluate/hire |
| app-development.html | "business app development / web app developer" — evaluate/hire |
| dashboard-development.html | "custom business dashboard / KPI dashboard developer" |
| workflow-automation.html | "business workflow automation (internal ops)" |
| web-design.html | "business website design (Louisiana)" |
| security.html (expanded) | "small business security review / website hardening" |
| automation.html (repositioned) | "CRM / lead follow-up / marketing automation" |
| resources.html | hub — routes research-stage visitors |
| custom-software-vs-off-the-shelf.html | decision: build vs. buy |
| what-business-processes-should-you-automate.html | decision: automation candidates |
| business-dashboard-guide.html | education: what a dashboard should contain |

## Topic silos & hierarchy
```
Home
└─ Services (hub w/ summaries + links)
   ├─ web-design.html            ├─ software-development.html
   ├─ app-development.html       ├─ dashboard-development.html
   ├─ workflow-automation.html   ├─ automation.html (CRM/marketing)
   └─ security.html
Resources (resources.html)
   ├─ custom-software-vs-off-the-shelf.html   → software-development
   ├─ what-business-processes-should-you-automate.html → workflow-automation
   └─ business-dashboard-guide.html           → dashboard-development
```

## Internal-linking map
- Every service page: visible breadcrumb (Home › Services › X) + `BreadcrumbList`; "Related services" row (3 links); article links where relevant.
- Articles: link up to their pillar + 1–2 sibling services; resources.html links all three; pillars link down to their article.
- Homepage tiles 01/10/11/12/13/14 → dedicated pages (replacing `services.html#…` anchors). Services hub blocks gain "Full details →" links. Footer Services column → 6 dedicated links; Company column gains Resources.
- automation.html ⇄ workflow-automation.html cross-link with explicit "which page do you need" framing (anti-cannibalization).

## Schema plan
Service pages: `Service` + `FAQPage` (visible FAQs only) + `BreadcrumbList`. Articles: `Article` (author/publisher = Secret Systems LLC, date 2026-07-18) + `BreadcrumbList`. No LocalBusiness with fake address; Organization data unchanged (real NAP: info@secretsystems.io, (337) 258-8818, South Louisiana, nationwide).

## Conversion plan
Every service page: consult CTA (top + bottom band) → contact.html; "what you own" deliverables block; honest proof line ("ask for a live walkthrough"). Articles: single low-pressure consult CTA + related-service links. No fake urgency, no invented numbers.

## Implementation order (this phase)
1. This doc → 2. Five new service pages + security expansion → 3. Hub/homepage/footer/catalog rewiring + automation distinction + about strengthening → 4. resources + 3 articles → 5. sitemap → 6. QA (static, browser, Lighthouse) → 7. two commits, push, production verify.

## Future-content backlog (not this phase)
Cost guides (custom software, website), CRM-automation support page, website-security support page, industry pages (home services first), Lafayette local page + GBP (owner-gated), case studies (owner-gated), glossary/checklists/calculators (2E), Services nav dropdown (only when page count justifies).

## Deliberately excluded from this phase
City/doorway pages · fake team/bios (owner must supply) · case-study fabrication · pentest/compliance claims · FORM_ENDPOINT/GA4 activation (owner values) · hero video refactor · framework migration · Ducharme client file (untouched).
