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
  p_notes text default null,
  p_client_request_id text default null
)
returns table (
  booking_id uuid,
  booking_reference text,
  status public.booking_status,
  created boolean
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
  v_guest_email text;
  v_client_request_id text;
  v_duplicate_lock_key text;
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

  v_guest_email := lower(btrim(p_guest_email));
  v_client_request_id := nullif(btrim(coalesce(p_client_request_id, '')), '');

  if v_client_request_id is not null then
    select *
    into v_booking
    from public.bookings b
    where b.client_request_id = v_client_request_id
    order by b.created_at desc
    limit 1;

    if found then
      return query
      select v_booking.id, v_booking.booking_reference, v_booking.status, false;
      return;
    end if;
  end if;

  v_duplicate_lock_key := v_guest_email || '|' || p_check_in_date::text || '|' || p_check_out_date::text || '|' || p_requested_unit_count::text;
  perform pg_advisory_xact_lock(hashtextextended(v_duplicate_lock_key, 0));

  select *
  into v_booking
  from public.bookings b
  where lower(b.guest_email) = v_guest_email
    and b.check_in_date = p_check_in_date
    and b.check_out_date = p_check_out_date
    and b.requested_unit_count = p_requested_unit_count
    and b.status in ('pending', 'confirmed')
    and b.check_out_date >= current_date
  order by b.created_at desc
  limit 1;

  if found then
    return query
    select v_booking.id, v_booking.booking_reference, v_booking.status, false;
    return;
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
    client_request_id,
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
    v_client_request_id,
    auth.uid(),
    btrim(p_guest_first_name),
    btrim(p_guest_last_name),
    v_guest_email,
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
  select v_booking.id, v_booking.booking_reference, v_booking.status, true;
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
  text,
  text
) is 'Safe guest/public booking insert path for aggregate campsite requests. Idempotent retries and exact active duplicate requests return the existing booking instead of inserting another pending request.';

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
  text,
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
  text,
  text
) to anon, authenticated;
