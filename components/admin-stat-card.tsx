import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export function AdminStatCard({
  label,
  value,
  tone,
  detail,
  icon
}: {
  label: string;
  value: string | number;
  tone?: "pending" | "confirmed" | "rejected" | "cancelled" | "stone";
  detail?: string;
  icon?: ReactNode;
}) {
  return (
    <Card className="border-stone-200/80 bg-white/90">
      <CardContent className="flex items-start justify-between gap-3 p-4 sm:gap-4 sm:p-5">
        <div className="min-w-0 space-y-1.5 sm:space-y-2">
          <Badge variant={tone ?? "stone"}>{label}</Badge>
          <p className="text-2xl font-semibold tracking-tight text-stone-950 sm:text-3xl">{value}</p>
          {detail ? <p className="text-xs text-stone-500 sm:text-sm">{detail}</p> : null}
        </div>
        {icon ? <div className="rounded-2xl bg-stone-100 p-2.5 text-stone-700 sm:p-3">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}
