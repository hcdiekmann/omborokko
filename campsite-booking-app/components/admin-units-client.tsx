"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { siteContent } from "@/lib/content/site-content";
import { formatCurrency } from "@/lib/utils/format";
import { queryKeys } from "@/lib/utils/query";

type UnitRow = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  max_guests: number;
  base_price_per_night: number;
  child_price_per_night: number;
  active: boolean;
  type: string;
  cover_image_url: string | null;
};

type UnitFormValues = {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  type: string;
  maxGuests: number;
  basePricePerNight: number;
  childPricePerNight: number;
  active: string;
  coverImageUrl: string;
};

export function AdminUnitsClient() {
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const form = useForm<UnitFormValues>();

  const unitsQuery = useQuery({
    queryKey: queryKeys.adminUnits(),
    queryFn: async () => {
      const response = await fetch("/api/admin/units");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Failed to load units");
      return payload.data as UnitRow[];
    }
  });

  useEffect(() => {
    const unit = unitsQuery.data?.find((entry) => entry.id === selectedUnitId) ?? unitsQuery.data?.[0];
    if (!unit) return;
    if (!selectedUnitId) setSelectedUnitId(unit.id);
    form.reset({
      slug: unit.slug,
      name: unit.name,
      shortDescription: unit.short_description || "",
      description: unit.description || "",
      type: unit.type,
      maxGuests: unit.max_guests,
      basePricePerNight: unit.base_price_per_night,
      childPricePerNight: unit.child_price_per_night,
      active: unit.active ? "true" : "false",
      coverImageUrl: unit.cover_image_url || siteContent.images[0]
    });
  }, [selectedUnitId, unitsQuery.data, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: UnitFormValues) => {
      if (!selectedUnitId) {
        throw new Error("Select a unit first.");
      }

      const response = await fetch(`/api/admin/units/${selectedUnitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: values.slug,
          name: values.name,
          shortDescription: values.shortDescription,
          description: values.description,
          type: values.type,
          maxGuests: values.maxGuests,
          basePricePerNight: values.basePricePerNight,
          childPricePerNight: values.childPricePerNight,
          active: values.active === "true",
          coverImageUrl: values.coverImageUrl
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Failed to update unit");
      return payload.data;
    },
    onSuccess: () => {
      setFeedback("Unit updated.");
      queryClient.invalidateQueries({ queryKey: queryKeys.adminUnits() });
      queryClient.invalidateQueries({ queryKey: ["admin-calendar"] });
    }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-stone-950">Campsite units</h2>
        </CardHeader>
        <CardContent className="space-y-3">
          {unitsQuery.data?.map((unit) => (
            <button
              key={unit.id}
              type="button"
              onClick={() => setSelectedUnitId(unit.id)}
              className={`w-full rounded-2xl border p-4 text-left ${selectedUnitId === unit.id ? "border-stone-900 bg-stone-50" : "border-stone-200"}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-stone-900">{unit.name}</p>
                  <p className="text-sm text-stone-600">{unit.slug}</p>
                </div>
                <Badge variant={unit.active ? "confirmed" : "cancelled"}>{unit.active ? "Active" : "Inactive"}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-700">
                <span className="rounded-full bg-stone-100 px-3 py-1">Max {unit.max_guests}</span>
                <span className="rounded-full bg-stone-100 px-3 py-1">Adult {formatCurrency(unit.base_price_per_night)}</span>
                <span className="rounded-full bg-stone-100 px-3 py-1">Child {formatCurrency(unit.child_price_per_night)}</span>
              </div>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-stone-950">Edit unit</h2>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">Name</label>
                <Input {...form.register("name")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">Slug</label>
                <Input {...form.register("slug")} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Short description</label>
              <Textarea {...form.register("shortDescription")} className="min-h-24" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Description</label>
              <Textarea {...form.register("description")} className="min-h-40" />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">Type</label>
                <Input {...form.register("type")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">Max guests</label>
                <Input type="number" {...form.register("maxGuests", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">Adult price per night</label>
                <Input type="number" {...form.register("basePricePerNight", { valueAsNumber: true })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">Child price per night</label>
                <Input type="number" {...form.register("childPricePerNight", { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">Active</label>
                <Select {...form.register("active")}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">Cover image</label>
                <Select {...form.register("coverImageUrl")}>
                  {siteContent.images.map((image) => (
                    <option key={image} value={image}>
                      {image}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save unit"}
            </Button>
            {feedback ? <p className="text-sm text-green-700">{feedback}</p> : null}
            {saveMutation.isError ? <p className="text-sm text-red-600">{saveMutation.error.message}</p> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
