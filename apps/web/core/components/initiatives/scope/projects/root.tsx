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
import { useEffect } from "react";
// plane imports
import { EIssueLayoutTypes } from "@plane/types";
// components
import { InitiativeScopeProjectFiltersRow } from "./filters";
// local imports
import { InitiativeScopeProjectBoard } from "./board/root";
import { InitiativeScopeProjectList } from "./list";
import { InitiativeScopeProjectTimeline } from "./timeline";
// plane web imports
import { useInitiatives } from "@/plane-web/hooks/store/use-initiatives";

type Props = {
  workspaceSlug: string;
  initiativeId: string;
  disabled: boolean;
  handleAddEpic: () => void;
  handleAddProject: () => void;
};

export const InitiativeScopeProjectsRoot = observer(function InitiativeScopeProjectsRoot(props: Props) {
  const { workspaceSlug, initiativeId, disabled, handleAddEpic, handleAddProject } = props;

  // store hooks
  const {
    initiative: {
      scope: {
        getDisplayFilters,
        projects: { getInitiativeProjectsById, fetchInitiativeProjects, initiativeProjectLoader },
      },
    },
  } = useInitiatives();

  // Fetch projects on mount / when initiativeId changes
  useEffect(() => {
    if (!workspaceSlug || !initiativeId) return;
    fetchInitiativeProjects(workspaceSlug, initiativeId);
  }, [workspaceSlug, initiativeId, fetchInitiativeProjects]);

  // derived values
  const projectIds = getInitiativeProjectsById(initiativeId) ?? [];
  const isDataLoading = initiativeProjectLoader[initiativeId] !== "loaded";
  const displayFilters = getDisplayFilters(initiativeId);
  const activeLayout = (displayFilters?.activeLayout ?? EIssueLayoutTypes.LIST) as Exclude<
    EIssueLayoutTypes,
    EIssueLayoutTypes.SPREADSHEET | EIssueLayoutTypes.CALENDAR
  >;
  const projectGroupBy = displayFilters?.projectGroupBy ?? "states";

  return (
    <div className="flex flex-col h-full">
      {/* Project filters row */}
      <InitiativeScopeProjectFiltersRow />

      {/* Main layout */}
      <div className="relative h-full w-full overflow-hidden">
        {activeLayout === EIssueLayoutTypes.LIST ? (
          <InitiativeScopeProjectList
            projectIds={projectIds}
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            disabled={disabled}
            isDataLoading={isDataLoading}
          />
        ) : activeLayout === EIssueLayoutTypes.KANBAN ? (
          <InitiativeScopeProjectBoard
            projectIds={projectIds}
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            disabled={disabled}
            isDataLoading={isDataLoading}
            groupBy={projectGroupBy}
          />
        ) : activeLayout === EIssueLayoutTypes.GANTT ? (
          <InitiativeScopeProjectTimeline
            projectIds={projectIds}
            workspaceSlug={workspaceSlug}
            initiativeId={initiativeId}
            disabled={disabled}
            isDataLoading={isDataLoading}
            handleAddEpic={handleAddEpic}
            handleAddProject={handleAddProject}
          />
        ) : null}
      </div>
    </div>
  );
});
