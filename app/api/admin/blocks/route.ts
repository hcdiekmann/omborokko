import { NextRequest } from "next/server";

import {
  createAdminBlock,
  createAdminBlocksForAllUnits,
  listAdminBlocks,
} from "@/features/admin/server/service";
import { adminBlockSchema } from "@/lib/validation/admin";
import { fail, ok } from "@/lib/utils/http";

export async function GET(request: NextRequest) {
  try {
    const campsiteUnitId = request.nextUrl.searchParams.get("campsiteUnitId") ?? undefined;
    const blocks = await listAdminBlocks(campsiteUnitId);

    return ok(blocks);
  } catch (error) {
    return fail(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = adminBlockSchema.parse(await request.json());
    const block =
      payload.campsiteUnitId === "__all__"
        ? await createAdminBlocksForAllUnits({
            start_date: payload.startDate,
            end_date: payload.endDate,
            reason: payload.reason || null,
          })
        : await createAdminBlock({
            campsite_unit_id: payload.campsiteUnitId,
            start_date: payload.startDate,
            end_date: payload.endDate,
            reason: payload.reason || null,
          });

    return ok(block, { status: 201 });
  } catch (error) {
    return fail(error);
  }
}
