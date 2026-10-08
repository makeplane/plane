/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useState } from "react";
import { observer } from "mobx-react";
import { Play, Square } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { Tooltip } from "@plane/propel/tooltip";
import { cn } from "@plane/utils";
// hooks
import { useTimer } from "@/hooks/store/use-timer";
import { useTimerActions } from "@/hooks/time-tracking/use-timer-actions";
// local imports
import { ElapsedTime } from "./elapsed-time";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  className?: string;
};

/** Play when the user's timer isn't on this work item; stop plus the live time when it is. */
export const WorkItemTimerButton = observer(function WorkItemTimerButton(props: Props) {
  const { workspaceSlug, projectId, issueId, className } = props;
  const { t } = useTranslation();
  const { isRunningOnIssue, runningTimer, clockOffsetMs } = useTimer();
  const { toggleOnIssue } = useTimerActions(workspaceSlug);
  const [isBusy, setIsBusy] = useState(false);
  const isRunning = isRunningOnIssue(issueId);

  const handleClick = async () => {
    setIsBusy(true);
    await toggleOnIssue(projectId, issueId);
    setIsBusy(false);
  };

  return (
    <Tooltip
      tooltipContent={isRunning ? t("time-tracking.work_item.stop_timer") : t("time-tracking.work_item.start_timer")}
    >
      <button
        type="button"
        disabled={isBusy}
        onClick={() => void handleClick()}
        aria-label={isRunning ? t("time-tracking.work_item.stop_timer") : t("time-tracking.work_item.start_timer")}
        className={cn(
          "flex h-6 items-center gap-1 rounded-md px-1.5 text-11",
          isRunning
            ? "bg-accent-subtle text-accent-primary hover:bg-accent-subtle-hover"
            : "text-tertiary hover:bg-layer-transparent-hover hover:text-primary",
          className
        )}
      >
        {isRunning ? <Square className="size-3 fill-current" /> : <Play className="size-3.5" />}
        {isRunning && runningTimer?.started_at && (
          <ElapsedTime startedAt={runningTimer.started_at} clockOffsetMs={clockOffsetMs} />
        )}
      </button>
    </Tooltip>
  );
});
