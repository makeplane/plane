import React, { ReactElement } from "react";
import { observer } from "mobx-react-lite";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProfileAuthWrapper } from "layouts/user-profile-layout";
// components
import { UserProfileHeader } from "components/headers";
// types
import { NextPageWithLayout } from "types/app";
import { ProfileIssuesPage } from "components/profile/profile-issues";

const ProfileAssignedIssuesPage: NextPageWithLayout = observer(() => <ProfileIssuesPage type="assigned" />);

ProfileAssignedIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<UserProfileHeader />}>
      <ProfileAuthWrapper showProfileIssuesFilter>{page}</ProfileAuthWrapper>
    </AppLayout>
  );
};

export default ProfileAssignedIssuesPage;
