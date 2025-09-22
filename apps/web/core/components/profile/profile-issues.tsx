import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
// plane imports
import { ISSUE_DISPLAY_FILTERS_BY_PAGE } from "@plane/constants";
import { EIssuesStoreType } from "@plane/types";
// components
import { ProfileIssuesKanBanLayout } from "@/components/issues/issue-layouts/kanban/roots/profile-issues-root";
import { ProfileIssuesListLayout } from "@/components/issues/issue-layouts/list/roots/profile-issues-root";
import { IssuePeekOverview } from "@/components/issues/peek-overview";
import { WorkspaceLevelWorkItemFiltersHOC } from "@/components/work-item-filters/filters-hoc/workspace-level";
import { WorkItemFiltersRow } from "@/components/work-item-filters/work-item-filters-row";
// hooks
import { useIssues } from "@/hooks/store/use-issues";
import { IssuesStoreContext } from "@/hooks/use-issue-layout-store";

type Props = {
  type: "assigned" | "subscribed" | "created";
};

export const ProfileIssuesPage = observer((props: Props) => {
  const { type } = props;
  const { workspaceSlug, userId } = useParams() as {
    workspaceSlug: string;
    userId: string;
  };
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

  useSWR(
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
      >
        {({ filter: profileWorkItemsFilter }) => (
          <>
            <div className="flex flex-col h-full w-full">
              {profileWorkItemsFilter && <WorkItemFiltersRow filter={profileWorkItemsFilter} />}
              <div className="-z-1 relative h-full w-full overflow-auto">
                {activeLayout === "list" ? (
                  <ProfileIssuesListLayout />
                ) : activeLayout === "kanban" ? (
                  <ProfileIssuesKanBanLayout />
                ) : null}
              </div>
            </div>
            {/* peek overview */}
            <IssuePeekOverview />
          </>
        )}
      </WorkspaceLevelWorkItemFiltersHOC>
    </IssuesStoreContext.Provider>
  );
});
