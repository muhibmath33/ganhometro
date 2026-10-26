-- Payments, exchange rates and tax settings (Stage 1, sprint 3).

-- Banco Central PTAX rates, shared by everyone. Users can read them; only the server writes them
-- (the daily job, and on demand when a payment needs a rate that isn't stored yet).
create table public.ptax_rates (
  currency text not null check (currency in ('USD', 'EUR', 'GBP')),
  day date not null,
  buy numeric(12, 6) not null check (buy > 0),
  sell numeric(12, 6) not null check (sell > 0),
  usd_parity numeric(12, 6) not null default 1 check (usd_parity > 0), -- US$ per unit (1 for USD)
  primary key (currency, day)
);
alter table public.ptax_rates enable row level security;
create policy "rates: read" on public.ptax_rates for select to authenticated using (true);
revoke all on public.ptax_rates from anon;
revoke insert, update, delete on public.ptax_rates from authenticated;

-- Payments: where a row came from. import_ref identifies a row of an imported statement, so importing
-- the same file twice doesn't create duplicates.
alter table public.payments
  add column origin text not null default 'manual' check (origin in ('manual', 'import')),
  add column import_ref text check (char_length(import_ref) <= 120),
  add constraint payments_import_ref unique (user_id, import_ref);

-- More ways the money arrives.
alter table public.payments drop constraint payments_method_check;
alter table public.payments add constraint payments_method_check check (
  method in ('wise', 'payoneer', 'paypal', 'husky', 'remessa', 'nomad', 'deel', 'upwork', 'bank', 'pix', 'airtm', 'other')
);

-- How the person is paid, for the take-home and tax estimates.
alter table public.profiles
  add column tax_mode text not null default 'pf' check (tax_mode in ('pf', 'cnpj')),
  add column inss_plan text not null default 'full' check (inss_plan in ('full', 'simplified', 'none')),
  add column dependents smallint not null default 0 check (dependents between 0 and 20),
  add column accountant_cost numeric(8, 2) not null default 250 check (accountant_cost between 0 and 10000);
grant update (tax_mode, inss_plan, dependents, accountant_cost) on public.profiles to authenticated;
