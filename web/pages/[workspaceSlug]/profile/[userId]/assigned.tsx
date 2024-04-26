import React, { ReactElement } from "react";
// layouts
import { PageHead } from "@/components/core";
import { UserProfileHeader } from "@/components/headers";
import { ProfileIssuesPage } from "@/components/profile/profile-issues";
import { AppLayout } from "@/layouts/app-layout";
import { ProfileAuthWrapper } from "@/layouts/user-profile-layout";
// components
// types
import { NextPageWithLayout } from "@/lib/types";

const ProfileAssignedIssuesPage: NextPageWithLayout = () => (
  <>
    <PageHead title="Profile - Assigned" />
    <ProfileIssuesPage type="assigned" />
  </>
);

ProfileAssignedIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<UserProfileHeader type="Assigned" />}>
      <ProfileAuthWrapper showProfileIssuesFilter>{page}</ProfileAuthWrapper>
    </AppLayout>
  );
};

export default ProfileAssignedIssuesPage;
