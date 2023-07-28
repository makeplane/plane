import React from "react";

import { useRouter } from "next/router";

// contexts
import { ProfileIssuesContextProvider } from "contexts/profile-issues-context";
// hooks
import useUser from "hooks/use-user";
// layouts
import { WorkspaceAuthorizationLayout } from "layouts/auth-layout";
// components
import { ProfileIssuesView, ProfileNavbar, ProfileSidebar } from "components/profile";
// ui
import { BreadcrumbItem, Breadcrumbs } from "components/breadcrumbs";
// types
import type { NextPage } from "next";

const ProfileSubscribedIssues: NextPage = () => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUser();

  return (
    <ProfileIssuesContextProvider>
      <WorkspaceAuthorizationLayout
        breadcrumbs={
          <Breadcrumbs>
            <BreadcrumbItem title="Settings" link={`/${workspaceSlug}/me/profile`} />
            <BreadcrumbItem title={`${user?.first_name} ${user?.last_name}`} />
          </Breadcrumbs>
        }
      >
        <div className="h-full w-full flex overflow-hidden">
          <div className="h-full w-full flex flex-col overflow-hidden">
            <ProfileNavbar />
            <div className="h-full w-full flex flex-col overflow-hidden">
              <ProfileIssuesView />
            </div>
          </div>
          <ProfileSidebar />
        </div>
      </WorkspaceAuthorizationLayout>
    </ProfileIssuesContextProvider>
  );
};

export default ProfileSubscribedIssues;
