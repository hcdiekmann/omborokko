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
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="space-y-2">
          <Badge variant={tone ?? "stone"}>{label}</Badge>
          <p className="text-3xl font-semibold tracking-tight text-stone-950">{value}</p>
          {detail ? <p className="text-sm text-stone-500">{detail}</p> : null}
        </div>
        {icon ? <div className="rounded-2xl bg-stone-100 p-3 text-stone-700">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}
