"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  format,
  type Locale,
  parse,
  startOfWeek,
  endOfMonth,
  startOfMonth,
  getDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Calendar,
  dateFnsLocalizer,
  type EventPropGetter,
  type View,
} from "react-big-calendar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { queryKeys } from "@/lib/utils/query";

type CalendarItem = {
  id: string;
  type: "booking" | "block";
  title: string;
  startDate: string;
  endDate: string;
  bookingId?: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: true;
  resource: CalendarItem;
};

const locales: Record<string, Locale> = {};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: (date: Date) => startOfWeek(date, { weekStartsOn: 1 }),
  getDay,
  locales,
});

export function AdminCalendarClient() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));
  const [unitId, setUnitId] = useState("");
  const [view, setView] = useState<View>("month");

  const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");

  const queryKey = useMemo(
    () => queryKeys.adminCalendar({ startDate, endDate, unitId }),
    [startDate, endDate, unitId],
  );

  const calendarQuery = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ startDate, endDate });
      if (unitId) params.set("campsiteUnitId", unitId);
      const response = await fetch(`/api/admin/calendar?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error?.message || "Failed to load calendar");
      return payload.data.items as CalendarItem[];
    },
  });

  const unitsQuery = useQuery({
    queryKey: queryKeys.adminUnits(),
    queryFn: async () => {
      const response = await fetch("/api/admin/units");
      const payload = await response.json();
      if (!response.ok)
        throw new Error(payload.error?.message || "Failed to load units");
      return payload.data as Array<{ id: string; name: string }>;
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.innerWidth < 768) {
      setView("agenda");
    }
  }, []);

  const events = useMemo<CalendarEvent[]>(
    () =>
      (calendarQuery.data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        start: new Date(`${item.startDate}T00:00:00`),
        end: new Date(`${item.endDate}T00:00:00`),
        allDay: true,
        resource: item,
      })),
    [calendarQuery.data],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-wrap gap-3 p-4 text-sm text-stone-600">
          <div className="flex items-center gap-2">
            <Badge variant="booking">Booking</Badge>
            Confirmed stay
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="block">Block</Badge>
            Manual unavailable range
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="grid gap-3 p-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 lg:max-w-xs">
            <Button
              onClick={() => setCurrentMonth((value) => addMonths(value, -1))}
              variant="outline"
              size="sm"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-center text-sm font-medium text-stone-800">
              {format(currentMonth, "MMMM yyyy")}
            </div>
            <Button
              onClick={() => setCurrentMonth((value) => addMonths(value, 1))}
              variant="outline"
              size="sm"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-center">
            <Button
              type="button"
              variant={view === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("month")}
            >
              Month
            </Button>
            <Button
              type="button"
              variant={view === "agenda" ? "default" : "outline"}
              size="sm"
              onClick={() => setView("agenda")}
            >
              Agenda
            </Button>
          </div>
          <div className="lg:flex lg:justify-end">
            <Select
              value={unitId}
              onChange={(event) => setUnitId(event.target.value)}
              className="w-full sm:max-w-56"
            >
              <option value="">All campsites</option>
              {unitsQuery.data?.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="admin-calendar h-[620px] bg-white p-3 sm:h-[720px] sm:p-4">
          <Calendar
            localizer={localizer}
            date={currentMonth}
            events={events}
            view={view}
            views={["month", "agenda"]}
            toolbar={false}
            popup
            startAccessor="start"
            endAccessor="end"
            className="min-h-full"
            length={31}
            onNavigate={(date: Date) => setCurrentMonth(startOfMonth(date))}
            onView={(nextView) =>
              setView(nextView === "agenda" ? "agenda" : "month")
            }
            onSelectEvent={(event: CalendarEvent) => {
              const item = event.resource;
              router.push(
                item.type === "booking"
                  ? `/admin/bookings/${item.bookingId ?? item.id}`
                  : `/admin/blocks?blockId=${item.id}`,
              );
            }}
            eventPropGetter={((event: CalendarEvent) => ({
              className:
                event.resource.type === "booking"
                  ? "rbc-event-booking"
                  : "rbc-event-block",
            })) as EventPropGetter<CalendarEvent>}
            messages={{
              noEventsInRange: calendarQuery.isLoading
                ? "Loading calendar..."
                : "No bookings or blocks in this range.",
            }}
          />
        </div>
      </Card>
    </div>
  );
}
