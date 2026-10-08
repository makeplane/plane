/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { CalendarRange, Play, Square, Timer } from "lucide-react";
// components
import type { TPowerKCommandConfig } from "@/components/power-k/core/types";
// hooks
import { useTimer } from "@/hooks/store/use-timer";
import { useAppRouter } from "@/hooks/use-app-router";
import { useLoggableProjects } from "@/hooks/time-tracking/use-loggable-projects";
import { useTimeTrackingRouteContext } from "@/hooks/time-tracking/use-route-context";
import { useTimeTrackingPermissions } from "@/hooks/time-tracking/use-time-tracking-permissions";
import { useTimerActions } from "@/hooks/time-tracking/use-timer-actions";

/** Start/stop the timer, log time and open the timesheet from Power K (plan 9.4.4). */
export const usePowerKTimeTrackingCommands = (): TPowerKCommandConfig[] => {
  const router = useAppRouter();
  const { workspaceSlug, canView } = useTimeTrackingPermissions();
  const { canLogOwn } = useLoggableProjects();
  const { runningTimer, isRunningOnIssue, openLogTimeModal, setStartPopoverOpen } = useTimer();
  const { start, stop } = useTimerActions();
  const { projectId, issueId } = useTimeTrackingRouteContext();

  const canLogHere = !!projectId && canLogOwn(projectId);

  return [
    {
      id: "time_tracking_start_timer",
      group: "general",
      type: "action",
      i18n_title: "time-tracking.power_k.start_timer",
      icon: Play,
      keywords: ["time", "timer", "track"],
      // on a work item, start right away; elsewhere let the user pick in the top-bar popover
      action: () => {
        if (issueId && canLogHere && !isRunningOnIssue(issueId))
          void start({ project_id: projectId ?? undefined, issue_id: issueId });
        else setStartPopoverOpen(true);
      },
      isEnabled: () => canView,
      isVisible: () => canView && !(issueId && isRunningOnIssue(issueId)),
      closeOnSelect: true,
    },
    {
      id: "time_tracking_stop_timer",
      group: "general",
      type: "action",
      i18n_title: "time-tracking.power_k.stop_timer",
      icon: Square,
      keywords: ["time", "timer"],
      action: () => void stop(),
      isEnabled: () => canView,
      isVisible: () => canView && !!runningTimer,
      closeOnSelect: true,
    },
    {
      id: "time_tracking_log_time",
      group: "general",
      type: "action",
      i18n_title: "time-tracking.power_k.log_time",
      icon: Timer,
      keywords: ["time", "log", "hours"],
      action: () => openLogTimeModal({ defaults: canLogHere ? { projectId, issueId } : {} }),
      isEnabled: () => canView,
      isVisible: () => canView,
      closeOnSelect: true,
    },
    {
      id: "time_tracking_open_timesheet",
      group: "general",
      type: "action",
      i18n_title: "time-tracking.power_k.open_timesheet",
      icon: CalendarRange,
      keywords: ["time", "timesheet", "week"],
      action: () => router.push(`/${workspaceSlug}/time-tracking/timesheet/`),
      isEnabled: () => canView && !!workspaceSlug,
      isVisible: () => canView && !!workspaceSlug,
      closeOnSelect: true,
    },
  ];
};
