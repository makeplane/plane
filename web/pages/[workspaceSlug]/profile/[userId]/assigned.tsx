import React, { ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProfileAuthWrapper } from "layouts/user-profile-layout";
// components
import { UserProfileHeader } from "components/headers";
import { ProfileIssuesListLayout } from "components/issues/issue-layouts/list/roots/profile-issues-root";
import { ProfileIssuesKanBanLayout } from "components/issues/issue-layouts/kanban/roots/profile-issues-root";
import { Spinner } from "@plane/ui";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// types
import { NextPageWithLayout } from "types/app";

const ProfileAssignedIssuesPage: NextPageWithLayout = observer(() => {
  const router = useRouter();
  const { workspaceSlug, userId } = router.query as {
    workspaceSlug: string;
    userId: string;
  };

  const {
    workspaceProfileIssues: { loader, getIssues, fetchIssues },
    workspaceProfileIssuesFilter: { issueFilters, fetchFilters },
  }: RootStore = useMobxStore();

  useSWR(workspaceSlug ? `CURRENT_WORKSPACE_PROFILE_ISSUES_${workspaceSlug}` : null, async () => {
    if (workspaceSlug) {
      await fetchFilters(workspaceSlug);
      // await fetchIssues(workspaceSlug, getIssues ? "mutation" : "init-loader");
    }
  });

  console.log("issueFilters", issueFilters);

  const activeLayout = issueFilters?.displayFilters?.layout || undefined;

  return (
    <>
      {loader === "init-loader" ? (
        <div className="flex justify-center items-center w-full h-full">
          <Spinner />
        </div>
      ) : (
        <div className="w-full h-full relative overflow-auto -z-1">
          {activeLayout === "list" ? (
            <ProfileIssuesListLayout />
          ) : activeLayout === "kanban" ? (
            <ProfileIssuesKanBanLayout />
          ) : null}
        </div>
      )}
    </>
  );
});

ProfileAssignedIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<UserProfileHeader />}>
      <ProfileAuthWrapper showProfileIssuesFilter>{page}</ProfileAuthWrapper>
    </AppLayout>
  );
};

export default ProfileAssignedIssuesPage;
