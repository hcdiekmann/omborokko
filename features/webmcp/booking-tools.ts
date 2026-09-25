"use client";

import type { QueryClient } from "@tanstack/react-query";
import { addDays, differenceInCalendarDays, format, isValid, parseISO, startOfToday } from "date-fns";

import {
  getBookingWindow,
  getNightStatus,
  nightAvailabilityQueryOptions,
} from "@/features/bookings/client/night-availability";
import {
  createStoredRequestFromSubmit,
  createStoredRequestFromSummary,
  saveStoredRequest,
  type BookingSummary,
} from "@/features/bookings/client/request-storage";

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

type BookingToolContext = {
  locale: string;
  queryClient: QueryClient;
};

const MAX_CAMPSITES_PER_REQUEST = 4;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function success(data: unknown): ToolResult {
  return { content: [{ type: "text", text: JSON.stringify(data) }] };
}

function failure(message: string): ToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

class ToolInputError extends Error {}

function requireDate(value: unknown, field: string) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!ISO_DATE_PATTERN.test(text) || !isValid(parseISO(text))) {
    throw new ToolInputError(`${field} must be a calendar date in YYYY-MM-DD format, e.g. "2026-12-20".`);
  }
  return text;
}

function requireStay(input: { checkInDate?: unknown; checkOutDate?: unknown }) {
  const checkInDate = requireDate(input.checkInDate, "checkInDate");
  const checkOutDate = requireDate(input.checkOutDate, "checkOutDate");
  const today = format(startOfToday(), "yyyy-MM-dd");

  if (checkInDate < today) {
    throw new ToolInputError(`checkInDate ${checkInDate} is in the past. Today is ${today}.`);
  }
  if (checkOutDate <= checkInDate) {
    throw new ToolInputError("checkOutDate must be at least one day after checkInDate (minimum stay is 1 night).");
  }

  return {
    checkInDate,
    checkOutDate,
    nights: differenceInCalendarDays(parseISO(checkOutDate), parseISO(checkInDate)),
  };
}

function wholeNumber(value: unknown, field: string, { min, max, fallback }: { min: number; max: number; fallback?: number }) {
  if ((value === undefined || value === null || value === "") && fallback !== undefined) return fallback;
  const number = typeof value === "string" ? Number(value) : value;
  if (typeof number !== "number" || !Number.isInteger(number) || number < min || number > max) {
    throw new ToolInputError(`${field} must be a whole number between ${min} and ${max}.`);
  }
  return number;
}

function optionalText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function requestJson(url: string, init: RequestInit) {
  const response = await fetch(url, init);
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error?.message ?? `Request failed with status ${response.status}.`);
  }
  return payload?.data;
}

async function run(execute: () => Promise<unknown>): Promise<ToolResult> {
  try {
    return success(await execute());
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return failure("The request was cancelled.");
    return failure(error instanceof Error ? error.message : "Something went wrong. Ask the guest to try again on the page.");
  }
}

/**
 * WebMCP tools for Omborokko Safaris' campsite booking flow. They reuse the
 * same public API routes as the site UI, and the booking tools write to the
 * same browser storage the booking form reads, so the page reflects whatever
 * an agent does.
 */
export function createBookingTools({ locale, queryClient }: BookingToolContext): WebMCP.ModelContextTool[] {
  const bookPageUrl = () => `${window.location.origin}/${locale}/book`;

  return [
    {
      name: "get_campsite_pricing",
      title: "Get campsite pricing",
      description:
        "Returns Omborokko Safaris campsite rates in Namibian dollars (NAD): price per adult per night, price per child per night, maximum guests per campsite and fees. Pass stay dates and guest counts to also get a total price quote for that stay.",
      inputSchema: {
        type: "object",
        properties: {
          checkInDate: { type: "string", description: "Optional arrival date, YYYY-MM-DD. Include with checkOutDate for a quote." },
          checkOutDate: { type: "string", description: "Optional departure date, YYYY-MM-DD." },
          adults: { type: "integer", description: "Number of adults for the quote. Defaults to 1." },
          children: { type: "integer", description: "Number of children for the quote. Defaults to 0." },
        },
      },
      annotations: { readOnlyHint: true },
      execute: (input: Record<string, unknown>, { signal }: WebMCP.ToolExecuteCallbackOptions) =>
        run(async () => {
          const search = new URLSearchParams({
            adultGuestsCount: String(wholeNumber(input.adults, "adults", { min: 0, max: 20, fallback: 1 })),
            childGuestsCount: String(wholeNumber(input.children, "children", { min: 0, max: 20, fallback: 0 })),
          });
          if (input.checkInDate || input.checkOutDate) {
            const stay = requireStay(input);
            search.set("checkInDate", stay.checkInDate);
            search.set("checkOutDate", stay.checkOutDate);
          }
          const pricing = await requestJson(`/api/pricing?${search.toString()}`, { signal });
          return {
            ...pricing,
            pricingModel: "Price is per person per night. Children are charged the child rate. There is no cleaning fee.",
          };
        }),
    },
    {
      name: "check_availability",
      title: "Check campsite availability",
      description:
        "Checks whether enough campsites are free for a specific stay at Omborokko Safaris. Returns whether the stay is available, how many campsites are free for every night of it, and the number of nights.",
      inputSchema: {
        type: "object",
        properties: {
          checkInDate: { type: "string", description: "Arrival date, YYYY-MM-DD." },
          checkOutDate: { type: "string", description: "Departure date, YYYY-MM-DD. Must be after checkInDate." },
          campsites: { type: "integer", description: `Number of campsites needed, 1 to ${MAX_CAMPSITES_PER_REQUEST}. Defaults to 1.` },
        },
        required: ["checkInDate", "checkOutDate"],
      },
      annotations: { readOnlyHint: true },
      execute: (input: Record<string, unknown>, { signal }: WebMCP.ToolExecuteCallbackOptions) =>
        run(async () => {
          const stay = requireStay(input);
          const campsites = wholeNumber(input.campsites, "campsites", { min: 1, max: MAX_CAMPSITES_PER_REQUEST, fallback: 1 });
          const search = new URLSearchParams({
            checkInDate: stay.checkInDate,
            checkOutDate: stay.checkOutDate,
            requestedUnitCount: String(campsites),
          });
          const result = await requestJson(`/api/availability?${search.toString()}`, { signal });
          return {
            checkInDate: stay.checkInDate,
            checkOutDate: stay.checkOutDate,
            nights: stay.nights,
            campsitesRequested: campsites,
            available: result.available,
            campsitesFreeForWholeStay: result.availableCount,
            totalCampsites: result.totalCount,
            ...(result.available
              ? {}
              : { hint: "Use get_availability_calendar to find nearby dates with enough free campsites." }),
          };
        }),
    },
    {
      name: "get_availability_calendar",
      title: "Get availability calendar",
      description:
        "Lists which nights are fully booked or nearly full at Omborokko Safaris over a date range, to help find open dates. Every night not listed has all campsites free. Bookings open up to 18 months ahead.",
      inputSchema: {
        type: "object",
        properties: {
          startDate: { type: "string", description: "First night to include, YYYY-MM-DD. Defaults to today." },
          endDate: { type: "string", description: "Last night to include, YYYY-MM-DD. Defaults to 60 days after startDate." },
          campsites: { type: "integer", description: `Number of campsites needed, 1 to ${MAX_CAMPSITES_PER_REQUEST}. Defaults to 1.` },
        },
      },
      annotations: { readOnlyHint: true },
      execute: (input: Record<string, unknown>) =>
        run(async () => {
          const today = format(startOfToday(), "yyyy-MM-dd");
          const bookingWindow = getBookingWindow();
          const lastBookableNight = format(addDays(parseISO(bookingWindow.endDate), -1), "yyyy-MM-dd");
          const requestedStart = input.startDate ? requireDate(input.startDate, "startDate") : today;
          const startDate = requestedStart < today ? today : requestedStart;
          const requestedEnd = input.endDate
            ? requireDate(input.endDate, "endDate")
            : format(addDays(parseISO(startDate), 60), "yyyy-MM-dd");
          const endDate = requestedEnd > lastBookableNight ? lastBookableNight : requestedEnd;
          const campsites = wholeNumber(input.campsites, "campsites", { min: 1, max: MAX_CAMPSITES_PER_REQUEST, fallback: 1 });

          if (endDate < startDate) {
            throw new ToolInputError(`endDate must be on or after startDate and no later than ${lastBookableNight}.`);
          }

          const nights = await queryClient.fetchQuery(nightAvailabilityQueryOptions());
          const inRange = nights.filter((night) => night.night_date >= startDate && night.night_date <= endDate);
          const fullyBookedNights: string[] = [];
          const nearlyFullNights: Array<{ date: string; campsitesFree: number }> = [];

          for (const night of inRange) {
            const status = getNightStatus(night, campsites);
            if (status === "full") fullyBookedNights.push(night.night_date);
            else if (status === "limited") nearlyFullNights.push({ date: night.night_date, campsitesFree: night.available_count });
          }

          return {
            today,
            startDate,
            endDate,
            campsitesRequested: campsites,
            totalCampsites: inRange[0]?.total_count ?? null,
            fullyBookedNights,
            nearlyFullNights,
            note: "A night is the date you sleep there; checking out on the morning after a fully booked night is fine. Nights not listed have every campsite free.",
          };
        }),
    },
    {
      name: "request_booking",
      title: "Request a campsite booking",
      description:
        "Sends a booking request to Omborokko Safaris for the guest. The request is reviewed by the owners, who confirm or decline it by email; no payment is taken now. Use once the guest has confirmed the dates, number of campsites, guest counts and their contact details. Returns the booking reference.",
      inputSchema: {
        type: "object",
        properties: {
          checkInDate: { type: "string", description: "Arrival date, YYYY-MM-DD." },
          checkOutDate: { type: "string", description: "Departure date, YYYY-MM-DD." },
          campsites: { type: "integer", description: `Number of campsites, 1 to ${MAX_CAMPSITES_PER_REQUEST}.` },
          adults: { type: "integer", description: "Number of adults." },
          children: { type: "integer", description: "Number of children. Defaults to 0." },
          firstName: { type: "string", description: "Guest's first name." },
          lastName: { type: "string", description: "Guest's last name." },
          email: { type: "string", description: "Guest's email address; the confirmation is sent here." },
          phone: { type: "string", description: "Optional phone number, ideally with country code." },
          notes: { type: "string", description: "Optional message to the owners, e.g. arrival time or vehicle details." },
        },
        required: ["checkInDate", "checkOutDate", "campsites", "adults", "firstName", "lastName", "email"],
      },
      annotations: { consequentialHint: true },
      execute: (input: Record<string, unknown>, { signal }: WebMCP.ToolExecuteCallbackOptions) =>
        run(async () => {
          const stay = requireStay(input);
          const requestedUnitCount = wholeNumber(input.campsites, "campsites", { min: 1, max: MAX_CAMPSITES_PER_REQUEST });
          const adultGuestsCount = wholeNumber(input.adults, "adults", { min: 0, max: 20 });
          const childGuestsCount = wholeNumber(input.children, "children", { min: 0, max: 20, fallback: 0 });
          const guestFirstName = optionalText(input.firstName, 120);
          const guestLastName = optionalText(input.lastName, 120);
          const guestEmail = optionalText(input.email, 255);

          if (adultGuestsCount + childGuestsCount < 1) throw new ToolInputError("At least one guest is required.");
          if (!guestFirstName || !guestLastName) throw new ToolInputError("firstName and lastName are required.");
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) throw new ToolInputError("email must be a valid email address.");

          // A fresh id per tool call: the id makes retries of this exact call
          // idempotent without colliding with a request typed into the form.
          const clientRequestId = crypto.randomUUID();
          const result = await requestJson("/api/bookings/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal,
            body: JSON.stringify({
              checkInDate: stay.checkInDate,
              checkOutDate: stay.checkOutDate,
              requestedUnitCount,
              adultGuestsCount,
              childGuestsCount,
              guestFirstName,
              guestLastName,
              guestEmail,
              guestPhone: optionalText(input.phone, 50),
              notes: optionalText(input.notes, 2000),
              clientRequestId,
            }),
          });

          saveStoredRequest(
            createStoredRequestFromSubmit(
              clientRequestId,
              { checkInDate: stay.checkInDate, checkOutDate: stay.checkOutDate, requestedUnitCount, guestEmail },
              result.booking
            )
          );

          return {
            bookingReference: result.booking.booking_reference,
            status: result.booking.status,
            checkInDate: stay.checkInDate,
            checkOutDate: stay.checkOutDate,
            nights: result.pricing?.nights ?? stay.nights,
            campsites: requestedUnitCount,
            estimatedTotal: result.pricing ? { amount: result.pricing.totalAmount, currency: result.pricing.currency } : null,
            nextSteps:
              "The owners review the request and email the guest to confirm or decline. The guest can follow the status on the booking page with their email and booking reference.",
            statusPage: bookPageUrl(),
          };
        }),
    },
    {
      name: "find_booking_request",
      title: "Find a booking request",
      description:
        "Looks up an existing Omborokko Safaris booking request by the guest's email address and booking reference, and returns its status (pending, confirmed, rejected or cancelled), dates and any message from the owners.",
      inputSchema: {
        type: "object",
        properties: {
          email: { type: "string", description: "Email address used for the booking request." },
          bookingReference: { type: "string", description: "Booking reference from the confirmation email, e.g. BKG-1A2B3C4D5E." },
        },
        required: ["email", "bookingReference"],
      },
      annotations: { readOnlyHint: true },
      execute: (input: Record<string, unknown>, { signal }: WebMCP.ToolExecuteCallbackOptions) =>
        run(async () => {
          const guestEmail = optionalText(input.email, 255);
          const bookingReference = optionalText(input.bookingReference, 40);
          if (!guestEmail || !bookingReference) throw new ToolInputError("email and bookingReference are both required.");

          const result = await requestJson("/api/bookings/request/lookup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal,
            body: JSON.stringify({ guestEmail, bookingReference }),
          });
          const booking = result?.booking as BookingSummary | null | undefined;

          if (!booking) {
            throw new ToolInputError(
              "No booking request matches that email and reference. Check both with the guest; the reference starts with BKG-."
            );
          }

          saveStoredRequest(createStoredRequestFromSummary(booking));

          return {
            bookingReference: booking.booking_reference,
            status: booking.status,
            checkInDate: booking.check_in_date,
            checkOutDate: booking.check_out_date,
            campsites: booking.requested_unit_count,
            messageFromOwners: booking.guest_message ?? null,
            requestedAt: booking.created_at ?? null,
            statusPage: bookPageUrl(),
          };
        }),
    },
  ];
}
