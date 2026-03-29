import { format } from "date-fns";

import type { Enums } from "@/types/database";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NA", {
    style: "currency",
    currency: "NAD",
    maximumFractionDigits: 0
  }).format(value);
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
