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
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { EIssuesStoreType } from "@plane/types";
// components
import { ProjectLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/project-level";
// hooks
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";

// Lazy load peek overview
const WorkItemPeekOverview = lazy(() =>
  import("@/components/issues/peek-overview/root").then((module) => ({ default: module.IssuePeekOverview }))
);

// Lazy load layout component
const ArchivedIssueListLayout = lazy(() =>
  import("@/components/issues/issue-layouts/list/roots/archived-issue-root").then((module) => ({
    default: module.ArchivedIssueListLayout,
  }))
);

export const ArchivedIssueLayoutRoot = observer(function ArchivedIssueLayoutRoot() {
  // router
  const { workspaceSlug: routerWorkspaceSlug, projectId: routerProjectId } = useParams();
  const workspaceSlug = routerWorkspaceSlug ? routerWorkspaceSlug.toString() : undefined;
  const projectId = routerProjectId ? routerProjectId.toString() : undefined;
  // hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED);
  // derived values
  const workItemFilters = projectId ? issuesFilter?.getIssueFilters(projectId) : undefined;

  useSWR(
    workspaceSlug && projectId ? `ARCHIVED_ISSUES_${workspaceSlug.toString()}_${projectId.toString()}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await issuesFilter?.fetchFilters(workspaceSlug.toString(), projectId.toString());
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (!workspaceSlug || !projectId || !workItemFilters) return <></>;
  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.ARCHIVED}>
      <ProjectLevelWorkItemFiltersHOC
        entityType={EIssuesStoreType.ARCHIVED}
        entityId={projectId?.toString()}
        filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.archived_issues.filters}
        initialWorkItemFilters={workItemFilters}
        updateFilters={issuesFilter?.updateFilterExpression.bind(issuesFilter, workspaceSlug, projectId)}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      >
        {({ filter: archivedWorkItemsFilter }) => (
          <>
            {archivedWorkItemsFilter && <WorkItemFiltersRow filter={archivedWorkItemsFilter} />}
            <div className="relative h-full w-full overflow-auto">
              <Suspense>
                <ArchivedIssueListLayout />
              </Suspense>
            </div>
            {/* peek overview */}
            <Suspense>
              <WorkItemPeekOverview />
            </Suspense>
          </>
        )}
      </ProjectLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
