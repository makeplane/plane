"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  Table as TanstackTable,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Search, X } from "lucide-react";
// plane package imports
import { useTranslation } from "@plane/i18n";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@plane/propel/table";
import { cn } from "@plane/utils";
// plane web components
import { useResolvedAssetPath } from "@/hooks/use-resolved-asset-path";
import AnalyticsEmptyState from "../empty-state";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder: string;
  actions?: (table: TanstackTable<TData>) => React.ReactNode;
}

export function DataTable<TData, TValue>({ columns, data, searchPlaceholder, actions }: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const resolvedPath = useResolvedAssetPath({ basePath: "/empty-state/analytics/empty-table" });

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4">
      <div className="flex w-full items-center justify-between">
        <div className="relative flex max-w-[300px] items-center gap-4 ">
          {table.getHeaderGroups()?.[0]?.headers?.[0]?.id && (
            <div className="flex items-center gap-2 whitespace-nowrap text-sm text-custom-text-400">
              {searchPlaceholder}
            </div>
          )}
          {!isSearchOpen && (
            <button
              type="button"
              className="-mr-5 grid place-items-center rounded p-2 text-custom-text-400 hover:bg-custom-background-80"
              onClick={() => {
                setIsSearchOpen(true);
                inputRef.current?.focus();
              }}
            >
              <Search className="h-3.5 w-3.5" />
            </button>
          )}
          <div
            className={cn(
              "mr-auto flex w-0 items-center justify-start gap-1 overflow-hidden rounded-md border border-transparent bg-custom-background-100 text-custom-text-400 opacity-0 transition-[width] ease-linear",
              {
                "w-64 border-custom-border-200 px-2.5 py-1.5 opacity-100": isSearchOpen,
              }
            )}
          >
            <Search className="h-3.5 w-3.5" />
            <input
              ref={inputRef}
              className="w-full max-w-[234px] border-none bg-transparent text-sm text-custom-text-100 placeholder:text-custom-text-400 focus:outline-none"
              placeholder="Search"
              value={table.getColumn(table.getHeaderGroups()?.[0]?.headers?.[0]?.id)?.getFilterValue() as string}
              onChange={(e) => {
                const columnId = table.getHeaderGroups()?.[0]?.headers?.[0]?.id;
                if (columnId) table.getColumn(columnId)?.setFilterValue(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setIsSearchOpen(true);
                }
              }}
            />
            {isSearchOpen && (
              <button
                type="button"
                className="grid place-items-center"
                onClick={() => {
                  const columnId = table.getHeaderGroups()?.[0]?.headers?.[0]?.id;
                  if (columnId) {
                    table.getColumn(columnId)?.setFilterValue("");
                  }
                  setIsSearchOpen(false);
                }}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
        {actions && <div>{actions(table)}</div>}
      </div>

      <div className="rounded-md">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : (flexRender(header.column.columnDef.header, header.getContext()) as any)}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext()) as any}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0">
                  <div className="flex h-[350px] w-full items-center justify-center border border-custom-border-100 ">
                    <AnalyticsEmptyState
                      title={t("workspace_analytics.empty_state.customized_insights.title")}
                      description={t("workspace_analytics.empty_state.customized_insights.description")}
                      className="border-0"
                      assetPath={resolvedPath}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
