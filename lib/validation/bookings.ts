import { z } from "zod";

export type BookingValidationMessages = {
  dateFormat: string;
  checkInRequired: string;
  checkOutRequired: string;
  checkOutLater: string;
  firstNameRequired: string;
  lastNameRequired: string;
  emailRequired: string;
  emailInvalid: string;
  addGuest: string;
};

const defaultMessages: BookingValidationMessages = {
  dateFormat: "Expected YYYY-MM-DD date",
  checkInRequired: "Select an arrival date",
  checkOutRequired: "Select a departure date",
  checkOutLater: "Check-out date must be later than check-in date",
  firstNameRequired: "Enter your first name",
  lastNameRequired: "Enter your last name",
  emailRequired: "Enter your email address",
  emailInvalid: "Enter a valid email address",
  addGuest: "Add at least one guest"
};

function createRequiredIsoDate(message: string, messages: BookingValidationMessages) {
  return z.string().trim().min(1, message).regex(/^\d{4}-\d{2}-\d{2}$/, messages.dateFormat);
}

export function availabilityQuerySchema(
  messages: BookingValidationMessages = defaultMessages
) {
  return z
    .object({
      checkInDate: createRequiredIsoDate(messages.checkInRequired, messages),
      checkOutDate: createRequiredIsoDate(messages.checkOutRequired, messages),
      requestedUnitCount: z.number().int().positive().max(4).default(1)
    })
    .superRefine((value, context) => {
      if (value.checkOutDate <= value.checkInDate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["checkOutDate"],
          message: messages.checkOutLater
        });
      }
    });
}

export const availabilityCalendarQuerySchema = z.object({
  startDate: createRequiredIsoDate(defaultMessages.checkInRequired, defaultMessages),
  endDate: createRequiredIsoDate(defaultMessages.checkOutRequired, defaultMessages),
  requestedUnitCount: z.number().int().positive().max(4).default(1)
}).superRefine((value, context) => {
  if (value.endDate <= value.startDate) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endDate"],
      message: defaultMessages.checkOutLater
    });
  }
});

export function createBookingRequestSchema(
  messages: BookingValidationMessages = defaultMessages
) {
  return z
    .object({
      checkInDate: createRequiredIsoDate(messages.checkInRequired, messages),
      checkOutDate: createRequiredIsoDate(messages.checkOutRequired, messages),
      requestedUnitCount: z.number().int().positive().max(4),
      guestFirstName: z.string().trim().min(1, messages.firstNameRequired).max(120),
      guestLastName: z.string().trim().min(1, messages.lastNameRequired).max(120),
      guestEmail: z
        .string()
        .trim()
        .min(1, messages.emailRequired)
        .email(messages.emailInvalid)
        .max(255),
      guestPhone: z.string().trim().max(50).optional().or(z.literal("")),
      adultGuestsCount: z.number().int().min(0).max(20),
      childGuestsCount: z.number().int().min(0).max(20),
      notes: z.string().trim().max(2000).optional().or(z.literal("")),
      clientRequestId: z.string().trim().uuid().optional()
    })
    .superRefine((value, context) => {
      if (value.checkOutDate <= value.checkInDate) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["checkOutDate"],
          message: messages.checkOutLater
        });
      }

      if (value.adultGuestsCount + value.childGuestsCount <= 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["adultGuestsCount"],
          message: messages.addGuest
        });
      }
    });
}

export const bookingStatusSchema = z.enum(["pending", "confirmed", "rejected", "cancelled"]);

export const updateBookingStatusSchema = z.object({
  status: bookingStatusSchema,
  guestMessage: z.string().trim().max(2000).optional().or(z.literal("")),
  adminNotes: z.string().trim().max(2000).optional().or(z.literal(""))
});

export const bookingListQuerySchema = z.object({
  status: bookingStatusSchema.optional(),
  search: z.string().trim().max(200).optional(),
  unitId: z.string().uuid().optional()
});

export const bookingRecoveryQuerySchema = z.object({
  clientRequestId: z.string().trim().uuid()
});

export const bookingLookupSchema = z.object({
  guestEmail: z.string().trim().min(1).email().max(255),
  bookingReference: z.string().trim().min(1).max(40)
});
