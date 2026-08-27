# Wiring up real checkout for /reviews/

The page is fully built — style picker, tier picker, Google-review-link
field with a built-in "how to find it" guide, order notes, live price
summary. The only thing missing is real payment: every "Buy Now" button
currently falls back to `/contact/` because no Stripe Payment Link has
been created yet. This doc is the exact, click-by-click way to fix that.

## Why Payment Links (not a custom checkout)

This site is static (GitHub Pages, no server). Stripe Payment Links are
Stripe-hosted checkout pages you create once in your Stripe dashboard —
no backend needed. Each one has its own URL; the page just links to it.

## What you need to create

**11 Payment Links total** — one per row below. Each is a one-time
payment (not a subscription).

| # | Style (as shown on the page) | Tier | Price |
|---|---|---|---|
| 1 | Classic Google (Standard) | Standard | $25 |
| 2 | Signature Black | Branded | $40 |
| 3 | Gold Salon | Branded | $40 |
| 4 | Stay Connected | Branded | $40 |
| 5 | Feedback Matters | Branded | $40 |
| 6 | Tooth Outline | Branded | $40 |
| 7 | Love Your Visit | Branded | $40 |
| 8 | Like Your Cut | Branded | $40 |
| 9 | Fine Dining | Branded | $40 |
| 10 | Auto Shop | Branded | $40 |
| 11 | Share The Love | Branded | $40 |

If that's too many to start, just create **#1 and #2** — I can wire
those in and leave the rest pointing at `/contact/` until you add more.

## Step-by-step: creating one Payment Link

1. Log in to your Stripe Dashboard at **dashboard.stripe.com**.
2. Make sure you're in **Live mode** (toggle top-right) once you're
   ready for real payments — use **Test mode** first if you want to
   try the flow without real money.
3. In the left sidebar, click **Payment links**.
4. Click **+ Create payment link**.
5. Under **Product**, click **+ Add a new product**.
   - Name: e.g. `Review Card — Signature Black`
   - Price: `40.00` USD, **One time**
   - Add the product image if you want (optional) — you can use the
     matching file from `reviews/assets/styles/` or
     `reviews/assets/nfc-review-cards.png`.
6. Click **Add product**.
7. Scroll to **Collect additional information** (or "Custom fields" —
   the exact label varies by Stripe's current UI version) and add:
   - A **text field** labeled `Google review link (or note if you need help finding it)` — mark it **optional**.
   - A **text field** labeled `Business name` — mark it **required** for Branded styles, optional for Standard.
   - A **text field** labeled `Order notes` — optional.
8. Under **After payment**, you can leave the default confirmation
   page, or set a custom "Thank you" page/message.
9. Click **Create link**.
10. Stripe shows you the finished URL — something like
    `https://buy.stripe.com/xxxxxxxxxxxx`. Click **Copy**.
11. Repeat for each row in the table above.

## Sending me the links

Once you have them, send me the list like:

```
Classic Google (Standard): https://buy.stripe.com/xxxx1
Signature Black: https://buy.stripe.com/xxxx2
Gold Salon: https://buy.stripe.com/xxxx3
...
```

I'll paste each URL into the matching `paymentLink:""` entry in
`reviews/product.js` (search for `var STYLES = [`), test that every
Buy button opens the right Stripe page, and deploy.

## What happens until then

Every Buy button currently opens `/contact/` in the same tab instead
of a broken or fake payment page — so the site never shows a dead
link, it just asks people to reach out directly until checkout is
wired up.
