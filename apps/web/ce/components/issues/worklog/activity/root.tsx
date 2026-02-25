/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { Timer } from "lucide-react";
import { formatMinutesToDisplay } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TIssueActivityComment } from "@plane/types";
import { cn } from "@plane/utils";
import { useWorklog } from "@/hooks/store/use-worklog";

type TIssueActivityWorklog = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityComment: TIssueActivityComment;
  ends?: "top" | "bottom";
};

export const IssueActivityWorklog = observer(function IssueActivityWorklog(props: TIssueActivityWorklog) {
  const { activityComment, issueId, ends } = props;
  const { t } = useTranslation();
  const store = useWorklog();

  // Find the matching worklog entry by id for display details
  const worklogs = store.getWorklogsForIssue(issueId);
  const worklog = worklogs.find((w) => w.id === activityComment.id);

  // Format date for display
  const createdAt = activityComment.created_at
    ? new Date(activityComment.created_at).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const displayName = worklog?.logged_by_detail?.display_name;
  const duration = worklog ? formatMinutesToDisplay(worklog.duration_minutes) : null;

  return (
    <div
      className={cn("relative flex items-start gap-2 py-1.5", {
        "pb-0": ends === "bottom",
        "pt-0": ends === "top",
      })}
    >
      {/* icon */}
      <span className="flex-shrink-0 mt-0.5 rounded-full bg-layer-2 p-1">
        <Timer className="h-3 w-3 text-color-tertiary" />
      </span>

      {/* message */}
      <p className="text-xs text-color-tertiary leading-5">
        {displayName && <span className="font-medium text-color-primary">{displayName}</span>}
        {displayName ? ` ${t("worklog.activity_logged")}` : t("worklog.activity_logged")}
        {duration && <span className="font-medium text-color-primary"> {duration}</span>}
        {worklog?.description && <span className="ml-1">— {worklog.description}</span>}
        {createdAt && <span className="ml-1">{createdAt}</span>}
      </p>
    </div>
  );
});
