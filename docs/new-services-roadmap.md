# New Services — Implementation Roadmap

**Purpose:** A detailed, buildable plan for adding Software Development, App Development, Dashboard Development, Workflow Automation, AI Systems, and Cybersecurity as **first-class services** — without overbuilding, and while preserving the current visual identity.

**Guiding rules**
- No fabricated proof. Every page states capability, process, and deliverables — not invented results. Proof (case studies, logos, metrics) is added only when the owner supplies real, permissioned material.
- Reuse the existing design system (`ss-shared.css` / `ss-shared.js`, the `page-hero` + `svc-block` + `scope-box` + `faq` patterns already used by `security.html`).
- Add pages only when they carry unique, non-thin content. Otherwise keep the service as a section on `services.html`.

---

## 1. Current state (already shipped in Phase 1)

| Service | Homepage tile | services.html section | Dedicated page |
|---------|:-------------:|:---------------------:|:--------------:|
| Custom Software | yes (#10) | yes (`#software`) | — |
| App Development | yes (#11) | yes (under `#software`) | — |
| Dashboard Development | yes (#12) | yes (`#dashboards`) | — |
| Workflow Automation | yes (#13) | yes (`#automation`) | automation.html (marketing automation) |
| AI Systems | partial (automation copy) | partial | — |
| Cybersecurity | yes (#14) | — | yes (`security.html`) |

So the services are **introduced and honest today**. What follows is how to deepen them into full commercial pages when there's demand/proof.

---

## 2. Fit test — what naturally belongs as its own page vs. a section

| Service | Recommendation | Why |
|---------|----------------|-----|
| Custom Software & Web Apps | **Own page** (`software.html`) | High-value, high-intent, distinct buyer questions (build-vs-buy, ownership, cost). Not thin. |
| App Development | **Section** on `software.html` (anchor `#apps`) | Overlaps heavily with custom software; a full page risks thin/duplicate content until there's app-specific proof. |
| Dashboard Development | **Own page** (`dashboards.html`) | Distinct outcome (visibility/reporting); `demo-crm.html` already provides a visual concept. |
| Workflow Automation | **Own page** (`workflow-automation.html`) | Distinct from marketing "automation" (this is internal ops). Separate intent from `automation.html`. |
| AI Systems | **Section** first (under software/automation) | Easy to overclaim. Keep it concrete ("summarize, classify, draft, route") and scoped. Promote to a page only with a real example. |
| Cybersecurity | **Own page (done)** — `security.html` | Needs the responsible-scope framing a section can't carry. |

**Verdict:** the next pages worth building are `software.html`, `dashboards.html`, `workflow-automation.html`, and `web-design.html` (current web content lives only in `services.html#web`).

---

## 3. Page specification template (apply to each new page)

Model exactly on `security.html`. Every page includes:

1. **Head:** unique `<title>`, meta description, canonical, OG + Twitter, `favicon.svg`, `Service` JSON-LD (provider = Secret Systems LLC, areaServed US), `ss-shared.css`.
2. **Body chrome:** canonical 7-item nav, `#mob` menu, `#bg` canvas + cursor divs, `ss-config.js` then `ss-shared.js`, canonical footer + foot-bottom.
3. **Content blocks:**
   - `page-hero` — problem-framed headline (not hype) + two CTAs.
   - 2–3 `svc-block` sections — "What we build," each with 3–4 `svc-item`s (capability + plain outcome).
   - "How we work" `svc-block` — the Discovery → Blueprint → Build → Launch → Optimize process.
   - **Deliverables** list — what the client receives and **owns** (source, data, docs).
   - Honest proof line — "Ask us for references and a live walkthrough" (no invented metrics).
   - `FAQPage` — 4–6 real buyer questions, marked up with `FAQPage` schema and keyboard-accessible buttons (`aria-expanded`).
   - CTA band → `contact.html`.

### Per-page content outlines

**software.html — Custom Software & Web Applications**
- Hero: "Software That Fits How You Actually Work."
- Blocks: (a) Custom Web Applications, Internal Business Tools, Customer/Employee Portals, Legacy/Spreadsheet Replacement; (b) `#apps` — iOS/Android/PWA apps, app-store deploy, maintenance; (c) How we work; Deliverables (source + ownership).
- FAQ: build-vs-buy, cost drivers, timeline, do I own the code, what stack, ongoing maintenance.
- Schema: `Service` (serviceType "Custom software development").

**dashboards.html — Business Dashboards & Reporting**
- Hero: "See Your Numbers in One Place."
- Blocks: Business/KPI dashboards, Admin dashboards, Automated reporting, Data connections/definitions.
- FAQ: what data can you connect, cost, do I need a database, who maintains it, real-time vs scheduled.
- Schema: `Service` ("Business intelligence dashboards"). Link the `demo-crm.html` concept as a labeled example.

**workflow-automation.html — Workflow Automation & Integrations**
- Hero: "Stop Re-Keying Data. Automate the Busywork."
- Blocks: Cross-app automation, API integrations, Data/reporting pipelines, Monitoring/alerting.
- FAQ: what tools can you connect, is it reliable, what if an integration breaks, cost, examples.
- Schema: `Service` ("Workflow automation").

**web-design.html — Websites & Funnels** (moves depth out of `services.html#web`)
- Hero: "Websites Built to Convert — and to Maintain."
- Blocks: Custom sites, Lead funnels, Booking/calendar, Hosting & maintenance.
- FAQ: cost, timeline, do I own it, SEO included, hosting/maintenance.
- Schema: `Service` ("Web design and development").

---

## 4. Navigation & internal-linking integration (no overcrowding)

Current top nav (7 items) is full: **Services · Automation · Security · Work · Pricing · About · Contact.** Do **not** add six more.

- Keep `services.html` as the **hub** that overviews every line and links out to the deep pages.
- Recommended: keep flat nav; make `services.html` the mega-hub with clear cards to each deep page. (Optional later: a "Services ▾" dropdown.)
- Repoint homepage service tiles' "Learn more →" from section anchors (`services.html#software`) to the dedicated pages once built.
- Footer "Services" column already lists Websites / Software & Apps / Dashboards / Automation / Security — repoint to deep pages when built.
- Add contextual cross-links: security → software ("we can also build it securely"), software → dashboards, automation → software, etc.

---

## 5. Schema plan

| Page | Primary schema | Notes |
|------|----------------|-------|
| Home | `ProfessionalService` (done) | Add `hasOfferCatalog` referencing service pages later. |
| Each service page | `Service` + `FAQPage` | serviceType per page; provider = Organization. |
| services.html hub | `Service` (done) or `OfferCatalog` | List each service line. |
| Breadcrumbs | `BreadcrumbList` | Add once pages nest under Services. |

---

## 6. Phasing

- **Phase A (done):** services introduced honestly (tiles, sections, security page).
- **Phase B (next, low risk):** build `software.html`, `dashboards.html`, `workflow-automation.html`, `web-design.html` from the template (capability content, no fabricated proof), add to sitemap, repoint links, add `FAQPage` schema. ~4 pages.
- **Phase C (needs owner proof):** add real case studies, screenshots, logos, metrics; add `BreadcrumbList`; add `hasOfferCatalog` on home.
- **Phase D (AI Systems):** promote AI from a section to a page only once there's a concrete, shippable example to show.

---

## 7. Owner inputs required before Phase C

1. At least one real, permissioned example per line (even an internal tool or anonymized build).
2. Real client names/logos/testimonials with permission.
3. Confirmed cybersecurity capability + any partner for Group B/C work (see audit §9).
4. Real pricing ranges for custom work (or "quote-based" confirmed).
