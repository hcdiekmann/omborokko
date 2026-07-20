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
    b.created_at
  from public.bookings b
  where b.client_request_id = nullif(btrim(coalesce(p_client_request_id, '')), '')
  order by b.created_at desc
  limit 1;
$$;

comment on function public.get_booking_request_by_client_request_id(text) is 'Public recovery lookup for a booking request known by the browser-held idempotency key. Returns terminal statuses so the booking page can show rejected or cancelled requests.';

revoke all on function public.get_booking_request_by_client_request_id(text) from public;
grant execute on function public.get_booking_request_by_client_request_id(text) to anon, authenticated;
