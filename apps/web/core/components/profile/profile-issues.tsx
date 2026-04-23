/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import type { IWorkItemFilterInstance } from "@plane/shared-state";
import { EIssuesStoreType, EQUALITY_OPERATOR, LOGICAL_OPERATOR } from "@plane/types";
// components
import { ProfileIssuesKanBanLayout } from "@/components/issues/issue-layouts/kanban/roots/profile-issues-root";
import { ProfileIssuesListLayout } from "@/components/issues/issue-layouts/list/roots/profile-issues-root";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { WorkspaceLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/workspace-level";
import { WorkItemFiltersRow } from "@/components/work-item-filters/filters-row";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";

type Props = {
  type: "assigned" | "subscribed" | "created";
  extraFilterRowActions?: React.ReactNode;
};

/** Ensures start_date and target_date filter chips are always present */
const ProfileIssuesInitFilters = observer(function ProfileIssuesInitFilters({
  filter,
}: {
  filter: IWorkItemFilterInstance;
}) {
  useEffect(() => {
    const conditions = filter.allConditionsForDisplay;
    const hasStartDate = conditions.some((c) => c.property === "start_date");
    const hasTargetDate = conditions.some((c) => c.property === "target_date");

    if (!hasStartDate) {
      filter.addCondition(
        LOGICAL_OPERATOR.AND,
        { property: "start_date", operator: EQUALITY_OPERATOR.EXACT, value: undefined },
        false
      );
    }
    if (!hasTargetDate) {
      filter.addCondition(
        LOGICAL_OPERATOR.AND,
        { property: "target_date", operator: EQUALITY_OPERATOR.EXACT, value: undefined },
        false
      );
    }
  }, [filter]);

  return null;
});

export const ProfileIssuesPage = observer(function ProfileIssuesPage(props: Props) {
  const { type, extraFilterRowActions } = props;
  const { workspaceSlug, userId } = useParams();
  // store hooks
  const {
    issues: { setViewId },
    issuesFilter: { issueFilters, fetchFilters, updateFilterExpression },
  } = useIssues(EIssuesStoreType.PROFILE);
  // derived values
  const activeLayout = issueFilters?.displayFilters?.layout || undefined;

  useEffect(() => {
    if (setViewId) setViewId(type);
  }, [type, setViewId]);

  void useSWR(
    workspaceSlug && userId ? `CURRENT_WORKSPACE_PROFILE_ISSUES_${workspaceSlug}_${userId}` : null,
    async () => {
      if (workspaceSlug && userId) {
        await fetchFilters(workspaceSlug, userId);
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  return (
    <IssuesStoreContext.Provider value={EIssuesStoreType.PROFILE}>
      <WorkspaceLevelWorkItemFiltersHOC
        entityId={userId}
        entityType={EIssuesStoreType.PROFILE}
        filtersToShowByLayout={ISSUE_DISPLAY_FILTERS_BY_PAGE.profile_issues.filters}
        initialWorkItemFilters={issueFilters}
        updateFilters={updateFilterExpression.bind(updateFilterExpression, workspaceSlug, userId)}
        workspaceSlug={workspaceSlug}
        showOnMount
      >
        {({ filter: profileWorkItemsFilter }) => (
          <>
            {profileWorkItemsFilter && <ProfileIssuesInitFilters filter={profileWorkItemsFilter} />}
            <div className="flex flex-col h-full w-full">
              {profileWorkItemsFilter && (
                <WorkItemFiltersRow filter={profileWorkItemsFilter} extraRightActions={extraFilterRowActions} />
              )}
              <div className="relative h-full w-full overflow-auto">
                {activeLayout === "list" ? (
                  <ProfileIssuesListLayout />
                ) : activeLayout === "kanban" ? (
                  <ProfileIssuesKanBanLayout />
                ) : null}
              </div>
            </div>
            <IssuePeekOverview />
          </>
        )}
      </WorkspaceLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
