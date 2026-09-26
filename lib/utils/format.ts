import { format } from "date-fns";

import type { Enums } from "@/types/database";

// Intl renders NAD as a bare "$" for en-NA, so prefix the Namibian "N$" ourselves.
export function formatCurrency(value: number, { maximumFractionDigits = 0 } = {}) {
  const amount = new Intl.NumberFormat("en-NA", {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits
  }).format(value);
  return `N$ ${amount}`;
}

export function formatDate(value: string) {
  return format(new Date(value), "dd MMM yyyy");
}

export function statusLabel(status: Enums<"booking_status">) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function statusBadgeVariant(status: Enums<"booking_status">) {
  if (status === "pending") return "pending";
  if (status === "confirmed") return "confirmed";
  if (status === "rejected") return "rejected";
  if (status === "cancelled") return "cancelled";
  return "stone";
}
