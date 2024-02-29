import { ReactElement } from "react";
// store
import { observer } from "mobx-react-lite";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProfileAuthWrapper } from "layouts/user-profile-layout";
// components
import { UserProfileHeader } from "components/headers";
import { PageHead } from "components/core";
// types
import { NextPageWithLayout } from "lib/types";
import { ProfileIssuesPage } from "components/profile/profile-issues";

const ProfileCreatedIssuesPage: NextPageWithLayout = () => (
  <>
    <PageHead title="Profile - Created" />
    <ProfileIssuesPage type="created" />
  </>
);

ProfileCreatedIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<UserProfileHeader type="Created" />}>
      <ProfileAuthWrapper showProfileIssuesFilter>{page}</ProfileAuthWrapper>
    </AppLayout>
  );
};

export default observer(ProfileCreatedIssuesPage);
