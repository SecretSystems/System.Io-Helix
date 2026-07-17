# Secret Systems Website Audit

**Prepared:** 2026-07-17
**Repository:** `SecretSystems/System.Io-Helix` (branch `main`)
**Live site:** https://secretsystems.io/
**Scope:** Read-only analysis. No files were edited, committed, pushed, or deployed. This report is a planning document for the next implementation phase.

**Verification labels used below:** `[Unknown]`, `[Missing]`, `[Owner-confirm]` (requires owner confirmation), `[Proof-required]` (requires credentials/proof), `[Test-required]` (requires live technical testing).

---

## 1. Executive Summary

Secret Systems is a South-Louisiana digital-marketing and automation agency built almost entirely around **GoHighLevel (GHL)**: web design, CRM setup, AI lead follow-up, SMS blasts, review generation, call-center automation, and ads, sold as monthly retainers ($497 / $997 / $1,997) plus an à-la-carte catalog.

The site has a **genuinely strong and distinctive visual identity** — a cohesive "vault / cyber-infrastructure" aesthetic (deep navy‑black, cyan accent, Syne + JetBrains Mono + Outfit typography, scanline overlay, animated hero). That identity is worth preserving and is the main asset.

Underneath the visuals, the site has **serious, business-critical problems**:

1. **No lead actually reaches the company.** Every form on the site (homepage, contact page, portfolio modal) is fake — client-side validation followed by a "success" message, with **no submission, no email, no backend, no integration**. There is also **no phone number and no email address** anywhere on the main site. The primary business goal — capturing leads — is completely broken.
2. **The copy is heavy AI-style marketing hype** ("your business runs itself," "while you sleep," "no human needed," "unfair advantage," "3× booking increase," "98% open rate," fake "real-time" terminals) with fabricated statistics and initials-only testimonials.
3. **The portfolio presents ~41 fictional demo templates as delivered client work** ("every site we've built"), complete with fake 555 phone numbers, invented reviews/ratings, and stock photos — a credibility and misrepresentation risk.
4. **Severe performance and technical debt:** a ~204 MB folder of 145 full-size PNG hero frames, a forced 5-second loader, 41 simultaneously-loaded `<iframe>`s on the Work page, no analytics, an incomplete/stale sitemap, a homepage with zero SEO metadata, a plaintext "vault" PIN (`1234`) in client source, stale duplicate files deployed publicly, and a case-collision file pair.

The current services (web + GHL marketing automation) do **not** yet include cybersecurity, app/software development, dashboards, internal business systems, or workflow automation as first-class offerings. Those are additive and fit the "systems / infrastructure" brand well — but they should be introduced with disciplined, provable claims, especially for cybersecurity.

**Recommendation:** Do a surgical cleanup that keeps the design, fixes the broken fundamentals (working lead capture, honest copy, real proof), then expand into the new service lines in phases. Do **not** rebuild the site.

---

## 2. Current Website Positioning

**As-is positioning (one paragraph):** Secret Systems presents itself as an all-in-one "digital infrastructure" agency for small and mid-size local service businesses — the company that builds "every system your business needs under one roof": a website, a GoHighLevel CRM, AI lead follow-up, SMS/email campaigns, review generation, call-center automation, and paid ads. The promise is that the business will "run itself" and "grow without limits" on autopilot, sold as tiered monthly retainers. The tone is aggressive, hype-forward, and technology-flavored ("Next-Gen Digital Infrastructure," "The Systems Behind Your Growth"), leaning on a cinematic vault/hacker aesthetic to imply sophistication.

- **What it sells:** GoHighLevel-centric marketing automation + web design + reputation/ads, as managed monthly services.
- **Who it targets:** Owner-operated local service businesses (HVAC, roofing, plumbing, med spa, landscaping, etc.), primarily in South Louisiana and "nationwide remote."
- **Primary offer:** The $997/mo "Growth" plan (flagged "Most Popular").
- **Primary CTA:** "Get Access" / "Start Building" / "Book a Free Strategy Call" → the contact form.
- **What makes it appear credible:** Polished, consistent visual design; a specific tech stack (GoHighLevel); a clear process; transparent published pricing; a large-looking portfolio.
- **What weakens credibility:** Fabricated stats and testimonials; fake portfolio "clients"; no real contact details; broken forms; hype language; a gimmicky "classified vault" that any visitor can bypass.

**Recommended positioning statement (direction, not final copy):**

> Secret Systems is a Louisiana-based software and systems studio. We build the websites, applications, dashboards, automations, and security practices that small and mid-size businesses actually run on — designed, built, and maintained by a team you can reach. Fewer buzzwords, more working software.

This widens the brand from "marketing-automation agency" to "software + systems studio," which is what makes the new cybersecurity and app/software lines coherent instead of bolted-on. It also trades hype for a claim the company can prove.

---

## 3. What Should Be Preserved

- **The visual identity in full:** color tokens (`--void`, `--cyan`, `--card`, borders), the Syne/JetBrains Mono/Outfit type system, the eyebrow-label pattern, card and section rhythm, the cyan-accent-on-dark look. This is the brand and it is good.
- **`ss-shared.css` / `ss-shared.js` as the design system.** They are a reasonable component library (nav, buttons, cards, pricing, testimonials, footer, form fields). Keep and extend them; make the homepage use them too (see §4).
- **The multi-page static architecture on GitHub Pages.** For a site this size it is simple, cheap, fast to host, and easy to maintain. No framework migration is warranted.
- **The published, transparent pricing and the à-la-carte catalog concept.** Transparency is a differentiator; keep it (with honesty fixes).
- **The clear four/five-step process** (Discovery → Blueprint → Build → Launch → Optimize). It's concrete and reusable across the new service lines.
- **The demo-site building capability.** The `sites/` templates prove the team can ship polished, varied designs quickly — that's real, sellable evidence *if reframed honestly as demos/concepts* rather than "clients."

---

## 4. Primary Failure

**The website does not capture a single lead, and gives a visitor no way to contact the company.**

Every "form" is cosmetic:

- **Homepage (`index.html`)** contact section is a `<div>`, not a `<form>`. The "Send Message" button has no handler. Fields have no `name` attributes. Nothing happens on click.
- **`contact.html`** has a real `<form>` but `submitForm()` (lines 167–176) only runs client-side validation, then hides the form and shows a hard-coded "Message Received!" panel. **No `fetch`, no `action`, no email, no CRM push.** Submitted data (including "Approximate Monthly Revenue") is discarded.
- **`work.html`** "Request Your Website" modal does the same fake-success pattern.

Compounding it: there is **no phone number and no email address on any primary page.** The only contact affordances are a location string ("South Louisiana & Serving Nationwide"), a Facebook URL (`facebook.com/secretsystemsio` `[Owner-confirm]` whether it exists), and a "response within 24 hours" promise the site cannot keep because it never receives the message.

An agency that sells "we capture every lead automatically" currently **captures none of its own.** This is the first thing to fix and it outranks every other issue in this report.

---

## 5. Top 10 Urgent Problems

| # | Problem | Where | Priority |
|---|---------|-------|----------|
| 1 | All forms are fake (no submission/backend); no phone or email anywhere → zero lead capture | `index.html`, `contact.html:167`, `work.html` | Critical |
| 2 | Fabricated testimonials & statistics presented as fact ("3× booking," "14→97 reviews in 60 days," "98% open rate," fake "real example" terminals) | `index.html:1330-1344`, `about.html:94-97`, `automation.html:169-187`, `vault.html:739-743` | Critical |
| 3 | Portfolio presents ~41 fictional demos as real client work ("every site we've built"); fake 555 numbers, invented reviews under the live domain | `work.html`, `sites/*.html` | Critical |
| 4 | ~204 MB of 145 full-size PNG hero frames loaded on the homepage; forced 5-second loader | `frames/` (204 MB), `index.html:1541-1739` | Critical |
| 5 | Homepage has no meta description, canonical, Open Graph, or structured data | `index.html:1-9` | High |
| 6 | "Classified" vault gated by plaintext PIN `1234` in client JS; all "proprietary" content sits public in the DOM and is set to `index,follow` | `vault.html:829`, `:9` | High |
| 7 | 41 indexable fake-business pages (no `noindex`, no robots disallow) → thin/duplicate content + brand-confusion/misrepresentation risk | `sites/*.html`, `robots.txt` | High |
| 8 | Accessibility floor is failing: `cursor:none` site-wide, no `prefers-reduced-motion`, no visible focus states, FAQ not keyboard-operable, emoji icons unlabeled | `ss-shared.css:5`, all pages | High |
| 9 | Stale/junk files deployed publicly (`index (21).html`, `index.html Original`, `index.html test`, `frames/test`) and a case-collision pair (`Ducharme-landscaping.html` vs `ducharme-landscaping.html`) | repo root, `sites/` | High |
| 10 | No analytics and no conversion tracking of any kind; sitemap stale/incomplete (missing `catalog.html`, most `sites/`), `lastmod` frozen at 2025-04-11; `PriceSpecification` schema misused | site-wide, `sitemap.xml`, `pricing.html:12` | High |

---

## 6. Repository and Technical Architecture

### Plain-language overview

This is a **hand-coded static website** — no framework, no build step, no package manager, no dependencies. It is a set of `.html` files with inline `<style>`/`<script>` and two shared assets (`ss-shared.css`, `ss-shared.js`). It is hosted on **GitHub Pages** (the `CNAME` file points the repo at `secretsystems.io`). Deployment is "push to `main` → GitHub Pages serves the files." There is no server; everything runs in the browser.

There are effectively **two design systems in one repo**:

- **`index.html` is a self-contained monolith** (1,745 lines) with its own giant inline `<style>`, its own nav markup (`.nav-hamburger`, `#mobile-menu`), and its own inline JS (custom cursor, particle canvas, 145-frame scroll animation, forced loader).
- **Every other main page** (`about`, `services`, `contact`, `pricing`, `automation`, `catalog`, `vault`, `work`) links `ss-shared.css` + `ss-shared.js` and uses a *different* nav structure (`.hamburger`, `.mob`). Nav item ordering also differs between pages.

This split means "change the header/footer/nav" is currently a multi-file, two-pattern edit. Consolidating the homepage onto the shared system is a high-value, low-risk cleanup.

### Findings by requested item

| Item | Finding |
|------|---------|
| Framework / architecture | None. Static multi-page HTML. Vanilla CSS + vanilla JS. |
| Entry files | `index.html` (homepage, monolith). Live homepage confirmed via `git log` (`index (22).html` → `index.html`) and WebFetch. |
| Page structure | 9 primary pages: `index`, `services`, `automation`, `catalog`, `work`, `about`, `pricing`, `contact`, `vault`. Plus `sites/` (54 files: ~41 demo business sites + `demo-crm.html`, `demo-funnel.html`, JSON indexes). |
| Routing | Plain `.html` files, relative links. No router. |
| Styling | Design tokens as CSS custom properties in `:root`. Homepage inline; other pages via `ss-shared.css`. |
| JavaScript | Vanilla. Custom cursor, particle canvas (O(n²) link-drawing), IntersectionObserver reveals, scroll-driven frame animation, forced 5 s loader, fake form handlers, vault PIN logic, `work.html` 3D iframe scene. |
| Build process | **None.** |
| Package manager | **None** (no `package.json`, no lockfile, no `node_modules`). |
| Dependencies | Runtime: Google Fonts only (Syne, JetBrains Mono, Outfit). Demo sites also load Unsplash images. No JS libraries. |
| Deployment config | GitHub Pages via `CNAME` (`secretsystems.io`). One GitHub Action: `.github/workflows/update-sites.yml` regenerates `sites/index.json` on push to `sites/*.html` and commits/pushes back (`contents: write`). |
| Hosting platform | GitHub Pages. |
| Existing metadata | Inconsistent. `about`, `services`, `pricing`, `contact`, `automation`, `work`, `vault` have description/canonical/OG (+ some Twitter). **`index.html` and `catalog.html` have none** beyond `<title>`. |
| Structured data (JSON-LD) | Present on `about` (AboutPage/Organization), `services` (Service), `contact` (ContactPage), `work` (CollectionPage), `vault` (WebPage), `pricing` (**PriceSpecification — misused**). **Absent on `index.html`** and `catalog.html`. No Organization schema on homepage. |
| Sitemap | `sitemap.xml` lists 9 main pages + 11 of 54 `sites/`. **Missing `catalog.html`**, missing 43 `sites/` pages. `lastmod` frozen at `2025-04-11`. Includes `vault.html` (should not be indexed). |
| robots.txt | Allows all; references sitemap. Does **not** disallow `/sites/` or the vault. |
| Analytics | **None.** No GA4/gtag, GTM, Meta Pixel, Clarity, Hotjar, Plausible anywhere. |
| Forms | 3 fake forms (see §4). None submit. No backend/integration. |
| Integrations | **None live.** No booking widget, chat widget, CRM webhook, email service, or pixel — despite the site selling all of these. |
| Animations | Heavy: custom cursor, particle canvas (all pages), scanline overlay, scroll-frame hero (145 PNGs), scroll reveals, glow pulses, tickers, vault door sequence, 3D iframe camera parallax. **No `prefers-reduced-motion` anywhere.** |
| Reusable components | `ss-shared.css`/`.js` (nav, buttons, cards, pricing, testimonials, footer, fields). Not used by homepage. |
| Design tokens | Yes — CSS variables duplicated between `index.html` `:root` and `ss-shared.css` `:root` (kept in sync manually; a divergence risk). |
| Images / video | No `<img>` on main pages (emoji + canvas). `frames/` = **145 PNGs ≈ 204 MB** (94% of the 209 MB repo). No favicon, no OG image, no web manifest. Demo sites use remote Unsplash images. |
| Git branch | `main`. |
| Git remote | `origin` → `https://github.com/SecretSystems/System.Io-Helix.git`. |
| Git status | Working tree **not clean**: `sites/Ducharme-landscaping.html` modified (+162 lines, uncommitted). |
| Working tree clean? | **No.** |
| Local vs remote | **In sync** (`origin/main...HEAD` = 0 behind / 0 ahead). |

**Additional repo hazards:**
- **Case-collision:** both `sites/Ducharme-landscaping.html` and `sites/ducharme-landscaping.html` are tracked. On Windows/macOS (case-insensitive) these collide — checkout/edit ambiguity and the source of the current dirty working tree.
- **Stale public files:** `index (21).html`, `index.html Original`, `index.html test`, `frames/test` are committed and therefore reachable on the live domain (e.g. `secretsystems.io/index%20(21).html`). They expose work-in-progress and should be deleted.
- **Orphan/broken data:** `sites/sites-index.json` is **invalid JSON** (missing comma before the `luxe-spa` entry) and is not referenced by anything; `work.html` loads the auto-generated `sites/index.json` instead (which drops all the design descriptions).
- **CI writes to `main`:** the Action force-pulls/rebases and pushes to `main` on every `sites/*.html` change — fine, but it means the branch can move under you between edits.

---

## 7. AI-Slop Audit

The desired voice — **direct, specific, competent, calm, human, technically credible, free of hype** — is currently violated across most pages. The site reads like generic agency AI copy: empty superlatives, "runs itself while you sleep," fabricated numbers, and identical sentence rhythms.

### 7.1 Worst offenders (exact text → problem → fix → priority)

| # | Exact current text | Location | Why it's weak | Communicate instead | Priority |
|---|--------------------|----------|---------------|---------------------|----------|
| 1 | "Next-Gen Digital Infrastructure" | `index.html:1071` (hero label) | Empty buzzword; means nothing; on any tech site | Name the concrete category: "Websites, CRM & automation for local service businesses" | High |
| 2 | "your business needs — built and deployed under one roof." / "converts strangers into customers, automatically." | `index.html:1078`, `:1097` | Hype; unfalsifiable; "automatically" oversells | State what you build and the outcome plainly: "One team builds your site, CRM, and follow-up — so new leads get a fast, consistent response." | High |
| 3 | "Your Business Runs Itself" / "sell while you sleep" / "No human needed." | `index.html:1194`, `:1140`, `:1200` | Overpromise; implies zero involvement; not true | "Automates the repetitive follow-up so your team spends time on the leads that are ready to buy." | Critical |
| 4 | "3× Avg Lead Booking Increase," "60s AI Response Time," "24/7" stat tiles | `about.html:94-97` | Unsupported statistics presented as company facts | Remove or replace with real, sourced numbers once measurable. Until then: describe the mechanism, not a fake metric. | Critical |
| 5 | "We bring the same AI, automation, and digital infrastructure that Fortune 500 companies use" | `about.html:81` | Unverifiable name-drop; generic | "We use the same tools the big platforms are built on — GoHighLevel, modern web tooling — set up for a small-business budget." | High |
| 6 | "Average booking rate increase: 3x" + "Zero leads missed, even at 2am" + fake "real example" terminal (Sarah K.…) | `automation.html:171-187` | Fabricated stats + a static mockup labeled "a real example" (`:169`) | Label demos as illustrations. Replace stats with a real client result or a clearly-marked example: "Illustration of a typical lead flow." | Critical |
| 7 | "the most powerful tools, proprietary systems, and elite-level resources — built to give your business an unfair advantage." | `vault.html:678` | Hype stack: "proprietary/elite/unfair advantage" with nothing behind it | Drop the vault mystique or make it a real gated client resource. Say what's actually inside. | High |
| 8 | "Built to Close Deals While You Sleep." / "qualifies relentlessly … without a single manual touchpoint." | `vault.html:697-698` | Robotic superlatives; overpromise | "Responds to new leads fast and books qualified ones onto your calendar." | High |
| 9 | "14 reviews to 97+ in 60 days" / "+83 Reviews Avg" / "98% open rate" | `vault.html:739-743`, `services.html:129` | Unsupported statistics / inflated claim | Cite a real, permission-backed case study, or remove. If citing SMS open rates, attribute to an industry source, not to your results. | Critical |
| 10 | Testimonials "Marcus T. — HVAC Company Owner," "Amanda R. — Med Spa Owner," "David K. — Roofing Contractor" (initials only, no company, no link) | `index.html:1330-1344` | Reads as invented; initials + generic roles = low trust | Use full name + business name + city + (ideally) link/photo, with permission. If none exist yet, remove the section until you have real ones. | Critical |
| 11 | "The infrastructure behind businesses that grow without limits." | footers site-wide | Empty tagline; "without limits" is meaningless | "Websites, software, and systems for growing Louisiana businesses." | Medium |
| 12 | "Every System Your Business Needs" / "Everything Your Business Runs On — Built Here." | `index.html:1095`, `services.html:70` | Generic; could be any agency | Anchor to specifics and audience: "The web, CRM, and automation stack for local service businesses." | Medium |
| 13 | "CLASS IV CERTIFIED · SN:2025-0001" / "VAULT ACCESS ACTIVE" | `vault.html:629`, `:771` | Fake certification/serial — invented authority | Remove fabricated credentials entirely. | High |
| 14 | "No cookie-cutter solutions" / "Custom, Not Cookie-Cutter" | `index.html:1167`, `about.html:110` | Cliché; every agency says it | Show it instead: a short before/after or a real scoped example. | Low |

### 7.2 Sample rewrites (tone demonstration only — 6 examples)

1. **Hero (was "The Systems Behind Your Growth" + "runs itself"):**
   "We build the website, CRM, and follow-up system your business runs on. One Louisiana team, from first design to ongoing support."

2. **Automation section (was "Your Business Runs Itself"):**
   "When a lead comes in, they get a fast, consistent first response — a text within a minute, a booking link, a reminder — instead of falling through the cracks on a busy day."

3. **About mission (was "same AI Fortune 500 companies use"):**
   "Most small businesses lose leads to slow follow-up and manual busywork. We set up the same automation tools the big platforms use, sized and priced for a local business."

4. **Proof (was "3× booking increase"):**
   "We'll show you exactly what we set up and how we measure it — response time, booked appointments, and review growth — so you can judge the results yourself." *(Swap in a real, cited number when you have one.)*

5. **Reviews service (was "98% open rate"):**
   "After each completed job, we send an automatic review request by text and email, with a private path for unhappy customers so problems get handled before they go public."

6. **Contact (was "engineer the exact system you need to grow"):**
   "Tell us what your business does and what's slowing you down. We'll reply within one business day with a straight assessment — not a pitch."

**Do not rewrite the whole site yet** — these are direction-setting samples. Full rewrite happens in the implementation phase, after the owner supplies real proof (§14, §19).

---

## 8. Design and UX Audit

The design direction is strong and should be **preserved**, not redesigned. The problems are usability, honesty, performance, and accessibility layered on top of good visuals.

| Area | Assessment | Action |
|------|------------|--------|
| Navigation | Clean, consistent styling — but **item order differs between pages** (homepage vs shared), and "Vault" + "Get Access" are jargon. 8 items is slightly heavy. | Minor cleanup: unify order, rename "Get Access" → "Contact"/"Book a Call," reconsider "Vault." |
| Hero | Visually excellent, but gated behind a **forced 5 s loader** and a **204 MB** frame animation; text only reveals after scrolling. | Meaningful improvement: keep the look, replace 145 PNGs with a compressed video/sprite or far fewer frames; remove forced delay. |
| Content hierarchy | Good section rhythm and eyebrows. Some headings are generic (§7). | Minor: sharpen headings. |
| Typography | Strong pairing (Syne/JetBrains Mono/Outfit). Keep. | Keep as-is. |
| Spacing | Consistent and generous. Keep. | Keep. |
| Color usage | Cohesive cyan-on-void. Keep. | Keep. |
| Contrast | `--muted:#4a6a82` and `--text:#a8c8e0` on near-black: muted text/labels likely **fail WCAG AA** for small text. `[Test-required]` | Meaningful: bump muted text contrast; verify all label/eyebrow colors. |
| Section repetition | Homepage, services, catalog, pricing overlap heavily (services listed 3–4×). | Minor: differentiate intent per page. |
| Cards | Well-executed hover states. Keep. | Keep. |
| Buttons | Good visual system. But **no visible focus state** for keyboard users. | Meaningful: add `:focus-visible`. |
| Forms | Look good; **do nothing** (fake). Homepage fields lack labels/`name`s. | Critical: make them real (§4). |
| Footer | Clean, consistent. Contains dead `#` social links and links to a "Case Studies" anchor. | Minor: fix/remove dead links; add legal links once pages exist. |
| Mobile layout | Reasonable breakpoints at 900px; nav collapses to hamburger. Hero frame animation is brutal on mobile data/CPU. | Meaningful: fix hero weight; test forms. `[Test-required]` |
| Tablet layout | Falls between 900px breakpoint and desktop; some grids jump 3→1. `[Test-required]` | Minor: add an intermediate breakpoint if needed. |
| Desktop layout | Strong. | Keep. |
| Visual consistency | High within the shared system; homepage diverges structurally. | Minor: move homepage onto shared components. |
| Animation | Excessive and always-on; no reduced-motion. | Meaningful: gate all motion behind `prefers-reduced-motion`. |
| Accessibility | Failing floor (see §16). | Meaningful/Critical. |
| Keyboard navigation | Custom cursor + `cursor:none`; FAQ items are `<div onclick>` (not focusable); some hamburgers lack `aria-label`. | Meaningful: keyboard + focus fixes. |
| Focus states | Effectively none beyond input border color. | Meaningful. |
| Reduced-motion | **Absent everywhere.** | Meaningful. |
| CTA clarity | CTAs are consistent but jargon-y ("Get Access," "Start Building," "I Want This System"). | Minor: plain-language CTAs. |
| Contact friction | Extreme — the only path (a form) doesn't work, and there's no phone/email fallback. | Critical. |
| Trust signals | Weak/negative (fake proof). | Critical (see §14). |
| Service discoverability | Services are discoverable but redundant and marketing-only; no cybersecurity/app/software lines. | Meaningful (see §6 architecture, §10, §12). |
| Premium feel | High on first impression; undercut on interaction (loader wait, broken form, gimmick vault). | Preserve visuals; fix interactions. |

**Keep exactly as-is:** color/type tokens, card system, section spacing, button visual style, eyebrow pattern.
**Minor cleanup:** nav order/labels, generic headings, dead footer links, breakpoints.
**Meaningful improvement:** hero asset weight, forms, focus states, reduced-motion, contrast, homepage→shared components.
**Remove:** forced 5 s loader delay, `cursor:none`, fake certifications, fake stats/testimonials, stale duplicate files, the "classified vault" gimmick (or convert it to a real client resource).

**Design & UX grade: 58 / 100.** Excellent visual craft (would be ~85 on looks alone), heavily penalized because usability, honesty, accessibility, and the core contact flow are broken — and flash is explicitly not rewarded when clarity/usability are weak.

---

## 9. Cybersecurity Service Plan

**Guiding rule:** Assume Secret Systems currently has **no** security certifications, licensed professionals, regulatory credentials, government authorizations, forensic capability, or a penetration-testing team `[Owner-confirm]`. Offer only what can be delivered and defended. Cybersecurity claims carry legal and reputational risk that marketing copy does not — err toward advisory/review language and partner for anything requiring credentials.

### Group A — Can generally be offered now (low claim risk)

Advisory, review, documentation, and readiness services. These describe, recommend, and plan — they do not claim to "test," "certify," or "guarantee" security.

| Service | Sell now? | Partner-delivered? | Risk |
|---------|-----------|--------------------|------|
| Website security review (headers, HTTPS/TLS config, exposed files, basic hardening) | Yes | No | Low |
| Web application security review (auth flows, session handling, input handling — review, not exploit) | Yes (with skill) | No | Low–Med |
| Secure development review (code/config review against a checklist) | Yes | No | Low |
| Authentication review (password/MFA/session policy review) | Yes | No | Low |
| Authorization review (roles/permissions design review) | Yes | No | Low |
| Dependency review (outdated/vulnerable packages, SBOM) | Yes | No | Low |
| Configuration review (CMS/hosting/DNS/email SPF-DKIM-DMARC) | Yes | No | Low |
| Basic cloud configuration review (storage buckets, IAM basics, public exposure) | Yes | Partner for depth | Low–Med |
| Security hardening recommendations | Yes | No | Low |
| Backup & recovery review | Yes | No | Low |
| Security policy development (acceptable use, password, incident, data-handling policies) | Yes | No | Low |
| Incident-readiness planning (playbooks, contacts, roles) | Yes | No | Low |
| Employee security-awareness guidance (phishing basics, training material) | Yes | Partner for formal training | Low |
| Vendor-risk review (third-party/SaaS exposure) | Yes | No | Low |
| Remediation planning (prioritized fix roadmap) | Yes | No | Low |
| Security documentation | Yes | No | Low |
| Ongoing security advisory support (retainer) | Yes | No | Low |

**Detail template applied to a representative Group A service:**

- **Service:** Website & Web-App Security Review
- **Customer problem:** "Is my site actually secure? I don't know what I don't know."
- **Deliverables:** Written report — findings, severity, evidence, and a prioritized remediation plan; a re-check after fixes.
- **Ideal customer:** SMBs with a public site/app handling logins, payments, or customer data.
- **Required skills:** Web security fundamentals (OWASP Top 10), TLS/headers, auth/session, dependency scanning.
- **Required tools:** Browser devtools, header/TLS scanners (e.g., testssl, securityheaders-style checks), dependency scanners, manual review. `[Owner-confirm]` current tooling.
- **Required proof/credentials:** None strictly required for *review*; credibility improves with named methodology (OWASP) and sample (redacted) report.
- **Legal/insurance:** Scope in writing, written authorization to review, professional-liability/E&O insurance recommended `[Proof-required]`.
- **Sell now?** Yes.
- **Partner-delivered?** No (unless depth requires it).
- **Website wording:** "We review your website and web application for common security weaknesses and give you a clear, prioritized plan to fix them. Review and advisory — not a penetration test or a security guarantee."
- **Risk:** Low–Medium.

### Group B — Requires verified technical capability (prove before selling)

Deliverable only if the team can demonstrably perform them; otherwise partner. `[Proof-required]` for each.

Vulnerability assessments · Application security testing · Network security assessments · Cloud security assessments · Secure architecture consulting · Source-code security review · Threat modeling · Identity & access review · Security monitoring setup · Incident-response *planning*.

- **Sell-now gate:** Demonstrated skill + methodology + sample deliverable + written scope + E&O insurance.
- **Website wording pattern:** "Assessment and advisory. We identify and prioritize risks; we do not exploit systems or guarantee that all vulnerabilities are found."
- **Risk:** Medium–High (claims imply competence that must be real).

### Group C — May require certifications, insurance, contracts, or specialized partners

Do **not** deliver in-house without credentials. Refer to or white-label through a licensed partner; position Secret Systems as coordinator, not performer. `[Proof-required]`

Penetration testing · Red-team assessments · Digital forensics · Incident-response *execution* · Compliance audits · HIPAA assessments · PCI DSS assessments · SOC 2 readiness/audits · CMMC consulting · ISO 27001 consulting · Government cybersecurity work · Managed security services (MSSP) · Continuous monitoring · SOC services.

- **Website wording pattern:** "Delivered with our certified partners" (only once a real partner exists `[Owner-confirm]`).
- **Risk:** High.

### Group D — Do NOT claim without verified proof

Avoid entirely unless independently provable:

- "Certified" / "licensed" security professionals, or specific certs (CISSP, OSCP, CEH, etc.) — only if a named individual holds them `[Proof-required]`.
- "Penetration testing" / "ethical hacking" as an in-house capability.
- "HIPAA / PCI / SOC 2 / ISO 27001 compliant *or* certified" (yours or theirs).
- "Guaranteed secure," "unhackable," "100% protection," "military-grade," "bank-grade."
- "24/7 SOC / continuous monitoring" without real staffing/tooling.
- "Forensics" / "incident response" execution without capability and insurance.
- Fake certifications/serials like the current `vault.html` "CLASS IV CERTIFIED · SN:2025-0001" — **remove**.

### Supporting structures

- **Recommended cybersecurity service-page structure:** Hero (plain problem statement) → "What we do / what we don't" (scope honesty box) → Services grouped by A/B (review, assessment, advisory) → Methodology (OWASP, written reports) → Deliverables (sample redacted report) → Process → Partner disclosure for Group C → FAQ → Scope/disclaimer → CTA (assessment request).
- **Homepage cybersecurity section:** one card/section: "Security reviews & hardening for small businesses — website, app, cloud config, and policy. Clear reports, prioritized fixes." Link to the service page. Do **not** imply pentest/compliance on the homepage.
- **Trust signals required:** named methodology (OWASP), a redacted sample report, clear scope boundaries, E&O insurance statement, any real certs (named person), partner logos (only if real). `[Proof-required]`
- **FAQs required:** "Is this a penetration test?" (no, and why) · "Do you guarantee security?" (no) · "Do you handle HIPAA/PCI/SOC 2?" (advisory/partner) · "What do I receive?" · "Do you need access?" (authorization) · "What does it cost?"
- **Disclaimers/scope required:** "Reviews and advisory identify known/common risks and cannot guarantee that all vulnerabilities are found or that systems are secure." Written authorization before any review. No testing without signed scope.
- **Owner must confirm before launch:** actual skills/experience, any certifications, whether E&O/cyber insurance exists, whether a real security partner exists, what tooling is licensed, willingness to sign scoped engagement contracts. `[Owner-confirm]` `[Proof-required]`

---

## 10. App, Software, Dashboard, and Automation Service Plan

These lines fit the "systems/infrastructure" brand naturally and are lower-claim-risk than cybersecurity. Recommendation: consolidate into a small number of strong pages rather than one thin page per keyword.

**Detail template (applied per category):** what it includes · problem solved · deliverables · outcome · ideal client · required proof · CTA · related services · own page? · homepage-only first?

| Category | Includes | Problem solved | Deliverables | Ideal client | Own page? |
|----------|----------|----------------|--------------|--------------|-----------|
| **App development** | iOS/Android or PWA/mobile-web apps | "We need an app customers/staff can use on a phone." | Working app, source, store/deploy, docs | SMB with a mobile use-case | Homepage section first → own page once proof exists |
| **Web application development** | Custom web apps beyond a marketing site | "A website isn't enough — we need software." | Deployed web app, source, docs, support plan | SMB replacing spreadsheets/manual flows | **Yes** (flagship for the new line) |
| **Internal business applications** | Line-of-business tools, admin apps | "Our operations live in spreadsheets/paper." | Internal app, roles, data model, training | Ops-heavy SMB | Section under Custom Software |
| **Custom software development** | Bespoke software, integrations | "Off-the-shelf doesn't fit us." | Scoped software, source ownership, maintenance | SMB with a unique process | **Yes** (pillar page) |
| **Business dashboards** | KPI/reporting dashboards | "I can't see my numbers in one place." | Dashboard, data connections, definitions | Owner/manager wanting visibility | **Yes** (strong standalone demand — `demo-crm.html` already proves the look) |
| **Administrative dashboards** | Back-office admin panels | "Managing our data is painful." | Admin UI, CRUD, permissions | Teams managing records | Section under Dashboards |
| **Employee portals** | Internal staff portals | "Staff can't find info/tools." | Portal, auth, content/tools | Multi-employee SMB | Section |
| **Customer portals** | Client-facing accounts/self-service | "Customers keep calling for status/invoices." | Portal, auth, self-service | Service/subscription businesses | Section |
| **Workflow automation** | Cross-app automation, internal ops | "We re-key data and do repetitive tasks." | Automations, docs, monitoring | Any SMB with manual steps | **Yes** (own page — natural extension of the current GHL work) |
| **API integrations** | Connect systems/data | "Our tools don't talk to each other." | Integrations, error handling, docs | SMB with multiple SaaS | Section under Automation/Custom Software |
| **Data systems** | Databases, pipelines, warehousing | "Our data is scattered/unreliable." | Schema, pipeline, docs | Data-heavy SMB | Section |
| **Reporting tools** | Automated reports | "Reporting eats hours." | Report templates, scheduling | Owner/finance | Section under Dashboards |
| **Scheduling systems** | Booking/dispatch/calendar tools | "Scheduling is chaos." | Scheduling app/flow | Appointment/field businesses | Section |
| **Field-service tools** | Mobile job/dispatch tools | "Techs in the field need tools." | Field app, job flow | Trades/field-service | Section (ties to existing local-trades audience) |
| **AI-assisted business systems** | Practical AI in workflows (summarize, classify, draft, route) | "Where does AI actually help us?" | Scoped AI feature + guardrails | SMB curious about AI | Section under Automation/Custom Software (avoid hype) |
| **Legacy process replacement** | Replace spreadsheets/manual/paper | "Our process is held together by spreadsheets." | Replacement system, migration | Established SMB with old process | Section under Custom Software |
| **Application modernization** | Rebuild/upgrade old apps | "Our software is old and fragile." | Modernized app, migration | SMB with legacy software | Section |
| **Maintenance & support** | Ongoing upkeep for what you build | "Who keeps it running?" | SLA, monitoring, updates | Any prior client | **Yes** (retainer — recurring revenue) |

**Cross-cutting required proof for all of the above:** at least one real, shippable example (even an internal tool or the existing `demo-crm.html` reframed as a *concept demo*), a screenshot/walkthrough, a plain description of stack and ownership terms. `[Owner-confirm]` what has actually been built.

**Recommended CTAs:** "Book a build consult," "Get a scoped estimate," "See a demo." Avoid "Start Building" ambiguity.

**Navigation / homepage fit (avoid overcrowding):**
- Restructure top nav to a **Services mega-grouping** rather than 8 flat items: **Websites · Software & Apps · Automation & AI · Security · Work · About · Contact.**
- Homepage: replace/extend the 9-tile "services" grid with **4–5 category tiles** (Websites, Software & Apps, Dashboards, Automation & AI, Security) each linking to a real page. Keep the existing marketing-automation content under "Automation & AI."
- Phase 1: introduce Software & Apps, Dashboards, and Automation as **homepage sections + one or two pillar pages**. Phase 2/3: expand sections into full pages as proof accumulates. **Do not** create 17 thin pages.

---

## 11. Technical SEO Audit

| Item | Current condition | Why it matters | Recommended fix | Priority | Effort | Phase 1? |
|------|-------------------|----------------|-----------------|----------|--------|----------|
| Page titles | Present on all pages; mostly good, some keyword-stuffed | Titles drive rankings/CTR | Keep; tighten a few | Low | S | Optional |
| Meta descriptions | **Missing on `index.html` & `catalog.html`**; present elsewhere | Homepage is the most important page | Add unique descriptions | High | S | Yes |
| Canonicals | Missing on `index.html` & `catalog.html`; present elsewhere; **absent on all `sites/`** | Prevents duplicate-content issues | Add self-canonicals to main pages | High | S | Yes |
| Indexability | Everything indexable, incl. `vault.html` and 41 demo pages | Wrong pages diluting/embarrassing the domain | `noindex` vault + demos; robots disallow `/sites/` | High | S | Yes |
| Crawlability | OK (static HTML) but content hidden by `.reveal` opacity until JS | JS-dependent visibility is fragile | Ensure content renders without JS (progressive) | Medium | M | Partial |
| robots.txt | Allows all; no `/sites/` or vault disallow | Lets fake pages be crawled | Disallow `/sites/`, vault, stale files | High | S | Yes |
| XML sitemap | Missing `catalog.html` + 43 `sites/`; `lastmod` frozen 2025-04-11; includes vault | Misleads crawlers; omits real pages | Rebuild sitemap: real pages only, correct `lastmod` | High | S | Yes |
| Heading hierarchy | Mostly single `h1` + `h2`/`h3`; some titles are styled `<div>`s not headings | Semantics/SEO | Promote key labels to real headings | Medium | S | Partial |
| Semantic HTML | Decent (`nav/main/section/footer`); some `div onclick` controls | A11y + SEO | Use `<button>`/`<a>` for interactive elements | Medium | M | Partial |
| Internal links | Present but repetitive; footer "Case Studies"/social are dead `#` | Link equity + UX | Fix dead links; add links to new pillar pages | Medium | S | Yes |
| Anchor text | Generic ("Get Access," "Browse") | Descriptive anchors help | Use descriptive anchors | Low | S | Optional |
| URL structure | Flat `.html`; readable | Fine for size | Keep; use clean paths for new pages | Low | — | — |
| Duplicate content | 41 near-identical demo pages; services repeated across pages | Dilutes quality signals | `noindex` demos; differentiate page intents | High | M | Yes |
| Thin content | Demo pages + catalog page (title only) | Thin pages hurt site quality | `noindex` demos; enrich catalog | Medium | M | Partial |
| Open Graph | Missing on `index.html` & `catalog.html`; **no `og:image` anywhere** | Social/link previews | Add OG + a branded OG image | Medium | S | Yes |
| Twitter cards | `summary_large_image` declared but **no image** on any page | Broken card previews | Add `twitter:image` or drop the large-image type | Medium | S | Yes |
| Organization schema | **Missing on homepage** | Entity/knowledge-panel eligibility | Add `Organization`/`LocalBusiness` JSON-LD (NAP) | High | S | Yes |
| Service schema | On `services.html` (OK) | Rich results | Keep; extend to new service pages | Low | S | Later |
| Breadcrumb schema | None | Rich results/UX | Add once nested pages exist | Low | S | Later |
| Article schema | None (no articles yet) | Needed for content plan | Add with the blog (§13 content plan) | Medium | S | Phase 3 |
| FAQ schema | None (pricing FAQ not marked up) | Rich results | Add `FAQPage` to pricing/service FAQs | Medium | S | Phase 2 |
| Image alt text | No `<img>` on main pages; demo images `[Test-required]` | A11y/SEO | Add alt when real images/OG added | Medium | S | Partial |
| Image filenames | `ezgif-frame-001.png` … non-descriptive | Minor SEO | Rename when replacing hero asset | Low | S | Later |
| Image dimensions | Hero frames huge (~1.4 MB each) | CWV/LCP | Replace hero asset (see §15) | Critical | L | Yes |
| Page-speed risks | 204 MB frames, 41 iframes, particle canvas, forced loader | Rankings + UX | See §15 | Critical | L | Yes |
| Core Web Vitals | LCP/INP/CLS almost certainly failing on homepage & work `[Test-required]` | Ranking factor | Fix hero + JS weight | Critical | L | Yes |
| Mobile usability | Layout OK; performance brutal | Mobile-first index | Fix perf; test forms | High | M | Yes |
| JS-rendering risk | Content hidden until JS reveal; forms JS-only | Crawl/UX resilience | Progressive enhancement | Medium | M | Partial |
| A11y-related SEO | `cursor:none`, no focus, unlabeled controls | Overlaps rankings/UX | See §16 | High | M | Yes |
| Contact-info consistency | **No NAP on site**; `.com` email in demos vs `.io` brand | Local SEO needs consistent NAP | Add consistent NAP everywhere | High | S | Yes |
| Business-entity clarity | "Secret Systems LLC," LA, US — but no address/phone | Trust + local SEO | Publish real NAP | High | S | Yes |
| Author/company trust | No author bios, no team | E-E-A-T | Add real About/team | Medium | M | Phase 2 |
| Search Console readiness | `[Owner-confirm]` whether verified | Can't measure without it | Verify GSC, submit sitemap | High | S | Yes |
| Analytics readiness | **None installed** | No visibility | Install GA4 (or privacy-first analytics) | High | S | Yes |
| Conversion tracking | **None** | Can't measure leads | Add event tracking once forms work | High | M | Yes |

**Technical SEO grade: 42 / 100.** Secondary pages have competent metadata, but the homepage (the most important page) has none, the sitemap/robots are wrong, 41 fake pages are indexable, structured data is partly misused, there's no analytics, and Core Web Vitals are likely failing.

---

## 12. Recommended Page Architecture

Focused, no thin pages. Each entry summarized (full detail — intent · audience · problem · CTA · proof · depth · parent · links-in · links-out · schema · priority · phase — to be expanded during production).

### Phase 1 — Essential commercial pages (fix + core)

| URL | Title | Intent | Primary CTA | Schema | Priority |
|-----|-------|--------|-------------|--------|----------|
| `/` | Secret Systems — Websites, Software & Systems for Louisiana Businesses | Brand + routing | Book a consult | Organization/LocalBusiness | Critical |
| `/services.html` (hub) | Services | Commercial hub | Explore a service | Service | Critical |
| `/web-design.html` | Website Design & Development | Transactional | Get a web quote | Service | Critical |
| `/software.html` | Custom Software & Web Applications | Transactional | Book a build consult | Service | High |
| `/dashboards.html` | Business Dashboards & Reporting | Transactional | See a demo | Service | High |
| `/automation.html` (exists) | Automation & AI Systems | Transactional | Book a consult | Service | High |
| `/security.html` | Security Reviews & Hardening | Transactional (careful claims) | Request a review | Service | High |
| `/pricing.html` (exists) | Pricing | Commercial | Book a call | Offer/Product (fix schema) | High |
| `/contact.html` (exists, fix) | Contact | Conversion | Send message (working) | ContactPage | Critical |
| `/about.html` (exists, de-hype) | About | Trust | Meet the team | AboutPage/Organization | High |
| `/work.html` (exists, reframe) | Work / Demos | Proof | Start a project | CollectionPage | High |
| `/privacy.html` | Privacy Policy | Legal/trust | — | — | Critical (forms collect PII) |
| `/terms.html` | Terms | Legal | — | — | High |

### Phase 2 — Supporting educational + trust

| URL | Purpose | Phase |
|-----|---------|-------|
| `/workflow-automation.html` | Deepen automation line | 2 |
| `/industries/` (2–3 real ones, e.g. home services, med spa) | Local/vertical intent | 2 |
| `/process.html` | Detailed process/methodology | 2 |
| `/accessibility.html` | Accessibility statement | 2 |
| `/insights/` (blog index) | Content hub | 2 |
| `/sitemap.html` | HTML sitemap | 2 |

### Phase 3 — Case studies, deeper clusters, comparisons

| URL | Purpose | Phase |
|-----|---------|-------|
| `/work/<real-case-study>.html` | Real, permissioned case studies | 3 |
| `/industries/<more>` | Additional verticals with proof | 3 |
| `/insights/<cluster articles>` | Content clusters (§13) | 3 |
| Comparison/decision pages (build-vs-buy, GHL vs custom) | Bottom-funnel | 3 |

**Do not build** a separate thin page for every micro-service in §10 — nest them as sections under the pillar pages above.

---

## 13. Long-Form Content Plan

Rules honored: no generic AI listicles; every topic maps to a real buyer decision; quality over volume. Each idea should be expanded during production with: intent · funnel stage · audience · question answered · unique angle · expert input · related service · internal links · CTA · priority.

| # | Working title | Intent / stage | Audience | Related service | Priority |
|---|---------------|----------------|----------|-----------------|----------|
| 1 | "Build vs. Buy: When a Small Business Should Build Custom Software (and When Not To)" | Decision / MOFU | Owner weighing options | Custom Software | **First 10** |
| 2 | "What a Business Dashboard Actually Costs — and What Drives the Price" | Commercial / MOFU | Owner/manager | Dashboards | **First 10** |
| 3 | "Spreadsheet to Software: Signs You've Outgrown Your Spreadsheets" | Problem-aware / TOFU | Ops-heavy SMB | Legacy replacement | **First 10** |
| 4 | "How Much Does a Custom Web App Cost in 2026? A Straight Breakdown" | Commercial / MOFU | Budget-conscious owner | Web app dev | **First 10** |
| 5 | "A Practical Guide to Workflow Automation for Local Service Businesses" | Informational / TOFU | Trades/service owner | Automation | **First 10** |
| 6 | "Do You Need an App, or Just a Better Website? A Decision Framework" | Decision / MOFU | Owner considering an app | App dev | **First 10** |
| 7 | "Website Security Basics Every Small Business Should Check This Year" | Informational / TOFU | Any SMB | Security review | **First 10** |
| 8 | "What to Expect From a Website Security Review (and What It Won't Do)" | Commercial / MOFU | Security-curious SMB | Security review | **First 10** |
| 9 | "How We Scope a Software Project: From Idea to Estimate" | Trust / MOFU | Serious buyer | Custom Software | **First 10** |
| 10 | "Owning Your Software: Source Code, Data, and Why It Matters" | Trust / MOFU | Cautious buyer | All build services | **First 10** |
| 11 | "Customer Portals: When Self-Service Pays for Itself" | Commercial | Service/subscription SMB | Customer portals | High |
| 12 | "Internal Tools vs. Off-the-Shelf SaaS: A Cost-Over-Time View" | Decision | Ops manager | Internal apps | High |
| 13 | "Integrating Your Tools: What API Integration Really Involves" | Informational | Multi-SaaS SMB | API integrations | High |
| 14 | "GoHighLevel vs. Custom: Which Fits Your Business?" | Comparison / BOFU | Existing GHL-curious | CRM/Custom | High |
| 15 | "A Realistic Timeline for a Small Software Project" | Informational | First-time buyer | Custom Software | High |
| 16 | "How to Choose a Software Partner (Questions to Ask)" | Decision | Cautious buyer | About/Services | High |
| 17 | "Dashboards That Managers Actually Use: Design Principles" | Informational | Manager | Dashboards | Medium |
| 18 | "Automating Lead Follow-Up Without Sounding Like a Robot" | Informational | Marketer/owner | Automation | Medium |
| 19 | "Secure Software Development: What 'Built Securely' Should Mean" | Informational | Security-aware buyer | Security/Software | Medium |
| 20 | "Authentication Done Right for Small Business Apps" | Informational | Technical buyer | Web app dev | Medium |
| 21 | "Backups and Recovery: A Small-Business Checklist" | Informational | Any SMB | Security review | Medium |
| 22 | "When to Modernize vs. Rebuild Old Software" | Decision | Legacy owner | App modernization | Medium |
| 23 | "Field-Service Tools: Getting Techs Off Paper" | Commercial | Trades | Field-service | Medium |
| 24 | "Reporting Automation: Reclaiming Hours Every Month" | Informational | Finance/owner | Reporting | Medium |
| 25 | "What 'AI for Your Business' Actually Means (No Hype)" | Informational | AI-curious SMB | AI systems | Medium |
| 26 | "Software Maintenance: What You're Paying For" | Informational | Existing client | Maintenance | Medium |
| 27 | "The Real Cost of Slow Lead Response (and How to Fix It)" | Problem-aware | Service owner | Automation | Medium |
| 28 | "Data You Should Be Tracking (and Where It Usually Hides)" | Informational | Owner | Dashboards/Data | Low |
| 29 | "Vendor Risk: Vetting the SaaS Tools Your Business Depends On" | Informational | Ops/security | Vendor-risk review | Low |
| 30 | "A Small-Business Incident-Readiness Plan You Can Actually Follow" | Informational | Any SMB | Incident readiness | Low |
| 31 | "Booking & Scheduling Systems That Reduce No-Shows" | Commercial | Appointment businesses | Scheduling | Low |
| 32 | "How We Measure Whether an Automation Is Working" | Trust | Results-focused buyer | Automation | Low |

**First 10 to produce:** #1–#10 above — they cover the highest-value buyer decisions (build-vs-buy, cost, scope, ownership, security expectations) across the new service lines, and each maps to a Phase-1/2 service page. **Every article requires real expert input from the owner** (actual scoping process, real pricing ranges, real methodology) — do not auto-generate. **Do not publish large volumes of low-quality content.**

---

## 14. Credibility and Trust Audit

| Trust element | Present? | Notes / action |
|---------------|----------|----------------|
| About information | Yes, but hype-heavy, no specifics | De-hype; add real story |
| Founder information | **No** | Add founder name/bio `[Owner-confirm]` |
| Team information | **No** ("We're not a freelancer" implies small team) | Add real team or honest "small studio" framing `[Owner-confirm]` |
| Contact information | **No phone, no email on site** | Add real NAP `[Owner-confirm]` |
| Physical location | Only "South Louisiana" | Add city/service area (demos hint Lafayette/Acadiana) `[Owner-confirm]` |
| Service area | "Nationwide remote" | Keep, but anchor a home base |
| Business history | **No** | Add founding year/history `[Owner-confirm]` |
| Portfolio | Yes — but fictional demos framed as clients | Reframe as "concept demos" or replace with real work |
| Case studies | **No real ones** (footer links to a testimonials anchor) | Build 1–3 real, permissioned case studies `[Owner-confirm]` |
| Screenshots | Only demo mockups | Add real product screenshots `[Owner-confirm]` |
| Process | Yes (good) | Keep |
| Testimonials | Initials-only, unverifiable | Replace with real, attributed testimonials or remove `[Proof-required]` |
| Client logos | **No** | Add real logos with permission `[Owner-confirm]` |
| Certifications | Fake ("CLASS IV CERTIFIED") | Remove fakes; add real ones if any `[Proof-required]` |
| Security credentials | **No** | See §9 |
| Professional memberships | **No** | Add if real `[Owner-confirm]` |
| Privacy policy | **No** | Create (forms collect PII) — Critical |
| Terms | **No** | Create |
| Guarantees | Vague ("no pressure") | Define real guarantees if any |
| Support expectations | "Within 24 hours" (can't honor — form broken) | Fix form; state real SLA |
| Response times | Claimed, unbacked | Make real |
| Project ownership | Claimed ("you own everything") | Good — document in terms |
| IP terms | Not documented | Add to terms/contracts |
| Maintenance terms | Mentioned in pricing | Formalize |
| Security practices | Contradicted by vault PIN gimmick | Remove gimmick; document real practices |

**Flagged as invented / exaggerated / unverifiable:** the "3× booking," "60s response," "14→97 reviews," "98% open rate," "680+ lawns / 4.9★ / 12yr / 100%" (demo), "CLASS IV CERTIFIED · SN:2025-0001," all three homepage testimonials, "same AI Fortune 500 companies use," and the "Past Work / every site we've built" framing over fictional demos.

**Exact business information the owner must supply before a full rewrite (`[Owner-confirm]`/`[Proof-required]`):**
1. Legal business name, formation year, and registered location (city/state).
2. A public phone number and email (and resolve `secretsystems.com` vs `secretsystems.io`).
3. Physical/service-area address for NAP + local SEO.
4. Real team members / founder (names, roles, bios, photos) — or agreement to present as a small studio honestly.
5. Any real certifications, licenses, insurance (E&O/cyber), and memberships.
6. 1–3 real clients willing to be named, with permission for logo/testimonial/case study and real metrics.
7. Which services have actually been delivered (web, GHL, any software/dashboards/security).
8. Real, defensible statistics (or agreement to remove all unverified numbers).
9. Whether a real security/compliance partner exists.
10. Social profiles that actually exist (Facebook/Instagram/LinkedIn) or removal of dead links.
11. Where leads should be delivered (email inbox, CRM/GHL, webhook) so forms can be wired.
12. Confirmation on the "vault" concept: remove, or convert to a genuinely gated client resource.

---

## 15. Performance Audit

| Sub-item | Finding | Grade impact |
|----------|---------|--------------|
| Image size | `frames/` = 145 PNGs ≈ **204 MB** (~1.4 MB each); homepage loads all of them | Severe |
| Image formats | PNG for photographic frames (should be video/WebP/AVIF) | Severe |
| Lazy loading | Hero frames all requested up front; `work.html` iframes use `loading="lazy"` (partial help) | Poor |
| Fonts | Google Fonts via `<link>` + `@import` (render-blocking); 3 families, many weights | Medium |
| Render-blocking assets | CSS in `<head>`, `@import` fonts, large inline styles | Medium |
| Script weight | Vanilla but always-on: particle canvas (O(n²)) on every page; frame RAF loop; `work.html` two perpetual RAF loops + 41 iframes | Severe |
| CSS duplication | Tokens duplicated (homepage vs shared); large inline blocks | Low–Med |
| Animation cost | Continuous canvas + cursor + reveals + tickers + vault door; no throttle/reduced-motion | High |
| Layout shift | Loader → hero swap, reveal transforms, iframe scaling — likely CLS `[Test-required]` | Medium |
| Caching | GitHub Pages default caching only; huge PNGs re-fetched per new visitor | Medium |
| Mobile performance | 204 MB + canvas + (on `/work`) 41 iframes on phones/cellular | Severe |
| Forced delay | Homepage forces a **minimum 5 s loader** before content | Severe (self-inflicted) |

**Fix priorities:** (1) Replace the 145-PNG hero with a compressed MP4/WebM or a small optimized sprite/keyframe set (target < 2–3 MB); (2) remove the forced 5 s loader; (3) gate/reduce the particle canvas and disable it under `prefers-reduced-motion`; (4) redesign `work.html` to use static screenshots/thumbnails instead of 41 live iframes (load the live preview only on click); (5) self-host/subset fonts or reduce weights.

**Performance grade: 25 / 100.** The homepage and Work page are, as built, extremely heavy; this is the second-most-damaging issue after broken lead capture.

---

## 16. Accessibility Audit

| Sub-item | Finding |
|----------|---------|
| Color contrast | `--muted` / `--text` on dark likely fail AA for small text `[Test-required]` — fix token contrast |
| Semantic structure | Mostly OK (`nav/main/section/footer`); interactive `<div onclick>` (FAQ, demo-crm nav) are not semantic |
| Heading order | Generally single `h1` + `h2`/`h3`; some "headings" are styled `<div>`s (plan names) |
| Form labels | `contact.html` labels are associated (`for`/`id`) — good; **homepage form fields have visual labels but no association and no `name`s**; `work.html` modal labels not associated |
| Alt text | No `<img>` on main pages; hero canvas has no text alternative; demo images `[Test-required]` |
| Keyboard access | `cursor:none` + custom cursor; FAQ items not focusable/operable; some hamburgers lack `aria-label`; vault sets `user-select:none` and `overflow:hidden` |
| Focus visibility | **No visible focus states** beyond input border color |
| Motion controls | **No `prefers-reduced-motion` anywhere** — continuous canvas, tickers, glow pulses, vault door, blink cursors |
| Link clarity | Some links are `#` placeholders (footer social, "Case Studies") |
| Button clarity | Jargon CTAs ("Get Access," "I Want This System"); some icon buttons unlabeled |
| Screen-reader usability | Emoji used as meaningful icons without `aria-hidden`; status changes (e.g., "INVALID PIN") not announced via `aria-live`; content hidden by `opacity:0` until JS reveal |

**Priority fixes:** remove `cursor:none` (or make it opt-in and never hide focus); add `:focus-visible` outlines; add a global `prefers-reduced-motion` block that disables canvas/animation; make FAQ and all interactive controls real `<button>`s with `aria-expanded`; associate/label all form fields; `aria-hidden` decorative emoji; add a text alternative for the hero.

**Accessibility grade: 30 / 100.** Multiple WCAG A/AA blockers (motion, focus, keyboard operability, contrast, labeling) affect every page.

---

## 17. Website Security Audit

| Sub-item | Finding |
|----------|---------|
| Exposed secrets | No API keys/tokens found in source (good). **But** `vault.html:829` hardcodes `const PIN='1234'` — a plaintext access PIN in client JS |
| Client-side "auth" | The "Classified" vault is gated only client-side; all "proprietary" content is in the DOM regardless of PIN and is `index,follow` — zero real protection, and misleading |
| Unsafe scripts | No third-party JS; all inline/local (low supply-chain risk) |
| Form security | Forms collect PII (name, phone, email, **monthly revenue**) but don't transmit — no leak, but also no consent, no privacy policy, and no working capture. When wired, needs HTTPS endpoint, spam/bot protection, and consent |
| External resources | Google Fonts (Google receives IP/referer — privacy/GDPR consideration); demo sites load remote Unsplash images |
| Dependency risk | None (no packages) |
| CSP readiness | No Content-Security-Policy. GitHub Pages can't set response headers easily; a `<meta http-equiv>` CSP is possible but limited `[Test-required]` |
| Referrer policy | Not set |
| Permissions policy | Not set |
| External-link safety | Some external links use `rel="noopener"` (contact FB link, good); verify all `target="_blank"` links do |
| Privacy concerns | No privacy policy while collecting PII incl. revenue; no cookie/analytics disclosure; fonts leak IP to Google |
| Analytics concerns | None installed today; when added, disclose it and consider privacy-first analytics |
| iframe sandbox | `work.html` iframes use `sandbox="allow-same-origin allow-scripts"` — that combination effectively lets framed content escape the sandbox; low risk here (first-party demos) but not hardened |
| Public junk files | Stale `index (21).html`, `index.html Original`, `index.html test`, `frames/test` are publicly reachable — information exposure/professionalism |

**Priority fixes:** remove the fake PIN/vault or make it a real server-gated resource; delete stale public files; add a privacy policy before wiring forms; when forms go live, submit over HTTPS to a real endpoint (GHL/webhook/form service) with bot protection and consent; add `referrer-policy`/`permissions-policy` and a CSP where feasible; consider self-hosting fonts to stop the Google IP leak.

**Website security grade: 45 / 100.** No leaked keys or risky dependencies, but a fake-security gimmick, PII collection with no policy/transport, and public junk files pull it down.

---

## 18. Audit Scorecard

| Category | Score /100 | One-line rationale |
|----------|-----------:|--------------------|
| Visual design (craft only) | 85 | Distinctive, cohesive, well-typeset identity |
| Design & UX (overall) | 58 | Great looks; broken contact flow, honesty, a11y, perf |
| Copy / messaging | 30 | Hype, fabricated stats, generic AI voice |
| Technical SEO | 42 | Good on secondary pages; homepage/sitemap/robots/schema broken; fake pages indexable |
| Performance | 25 | 204 MB hero, forced loader, 41 iframes, always-on canvas |
| Accessibility | 30 | Motion, focus, keyboard, contrast, labeling blockers |
| Website security | 45 | No leaked keys, but fake PIN gate, PII w/o policy, junk files |
| Credibility / trust | 25 | Fake portfolio, fake testimonials/certs, no real contact |
| Conversion readiness | 10 | No working form, no phone/email, no analytics/tracking |
| Code/repo hygiene | 45 | Static + simple, but duplicate systems, junk + case-collision files, dirty tree |
| **Overall (weighted, business-critical)** | **≈38** | Strong brand shell on top of broken fundamentals |

---

## 19. Missing Owner Information

Blocking items before a full copy rewrite / launch (consolidated from §9 and §14):

1. Real NAP: legal name, phone, email, city/service area. Resolve `.com` vs `.io`.
2. Founder/team identity (names, roles, bios, photos) or agreement to present as a small studio.
3. Which services have actually been delivered (web/GHL/software/dashboards/security).
4. Real, permissioned client proof: 1–3 named clients, logos, testimonials, metrics, case studies.
5. Any real certifications, licenses, insurance (E&O/cyber), memberships. `[Proof-required]`
6. Cybersecurity reality check: actual skills, tooling, and whether a real security partner exists.
7. Defensible statistics — or approval to remove every unverified number.
8. Lead-delivery destination (inbox / GHL / webhook) so forms can be wired.
9. Real social profiles (or removal of dead links).
10. Decision on the "vault" concept (remove vs. real gated resource).
11. Whether GA4/Search Console are set up and who owns them.
12. Legal content source for privacy/terms (owner-provided or drafted for review — not legal advice).

---

## 20. Prioritized Implementation Plan

Each task: exact task · reason · files likely affected · risk · effort · priority · dependency · owner approval?

### PHASE 1 — Cleanup without redesign (preserve the look)

| # | Task | Reason | Files | Risk | Effort | Priority | Depends on | Owner approval? |
|---|------|--------|-------|------|--------|----------|------------|-----------------|
| 1.1 | Wire all forms to a real endpoint (GHL/webhook/form service); add real success/error states, spam protection, consent checkbox | Site captures zero leads today | `contact.html`, `index.html`, `work.html` | Med | M | Critical | #19.8 lead destination | **Yes** |
| 1.2 | Add real phone + email (click-to-call/mailto) to header/footer/contact | No contact path exists | shared header/footer, `contact.html` | Low | S | Critical | #19.1 NAP | **Yes** |
| 1.3 | Remove/replace fabricated stats, testimonials, fake certs, "real example" terminals | Legal/credibility risk | `index.html`, `about.html`, `automation.html`, `vault.html`, `services.html` | Low | M | Critical | #19.4/#19.7 | **Yes** |
| 1.4 | Reframe portfolio as "concept demos" (or replace with real work); label clearly | Misrepresentation risk | `work.html`, `sites/*` | Low | M | Critical | #19.3 | **Yes** |
| 1.5 | Replace 145-PNG hero with compressed video/sprite; remove forced 5 s loader | Perf/CWV catastrophe | `index.html`, `frames/` | Med | L | Critical | — | Recommended |
| 1.6 | `noindex` vault + demo pages; robots.txt disallow `/sites/` + junk; rebuild sitemap (real pages, correct lastmod) | Fake/thin pages indexable; sitemap wrong | `robots.txt`, `sitemap.xml`, `sites/*`, `vault.html` | Low | S | High | — | No |
| 1.7 | Delete stale public files + resolve case-collision; commit the dirty Ducharme file intentionally | Public junk + collision hazard | `index (21).html`, `index.html Original`, `index.html test`, `frames/test`, `sites/Ducharme*` | Low | S | High | verify not linked | **Yes** (deletion) |
| 1.8 | Add homepage meta description, canonical, OG (+image), and `Organization`/`LocalBusiness` JSON-LD; add same to `catalog.html`; fix `PriceSpecification`→Offer/Product | Homepage has no SEO metadata | `index.html`, `catalog.html`, `pricing.html` | Low | S | High | #19.1 | No |
| 1.9 | Accessibility baseline: remove `cursor:none`, add `:focus-visible`, global `prefers-reduced-motion`, real `<button>`s for FAQ, label all fields, `aria-hidden` emoji | WCAG blockers everywhere | `ss-shared.css/js`, all pages | Med | M | High | — | No |
| 1.10 | Add app/software/dashboards/automation/security as homepage sections + nav grouping | Expand offering per goals 3–4 | `index.html`, shared nav | Low | M | High | #19.3/#19.6 | **Yes** (claims) |
| 1.11 | Responsible cybersecurity intro section (Group A framing + scope disclaimer) | Add security w/o overclaiming | `index.html`, new `security.html` stub | Med | M | High | #9 owner confirms | **Yes** |
| 1.12 | Install analytics (GA4 or privacy-first) + verify Search Console + submit sitemap | No measurement today | all pages (shared) | Low | S | High | #19.11, privacy policy | **Yes** (privacy) |
| 1.13 | Create privacy policy + terms (+ link in footer) | PII collection w/o policy | new `privacy.html`, `terms.html`, footer | Low | S | Critical | #19.12 | **Yes** |
| 1.14 | Move homepage onto `ss-shared.css/js`; de-duplicate tokens | One design system; easier edits | `index.html`, `ss-shared.*` | Med | M | Medium | regression test | No |
| 1.15 | Add favicon + OG image + web manifest | Missing brand basics | new assets, `<head>` all pages | Low | S | Medium | — | No |

### PHASE 2 — Core service pages

Build the Phase-1 architecture pages (§12): `web-design.html`, `software.html`, `dashboards.html`, `security.html` (full), plus de-hyped `about.html` with real team, and `pricing.html` FAQ marked up as `FAQPage`. Each: real proof, honest scope, working CTA. Dependencies: owner info (§19), at least one real example per line. Owner approval: **Yes** (claims + proof).

### PHASE 3 — Long-form content

Ship the blog hub (`/insights/`) + Article schema, then the **first 10 articles** (§13 #1–#10) as the first cluster, internally linked to the Phase-2 service pages. No bulk low-quality output. Dependency: expert input from owner per article. Owner approval: per-article review.

### PHASE 4 — Proof and conversion

Real case studies (permissioned), real screenshots, real testimonials/logos, conversion event tracking (form submits, calls, key clicks), A/B test primary CTAs, and a booking widget (e.g., GHL calendar) if desired. Dependencies: Phase-1 forms/analytics live, real clients (§19.4). Owner approval: **Yes**.

---

## 21. Exact Recommended Scope for the Next Coding Session

Keep the next session tight, reversible, and design-preserving. Recommended scope (Phase-1 subset, highest value / lowest risk):

**In scope:**
1. **Make lead capture real** — wire `contact.html` (and the homepage + `work.html` forms) to a real destination, add honest success/error states, consent, and basic spam protection. *(Needs owner: lead destination.)*
2. **Add real contact details** — phone + email in header/footer/contact. *(Needs owner: NAP.)*
3. **Remove fabricated proof** — delete/soften fake stats, testimonials, certifications, and the "real example" terminals across `index`, `about`, `automation`, `vault`, `services`. *(Needs owner: which claims are real.)*
4. **SEO + hygiene quick wins (no owner blocker):** homepage/catalog meta + canonical + OG + `Organization` JSON-LD; fix `PriceSpecification`; `noindex` vault + `/sites/`; rebuild `sitemap.xml`; delete stale junk files and resolve the Ducharme case-collision.
5. **Accessibility + performance baseline (no owner blocker):** remove `cursor:none`, add `:focus-visible` and a global `prefers-reduced-motion` block; and either compress the hero asset or remove the forced 5 s loader.
6. **Create privacy policy + terms** and link them (required before analytics/forms go live).

**Explicitly out of scope for the next session:** full copy rewrite (blocked on owner proof), new service pages, blog/content, redesign, cybersecurity delivery claims beyond a scoped Group-A intro, and any commit/push/deploy without explicit approval.

**Preconditions before starting:** collect owner answers to §19 items 1, 3, 4, 7, 8, 11; confirm the lead-delivery destination; confirm which numbers/testimonials are real; get approval to delete stale files and to change service claims.

---

### Appendix A — Files inspected

Read in full: `index.html`, `about.html`, `services.html`, `contact.html`, `pricing.html`, `automation.html`, `catalog.html`, `vault.html`, `work.html`, `ss-shared.css`, `ss-shared.js`, `robots.txt`, `sitemap.xml`, `CNAME`, `.github/workflows/update-sites.yml`, `sites/index.json`, `sites/sites-index.json`, `sites/demo-crm.html`, `sites/ducharme-landscaping.html`.
Inspected via search/grep: `sites/Cajun pressure/Cajun pressure.html`, `sites/Father-and-son-mobile-mechanic.html`, `sites/Tailor made land service/index.html`, and metadata/patterns across all 54 `sites/*.html`.
Also inspected: directory tree, git state (branch/remote/status/sync), asset sizes (`frames/` ≈ 204 MB), and the live site (`https://secretsystems.io/`) for deployment parity.

### Appendix B — Key file:line references

- Broken forms: `contact.html:167-176`; homepage form `index.html:1363-1405` (no `<form>`); `work.html` modal.
- Fabricated proof: `index.html:1330-1344`; `about.html:94-97`; `automation.html:169-187`; `vault.html:629,739-743`.
- Vault PIN: `vault.html:829` (`const PIN='1234'`), indexable at `:9`.
- Hero frames: `index.html:1541-1739`; `frames/` (145 PNGs).
- Missing homepage SEO: `index.html:1-9`.
- Schema misuse: `pricing.html:12` (`PriceSpecification`).
- CI writes to main: `.github/workflows/update-sites.yml`.
