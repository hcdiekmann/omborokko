alter table public.campsite_units
  add column if not exists child_price_per_night numeric(12,2);

update public.campsite_units
set
  base_price_per_night = 300.00,
  child_price_per_night = 200.00,
  cleaning_fee = 0.00
where true;

alter table public.campsite_units
  alter column child_price_per_night set default 200.00,
  alter column child_price_per_night set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'campsite_units_child_price_chk'
      and conrelid = 'public.campsite_units'::regclass
  ) then
    alter table public.campsite_units
      add constraint campsite_units_child_price_chk
      check (child_price_per_night >= 0);
  end if;
end $$;

alter table public.bookings
  add column if not exists adult_guests_count integer,
  add column if not exists child_guests_count integer;

update public.bookings
set
  adult_guests_count = coalesce(adult_guests_count, guests_count),
  child_guests_count = coalesce(child_guests_count, 0)
where adult_guests_count is null
   or child_guests_count is null;

alter table public.bookings
  alter column adult_guests_count set default 0,
  alter column adult_guests_count set not null,
  alter column child_guests_count set default 0,
  alter column child_guests_count set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_adult_guests_count_chk'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_adult_guests_count_chk
      check (adult_guests_count >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_child_guests_count_chk'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_child_guests_count_chk
      check (child_guests_count >= 0);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_guest_split_matches_total_chk'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_guest_split_matches_total_chk
      check (adult_guests_count + child_guests_count = guests_count);
  end if;
end $$;

drop function if exists public.create_booking_request(
  uuid,
  date,
  date,
  text,
  text,
  text,
  text,
  integer,
  text
);

create or replace function public.create_booking_request(
  p_campsite_unit_id uuid,
  p_check_in_date date,
  p_check_out_date date,
  p_guest_first_name text,
  p_guest_last_name text,
  p_guest_email text,
  p_guest_phone text,
  p_adult_guests_count integer,
  p_child_guests_count integer,
  p_notes text default null
)
returns table (
  booking_id uuid,
  booking_reference text,
  status public.booking_status
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_unit public.campsite_units%rowtype;
  v_nights integer;
  v_fees numeric(12,2);
  v_subtotal numeric(12,2);
  v_total numeric(12,2);
  v_guests_count integer;
  v_nightly_rate numeric(12,2);
  v_booking public.bookings%rowtype;
begin
  if p_check_out_date <= p_check_in_date then
    raise exception 'check_out_date must be later than check_in_date'
      using errcode = '22023';
  end if;

  if p_adult_guests_count < 0 or p_child_guests_count < 0 then
    raise exception 'guest counts cannot be negative'
      using errcode = '22023';
  end if;

  v_guests_count := p_adult_guests_count + p_child_guests_count;

  if v_guests_count <= 0 then
    raise exception 'at least one guest is required'
      using errcode = '22023';
  end if;

  select *
  into v_unit
  from public.campsite_units
  where id = p_campsite_unit_id
    and active = true;

  if not found then
    raise exception 'Active campsite unit not found'
      using errcode = 'P0002';
  end if;

  if v_guests_count > v_unit.max_guests then
    raise exception 'Requested guests exceed the unit capacity'
      using errcode = '22023';
  end if;

  v_nights := p_check_out_date - p_check_in_date;
  v_fees := 0;
  v_nightly_rate := (p_adult_guests_count * v_unit.base_price_per_night) + (p_child_guests_count * v_unit.child_price_per_night);
  v_subtotal := v_nights * v_nightly_rate;
  v_total := v_subtotal + v_fees;

  insert into public.bookings (
    campsite_unit_id,
    user_id,
    guest_first_name,
    guest_last_name,
    guest_email,
    guest_phone,
    guests_count,
    adult_guests_count,
    child_guests_count,
    check_in_date,
    check_out_date,
    nights,
    subtotal_amount,
    fees_amount,
    total_amount,
    currency,
    status,
    payment_status,
    notes
  )
  values (
    p_campsite_unit_id,
    auth.uid(),
    btrim(p_guest_first_name),
    btrim(p_guest_last_name),
    lower(btrim(p_guest_email)),
    nullif(btrim(coalesce(p_guest_phone, '')), ''),
    v_guests_count,
    p_adult_guests_count,
    p_child_guests_count,
    p_check_in_date,
    p_check_out_date,
    v_nights,
    v_subtotal,
    v_fees,
    v_total,
    'NAD',
    'pending',
    'unpaid',
    nullif(btrim(coalesce(p_notes, '')), '')
  )
  returning *
  into v_booking;

  return query
  select v_booking.id, v_booking.booking_reference, v_booking.status;
end;
$$;

comment on function public.create_booking_request(
  uuid,
  date,
  date,
  text,
  text,
  text,
  text,
  integer,
  integer,
  text
) is 'Safe guest/public booking insert path. It always creates pending, unpaid requests and computes adult and child campsite pricing on the server side.';

revoke all on function public.create_booking_request(
  uuid,
  date,
  date,
  text,
  text,
  text,
  text,
  integer,
  integer,
  text
) from public;

grant execute on function public.create_booking_request(
  uuid,
  date,
  date,
  text,
  text,
  text,
  text,
  integer,
  integer,
  text
) to anon, authenticated;
