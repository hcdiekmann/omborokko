create schema if not exists extensions;

alter extension pgcrypto set schema extensions;
alter extension btree_gist set schema extensions;
alter extension pg_trgm set schema extensions;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.generate_booking_reference()
returns text
language plpgsql
set search_path = public
as $$
begin
  return 'BKG-' || upper(substr(replace(extensions.gen_random_uuid()::text, '-', ''), 1, 10));
end;
$$;

create or replace function public.half_open_intervals_overlap(
  left_start date,
  left_end date,
  right_start date,
  right_end date
)
returns boolean
language sql
immutable
set search_path = public
as $$
  select left_start < right_end and left_end > right_start;
$$;
