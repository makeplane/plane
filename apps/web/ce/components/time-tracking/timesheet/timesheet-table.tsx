/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Read-only timesheet grid. Hand-rolled table so rows can recursively expand the
 * current user's logged sub-items (TimesheetRow). Header and body share one column
 * order — [Workspace] | Issue | Mon..Sun | Total — to keep widths aligned.
 * The Workspace column is shown only in cross-workspace mode.
 */

import { useCallback, useMemo } from "react";
import type { FC } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import type { ITimesheetRow } from "@plane/types";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useWorklog } from "@/hooks/store/use-worklog";
import { formatMinutes, getWeekDates } from "../utils/time-format";
import type { FetchSubIssues } from "./timesheet-row";
import { TimesheetRow } from "./timesheet-row";

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

const HEADER_LABEL = "text-12 font-medium text-tertiary uppercase tracking-wide";

export const TimesheetTable: FC<TimesheetTableProps> = observer(
  ({ weekStart, rows, dailyTotals, grandTotal, workspaceSlug, showWorkspaceColumn }) => {
    const { t } = useTranslation();
    const { setPeekIssue } = useIssueDetail();
    const worklog = useWorklog();
    const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);

    // Wrap the store action so it is invoked (not passed unbound) when handed to rows.
    const fetchSubIssues: FetchSubIssues = useCallback(
      (ws, projectId, parentId, ws_start) => worklog.fetchTimesheetSubIssues(ws, projectId, parentId, ws_start),
      [worklog]
    );

    return (
      <div className="overflow-x-auto rounded-lg border border-subtle">
        <table className="w-full text-13">
          <thead>
            <tr className="border-b border-subtle bg-layer-1-hover">
              {showWorkspaceColumn && (
                <th className="px-3 py-2.5 w-20 text-center">
                  <span className={HEADER_LABEL}>Workspace</span>
                </th>
              )}
              <th className="px-3 py-2.5 min-w-[260px] text-left">
                <span className={HEADER_LABEL}>Issue</span>
              </th>
              {weekDates.map((date, idx) => (
                <th key={date} className="px-3 py-2.5 w-20 text-center">
                  <div className="flex flex-col items-center gap-0.5">
                    <span className={HEADER_LABEL}>{DAY_NAMES[idx]}</span>
                    <span className="text-12 text-secondary">{new Date(date).getDate()}</span>
                  </div>
                </th>
              ))}
              <th className="px-3 py-2.5 w-20 text-center">
                <span className={HEADER_LABEL}>{t("timesheet_total")}</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <TimesheetRow
                key={row.issue_id}
                row={row}
                nestingLevel={0}
                weekDates={weekDates}
                weekStart={weekStart}
                showWorkspaceColumn={showWorkspaceColumn}
                workspaceSlug={workspaceSlug}
                setPeekIssue={setPeekIssue}
                fetchSubIssues={fetchSubIssues}
                ancestorIds={new Set()}
              />
            ))}
          </tbody>

          {/* Footer with daily totals — top-level rows only (children are additive) */}
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
  }
);
