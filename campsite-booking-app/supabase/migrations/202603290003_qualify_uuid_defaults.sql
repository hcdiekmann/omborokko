alter table public.campsite_units
  alter column id set default extensions.gen_random_uuid();

alter table public.bookings
  alter column id set default extensions.gen_random_uuid();

alter table public.booking_blocks
  alter column id set default extensions.gen_random_uuid();
