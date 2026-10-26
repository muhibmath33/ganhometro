-- Projects, retainers, time without a client, and invoices (Stage 1, sprint 6).

-- Monthly retainers: "the client pays US$ 2.000 a month". rate holds the monthly amount.
alter type public.pay_model add value if not exists 'retainer';

-- Time without a client (proposals, prospecting, admin): no source, and always unpaid.
alter table public.time_entries alter column source_id drop not null;
alter table public.time_entries
  add constraint time_entries_unpaid_without_source check (source_id is not null or kind = 'unpaid');

-- Projects: same pay as the client (nothing set), their own hourly rate, or a fixed price.
alter table public.projects add constraint projects_pay check (
  (pay_model is null and rate is null and fixed_price is null)
  or (pay_model = 'hourly' and rate is not null and fixed_price is null)
  or (pay_model = 'fixed' and fixed_price is not null and rate is null)
);

-- Invoices sent to clients. Paid, partly paid and overdue are worked out from the payments linked to them.
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  source_id uuid not null,
  project_id uuid,
  number text not null check (char_length(btrim(number)) between 1 and 30),
  issued_on date not null,
  due_on date not null check (due_on >= issued_on),
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'USD' check (currency in ('USD', 'EUR', 'GBP', 'BRL')),
  period_start date,
  period_end date check (period_end is null or period_start is null or period_end >= period_start),
  status text not null default 'sent' check (status in ('draft', 'sent', 'void')),
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, number),
  foreign key (source_id, user_id) references public.income_sources (id, user_id) on delete cascade,
  foreign key (project_id, user_id) references public.projects (id, user_id) on delete set null (project_id)
);
create index invoices_user_due on public.invoices (user_id, due_on);
alter table public.invoices enable row level security;
create policy "own rows" on public.invoices for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.invoices from anon;

-- A payment can settle an invoice (or part of it).
alter table public.payments
  add column invoice_id uuid,
  add constraint payments_invoice_fk foreign key (invoice_id, user_id)
    references public.invoices (id, user_id) on delete set null (invoice_id);
