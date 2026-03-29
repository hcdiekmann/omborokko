import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date");

export const availabilityQuerySchema = z
  .object({
    checkInDate: isoDate,
    checkOutDate: isoDate,
    requestedUnitCount: z.number().int().positive().max(4).default(1)
  })
  .superRefine((value, context) => {
    if (value.checkOutDate <= value.checkInDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["checkOutDate"],
        message: "Check-out date must be later than check-in date"
      });
    }
  });

export const createBookingRequestSchema = z
  .object({
    checkInDate: isoDate,
    checkOutDate: isoDate,
    requestedUnitCount: z.number().int().positive().max(4),
    guestFirstName: z.string().trim().min(1).max(120),
    guestLastName: z.string().trim().min(1).max(120),
    guestEmail: z.string().trim().email().max(255),
    guestPhone: z.string().trim().max(50).optional().or(z.literal("")),
    adultGuestsCount: z.number().int().min(0).max(20),
    childGuestsCount: z.number().int().min(0).max(20),
    notes: z.string().trim().max(2000).optional().or(z.literal(""))
  })
  .superRefine((value, context) => {
    if (value.checkOutDate <= value.checkInDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["checkOutDate"],
        message: "Check-out date must be later than check-in date"
      });
    }

    if (value.adultGuestsCount + value.childGuestsCount <= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["adultGuestsCount"],
        message: "Add at least one guest"
      });
    }
  });

export const bookingStatusSchema = z.enum(["pending", "confirmed", "rejected", "cancelled"]);

export const updateBookingStatusSchema = z.object({
  status: bookingStatusSchema,
  adminNotes: z.string().trim().max(2000).optional().or(z.literal(""))
});

export const bookingListQuerySchema = z.object({
  status: bookingStatusSchema.optional(),
  search: z.string().trim().max(200).optional(),
  unitId: z.string().uuid().optional()
});
