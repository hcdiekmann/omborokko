"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
  subDays,
} from "date-fns";

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

export function AdminCalendarClient() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [unitId, setUnitId] = useState("");

  const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
  const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weeks = Array.from({ length: Math.ceil(days.length / 7) }, (_, index) =>
    days.slice(index * 7, index * 7 + 7),
  );

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

  function itemsForDay(day: Date) {
    return (
      calendarQuery.data?.filter((item) =>
        isWithinInterval(day, {
          start: new Date(`${item.startDate}T00:00:00`),
          end: new Date(
            `${subDays(new Date(`${item.endDate}T00:00:00`), 1)
              .toISOString()
              .slice(0, 10)}T00:00:00`,
          ),
        }),
      ) ?? []
    );
  }

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
        <CardContent className="flex flex-wrap items-center gap-2 p-4 sm:gap-3">
          <Button
            onClick={() => setCurrentMonth((value) => addMonths(value, -1))}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          <div className="min-w-32 text-sm font-medium text-stone-800 sm:min-w-40">
            {format(currentMonth, "MMMM yyyy")}
          </div>
          <Button
            onClick={() => setCurrentMonth((value) => addMonths(value, 1))}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
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
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <div className="grid grid-cols-7 border-b border-stone-200 bg-stone-50 text-xs font-medium uppercase tracking-wide text-stone-500">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
            <div key={day} className="px-3 py-3">
              {day}
            </div>
          ))}
        </div>
        <div className="divide-y divide-stone-200">
          {weeks.map((week, weekIndex) => (
            <div
              key={weekIndex}
              className="grid grid-cols-1 md:grid-cols-7 md:divide-x md:divide-stone-200"
            >
              {week.map((day) => {
                const dayItems = itemsForDay(day);
                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-40 p-3 ${isSameMonth(day, currentMonth) ? "bg-white" : "bg-stone-50/70"}`}
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${isSameMonth(day, currentMonth) ? "text-stone-900" : "text-stone-400"}`}
                      >
                        {format(day, "d")}
                      </span>
                      {dayItems.length ? (
                        <span className="text-xs text-stone-500">
                          {dayItems.length} item(s)
                        </span>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      {dayItems.map((item) => (
                        <Link
                          key={`${item.type}-${item.id}-${day.toISOString()}`}
                          href={
                            item.type === "booking"
                              ? `/admin/bookings/${item.bookingId ?? item.id}`
                              : `/admin/blocks?blockId=${item.id}`
                          }
                          className={`block rounded-2xl px-2.5 py-2 text-xs leading-5 ${
                            item.type === "booking"
                              ? "bg-blue-50 text-blue-700 hover:bg-blue-100"
                              : "bg-amber-50 text-amber-700 hover:bg-amber-100"
                          }`}
                        >
                          <div className="mb-1">
                            <Badge
                              variant={
                                item.type === "booking" ? "booking" : "block"
                              }
                            >
                              {item.type}
                            </Badge>
                          </div>
                          <p className="font-medium">{item.title}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
