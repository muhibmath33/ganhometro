-- Plans and checkout with Mercado Pago (Stage 1, sprint 9).
-- Only the server (secret key) writes billing data. People can read their own purchases.

-- A checkout started by someone: its id is the external_reference sent to Mercado Pago, so a payment always
-- leads back here. The founding offer can be bought with just an email, before the person has an account.
create table public.checkouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  email text check (char_length(email) <= 254),
  product text not null check (product in ('monthly', 'yearly', 'founding')),
  amount numeric(12, 2) not null check (amount > 0),
  provider text not null default 'mercadopago',
  provider_ref text,                                  -- Mercado Pago preference or subscription id
  created_at timestamptz not null default now(),
  check (user_id is not null or email is not null)
);

-- Each payment Mercado Pago reports, once (re-sent notifications update the same row).
-- grant_until (subscriptions: the next charge date plus grace) or grant_months from grant_from (one-time
-- payments) say how much Pro the payment buys; added is what it actually added, so a refund can take it back.
create table public.billing_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'mercadopago',
  provider_payment_id text not null,
  checkout_id uuid references public.checkouts (id) on delete set null,
  user_id uuid references auth.users (id) on delete set null,
  email text check (char_length(email) <= 254),
  product text not null check (product in ('monthly', 'yearly', 'founding')),
  status text not null,
  amount numeric(12, 2),
  currency text,
  method text,
  grant_until timestamptz,
  grant_months smallint check (grant_months between 1 and 24),
  grant_from timestamptz,
  granted_at timestamptz,
  added interval,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_payment_id),
  check (grant_until is not null or grant_months is not null)
);
create index billing_events_user on public.billing_events (user_id);
create index billing_events_email on public.billing_events (lower(email)) where user_id is null;

alter table public.checkouts enable row level security;
alter table public.billing_events enable row level security;
create policy "own checkouts: read" on public.checkouts for select to authenticated using (user_id = (select auth.uid()));
create policy "own purchases: read" on public.billing_events for select to authenticated using (user_id = (select auth.uid()));
revoke all on public.checkouts, public.billing_events from anon;
revoke insert, update, delete on public.checkouts, public.billing_events from authenticated;

-- The monthly card subscription, as Mercado Pago last reported it (set by the server only: the column
-- grants on profiles don't include these).
alter table public.profiles
  add column subscription_id text,
  add column subscription_status text,
  add column subscription_next timestamptz;

-- Applies an approved payment's Pro time to its owner, once. Returns the new pro_until, or null when there's
-- nothing to do yet (not approved, already applied, or an email-only purchase with no account yet).
create function public.apply_billing_event(event_id uuid) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  e public.billing_events;
  uid uuid;
  before_until timestamptz;
  after_until timestamptz;
begin
  select * into e from public.billing_events where id = event_id for update;
  if not found or e.status <> 'approved' or e.granted_at is not null then
    return null;
  end if;
  uid := coalesce(e.user_id, (select u.id from auth.users u where lower(u.email) = lower(e.email) order by u.created_at limit 1));
  if uid is null then
    return null;
  end if;
  select pro_until into before_until from public.profiles where id = uid for update;
  if e.grant_until is not null then
    after_until := greatest(coalesce(before_until, now()), e.grant_until);
  else
    after_until := greatest(coalesce(before_until, now()), now(), coalesce(e.grant_from, now())) + make_interval(months => e.grant_months);
  end if;
  update public.profiles set pro_until = after_until where id = uid;
  update public.billing_events
    set user_id = uid, granted_at = now(), added = after_until - greatest(coalesce(before_until, now()), now()), updated_at = now()
    where id = event_id;
  return after_until;
end;
$$;

-- Takes back what a refunded or charged-back payment added, once.
create function public.revoke_billing_event(event_id uuid) returns timestamptz
language plpgsql security definer set search_path = '' as $$
declare
  e public.billing_events;
  after_until timestamptz;
begin
  select * into e from public.billing_events where id = event_id for update;
  if not found or e.granted_at is null or e.revoked_at is not null or e.user_id is null then
    return null;
  end if;
  update public.profiles set pro_until = pro_until - coalesce(e.added, interval '0') where id = e.user_id
    returning pro_until into after_until;
  update public.billing_events set revoked_at = now(), updated_at = now() where id = event_id;
  return after_until;
end;
$$;

revoke execute on function public.apply_billing_event(uuid), public.revoke_billing_event(uuid) from public, anon, authenticated;

-- A founding purchase made with an email before signing up is applied when that account is created.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  e record;
begin
  insert into public.profiles (id, locale)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'pt-BR' end
  );
  if new.email is not null then
    for e in
      select id from public.billing_events
      where user_id is null and granted_at is null and status = 'approved' and lower(email) = lower(new.email)
    loop
      perform public.apply_billing_event(e.id);
    end loop;
  end if;
  return new;
end;
$$;

-- Pro features are Pro in the database too, not only in the screens: creating or changing projects,
-- invoices and monthly tax details needs Pro. (Reading and deleting stay open, so nothing is ever locked in.)
create policy "pro: add" on public.projects as restrictive for insert to authenticated with check (public.is_pro((select auth.uid())));
create policy "pro: change" on public.projects as restrictive for update to authenticated
  using (public.is_pro((select auth.uid()))) with check (public.is_pro((select auth.uid())));
create policy "pro: add" on public.invoices as restrictive for insert to authenticated with check (public.is_pro((select auth.uid())));
create policy "pro: change" on public.invoices as restrictive for update to authenticated
  using (public.is_pro((select auth.uid()))) with check (public.is_pro((select auth.uid())));
create policy "pro: add" on public.tax_months as restrictive for insert to authenticated with check (public.is_pro((select auth.uid())));
create policy "pro: change" on public.tax_months as restrictive for update to authenticated
  using (public.is_pro((select auth.uid()))) with check (public.is_pro((select auth.uid())));
