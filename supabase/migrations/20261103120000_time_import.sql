-- Importing hours from Toggl and Clockify (Stage 1, sprint 8).

-- Imported entries remember where they came from, so importing the same file twice adds nothing.
alter table public.time_entries drop constraint time_entries_origin_check;
alter table public.time_entries
  add constraint time_entries_origin_check check (origin in ('timer', 'manual', 'extension', 'import'));
alter table public.time_entries add column import_ref text check (char_length(import_ref) <= 120);
create unique index time_entries_user_import_ref on public.time_entries (user_id, import_ref);
