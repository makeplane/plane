/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 *
 * Recursive timesheet row. Renders one work-item row and, when expanded, lazily
 * fetches and nests the current user's logged sub-items for the week.
 */

import { useEffect, useState } from "react";
import type { FC } from "react";
import { observer } from "mobx-react";
import { useTranslation } from "@plane/i18n";
import { ChevronRightIcon } from "@plane/propel/icons";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import type { ITimesheetRow } from "@plane/types";
import { cn } from "@plane/utils";
import type { TPeekIssue } from "@/store/issue/issue-details/root.store";
import { formatMinutes } from "../utils/time-format";

/** Lazily loads one parent's logged children for the week. */
export type FetchSubIssues = (
  workspaceSlug: string,
  projectId: string,
  parentId: string,
  weekStart?: string
) => Promise<ITimesheetRow[]>;

interface TimesheetRowProps {
  row: ITimesheetRow;
  nestingLevel: number;
  weekDates: string[];
  weekStart: string;
  showWorkspaceColumn?: boolean;
  workspaceSlug: string;
  setPeekIssue: (peekIssue: TPeekIssue) => void;
  fetchSubIssues: FetchSubIssues;
  /** Issue ids on the path from the root to this row — terminates parent/child cycles. */
  ancestorIds: Set<string>;
}

export const TimesheetRow: FC<TimesheetRowProps> = observer((props) => {
  const { row, nestingLevel, weekDates, weekStart, showWorkspaceColumn, workspaceSlug, setPeekIssue, fetchSubIssues } =
    props;
  const { ancestorIds } = props;
  const { t } = useTranslation();

  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<ITimesheetRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Rows are reused across week navigation (keyed by issue_id), so reset expansion
  // and cached children when the week changes — otherwise stale numbers would show.
  useEffect(() => {
    setChildren(null);
    setIsExpanded(false);
  }, [weekStart]);

  const rowWorkspaceSlug = row.workspace_slug ?? workspaceSlug;
  const isCycle = ancestorIds.has(row.issue_id);
  // sub_issues_count = current user's logged children for the week, so the chevron
  // only shows when expanding will reveal the user's own logged sub-items.
  const showChevron = (row.sub_issues_count ?? 0) > 0 && !isCycle;

  const handleToggleExpand = async () => {
    if (isLoading) return; // guard double-click / re-entry while a fetch is in flight
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }
    if (children) {
      setIsExpanded(true);
      return;
    }
    setIsLoading(true);
    try {
      const rows = await fetchSubIssues(rowWorkspaceSlug, row.project_id, row.issue_id, weekStart);
      setChildren(rows);
      setIsExpanded(true);
    } catch {
      // Leave the chevron clickable so the user can retry (no stuck spinner).
      setToast({ type: TOAST_TYPE.ERROR, title: t("timesheet_load_error") });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <tr className="border-b border-subtle hover:bg-layer-1-hover transition-colors">
        {showWorkspaceColumn && (
          <td className="px-3 py-2 text-center">
            <span className="text-12 text-secondary truncate max-w-[120px]">{row.workspace_name ?? "-"}</span>
          </td>
        )}
        {/* Issue cell — indent + chevron + peek trigger */}
        <td className="px-3 py-2 min-w-0">
          <div className="flex items-center gap-1">
            {nestingLevel > 0 && <div className="shrink-0" style={{ width: nestingLevel * 12 }} />}
            <div className="grid place-items-center size-4 shrink-0">
              {showChevron && (
                <button
                  type="button"
                  aria-label={t("timesheet_show_sub_items")}
                  aria-expanded={isExpanded}
                  className="grid place-items-center size-4 rounded-xs text-placeholder hover:text-tertiary disabled:opacity-50"
                  onClick={() => void handleToggleExpand()}
                  disabled={isLoading}
                >
                  <ChevronRightIcon className={cn("size-4", { "rotate-90": isExpanded })} strokeWidth={2.5} />
                </button>
              )}
            </div>
            <button
              className="group flex w-full min-w-0 max-w-full items-center gap-2 text-left"
              onClick={() =>
                setPeekIssue({
                  workspaceSlug: rowWorkspaceSlug,
                  projectId: row.project_id,
                  issueId: row.issue_id,
                  nestingLevel,
                })
              }
            >
              <span className="shrink-0 text-12 font-mono text-tertiary">{row.issue_identifier}</span>
              <span
                className="min-w-0 flex-1 truncate text-13 text-primary transition-colors group-hover:text-accent-primary"
                title={row.issue_name}
              >
                {row.issue_name}
              </span>
            </button>
          </div>
        </td>
        {/* Day cells */}
        {weekDates.map((date) => {
          const mins = row.days[date] ?? 0;
          return (
            <td key={date} className="px-3 py-2 text-center">
              <span className={cn("text-13 font-medium", mins > 0 ? "text-primary" : "text-tertiary")}>
                {mins > 0 ? formatMinutes(mins) : "-"}
              </span>
            </td>
          );
        })}
        {/* Total cell */}
        <td className="px-3 py-2 text-center">
          <span className={cn("text-13 font-medium", row.total_minutes > 0 ? "text-primary" : "text-tertiary")}>
            {formatMinutes(row.total_minutes)}
          </span>
        </td>
      </tr>
      {isExpanded &&
        children?.map((child) => (
          <TimesheetRow
            key={child.issue_id}
            row={child}
            nestingLevel={nestingLevel + 1}
            weekDates={weekDates}
            weekStart={weekStart}
            showWorkspaceColumn={showWorkspaceColumn}
            workspaceSlug={workspaceSlug}
            setPeekIssue={setPeekIssue}
            fetchSubIssues={fetchSubIssues}
            ancestorIds={new Set([...ancestorIds, row.issue_id])}
          />
        ))}
    </>
  );
});
