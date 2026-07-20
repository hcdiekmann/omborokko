"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  House,
  ShieldBan,
  Ticket,
} from "lucide-react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const items = [
  { href: "/admin", value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", value: "bookings", label: "Bookings", icon: Ticket },
  { href: "/admin/calendar", value: "calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/units", value: "units", label: "Units", icon: House },
  { href: "/admin/blocks", value: "blocks", label: "Blocks", icon: ShieldBan },
] as const;

function activeValue(pathname: string) {
  const active = items.find((item) => item.href !== "/admin" && pathname.startsWith(item.href));
  return active?.value ?? "dashboard";
}

export function AdminShellNav() {
  const pathname = usePathname();

  return (
    <Tabs value={activeValue(pathname)} className="min-w-0 overflow-x-auto">
      <TabsList className="h-9 w-max gap-0.5 bg-stone-100/80">
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <TabsTrigger key={item.href} value={item.value} asChild className="h-7 gap-1.5 px-2.5 text-xs sm:text-sm">
              <Link href={item.href}>
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            </TabsTrigger>
          );
        })}
      </TabsList>
    </Tabs>
  );
}
