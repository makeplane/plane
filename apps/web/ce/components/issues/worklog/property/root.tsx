/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect, useMemo } from "react";
import { observer } from "mobx-react";
import { Timer } from "lucide-react";
import { formatMinutesToDisplay } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Avatar } from "@plane/propel/avatar";
import { Popover } from "@plane/propel/popover";
import { cn } from "@plane/utils";
import { useWorklog } from "@/hooks/store/use-worklog";

type TIssueWorklogProperty = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  disabled: boolean;
};

export const IssueWorklogProperty = observer(function IssueWorklogProperty(props: TIssueWorklogProperty) {
  const { workspaceSlug, projectId, issueId } = props;
  const { t } = useTranslation();
  const store = useWorklog();

  // fetch worklogs on mount
  useEffect(() => {
    if (workspaceSlug && projectId && issueId) {
      void store.fetchWorklogs(workspaceSlug, projectId, issueId);
    }
  }, [workspaceSlug, projectId, issueId, store]);

  const worklogs = store.getWorklogsForIssue(issueId);
  const totalMinutes = store.getTotalMinutesForIssue(issueId);
  const memberTotals = useMemo(() => {
    const totals = new Map<string, { userId: string; displayName: string; avatarUrl: string; totalMinutes: number }>();

    for (const worklog of worklogs) {
      const userId = worklog.logged_by_detail?.id ?? worklog.logged_by;
      const current = totals.get(userId);
      totals.set(userId, {
        userId,
        displayName: worklog.logged_by_detail?.display_name || t("worklog.unknown_member"),
        avatarUrl: worklog.logged_by_detail?.avatar_url || "",
        totalMinutes: (current?.totalMinutes ?? 0) + worklog.duration_minutes,
      });
    }

    return Array.from(totals.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
  }, [t, worklogs]);

  if (totalMinutes === 0) return null;

  return (
    <Popover>
      <Popover.Button
        className={cn(
          "flex items-center gap-1 rounded px-1 py-0.5 text-xs text-tertiary outline-none transition-colors",
          "hover:bg-layer-1 hover:text-primary focus-visible:ring-1 focus-visible:ring-accent-strong"
        )}
        title={t("worklog.total_logged")}
        aria-label={t("worklog.total_logged")}
      >
        <Timer className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="tabular-nums">{formatMinutesToDisplay(totalMinutes)}</span>
      </Popover.Button>
      <Popover.Panel
        side="bottom"
        align="end"
        positionerClassName="z-[9999]"
        className="z-[30] w-72 overflow-hidden rounded-md border border-subtle bg-surface-1 p-3 shadow-lg"
      >
        <div className="mb-2 flex items-center justify-between border-b border-subtle pb-2">
          <span className="text-11 font-medium uppercase tracking-wide text-tertiary">{t("worklog.total")}</span>
          <span className="text-13 font-semibold tabular-nums text-primary">
            {formatMinutesToDisplay(totalMinutes)}
          </span>
        </div>
        <p className="mb-1.5 px-1 text-11 font-medium uppercase tracking-wide text-tertiary">{t("worklog.member")}</p>
        {memberTotals.length === 0 ? (
          <p className="px-1 py-4 text-center text-11 text-tertiary">{t("worklog.no_entries")}</p>
        ) : (
          <div className="max-h-64 space-y-0.5 overflow-y-auto" aria-live="polite">
            {memberTotals.map((member) => (
              <div
                key={member.userId}
                className="flex w-full items-center justify-between gap-3 rounded px-1.5 py-1.5"
                aria-label={`${member.displayName}, ${formatMinutesToDisplay(member.totalMinutes)}`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <Avatar name={member.displayName} src={member.avatarUrl} size="sm" shape="circle" />
                  <span className="truncate text-11 text-primary">{member.displayName}</span>
                </div>
                <span className="flex-shrink-0 text-11 tabular-nums text-secondary">
                  {formatMinutesToDisplay(member.totalMinutes)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Popover.Panel>
    </Popover>
  );
});
