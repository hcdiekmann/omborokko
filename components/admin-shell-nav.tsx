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

import { cn } from "@/lib/utils/cn";

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/bookings", label: "Bookings", icon: Ticket },
  { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/admin/units", label: "Units", icon: House },
  { href: "/admin/blocks", label: "Blocks", icon: ShieldBan },
] as const;

export function AdminShellNav() {
  const pathname = usePathname();

  return (
    <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:block lg:space-y-1.5">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-w-0 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium transition-colors lg:px-3 lg:py-2.5",
              isActive
                ? "bg-stone-950 text-white shadow-sm"
                : "text-stone-700 hover:bg-stone-100 hover:text-stone-950",
            )}
          >
            <Icon className="h-4 w-4 flex-none" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
