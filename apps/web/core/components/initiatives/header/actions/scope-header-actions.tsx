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

import { observer } from "mobx-react";
import { EIssueLayoutTypes } from "@plane/types";
import type { TInitiativeScopeEpicGroupBy, TInitiativeScopeProjectGroupBy } from "@plane/types";
import { LayoutSelection } from "@/components/issues/issue-layouts/filters";
import { InitiativeScopeEpicsDisplayFilters } from "@/components/initiatives/scope/epics/display-filters/root";
import { InitiativeScopeProjectsDisplayFilters } from "@/components/initiatives/scope/projects/display-filters/root";
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  initiativeId: string;
};

export const InitiativeScopeHeaderActions = observer(function InitiativeScopeHeaderActions({ initiativeId }: Props) {
  const {
    initiative: {
      scope: { getDisplayFilters, updateDisplayFilters },
    },
  } = useInitiatives();

  const displayFilters = getDisplayFilters(initiativeId);

  const activeLayout = displayFilters?.activeLayout;
  const activeTab = displayFilters?.activeTab ?? "epics";
  const epicGroupBy = displayFilters?.epicGroupBy;
  const projectGroupBy = displayFilters?.projectGroupBy;

  const handleLayoutChange = (layout: EIssueLayoutTypes) => {
    updateDisplayFilters(initiativeId, { activeLayout: layout });
  };

  const handleEpicGroupByChange = (groupBy: TInitiativeScopeEpicGroupBy) => {
    updateDisplayFilters(initiativeId, { epicGroupBy: groupBy });
  };

  const handleProjectGroupByChange = (groupBy: TInitiativeScopeProjectGroupBy) => {
    updateDisplayFilters(initiativeId, { projectGroupBy: groupBy });
  };

  return (
    <div className="flex items-center gap-2">
      {/* Epics tab: show epic display filters for list + kanban layouts */}
      {activeTab === "epics" &&
        (activeLayout === EIssueLayoutTypes.KANBAN || activeLayout === EIssueLayoutTypes.LIST) && (
          <InitiativeScopeEpicsDisplayFilters
            activeLayout={activeLayout}
            epicGroupBy={epicGroupBy}
            handleEpicGroupByChange={handleEpicGroupByChange}
          />
        )}
      {/* Projects tab: show project display filters for kanban layout only */}
      {activeTab === "projects" && activeLayout === EIssueLayoutTypes.KANBAN && (
        <InitiativeScopeProjectsDisplayFilters
          activeLayout={activeLayout}
          projectGroupBy={projectGroupBy}
          handleProjectGroupByChange={handleProjectGroupByChange}
        />
      )}
      {/* Layout selection */}
      <LayoutSelection
        layouts={[EIssueLayoutTypes.LIST, EIssueLayoutTypes.KANBAN, EIssueLayoutTypes.GANTT]}
        onChange={(layout) => handleLayoutChange(layout)}
        selectedLayout={activeLayout}
      />
    </div>
  );
});
