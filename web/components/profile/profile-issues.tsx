import React, { useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import useSWR from "swr";
// components
import { EmptyState } from "@/components/empty-state";
import { IssuePeekOverview, ProfileIssuesAppliedFiltersRoot } from "@/components/issues";
import { ProfileIssuesKanBanLayout } from "@/components/issues/issue-layouts/kanban/roots/profile-issues-root";
import { ProfileIssuesListLayout } from "@/components/issues/issue-layouts/list/roots/profile-issues-root";
import { KanbanLayoutLoader, ListLayoutLoader } from "@/components/ui";
// hooks
import { EMPTY_STATE_DETAILS } from "@/constants/empty-state";
import { EIssuesStoreType } from "@/constants/issue";
import { useIssues } from "@/hooks/store";
// constants

interface IProfileIssuesPage {
  type: "assigned" | "subscribed" | "created";
}

export const ProfileIssuesPage = observer((props: IProfileIssuesPage) => {
  const { type } = props;

  const router = useRouter();
  const { workspaceSlug, userId } = router.query as {
    workspaceSlug: string;
    userId: string;
  };
  // store hooks
  const {
    issues: { loader, groupedIssueIds, fetchIssues, setViewId },
    issuesFilter: { issueFilters, fetchFilters },
  } = useIssues(EIssuesStoreType.PROFILE);

  useEffect(() => {
    if (setViewId) setViewId(type);
  }, [type, setViewId]);

  useSWR(
    workspaceSlug && userId ? `CURRENT_WORKSPACE_PROFILE_ISSUES_${workspaceSlug}_${userId}_${type}` : null,
    async () => {
      if (workspaceSlug && userId) {
        await fetchFilters(workspaceSlug, userId);
        await fetchIssues(workspaceSlug, undefined, groupedIssueIds ? "mutation" : "init-loader", userId, type);
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const activeLayout = issueFilters?.displayFilters?.layout || undefined;

  const emptyStateType = `profile-${type}`;

  if (!groupedIssueIds || loader === "init-loader")
    return <>{activeLayout === "list" ? <ListLayoutLoader /> : <KanbanLayoutLoader />}</>;

  if (groupedIssueIds.length === 0) {
    return <EmptyState type={emptyStateType as keyof typeof EMPTY_STATE_DETAILS} size="sm" />;
  }

  return (
    <>
      <ProfileIssuesAppliedFiltersRoot />
      <div className="-z-1 relative h-full w-full overflow-auto">
        {activeLayout === "list" ? (
          <ProfileIssuesListLayout />
        ) : activeLayout === "kanban" ? (
          <ProfileIssuesKanBanLayout />
        ) : null}
      </div>
      {/* peek overview */}
      <IssuePeekOverview />
    </>
  );
});
