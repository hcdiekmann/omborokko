import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/utils/http";
import type { Database, Tables } from "@/types/database";
import { getCampsiteAvailability } from "@/features/bookings/server/availability";
import { computeBookingPricing } from "@/features/bookings/server/pricing";

type CreateBookingRequestInput = {
  checkInDate: string;
  checkOutDate: string;
  requestedUnitCount: number;
  guestFirstName: string;
  guestLastName: string;
  guestEmail: string;
  guestPhone?: string;
  adultGuestsCount: number;
  childGuestsCount: number;
  notes?: string;
};

type UnitRow = Tables<"campsite_units">;
type BookingRequestRpcResult = Database["public"]["Functions"]["create_booking_request"]["Returns"][number];

export async function getActiveUnits(): Promise<UnitRow[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campsite_units")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new AppError("Failed to load campsite units", 500, "units_lookup_failed", error);
  }

  return (data ?? []) as UnitRow[];
}

export async function getUnitBySlug(slug: string): Promise<UnitRow | null> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campsite_units")
    .select("*")
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to load campsite unit", 500, "unit_lookup_failed", error);
  }

  return (data ?? null) as UnitRow | null;
}

export async function getUnitById(campsiteUnitId: string): Promise<UnitRow> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campsite_units")
    .select("*")
    .eq("id", campsiteUnitId)
    .eq("active", true)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to load campsite unit", 500, "unit_lookup_failed", error);
  }

  if (!data) {
    throw new AppError("Campsite unit not found", 404, "unit_not_found");
  }

  return data as UnitRow;
}

export async function getPublicCampsiteTemplate(): Promise<UnitRow> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("campsite_units")
    .select("*")
    .eq("active", true)
    .order("name", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new AppError("Failed to load campsite details", 500, "campsite_template_failed", error);
  }

  if (!data) {
    throw new AppError("No active campsites found", 404, "campsite_not_found");
  }

  return data as UnitRow;
}

export async function createPendingBookingRequest(input: CreateBookingRequestInput) {
  const supabase = await createServerSupabaseClient();
  const unit = await getPublicCampsiteTemplate();
  const guestsCount = input.adultGuestsCount + input.childGuestsCount;

  if (guestsCount <= 0) {
    throw new AppError("At least one guest is required", 400, "invalid_guest_count");
  }

  if (input.requestedUnitCount <= 0) {
    throw new AppError("At least one campsite must be requested", 400, "invalid_campsite_count");
  }

  if (guestsCount > unit.max_guests * input.requestedUnitCount) {
    throw new AppError("Requested guests exceed the selected campsite capacity", 400, "unit_capacity_exceeded");
  }

  const availability = await getCampsiteAvailability(input.checkInDate, input.checkOutDate, input.requestedUnitCount);

  if (!availability.available) {
    throw new AppError("Not enough campsites are available for the selected dates", 409, "unit_unavailable", {
      availableCount: availability.availableCount,
      requestedUnitCount: input.requestedUnitCount
    });
  }

  const pricing = computeBookingPricing(
    unit,
    input.checkInDate,
    input.checkOutDate,
    input.adultGuestsCount,
    input.childGuestsCount
  );

  const { data, error } = await supabase.rpc("create_booking_request", {
    p_check_in_date: input.checkInDate,
    p_check_out_date: input.checkOutDate,
    p_guest_first_name: input.guestFirstName,
    p_guest_last_name: input.guestLastName,
    p_guest_email: input.guestEmail,
    p_guest_phone: input.guestPhone?.trim() ? input.guestPhone.trim() : "",
    p_requested_unit_count: input.requestedUnitCount,
    p_adult_guests_count: input.adultGuestsCount,
    p_child_guests_count: input.childGuestsCount,
    p_notes: input.notes?.trim() ? input.notes.trim() : null
  } as never);

  if (error) {
    throw new AppError("Failed to create booking request", 400, "booking_request_failed", error);
  }

  const created = (data as BookingRequestRpcResult[] | null)?.[0];

  if (!created) {
    throw new AppError("Booking request was not returned by the database", 500, "booking_request_empty");
  }

  return {
    booking: created,
    pricing,
    unit,
    availability
  };
}
