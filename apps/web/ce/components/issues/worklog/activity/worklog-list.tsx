/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import { Square } from "lucide-react";
import { EActivityFilterType, EUserPermissions } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import type { TIssueActivityComment, TIssueWorkLog } from "@plane/types";
import { Avatar } from "@plane/ui";
import { cn } from "@plane/utils";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUserPermissions } from "@/hooks/store/user";
import { formatDuration, formatElapsed } from "../utils";
import { IssueActivityWorklog } from "./root";

type TIssueWorklogList = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

type TPersonSummary = {
  userId: string;
  name: string;
  avatarUrl: string;
  total: number;
  count: number;
  activeTimer: TIssueWorkLog | null;
};

export const IssueWorklogList = observer(function IssueWorklogList(props: TIssueWorklogList) {
  const { workspaceSlug, projectId, issueId } = props;
  const { t } = useTranslation();
  const { worklog } = useIssueDetail();
  const { getProjectRoleByWorkspaceSlugAndProjectId } = useUserPermissions();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [stoppingId, setStoppingId] = useState<string | null>(null);
  const [, setNow] = useState(Date.now());

  const isAdmin = getProjectRoleByWorkspaceSlugAndProjectId(workspaceSlug, projectId) === EUserPermissions.ADMIN;

  // running timers for this issue (any user) — for the overview's live indicator + admin stop
  useEffect(() => {
    if (workspaceSlug && projectId && issueId) worklog.fetchIssueActiveTimers(workspaceSlug, projectId, issueId);
  }, [workspaceSlug, projectId, issueId, worklog]);

  const activeTimers = worklog.getActiveTimersForIssue(issueId);

  // tick every second while any timer is running so the live elapsed updates
  useEffect(() => {
    if (activeTimers.length === 0) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activeTimers.length]);

  // only completed worklogs (the running timer lives separately)
  const allIds = (worklog.getWorklogsByIssueId(issueId) ?? []).filter((id) => {
    const wl = worklog.getWorklogById(id);
    return wl && wl.duration !== null;
  });

  // per-person totals (completed) merged with running-timer state
  const summaryMap = new Map<string, TPersonSummary>();
  let grandTotal = 0;
  for (const id of allIds) {
    const wl = worklog.getWorklogById(id);
    if (!wl) continue;
    grandTotal += wl.duration ?? 0;
    const existing = summaryMap.get(wl.logged_by);
    if (existing) {
      existing.total += wl.duration ?? 0;
      existing.count += 1;
    } else {
      summaryMap.set(wl.logged_by, {
        userId: wl.logged_by,
        name: wl.logged_by_detail?.display_name ?? "",
        avatarUrl: wl.logged_by_detail?.avatar_url ?? "",
        total: wl.duration ?? 0,
        count: 1,
        activeTimer: null,
      });
    }
  }
  // fold in running timers (a user may have a running timer but no completed entries yet)
  for (const timer of activeTimers) {
    const existing = summaryMap.get(timer.logged_by);
    if (existing) existing.activeTimer = timer;
    else
      summaryMap.set(timer.logged_by, {
        userId: timer.logged_by,
        name: timer.logged_by_detail?.display_name ?? "",
        avatarUrl: timer.logged_by_detail?.avatar_url ?? "",
        total: 0,
        count: 0,
        activeTimer: timer,
      });
  }
  // sorting a freshly-created array, so the in-place sort is safe
  // eslint-disable-next-line unicorn/no-array-sort
  const summaries = [...summaryMap.values()].sort((a, b) => b.total - a.total);

  const handleAdminStop = async (timerId: string) => {
    setStoppingId(timerId);
    try {
      await worklog.adminStopTimer(workspaceSlug, projectId, issueId, timerId);
    } finally {
      setStoppingId(null);
    }
  };

  if (allIds.length === 0 && summaries.length === 0)
    return (
      <p className="py-6 text-center text-body-sm-regular text-tertiary">
        {t("common.activity_empty_state.no_worklogs")}
      </p>
    );

  const visibleIds = selectedUser
    ? allIds.filter((id) => worklog.getWorklogById(id)?.logged_by === selectedUser)
    : allIds;

  return (
    <div className="space-y-4">
      {/* overview: total time per person; rows double as a filter */}
      <div className="rounded-lg border border-subtle bg-surface-2 p-2">
        <div className="flex items-center justify-between px-1.5 pt-0.5 pb-1.5">
          <span className="text-body-xs-medium text-tertiary">{t("common.overview")}</span>
          <span className="text-body-xs-semibold text-success-primary">{formatDuration(grandTotal)}</span>
        </div>

        <button
          type="button"
          onClick={() => setSelectedUser(null)}
          className={cn(
            "flex w-full items-center justify-between rounded-md px-1.5 py-1.5 text-left transition-all outline-none hover:bg-layer-1 active:scale-[0.99]",
            { "bg-accent-subtle ring-1 ring-accent-strong/50 ring-inset": selectedUser === null }
          )}
        >
          <span className={cn("text-body-xs-medium", selectedUser === null ? "text-accent-primary" : "text-primary")}>
            {t("common.all")}
          </span>
          <span className="text-body-xs-regular text-secondary">{formatDuration(grandTotal)}</span>
        </button>

        {summaries.map((person) => {
          const isSelected = selectedUser === person.userId;
          return (
            <div
              key={person.userId}
              className={cn(
                "group flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 transition-all hover:bg-layer-1",
                { "bg-accent-subtle ring-1 ring-accent-strong/50 ring-inset": isSelected }
              )}
            >
              <button
                type="button"
                onClick={() => setSelectedUser((prev) => (prev === person.userId ? null : person.userId))}
                className="flex min-w-0 flex-1 items-center gap-2 text-left outline-none active:scale-[0.99]"
              >
                <Avatar name={person.name} src={person.avatarUrl} size="sm" showTooltip={false} />
                <span
                  className={cn("truncate text-body-xs-medium", isSelected ? "text-accent-primary" : "text-primary")}
                >
                  {person.name}
                </span>
                {person.activeTimer?.started_at && (
                  <span className="flex items-center gap-1 rounded-full bg-warning-subtle px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-warning-primary">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-warning-primary" />
                    {formatElapsed(person.activeTimer.started_at)}
                  </span>
                )}
              </button>

              <span className="text-body-xs-semibold whitespace-nowrap text-success-primary">
                {formatDuration(person.total)}
              </span>

              {/* admins can stop a running timer for any user */}
              {isAdmin && person.activeTimer && (
                <Tooltip tooltipContent={t("common.stop_timer")}>
                  <button
                    type="button"
                    onClick={() => handleAdminStop(person.activeTimer!.id)}
                    disabled={stoppingId === person.activeTimer.id}
                    className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border border-danger-strong text-danger-primary transition-colors hover:bg-danger-subtle disabled:opacity-60"
                  >
                    <Square className="h-2.5 w-2.5 fill-current" />
                  </button>
                </Tooltip>
              )}
            </div>
          );
        })}
      </div>

      {/* filtered worklog entries */}
      <div>
        {visibleIds.map((id, index) => {
          const wl = worklog.getWorklogById(id);
          const activityComment: TIssueActivityComment = {
            id,
            activity_type: EActivityFilterType.WORKLOG,
            created_at: wl?.logged_at ?? "",
          };
          return (
            <IssueActivityWorklog
              key={id}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              activityComment={activityComment}
              ends={index === 0 ? "top" : index === visibleIds.length - 1 ? "bottom" : undefined}
            />
          );
        })}
      </div>
    </div>
  );
});
