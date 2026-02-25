/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Renders the timesheet grid using @tanstack/react-table.
 * Columns: Issue | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Total
 */

import { useMemo } from "react";
import type { FC } from "react";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";

import type { ITimesheetRow } from "@plane/types";

import { TimesheetCell } from "./timesheet-cell";

interface TimesheetTableProps {
  weekStart: string;
  rows: ITimesheetRow[];
  dailyTotals: Record<string, number>;
  grandTotal: number;
  onCellSave: (issueId: string, date: string, minutes: number) => void;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Get array of 7 date ISO strings starting from weekStart (Monday). */
function getWeekDates(weekStart: string): string[] {
  const dates: string[] = [];
  const d = new Date(weekStart);
  for (let i = 0; i < 7; i++) {
    const nd = new Date(d);
    nd.setDate(d.getDate() + i);
    dates.push(nd.toISOString().split("T")[0]);
  }
  return dates;
}

function formatMinutes(m: number): string {
  if (m === 0) return "0m";
  const h = Math.floor(m / 60);
  const mins = m % 60;
  if (h === 0) return `${mins}m`;
  if (mins === 0) return `${h}h`;
  return `${h}h ${mins}m`;
}

const columnHelper = createColumnHelper<ITimesheetRow>();

export const TimesheetTable: FC<TimesheetTableProps> = ({ weekStart, rows, dailyTotals, grandTotal, onCellSave }) => {
  const { t } = useTranslation();
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const columns = useMemo(
    () => [
      // Issue name column
      columnHelper.accessor("issue_identifier", {
        header: () => <span className="text-[10px] font-bold text-tertiary uppercase tracking-wide">Issue</span>,
        cell: (info) => (
          <div className="flex items-center gap-2 min-w-[180px]">
            <span className="text-[11px] font-mono text-tertiary">{info.getValue()}</span>
            <span className="text-xs text-primary truncate max-w-[200px]" title={info.row.original.issue_name}>
              {info.row.original.issue_name}
            </span>
          </div>
        ),
      }),
      // Day columns
      ...weekDates.map((date, idx) =>
        columnHelper.display({
          id: date,
          header: () => (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-[10px] font-bold text-tertiary uppercase tracking-wide">{DAY_NAMES[idx]}</span>
              <span className="text-[10px] text-secondary">{new Date(date).getDate()}</span>
            </div>
          ),
          cell: (info) => (
            <TimesheetCell
              minutes={info.row.original.days[date] ?? 0}
              onSave={(mins) => onCellSave(info.row.original.issue_id, date, mins)}
            />
          ),
        })
      ),
      // Total column
      columnHelper.accessor("total_minutes", {
        header: () => (
          <span className="text-[10px] font-bold text-tertiary uppercase tracking-wide">{t("timesheet_total")}</span>
        ),
        cell: (info) => (
          <span className={cn("text-xs font-medium", info.getValue() > 0 ? "text-primary" : "text-tertiary")}>
            {formatMinutes(info.getValue())}
          </span>
        ),
      }),
    ],
    [weekDates, onCellSave, t]
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns non-memoizable functions, this is expected
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-subtle">
      <table className="w-full text-xs">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="border-b border-subtle bg-layer-1-hover">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={cn("px-3 py-2.5", header.id !== "issue_identifier" && "text-center w-20")}
                >
                  {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-subtle last:border-0 hover:bg-layer-1-hover transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className={cn("px-3 py-2", cell.column.id !== "issue_identifier" && "text-center")}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>

        {/* Footer with daily totals */}
        <tfoot>
          <tr className="bg-layer-1-hover border-t border-subtle">
            <td className="px-3 py-2 text-[10px] font-bold text-tertiary uppercase tracking-wide">
              {t("timesheet_total")}
            </td>
            {weekDates.map((date) => (
              <td key={date} className="px-3 py-2 text-center text-xs font-medium text-primary">
                {formatMinutes(dailyTotals[date] ?? 0)}
              </td>
            ))}
            <td className="px-3 py-2 text-center text-xs font-bold text-primary">{formatMinutes(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
