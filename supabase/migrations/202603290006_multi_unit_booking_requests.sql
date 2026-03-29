alter table public.bookings
  alter column campsite_unit_id drop not null;

alter table public.bookings
  add column if not exists requested_unit_count integer;

update public.bookings
set requested_unit_count = 1
where requested_unit_count is null;

alter table public.bookings
  alter column requested_unit_count set default 1,
  alter column requested_unit_count set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'bookings_requested_unit_count_chk'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      add constraint bookings_requested_unit_count_chk
      check (requested_unit_count > 0);
  end if;
end $$;

create table if not exists public.booking_units (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  campsite_unit_id uuid not null references public.campsite_units(id) on delete restrict,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_units_date_order_chk check (end_date > start_date),
  constraint booking_units_booking_unit_uniq unique (booking_id, campsite_unit_id)
);

comment on table public.booking_units is 'Concrete campsite assignments for confirmed bookings. These rows, not pending bookings, block inventory.';

create index if not exists booking_units_booking_id_idx
  on public.booking_units (booking_id);

create index if not exists booking_units_campsite_unit_id_idx
  on public.booking_units (campsite_unit_id);

create index if not exists booking_units_start_date_idx
  on public.booking_units (start_date);

create index if not exists booking_units_end_date_idx
  on public.booking_units (end_date);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'booking_units_no_overlap_excl'
      and conrelid = 'public.booking_units'::regclass
  ) then
    alter table public.booking_units
      add constraint booking_units_no_overlap_excl
      exclude using gist (
        campsite_unit_id with =,
        daterange(start_date, end_date, '[)') with &&
      );
  end if;
end $$;

insert into public.booking_units (booking_id, campsite_unit_id, start_date, end_date, created_at, updated_at)
select
  b.id,
  b.campsite_unit_id,
  b.check_in_date,
  b.check_out_date,
  b.created_at,
  b.updated_at
from public.bookings b
where b.status = 'confirmed'
  and b.campsite_unit_id is not null
on conflict (booking_id, campsite_unit_id) do nothing;

drop trigger if exists bookings_prevent_block_overlap on public.bookings;

drop trigger if exists booking_units_set_updated_at on public.booking_units;
create trigger booking_units_set_updated_at
before update on public.booking_units
for each row
execute function public.set_updated_at();

drop trigger if exists booking_units_prevent_block_overlap on public.booking_units;

drop trigger if exists bookings_clear_primary_unit_on_status_change on public.bookings;
drop trigger if exists bookings_remove_assignments_on_status_change on public.bookings;

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'bookings_confirmed_no_overlap_excl'
      and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings
      drop constraint bookings_confirmed_no_overlap_excl;
  end if;
end $$;

create or replace function public.clear_booking_primary_unit_on_status_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status <> 'confirmed' then
    new.campsite_unit_id = null;
  end if;

  return new;
end;
$$;

create or replace function public.remove_booking_assignments_on_status_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status <> 'confirmed' then
    delete from public.booking_units
    where booking_id = new.id;
  end if;

  return null;
end;
$$;

create trigger bookings_clear_primary_unit_on_status_change
before update of status on public.bookings
for each row
execute function public.clear_booking_primary_unit_on_status_change();

create trigger bookings_remove_assignments_on_status_change
after update of status on public.bookings
for each row
when (new.status <> 'confirmed')
execute function public.remove_booking_assignments_on_status_change();

create or replace function public.enforce_booking_unit_block_separation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.booking_blocks bb
    where bb.campsite_unit_id = new.campsite_unit_id
      and public.half_open_intervals_overlap(
        new.start_date,
        new.end_date,
        bb.start_date,
        bb.end_date
      )
  ) then
    raise exception 'Confirmed campsite assignment conflicts with an existing booking block'
      using errcode = '23P01';
  end if;

  return new;
end;
$$;

create trigger booking_units_prevent_block_overlap
before insert or update of campsite_unit_id, start_date, end_date
on public.booking_units
for each row
execute function public.enforce_booking_unit_block_separation();

create or replace function public.enforce_block_booking_separation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.booking_units bu
    join public.bookings b on b.id = bu.booking_id
    where bu.campsite_unit_id = new.campsite_unit_id
      and b.status = 'confirmed'
      and public.half_open_intervals_overlap(
        new.start_date,
        new.end_date,
        bu.start_date,
        bu.end_date
      )
  ) then
    raise exception 'Booking block conflicts with an existing confirmed booking assignment'
      using errcode = '23P01';
  end if;

  return new;
end;
$$;

create or replace function public.get_unit_conflicts(
  p_campsite_unit_id uuid,
  p_check_in date,
  p_check_out date,
  p_exclude_booking_id uuid default null
)
returns table (
  conflict_source text,
  conflict_id uuid,
  start_date date,
  end_date date,
  booking_status public.booking_status,
  reason text
)
language sql
stable
set search_path = public
as $$
  with booking_conflicts as (
    select
      'booking'::text as conflict_source,
      b.id as conflict_id,
      bu.start_date,
      bu.end_date,
      b.status as booking_status,
      null::text as reason
    from public.booking_units bu
    join public.bookings b on b.id = bu.booking_id
    where bu.campsite_unit_id = p_campsite_unit_id
      and b.status = 'confirmed'
      and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
      and public.half_open_intervals_overlap(
        p_check_in,
        p_check_out,
        bu.start_date,
        bu.end_date
      )
  ),
  block_conflicts as (
    select
      'block'::text as conflict_source,
      bb.id as conflict_id,
      bb.start_date,
      bb.end_date,
      null::public.booking_status as booking_status,
      bb.reason
    from public.booking_blocks bb
    where bb.campsite_unit_id = p_campsite_unit_id
      and public.half_open_intervals_overlap(
        p_check_in,
        p_check_out,
        bb.start_date,
        bb.end_date
      )
  )
  select * from booking_conflicts
  union all
  select * from block_conflicts;
$$;

create or replace function public.is_unit_available(
  p_campsite_unit_id uuid,
  p_check_in date,
  p_check_out date,
  p_exclude_booking_id uuid default null
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    p_check_out > p_check_in
    and not exists (
      select 1
      from public.get_unit_conflicts(
        p_campsite_unit_id,
        p_check_in,
        p_check_out,
        p_exclude_booking_id
      )
    );
$$;

create or replace function public.get_available_campsite_units(
  p_check_in date,
  p_check_out date
)
returns table (
  id uuid,
  slug text,
  name text,
  cover_image_url text
)
language sql
stable
set search_path = public
as $$
  select
    cu.id,
    cu.slug,
    cu.name,
    cu.cover_image_url
  from public.campsite_units cu
  where cu.active = true
    and p_check_out > p_check_in
    and not exists (
      select 1
      from public.get_unit_conflicts(
        cu.id,
        p_check_in,
        p_check_out,
        null
      )
    )
  order by cu.name;
$$;

alter table public.booking_units enable row level security;

drop policy if exists "booking_units_admin_manage" on public.booking_units;
create policy "booking_units_admin_manage"
  on public.booking_units
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "booking_units_owner_select" on public.booking_units;
create policy "booking_units_owner_select"
  on public.booking_units
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.bookings b
      where b.id = booking_id
        and b.user_id = auth.uid()
    )
  );

drop function if exists public.create_booking_request(
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
);

create or replace function public.create_booking_request(
  p_check_in_date date,
  p_check_out_date date,
  p_guest_first_name text,
  p_guest_last_name text,
  p_guest_email text,
  p_guest_phone text,
  p_requested_unit_count integer,
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
  v_unit_template public.campsite_units%rowtype;
  v_nights integer;
  v_fees numeric(12,2);
  v_subtotal numeric(12,2);
  v_total numeric(12,2);
  v_guests_count integer;
  v_nightly_rate numeric(12,2);
  v_booking public.bookings%rowtype;
  v_total_units integer;
  v_available_units integer;
begin
  if p_check_out_date <= p_check_in_date then
    raise exception 'check_out_date must be later than check_in_date'
      using errcode = '22023';
  end if;

  if p_requested_unit_count <= 0 then
    raise exception 'requested_unit_count must be greater than zero'
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
  into v_unit_template
  from public.campsite_units
  where active = true
  order by name
  limit 1;

  if not found then
    raise exception 'No active campsite units found'
      using errcode = 'P0002';
  end if;

  select count(*)
  into v_total_units
  from public.campsite_units
  where active = true;

  if p_requested_unit_count > v_total_units then
    raise exception 'Requested campsite count exceeds available inventory'
      using errcode = '22023';
  end if;

  if v_guests_count > (v_unit_template.max_guests * p_requested_unit_count) then
    raise exception 'Requested guests exceed the selected campsite capacity'
      using errcode = '22023';
  end if;

  select count(*)
  into v_available_units
  from public.get_available_campsite_units(p_check_in_date, p_check_out_date);

  if v_available_units < p_requested_unit_count then
    raise exception 'Not enough campsites are available for the selected dates'
      using errcode = '23P01';
  end if;

  v_nights := p_check_out_date - p_check_in_date;
  v_fees := 0;
  v_nightly_rate := (p_adult_guests_count * v_unit_template.base_price_per_night)
    + (p_child_guests_count * v_unit_template.child_price_per_night);
  v_subtotal := v_nights * v_nightly_rate;
  v_total := v_subtotal + v_fees;

  insert into public.bookings (
    campsite_unit_id,
    requested_unit_count,
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
    null,
    p_requested_unit_count,
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
  date,
  date,
  text,
  text,
  text,
  text,
  integer,
  integer,
  integer,
  text
) is 'Safe guest/public booking insert path for aggregate campsite requests. It computes pricing on the server side and stores requested campsite quantity without assigning units until confirmation.';

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
    campsite_unit_id = v_unit_ids[1]
  where id = p_booking_id
  returning *
  into v_booking;

  return v_booking;
end;
$$;

comment on function public.admin_confirm_booking(uuid, text) is 'Admin-only confirmation path. It assigns available campsite units atomically and only then marks the booking confirmed.';

revoke all on function public.get_available_campsite_units(date, date) from public;
grant execute on function public.get_available_campsite_units(date, date) to anon, authenticated;

revoke all on function public.create_booking_request(
  date,
  date,
  text,
  text,
  text,
  text,
  integer,
  integer,
  integer,
  text
) from public;

grant execute on function public.create_booking_request(
  date,
  date,
  text,
  text,
  text,
  text,
  integer,
  integer,
  integer,
  text
) to anon, authenticated;
