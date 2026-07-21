/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

"use client";

import { useEffect } from "react";
import { observer } from "mobx-react";
import { Timer } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import { Avatar } from "@plane/ui";
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useUser } from "@/hooks/store/user";

type TActiveTimerBanner = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
};

// Shows above the work item title when other users have a running timer on this issue.
export const ActiveTimerBanner = observer(function ActiveTimerBanner(props: TActiveTimerBanner) {
  const { workspaceSlug, projectId, issueId } = props;
  const { t } = useTranslation();
  const { data: currentUser } = useUser();
  const { worklog } = useIssueDetail();

  useEffect(() => {
    if (workspaceSlug && projectId && issueId) worklog.fetchIssueActiveTimers(workspaceSlug, projectId, issueId);
  }, [workspaceSlug, projectId, issueId, worklog]);

  // only other people's running timers are relevant for the "someone is working on this" alert
  const others = worklog.getActiveTimersForIssue(issueId).filter((timer) => timer.logged_by !== currentUser?.id);
  if (others.length === 0) return null;

  const names = others.map((timer) => timer.logged_by_detail?.display_name).filter(Boolean);
  const message =
    others.length === 1
      ? t("common.worklog_someone_working_one", { name: names[0] })
      : t("common.worklog_someone_working_other", { names: names.join(", ") });

  return (
    <div className="flex items-center gap-2 rounded-lg border border-warning-strong/40 bg-warning-subtle px-3 py-2">
      <Timer className="h-4 w-4 flex-shrink-0 text-warning-primary" />
      <span className="flex -space-x-1.5">
        {others.slice(0, 5).map((timer) => (
          <Avatar
            key={timer.id}
            name={timer.logged_by_detail?.display_name}
            src={timer.logged_by_detail?.avatar_url}
            size="sm"
            showTooltip
          />
        ))}
      </span>
      <span className="text-body-xs-medium text-warning-primary">{message}</span>
    </div>
  );
});
