/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Read-only timesheet grid using @tanstack/react-table.
 * Columns: [Workspace] | Issue | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Total
 * The Workspace column is shown only when showWorkspaceColumn is true (cross-workspace mode).
 */

import { useMemo } from "react";
import type { FC } from "react";
import { createColumnHelper, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useTranslation } from "@plane/i18n";
import { cn } from "@plane/utils";
import type { ITimesheetRow } from "@plane/types";
import { formatMinutes, getWeekDates } from "../utils/time-format";

interface TimesheetTableProps {
  weekStart: string;
  rows: ITimesheetRow[];
  dailyTotals: Record<string, number>;
  grandTotal: number;
  workspaceSlug: string;
  projectId: string;
  /** Show a Workspace column — enabled in cross-workspace mode */
  showWorkspaceColumn?: boolean;
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const columnHelper = createColumnHelper<ITimesheetRow>();

export const TimesheetTable: FC<TimesheetTableProps> = ({
  weekStart,
  rows,
  dailyTotals,
  grandTotal,
  workspaceSlug,
  showWorkspaceColumn,
}) => {
  const { t } = useTranslation();
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

  const columns = useMemo(
    () => [
      // Workspace column — cross-workspace mode only
      ...(showWorkspaceColumn
        ? [
            columnHelper.accessor("workspace_name" as keyof ITimesheetRow, {
              header: () => (
                <span className="text-12 font-medium text-tertiary uppercase tracking-wide">Workspace</span>
              ),
              cell: (info) => (
                <span className="text-12 text-secondary truncate max-w-[120px]">
                  {(info.row.original as ITimesheetRow & { workspace_name?: string }).workspace_name ?? "-"}
                </span>
              ),
            }),
          ]
        : []),
      // Issue column — clickable link to issue detail
      columnHelper.accessor("issue_identifier", {
        header: () => <span className="text-12 font-medium text-tertiary uppercase tracking-wide">Issue</span>,
        cell: (info) => {
          const row = info.row.original;
          const ws = (row as ITimesheetRow & { workspace_slug?: string }).workspace_slug ?? workspaceSlug;
          const issueUrl = `/${ws}/projects/${row.project_id}/issues/${row.issue_id}`;
          return (
            <a href={issueUrl} className="flex items-center gap-2 min-w-[180px] group">
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
      // Day columns — read-only display
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
            const mins = info.row.original.days[date] ?? 0;
            return (
              <span className={cn("text-13 font-medium", mins > 0 ? "text-primary" : "text-tertiary")}>
                {mins > 0 ? formatMinutes(mins) : "-"}
              </span>
            );
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
    [weekDates, showWorkspaceColumn, workspaceSlug, t]
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
            {showWorkspaceColumn && <td className="px-3 py-2" />}
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
