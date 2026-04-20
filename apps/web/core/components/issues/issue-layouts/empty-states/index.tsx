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

import { lazy, Suspense } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import { observer } from "mobx-react";
// plane imports
import { EIssuesStoreType } from "@plane/types";
// hooks
import { useProject } from "@/hooks/store/use-project";
import { useIssues } from "@/hooks/store/use-issues";
import { useCycle } from "@/hooks/store/use-cycle";
import { useModule } from "@/hooks/store/use-module";

// Lazy load empty state components
const ProjectEmptyState = lazy(() =>
  import("./project-issues").then((module) => ({
    default: module.ProjectEmptyState,
  }))
);
const ProjectViewEmptyState = lazy(() =>
  import("./project-view").then((module) => ({
    default: module.ProjectViewEmptyState,
  }))
);
const ProjectArchivedEmptyState = lazy(() =>
  import("./archived-issues").then((module) => ({
    default: module.ProjectArchivedEmptyState,
  }))
);
const ProjectArchivedEpicsEmptyState = lazy(() =>
  import("./archived-epics").then((module) => ({
    default: module.ProjectArchivedEpicsEmptyState,
  }))
);
const CycleEmptyState = lazy(() => import("./cycle").then((module) => ({ default: module.CycleEmptyState })));
const ModuleEmptyState = lazy(() => import("./module").then((module) => ({ default: module.ModuleEmptyState })));
const GlobalViewEmptyState = lazy(() =>
  import("./global-view").then((module) => ({
    default: module.GlobalViewEmptyState,
  }))
);
const ProfileViewEmptyState = lazy(() =>
  import("./profile-view").then((module) => ({
    default: module.ProfileViewEmptyState,
  }))
);
const ProjectEpicsEmptyState = lazy(() =>
  import("./project-epic").then((module) => ({
    default: module.ProjectEpicsEmptyState,
  }))
);
const TeamEmptyState = lazy(() =>
  import("./team-issues").then((module) => ({
    default: module.TeamEmptyState,
  }))
);
const InitiativeScopeEpicsEmptyState = lazy(() =>
  import("./initiative-scope-epic").then((module) => ({ default: module.InitiativeScopeEpicsEmptyState }))
);
const TeamViewEmptyState = lazy(() =>
  import("./team-view-issues").then((module) => ({
    default: module.TeamViewEmptyState,
  }))
);
const TeamProjectWorkItemEmptyState = lazy(() =>
  import("./team-project").then((module) => ({
    default: module.TeamProjectWorkItemEmptyState,
  }))
);
const ReleaseEmptyState = lazy(() => import("./release").then((module) => ({ default: module.ReleaseEmptyState })));

type ActiveLayoutEmptyStateProps = {
  workspaceSlug: string;
  permissions: {
    canCreateProject: boolean;
    canCreateWorkItem: (projectId: string) => boolean;
    canClearFilters: boolean;
    canManageAutomations: (projectId: string) => boolean;
    canAddWorkItemsToCycle: (projectId: string, cycleId: string) => boolean;
    canAddWorkItemsToModule: (projectId: string, moduleId: string) => boolean;
  };
};

const WORK_ITEM_LAYOUT_EMPTY_STATES: Record<
  EIssuesStoreType,
  LazyExoticComponent<ComponentType<ActiveLayoutEmptyStateProps>> | undefined
> = {
  [EIssuesStoreType.PROJECT]: ProjectEmptyState,
  [EIssuesStoreType.PROJECT_VIEW]: ProjectViewEmptyState,
  [EIssuesStoreType.ARCHIVED]: ProjectArchivedEmptyState,
  [EIssuesStoreType.ARCHIVED_EPIC]: ProjectArchivedEpicsEmptyState,
  [EIssuesStoreType.DEFAULT]: undefined,
  [EIssuesStoreType.WORKSPACE_DRAFT]: undefined,
  [EIssuesStoreType.CYCLE]: CycleEmptyState,
  [EIssuesStoreType.MODULE]: ModuleEmptyState,
  [EIssuesStoreType.GLOBAL]: GlobalViewEmptyState,
  [EIssuesStoreType.PROFILE]: ProfileViewEmptyState,
  [EIssuesStoreType.EPIC]: ProjectEpicsEmptyState,
  [EIssuesStoreType.TEAM]: TeamEmptyState,
  [EIssuesStoreType.TEAM_VIEW]: TeamViewEmptyState,
  [EIssuesStoreType.TEAM_PROJECT_WORK_ITEMS]: TeamProjectWorkItemEmptyState,
  [EIssuesStoreType.INITIATIVE_EPIC]: InitiativeScopeEpicsEmptyState,
  [EIssuesStoreType.RELEASE]: ReleaseEmptyState,
};

type TIssueLayoutEmptyStateProps = {
  workspaceSlug: string;
  storeType: EIssuesStoreType;
};

export const IssueLayoutEmptyState = observer(function IssueLayoutEmptyState(props: TIssueLayoutEmptyStateProps) {
  const { workspaceSlug, storeType } = props;
  // store hooks
  const { permissions: projectPermissions } = useProject();
  const { permissions: workItemPermissions } = useIssues(storeType);
  const { permissions: cyclePermissions } = useCycle();
  const { permissions: modulePermissions } = useModule();
  // derived values
  const allPermissions = {
    canCreateProject: projectPermissions.getCanCreate(workspaceSlug),
    canCreateWorkItem: (projectId: string) => workItemPermissions.getCanCreate(workspaceSlug, projectId),
    canClearFilters: true, // TODO: Need to verify why this feature was disabled in the first place, as all users can clear filters using the filter bar.
    canManageAutomations: (projectId: string) => projectPermissions.getCanManageAutomations(workspaceSlug, projectId),
    canAddWorkItemsToCycle: (projectId: string, cycleId: string) =>
      cyclePermissions.getCanAddWorkItemsToCycle(workspaceSlug, projectId, cycleId),
    canAddWorkItemsToModule: (projectId: string, moduleId: string) =>
      modulePermissions.getCanAddWorkItemsToModule(workspaceSlug, projectId, moduleId),
  };

  const WorkItemLayoutEmptyStateComponent = WORK_ITEM_LAYOUT_EMPTY_STATES[storeType];

  if (!WorkItemLayoutEmptyStateComponent) return <></>;
  return (
    <Suspense fallback={<div />}>
      <WorkItemLayoutEmptyStateComponent workspaceSlug={workspaceSlug} permissions={allPermissions} />
    </Suspense>
  );
});
