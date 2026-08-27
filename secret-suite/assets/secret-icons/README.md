# Secret Suite — temporary product icon system

**These are placeholder marks, not finalized Secret Systems brand identities.**
Each Secret Suite application will eventually ship with its own approved logo.
Until those exist, every application uses one glyph from this shared,
cohesive line-icon system so the catalog reads as one coherent product family
instead of a set of mismatched placeholders.

## Design system

- 24×24 viewBox, matching the site-wide `.ss-ico` convention already used
  in `/catalog/`, `/contact/`, and other pages (see `ss-shared.css`).
- `stroke-width:1.6`, `stroke-linecap:round`, `stroke-linejoin:round`,
  `fill:none`, `stroke:currentColor` — identical geometry rules for all 56
  icons, so they read as one family at any size.
- Each icon is one distinct, legible symbol at 24px, 32px, 48px, and 96px.
- No emoji, no initials-as-symbol, no imitation of any competitor's mark.
- Color is inherited via `currentColor` (cyan on the catalog page, matching
  the site's existing accent), never hardcoded per icon.

## Source of truth

The path data lives in `secret-suite/secret-suite-icons.js` as
`SS_SUITE_ICON_PATHS`, keyed by app slug (e.g. `"secret-design"`). The
catalog page renders each icon inline from that map — there is no build
step and no external icon font.

## Replacing a temporary icon

When a real Secret Systems logo is approved for an application, replace its
entry in `SS_SUITE_ICON_PATHS` (or point `secretLogo` in
`secret-suite-data.js` at a real asset file) and remove the corresponding
placeholder note. Do not represent a temporary icon as a finalized logo in
any user-facing copy.
