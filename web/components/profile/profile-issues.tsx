import React, { useEffect } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
// components
import { ProfileIssuesListLayout } from "components/issues/issue-layouts/list/roots/profile-issues-root";
import { ProfileIssuesKanBanLayout } from "components/issues/issue-layouts/kanban/roots/profile-issues-root";
import { IssuePeekOverview, ProfileIssuesAppliedFiltersRoot } from "components/issues";
import { KanbanLayoutLoader, ListLayoutLoader } from "components/ui";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// hooks
import { useIssues, useUser } from "hooks/store";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";
import { EIssuesStoreType } from "constants/issue";
import { PROFILE_EMPTY_STATE_DETAILS } from "constants/empty-state";

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
  // theme
  const { resolvedTheme } = useTheme();
  // store hooks
  const {
    membership: { currentWorkspaceRole },
    currentUser,
  } = useUser();
  const {
    issues: { loader, groupedIssueIds, fetchIssues, setViewId },
    issuesFilter: { issueFilters, fetchFilters },
  } = useIssues(EIssuesStoreType.PROFILE);

  useEffect(() => {
    setViewId(type);
  }, [type]);

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

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const emptyStateImage = getEmptyStateImagePath("profile", type, isLightMode);

  const activeLayout = issueFilters?.displayFilters?.layout || undefined;

  const isEditingAllowed = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  if (!groupedIssueIds || loader === "init-loader")
    return <>{activeLayout === "list" ? <ListLayoutLoader /> : <KanbanLayoutLoader />}</>;

  if (groupedIssueIds.length === 0) {
    return (
      <EmptyState
        image={emptyStateImage}
        title={PROFILE_EMPTY_STATE_DETAILS[type].title}
        description={PROFILE_EMPTY_STATE_DETAILS[type].description}
        size="sm"
        disabled={!isEditingAllowed}
      />
    );
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
