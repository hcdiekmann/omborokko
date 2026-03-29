import { AppError } from "@/lib/utils/http";
import { daysBetween } from "@/lib/utils/dates";
import type { Tables } from "@/types/database";

export type BookingPricing = {
  nights: number;
  subtotalAmount: number;
  feesAmount: number;
  totalAmount: number;
  adultGuestsCount: number;
  childGuestsCount: number;
  guestsCount: number;
  nightlyRate: number;
  currency: "NAD";
};

export function computeBookingPricing(
  unit: Tables<"campsite_units">,
  checkInDate: string,
  checkOutDate: string,
  adultGuestsCount: number,
  childGuestsCount: number
): BookingPricing {
  const nights = daysBetween(checkInDate, checkOutDate);

  if (nights <= 0) {
    throw new AppError("Check-out date must be later than check-in date", 400, "invalid_dates");
  }

  const guestsCount = adultGuestsCount + childGuestsCount;

  if (guestsCount <= 0) {
    throw new AppError("At least one guest is required", 400, "invalid_guest_count");
  }

  const nightlyRate = Number(
    (adultGuestsCount * unit.base_price_per_night + childGuestsCount * unit.child_price_per_night).toFixed(2)
  );
  const subtotalAmount = Number((nights * nightlyRate).toFixed(2));
  const feesAmount = 0;
  const totalAmount = Number((subtotalAmount + feesAmount).toFixed(2));

  return {
    nights,
    subtotalAmount,
    feesAmount,
    totalAmount,
    adultGuestsCount,
    childGuestsCount,
    guestsCount,
    nightlyRate,
    currency: "NAD"
  };
}
