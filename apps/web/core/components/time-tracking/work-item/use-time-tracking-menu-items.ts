/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useParams } from "next/navigation";
import { Play, Square, Timer } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import type { TIssue } from "@plane/types";
import type { TContextMenuItem } from "@plane/ui";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useTimer } from "@/hooks/store/use-timer";
import { useTimeTrackingPermissions } from "@/hooks/time-tracking/use-time-tracking-permissions";
import { useTimerActions } from "@/hooks/time-tracking/use-timer-actions";

/** "Start/Stop timer" and "Log time…" for work item quick action menus (plan 9.4.4). */
export const useTimeTrackingMenuItems = (issue: TIssue | undefined, workspaceSlugOverride?: string) => {
  const params = useParams();
  const workspaceSlug = workspaceSlugOverride ?? params.workspaceSlug?.toString();
  const { t } = useTranslation();
  const { canLogOwn } = useTimeTrackingPermissions(workspaceSlug);
  const { isRunningOnIssue, openLogTimeModal } = useTimer();
  const { toggleOnIssue } = useTimerActions(workspaceSlug);
  const { getProjectIdentifierById } = useProject();

  const projectId = issue?.project_id ?? undefined;
  const canLog = !!issue && !!projectId && canLogOwn(projectId) && !issue.archived_at && !issue.is_draft;
  const isRunning = !!issue && isRunningOnIssue(issue.id);

  const createTimerMenuItem = (): TContextMenuItem => ({
    key: "time-tracking-timer",
    title: isRunning ? t("time-tracking.timer.stop") : t("time-tracking.timer.start"),
    icon: isRunning ? Square : Play,
    action: () => {
      if (issue && projectId) void toggleOnIssue(projectId, issue.id);
    },
    shouldRender: canLog,
  });

  const createLogTimeMenuItem = (): TContextMenuItem => ({
    key: "time-tracking-log-time",
    title: t("time-tracking.work_item.log_time"),
    icon: Timer,
    action: () => {
      if (!issue || !projectId) return;
      openLogTimeModal({
        defaults: {
          projectId,
          issueId: issue.id,
          issueOption: {
            id: issue.id,
            sequence_id: issue.sequence_id,
            name: issue.name ?? "",
            project_identifier: getProjectIdentifierById(projectId),
          },
        },
      });
    },
    shouldRender: canLog,
  });

  return { createTimerMenuItem, createLogTimeMenuItem };
};
