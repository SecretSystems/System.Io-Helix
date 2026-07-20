# UI/UX Craftsmanship Review — Audit & Design Directions

**Date:** 2026-07-20 · **Status:** Review only. One change executed by explicit order: the custom cursor is removed sitewide (commit `ac5edec`). Nothing else implemented.
**Ground rule:** keep the brand, layout, architecture, navigation, content, and the animations that earn their place. Refine — don't rebuild.

---

## Part 1 — The "feels AI" audit

Ranked by how loudly each item signals "generated" rather than "crafted."

| # | Finding | Where | Severity |
|---|---------|-------|:---:|
| 1 | **Emoji as iconography** — 🌐🤖📊📱⭐💻🔒 etc. as card/footer/contact icons. Platform-inconsistent rendering, toy-like at scale; the single loudest AI tell on the site. | Every card grid, footers, contact rows (~80+ instances) | Critical |
| 2 | **Custom cursor** — hidden native pointer, dot+ring chase. | ~~Sitewide~~ **REMOVED (done)** | — |
| 3 | **Sentence-template repetition** — "X, Y, and Z — so [benefit]" tile formula ~14×; very high em-dash density; every desc one compound sentence. | Homepage tiles, service items, catalog | High |
| 4 | **Glow overdose** — pulsing glow on hero "Growth.", cyan drop-glows on buttons, loader glows, ticker diamonds. Any one is brand; the sum is arcade. | index hero, .btn-cyan hover, loader, vault | High |
| 5 | **Ticker marquees** — 24-item scrolling service list (90s loop) pinned to the homepage bottom; repeats "GoHighLevel Experts" etc. Dated pattern, motion clutter, zero conversion value. | index bottom banner + vault ticker | High |
| 6 | **Particle constellation on reading pages** — the canvas belongs on marketing surfaces; on privacy/terms/articles it shimmers behind prose. | All 24 pages uniformly | Medium |
| 7 | **Scanline overlay everywhere** — good texture on the hero; sci-fi noise on legal pages and 1,700-word guides. | body::after, all pages | Medium |
| 8 | **Uniform section stamp** — every section: 7rem pad → eyebrow → big-title → grid. No density variation; pages feel produced by one loop. | All pages | Medium |
| 9 | **Button-system fragmentation** — 7+ parallel styles (.btn-primary/.btn-cyan/.btn-ghost/.btn-outline/.btn-price/.pfc-cta/.cat-item-cta/.nav-cta). | Sitewide | Medium |
| 10 | **ALL-CAPS letterspaced mono overdose** — eyebrows, tags, tickers, labels, breadcrumbs, buttons. The signature becomes shouting; hierarchy flattens. | Sitewide | Medium |
| 11 | **Three different terminal stylings** — index vs automation vs vault terminals differ in chrome/colors. | 3 pages | Low |
| 12 | **Card sameness** — identical card anatomy across services/catalog/resources/pricing. | 4+ pages | Low |
| 13 | **Hero H1 triple-effect** — outline-stroke line + glow-pulse line + solid line in one heading. | index | Low |
| 14 | **Loader theater** — "GAINING YOU ACCESS" + cat + progress. Charming brand quirk; now only ~700ms. Keep, but it's a taste decision. | index | Decision |
| 15 | **Vault easter egg** — delinked, noindexed gimmick. Harmless; retire or keep as lore. | vault.html | Decision |
| 16 | **Work-page caption overlap** — fixed caption bar can overlap the first card row at narrow widths; controls small on mobile. | work.html | Low |
| 17 | **.88rem dense card body text** — service descs run small and tight for 50+ word sentences. | svc-items | Low |

**Also removed with the cursor (same commit):** nothing else — all other candidates above overlap the three directions below and await the direction decision.

---

## Part 2 — Three design directions (NOT implemented)

### Option 1 — "Premium SaaS" (Stripe / Linear / Vercel / Raycast)
- **Philosophy:** confidence through restraint. The dark canvas stays; everything ornamental goes; whitespace and type do the persuading.
- **Typography:** keep Syne for display but drop to weight 700 and reduce clamp ceilings ~15%; body moves to 1rem/1.75 everywhere; kill letterspacing on everything except eyebrows; sentence-case buttons.
- **Spacing:** modular scale (4/8/12/20/32/52/84px); section padding varies by importance (hero 96px, proof 64px, FAQ 52px) instead of uniform 7rem.
- **Color:** void/cyan stay; cyan usage cut ~50% (links, one primary button, focus, thin rules only); introduce one neutral step between `--card` and `--deep` for surface layering.
- **Shadows:** replace cyan glows with true elevation (0 1px 2px + 0 8px 24px black at 40%); zero colored shadows.
- **Cards:** border-only resting state; on hover, border brightens + 2px lift; remove animated top-bars.
- **Borders:** 1px `rgba(255,255,255,.06)`; cyan borders reserved for interactive/selected.
- **Buttons:** ONE system — primary (solid cyan, sentence case), secondary (border), tertiary (text+arrow). Delete the other five.
- **Animations:** 150–200ms ease-out micro-transitions only; remove reveal-on-scroll, tickers, glow-pulse, particles; keep the hero scrub (it's the one earned spectacle).
- **Iconography:** 24px 1.5px-stroke line set (Lucide-style, self-hosted SVG); emoji eliminated.
- **Page rhythm / hierarchy:** alternate full-bleed and contained sections; one accent moment per page.
- **Trust:** quiet specificity — real NAP inline, the case-study stat row as the only "loud" element.
- **Conversion:** single sticky primary CTA per page; forms feel bank-grade (larger fields, clearer states).
- **Removed:** particles, scanlines, tickers, glow, reveal animations, emoji, loader (straight to content), stroke-outline hero line.
- **Why better:** reads instantly as a serious software vendor; fastest, calmest, most accessible. **Risk:** sands off the most distinctive brand edges.

### Option 2 — "Modern Editorial" (Apple / Notion / Medium)
- **Philosophy:** the words are the product. Typography-first; the site becomes the proof of clear thinking.
- **Typography:** introduce a serif or humanist display for article/section headlines (self-hosted) over Outfit body at 1.06rem/1.8; Syne retreats to the logo and small labels; big pull-quotes in guides.
- **Spacing:** reading measure rules everything — 68–74ch article column, generous 96–128px section breathing; card grids loosen to 2-up with real gutters.
- **Color:** near-black warms slightly (#05070b); cyan becomes an editorial accent (links, rules, small labels); large surfaces go quiet.
- **Shadows:** none — hairline rules and space create structure.
- **Cards:** become "index entries": rule-separated rows with title/desc/arrow, not boxes.
- **Borders:** hairlines (1px, 8% white) as the primary structural device.
- **Buttons:** understated — text-weight primary with underline-grow hover; one solid button reserved for Contact.
- **Animations:** essentially none beyond opacity/position 120ms; hero scrub becomes optional (poster frame + subtle parallax).
- **Iconography:** almost none — numbers, rules, and type carry the structure.
- **Page rhythm:** long-form confidence — bigger intros, fewer boxes, more prose per section.
- **Trust:** the strongest of the three for EEAT — reads like a firm that writes; bylines, dates, and the case study shine.
- **Conversion:** softer but higher-intent; end-of-read CTAs styled as editorial footnotes.
- **Removed:** particles, scanlines, tickers, glows, most cards, the loader, the terminal mockups (or one, restyled as a figure), the hero animation's dominance.
- **Why better:** timeless and deeply credible; perfect for the resources strategy. **Risk:** the furthest from the current DNA — effectively a re-skin; conflicts most with "keep the design."

### Option 3 — "Technical Command Center" (Warp / GitHub / Retool / Cursor)
- **Philosophy:** the existing DNA, matured. The site already wants to be this — terminals, mono labels, void+cyan, a dashboards product line. Stop decorating like sci-fi; start behaving like an ops tool.
- **Typography:** Syne 800 only for H1/H2; JetBrains Mono is demoted from decoration to *data* (stats, code, statuses, timestamps) at full opacity; body 1rem; caps+tracking reserved for true system labels.
- **Spacing:** a visible-but-quiet 8px grid; sections snap to it; card grids get 1px-gap "panel board" seams (already half-present) formalized.
- **Color:** void stays; cyan restricted to *signal* (interactive, status-ok, focus); restrained status hues (amber only in forms, green only in terminals); glow removed except one soft hero accent.
- **Shadows:** flat panels + inset hairlines; elevation only for overlays (dropdown, modal).
- **Cards → panels:** header-row anatomy (mono label left, status/arrow right), body copy at 0.95rem; consistent across services/catalog/resources.
- **Borders:** the structural language — 1px seams everywhere, cyan only on focus/active.
- **Buttons:** two — `Primary` solid cyan and `Secondary` bordered, both sentence-case; delete the rest.
- **Animations:** purposeful state transitions only (panel hover seam-brighten, dropdown 120ms, FAQ height); hero scrub kept as the signature; terminals unified into one styling with subtle caret blink; particles kept ONLY on the index hero at ~30% density; tickers gone; scanline kept ONLY on index at 2% opacity.
- **Iconography:** monochrome 16–20px line/glyph set drawn on one grid (or geometric glyphs: ▸ ▪ ⌁) — emoji eliminated.
- **Page rhythm:** dashboard logic — dense where data lives (catalog, pricing), airy where persuasion lives (heroes, CTAs).
- **Section hierarchy:** eyebrow becomes a true "system label" (smaller, dimmer); H2 carries the weight; thin seam-rules tie sections instead of gradient bands.
- **Trust:** stat rows, terminals, and the case study become *the* proof language — "we operate systems" shown, not said; the honest "delivery not active yet" form message already speaks this voice.
- **Conversion:** CTA panel styled as a command action ("Book a consult →") once mid-page and once at end; contact form as a clean ops form.
- **Removed:** emoji, tickers, glow-pulse, off-index particles/scanlines, five button variants, stroke-outline hero line, loader cat (or keep as easter-egg lore — decision).
- **Why better:** it's the current brand *finished* — least change-risk, most differentiated locally, and it makes the dashboards/automation/security offering visually self-evident.

---

## Part 3 — Recommendation

**Option 3 — Technical Command Center — executed with Option 1's discipline.**

1. **It's already the brand's intent.** Terminals, mono labels, void+cyan, a vault, a dashboards product — the site has been reaching for "command center" from day one; it just over-decorated on the way. Options 1 and 2 replace the identity; Option 3 completes it.
2. **Lowest regression risk.** ~80% of the work is *subtraction* (emoji → glyph set, glow → seams, 7 buttons → 2, tickers/particles off) on top of the verified layout — no structural rebuilds, no Lighthouse jeopardy.
3. **It sells the product.** A company selling dashboards and automation whose site *looks like an excellent ops tool* is its own case study. Neither SaaS-minimal nor editorial does that.
4. **Borrow from Option 1:** the spacing scale, the one-button system, sentence-case CTAs, and the ~50% cyan reduction — restraint is what separates "command center" from "arcade."

**Implementation order (when approved):** ① emoji → SVG glyph set (biggest single de-AI move) · ② button consolidation · ③ motion diet (tickers/glow off; particles/scanline index-only) · ④ spacing scale + section-density pass · ⑤ unified terminal styling · ⑥ panel-anatomy pass on cards.

*Mockups: not produced in this review-only pass; a live CSS prototype of Option 3 on the homepage can be produced for visual sign-off before any sitewide rollout.*
