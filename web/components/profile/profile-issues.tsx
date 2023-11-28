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
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";

interface IProfileIssuesPage {
  type: "assigned" | "subscribed" | "created";
}

export const ProfileIssuesPage = observer((props: IProfileIssuesPage) => {
  const router = useRouter();
  const { workspaceSlug, userId } = router.query as {
    workspaceSlug: string;
    userId: string;
  };

  const {
    workspaceProfileIssues: { loader, getIssues, fetchIssues },
    workspaceProfileIssuesFilter: { issueFilters, fetchFilters },
  }: RootStore = useMobxStore();

  useSWR(
    workspaceSlug && userId ? `CURRENT_WORKSPACE_PROFILE_ISSUES_${workspaceSlug}_${userId}_${props.type}` : null,
    async () => {
      if (workspaceSlug && userId) {
        await fetchFilters(workspaceSlug);
        await fetchIssues(workspaceSlug, userId, getIssues ? "mutation" : "init-loader", props.type);
      }
    }
  );

  const activeLayout = issueFilters?.displayFilters?.layout || undefined;

  return (
    <>
      {loader === "init-loader" ? (
        <div className="flex justify-center items-center w-full h-full">
          <Spinner />
        </div>
      ) : (
        <>
          <ProfileIssuesAppliedFiltersRoot />
          <div className="w-full h-full relative overflow-auto -z-1">
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
