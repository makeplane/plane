/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Analytics timesheet table — like My Timesheet but:
 *   - Shows ALL project users' combined logtime per cell
 *   - Clicking a cell with time opens a per-user breakdown popover
 *   - Issue names link to issue detail
 *   - Read-only (no editing)
 */

import { useMemo } from "react";
import type { FC } from "react";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { IAnalyticsTimesheetRow } from "@plane/types";
import { LogtimeBreakdownPopover } from "./logtime-breakdown-popover";
import { formatMinutes, getWeekDates } from "../utils/time-format";

interface AnalyticsTimesheetTableProps {
  weekStart: string;
  rows: IAnalyticsTimesheetRow[];
  dailyTotals: Record<string, number>;
  grandTotal: number;
  workspaceSlug: string;
  projectId: string;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const columnHelper = createColumnHelper<IAnalyticsTimesheetRow>();

export const AnalyticsTimesheetTable: FC<AnalyticsTimesheetTableProps> = ({
  weekStart,
  rows,
  dailyTotals,
  grandTotal,
  workspaceSlug,
}) => {
  const { t } = useTranslation();
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const columns = useMemo(
    () => [
      // Issue column — clickable link
      columnHelper.accessor("issue_identifier", {
        header: () => <span className="text-12 font-medium text-tertiary uppercase tracking-wide">Issue</span>,
        cell: (info) => {
          const row = info.row.original;
          return (
            <a
              href={`/${workspaceSlug}/projects/${row.project_id}/issues/${row.issue_id}`}
              className="flex items-center gap-2 min-w-[180px] group"
            >
              <span className="text-12 font-mono text-tertiary">{row.issue_identifier}</span>
              <span
                className="text-13 text-primary truncate max-w-[200px] group-hover:text-accent-primary transition-colors"
                title={row.issue_name}
              >
                {row.issue_name}
              </span>
            </a>
          );
        },
      }),
      // Day columns — total of all users, click to see per-user breakdown
      ...weekDates.map((date, idx) =>
        columnHelper.display({
          id: date,
          header: () => (
            <div className="flex flex-col items-center gap-0.5">
              <span className="text-12 font-medium text-tertiary uppercase tracking-wide">{DAY_NAMES[idx]}</span>
              <span className="text-12 text-secondary">{new Date(date).getDate()}</span>
            </div>
          ),
          cell: (info) => {
            const row = info.row.original;
            const dayTotal = row.days[date] ?? 0;
            return <LogtimeBreakdownPopover totalMinutes={dayTotal} byUser={row.by_user} date={date} />;
          },
        })
      ),
      // Total column
      columnHelper.accessor("total_minutes", {
        header: () => (
          <span className="text-12 font-medium text-tertiary uppercase tracking-wide">{t("timesheet_total")}</span>
        ),
        cell: (info) => (
          <span className={cn("text-13 font-medium", info.getValue() > 0 ? "text-primary" : "text-tertiary")}>
            {formatMinutes(info.getValue())}
          </span>
        ),
      }),
    ],
    [weekDates, workspaceSlug, t]
  );

  // eslint-disable-next-line react-hooks/incompatible-library -- TanStack Table returns non-memoizable functions, this is expected
  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-subtle">
      <table className="w-full text-13">
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
            <td className="px-3 py-2 text-12 font-medium text-tertiary uppercase tracking-wide">
              {t("timesheet_total")}
            </td>
            {weekDates.map((date) => (
              <td key={date} className="px-3 py-2 text-center text-13 font-medium text-primary">
                {formatMinutes(dailyTotals[date] ?? 0)}
              </td>
            ))}
            <td className="px-3 py-2 text-center text-13 font-bold text-primary">{formatMinutes(grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
