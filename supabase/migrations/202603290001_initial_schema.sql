create schema if not exists extensions;

create extension if not exists pgcrypto with schema extensions;
create extension if not exists btree_gist with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create type public.profile_role as enum ('admin', 'customer');
create type public.booking_status as enum ('pending', 'confirmed', 'rejected', 'cancelled');
create type public.payment_status as enum ('unpaid', 'paid', 'refunded', 'partially_refunded');

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

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.profile_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Application profile and authorization role for each authenticated user.';
comment on column public.profiles.role is 'Single source of truth for application authorization. Admin routes check this role.';

create table public.campsite_units (
  id uuid primary key default extensions.gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text,
  description text,
  type text not null,
  max_guests integer not null,
  base_price_per_night numeric(12,2) not null,
  cleaning_fee numeric(12,2),
  active boolean not null default true,
  cover_image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint campsite_units_slug_format_chk check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint campsite_units_max_guests_chk check (max_guests > 0),
  constraint campsite_units_base_price_chk check (base_price_per_night >= 0),
  constraint campsite_units_cleaning_fee_chk check (cleaning_fee is null or cleaning_fee >= 0)
);

comment on table public.campsite_units is 'Bookable campsite inventory. Only active units are visible to the public.';

create table public.bookings (
  id uuid primary key default extensions.gen_random_uuid(),
  booking_reference text not null unique default public.generate_booking_reference(),
  campsite_unit_id uuid not null references public.campsite_units(id) on delete restrict,
  user_id uuid references auth.users(id) on delete set null,
  guest_first_name text not null,
  guest_last_name text not null,
  guest_email text not null,
  guest_phone text,
  guests_count integer not null,
  check_in_date date not null,
  check_out_date date not null,
  nights integer not null,
  subtotal_amount numeric(12,2) not null,
  fees_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null,
  currency text not null default 'NAD',
  status public.booking_status not null default 'pending',
  payment_status public.payment_status not null default 'unpaid',
  notes text,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_guest_first_name_chk check (btrim(guest_first_name) <> ''),
  constraint bookings_guest_last_name_chk check (btrim(guest_last_name) <> ''),
  constraint bookings_guest_email_chk check (position('@' in guest_email) > 1),
  constraint bookings_guests_count_chk check (guests_count > 0),
  constraint bookings_date_order_chk check (check_out_date > check_in_date),
  constraint bookings_nights_chk check (nights = (check_out_date - check_in_date)),
  constraint bookings_subtotal_amount_chk check (subtotal_amount >= 0),
  constraint bookings_fees_amount_chk check (fees_amount >= 0),
  constraint bookings_total_amount_chk check (total_amount = subtotal_amount + fees_amount),
  constraint bookings_currency_chk check (char_length(currency) = 3)
);

comment on table public.bookings is 'Booking requests and confirmed stays. Pending bookings never block availability.';
comment on column public.bookings.status is 'Only confirmed bookings block inventory. Pending requests are reviewed by admins.';

create table public.booking_blocks (
  id uuid primary key default extensions.gen_random_uuid(),
  campsite_unit_id uuid not null references public.campsite_units(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_blocks_date_order_chk check (end_date > start_date)
);

comment on table public.booking_blocks is 'Manual admin-created inventory holds. These always block availability.';

create index campsite_units_active_idx
  on public.campsite_units (active);

create index campsite_units_type_idx
  on public.campsite_units (type);

create index bookings_campsite_unit_id_idx
  on public.bookings (campsite_unit_id);

create index bookings_status_idx
  on public.bookings (status);

create index bookings_created_at_desc_idx
  on public.bookings (created_at desc);

create index bookings_guest_email_idx
  on public.bookings (lower(guest_email));

create index bookings_check_in_date_idx
  on public.bookings (check_in_date);

create index bookings_check_out_date_idx
  on public.bookings (check_out_date);

create index bookings_search_trgm_idx
  on public.bookings
  using gin (
    lower(
      booking_reference || ' ' ||
      guest_first_name || ' ' ||
      guest_last_name || ' ' ||
      guest_email
    ) gin_trgm_ops
  );

create index booking_blocks_campsite_unit_id_idx
  on public.booking_blocks (campsite_unit_id);

create index booking_blocks_start_date_idx
  on public.booking_blocks (start_date);

create index booking_blocks_end_date_idx
  on public.booking_blocks (end_date);

alter table public.bookings
  add constraint bookings_confirmed_no_overlap_excl
  exclude using gist (
    campsite_unit_id with =,
    daterange(check_in_date, check_out_date, '[)') with &&
  )
  where (status = 'confirmed');

alter table public.booking_blocks
  add constraint booking_blocks_no_overlap_excl
  exclude using gist (
    campsite_unit_id with =,
    daterange(start_date, end_date, '[)') with &&
  );

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'customer'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

create trigger campsite_units_set_updated_at
before update on public.campsite_units
for each row
execute function public.set_updated_at();

create trigger bookings_set_updated_at
before update on public.bookings
for each row
execute function public.set_updated_at();

create trigger bookings_prevent_block_overlap
before insert or update of campsite_unit_id, check_in_date, check_out_date, status
on public.bookings
for each row
execute function public.enforce_booking_block_separation();

create trigger booking_blocks_set_updated_at
before update on public.booking_blocks
for each row
execute function public.set_updated_at();

create trigger booking_blocks_prevent_confirmed_overlap
before insert or update of campsite_unit_id, start_date, end_date
on public.booking_blocks
for each row
execute function public.enforce_block_booking_separation();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create or replace function public.enforce_booking_block_separation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'confirmed' and exists (
    select 1
    from public.booking_blocks bb
    where bb.campsite_unit_id = new.campsite_unit_id
      and public.half_open_intervals_overlap(
        new.check_in_date,
        new.check_out_date,
        bb.start_date,
        bb.end_date
      )
  ) then
    raise exception 'Confirmed booking conflicts with an existing booking block'
      using errcode = '23P01';
  end if;

  return new;
end;
$$;

create or replace function public.enforce_block_booking_separation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.bookings b
    where b.campsite_unit_id = new.campsite_unit_id
      and b.status = 'confirmed'
      and public.half_open_intervals_overlap(
        new.start_date,
        new.end_date,
        b.check_in_date,
        b.check_out_date
      )
  ) then
    raise exception 'Booking block conflicts with an existing confirmed booking'
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
      b.check_in_date as start_date,
      b.check_out_date as end_date,
      b.status as booking_status,
      null::text as reason
    from public.bookings b
    where b.campsite_unit_id = p_campsite_unit_id
      and b.status = 'confirmed'
      and (p_exclude_booking_id is null or b.id <> p_exclude_booking_id)
      and public.half_open_intervals_overlap(
        p_check_in,
        p_check_out,
        b.check_in_date,
        b.check_out_date
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

create or replace function public.create_booking_request(
  p_campsite_unit_id uuid,
  p_check_in_date date,
  p_check_out_date date,
  p_guest_first_name text,
  p_guest_last_name text,
  p_guest_email text,
  p_guest_phone text,
  p_guests_count integer,
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
  v_booking public.bookings%rowtype;
begin
  if p_check_out_date <= p_check_in_date then
    raise exception 'check_out_date must be later than check_in_date'
      using errcode = '22023';
  end if;

  if p_guests_count <= 0 then
    raise exception 'guests_count must be greater than zero'
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

  if p_guests_count > v_unit.max_guests then
    raise exception 'Requested guests exceed the unit capacity'
      using errcode = '22023';
  end if;

  v_nights := p_check_out_date - p_check_in_date;
  v_fees := coalesce(v_unit.cleaning_fee, 0);
  v_subtotal := v_nights * v_unit.base_price_per_night;
  v_total := v_subtotal + v_fees;

  insert into public.bookings (
    campsite_unit_id,
    user_id,
    guest_first_name,
    guest_last_name,
    guest_email,
    guest_phone,
    guests_count,
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
    p_guests_count,
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
  text
) is 'Safe guest/public booking insert path. It always creates pending, unpaid requests and computes pricing on the server side.';

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
begin
  if not public.is_admin() then
    raise exception 'Admin access required'
      using errcode = '42501';
  end if;

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

  perform pg_advisory_xact_lock(hashtextextended(v_booking.campsite_unit_id::text, 0));

  if not public.is_unit_available(
    v_booking.campsite_unit_id,
    v_booking.check_in_date,
    v_booking.check_out_date,
    v_booking.id
  ) then
    raise exception 'Booking conflicts with an existing confirmed booking or date block'
      using errcode = 'P0001';
  end if;

  update public.bookings
  set
    status = 'confirmed',
    admin_notes = coalesce(nullif(btrim(coalesce(p_admin_notes, '')), ''), admin_notes)
  where id = v_booking.id
  returning *
  into v_booking;

  return v_booking;
end;
$$;

comment on function public.admin_confirm_booking(uuid, text) is 'Admin-only confirmation path. It rechecks availability under lock before marking a booking confirmed.';

alter table public.profiles enable row level security;
alter table public.campsite_units enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_blocks enable row level security;

create policy "profiles_select_self"
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

create policy "profiles_admin_all"
  on public.profiles
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "campsite_units_public_read_active"
  on public.campsite_units
  for select
  to anon, authenticated
  using (active = true);

create policy "campsite_units_admin_manage"
  on public.campsite_units
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "bookings_customer_read_own"
  on public.bookings
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "bookings_admin_manage"
  on public.bookings
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "booking_blocks_admin_manage"
  on public.booking_blocks
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

revoke all on function public.create_booking_request(
  uuid,
  date,
  date,
  text,
  text,
  text,
  text,
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
  text
) to anon, authenticated;

revoke all on function public.is_unit_available(uuid, date, date, uuid) from public;
grant execute on function public.is_unit_available(uuid, date, date, uuid) to anon, authenticated;

revoke all on function public.get_unit_conflicts(uuid, date, date, uuid) from public;
grant execute on function public.get_unit_conflicts(uuid, date, date, uuid) to authenticated;

revoke all on function public.admin_confirm_booking(uuid, text) from public;
grant execute on function public.admin_confirm_booking(uuid, text) to authenticated;
