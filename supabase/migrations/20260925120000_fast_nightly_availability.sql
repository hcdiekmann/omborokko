-- Faster nightly availability for the booking calendar.
--
-- The previous get_campsite_nightly_availability() called
-- get_available_campsite_units() once per night, which in turn called
-- get_unit_conflicts() once per campsite unit. A 120-night window therefore
-- ran 120 x (number of units) correlated sub-queries. This version reads the
-- confirmed bookings and blocks that overlap the window once and counts the
-- occupied units per night in a single set-based pass.
--
-- The window cap is raised from 120 to 560 nights so the calendar can load
-- its full 18-month booking horizon in one request.
--
-- Both public availability functions become SECURITY DEFINER. Anonymous
-- visitors have no RLS read access to bookings, booking_units or
-- booking_blocks, so as SECURITY INVOKER functions they could not see any
-- conflicts and reported every night as available. They only return
-- per-night counts and public campsite details, never booking data.

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
security definer
set search_path = public
as $$
  with bounded_input as (
    select
      p_start_date as start_date,
      least(p_end_date, p_start_date + 560) as end_date,
      greatest(coalesce(p_requested_unit_count, 1), 1) as requested_count
    where p_start_date is not null
      and p_end_date is not null
      and p_end_date > p_start_date
  ),
  active_units as (
    select cu.id
    from public.campsite_units cu
    where cu.active = true
  ),
  total_inventory as (
    select count(*)::integer as total_count
    from active_units
  ),
  occupancy as (
    select bu.campsite_unit_id, bu.start_date, bu.end_date
    from public.booking_units bu
    join public.bookings b on b.id = bu.booking_id
    cross join bounded_input input
    where b.status = 'confirmed'
      and bu.start_date < input.end_date
      and bu.end_date > input.start_date
    union all
    select bb.campsite_unit_id, bb.start_date, bb.end_date
    from public.booking_blocks bb
    cross join bounded_input input
    where bb.start_date < input.end_date
      and bb.end_date > input.start_date
  ),
  nights as (
    select day::date as night_date
    from bounded_input input
    cross join generate_series(input.start_date, input.end_date - 1, interval '1 day') as day
  ),
  occupied_per_night as (
    select
      nights.night_date,
      count(distinct occupancy.campsite_unit_id)::integer as occupied_count
    from nights
    join occupancy
      on nights.night_date >= occupancy.start_date
     and nights.night_date < occupancy.end_date
    join active_units on active_units.id = occupancy.campsite_unit_id
    group by nights.night_date
  ),
  nightly_counts as (
    select
      nights.night_date,
      total_inventory.total_count - coalesce(occupied_per_night.occupied_count, 0) as available_count,
      total_inventory.total_count,
      bounded_input.requested_count
    from nights
    cross join total_inventory
    cross join bounded_input
    left join occupied_per_night on occupied_per_night.night_date = nights.night_date
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

comment on function public.get_campsite_nightly_availability(date, date, integer) is 'Public nightly campsite availability summary used to display calendar hints. Set-based; returns counts only.';

revoke all on function public.get_campsite_nightly_availability(date, date, integer) from public;
grant execute on function public.get_campsite_nightly_availability(date, date, integer) to anon, authenticated;

alter function public.get_available_campsite_units(date, date) security definer;
