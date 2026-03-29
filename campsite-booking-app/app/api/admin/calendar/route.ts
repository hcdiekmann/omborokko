import { NextRequest } from "next/server";

import { getAdminCalendarFeed } from "@/features/admin/server/service";
import { adminCalendarQuerySchema } from "@/lib/validation/admin";
import { fail, ok } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  try {
    const params = adminCalendarQuerySchema.parse({
      startDate: request.nextUrl.searchParams.get("startDate"),
      endDate: request.nextUrl.searchParams.get("endDate"),
      campsiteUnitId: request.nextUrl.searchParams.get("campsiteUnitId") ?? undefined
    });

    const calendar = await getAdminCalendarFeed(params.startDate, params.endDate, params.campsiteUnitId);

    return ok(calendar);
  } catch (error) {
    return fail(error);
  }
}
