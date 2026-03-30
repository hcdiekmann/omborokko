import { z } from "zod";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD date");
const imagePathSchema = z
  .string()
  .trim()
  .refine((value) => value === "" || value.startsWith("/") || /^https?:\/\//.test(value), "Expected /public path or absolute URL");

const adminUnitSchemaBase = z.object({
  slug: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().trim().min(1).max(160),
  shortDescription: z.string().trim().max(255).optional().or(z.literal("")),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  type: z.string().trim().min(1).max(80),
  maxGuests: z.number().int().positive().max(20),
  basePricePerNight: z.number().nonnegative(),
  childPricePerNight: z.number().nonnegative(),
  active: z.boolean(),
  coverImageUrl: imagePathSchema.optional().or(z.null())
});

const adminBlockSchemaBase = z.object({
  campsiteUnitId: z.union([z.string().uuid(), z.literal("__all__")]),
  startDate: isoDate,
  endDate: isoDate,
  reason: z.string().trim().max(500).optional().or(z.literal(""))
});

export const adminUnitSchema = adminUnitSchemaBase;
export const adminUnitPatchSchema = adminUnitSchemaBase.partial();

export const adminBlockSchema = adminBlockSchemaBase
  .superRefine((value, context) => {
    if (value.endDate <= value.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "End date must be later than start date"
      });
    }
  });

export const adminBlockPatchSchema = adminBlockSchemaBase
  .extend({
    campsiteUnitId: z.string().uuid().optional()
  })
  .partial();

export const adminCalendarQuerySchema = z.object({
  startDate: isoDate,
  endDate: isoDate,
  campsiteUnitId: z.string().uuid().optional()
});
