delete from public.booking_blocks;
delete from public.bookings;
delete from public.campsite_units;

insert into public.campsite_units (
  slug,
  name,
  short_description,
  description,
  type,
  max_guests,
  base_price_per_night,
  cleaning_fee,
  active,
  cover_image_url
)
values
  (
    'campsite-1',
    'Campsite 1',
    'Remote bush campsite beside the seasonal river with shared ablutions and firepit access.',
    'For those who seek an immersive natural experience, our remote camping sites provide a unique chance to dwell in the midst of Namibia''s untouched beauty. Located next to a seasonal river, and tucked away at the foot of the majestic Omborokko Mountains, our campsites offer a genuine encounter with the tranquil Namibian bush.',
    'pitch',
    6,
    325.00,
    0.00,
    true,
    '/images/campsite/hero-river-view.webp'
  ),
  (
    'campsite-2',
    'Campsite 2',
    'Remote bush campsite beside the seasonal river with shared ablutions and firepit access.',
    'For those who seek an immersive natural experience, our remote camping sites provide a unique chance to dwell in the midst of Namibia''s untouched beauty. Located next to a seasonal river, and tucked away at the foot of the majestic Omborokko Mountains, our campsites offer a genuine encounter with the tranquil Namibian bush.',
    'pitch',
    6,
    325.00,
    0.00,
    true,
    '/images/campsite/far-view.webp'
  ),
  (
    'campsite-3',
    'Campsite 3',
    'Remote bush campsite beside the seasonal river with shared ablutions and firepit access.',
    'For those who seek an immersive natural experience, our remote camping sites provide a unique chance to dwell in the midst of Namibia''s untouched beauty. Located next to a seasonal river, and tucked away at the foot of the majestic Omborokko Mountains, our campsites offer a genuine encounter with the tranquil Namibian bush.',
    'pitch',
    6,
    325.00,
    0.00,
    true,
    '/images/campsite/fireplace-tree.webp'
  ),
  (
    'campsite-4',
    'Campsite 4',
    'Remote bush campsite beside the seasonal river with shared ablutions and firepit access.',
    'For those who seek an immersive natural experience, our remote camping sites provide a unique chance to dwell in the midst of Namibia''s untouched beauty. Located next to a seasonal river, and tucked away at the foot of the majestic Omborokko Mountains, our campsites offer a genuine encounter with the tranquil Namibian bush.',
    'pitch',
    6,
    325.00,
    0.00,
    true,
    '/images/campsite/from-river.webp'
  );
