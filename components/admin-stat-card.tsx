import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

export function AdminStatCard({
  label,
  value,
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
    <Card className="border-stone-200 bg-white shadow-sm">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">{value}</p>
          {detail ? <p className="mt-1 text-xs text-stone-500">{detail}</p> : null}
        </div>
        {icon ? <div className="rounded-md bg-stone-100 p-2 text-stone-700">{icon}</div> : null}
      </CardContent>
    </Card>
  );
}
