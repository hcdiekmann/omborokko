"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import type { ColumnDef, HeaderGroup, Row, SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type DataTableProps<TData> = {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  emptyState: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  pageSize?: number;
  defaultSorting?: SortingState;
};

export function DataTable<TData>({
  columns,
  data,
  emptyState,
  toolbar,
  footer,
  pageSize = 10,
  defaultSorting = []
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>(defaultSorting);

  const table = useReactTable({
    columns,
    data,
    state: {
      sorting
    },
    onSortingChange: setSorting,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel()
  });

  return (
    <Card className="overflow-hidden">
      {toolbar ? <div className="border-b border-stone-200 bg-stone-50/70 px-4 py-3">{toolbar}</div> : null}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <HeaderRow key={headerGroup.id} headerGroup={headerGroup} />
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => <BodyRow key={row.id} row={row} />)
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center text-sm text-stone-500">
                  {emptyState}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col gap-3 border-t border-stone-200 bg-white px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-stone-500">
          Showing {table.getRowModel().rows.length ? table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 : 0}
          {" - "}
          {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + table.getRowModel().rows.length}
          {" of "}
          {table.getSortedRowModel().rows.length}
        </div>
        <div className="flex items-center gap-2">
          <PaginationButton
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.setPageIndex(0)}
            icon={<ChevronsLeft className="h-4 w-4" />}
            label="First page"
          />
          <PaginationButton
            disabled={!table.getCanPreviousPage()}
            onClick={() => table.previousPage()}
            icon={<ChevronLeft className="h-4 w-4" />}
            label="Previous page"
          />
          <span className="min-w-24 text-center text-sm text-stone-600">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
          </span>
          <PaginationButton
            disabled={!table.getCanNextPage()}
            onClick={() => table.nextPage()}
            icon={<ChevronRight className="h-4 w-4" />}
            label="Next page"
          />
          <PaginationButton
            disabled={!table.getCanNextPage()}
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            icon={<ChevronsRight className="h-4 w-4" />}
            label="Last page"
          />
        </div>
      </div>
      {footer ? <div className="border-t border-stone-200 bg-stone-50/70 px-4 py-3">{footer}</div> : null}
    </Card>
  );
}

function HeaderRow<TData>({
  headerGroup
}: {
  headerGroup: HeaderGroup<TData>;
}) {
  return (
    <TableRow className="hover:bg-transparent">
      {headerGroup.headers.map((header) => (
        <TableHead key={header.id}>
          {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
        </TableHead>
      ))}
    </TableRow>
  );
}

function BodyRow<TData>({ row }: { row: Row<TData> }) {
  return (
    <TableRow data-state={row.getIsSelected() && "selected"}>
      {row.getVisibleCells().map((cell) => (
        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
      ))}
    </TableRow>
  );
}

function PaginationButton({
  disabled,
  onClick,
  icon,
  label
}: {
  disabled: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={onClick} aria-label={label}>
      {icon}
    </Button>
  );
}
