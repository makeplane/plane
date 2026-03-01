/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { useRef } from "react";
import { observer } from "mobx-react";
// Plane
import { Logo } from "@plane/propel/emoji-icon-picker";
import { ProjectIcon } from "@plane/propel/icons";
import { CircularProgressIndicator } from "@plane/ui";
import { getProgress } from "@plane/utils";
// components
import { Attributes } from "@/components/projects/list/with-grouping/layouts/attributes";
import { UpdateStatusIcons } from "@/components/updates/status-icons";
// hooks
import { ListItem } from "@/components/core/list";
import { useProject } from "@/hooks/store/use-project";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { usePlatformOS } from "@/hooks/use-platform-os";
import { useWorkspaceFeatures } from "@/plane-web/hooks/store";
// types
import { EWorkspaceFeatures } from "@/types/workspace-feature";
// local components
import { QuickActions } from "./quick-actions";

type Props = {
  workspaceSlug: string;
  projectId: string;
  initiativeId: string;
};

export const ProjectItem = observer(function ProjectItem(props: Props) {
  const { workspaceSlug, initiativeId, projectId } = props;
  // store hooks
  const { getProjectById, getProjectAnalyticsCountById, updateProject } = useProject();
  const { currentWorkspace } = useWorkspace();
  const { isMobile } = usePlatformOS();
  const { isWorkspaceFeatureEnabled } = useWorkspaceFeatures();
  // ref
  const parentRef = useRef(null);
  // derived values
  const isProjectGroupingEnabled = isWorkspaceFeatureEnabled(EWorkspaceFeatures.IS_PROJECT_GROUPING_ENABLED);
  const projectDetails = getProjectById(projectId);
  const projectAnalyticsCount = getProjectAnalyticsCountById(projectId);

  const completedIssuesCount = projectAnalyticsCount?.completed_issues ?? 0;
  const totalIssuesCount = projectAnalyticsCount?.total_issues ?? 0;
  const showProgress = totalIssuesCount > 0;
  const progress = showProgress ? getProgress(completedIssuesCount, totalIssuesCount) : 0;

  if (!projectDetails || !currentWorkspace) return;

  return (
    <ListItem
      title={projectDetails.name || projectDetails.project_name || ""}
      itemLink={`/${workspaceSlug}/projects/${projectId}/issues`}
      prependTitleElement={
        <div className="flex items-center gap-2">
          <UpdateStatusIcons statusType={projectDetails.update_status} />
          <div className="h-6 w-6 flex-shrink-0 grid place-items-center rounded-sm bg-layer-1 mr-2">
            {projectDetails.logo_props ? (
              <Logo logo={projectDetails.logo_props} size={14} />
            ) : (
              <ProjectIcon className="size-[14px] text-tertiary" />
            )}
          </div>
        </div>
      }
      appendTitleElement={
        showProgress ? (
          <div className="flex items-center gap-1">
            <CircularProgressIndicator size={20} percentage={progress} strokeWidth={3} />
            <span className="text-13 font-medium text-tertiary px-1">{`${progress}%`}</span>
          </div>
        ) : undefined
      }
      quickActionElement={
        <div className="block md:hidden">
          <QuickActions project={projectDetails} workspaceSlug={workspaceSlug.toString()} initiativeId={initiativeId} />
        </div>
      }
      actionableItems={
        <>
          <Attributes
            project={projectDetails}
            isArchived={projectDetails.archived_at !== null}
            handleUpdateProject={(data) => updateProject(workspaceSlug.toString(), projectDetails.id, data)}
            workspaceSlug={workspaceSlug.toString()}
            currentWorkspace={currentWorkspace}
            containerClass="px-0 py-0 md:pb-4 lg:py-2"
            displayProperties={{
              state: isProjectGroupingEnabled,
              priority: isProjectGroupingEnabled,
              lead: true,
              date: isProjectGroupingEnabled,
            }}
          />
          <div className="hidden md:flex">
            <QuickActions
              project={projectDetails}
              workspaceSlug={workspaceSlug.toString()}
              initiativeId={initiativeId}
            />
          </div>
        </>
      }
      itemClassName="overflow-visible"
      isMobile={isMobile}
      parentRef={parentRef}
      className="last:pb-0"
    />
  );
});
