alter table public.bookings
  add column if not exists guest_message text;

comment on column public.bookings.guest_message is 'Guest-facing message shown in booking status emails and public booking status lookups.';

update public.bookings
set guest_message = admin_notes
where guest_message is null
  and admin_notes is not null;

create index if not exists bookings_guest_lookup_idx
  on public.bookings (lower(guest_email), upper(booking_reference));

drop function if exists public.get_booking_request_by_client_request_id(text);

create or replace function public.get_booking_request_by_client_request_id(
  p_client_request_id text
)
returns table (
  booking_id uuid,
  booking_reference text,
  status public.booking_status,
  check_in_date date,
  check_out_date date,
  requested_unit_count integer,
  guest_email text,
  guest_message text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    b.id,
    b.booking_reference,
    b.status,
    b.check_in_date,
    b.check_out_date,
    b.requested_unit_count,
    b.guest_email,
    b.guest_message,
    b.created_at
  from public.bookings b
  where b.client_request_id = nullif(btrim(coalesce(p_client_request_id, '')), '')
  order by b.created_at desc
  limit 1;
$$;

comment on function public.get_booking_request_by_client_request_id(text) is 'Public recovery lookup for a booking request known by the browser-held idempotency key.';

revoke all on function public.get_booking_request_by_client_request_id(text) from public;
grant execute on function public.get_booking_request_by_client_request_id(text) to anon, authenticated;

create or replace function public.get_booking_request_by_guest_lookup(
  p_guest_email text,
  p_booking_reference text
)
returns table (
  booking_id uuid,
  booking_reference text,
  status public.booking_status,
  check_in_date date,
  check_out_date date,
  requested_unit_count integer,
  guest_email text,
  guest_message text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select
    b.id,
    b.booking_reference,
    b.status,
    b.check_in_date,
    b.check_out_date,
    b.requested_unit_count,
    b.guest_email,
    b.guest_message,
    b.created_at
  from public.bookings b
  where lower(b.guest_email) = lower(btrim(coalesce(p_guest_email, '')))
    and upper(b.booking_reference) = upper(regexp_replace(btrim(coalesce(p_booking_reference, '')), '\s+', '', 'g'))
  order by b.created_at desc
  limit 1;
$$;

comment on function public.get_booking_request_by_guest_lookup(text, text) is 'Public booking status lookup for guests who know both the booking reference and matching email address.';

revoke all on function public.get_booking_request_by_guest_lookup(text, text) from public;
grant execute on function public.get_booking_request_by_guest_lookup(text, text) to anon, authenticated;


create or replace function public.admin_confirm_booking(
  p_booking_id uuid,
  p_admin_notes text default null
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings%rowtype;
  v_unit_ids uuid[];
begin
  if not public.is_admin() then
    raise exception 'Only admins may confirm bookings'
      using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended('campsite-booking-confirmation', 0));

  select *
  into v_booking
  from public.bookings
  where id = p_booking_id
  for update;

  if not found then
    raise exception 'Booking not found'
      using errcode = 'P0002';
  end if;

  if v_booking.status <> 'pending' then
    raise exception 'Only pending bookings can be confirmed'
      using errcode = '22023';
  end if;

  select array_agg(available.id order by available.name)
  into v_unit_ids
  from (
    select id, name
    from public.get_available_campsite_units(v_booking.check_in_date, v_booking.check_out_date)
    order by name
    limit v_booking.requested_unit_count
  ) as available;

  if coalesce(array_length(v_unit_ids, 1), 0) < v_booking.requested_unit_count then
    raise exception 'Not enough campsites are available to confirm this booking'
      using errcode = '23P01';
  end if;

  delete from public.booking_units
  where booking_id = v_booking.id;

  insert into public.booking_units (booking_id, campsite_unit_id, start_date, end_date)
  select
    v_booking.id,
    assigned_unit_id,
    v_booking.check_in_date,
    v_booking.check_out_date
  from unnest(v_unit_ids) as assigned_unit_id;

  update public.bookings
  set
    status = 'confirmed',
    admin_notes = nullif(btrim(coalesce(p_admin_notes, '')), ''),
    guest_message = nullif(btrim(coalesce(p_admin_notes, '')), ''),
    campsite_unit_id = v_unit_ids[1]
  where id = p_booking_id
  returning *
  into v_booking;

  return v_booking;
end;
$$;

comment on function public.admin_confirm_booking(uuid, text) is 'Admin-only confirmation path. It assigns available campsite units atomically and only then marks the booking confirmed.';

create or replace function public.get_campsite_nightly_availability(
  p_start_date date,
  p_end_date date,
  p_requested_unit_count integer default 1
)
returns table (
  night_date date,
  available_count integer,
  total_count integer,
  requested_unit_count integer,
  availability_status text
)
language sql
stable
set search_path = public
as $$
  with bounded_input as (
    select
      p_start_date as start_date,
      least(p_end_date, p_start_date + 120) as end_date,
      greatest(coalesce(p_requested_unit_count, 1), 1) as requested_count
    where p_start_date is not null
      and p_end_date is not null
      and p_end_date > p_start_date
  ),
  total_inventory as (
    select count(*)::integer as total_count
    from public.campsite_units
    where active = true
  ),
  nights as (
    select day::date as night_date
    from bounded_input input
    cross join generate_series(input.start_date, input.end_date - 1, interval '1 day') as day
  ),
  nightly_counts as (
    select
      nights.night_date,
      (
        select count(*)::integer
        from public.get_available_campsite_units(nights.night_date, nights.night_date + 1)
      ) as available_count,
      total_inventory.total_count,
      bounded_input.requested_count
    from nights
    cross join total_inventory
    cross join bounded_input
  )
  select
    night_date,
    available_count,
    total_count,
    requested_count,
    case
      when available_count < requested_count then 'full'
      when available_count < total_count then 'limited'
      else 'available'
    end as availability_status
  from nightly_counts
  order by night_date;
$$;

comment on function public.get_campsite_nightly_availability(date, date, integer) is 'Public nightly campsite availability summary used to display calendar hints.';

revoke all on function public.get_campsite_nightly_availability(date, date, integer) from public;
grant execute on function public.get_campsite_nightly_availability(date, date, integer) to anon, authenticated;
