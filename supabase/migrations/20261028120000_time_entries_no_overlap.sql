-- Time entries can't overlap (Stage 1 week 2: timer and time log).
-- The real hourly rate divides money by hours, so an hour logged twice would make it look worse
-- than it is. A running entry counts as lasting until the end of time, so nothing can be logged
-- after it starts until it stops. Ranges are [start, end), so a timer switch that ends one entry
-- and starts the next at the same instant is fine.

create extension if not exists btree_gist with schema extensions;

alter table public.time_entries
  add constraint time_entries_no_overlap exclude using gist (
    user_id with =,
    tstzrange(started_at, coalesce(ended_at, 'infinity'::timestamptz)) with &&
  );
