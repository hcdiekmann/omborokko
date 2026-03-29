export const queryKeys = {
  adminBookings: (params?: Record<string, string | number | undefined>) => ["admin-bookings", params] as const,
  adminBooking: (id: string) => ["admin-booking", id] as const,
  adminCalendar: (params?: Record<string, string | number | undefined>) => ["admin-calendar", params] as const,
  adminUnits: () => ["admin-units"] as const,
  adminBlocks: (params?: Record<string, string | number | undefined>) => ["admin-blocks", params] as const,
  adminBlock: (id: string) => ["admin-block", id] as const,
  availability: (unitId: string, checkIn: string, checkOut: string) =>
    ["availability", unitId, checkIn, checkOut] as const
};
