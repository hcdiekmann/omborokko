import { getAdminBookingDetail } from "@/features/admin/server/service";
import { fail, ok } from "@/lib/utils/http";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const booking = await getAdminBookingDetail(id);

    return ok(booking);
  } catch (error) {
    return fail(error);
  }
}
