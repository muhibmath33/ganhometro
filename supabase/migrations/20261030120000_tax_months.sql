-- Monthly tax details (Stage 1, sprint 4): the person's actual deductions and when they paid.
-- One row per user and month, only for months they changed something. Without a row, the app estimates
-- INSS from the profile's plan and uses the profile's dependents.

create table public.tax_months (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  month date not null check (extract(day from month) = 1), -- first day of the month
  inss_paid numeric(10, 2) check (inss_paid between 0 and 100000), -- null: estimate from the plan
  dependents smallint check (dependents between 0 and 20), -- null: the profile's number
  alimony numeric(10, 2) not null default 0 check (alimony between 0 and 1000000),
  other_deductions numeric(10, 2) not null default 0 check (other_deductions between 0 and 1000000),
  paid_on date, -- when the DARF (or the company's DAS) for this month was paid
  updated_at timestamptz not null default now(),
  primary key (user_id, month)
);

alter table public.tax_months enable row level security;
create policy "own rows" on public.tax_months for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.tax_months from anon;
