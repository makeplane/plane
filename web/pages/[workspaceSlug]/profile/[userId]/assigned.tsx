import React, { ReactElement } from "react";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProfileAuthWrapper } from "layouts/user-profile-layout";
// components
import { UserProfileHeader } from "components/headers";
import { PageHead } from "components/core";
// types
import { NextPageWithLayout } from "lib/types";
import { ProfileIssuesPage } from "components/profile/profile-issues";

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
