import { createServerSupabaseClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/guards";
import { AppError } from "@/lib/utils/http";
import type { Database, Enums, Tables, TablesInsert, TablesUpdate } from "@/types/database";
import { getCampsiteAvailability } from "@/features/bookings/server/availability";

type BookingListParams = {
  status?: Enums<"booking_status">;
  search?: string;
  unitId?: string;
};

type BookingRow = Tables<"bookings"> & {
  campsite_units?: { id: string; name: string; slug: string } | null;
};

type BookingDetailRow = Tables<"bookings"> & {
  campsite_units?: Tables<"campsite_units"> | null;
};

type BookingUnitRow = Tables<"booking_units"> & {
  campsite_units?: Pick<Tables<"campsite_units">, "id" | "name" | "slug"> | null;
};

type UnitRow = Tables<"campsite_units">;
type BlockRow = Tables<"booking_blocks"> & {
  campsite_units?: { id: string; name: string; slug: string } | null;
};

export async function listAdminBookings(params: BookingListParams): Promise<BookingRow[]> {
  const { supabase } = await requireAdmin();

  if (params.unitId) {
    const { data: bookingUnitRows, error: bookingUnitError } = await supabase
      .from("booking_units")
      .select("booking_id")
      .eq("campsite_unit_id", params.unitId);

    if (bookingUnitError) {
      throw new AppError("Failed to filter bookings by campsite", 500, "booking_unit_filter_failed", bookingUnitError);
    }

    const typedBookingUnitRows = (bookingUnitRows ?? []) as Array<Pick<Tables<"booking_units">, "booking_id">>;
    const bookingIds = Array.from(new Set(typedBookingUnitRows.map((row) => row.booking_id)));

    if (!bookingIds.length) {
      return [];
    }

    let filteredQuery = supabase
      .from("bookings")
      .select("*, campsite_units(id, name, slug)")
      .in("id", bookingIds)
      .order("created_at", { ascending: false });

    if (params.status) {
      filteredQuery = filteredQuery.eq("status", params.status);
    }

    if (params.search) {
      const escaped = params.search.replace(/[%_]/g, "\\$&");
      filteredQuery = filteredQuery.or(
        [
          `booking_reference.ilike.%${escaped}%`,
          `guest_first_name.ilike.%${escaped}%`,
          `guest_last_name.ilike.%${escaped}%`,
          `guest_email.ilike.%${escaped}%`
        ].join(",")
      );
    }

    const { data, error } = await filteredQuery;

    if (error) {
      throw new AppError("Failed to load admin bookings", 500, "admin_bookings_lookup_failed", error);
    }

    return (data ?? []) as BookingRow[];
  }

  let query = supabase
    .from("bookings")
    .select("*, campsite_units(id, name, slug)")
    .order("created_at", { ascending: false });

  if (params.status) {
    query = query.eq("status", params.status);
  }

  if (params.search) {
    const escaped = params.search.replace(/[%_]/g, "\\$&");
    query = query.or(
      [
        `booking_reference.ilike.%${escaped}%`,
        `guest_first_name.ilike.%${escaped}%`,
        `guest_last_name.ilike.%${escaped}%`,
        `guest_email.ilike.%${escaped}%`
      ].join(",")
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError("Failed to load admin bookings", 500, "admin_bookings_lookup_failed", error);
  }

  return (data ?? []) as BookingRow[];
}

export async function getAdminBookingDetail(bookingId: string) {
  const { supabase } = await requireAdmin();

  const { data: booking, error } = await supabase
    .from("bookings")
    .select("*, campsite_units(*)")
    .eq("id", bookingId)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to load booking detail", 500, "booking_detail_failed", error);
  }

  const typedBooking = (booking ?? null) as BookingDetailRow | null;

  if (!typedBooking) {
    throw new AppError("Booking not found", 404, "booking_not_found");
  }

  const [{ data: assignedUnits, error: assignedUnitsError }, availability] = await Promise.all([
    supabase
      .from("booking_units")
      .select("*, campsite_units(id, name, slug)")
      .eq("booking_id", bookingId)
      .order("campsite_unit_id", { ascending: true }),
    getCampsiteAvailability(typedBooking.check_in_date, typedBooking.check_out_date, typedBooking.requested_unit_count)
  ]);

  if (assignedUnitsError) {
    throw new AppError("Failed to load assigned campsite units", 500, "booking_units_failed", assignedUnitsError);
  }

  const typedAssignedUnits = (assignedUnits ?? []) as BookingUnitRow[];
  const detailAvailability =
    typedBooking.status === "confirmed"
      ? {
          available: true,
          availableCount: typedAssignedUnits.length,
          totalCount: availability.totalCount,
          requestedUnitCount: typedBooking.requested_unit_count,
          availableUnits: typedAssignedUnits
            .map((unit) => unit.campsite_units)
            .filter(Boolean)
            .map((unit) => ({
              id: unit!.id,
              name: unit!.name,
              slug: unit!.slug,
              cover_image_url: ""
            }))
        }
      : availability;

  return {
    booking: typedBooking,
    assignedUnits: typedAssignedUnits,
    availability: detailAvailability
  };
}

export async function updateAdminBookingStatus(
  bookingId: string,
  status: Enums<"booking_status">,
  adminNotes?: string
) {
  const { supabase } = await requireAdmin();

  if (status === "confirmed") {
    const { data, error } = await supabase.rpc("admin_confirm_booking", {
      p_booking_id: bookingId,
      p_admin_notes: adminNotes?.trim() ? adminNotes.trim() : null
    } as never);

    if (error) {
      const { data: booking } = await supabase
        .from("bookings")
        .select("check_in_date, check_out_date, requested_unit_count")
        .eq("id", bookingId)
        .maybeSingle();
      const typedBooking = (booking ?? null) as Pick<BookingRow, "check_in_date" | "check_out_date" | "requested_unit_count"> | null;
      let availability: Awaited<ReturnType<typeof getCampsiteAvailability>> | null = null;

      if (typedBooking) {
        availability = await getCampsiteAvailability(
          typedBooking.check_in_date,
          typedBooking.check_out_date,
          typedBooking.requested_unit_count
        );
      }

      throw new AppError("Booking confirmation failed", 409, "booking_confirmation_failed", {
        dbError: error,
        availability
      });
    }

    return data as Tables<"bookings">;
  }

  const patch: TablesUpdate<"bookings"> = {
    status,
    admin_notes: adminNotes?.trim() ? adminNotes.trim() : null
  };

  const { data, error } = await supabase
    .from("bookings")
    .update(patch as never)
    .eq("id", bookingId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to update booking status", 500, "booking_status_update_failed", error);
  }

  if (!data) {
    throw new AppError("Booking not found", 404, "booking_not_found");
  }

  return data as Tables<"bookings">;
}

export async function listAdminUnits(): Promise<UnitRow[]> {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("campsite_units").select("*").order("name", { ascending: true });

  if (error) {
    throw new AppError("Failed to load units", 500, "admin_units_lookup_failed", error);
  }

  return (data ?? []) as UnitRow[];
}

export async function createAdminUnit(input: TablesInsert<"campsite_units">) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from("campsite_units").insert(input as never).select("*").maybeSingle();

  if (error) {
    throw new AppError("Failed to create unit", 400, "unit_create_failed", error);
  }

  return data as UnitRow | null;
}

export async function updateAdminUnit(unitId: string, input: TablesUpdate<"campsite_units">) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("campsite_units")
    .update(input as never)
    .eq("id", unitId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to update unit", 400, "unit_update_failed", error);
  }

  if (!data) {
    throw new AppError("Unit not found", 404, "unit_not_found");
  }

  return data as UnitRow;
}

export async function listAdminBlocks(campsiteUnitId?: string): Promise<BlockRow[]> {
  const { supabase } = await requireAdmin();
  let query = supabase.from("booking_blocks").select("*, campsite_units(id, name, slug)").order("start_date");

  if (campsiteUnitId) {
    query = query.eq("campsite_unit_id", campsiteUnitId);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError("Failed to load booking blocks", 500, "booking_blocks_lookup_failed", error);
  }

  return (data ?? []) as BlockRow[];
}

export async function createAdminBlock(input: TablesInsert<"booking_blocks">) {
  const { supabase, user } = await requireAdmin();
  const { data, error } = await supabase
    .from("booking_blocks")
    .insert({
      ...input,
      created_by: user.id
    } as never)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to create booking block", 400, "booking_block_create_failed", error);
  }

  return data as Tables<"booking_blocks"> | null;
}

export async function createAdminBlocksForAllUnits(
  input: Omit<TablesInsert<"booking_blocks">, "campsite_unit_id">,
) {
  const { supabase, user } = await requireAdmin();

  const { data: units, error: unitsError } = await supabase
    .from("campsite_units")
    .select("id")
    .eq("active", true)
    .order("name", { ascending: true });

  if (unitsError) {
    throw new AppError(
      "Failed to load campsites for block creation",
      500,
      "block_units_lookup_failed",
      unitsError,
    );
  }

  const typedUnits = (units ?? []) as Array<Pick<Tables<"campsite_units">, "id">>;

  if (!typedUnits.length) {
    throw new AppError(
      "No active campsites found for block creation",
      400,
      "block_units_not_found",
    );
  }

  const { data, error } = await supabase
    .from("booking_blocks")
    .insert(
      typedUnits.map((unit) => ({
        ...input,
        campsite_unit_id: unit.id,
        created_by: user.id,
      })) as never,
    )
    .select("*");

  if (error) {
    throw new AppError(
      "Failed to create booking blocks",
      400,
      "booking_blocks_create_failed",
      error,
    );
  }

  return (data ?? []) as Tables<"booking_blocks">[];
}

export async function updateAdminBlock(blockId: string, input: TablesUpdate<"booking_blocks">) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("booking_blocks")
    .update(input as never)
    .eq("id", blockId)
    .select("*")
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to update booking block", 400, "booking_block_update_failed", error);
  }

  if (!data) {
    throw new AppError("Booking block not found", 404, "booking_block_not_found");
  }

  return data as Tables<"booking_blocks">;
}

export async function deleteAdminBlock(blockId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("booking_blocks").delete().eq("id", blockId);

  if (error) {
    throw new AppError("Failed to delete booking block", 400, "booking_block_delete_failed", error);
  }
}

export async function getAdminCalendarFeed(startDate: string, endDate: string, campsiteUnitId?: string) {
  const { supabase } = await requireAdmin();

  let bookingsQuery = supabase
    .from("booking_units")
    .select("id, booking_id, campsite_unit_id, start_date, end_date, campsite_units(name, slug), bookings(id, booking_reference, guest_first_name, guest_last_name, status)")
    .lte("start_date", endDate)
    .gt("end_date", startDate)
    .order("start_date");

  let blocksQuery = supabase
    .from("booking_blocks")
    .select("id, campsite_unit_id, start_date, end_date, reason, campsite_units(name, slug)")
    .lte("start_date", endDate)
    .gt("end_date", startDate)
    .order("start_date");

  if (campsiteUnitId) {
    bookingsQuery = bookingsQuery.eq("campsite_unit_id", campsiteUnitId);
    blocksQuery = blocksQuery.eq("campsite_unit_id", campsiteUnitId);
  }

  const [{ data: bookings, error: bookingsError }, { data: blocks, error: blocksError }] = await Promise.all([
    bookingsQuery,
    blocksQuery
  ]);

  if (bookingsError) {
    throw new AppError("Failed to load calendar bookings", 500, "calendar_bookings_failed", bookingsError);
  }

  if (blocksError) {
    throw new AppError("Failed to load calendar blocks", 500, "calendar_blocks_failed", blocksError);
  }

  return {
    items: [
      ...((bookings ?? []) as Array<
        Tables<"booking_units"> & {
          campsite_units?: { name: string; slug: string } | null;
          bookings?: Pick<Tables<"bookings">, "id" | "booking_reference" | "guest_first_name" | "guest_last_name" | "status"> | null;
        }
      >).map((bookingUnit) => ({
        type: "booking" as const,
        id: bookingUnit.id,
        bookingId: bookingUnit.bookings?.id ?? bookingUnit.id,
        campsiteUnitId: bookingUnit.campsite_unit_id,
        startDate: bookingUnit.start_date,
        endDate: bookingUnit.end_date,
        title: `${bookingUnit.campsite_units?.name ?? "Campsite"} · ${bookingUnit.bookings?.booking_reference ?? "Booking"} · ${bookingUnit.bookings?.guest_first_name ?? ""} ${bookingUnit.bookings?.guest_last_name ?? ""}`.trim(),
        metadata: bookingUnit
      })),
      ...((blocks ?? []) as BlockRow[]).map((block) => ({
        type: "block" as const,
        id: block.id,
        campsiteUnitId: block.campsite_unit_id,
        startDate: block.start_date,
        endDate: block.end_date,
        title: block.reason || "Manual block",
        metadata: block
      }))
    ].sort((left, right) => left.startDate.localeCompare(right.startDate))
  };
}
