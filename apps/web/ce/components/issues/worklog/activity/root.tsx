/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Timer } from "lucide-react";
import { useTranslation } from "@plane/i18n";
import type { TIssueActivityComment } from "@plane/types";
import { cn } from "@plane/utils";

type TIssueActivityWorklog = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityComment: TIssueActivityComment;
  ends?: "top" | "bottom";
};

export function IssueActivityWorklog(props: TIssueActivityWorklog) {
  const { activityComment, ends } = props;
  const { t } = useTranslation();

  // format date for display if available
  const createdAt = activityComment.created_at
    ? new Date(activityComment.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;

  return (
    <div
      className={cn("relative flex items-start gap-2 py-1.5", {
        "pb-0": ends === "bottom",
        "pt-0": ends === "top",
      })}
    >
      {/* icon */}
      <span className="flex-shrink-0 mt-0.5 rounded-full bg-custom-background-80 p-1">
        <Timer className="h-3 w-3 text-custom-text-300" />
      </span>

      {/* message */}
      <p className="text-xs text-custom-text-300 leading-5">
        {t("worklog.activity_logged")}
        {createdAt && (
          <span className="ml-1 text-custom-text-400">{createdAt}</span>
        )}
      </p>
    </div>
  );
}
