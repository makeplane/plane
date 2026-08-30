/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
// ui
import { Tooltip } from "@plane/propel/tooltip";
// components
import { SIDEBAR_WIDTH } from "@/components/gantt-chart/constants";
import { getBlockViewDetails } from "@/components/issues/issue-layouts/utils";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useAppRouter } from "@/hooks/use-app-router";
import { usePlatformOS } from "@/hooks/use-platform-os";
// local imports
import { getProjectProgressPercentage, PROGRESS_ACCENT_COLOR, PROGRESS_ACCENT_COLOR_MUTED } from "./utils";

type Props = {
  projectId: string;
};

export const ProjectGanttBlock = observer(function ProjectGanttBlock(props: Props) {
  const { projectId } = props;
  // router
  const router = useAppRouter();
  const { workspaceSlug } = useParams();
  // store hooks
  const { getProjectById, getProjectAnalyticsCountById } = useProject();
  // hooks
  const { isMobile } = usePlatformOS();
  // derived values
  const project = getProjectById(projectId);
  const analytics = getProjectAnalyticsCountById(projectId);
  const progressPercentage = getProjectProgressPercentage(analytics);

  const { message, blockStyle } = getBlockViewDetails(
    { start_date: analytics?.start_date, target_date: analytics?.target_date },
    PROGRESS_ACCENT_COLOR
  );
  // layer the completion-progress fill on top of the date-mask styling returned above
  blockStyle.backgroundImage = `linear-gradient(to right, ${PROGRESS_ACCENT_COLOR} ${progressPercentage}%, ${PROGRESS_ACCENT_COLOR_MUTED} ${progressPercentage}%)`;

  const completedIssues = analytics?.completed_issues ?? 0;
  const totalIssues = analytics?.total_issues ?? 0;

  return (
    <Tooltip
      isMobile={isMobile}
      tooltipContent={
        <div className="space-y-1">
          <h5>{project?.name}</h5>
          {message && <div>{message}</div>}
          <div>
            {completedIssues}/{totalIssues} work items done ({progressPercentage}%)
          </div>
        </div>
      }
      position="top-start"
    >
      <button
        type="button"
        className="relative flex h-full w-full items-center rounded-sm border-0 p-0 text-left"
        style={blockStyle}
        onClick={() => router.push(`/${workspaceSlug?.toString()}/projects/${projectId}/issues`)}
      >
        <div
          className="sticky w-auto truncate overflow-hidden px-2.5 py-1 text-13 text-on-color"
          style={{ left: `${SIDEBAR_WIDTH}px` }}
        >
          {project?.name}
        </div>
      </button>
    </Tooltip>
  );
});
