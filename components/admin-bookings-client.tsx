"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown, Check, Search, X } from "lucide-react";

import { AdminStatCard } from "@/components/admin-stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate, statusBadgeVariant, statusLabel } from "@/lib/utils/format";
import { queryKeys } from "@/lib/utils/query";
import type { Enums } from "@/types/database";

type BookingRow = {
  id: string;
  booking_reference: string;
  guest_first_name: string;
  guest_last_name: string;
  guest_email: string;
  guests_count: number;
  requested_unit_count: number;
  check_in_date: string;
  check_out_date: string;
  status: Enums<"booking_status">;
  total_amount: number;
  created_at: string;
  campsite_units?: { id: string; name: string; slug: string } | null;
};

export function AdminBookingsClient() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => queryKeys.adminBookings({ status, search }), [status, search]);

  const bookingsQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (status) searchParams.set("status", status);
      if (search) searchParams.set("search", search);
      const response = await fetch(`/api/admin/bookings?${searchParams.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Failed to load bookings");
      return payload.data as BookingRow[];
    }
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, nextStatus }: { id: string; nextStatus: Enums<"booking_status"> }) => {
      const response = await fetch(`/api/admin/bookings/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus })
      });
      const payload = await response.json();
      if (!response.ok) {
        const availability = payload.error?.details?.availability as
          | { availableCount: number; requestedUnitCount: number }
          | undefined;
        if (availability) {
          throw new Error(
            `Cannot confirm this booking because only ${availability.availableCount} campsite(s) are free for ${availability.requestedUnitCount} requested.`
          );
        }
        throw new Error(payload.error?.message || "Failed to update booking");
      }
      return payload.data;
    },
    onSuccess: (_, variables) => {
      setFeedback(`Booking updated to ${variables.nextStatus}.`);
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    }
  });

  const counts =
    bookingsQuery.data?.reduce<Record<string, number>>((accumulator, booking) => {
      accumulator[booking.status] = (accumulator[booking.status] ?? 0) + 1;
      return accumulator;
    }, {}) ?? {};

  const columns = useMemo<ColumnDef<BookingRow>[]>(
    () => [
      {
        accessorKey: "booking_reference",
        header: ({ column }) => (
          <SortButton label="Reference" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <Link href={`/admin/bookings/${row.original.id}`} className="font-medium text-stone-900 hover:underline">
              {row.original.booking_reference}
            </Link>
            <p className="text-xs text-stone-500">{formatDate(row.original.created_at)}</p>
          </div>
        )
      },
      {
        id: "guest",
        accessorFn: (row) => `${row.guest_first_name} ${row.guest_last_name}`,
        header: ({ column }) => (
          <SortButton label="Guest" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium text-stone-900">
              {row.original.guest_first_name} {row.original.guest_last_name}
            </p>
            <p className="text-xs text-stone-500">{row.original.guest_email}</p>
          </div>
        )
      },
      {
        id: "campsites",
        accessorFn: (row) => row.requested_unit_count,
        header: ({ column }) => (
          <SortButton label="Campsites" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium text-stone-900">{row.original.requested_unit_count} requested</p>
            <p className="text-xs text-stone-500">{row.original.campsite_units?.name ?? "Assigned on confirmation"}</p>
          </div>
        )
      },
      {
        id: "stay",
        accessorFn: (row) => row.check_in_date,
        header: ({ column }) => (
          <SortButton label="Stay dates" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
        ),
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium text-stone-900">{row.original.check_in_date}</p>
            <p className="text-xs text-stone-500">to {row.original.check_out_date}</p>
          </div>
        )
      },
      {
        accessorKey: "guests_count",
        header: ({ column }) => (
          <SortButton label="Guests" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
        )
      },
      {
        accessorKey: "status",
        header: ({ column }) => (
          <SortButton label="Status" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
        ),
        cell: ({ row }) => <Badge variant={statusBadgeVariant(row.original.status)}>{statusLabel(row.original.status)}</Badge>
      },
      {
        accessorKey: "total_amount",
        header: ({ column }) => (
          <SortButton label="Total" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
        ),
        cell: ({ row }) => <span className="font-medium text-stone-900">{formatCurrency(row.original.total_amount)}</span>
      },
      {
        accessorKey: "created_at",
        header: ({ column }) => (
          <SortButton label="Created" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} />
        ),
        cell: ({ row }) => <span className="text-sm text-stone-600">{formatDate(row.original.created_at)}</span>
      },
      {
        id: "actions",
        enableSorting: false,
        header: "Actions",
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-2">
            {row.original.status === "pending" ? (
              <>
                <Button
                  onClick={() => updateStatus.mutate({ id: row.original.id, nextStatus: "confirmed" })}
                  variant="success"
                  size="sm"
                  disabled={updateStatus.isPending}
                >
                  <Check className="mr-1 h-3.5 w-3.5" />
                  Confirm
                </Button>
                <Button
                  onClick={() => updateStatus.mutate({ id: row.original.id, nextStatus: "rejected" })}
                  variant="destructive"
                  size="sm"
                  disabled={updateStatus.isPending}
                >
                  <X className="mr-1 h-3.5 w-3.5" />
                  Reject
                </Button>
              </>
            ) : null}
            {row.original.status === "confirmed" ? (
              <Button
                onClick={() => updateStatus.mutate({ id: row.original.id, nextStatus: "cancelled" })}
                variant="outline"
                size="sm"
                disabled={updateStatus.isPending}
              >
                Cancel
              </Button>
            ) : null}
            <Link href={`/admin/bookings/${row.original.id}`} className="inline-flex">
              <Button variant="outline" size="sm">
                Inspect
              </Button>
            </Link>
          </div>
        )
      }
    ],
    [updateStatus]
  );

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Pending", value: counts.pending ?? 0, variant: "pending" as const },
          { label: "Confirmed", value: counts.confirmed ?? 0, variant: "confirmed" as const },
          { label: "Rejected", value: counts.rejected ?? 0, variant: "rejected" as const },
          { label: "Cancelled", value: counts.cancelled ?? 0, variant: "cancelled" as const }
        ].map((item) => (
          <AdminStatCard
            key={item.label}
            label={item.label}
            value={item.value}
            tone={item.variant}
            detail={item.label === "Pending" ? "Needs review" : `${item.label.toLowerCase()} requests`}
          />
        ))}
      </div>

      <DataTable
        columns={columns}
        data={bookingsQuery.data ?? []}
        emptyState={bookingsQuery.isLoading ? "Loading bookings..." : "No bookings found for the current filters."}
        defaultSorting={[{ id: "created_at", desc: true }]}
        toolbar={
          <div className="grid gap-3 md:grid-cols-[200px_1fr]">
            <Select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="rejected">Rejected</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reference, guest name, or email"
                className="pl-9"
              />
            </div>
          </div>
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-stone-500">Sorted newest first by default. Status and search remain server-backed to keep the dataset tight.</p>
            {search || status ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setStatus("");
                }}
              >
                Reset filters
              </Button>
            ) : null}
          </div>
        }
      />

      {feedback ? <p className="text-sm text-green-700">{feedback}</p> : null}
      {updateStatus.isError ? <p className="text-sm text-red-600">{updateStatus.error.message}</p> : null}
    </div>
  );
}

function SortButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1 text-left">
      <span>{label}</span>
      <ArrowUpDown className="h-3.5 w-3.5 text-stone-400" />
    </button>
  );
}
