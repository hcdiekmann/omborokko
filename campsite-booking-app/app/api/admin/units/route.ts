import { createAdminUnit, listAdminUnits } from "@/features/admin/server/service";
import { adminUnitSchema } from "@/lib/validation/admin";
import { fail, ok } from "@/lib/utils/http";

export async function GET() {
  try {
    return ok(await listAdminUnits());
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = adminUnitSchema.parse(await request.json());
    const unit = await createAdminUnit({
      slug: payload.slug,
      name: payload.name,
      short_description: payload.shortDescription || null,
      description: payload.description || null,
      type: payload.type,
      max_guests: payload.maxGuests,
      base_price_per_night: payload.basePricePerNight,
      child_price_per_night: payload.childPricePerNight,
      cleaning_fee: 0,
      active: payload.active,
      cover_image_url: payload.coverImageUrl || null
    });

    return ok(unit, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
