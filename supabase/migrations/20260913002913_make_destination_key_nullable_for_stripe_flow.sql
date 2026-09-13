-- destination_key was a required field for the OLD HighLevel flow
-- (it recorded which HighLevel payment-link destination the order was
-- routed to). The new create-stripe-checkout flow has no equivalent
-- concept and never sets it, so the NOT NULL constraint made every
-- new-flow order insert fail. Make it nullable; the old flow already
-- always supplies a value, so this is a pure widening, zero-risk to
-- the existing validate-checkout behavior.
alter table public.checkout_orders
  alter column destination_key drop not null;
