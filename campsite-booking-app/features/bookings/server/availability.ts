import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/utils/http";
import type { Database } from "@/types/database";

type AvailableUnit = Database["public"]["Functions"]["get_available_campsite_units"]["Returns"][number];

export type CampsiteAvailabilityResult = {
  available: boolean;
  availableCount: number;
  totalCount: number;
  requestedUnitCount: number;
  availableUnits: AvailableUnit[];
};

export async function getCampsiteAvailability(
  checkInDate: string,
  checkOutDate: string,
  requestedUnitCount = 1
): Promise<CampsiteAvailabilityResult> {
  const supabase = await createServerSupabaseClient();
  const [{ data: availableUnits, error: availabilityError }, { count: totalCount, error: countError }] = await Promise.all([
    supabase.rpc("get_available_campsite_units", {
      p_check_in: checkInDate,
      p_check_out: checkOutDate
    } as never),
    supabase.from("campsite_units").select("id", { count: "exact", head: true }).eq("active", true)
  ]);

  if (availabilityError) {
    throw new AppError("Failed to evaluate campsite availability", 500, "availability_check_failed", availabilityError);
  }

  if (countError) {
    throw new AppError("Failed to count campsite inventory", 500, "inventory_count_failed", countError);
  }

  const typedUnits = (availableUnits ?? []) as AvailableUnit[];
  const availableCount = typedUnits.length;

  return {
    available: availableCount >= requestedUnitCount,
    availableCount,
    totalCount: totalCount ?? 0,
    requestedUnitCount,
    availableUnits: typedUnits
  };
}
