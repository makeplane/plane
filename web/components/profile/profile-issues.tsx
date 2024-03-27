import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import { useRouter } from "next/router";
import useSWR from "swr";
// components
import { IssuePeekOverview, ProfileIssuesAppliedFiltersRoot } from "@/components/issues";
import { ProfileIssuesKanBanLayout } from "@/components/issues/issue-layouts/kanban/roots/profile-issues-root";
import { ProfileIssuesListLayout } from "@/components/issues/issue-layouts/list/roots/profile-issues-root";
// hooks
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
    issues: { setViewId },
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
      }
    },
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  const activeLayout = issueFilters?.displayFilters?.layout || undefined;

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
