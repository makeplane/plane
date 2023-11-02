import React, { ReactElement } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProfileAuthWrapper } from "layouts/profile-layout";
// components
import { UserProfileHeader } from "components/headers";
import { ProfileIssuesListLayout } from "components/issues/issue-layouts/list/roots/profile-issues-root";
import { ProfileIssuesKanBanLayout } from "components/issues/issue-layouts/kanban/roots/profile-issues-root";
// hooks
import { useMobxStore } from "lib/mobx/store-provider";
import { RootStore } from "store/root";
// types
import { NextPageWithLayout } from "types/app";

const ProfileAssignedIssuesPage: NextPageWithLayout = observer(() => {
  const {
    workspace: workspaceStore,
    project: projectStore,
    profileIssueFilters: profileIssueFiltersStore,
    profileIssues: profileIssuesStore,
  }: RootStore = useMobxStore();

  const router = useRouter();
  const { workspaceSlug, userId } = router.query as {
    workspaceSlug: string;
    userId: string;
  };

  const { isLoading } = useSWR(`PROFILE_ISSUES_${workspaceSlug}_${userId}`, async () => {
    if (workspaceSlug && userId) {
      // workspace labels
      workspaceStore.setWorkspaceSlug(workspaceSlug);
      await workspaceStore.fetchWorkspaceLabels(workspaceSlug);
      await projectStore.fetchProjects(workspaceSlug);

      //profile issues
      await profileIssuesStore.fetchIssues(workspaceSlug, userId, "assigned");
    }
  });

  const activeLayout = profileIssueFiltersStore.userDisplayFilters.layout;

  return (
    <>
      {isLoading ? (
        <div>Loading...</div>
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
