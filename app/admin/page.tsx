import Link from "next/link";
import { redirect } from "next/navigation";
import { Banknote, CalendarCheck, CircleAlert, Tent } from "lucide-react";

import { AdminPageHeader } from "@/components/admin-page-header";
import { AdminRevenueChart } from "@/components/admin-revenue-chart";
import { AdminStatCard } from "@/components/admin-stat-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  listAdminBookings,
  listAdminUnits,
  listAdminBlocks,
} from "@/features/admin/server/service";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, statusBadgeVariant, statusLabel } from "@/lib/utils/format";
import type { Enums, Tables } from "@/types/database";

type Booking = Tables<"bookings"> & {
  campsite_units?: Pick<Tables<"campsite_units">, "id" | "name" | "slug"> | null;
};

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date) {
  return new Intl.DateTimeFormat("en", { month: "short" }).format(date);
}

function parseDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

function buildMonthlyRevenue(bookings: Booking[]) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    return {
      key: monthKey(date),
      month: monthLabel(date),
      revenue: 0,
      bookings: 0
    };
  });
  const byKey = new Map(months.map((month) => [month.key, month]));

  bookings.forEach((booking) => {
    if (booking.status !== "confirmed") return;
    const bucket = byKey.get(monthKey(parseDate(booking.check_in_date)));
    if (!bucket) return;
    bucket.revenue += booking.total_amount;
    bucket.bookings += 1;
  });

  return months.map(({ key: _key, ...month }) => month);
}

function countByStatus(bookings: Booking[], status: Enums<"booking_status">) {
  return bookings.filter((booking) => booking.status === status).length;
}

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
  const typedBookings = bookings as Booking[];
  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = monthKey(new Date());
  const confirmedBookings = typedBookings.filter((booking) => booking.status === "confirmed");
  const pendingBookings = typedBookings.filter((booking) => booking.status === "pending");
  const upcomingConfirmedCount = confirmedBookings.filter((booking) => booking.check_in_date >= today).length;
  const totalIncome = confirmedBookings.reduce((sum, booking) => sum + booking.total_amount, 0);
  const monthIncome = confirmedBookings
    .filter((booking) => monthKey(parseDate(booking.check_in_date)) === currentMonth)
    .reduce((sum, booking) => sum + booking.total_amount, 0);
  const pendingValue = pendingBookings.reduce((sum, booking) => sum + booking.total_amount, 0);
  const activeBlocks = blocks.filter((block) => block.end_date >= today).length;
  const recentPending = pendingBookings.slice(0, 5);
  const recentActivity = typedBookings.slice(0, 5);
  const revenueData = buildMonthlyRevenue(typedBookings);

  return (
    <div className="space-y-5">
      <AdminPageHeader title="Dashboard" description="Bookings, revenue, and operations at a glance." />

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <AdminStatCard
          label="Total income"
          value={formatCurrency(totalIncome)}
          detail="Confirmed bookings"
          icon={<Banknote className="h-4 w-4" />}
        />
        <AdminStatCard
          label="This month"
          value={formatCurrency(monthIncome)}
          detail="Confirmed check-ins"
          icon={<CalendarCheck className="h-4 w-4" />}
        />
        <AdminStatCard
          label="Pending value"
          value={formatCurrency(pendingValue)}
          detail={`${pendingBookings.length} request${pendingBookings.length === 1 ? "" : "s"}`}
          icon={<CircleAlert className="h-4 w-4" />}
        />
        <AdminStatCard
          label="Bookable units"
          value={units.filter((unit) => unit.active).length}
          detail={`${upcomingConfirmedCount} upcoming · ${activeBlocks} block${activeBlocks === 1 ? "" : "s"}`}
          icon={<Tent className="h-4 w-4" />}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <AdminRevenueChart data={revenueData} />

        <Card className="border-stone-200 bg-white shadow-sm">
          <CardHeader className="px-4 py-4 sm:px-5">
            <h2 className="text-base font-semibold text-stone-950">Summary</h2>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-4 sm:px-5">
            <div className="grid grid-cols-2 gap-3">
              <SummaryItem label="Pending" value={countByStatus(typedBookings, "pending")} />
              <SummaryItem label="Confirmed" value={countByStatus(typedBookings, "confirmed")} />
              <SummaryItem label="Not available" value={countByStatus(typedBookings, "rejected")} />
              <SummaryItem label="Cancelled" value={countByStatus(typedBookings, "cancelled")} />
            </div>
            <div className="rounded-md border border-stone-200 p-3">
              <p className="text-xs font-medium uppercase tracking-wide text-stone-500">Total requests</p>
              <p className="mt-1 text-xl font-semibold text-stone-950">{typedBookings.length}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-stone-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3 px-4 py-4 sm:px-5">
            <h2 className="text-base font-semibold text-stone-950">Pending bookings</h2>
            <Link href="/admin/bookings" className="text-sm font-medium text-stone-600 hover:text-stone-950">View all</Link>
          </CardHeader>
          <CardContent className="divide-y divide-stone-100 px-4 pb-4 sm:px-5">
            {recentPending.length ? (
              recentPending.map((booking) => <BookingRow key={booking.id} booking={booking} />)
            ) : (
              <p className="py-4 text-sm text-stone-500">No pending bookings.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-stone-200 bg-white shadow-sm">
          <CardHeader className="px-4 py-4 sm:px-5">
            <h2 className="text-base font-semibold text-stone-950">Latest activity</h2>
          </CardHeader>
          <CardContent className="divide-y divide-stone-100 px-4 pb-4 sm:px-5">
            {recentActivity.map((booking) => <ActivityRow key={booking.id} booking={booking} />)}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-stone-200 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-semibold text-stone-950">{value}</p>
    </div>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  return (
    <Link href={`/admin/bookings/${booking.id}`} className="block py-3 hover:bg-stone-50">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-stone-950">{booking.booking_reference}</p>
          <p className="truncate text-sm text-stone-600">{booking.guest_first_name} {booking.guest_last_name}</p>
          <p className="mt-1 text-xs text-stone-500">{booking.check_in_date} to {booking.check_out_date} · {booking.requested_unit_count} campsite(s)</p>
        </div>
        <p className="shrink-0 text-sm font-medium text-stone-900">{formatCurrency(booking.total_amount)}</p>
      </div>
    </Link>
  );
}

function ActivityRow({ booking }: { booking: Booking }) {
  return (
    <Link href={`/admin/bookings/${booking.id}`} className="block py-3 hover:bg-stone-50">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-stone-950">{booking.booking_reference}</p>
          <p className="mt-1 text-xs text-stone-500">{formatDate(booking.created_at)}</p>
        </div>
        <Badge variant={statusBadgeVariant(booking.status)}>{statusLabel(booking.status)}</Badge>
      </div>
    </Link>
  );
}
