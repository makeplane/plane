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
import useSWR from "swr";
// plane imports
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { EIssuesStoreType } from "@plane/types";
// components
import { ProjectLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/project-level";
import { WorkItemFiltersRowWrapper } from "@/components/work-item-filters/filters-row/wrapper";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";

// Lazy load peek overview
const EpicPeekOverview = lazy(() =>
  import("@/components/epics/peek-overview/root").then((module) => ({ default: module.EpicPeekOverview }))
);

// Lazy load layout component
const ArchivedEpicListLayout = lazy(() =>
  import("@/components/epics/epic-layouts/list/roots/archived-epic-root").then((module) => ({
    default: module.ArchivedEpicListLayout,
  }))
);

type TArchivedEpicLayoutRootProps = { workspaceSlug: string; projectId: string };

export const ArchivedEpicLayoutRoot = observer(function ArchivedEpicLayoutRoot(props: TArchivedEpicLayoutRootProps) {
  const { workspaceSlug, projectId } = props;
  // hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.ARCHIVED_EPIC);
  // derived values
  const workItemFilters = projectId ? issuesFilter?.getIssueFilters(projectId) : undefined;

  useSWR(
    workspaceSlug && projectId ? `ARCHIVED_EPICS_${workspaceSlug}_${projectId}` : null,
    async () => {
      if (workspaceSlug && projectId) {
        await issuesFilter?.fetchFilters(workspaceSlug, projectId);
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (!workItemFilters) return <></>;
  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.ARCHIVED_EPIC}>
      <ProjectLevelWorkItemFiltersHOC
        entityType={EIssuesStoreType.ARCHIVED_EPIC}
        entityId={projectId}
        filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.archived_epics.filters}
        initialWorkItemFilters={workItemFilters}
        updateFilters={issuesFilter?.updateAdvancedFilters.bind(issuesFilter, workspaceSlug, projectId)}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      >
        {({ filter }) => (
          <>
            <WorkItemFiltersRowWrapper filter={filter} />
            <div className="relative h-full w-full overflow-auto">
              <Suspense>
                <ArchivedEpicListLayout workspaceSlug={workspaceSlug} projectId={projectId} />
              </Suspense>
            </div>
            {/* peek overview */}
            <Suspense>
              <EpicPeekOverview />
            </Suspense>
          </>
        )}
      </ProjectLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
