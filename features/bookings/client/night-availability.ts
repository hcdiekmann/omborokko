"use client";

import { useQuery } from "@tanstack/react-query";
import { addMonths, format, startOfMonth, startOfToday } from "date-fns";

export type NightAvailabilityStatus = "available" | "limited" | "full";

export type NightAvailability = {
  night_date: string;
  available_count: number;
  total_count: number;
  requested_unit_count: number;
  availability_status: NightAvailabilityStatus;
};

/** How far ahead guests can browse and book. */
export const BOOKING_MONTHS_AHEAD = 18;

const NIGHT_AVAILABILITY_STALE_MS = 60_000;

function toIsoDate(date: Date) {
  return format(date, "yyyy-MM-dd");
}

/** The bookable window: the current month plus the next 17. */
export function getBookingWindow() {
  const start = startOfMonth(startOfToday());
  return {
    startDate: toIsoDate(start),
    endDate: toIsoDate(addMonths(start, BOOKING_MONTHS_AHEAD)),
  };
}

export async function fetchNightAvailability(
  startDate: string,
  endDate: string,
  signal?: AbortSignal
): Promise<NightAvailability[]> {
  const search = new URLSearchParams({ startDate, endDate, requestedUnitCount: "1" });
  const response = await fetch(`/api/availability/calendar?${search.toString()}`, { signal });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? "Failed to load calendar availability");
  }

  return payload?.data?.nights ?? [];
}

/**
 * Status of a night for a given party size. The API reports how many
 * campsites are free, so this is derived on the client and changing the
 * number of campsites needed never triggers a new request.
 */
export function getNightStatus(
  night: Pick<NightAvailability, "available_count" | "total_count">,
  requestedUnitCount: number
): NightAvailabilityStatus {
  if (night.available_count < Math.max(1, requestedUnitCount)) return "full";
  if (night.available_count < night.total_count) return "limited";
  return "available";
}

export function nightAvailabilityQueryOptions() {
  const { startDate, endDate } = getBookingWindow();

  return {
    queryKey: ["night-availability", startDate, endDate] as const,
    queryFn: ({ signal }: { signal: AbortSignal }) => fetchNightAvailability(startDate, endDate, signal),
    staleTime: NIGHT_AVAILABILITY_STALE_MS,
  };
}

/** Nightly availability for the whole booking window, shared across the app. */
export function useNightAvailability(enabled = true) {
  return useQuery({ ...nightAvailabilityQueryOptions(), enabled });
}
