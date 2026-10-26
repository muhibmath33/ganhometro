-- Reserves and email (Stage 1, sprint 5).

-- Reserves: the salary the person pays themselves, and what to set aside from what's left.
-- Email: which messages they want.
alter table public.profiles
  add column salary_target numeric(10, 2) check (salary_target between 0 and 1000000), -- null: not set
  add column reserve_13th boolean not null default true,
  add column reserve_vacation boolean not null default true,
  add column emergency_pct numeric(5, 2) not null default 10 check (emergency_pct between 0 and 100),
  add column emergency_months smallint not null default 6 check (emergency_months between 0 and 24),
  add column email_reminders boolean not null default true,
  add column email_weekly boolean not null default true;
grant update (salary_target, reserve_13th, reserve_vacation, emergency_pct, emergency_months, email_reminders, email_weekly)
  on public.profiles to authenticated;

-- Every email the app sends, so a reminder goes out once. ref identifies it, e.g. "darf:2026-09:d5".
-- Written by the server's jobs only; users have no access.
create table public.email_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('darf_reminder', 'late_payment', 'weekly_summary')),
  ref text not null check (char_length(ref) <= 120),
  sent_at timestamptz not null default now(),
  primary key (user_id, type, ref)
);
alter table public.email_log enable row level security;
revoke all on public.email_log from anon, authenticated;
