# Secret Systems — Production Implementation Roadmap

**Derived from:** `docs/secret-systems-website-audit.md`
**Created:** 2026-07-17
**Principle:** Preserve the existing visual identity. Fix broken fundamentals, remove hype, add the new service lines honestly, and only publish claims and contact data that are true.

Legend: ✅ safe to build without owner input · 🔒 blocked on owner-only data · ⚠️ requires a claims/scope decision

---

## Phase 1 — Cleanup + expansion without redesign (this engagement)

### A. Trust & honesty (copy)
- ✅ Remove all fabricated statistics (`3× booking`, `60s response`, `98% open rate`, `14→97 reviews`, about-page stat tiles, demo `680+/4.9★/12yr/100%`).
- ✅ Remove initials-only, unverifiable testimonials (homepage) — section removed until real ones exist.
- ✅ Remove fake credentials/serials (`CLASS IV CERTIFIED · SN:2025-0001`, "VAULT ACCESS ACTIVE").
- ✅ Rewrite AI-slop headings/CTAs into direct, specific, human copy (§7 of audit).
- ✅ Reframe `work.html` from "every site we've built" → clearly-labeled concept demos.
- 🔒 Replace removed testimonials/stats with **real, permissioned** ones — later, when supplied.

### B. Contact & lead capture
- 🔒 Real contact email displayed + form destination.
- 🔒 Real phone (click-to-call).
- 🔒 Form delivery mechanism (form service endpoint / webhook / mailto).
- ✅ Make the form honest in the interim (no fake "Message Received!" without a real send).
- ✅ Consistent NAP block in shared footer once values are confirmed.

### C. New service lines (honest, scoped)
- ✅ Add **Software Development**, **App Development**, **Dashboard Development**, **Workflow Automation** as first-class services.
- ✅ Introduce **Cybersecurity** responsibly — Group A (review/advisory) framing only, with an explicit scope box ("review & advisory, not penetration testing, no security guarantee"). No certifications/compliance claims.
- ✅ Restructure homepage service grid + nav grouping so the site doesn't feel overcrowded.
- ⚠️ Each new line presented as an **offered service** (what we build / problem / deliverables / process), not with invented client results.

### D. Technical SEO
- ✅ Homepage + catalog: add meta description, canonical, Open Graph, Twitter, and `Organization`/`LocalBusiness` JSON-LD.
- ✅ Fix `pricing.html` `PriceSpecification` → proper `Product`/`Offer` (or `OfferCatalog`).
- ✅ `noindex` the vault + all `sites/*` demo pages; `robots.txt` disallow `/sites/` and stale files.
- ✅ Rebuild `sitemap.xml` (real pages only, correct `lastmod`, add new service pages, drop vault/demos).
- ✅ Add favicon + a branded OG image + web manifest.
- 🔒 GA4 / privacy-first analytics + Search Console verification (needs IDs).

### E. Accessibility & performance baseline
- ✅ Remove `cursor:none`; add visible `:focus-visible` states.
- ✅ Global `prefers-reduced-motion` block (disables particle canvas, tickers, glow, vault animation).
- ✅ Make FAQ and other `div onclick` controls real `<button>`s with `aria-expanded`.
- ✅ Associate/label all form fields; `aria-hidden` decorative emoji; add hero text alternative.
- ✅ Raise low-contrast token usage where it fails AA.
- ✅ Remove the forced 5-second homepage loader delay (reveal as soon as ready).
- ⚠️/✅ Reduce hero weight: gate the 204 MB frame set behind reduced-motion + lazy strategy now; full replacement with a compressed video is a fast-follow (large asset work).

### F. Repo hygiene
- ✅ Delete stale public files: `index (21).html`, `index.html Original`, `index.html test`, `frames/test`.
- ✅ Resolve the `Ducharme-landscaping.html` / `ducharme-landscaping.html` case-collision.
- ✅ Fix the invalid `sites/sites-index.json` (or remove the orphan).
- ⚠️ Do **not** commit the pre-existing uncommitted `sites/Ducharme-landscaping.html` change as part of this work unless confirmed.

### G. Legal
- ✅ Create `privacy.html` + `terms.html` + `accessibility.html`, linked in the footer (required before analytics/forms go live). Drafted for owner/legal review — not legal advice.

### Testing & release gate (before push)
- ✅ HTML validity + no broken internal links.
- ✅ Every page renders with the shared header/footer/nav and consistent design tokens.
- ✅ Forms behave honestly (real send or honest fallback — no fake success).
- ✅ `robots.txt` / `sitemap.xml` / canonicals cross-check.
- ✅ Keyboard + reduced-motion smoke test.
- ✅ `git` stages only intended files; commit; **push only after all checks pass**.

---

## Phase 2 — Core service pages (next)
Full standalone pages for Web, Software, Dashboards, Automation, Security; de-hyped About with real team; `FAQPage` schema. Requires owner proof + ≥1 real example per line.

## Phase 3 — Long-form content
Blog hub + Article schema + the first 10 articles (audit §13). Requires owner expert input per article.

## Phase 4 — Proof & conversion
Real case studies, screenshots, testimonials/logos, conversion event tracking, CTA A/B testing, booking widget.

---

## Owner-only blockers for Phase 1 completion & push
1. Contact **email** to display + route the form to.
2. Contact **phone** (click-to-call) — or confirm none yet.
3. **Form delivery** method (form service endpoint / GHL webhook / mailto).
4. **Analytics** (GA4 Measurement ID / privacy-first / none yet).
5. Confirmation to **remove** fabricated testimonials/stats (no real replacements available yet).
