"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate, statusBadgeVariant, statusLabel } from "@/lib/utils/format";
import { queryKeys } from "@/lib/utils/query";
import type { Enums } from "@/types/database";

export function AdminBookingDetailClient({ bookingId }: { bookingId: string }) {
  const queryClient = useQueryClient();
  const [adminNotes, setAdminNotes] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);

  const bookingQuery = useQuery({
    queryKey: queryKeys.adminBooking(bookingId),
    queryFn: async () => {
      const response = await fetch(`/api/admin/bookings/${bookingId}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Failed to load booking");
      return payload.data;
    }
  });

  useEffect(() => {
    if (bookingQuery.data?.booking) {
      setAdminNotes(bookingQuery.data.booking.admin_notes || "");
    }
  }, [bookingQuery.data]);

  const mutation = useMutation({
    mutationFn: async (status: Enums<"booking_status">) => {
      const response = await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes })
      });
      const payload = await response.json();
      if (!response.ok) {
        const availability = payload.error?.details?.availability as
          | { availableCount: number; requestedUnitCount: number; availableUnits?: Array<{ name: string }> }
          | undefined;
        if (availability) {
          throw new Error(
            `Cannot confirm this booking because only ${availability.availableCount} campsite(s) are currently free for ${availability.requestedUnitCount} requested.`
          );
        }
        throw new Error(payload.error?.message || "Failed to update booking");
      }
      return payload.data;
    },
    onSuccess: (_, status) => {
      setFeedback(`Booking updated to ${status}.`);
      queryClient.invalidateQueries({ queryKey: queryKeys.adminBooking(bookingId) });
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
    }
  });

  if (bookingQuery.isLoading) {
    return <p className="text-sm text-stone-500">Loading booking...</p>;
  }

  if (bookingQuery.isError) {
    return <p className="text-sm text-red-600">{bookingQuery.error.message}</p>;
  }

  const { booking, availability, assignedUnits } = bookingQuery.data;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-stone-500">Booking detail</p>
          <h1 className="text-3xl font-semibold text-stone-950">{booking.booking_reference}</h1>
        </div>
        <Link href="/admin/bookings" className="text-sm text-stone-600 hover:text-stone-950">
          Back to bookings
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <p className="text-sm text-stone-500">Guest</p>
              <p className="mt-1 text-lg font-semibold text-stone-950">
                {booking.guest_first_name} {booking.guest_last_name}
              </p>
              <p className="text-sm text-stone-600">{booking.guest_email}</p>
              {booking.guest_phone ? <p className="text-sm text-stone-600">{booking.guest_phone}</p> : null}
            </div>
            <Badge variant={statusBadgeVariant(booking.status)}>{statusLabel(booking.status)}</Badge>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500">Campsites</p>
                <p className="mt-1 text-sm text-stone-800">
                  {booking.requested_unit_count} requested
                  {assignedUnits.length ? ` · ${assignedUnits.map((unit: { campsite_units?: { name: string } | null }) => unit.campsite_units?.name).filter(Boolean).join(", ")}` : " · not assigned yet"}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500">Created</p>
                <p className="mt-1 text-sm text-stone-800">{formatDate(booking.created_at)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500">Stay dates</p>
                <p className="mt-1 text-sm text-stone-800">{booking.check_in_date} to {booking.check_out_date}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500">Guests</p>
                <p className="mt-1 text-sm text-stone-800">
                  {booking.guests_count} total
                  {typeof booking.adult_guests_count === "number" || typeof booking.child_guests_count === "number"
                    ? ` · ${booking.adult_guests_count} adults · ${booking.child_guests_count} children`
                    : ""}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500">Nights</p>
                <p className="mt-1 text-sm text-stone-800">{booking.nights}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500">Currency</p>
                <p className="mt-1 text-sm text-stone-800">{booking.currency}</p>
              </div>
            </div>

            <div className="grid gap-3 rounded-2xl bg-stone-50 p-4 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500">Subtotal</p>
                <p className="mt-1 text-sm font-medium text-stone-900">{formatCurrency(booking.subtotal_amount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500">Extra fees</p>
                <p className="mt-1 text-sm font-medium text-stone-900">{formatCurrency(booking.fees_amount)}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500">Total</p>
                <p className="mt-1 text-sm font-medium text-stone-900">{formatCurrency(booking.total_amount)}</p>
              </div>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-stone-500">Guest notes</p>
              <p className="mt-1 text-sm text-stone-700">{booking.notes || "No guest notes."}</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-wide text-stone-500">Admin notes</label>
              <Textarea value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} className="min-h-32" />
            </div>

            <div className="flex flex-wrap gap-3">
              {booking.status === "pending" ? (
                <>
                  <Button onClick={() => mutation.mutate("confirmed")} variant="success" disabled={mutation.isPending}>
                    {mutation.isPending ? "Saving..." : "Confirm booking"}
                  </Button>
                  <Button onClick={() => mutation.mutate("rejected")} variant="destructive" disabled={mutation.isPending}>
                    Reject booking
                  </Button>
                </>
              ) : null}
              {booking.status === "confirmed" ? (
                <Button onClick={() => mutation.mutate("cancelled")} variant="outline" disabled={mutation.isPending}>
                  Cancel booking
                </Button>
              ) : null}
            </div>

            {feedback ? <p className="text-sm text-green-700">{feedback}</p> : null}
            {mutation.isError ? <p className="text-sm text-red-600">{mutation.error.message}</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-stone-950">Availability check</h2>
            <p className="mt-1 text-sm text-stone-600">
              Confirmation rechecks whether enough campsites are still free for this request.
            </p>
          </CardHeader>
          <CardContent>
            {availability.available ? (
              <div className="space-y-2 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-700">
                <p>
                  {availability.availableCount} of {availability.totalCount} campsites are currently available, which is enough for this request.
                </p>
                {availability.availableUnits.length ? (
                  <p className="text-xs">Currently free: {availability.availableUnits.map((unit: { name: string }) => unit.name).join(", ")}</p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
                <p>
                  Only {availability.availableCount} campsite(s) are free for {booking.requested_unit_count} requested.
                </p>
                {availability.availableUnits.length ? (
                  <p className="text-xs">Currently free: {availability.availableUnits.map((unit: { name: string }) => unit.name).join(", ")}</p>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
