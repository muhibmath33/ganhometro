-- Documents (Stage 1, sprint 7): what goes on invoices, timesheets and the income report.

-- The person's name and details as they want them printed (CPF/CNPJ and address are optional and free text),
-- and how clients should pay them (bank, Wise, PayPal…).
alter table public.profiles
  add column doc_name text check (char_length(doc_name) <= 100),
  add column doc_details text check (char_length(doc_details) <= 600),
  add column payment_instructions text check (char_length(payment_instructions) <= 1000);
grant update (doc_name, doc_details, payment_instructions) on public.profiles to authenticated;

-- A client's billing details for the "Bill to" block of an invoice.
alter table public.income_sources
  add column billing_details text check (char_length(billing_details) <= 600);
