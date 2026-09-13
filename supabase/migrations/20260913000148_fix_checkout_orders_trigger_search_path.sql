-- Address function_search_path_mutable advisory warning on the
-- checkout_orders updated_at trigger function.
create or replace function public.checkout_orders_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
