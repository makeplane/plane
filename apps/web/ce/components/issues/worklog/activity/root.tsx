/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Clock3 } from "lucide-react";
// plane imports
import { calculateTimeAgo, formatDuration, renderFormattedDate, renderFormattedTime } from "@plane/utils";
import { Tooltip } from "@plane/propel/tooltip";
// hooks
import { usePlatformOS } from "@/hooks/use-platform-os";

type TIssueActivityWorklog = {
  timeLog:
    | {
        created_at: string;
        stopped_at: string | null;
        duration_seconds: number;
        user_detail: { id: string; display_name: string } | null;
        created_by_detail: { id: string; display_name: string } | null;
      }
    | undefined;
  ends?: "top" | "bottom";
};

export function IssueActivityWorklog(props: TIssueActivityWorklog) {
  const { timeLog, ends } = props;
  const { isMobile } = usePlatformOS();

  if (!timeLog || !timeLog.user_detail) return null;

  const activityAt = timeLog.created_by_detail ? timeLog.created_at : timeLog.stopped_at || timeLog.created_at;
  const actor = timeLog.created_by_detail?.display_name || "System";
  const isActorRecipient = timeLog.created_by_detail?.id === timeLog.user_detail.id;

  return (
    <div
      className={`relative flex items-center gap-3 text-caption-sm-regular ${
        ends === "top" ? "pb-2" : ends === "bottom" ? "pt-2" : "py-2"
      }`}
    >
      <div className="absolute top-0 bottom-0 left-[13px] w-px bg-layer-3" aria-hidden />
      <div className="z-[4] flex h-7 w-7 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border border-subtle bg-layer-2 text-secondary shadow-raised-100">
        <Clock3 className="h-3.5 w-3.5" aria-hidden />
      </div>
      <div className="w-full truncate text-secondary">
        <span className="font-medium text-primary">{actor}</span> logged{" "}
        <span className="font-medium text-primary">{formatDuration(timeLog.duration_seconds)}</span>
        {!isActorRecipient && (
          <>
            {" "}
            for <span className="font-medium text-primary">{timeLog.user_detail.display_name}</span>
          </>
        )}
        .
        <Tooltip
          isMobile={isMobile}
          tooltipContent={`${renderFormattedDate(activityAt)}, ${renderFormattedTime(activityAt)}`}
        >
          <span className="whitespace-nowrap text-tertiary"> {calculateTimeAgo(activityAt)}</span>
        </Tooltip>
      </div>
    </div>
  );
}
