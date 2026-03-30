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

import { TimelineChartViewRoot } from "@/components/timeline";
import { useUserPermissions } from "@/hooks/store/user";
import { useTimeLineChartStore } from "@/hooks/use-timeline-chart";
import { EUserPermissionsLevel } from "@plane/constants";
import type { TInitiativeScopeTab } from "@plane/types";
import { EGanttBlockType, EUserPermissions, INITIATIVE_SCOPE_TABS } from "@plane/types";
import { observer } from "mobx-react";
import { useMemo } from "react";
import { FlatScopeGanttSidebar } from "./sidebar/root";
import { getBlockToRender, useTimelineOperations } from "./helper";

type Props = {
  activeTab: TInitiativeScopeTab;
  epicIds: string[];
  projectIds: string[];
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
  handleAddEpic: () => void;
  handleAddProject: () => void;
};
export const ScopeTimelineChartRoot = observer(function ScopeTimelineChartRoot(props: Props) {
  const { activeTab, epicIds, projectIds, workspaceSlug, handleAddEpic, handleAddProject } = props;

  const { blockStructureUpdateHandler, blockDatesUpdateHandler } = useTimelineOperations(
    workspaceSlug,
    activeTab === INITIATIVE_SCOPE_TABS.EPICS ? EGanttBlockType.EPIC : EGanttBlockType.PROJECT
  );
  const { allowPermissions } = useUserPermissions();
  const { getBlockById, setBlockIds } = useTimeLineChartStore();

  const blockIds = useMemo(() => {
    if (activeTab === INITIATIVE_SCOPE_TABS.EPICS) return epicIds;
    if (activeTab === INITIATIVE_SCOPE_TABS.PROJECTS) return projectIds;
    return [];
  }, [activeTab, epicIds, projectIds]);

  const activeBlockType = useMemo(() => {
    if (activeTab === INITIATIVE_SCOPE_TABS.EPICS) return EGanttBlockType.EPIC;
    if (activeTab === INITIATIVE_SCOPE_TABS.PROJECTS) return EGanttBlockType.PROJECT;
    return EGanttBlockType.EPIC;
  }, [activeTab]);

  const checkEditPermissions = (projectId: string) => {
    if (!projectId) return false;
    return allowPermissions(
      [EUserPermissions.ADMIN, EUserPermissions.MEMBER],
      EUserPermissionsLevel.PROJECT,
      workspaceSlug,
      projectId
    );
  };

  const isDependencyEnabled = (blockId: string): boolean => {
    const data = getBlockById(blockId);
    if (!data) return false;

    const type = data.meta?.type as EGanttBlockType;
    const projectId = data.meta?.project_id as string;

    // Project relations is not enabled yet.
    if (type === EGanttBlockType.PROJECT) return false;
    if (type === EGanttBlockType.EPIC) return checkEditPermissions(projectId);

    return false;
  };

  const handleAddBlock = async (type: EGanttBlockType) => {
    switch (type) {
      case EGanttBlockType.EPIC:
        return handleAddEpic();
      case EGanttBlockType.PROJECT:
        return handleAddProject();
    }
  };

  // update the timeline store with updated blockIds
  useMemo(() => {
    setBlockIds(blockIds);
  }, [blockIds, setBlockIds]);

  return (
    <div className="h-full w-full">
      <TimelineChartViewRoot
        border={false}
        title="Scope"
        blockIds={blockIds}
        blockUpdateHandler={blockStructureUpdateHandler}
        blockToRender={(data) => getBlockToRender(activeBlockType, data)}
        sidebarToRender={(props) => (
          <FlatScopeGanttSidebar
            {...props}
            blockIds={blockIds}
            activeBlockType={activeBlockType}
            showAllBlocks
            handleAddBlock={handleAddBlock}
          />
        )}
        enableBlockLeftResize
        enableBlockRightResize
        enableBlockMove
        enableReorder={false}
        enableAddBlock
        enableSelection={false}
        showToday
        updateBlockDates={blockDatesUpdateHandler}
        showAllBlocks
        enableDependency={isDependencyEnabled}
        isEpic={activeTab === INITIATIVE_SCOPE_TABS.EPICS}
        loaderTitle=""
        bottomSpacing={false}
      />
    </div>
  );
});
