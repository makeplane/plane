/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  Table as TanstackTable,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { useTranslation } from "@plane/i18n";
import { EmptyStateCompact } from "@plane/blocks/empty-state";
import { SearchOutline } from "@makeplane/propel/icons";
// plane package imports
import { Icon } from "@makeplane/propel/components/icon";
import { Input, InputGroup } from "@makeplane/propel/components/input";
import { Table, TableBody, TableHeader, TableRow } from "@makeplane/propel/components/table";
import { TableCell, TableHead } from "@makeplane/propel/elements/table";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder: string;
  actions?: (table: TanstackTable<TData>) => React.ReactNode;
}

export function DataTable<TData, TValue>({ columns, data, searchPlaceholder, actions }: DataTableProps<TData, TValue>) {
  const [rowSelection, _setRowSelection] = React.useState({});
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [sorting, _setSorting] = React.useState<SortingState>([]);
  const { t } = useTranslation();

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

  // the search filters the first column
  const searchColumnId = table.getHeaderGroups()?.[0]?.headers?.[0]?.id;
  const searchColumn = searchColumnId ? table.getColumn(searchColumnId) : undefined;
  const searchValue = (searchColumn?.getFilterValue() as string | undefined) ?? "";

  return (
    <div className="space-y-4">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="max-w-xs flex-1">
            <InputGroup size="lg">
              <Icon icon={SearchOutline} tint="tertiary" />
              <Input
                size="lg"
                aria-label={t("search")}
                placeholder={t("search")}
                value={searchValue}
                onChange={(e) => searchColumn?.setFilterValue(e.target.value)}
              />
            </InputGroup>
          </div>
          {searchColumnId && (
            <span className="truncate text-body-xs-regular text-placeholder">{searchPlaceholder}</span>
          )}
        </div>
        {actions && <div className="shrink-0">{actions(table)}</div>}
      </div>

      {/* a bounded flex column: the table frame shrinks to it, so the table's own viewport scrolls
          under its sticky header */}
      <div className="flex max-h-150 flex-col">
        <Table variant="table">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    variant="table"
                    pinned="none"
                    render={<th className="whitespace-nowrap" />}
                  >
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
                    <TableCell key={cell.id} variant="table" pinned="none" padding="cell">
                      {flexRender(cell.column.columnDef.cell, cell.getContext()) as any}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} variant="table" pinned="none" padding="trigger">
                  {searchValue.trim() !== "" ? (
                    <EmptyStateCompact
                      assetKey="search-compact"
                      rootClassName="px-5 py-10 md:px-20 md:py-20"
                      title={t("common_empty_state.search.title")}
                      description={t("common_empty_state.search.description")}
                    />
                  ) : (
                    <EmptyStateCompact
                      assetKey="unknown"
                      assetClassName="size-20"
                      rootClassName="px-5 py-10 md:px-20 md:py-20"
                      title={t("workspace_empty_state.analytics_work_items.title")}
                    />
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
