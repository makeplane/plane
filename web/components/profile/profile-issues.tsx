import React from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
import { useTheme } from "next-themes";
// components
import { ProfileIssuesListLayout } from "components/issues/issue-layouts/list/roots/profile-issues-root";
import { ProfileIssuesKanBanLayout } from "components/issues/issue-layouts/kanban/roots/profile-issues-root";
import { IssuePeekOverview, ProfileIssuesAppliedFiltersRoot } from "components/issues";
import { Spinner } from "@plane/ui";
import { EmptyState, getEmptyStateImagePath } from "components/empty-state";
// hooks
import { useIssues, useUser } from "hooks/store";
// constants
import { EUserWorkspaceRoles } from "constants/workspace";
import { PROFILE_EMPTY_STATE_DETAILS } from "constants/profile";
import { EIssuesStoreType } from "constants/issue";

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
    issues: { loader, groupedIssueIds, fetchIssues },
    issuesFilter: { issueFilters, fetchFilters },
  } = useIssues(EIssuesStoreType.PROFILE);

  useSWR(
    workspaceSlug && userId ? `CURRENT_WORKSPACE_PROFILE_ISSUES_${workspaceSlug}_${userId}_${type}` : null,
    async () => {
      if (workspaceSlug && userId) {
        await fetchFilters(workspaceSlug, userId);
        await fetchIssues(workspaceSlug, undefined, groupedIssueIds ? "mutation" : "init-loader", userId, type);
      }
    }
  );

  const isLightMode = resolvedTheme ? resolvedTheme === "light" : currentUser?.theme.theme === "light";
  const emptyStateImage = getEmptyStateImagePath("profile", type, isLightMode);

  const activeLayout = issueFilters?.displayFilters?.layout || undefined;

  const isEditingAllowed = !!currentWorkspaceRole && currentWorkspaceRole >= EUserWorkspaceRoles.MEMBER;

  return (
    <>
      {loader === "init-loader" ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          {groupedIssueIds ? (
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
          ) : (
            <EmptyState
              image={emptyStateImage}
              title={PROFILE_EMPTY_STATE_DETAILS[type].title}
              description={PROFILE_EMPTY_STATE_DETAILS[type].description}
              size="sm"
              disabled={!isEditingAllowed}
            />
          )}
        </>
      )}
    </>
  );
});
