import React from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// components
import { ProfileIssuesListLayout } from "components/issues/issue-layouts/list/roots/profile-issues-root";
import { ProfileIssuesKanBanLayout } from "components/issues/issue-layouts/kanban/roots/profile-issues-root";
import { ProfileIssuesAppliedFiltersRoot } from "components/issues";
import { Spinner } from "@plane/ui";
// hooks
import { useIssues } from "hooks/store";
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

  const {
    issues: { loader, groupedIssueIds, fetchIssues },
    issuesFilter: { issueFilters, fetchFilters },
  } = useIssues(EIssuesStoreType.PROFILE);

  useSWR(
    workspaceSlug && userId ? `CURRENT_WORKSPACE_PROFILE_ISSUES_${workspaceSlug}_${userId}_${type}` : null,
    async () => {
      if (workspaceSlug && userId) {
        await fetchFilters(workspaceSlug, userId);
        await fetchIssues(workspaceSlug, userId, groupedIssueIds ? "mutation" : "init-loader", undefined, type);
      }
    }
  );

  const activeLayout = issueFilters?.displayFilters?.layout || undefined;

  return (
    <>
      {loader === "init-loader" ? (
        <div className="flex h-full w-full items-center justify-center">
          <Spinner />
        </div>
      ) : (
        <>
          <ProfileIssuesAppliedFiltersRoot />
          <div className="-z-1 relative h-full w-full overflow-auto">
            {activeLayout === "list" ? (
              <ProfileIssuesListLayout />
            ) : activeLayout === "kanban" ? (
              <ProfileIssuesKanBanLayout />
            ) : null}
          </div>
        </>
      )}
    </>
  );
});
