import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminStatCard } from "@/components/admin-stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  listAdminBookings,
  listAdminUnits,
  listAdminBlocks,
} from "@/features/admin/server/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Tables } from "@/types/database";

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const typedProfile = (profile ?? null) as Pick<
    Tables<"profiles">,
    "role"
  > | null;

  if (!typedProfile || typedProfile.role !== "admin") {
    redirect("/login?redirectTo=/admin");
  }

  const [bookings, units, blocks] = await Promise.all([
    listAdminBookings({}),
    listAdminUnits(),
    listAdminBlocks(),
  ]);

  const pendingCount = bookings.filter(
    (booking) => booking.status === "pending",
  ).length;
  const upcomingConfirmedCount = bookings.filter(
    (booking) =>
      booking.status === "confirmed" &&
      booking.check_in_date >= new Date().toISOString().slice(0, 10),
  ).length;
  const recentPending = bookings
    .filter((booking) => booking.status === "pending")
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminStatCard
          label="Pending bookings"
          value={pendingCount}
          tone="pending"
          detail="Requests waiting for an admin decision."
        />
        <AdminStatCard
          label="Upcoming confirmed"
          value={upcomingConfirmedCount}
          tone="confirmed"
          detail="Confirmed stays that start today or later."
        />
        <AdminStatCard
          label="Active blocks"
          value={blocks.length}
          tone="stone"
          detail="Manual unavailable periods across units."
        />
        <AdminStatCard
          label="Active units"
          value={units.filter((unit) => unit.active).length}
          tone="stone"
          detail="Currently bookable campsite units."
        />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr] xl:gap-6">
        <Card className="bg-white/90">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">
                Recent pending bookings
              </h2>
              <p className="mt-1 text-sm text-stone-600">
                Newest booking requests awaiting review.
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentPending.length ? (
              recentPending.map((booking) => (
                <Link
                  key={booking.id}
                  href={`/admin/bookings/${booking.id}`}
                  className="block rounded-2xl border border-stone-200 p-4 hover:bg-stone-50"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-stone-900">
                        {booking.booking_reference}
                      </p>
                      <p className="text-sm text-stone-600">
                        {booking.guest_first_name} {booking.guest_last_name} ·{" "}
                        {booking.guest_email}
                      </p>
                      <p className="text-sm text-stone-600">
                        {booking.check_in_date} to {booking.check_out_date} ·{" "}
                        {booking.requested_unit_count} campsite(s)
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <Badge variant="pending">Pending</Badge>
                      <p className="mt-2 text-sm text-stone-700">
                        {formatCurrency(booking.total_amount)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-sm text-stone-500">
                No pending bookings right now.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="bg-white/90">
            <CardHeader>
              <h2 className="text-lg font-semibold text-stone-950">
                Latest activity
              </h2>
            </CardHeader>
            <CardContent className="space-y-2">
              {bookings.slice(0, 4).map((booking) => (
                <div key={booking.id} className="rounded-2xl bg-stone-50 p-3">
                  <p className="text-sm font-medium text-stone-900">
                    {booking.booking_reference}
                  </p>
                  <p className="text-sm text-stone-600">
                    {formatDate(booking.created_at)} ·{" "}
                    {booking.requested_unit_count} campsite(s) requested
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
