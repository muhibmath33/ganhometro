-- Ganhômetro core schema (Stage 1, docs/stage1-proposal.md §4).
-- Every user table has user_id + Row Level Security: people only ever see their own rows.
-- Composite foreign keys (id, user_id) stop anyone from attaching rows to another user's data.
-- Privacy rule: time and money only. There is deliberately no free-text "notes" field on entries.

create type public.work_type as enum ('ai', 'freelancer', 'teacher', 'creator', 'other');
create type public.plan as enum ('free', 'pro');
create type public.source_kind as enum ('platform', 'client');
create type public.pay_model as enum ('hourly', 'per_task', 'fixed');
create type public.pay_schedule as enum ('weekly', 'biweekly', 'monthly', 'on_invoice', 'irregular');
create type public.entry_kind as enum ('paid', 'unpaid');

-- Profiles ------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  locale text not null default 'pt-BR' check (locale in ('pt-BR', 'en')),
  timezone text not null default 'America/Sao_Paulo',
  work_type public.work_type,
  plan public.plan not null default 'free',
  pro_until timestamptz,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

-- A profile is created with each new account.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, locale)
  values (
    new.id,
    case when new.raw_user_meta_data ->> 'locale' = 'en' then 'en' else 'pt-BR' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Pro if the plan says so, or a founding purchase is still valid.
create function public.is_pro(uid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select p.plan = 'pro' or (p.pro_until is not null and p.pro_until > now())
     from public.profiles p where p.id = uid),
    false
  );
$$;

-- Income sources: a platform (Mercor, Upwork, Cambly…) or a client ------------

create table public.income_sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.source_kind not null default 'platform',
  name text not null check (char_length(btrim(name)) between 1 and 60),
  pay_model public.pay_model not null default 'hourly',
  rate numeric(10, 2) check (rate >= 0),               -- per hour or per task; null for fixed-price
  currency text not null default 'USD' check (currency in ('USD', 'EUR', 'GBP', 'BRL')),
  commission_pct numeric(5, 2) check (commission_pct between 0 and 100),
  pay_schedule public.pay_schedule not null default 'weekly',
  pay_weekday smallint check (pay_weekday between 0 and 6),        -- 0 = Sunday
  pay_day smallint check (pay_day between 1 and 31),
  payment_terms_days smallint check (payment_terms_days between 0 and 180),
  grace_days smallint not null default 2 check (grace_days between 0 and 30),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);
create index income_sources_user_active on public.income_sources (user_id) where archived_at is null;

-- Free plan: at most 2 active income sources (also checked in the app).
create function public.enforce_free_source_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  -- Rows the caller doesn't own are rejected by RLS; don't reveal another user's count here.
  if auth.uid() is not null and new.user_id <> auth.uid() then
    return new;
  end if;
  if new.archived_at is null and not public.is_pro(new.user_id) then
    if (select count(*) from public.income_sources s
        where s.user_id = new.user_id and s.archived_at is null and s.id <> new.id) >= 2 then
      raise exception 'free_source_limit' using errcode = 'P0001';
    end if;
  end if;
  return new;
end;
$$;

create trigger income_sources_free_limit
  before insert or update of archived_at on public.income_sources
  for each row execute function public.enforce_free_source_limit();

-- Projects (Pro): optional per-project rate or fixed price ---------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 60),
  pay_model public.pay_model,
  rate numeric(10, 2) check (rate >= 0),
  fixed_price numeric(12, 2) check (fixed_price >= 0),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id),
  foreign key (source_id, user_id) references public.income_sources (id, user_id) on delete cascade
);

-- Categories: paid/unpaid labels, preset by type of work, editable --------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind public.entry_kind not null,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  preset text,                                          -- e.g. guidelines, tests, waiting, rework, proposals
  sort smallint not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, user_id)
);

-- Time entries (timer or manual) ---------------------------------------------

create table public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source_id uuid not null,
  project_id uuid,
  kind public.entry_kind not null,
  category_id uuid,
  units integer check (units >= 0),                     -- tasks/videos done, for per-task pay
  started_at timestamptz not null,
  ended_at timestamptz check (ended_at is null or ended_at > started_at),
  origin text not null default 'timer' check (origin in ('timer', 'manual', 'extension')),
  created_at timestamptz not null default now(),
  foreign key (source_id, user_id) references public.income_sources (id, user_id) on delete cascade,
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete set null (project_id),
  foreign key (category_id, user_id) references public.categories (id, user_id) on delete set null (category_id)
);
create index time_entries_user_started on public.time_entries (user_id, started_at desc);
-- Only one timer can run at a time.
create unique index time_entries_one_running on public.time_entries (user_id) where ended_at is null;

-- Payments received ------------------------------------------------------------

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source_id uuid not null,
  project_id uuid,
  expected_on date,
  received_on date not null,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'USD' check (currency in ('USD', 'EUR', 'GBP', 'BRL')),
  period_start date,
  period_end date check (period_end is null or period_start is null or period_end >= period_start),
  method text check (method in ('paypal', 'payoneer', 'wise', 'airtm', 'bank', 'pix', 'other')),
  amount_brl_received numeric(12, 2) check (amount_brl_received >= 0),
  created_at timestamptz not null default now(),
  foreign key (source_id, user_id) references public.income_sources (id, user_id) on delete cascade,
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete set null (project_id)
);
create index payments_user_received on public.payments (user_id, received_on desc);

-- Row Level Security -------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.income_sources enable row level security;
alter table public.projects enable row level security;
alter table public.categories enable row level security;
alter table public.time_entries enable row level security;
alter table public.payments enable row level security;

-- Profiles: read and update your own (created by the trigger, never deleted directly).
create policy "own profile: read" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "own profile: update" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- Plan fields are set by billing (service role) only, never by the user. A column-level revoke
-- doesn't override Supabase's table-level grant, so revoke the table and grant back what users may edit.
revoke update on public.profiles from authenticated;
grant update (locale, timezone, work_type, onboarded_at) on public.profiles to authenticated;

-- Everything else: full access to your own rows.
do $$
declare t text;
begin
  foreach t in array array['income_sources', 'projects', 'categories', 'time_entries', 'payments'] loop
    execute format(
      'create policy "own rows" on public.%I for all to authenticated
         using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
  end loop;
end;
$$;

-- No access for signed-out visitors.
revoke all on public.profiles, public.income_sources, public.projects, public.categories,
  public.time_entries, public.payments from anon;
