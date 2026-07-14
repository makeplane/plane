/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import Link from "next/link";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Avatar, Spinner } from "@plane/ui";
import { cn, generateWorkItemLink } from "@plane/utils";
// local imports
import { formatDuration } from "./transform";
import type { TTimesheetData } from "./transform";

type Props = {
  data: TTimesheetData;
  isLoading: boolean;
  workspaceSlug: string;
};

export const TimesheetGrid = (props: Props) => {
  const { data, isLoading, workspaceSlug } = props;
  const { t } = useTranslation();
  const [expandedUserIds, setExpandedUserIds] = useState<Set<string>>(new Set());

  const toggleUser = (userId: string) => {
    setExpandedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (data.users.length === 0) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center gap-1 text-center">
        <p className="text-15 font-medium text-primary">{t("time_reports.empty_state.title")}</p>
        <p className="text-13 text-tertiary">{t("time_reports.empty_state.description")}</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto rounded-md border border-subtle">
      <table className="w-full border-collapse text-13">
        <thead>
          <tr className="border-b border-subtle bg-layer-1">
            <th className="sticky left-0 z-10 min-w-[260px] bg-layer-1 px-3 py-2 text-left font-medium text-tertiary">
              {t("time_reports.grid.member")}
            </th>
            {data.days.map((day) => (
              <th key={day.date} className="min-w-[64px] px-2 py-2 text-center font-medium text-tertiary">
                {day.label}
              </th>
            ))}
            <th className="min-w-[80px] px-3 py-2 text-center font-medium text-tertiary">
              {t("time_reports.grid.total")}
            </th>
          </tr>
        </thead>
        <tbody>
          {data.users.map((user) => {
            const isExpanded = expandedUserIds.has(user.userId);
            return (
              <Fragment key={user.userId}>
                <tr className="border-b border-subtle hover:bg-layer-transparent-hover">
                  <td className="bg-layer-0 sticky left-0 z-10 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => toggleUser(user.userId)}
                      className="flex w-full items-center gap-2 text-left"
                    >
                      {isExpanded ? (
                        <ChevronDown className="size-3.5 flex-shrink-0 text-tertiary" />
                      ) : (
                        <ChevronRight className="size-3.5 flex-shrink-0 text-tertiary" />
                      )}
                      <Avatar name={user.displayName} src={user.avatarUrl ?? undefined} size={20} />
                      <span className="truncate font-medium">{user.displayName}</span>
                    </button>
                  </td>
                  {data.days.map((day) => (
                    <td key={day.date} className="px-2 py-2 text-center text-secondary tabular-nums">
                      {formatDuration(user.perDay[day.date] ?? 0)}
                    </td>
                  ))}
                  <td className="px-3 py-2 text-center font-medium tabular-nums">{formatDuration(user.total)}</td>
                </tr>
                {isExpanded &&
                  user.issues.map((issue) => (
                    <tr key={`${user.userId}-${issue.issueId}`} className="bg-layer-0/50 border-b border-subtle">
                      <td className="bg-layer-0 sticky left-0 z-10 py-1.5 pr-3 pl-9">
                        <Link
                          href={generateWorkItemLink({
                            workspaceSlug,
                            projectId: issue.projectId,
                            issueId: issue.issueId,
                            projectIdentifier: issue.projectIdentifier,
                            sequenceId: issue.sequenceId,
                          })}
                          className="truncate text-13 text-secondary hover:text-primary hover:underline"
                        >
                          {issue.projectIdentifier ? `${issue.projectIdentifier}-${issue.sequenceId}` : ""} {issue.name}
                        </Link>
                      </td>
                      {data.days.map((day) => (
                        <td key={day.date} className="px-2 py-1.5 text-center text-tertiary tabular-nums">
                          {formatDuration(issue.perDay[day.date] ?? 0)}
                        </td>
                      ))}
                      <td className="px-3 py-1.5 text-center text-tertiary tabular-nums">
                        {formatDuration(issue.total)}
                      </td>
                    </tr>
                  ))}
              </Fragment>
            );
          })}
        </tbody>
        <tfoot>
          <tr className={cn("border-t border-subtle bg-layer-1 font-medium")}>
            <td className="sticky left-0 z-10 bg-layer-1 px-3 py-2">{t("time_reports.grid.total")}</td>
            {data.days.map((day) => (
              <td key={day.date} className="px-2 py-2 text-center tabular-nums">
                {formatDuration(data.columnTotals[day.date] ?? 0)}
              </td>
            ))}
            <td className="px-3 py-2 text-center tabular-nums">{formatDuration(data.grandTotal)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
};
