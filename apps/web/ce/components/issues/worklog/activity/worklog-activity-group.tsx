/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { ChevronRight, Timer } from "lucide-react";
import { formatMinutesToDisplay } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import type { TIssueActivityComment } from "@plane/types";
import { cn } from "@plane/utils";
import { IssueActivityWorklog } from "./root";

type TWorklogActivityGroup = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  activityComment: TIssueActivityComment;
  ends?: "top" | "bottom";
};

export const WorklogActivityGroup = observer(function WorklogActivityGroup(props: TWorklogActivityGroup) {
  const { activityComment, workspaceSlug, projectId, issueId, ends } = props;
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(false);

  if (activityComment.activity_type !== "WORKLOG_GROUP") return null;

  const { groupedEntryIds, totalMinutes } = activityComment;
  const count = groupedEntryIds.length;
  const formattedTotal = formatMinutesToDisplay(totalMinutes);

  return (
    <div className={cn("relative", { "pb-0": ends === "bottom", "pt-0": ends === "top" })}>
      {/* Collapsed summary header */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className="group flex w-full items-center gap-2 rounded-md py-1.5 text-left transition-colors hover:bg-layer-2/50"
      >
        <span className="mt-0.5 flex-shrink-0 rounded-full bg-layer-2 p-1">
          <Timer className="h-3 w-3 text-tertiary" />
        </span>
        <ChevronRight
          className={cn("h-3 w-3 flex-shrink-0 text-tertiary transition-transform", {
            "rotate-90": isExpanded,
          })}
        />
        <span className="text-xs text-tertiary">
          {count} {t("worklog.activity_logged")}
          {totalMinutes > 0 && <span className="ml-1 font-medium text-primary">({formattedTotal})</span>}
        </span>
      </button>

      {/* Expanded entries */}
      {isExpanded && (
        <div className="ml-4 border-l border-subtle-1 pl-2">
          {groupedEntryIds.map((entryId) => (
            <IssueActivityWorklog
              key={entryId}
              workspaceSlug={workspaceSlug}
              projectId={projectId}
              issueId={issueId}
              activityComment={{ id: entryId, activity_type: "WORKLOG", created_at: "" }}
              ends={undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
});
