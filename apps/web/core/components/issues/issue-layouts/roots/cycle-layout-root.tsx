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

import { lazy, Suspense, useState } from "react";
import type { ComponentType, LazyExoticComponent } from "react";
import { isEmpty } from "lodash-es";
import { observer } from "mobx-react";
import { useParams } from "react-router";
import useSWR from "swr";
// plane constants
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { EIssuesStoreType, EIssueLayoutTypes } from "@plane/types";
// components
import { TransferIssues } from "@/components/cycles/transfer-issues";
import { TransferIssuesModal } from "@/components/cycles/transfer-issues-modal";
import { ProjectLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/project-level";
import { WorkItemFiltersRowWrapper } from "@/components/work-item-filters/filters-row/wrapper";
// hooks
import { useCycle } from "@/hooks/store/use-cycle";
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";

// Lazy load peek overview
const WorkItemPeekOverview = lazy(() =>
  import("@/components/issues/peek-overview/root").then((module) => ({ default: module.IssuePeekOverview }))
);

// Lazy load layout components
const CycleListLayout = lazy(() =>
  import("@/components/issues/issue-layouts/list/roots/cycle-root").then((module) => ({
    default: module.CycleListLayout,
  }))
);
const CycleKanBanLayout = lazy(() =>
  import("@/components/issues/issue-layouts/board/roots/cycle-root").then((module) => ({
    default: module.CycleKanBanLayout,
  }))
);
const CycleCalendarLayout = lazy(() =>
  import("@/components/issues/issue-layouts/calendar/roots/cycle-root").then((module) => ({
    default: module.CycleCalendarLayout,
  }))
);
const CycleTimelineLayout = lazy(() =>
  import("@/components/issues/issue-layouts/timeline/roots/cycle-root").then((module) => ({
    default: module.CycleTimelineLayout,
  }))
);
const CycleSpreadsheetLayout = lazy(() =>
  import("@/components/issues/issue-layouts/table/roots/cycle-root").then((module) => ({
    default: module.CycleSpreadsheetLayout,
  }))
);

type ActiveLayoutProps = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
};

// Layout components map
const CYCLE_WORK_ITEM_LAYOUTS: Record<EIssueLayoutTypes, LazyExoticComponent<ComponentType<ActiveLayoutProps>>> = {
  [EIssueLayoutTypes.LIST]: CycleListLayout,
  [EIssueLayoutTypes.KANBAN]: CycleKanBanLayout,
  [EIssueLayoutTypes.CALENDAR]: CycleCalendarLayout,
  [EIssueLayoutTypes.SPREADSHEET]: CycleSpreadsheetLayout,
  [EIssueLayoutTypes.GANTT]: CycleTimelineLayout,
};

type CycleWorkItemLayoutProps = {
  workspaceSlug: string;
  projectId: string;
  cycleId: string;
  activeLayout: EIssueLayoutTypes | undefined;
};

function CycleIssueLayout(props: CycleWorkItemLayoutProps) {
  if (!props.activeLayout) return null;

  const CycleIssueLayoutComponent = CYCLE_WORK_ITEM_LAYOUTS[props.activeLayout];
  if (!CycleIssueLayoutComponent) return null;
  return (
    <Suspense>
      <CycleIssueLayoutComponent
        workspaceSlug={props.workspaceSlug}
        projectId={props.projectId}
        cycleId={props.cycleId}
      />
    </Suspense>
  );
}

export const CycleLayoutRoot = observer(function CycleLayoutRoot() {
  const { workspaceSlug, projectId, cycleId } = useParams();
  // store hooks
  const { issuesFilter } = useIssues(EIssuesStoreType.CYCLE);
  const { getCycleById, permissions } = useCycle();
  // state
  const [transferIssuesModal, setTransferIssuesModal] = useState(false);
  // derived values
  const workItemFilters = cycleId ? issuesFilter?.getIssueFilters(cycleId) : undefined;
  const activeLayout = workItemFilters?.displayFilters?.layout;

  useSWR(
    workspaceSlug && projectId && cycleId ? `CYCLE_ISSUES_${workspaceSlug}_${projectId}_${cycleId}` : null,
    async () => {
      if (workspaceSlug && projectId && cycleId) {
        await issuesFilter?.fetchFilters(workspaceSlug, projectId, cycleId);
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const cycleDetails = cycleId ? getCycleById(cycleId) : undefined;
  const cycleStatus = cycleDetails?.status?.toLocaleLowerCase() ?? "draft";
  const isProgressSnapshotEmpty = isEmpty(cycleDetails?.progress_snapshot);
  const transferableIssuesCount = cycleDetails
    ? (cycleDetails.total_issues ?? 0) - (cycleDetails.completed_issues ?? 0) - (cycleDetails.cancelled_issues ?? 0)
    : 0;

  if (!workspaceSlug || !projectId || !cycleId || !workItemFilters) return null;

  // auth
  const canTransferWorkItems =
    isProgressSnapshotEmpty &&
    transferableIssuesCount > 0 &&
    permissions.getCanTransferWorkItemsFromCycle(workspaceSlug, projectId, cycleId);

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.CYCLE}>
      <ProjectLevelWorkItemFiltersHOC
        enableSaveView
        entityType={EIssuesStoreType.CYCLE}
        entityId={cycleId}
        filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.issues.filters}
        initialWorkItemFilters={workItemFilters}
        updateFilters={issuesFilter?.updateAdvancedFilters.bind(issuesFilter, workspaceSlug, projectId, cycleId)}
        projectId={projectId}
        workspaceSlug={workspaceSlug}
      >
        {({ filter }) => (
          <>
            <TransferIssuesModal
              handleClose={() => setTransferIssuesModal(false)}
              cycleId={cycleId}
              isOpen={transferIssuesModal}
            />
            <div className="relative flex h-full w-full flex-col overflow-hidden">
              {cycleStatus === "completed" && (
                <TransferIssues
                  handleClick={() => setTransferIssuesModal(true)}
                  canTransferWorkItems={canTransferWorkItems}
                />
              )}
              <WorkItemFiltersRowWrapper filter={filter} />
              <div className="h-full w-full overflow-auto">
                <CycleIssueLayout
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  cycleId={cycleId}
                  activeLayout={activeLayout}
                />
              </div>
              {/* peek overview */}
              <Suspense>
                <WorkItemPeekOverview />
              </Suspense>
            </div>
          </>
        )}
      </ProjectLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
