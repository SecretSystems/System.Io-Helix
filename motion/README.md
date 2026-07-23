# Secret Systems — Motion Workspace

An **offline** [Remotion](https://www.remotion.dev) project for producing premium
animation assets (video + stills) that get **exported and embedded** into the
static site as plain `<video>`/`<img>` files.

> **The production website never depends on this.**
> secretsystems.io ships hand-written HTML/CSS/JS with no framework or build step.
> Remotion lives here, is run by hand, and only its *rendered output* (an `.mp4`,
> `.webm`, or `.png`) is ever copied into the site. Installing this folder's
> dependencies does not touch the site.

## Why it's separate

The homepage explains the automated lead-response pipeline with a lightweight
inline SVG (fast, accessible, zero JS). When we want a richer **moving** version
of that story — for social, ads, or an embedded hero clip — we render it here and
drop the finished file in. The site stays dependency-light; the motion stays
high-production.

## Setup

```bash
cd motion
npm install
```

## Preview

```bash
npm run studio        # opens Remotion Studio to scrub the compositions
```

## Render assets

```bash
npm run render:leadflow        # -> out/lead-flow.mp4   (opaque, dark background)
npm run render:leadflow-webm   # -> out/lead-flow.webm  (VP8, for overlay use)
npm run still:leadflow         # -> out/lead-flow-poster.png (final frame poster)
```

Outputs land in `motion/out/` (gitignored).

## Embed into the site

1. Render the asset (above).
2. Copy it into the repo, e.g. `assets/motion/lead-flow.webm` (+ a poster PNG).
3. Reference it in the page with a plain, lazy, muted, poster-backed tag:

```html
<video
  src="assets/motion/lead-flow.webm"
  poster="assets/motion/lead-flow-poster.png"
  autoplay muted loop playsinline preload="none"
  width="880" height="1040"
  aria-label="Automated lead-response pipeline: lead captured, auto-text sent, AI qualifies, appointment booked, CRM updated.">
</video>
```

Keep the inline SVG as the reduced-motion / no-JS fallback where possible.

## Compositions

| id | file | what it shows |
|----|------|---------------|
| `LeadFlow` | `src/LeadFlow.tsx` | The 5-stage lead-response pipeline, stages settling in with a single lead pulse travelling the flow. |

Palette and copy mirror the site so exported assets match exactly:
`--void #020408`, `--cyan #00c8ff`, node `#0a1826`, stroke `#1c3a52`.

## House rules

- **Motion must communicate.** Every composition should teach the viewer
  something about how the systems work — no decorative loops.
- **Match the brand.** Use the palette above and the site's type
  (Syne / Outfit / JetBrains Mono).
- **Export, don't couple.** Only rendered files enter the site. Never add a
  Remotion/React runtime dependency to the production pages.
