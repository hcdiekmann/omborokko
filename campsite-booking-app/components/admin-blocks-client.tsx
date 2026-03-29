"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatDate } from "@/lib/utils/format";
import { queryKeys } from "@/lib/utils/query";

type BlockRow = {
  id: string;
  campsite_unit_id: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  campsite_units?: { id: string; name: string; slug: string } | null;
};

type BlockFormValues = {
  campsiteUnitId: string;
  startDate: string;
  endDate: string;
  reason: string;
};

const emptyValues: BlockFormValues = {
  campsiteUnitId: "",
  startDate: "",
  endDate: "",
  reason: ""
};

export function AdminBlocksClient() {
  const searchParams = useSearchParams();
  const [unitFilter, setUnitFilter] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(searchParams.get("blockId"));
  const [feedback, setFeedback] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const form = useForm<BlockFormValues>({ defaultValues: emptyValues });
  const blocksKey = useMemo(() => queryKeys.adminBlocks({ unitFilter }), [unitFilter]);

  const blocksQuery = useQuery({
    queryKey: blocksKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (unitFilter) params.set("campsiteUnitId", unitFilter);
      const response = await fetch(`/api/admin/blocks?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Failed to load blocks");
      return payload.data as BlockRow[];
    }
  });

  const unitsQuery = useQuery({
    queryKey: queryKeys.adminUnits(),
    queryFn: async () => {
      const response = await fetch("/api/admin/units");
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Failed to load units");
      return payload.data as Array<{ id: string; name: string }>;
    }
  });

  useEffect(() => {
    if (!selectedBlockId) {
      form.reset(emptyValues);
      return;
    }

    const selected = blocksQuery.data?.find((block) => block.id === selectedBlockId);
    if (!selected) return;

    form.reset({
      campsiteUnitId: selected.campsite_unit_id,
      startDate: selected.start_date,
      endDate: selected.end_date,
      reason: selected.reason || ""
    });
  }, [selectedBlockId, blocksQuery.data, form]);

  const saveMutation = useMutation({
    mutationFn: async (values: BlockFormValues) => {
      const response = await fetch(selectedBlockId ? `/api/admin/blocks/${selectedBlockId}` : "/api/admin/blocks", {
        method: selectedBlockId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Failed to save block");
      return payload.data;
    },
    onSuccess: () => {
      setFeedback(selectedBlockId ? "Block updated." : "Block created.");
      setSelectedBlockId(null);
      form.reset(emptyValues);
      queryClient.invalidateQueries({ queryKey: ["admin-blocks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-calendar"] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/blocks/${id}`, { method: "DELETE" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.message || "Failed to delete block");
      return payload.data;
    },
    onSuccess: (_, id) => {
      if (selectedBlockId === id) {
        setSelectedBlockId(null);
        form.reset(emptyValues);
      }
      setFeedback("Block deleted.");
      queryClient.invalidateQueries({ queryKey: ["admin-blocks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-calendar"] });
    }
  });

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
      <Card>
        <CardHeader className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-stone-950">Current date blocks</h2>
              <p className="mt-1 text-sm text-stone-600">Manual blocks also remove availability from the calendar.</p>
            </div>
            <Select value={unitFilter} onChange={(event) => setUnitFilter(event.target.value)} className="max-w-56">
              <option value="">All campsites</option>
              {unitsQuery.data?.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {blocksQuery.data?.length ? (
            blocksQuery.data.map((block) => (
              <div
                key={block.id}
                id={`block-${block.id}`}
                className={`rounded-2xl border p-4 ${selectedBlockId === block.id ? "border-stone-900 bg-stone-50" : "border-stone-200"}`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Badge variant="block">Block</Badge>
                    <p className="font-medium text-stone-900">{block.campsite_units?.name ?? "Unknown unit"}</p>
                    <p className="text-sm text-stone-600">
                      {formatDate(block.start_date)} to {formatDate(block.end_date)}
                    </p>
                    <p className="text-sm text-stone-700">{block.reason || "No reason provided."}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedBlockId(block.id)}>
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(block.id)} disabled={deleteMutation.isPending}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-stone-500">{blocksQuery.isLoading ? "Loading blocks..." : "No manual blocks found."}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-stone-950">{selectedBlockId ? "Edit block" : "Create block"}</h2>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Campsite unit</label>
              <Select {...form.register("campsiteUnitId")}>
                <option value="">Select campsite</option>
                {unitsQuery.data?.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">Start date</label>
                <Input type="date" {...form.register("startDate")} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-stone-700">End date</label>
                <Input type="date" {...form.register("endDate")} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">Reason</label>
              <Textarea {...form.register("reason")} className="min-h-24" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? "Saving..." : selectedBlockId ? "Update block" : "Create block"}
              </Button>
              {selectedBlockId ? (
                <Button type="button" variant="outline" onClick={() => { setSelectedBlockId(null); form.reset(emptyValues); }}>
                  Cancel edit
                </Button>
              ) : null}
            </div>
            {feedback ? <p className="text-sm text-green-700">{feedback}</p> : null}
            {saveMutation.isError ? <p className="text-sm text-red-600">{saveMutation.error.message}</p> : null}
            {deleteMutation.isError ? <p className="text-sm text-red-600">{deleteMutation.error.message}</p> : null}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
