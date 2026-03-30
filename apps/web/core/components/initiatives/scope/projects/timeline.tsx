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

// plane imports
import { GANTT_TIMELINE_TYPE, INITIATIVE_SCOPE_TABS } from "@plane/types";
// components
import { InitiativeScopeProjectsEmptyState } from "@/components/issues/issue-layouts/empty-states/initiative-scope-project";
import { TimeLineTypeContext } from "@/components/timeline/contexts";
import { ListLayoutLoader } from "@/components/ui/loader/layouts/list-layout-loader";
import { ScopeTimelineChartRoot } from "../timeline/chart-root";

type Props = {
  projectIds: string[];
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
  isDataLoading?: boolean;
  handleAddEpic: () => void;
  handleAddProject: () => void;
};

export function InitiativeScopeProjectTimeline(props: Props) {
  const { projectIds, workspaceSlug, initiativeId, disabled, isDataLoading, handleAddEpic, handleAddProject } = props;

  if (isDataLoading) return <ListLayoutLoader />;

  if (projectIds.length === 0) return <InitiativeScopeProjectsEmptyState />;

  return (
    <TimeLineTypeContext.Provider value={GANTT_TIMELINE_TYPE.PROJECT}>
      <ScopeTimelineChartRoot
        activeTab={INITIATIVE_SCOPE_TABS.PROJECTS}
        epicIds={[]}
        projectIds={projectIds}
        workspaceSlug={workspaceSlug}
        handleAddEpic={handleAddEpic}
        handleAddProject={handleAddProject}
        initiativeId={initiativeId}
        disabled={disabled}
      />
    </TimeLineTypeContext.Provider>
  );
}
