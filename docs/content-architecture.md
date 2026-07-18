# Content Architecture & Topical Authority Plan

**Goal:** Make secretsystems.io the obvious, credible answer when a South-Louisiana (and remote US) small/mid-size business searches for websites, custom software, dashboards, automation, or security — using a pillar-and-cluster model that builds topical authority without thin content.

**Positioning anchor:** "Louisiana software & systems studio." Every piece of content should reinforce that Secret Systems builds and maintains real working systems (not just marketing).

---

## 1. Site architecture (money pages = pillars)

```
Home
├── Services (hub)
│   ├── Websites & Funnels            [pillar]  → web-design.html
│   ├── Custom Software & Apps        [pillar]  → software.html (#apps)
│   ├── Business Dashboards           [pillar]  → dashboards.html
│   ├── Workflow Automation           [pillar]  → workflow-automation.html
│   ├── Automation & AI (marketing)   [pillar]  → automation.html
│   └── Cybersecurity                 [pillar]  → security.html
├── Work (demos / case studies)
├── Pricing
├── About
├── Contact
├── Insights (blog hub)               [content engine]
│   └── /insights/<article>
└── Legal: privacy, terms, accessibility
```

Each **pillar page** is the authority hub for its topic. Each **cluster article** targets one specific question and links up to its pillar; the pillar links down to its best articles. This internal-link structure is what earns topical authority.

---

## 2. Topic clusters (pillar → supporting articles)

### Cluster A — Custom Software & Apps (pillar: software.html)
1. Build vs. Buy: when a small business should build custom software (and when not).*
2. How much does a custom web app cost in 2026? A straight breakdown.*
3. Spreadsheet to software: signs you've outgrown your spreadsheets.*
4. Do you need an app, or just a better website? A decision framework.*
5. Owning your software: source code, data, and why it matters.*
6. How we scope a software project: from idea to estimate.*
7. Internal tools vs. off-the-shelf SaaS: a cost-over-time view.
8. A realistic timeline for a small software project.
9. Customer portals: when self-service pays for itself.
10. When to modernize vs. rebuild old software.

### Cluster B — Dashboards & Data (pillar: dashboards.html)
1. What a business dashboard actually costs — and what drives the price.*
2. Dashboards managers actually use: design principles.
3. Data you should be tracking (and where it usually hides).
4. Real-time vs. scheduled reporting: which do you need?
5. Reporting automation: reclaiming hours every month.

### Cluster C — Workflow Automation (pillar: workflow-automation.html)
1. A practical guide to workflow automation for local service businesses.*
2. What API integration really involves.
3. The real cost of slow lead response (and how to fix it).
4. How we measure whether an automation is working.
5. Automating lead follow-up without sounding like a robot.

### Cluster D — Cybersecurity (pillar: security.html)
1. Website security basics every small business should check this year.*
2. What to expect from a website security review (and what it won't do).*
3. Authentication done right for small-business apps.
4. Backups and recovery: a small-business checklist.
5. Secure software development: what "built securely" should mean.
6. Vendor risk: vetting the SaaS tools your business depends on.

### Cluster E — Websites (pillar: web-design.html)
1. How to choose a software/web partner (questions to ask).
2. What "SEO-ready" should actually mean for a small-business site.
3. Booking & scheduling systems that reduce no-shows.

### Cluster F — Local / industry (pillar: Services hub + industry pages)
1. Web & software for home-service businesses (HVAC, roofing, plumbing).
2. Systems for a growing med spa / clinic.
3. "Software developer in Lafayette / Acadiana" — local landing content.

`*` = the first 10 to publish (highest commercial intent + decision support).

---

## 3. Keyword intent map (per pillar)

| Pillar | Head terms (informational→commercial) | Local modifier |
|--------|----------------------------------------|----------------|
| Software | custom software, web application development, internal business tools, replace spreadsheets | "…in Louisiana / Lafayette" |
| Dashboards | business dashboard, KPI dashboard, reporting dashboard, admin dashboard | + Louisiana |
| Automation | workflow automation, API integration, business process automation | + Louisiana |
| Security | small business security review, website security check, security hardening | + Louisiana |
| Websites | small business web design, lead funnel, booking website | + Lafayette/Acadiana |
| Marketing automation | GoHighLevel agency, AI lead follow-up, review generation | + Louisiana |

Do **not** target broad head terms alone (too competitive). Win the **specific, decision-stage long-tail** ("how much does a custom web app cost," "build vs buy small business software") where intent is high and Secret Systems can genuinely answer.

---

## 4. Internal linking rules (the authority engine)

1. Every article links **up** to its pillar with descriptive anchor text (e.g., "our [custom software](software.html) work").
2. Every pillar links **down** to its 3–5 strongest articles.
3. Articles in the same cluster link **sideways** where genuinely relevant.
4. Every article ends with a **contextual CTA** to the matching pillar/contact — not a generic "contact us."
5. Cross-pillar links where natural (software ↔ dashboards ↔ automation ↔ security).
6. Keep anchor text varied and descriptive; never "click here."

---

## 5. Content standards (protect credibility)

- One clear buyer question per article; answer it fully and honestly.
- Require **real expert input** from the owner (actual scoping process, real ranges, real methodology). Do not auto-generate.
- No fabricated stats. Cite industry sources for any external number; use owner-verified numbers for any claim about Secret Systems.
- Add `Article` (or `BlogPosting`) + `author`/`publisher` schema. Add `FAQPage` where an article has a Q&A block.
- Include a last-updated date; refresh cornerstone articles annually.
- Length follows the question, not a word count. Depth over volume — **do not publish large batches of thin content.**

---

## 6. Publishing cadence & priority

- **Phase 1 (foundation):** publish the 10 starred articles, one per week, each linked to a live pillar. This is enough to establish 4 clusters.
- **Phase 2:** fill out clusters B–E to 5 articles each.
- **Phase 3:** industry/local pages (Cluster F) + real case studies (needs owner proof).
- Measure: rankings for the target long-tail, assisted conversions from `/insights/`, and form submissions attributed to article traffic (once analytics + a form endpoint are live).

---

## 7. Prerequisites

1. `Insights` hub page + article template (reuse `security.html` chrome + a readable prose column).
2. `Article`/`BlogPosting` schema template.
3. Analytics live (`ss-config.js` → `GA4_ID`) and a working form endpoint (`FORM_ENDPOINT`) to measure conversions.
4. Owner interviews to source the expert detail each article needs.
