/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// hooks
import { useTimer } from "@/hooks/store/use-timer";
import { useTimeTrackingPermissions } from "@/hooks/time-tracking/use-time-tracking-permissions";
// local imports
import { LogTimeModalHost } from "../modals/log-time-modal";
import { RunningTimerPopover } from "./running-timer-popover";
import { StartTimerPopover } from "./start-timer-popover";

/** The timer in the top navigation, plus the app-wide Log time modal. Hidden for workspace Guests. */
export const TimerWidget = observer(function TimerWidget() {
  const { workspaceSlug: workspaceSlugParam } = useParams();
  const workspaceSlug = workspaceSlugParam?.toString();
  const { canView } = useTimeTrackingPermissions(workspaceSlug);
  const { runningTimer, startSync } = useTimer();

  // fetch the timer, and refetch whenever this tab regains focus (another tab or device may have changed it)
  useEffect(() => {
    if (!workspaceSlug || !canView) return;
    return startSync(workspaceSlug);
  }, [workspaceSlug, canView, startSync]);

  if (!workspaceSlug || !canView) return null;

  return (
    <>
      {runningTimer && runningTimer.started_at ? (
        <RunningTimerPopover workspaceSlug={workspaceSlug} timer={runningTimer} />
      ) : (
        <StartTimerPopover workspaceSlug={workspaceSlug} />
      )}
      <LogTimeModalHost workspaceSlug={workspaceSlug} />
    </>
  );
});
