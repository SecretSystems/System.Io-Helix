# Phase 2 — Content & Topical Authority Strategy

**Prepared:** 2026-07-18 · **Status:** Strategy only — nothing here is implemented yet
**Supersedes/absorbs:** `content-architecture.md` (cluster plan) and extends `new-services-roadmap.md` (page templates). Where they conflict, this document wins.
**Ambition:** #1 software, automation, and cybersecurity company website in Louisiana within 3–5 years, built on genuine topical authority — not page volume.

**Standing constraints (carried from Phase 1):**
- No fabricated proof, stats, testimonials, or credentials. Ever.
- Cybersecurity stays in review/advisory framing (audit §9 Group A) until owner proves more.
- Preserve the visual identity; changes only where usability clearly improves.
- Depth over volume. A page ships only when it's the best answer in the market for its query.
- **Validation pending:** keyword-demand figures are deliberately qualitative (high/med/low). Authorize the Ahrefs connector (claude.ai settings) in Phase 2A to attach real volumes/difficulty before building 2B pages.

---

# STEP 1 — Content Audit & Gap Analysis

## 1.1 Current inventory (13 indexed-or-live pages)

| Page | Role | Depth | Verdict |
|------|------|:-----:|---------|
| index.html | Brand + routing | Good | Strong after Phase 1; converts by routing |
| services.html | All-services hub | Medium | Covers 6 lines but sections, not pages — the biggest structural gap |
| automation.html | Marketing-automation pillar | Good | Only true deep service page besides security |
| security.html | Cybersecurity pillar | Good | Honest scope; model template for all new pillars |
| catalog.html | A-la-carte pricing | Good | Unique differentiator vs. competitors (most hide pricing) |
| pricing.html | Plans + FAQ | Good | Retainer plans only; custom-work pricing content missing |
| work.html | Demo gallery | Weak proof | Labeled demos; no real case studies |
| about.html | Company story | Weak EEAT | No founder, no team, no photos, no history |
| contact.html | Conversion | Good | Honest form; needs live endpoint |
| privacy/terms/accessibility | Legal/trust | Adequate | Done |
| vault.html | Gimmick (noindex) | n/a | Fine as an easter egg |
| sites/* (41 demos) | Concept demos (robots-blocked) | n/a | Reusable as labeled visual proof |

**Content engine:** none. Zero articles, zero resources, zero case studies. The domain currently has ~9 indexable commercial pages and nothing that earns links or answers research-stage queries.

## 1.2 What best-in-class competitors cover that we don't

Benchmarked against the standard coverage model of leading custom-dev firms, automation consultancies, MSSP/security firms, and regional agencies:

| # | Coverage area | They have | We have | Gap severity |
|---|---------------|-----------|---------|:---:|
| 1 | One deep page per service line | 6–15 service pages | 2 of ~6 | **Critical** |
| 2 | Industry/vertical pages ("software for X") | 5–20 | 0 | **Critical** |
| 3 | Real case studies with outcomes | 5–50 | 0 | **Critical** (owner-gated) |
| 4 | Founder/team/EEAT surface (bios, photos, credentials) | Always | None | **Critical** (owner-gated) |
| 5 | Cost/pricing guides for custom work ("how much does X cost") | Common among winners | None | High |
| 6 | Educational blog / insights engine | 30–300 articles | 0 | High |
| 7 | Local landing content + Google Business Profile | Standard for regional firms | None (no GBP found) | **High — cheapest big win** |
| 8 | Comparison/decision pages (build-vs-buy, X-vs-Y, "best X in LA") | Common | 0 | High |
| 9 | Process/methodology page (standalone, detailed) | Standard | Section on About only | Medium |
| 10 | Tech-stack / "how we build" page | Common for dev firms | 0 | Medium |
| 11 | FAQ hub + per-page FAQ schema | Standard | 2 pages only | Medium |
| 12 | Resource center: glossary, checklists, templates, calculators | The authority moat | 0 | Medium (Phase 2E) |
| 13 | Security-practices/trust page ("how we protect client work") | Security-adjacent firms | 0 | Medium |
| 14 | Video walkthroughs/demos | Growing standard | 0 | Low (later) |
| 15 | Careers page | Larger firms | 0 | Skip — honest small-studio positioning instead |

**The one-sentence gap analysis:** we have a credible shell with two real pillars; competitors win because every service line, industry, question, and proof-point has its own best-in-class page — that's the machine Phase 2 builds.

---

# STEP 2 — Topical Authority Map (Silos)

Seven silos: your six, plus **Industries/Local** as a horizontal silo that cross-links into all others (this is how a Louisiana firm beats national content farms — they can't credibly write "for Lafayette contractors").

```
SECRET SYSTEMS TOPICAL MAP
│
├─ 1. SOFTWARE DEVELOPMENT  (money silo #1)
│    Custom Software · Internal Business Software · Legacy Modernization
│    API Integrations · SaaS/Product Development · Database Design
│    Business Process Software · Customer & Employee Portals
│
├─ 2. APP DEVELOPMENT
│    iPhone Apps · Android Apps · Cross-Platform · PWAs
│    Internal Employee Apps · Customer Portal Apps · App Maintenance
│
├─ 3. AUTOMATION  (existing strength — GHL heritage)
│    Workflow Automation · CRM Automation · AI Assistants · Lead Routing
│    Document Automation · Scheduling Automation · Call Center Automation
│    API/Integration Automation · Reporting Automation
│
├─ 4. CYBERSECURITY  (advisory-scoped)
│    Security Reviews · Security Hardening · Secure Web Development
│    Secure Software Development · Website Security · Small-Business
│    Cybersecurity · Backup & Recovery · Security Policies & Readiness
│
├─ 5. DASHBOARDS  (differentiator silo — low competition)
│    Executive · Operations · KPI · Financial · CRM Dashboards
│    Fire Department / Public-Safety Dashboards ⚑ · Field-Service Dashboards
│
├─ 6. WEB DEVELOPMENT  (highest existing demand)
│    Business Websites · Local SEO Websites · Landing Pages & Funnels
│    Ecommerce · Website Maintenance · Website Redesign · Enterprise/Multi-site
│
└─ 7. INDUSTRIES & LOCAL  (horizontal)
     Home Services (HVAC/roofing/plumbing/landscaping) · Med Spas & Clinics
     Law Firms · Field Services & Trades · Fire Departments / Public Safety ⚑
     Lafayette · Acadiana · Louisiana statewide
```

**⚑ Fire Department Dashboards — strategic note.** This appears twice deliberately: it's a potential **blue-ocean vertical** (response-time analytics, NFIRS reporting, apparatus maintenance logs, shift scheduling — almost no SMB-priced competition, natural public-sector referral loops, strong Louisiana angle). **`[Owner-confirm]`: is there a real fire-department relationship, project, or credible path to one?** If yes, it becomes a signature differentiator built early (2B) with a real story. If no, it stays a Phase 2C research topic — we do not fake public-safety expertise.

---

# STEP 3 — Per-Silo Architecture

Every pillar uses the `security.html` template (audit-approved chrome, scope honesty, FAQ buttons with `aria-expanded`, `Service` + `FAQPage` schema, honest proof line). URLs stay flat `.html` (established convention); articles live under `/insights/`. Articles marked * are the cornerstone set.

### Silo 1 — Software Development
- **Pillar:** `software.html` — "Custom Software & Web Application Development"
- **Supporting pages (build over time, each only when it can be deep):** `internal-business-software.html` · `legacy-software-modernization.html` · `api-integrations.html` · `customer-portals.html` · `database-design.html`
- **Blog articles:** Build vs. Buy* · What custom software costs in 2026* · Spreadsheet→software signs* · Owning your source code* · How we scope a project* · Realistic small-project timeline · Internal tools vs. SaaS cost-over-time · Modernize vs. rebuild · What a discovery phase produces · Fixed-bid vs. time-and-materials, honestly
- **FAQ opportunities:** cost drivers, ownership, stack, timeline, maintenance, "can you take over an existing codebase," NDA/IP handling
- **Internal links:** pillar ⇄ all supports; articles ↑ pillar; cross to Dashboards ("your software should report on itself"), Security ("built securely"), Automation
- **Schema:** `Service` (serviceType "Custom software development") + `FAQPage`; `BreadcrumbList` once nested
- **Conversion:** "Book a build consult" · scoped-estimate CTA · mid-page "What you'll own" deliverables box (differentiator) · cost-guide lead-in

### Silo 2 — App Development
- **Pillar:** section `software.html#apps` first → promote to `app-development.html` when an app exists to show `[Owner-confirm]`
- **Supporting:** `progressive-web-apps.html` (PWA-vs-native is a winnable decision query) · employee-apps and customer-portal-apps as sections until proof
- **Blog:** App or better website?* · PWA vs. native for small business · What app-store deployment involves · App maintenance costs · Why internal apps fail (and how to spec one that won't)
- **FAQ:** iOS+Android both? · cost range · app-store approval · updates/ownership · offline capability
- **Links:** ↑ Software pillar; cross to Dashboards (mobile dashboards), Automation (app + workflow)
- **Schema:** `Service` + `FAQPage`
- **Conversion:** decision-framework CTA ("Not sure app vs. web? Take the 5-question check → contact")

### Silo 3 — Automation
- **Pillar (exists):** `automation.html` — keep as marketing-automation pillar; **add** `workflow-automation.html` as the ops-automation pillar (distinct intent: internal ops vs. lead-gen)
- **Supporting:** `crm-automation.html` (GHL heritage — easiest authority) · `document-automation.html` · `ai-assistants.html` (concrete, scoped: summarize/classify/draft/route — no AGI hype)
- **Blog:** Practical workflow automation for service businesses* · What API integration really involves · Cost of slow lead response · Measuring whether automation works · Document automation: quotes, invoices, contracts · Scheduling automation that reduces no-shows · When NOT to automate
- **FAQ:** which tools connect · reliability/monitoring · what breaks and who fixes it · cost model
- **Links:** two pillars cross-link with clear intent labels; ↑ from Software (custom automation) and ↓ to CRM/AI supports
- **Schema:** `Service` + `FAQPage`; `HowTo` on process articles
- **Conversion:** "Automation audit" offer (list your 5 most repetitive tasks → we reply with what's automatable) — high-intent, low-friction

### Silo 4 — Cybersecurity
- **Pillar (exists):** `security.html`
- **Supporting:** `website-security.html` (highest-volume entry query) · `small-business-cybersecurity.html` (broad TOFU pillar-lite) · secure-development stays a section on security + software pages
- **Blog:** SMB security basics checklist* · What a security review covers (and won't)* · Authentication done right · Backups: the untested-restore problem · Vendor risk: vetting your SaaS · Phishing: what your team actually needs to know · What "built securely" should mean
- **FAQ:** already strong; extend with cost, frequency ("annual review?"), insurance questions
- **Links:** ↑ security pillar; heavy cross-links FROM every build silo ("we build it securely — here's what that means")
- **Schema:** `Service` + `FAQPage`; articles as `Article`
- **Conversion:** "Request a security review" + downloadable self-check checklist (2E) as email-capture
- **Guardrail:** all content stays review/advisory-framed; no pentest/compliance-certification claims

### Silo 5 — Dashboards
- **Pillar:** `dashboards.html` — "Business Dashboards & Reporting"
- **Supporting:** `kpi-dashboards.html` · `financial-dashboards.html` · **`fire-department-dashboards.html`** ⚑ (only if owner confirms — see Step 2) · executive/operations as pillar sections initially
- **Blog:** What a dashboard costs* · Dashboards managers actually use · Data you should track · Real-time vs. scheduled reporting · Excel-to-dashboard migration · The 5 numbers every service-business owner should see weekly
- **FAQ:** data sources · maintenance · real-time? · do I need a database first · who defines the metrics
- **Links:** ↑ pillar; cross from Software (portals report), Automation (automated reporting); demo-crm.html linked as a **labeled concept demo**
- **Schema:** `Service` + `FAQPage`
- **Conversion:** "See a demo" (reuse demo-crm concept, clearly labeled) — strongest show-don't-tell asset we already own

### Silo 6 — Web Development
- **Pillar:** `web-design.html` — moves depth out of `services.html#web`
- **Supporting:** `landing-pages.html` (funnels — GHL heritage) · `website-maintenance.html` (recurring-revenue page, weak competition) · `website-redesign.html` (high buyer intent) · ecommerce as a section until real proof `[Owner-confirm]` any ecommerce delivered
- **Blog:** What "SEO-ready" should mean* · Choosing a web partner: questions to ask* · Redesign vs. refresh · What website maintenance actually includes · Why your site needs to load in under 3 seconds (with our own 204MB→9.7MB story as the case study — real, ours, provable)
- **FAQ:** cost, timeline, ownership, hosting, CMS-vs-custom, SEO included?
- **Links:** ↑ pillar; the natural top-of-funnel silo — every other silo's "first project" entry point
- **Schema:** `Service` + `FAQPage`
- **Conversion:** free homepage teardown offer (5-point review of their current site) — high-converting, effort-bounded, honest

### Silo 7 — Industries & Local
- **Hub:** section on `services.html` first → `industries/` directory when ≥3 pages exist
- **Pages (proof-gated order):** `home-services.html` (demo sites = visual proof today) · `med-spas.html` · `law-firms.html` · `fire-departments.html` ⚑ · **local:** `lafayette-software-development.html` (one page, done excellently — not a doorway-page farm)
- **Blog:** Systems for a growing HVAC company · Med-spa booking + reputation stack · What Lafayette businesses should pay for a website
- **Schema:** `Service` + `LocalBusiness` reinforcement; GBP is the real lever (Step 6, 2A)
- **Conversion:** industry-specific CTAs referencing recognizable workflows ("dispatch board," "treatment-room calendar")
- **Guardrail:** one industry page requires at least one honest proof element (a labeled demo counts; an invented client does not)

---

# STEP 4 — Navigation Hierarchy (usability-gated)

**Verdict: the current 7-item top nav survives Phase 2 mostly unchanged.** It's clean, and Lighthouse-verified. Changes only where page-count forces them:

```
NOW (keep):      Services · Automation · Security · Work · Pricing · About · Contact
AFTER 2B:        Services ▾ · Automation · Security · Work · Pricing · About · Contact
                 └─ dropdown: Websites / Software & Apps / Dashboards / Automation / Security / All Services
AFTER 2C adds:   footer gains "Insights" column (nav unchanged — blog doesn't earn top-nav until it earns traffic)
```

Rules:
1. `services.html` remains the hub; every pillar is reachable in ≤2 clicks from home forever.
2. A dropdown is added **only** when pillar pages exist (post-2B) — never for anchor links. Keyboard-accessible (`aria-expanded`, arrow keys) and hover+click both.
3. Breadcrumbs (`BreadcrumbList`) appear on supporting pages and articles only — pillars stay top-level.
4. Footer becomes the full sitemap surface: Services column lists pillars; new Insights column post-2C; Industries column post-2C/D.
5. Mobile menu mirrors desktop exactly (current pattern preserved).
6. No mega-menu. At our page count it's decoration, not usability.

---

# STEP 5 — Page Priority List (scored)

Scoring: SEO impact / Revenue opportunity / Topical authority / Effort (1–5, effort inverted) → weighted composite (SEO 30%, Revenue 30%, Authority 25%, Ease 15%).

| Rank | Page / asset | SEO | Rev | Auth | Ease | Score | Notes |
|:---:|---|:-:|:-:|:-:|:-:|:-:|---|
| 1 | **Google Business Profile + `lafayette-software-development.html`** | 5 | 5 | 4 | 4 | 4.6 | Local pack = fastest real leads in market `[Owner: verify/claim GBP]` |
| 2 | **`software.html`** pillar | 5 | 5 | 5 | 3 | 4.6 | Anchor of the whole strategy |
| 3 | **`web-design.html`** pillar | 5 | 4 | 4 | 4 | 4.4 | Highest local demand; template exists |
| 4 | **About/EEAT upgrade** (founder, team, photos, story) | 3 | 4 | 5 | 4 | 3.9 | Unlocks trust for everything `[Owner: bios/photos]` |
| 5 | **`dashboards.html`** pillar | 4 | 4 | 4 | 4 | 4.0 | Low competition, demo asset exists |
| 6 | **`workflow-automation.html`** pillar | 4 | 4 | 4 | 4 | 4.0 | Completes the pillar set |
| 7 | Cost guides ×2 (custom software cost, website cost — articles) | 5 | 4 | 4 | 3 | 4.2 | The highest-converting content type in this industry |
| 8 | `website-maintenance.html` | 3 | 4 | 3 | 4 | 3.5 | Recurring revenue; weak SERPs |
| 9 | `home-services.html` industry page | 4 | 4 | 4 | 3 | 3.8 | Demo sites = ready visual proof |
| 10 | First case study (real, permissioned) | 3 | 5 | 5 | 2 | 3.8 | **Blocked on owner proof** — chase this hardest |
| 11 | `crm-automation.html` | 3 | 3 | 4 | 4 | 3.4 | Easiest genuine expertise on the site |
| 12 | `website-security.html` | 4 | 3 | 4 | 3 | 3.5 | Security silo's traffic engine |
| 13 | Insights hub + article template | 4 | 2 | 4 | 4 | 3.4 | Prerequisite for all 2C |
| 14 | `fire-department-dashboards.html` ⚑ | 3 | 3 | 5 | 3 | 3.4 | Jumps to ~top-5 **if** owner confirms the vertical |
| 15 | `landing-pages.html` | 3 | 3 | 3 | 4 | 3.2 | GHL heritage makes it easy |

---

# STEP 6 — Phased Roadmap

### Phase 2A — Quick wins (foundation for authority) — ~1 session + owner homework
| Task | Type | Owner input? |
|---|---|---|
| Claim/verify **Google Business Profile**; align NAP with site | Off-site | **Yes — access/verify** |
| Authorize **Ahrefs connector**; validate every Step 3 keyword target; re-rank Step 5 if data disagrees | Research | Yes — one click |
| **About/EEAT upgrade:** founder name, bio, photo, real history, "why Secret Systems" | On-page | **Yes — bios/photos** |
| Set `FORM_ENDPOINT` + `GA4_ID` (still dormant — leads/analytics off) | Config | **Yes — values** |
| Add `Person` schema (founder) + `sameAs` (real profiles only) to Organization schema | Schema | Yes — profile URLs |
| FAQ schema pass: mark up existing security + pricing FAQs as `FAQPage` | Schema | No |
| Internal-link pass on existing 9 pages using Step 3 map (descriptive anchors) | On-page | No |
| Search Console: verify, submit sitemap, baseline positions | Measurement | Yes — access |
| Decide ⚑ fire-department vertical (yes/no/explore) | Strategy | **Yes** |

**Exit criteria:** GBP live · analytics + forms live · EEAT surface real · keyword data attached to this doc.

### Phase 2B — High-value service pages — ~4–6 build sessions
Build order: `software.html` → `web-design.html` → `dashboards.html` → `workflow-automation.html` → `lafayette-software-development.html` (+ `fire-department-dashboards.html` if confirmed). Each: security.html template · `Service`+`FAQPage` schema · sitemap + nav/footer rewiring · homepage tiles repointed from anchors to pages · Lighthouse + regression gate before push (established pipeline).
**Exit criteria:** every silo has a true pillar; Services dropdown ships; all Phase-1 anchor links upgraded.

### Phase 2C — Educational content — ongoing, 1–2 articles/week max
Insights hub + article template first (with `Article` schema, author = real founder from 2A). Then the starred (*) articles: the 2 cost guides first, then decision-stage pieces (Build-vs-Buy, App-or-Website, Security review expectations…). Every article: one buyer question, owner's real expertise injected, ↑ pillar link, contextual CTA. **Cadence discipline: an article that isn't the best answer available doesn't ship.**
**Exit criteria:** 10 cornerstone articles live; each pillar has ≥2 supporting articles; first organic non-brand clicks in GSC.

### Phase 2D — Case studies — gated entirely on owner proof
Format per study: client (named, permissioned) · problem · what we built (screenshots) · honest outcome (real numbers or none) · pull-quote testimonial. Minimum viable: **one** excellent study beats five thin ones. Also: the **204MB→9.7MB performance story is publishable today** as a first-party technical case study — real, ours, verifiable in git history.
**Exit criteria:** ≥1 real client study + the performance story live; Work page links studies above demos.

### Phase 2E — Resource center — the moat
Glossary (plain-English software/security terms — internal-link goldmine) · self-service checklists (security self-check, website launch, automation-readiness — email-capture assets) · calculators/tools (project cost estimator, "what's your slow-lead-response costing you") · downloadable templates (project brief, vendor questions). Built only after 2B/2C prove traffic — resources amplify authority, they don't create it.
**Exit criteria:** resource pages earning links/captures; glossary interlinked from articles.

---

# STEP 7 — Deliverables Summary & Measurement

This document contains: content audit (§1.1) · gap analysis (§1.2) · site architecture (§2–3) · SEO strategy (§3 per-silo + schema + local) · internal linking plan (§3 per-silo rules + 2A link pass) · page priority list (§5) · implementation roadmap (§6).

**Measurement plan (review monthly once 2A completes):** GSC non-brand clicks & queries per silo · local-pack visibility for "software/web/app + Lafayette" terms · form submissions by source page (GA4 events) · pillar-page conversion rate · article→pillar assisted paths.

**Consolidated owner-input list (everything strategy is waiting on):**
1. GBP access/verification. 2. Founder/team bios + photos + real history. 3. `FORM_ENDPOINT` + `GA4_ID`. 4. Ahrefs + Search Console authorization. 5. Fire-department vertical: real or not. 6. Real social profile URLs (or none). 7. First permissioned client for a case study. 8. Any ecommerce/app actually delivered (gates those pages). 9. Ducharme WIP decision (unrelated, still parked).

*Nothing in this phase document has been implemented. Next action: Phase 2A, starting with the owner-input list above.*
