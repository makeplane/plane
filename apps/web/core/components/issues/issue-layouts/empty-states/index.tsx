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
// plane web components
import { EIssuesStoreType } from "@plane/types";

// Lazy load empty state components
const ProjectEmptyState = lazy(() =>
  import("./project-issues").then((module) => ({ default: module.ProjectEmptyState }))
);
const ProjectViewEmptyState = lazy(() =>
  import("./project-view").then((module) => ({ default: module.ProjectViewEmptyState }))
);
const ProjectArchivedEmptyState = lazy(() =>
  import("./archived-issues").then((module) => ({ default: module.ProjectArchivedEmptyState }))
);
const ProjectArchivedEpicsEmptyState = lazy(() =>
  import("./archived-epics").then((module) => ({ default: module.ProjectArchivedEpicsEmptyState }))
);
const CycleEmptyState = lazy(() => import("./cycle").then((module) => ({ default: module.CycleEmptyState })));
const ModuleEmptyState = lazy(() => import("./module").then((module) => ({ default: module.ModuleEmptyState })));
const GlobalViewEmptyState = lazy(() =>
  import("./global-view").then((module) => ({ default: module.GlobalViewEmptyState }))
);
const ProfileViewEmptyState = lazy(() =>
  import("./profile-view").then((module) => ({ default: module.ProfileViewEmptyState }))
);
const ProjectEpicsEmptyState = lazy(() =>
  import("./project-epic").then((module) => ({ default: module.ProjectEpicsEmptyState }))
);
const InitiativeScopeEpicsEmptyState = lazy(() =>
  import("./initiative-scope-epic").then((module) => ({ default: module.InitiativeScopeEpicsEmptyState }))
);
const TeamEmptyState = lazy(() => import("./team-issues").then((module) => ({ default: module.TeamEmptyState })));
const TeamViewEmptyState = lazy(() =>
  import("./team-view-issues").then((module) => ({ default: module.TeamViewEmptyState }))
);
const TeamProjectWorkItemEmptyState = lazy(() =>
  import("./team-project").then((module) => ({ default: module.TeamProjectWorkItemEmptyState }))
);
const ReleaseEmptyState = lazy(() => import("./release").then((module) => ({ default: module.ReleaseEmptyState })));

const WORK_ITEM_LAYOUT_EMPTY_STATES: Record<EIssuesStoreType, LazyExoticComponent<ComponentType> | undefined> = {
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
  storeType: EIssuesStoreType;
};

export function IssueLayoutEmptyState(props: TIssueLayoutEmptyStateProps) {
  const WorkItemLayoutEmptyStateComponent: React.LazyExoticComponent<React.ComponentType> | undefined =
    WORK_ITEM_LAYOUT_EMPTY_STATES[props.storeType];

  if (!WorkItemLayoutEmptyStateComponent) return <></>;
  return (
    <Suspense fallback={<div />}>
      <WorkItemLayoutEmptyStateComponent />
    </Suspense>
  );
}
