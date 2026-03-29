import { updateAdminUnit } from "@/features/admin/server/service";
import { adminUnitPatchSchema } from "@/lib/validation/admin";
import { fail, ok } from "@/lib/utils/http";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = adminUnitPatchSchema.parse(await request.json());
    const unit = await updateAdminUnit(id, {
      slug: payload.slug,
      name: payload.name,
      short_description: payload.shortDescription === undefined ? undefined : payload.shortDescription || null,
      description: payload.description === undefined ? undefined : payload.description || null,
      type: payload.type,
      max_guests: payload.maxGuests,
      base_price_per_night: payload.basePricePerNight,
      child_price_per_night: payload.childPricePerNight,
      cleaning_fee: 0,
      active: payload.active,
      cover_image_url:
        payload.coverImageUrl === undefined ? undefined : payload.coverImageUrl || null
    });

    return ok(unit);
  } catch (error) {
    return fail(error);
  }
}
