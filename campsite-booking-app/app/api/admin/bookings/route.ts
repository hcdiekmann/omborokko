import { NextRequest } from "next/server";

import { listAdminBookings } from "@/features/admin/server/service";
import { bookingListQuerySchema } from "@/lib/validation/bookings";
import { fail, ok } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  try {
    const params = bookingListQuerySchema.parse({
      status: request.nextUrl.searchParams.get("status") ?? undefined,
      search: request.nextUrl.searchParams.get("search") ?? undefined,
      unitId: request.nextUrl.searchParams.get("unitId") ?? undefined
    });

    const bookings = await listAdminBookings(params);

    return ok(bookings);
  } catch (error) {
    return fail(error);
  }
}
