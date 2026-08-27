# Wiring up real checkout for /reviews/

The page is fully built — tier picker, review-destination picker, design
upload for Custom tier, order notes, live price summary. The only thing
missing is real payment: every "Buy Now" button currently falls back to
`/contact/` because no Stripe Payment Link has been created yet. This doc
is the exact, click-by-click way to fix that.

## Why Payment Links (not a custom checkout)

This site is static (GitHub Pages, no server). Stripe Payment Links are
Stripe-hosted checkout pages you create once in your Stripe dashboard —
no backend needed. Each one has its own URL; the page just links to it.

## What you need to create

**2 Payment Links** — one per tier.

| # | Tier | Price |
|---|---|---|
| 1 | Signature Black | $25 |
| 2 | Custom Design | $40 (starting price — "+" on the page since a real design may need a different size later) |

## Step-by-step: creating one Payment Link

1. Log in to your Stripe Dashboard at **dashboard.stripe.com**.
2. Make sure you're in **Live mode** (toggle top-right) once you're
   ready for real payments — use **Test mode** first if you want to
   try the flow without real money.
3. In the left sidebar, click **Payment links**.
4. Click **+ Create payment link**.
5. Under **Product**, click **+ Add a new product**.
   - Name: `Review Sign — Signature Black` (or `— Custom Design`)
   - Price: `25.00` USD (or `40.00`), **One time**
   - Add a product image if you want (optional) — you can use
     `reviews/assets/nfc-review-cards.png`.
6. Click **Add product**.
7. Scroll to **Collect additional information** (or "Custom fields" —
   the exact label varies by Stripe's current UI version) and add:
   - A **text field** labeled `Google review link (or note if you need help finding it)` — mark it **optional**.
   - A **text field** labeled `Business name` — **required** for Custom Design, optional for Signature Black.
   - A **text field** labeled `Order notes` — optional.
   - For **Custom Design only**: also mention in the product description
     that customers should email their design file to
     info@secretsystems.io after checkout, since Stripe Payment Links
     don't support real file uploads.
8. Under **After payment**, you can leave the default confirmation
   page, or set a custom "Thank you" page/message.
9. Click **Create link**.
10. Stripe shows you the finished URL — something like
    `https://buy.stripe.com/xxxxxxxxxxxx`. Click **Copy**.
11. Repeat for the second tier.

## Sending me the links

Once you have them, send me the list like:

```
Signature Black: https://buy.stripe.com/xxxx1
Custom Design: https://buy.stripe.com/xxxx2
```

I'll paste each URL into the matching `paymentLink:""` entry in
`reviews/product.js` (search for `var TIERS = {`), test that every
Buy button opens the right Stripe page, and deploy.

## What happens until then

Every Buy button currently opens `/contact/` in the same tab instead
of a broken or fake payment page — so the site never shows a dead
link, it just asks people to reach out directly until checkout is
wired up.

## About the design upload

The Custom Design tier lets customers upload their design file in the
browser for preview and reference — but this is a static site with no
file storage, so the actual file doesn't reach you through the upload
alone. The page tells customers to also email the file to
info@secretsystems.io after checkout. If you want real file uploads to
work end-to-end without the email step, that requires either a form
service with file-upload support (e.g. a Formspree/JotForm form) or a
small backend — let me know if you want to set one of those up.
