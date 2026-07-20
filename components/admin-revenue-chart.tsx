"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

type RevenuePoint = {
  month: string;
  revenue: number;
  bookings: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-NA", {
    style: "currency",
    currency: "NAD",
    maximumFractionDigits: 0
  }).format(value);
}

export function AdminRevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <Card className="border-stone-200 bg-white shadow-sm">
      <CardHeader className="px-4 py-4 sm:px-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-stone-950">Monthly revenue</h2>
            <p className="mt-1 text-sm text-stone-500">Confirmed stays by check-in month</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-2 pb-4 sm:px-4">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: 8, right: 12, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#e7e5e4" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                fontSize={12}
                stroke="#78716c"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tickMargin={10}
                width={72}
                fontSize={12}
                stroke="#78716c"
                tickFormatter={(value) => formatCurrency(Number(value)).replace("NAD", "N$")}
              />
              <Tooltip
                cursor={{ fill: "#f5f5f4" }}
                formatter={(value, name, props) => [formatCurrency(Number(value)), `${props.payload.bookings} booking${props.payload.bookings === 1 ? "" : "s"}`]}
                labelClassName="font-medium text-stone-950"
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e7e5e4",
                  boxShadow: "0 10px 25px rgb(0 0 0 / 0.08)",
                  fontSize: 12
                }}
              />
              <Bar dataKey="revenue" fill="#b45309" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
