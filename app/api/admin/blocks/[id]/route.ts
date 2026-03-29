import { deleteAdminBlock, updateAdminBlock } from "@/features/admin/server/service";
import { adminBlockPatchSchema } from "@/lib/validation/admin";
import { fail, ok } from "@/lib/utils/http";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const payload = adminBlockPatchSchema.parse(await request.json());
    const block = await updateAdminBlock(id, {
      campsite_unit_id: payload.campsiteUnitId,
      start_date: payload.startDate,
      end_date: payload.endDate,
      reason: payload.reason === undefined ? undefined : payload.reason || null
    });

    return ok(block);
  } catch (error) {
    return fail(error);
  }
}

export async function DELETE(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    await deleteAdminBlock(id);

    return ok({ deleted: true });
  } catch (error) {
    return fail(error);
  }
}
