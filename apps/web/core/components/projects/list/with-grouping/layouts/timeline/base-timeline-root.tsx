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

import { useCallback } from "react";
import { observer } from "mobx-react";
// plane imports
import type { IBlockUpdateData, IBlockUpdateDependencyData } from "@plane/types";
import { GANTT_TIMELINE_TYPE } from "@plane/types";
// components
import { TimelineChartRoot } from "@/components/timeline";
import { TimeLineTypeContext } from "@/components/timeline/contexts";
// hooks
import { useProject } from "@/hooks/store/use-project";
// plane web hooks
import { useProjectFilter } from "@/plane-web/hooks/store/workspace-project-states/use-project-filters";
import type { TProject } from "@/types/projects";
import { EProjectLayouts } from "@/types/workspace-project-filters";
// local imports
import { ProjectLayoutHOC } from "../project-layout-HOC";
import { ProjectTimelineBlock } from "./blocks";
import { ProjectTimelineSidebar } from "./sidebar";

type BaseTimelineRootProps = {
  workspaceSlug: string;
};

export const BaseTimelineRoot = observer(function BaseTimelineRoot(props: BaseTimelineRootProps) {
  const { workspaceSlug } = props;
  // store hooks
  const { getFilteredProjectsByLayout } = useProjectFilter();
  const { updateProject, permissions } = useProject();

  const filteredProjectIds = getFilteredProjectsByLayout(EProjectLayouts.TIMELINE);

  const getCanEditViaTimeline = useCallback(
    (blockId: string) => permissions.getCanEdit(workspaceSlug, blockId),
    [permissions, workspaceSlug]
  );

  const updateProjectBlockStructure = async (project: TProject, data: IBlockUpdateData) => {
    if (!workspaceSlug) return;
    const payload = { ...data };
    if (updateProject) {
      await updateProject(workspaceSlug, project.id, payload as Partial<TProject>);
    }
  };

  const updateBlockDates = async (blockUpdates: IBlockUpdateDependencyData[]) => {
    const blockUpdate = blockUpdates[0];

    if (!blockUpdate) return;

    const payload: Partial<TProject> = {};

    if (blockUpdate.start_date) payload.start_date = blockUpdate.start_date;
    if (blockUpdate.target_date) payload.target_date = blockUpdate.target_date;

    if (updateProject) {
      await updateProject(workspaceSlug, blockUpdate.id, payload);
    }
  };

  return (
    <ProjectLayoutHOC layout={EProjectLayouts.TIMELINE} workspaceSlug={workspaceSlug}>
      <TimeLineTypeContext.Provider value={GANTT_TIMELINE_TYPE.PROJECT}>
        <div className="h-full w-full">
          <TimelineChartRoot
            border={false}
            title="Projects"
            loaderTitle="Projects"
            blockIds={filteredProjectIds || []}
            blockUpdateHandler={updateProjectBlockStructure}
            blockToRender={(data: TProject) => <ProjectTimelineBlock projectId={data.id} />}
            sidebarToRender={(props) => <ProjectTimelineSidebar {...props} showAllBlocks />}
            enableBlockLeftResize={getCanEditViaTimeline}
            enableBlockRightResize={getCanEditViaTimeline}
            enableBlockMove={getCanEditViaTimeline}
            enableAddBlock={getCanEditViaTimeline}
            enableSelection={false}
            showToday={false}
            updateBlockDates={updateBlockDates}
            showAllBlocks
          />
        </div>
      </TimeLineTypeContext.Provider>
    </ProjectLayoutHOC>
  );
});
