import { ReactElement } from "react";
// store
import { observer } from "mobx-react-lite";
// layouts
import { AppLayout } from "layouts/app-layout";
import { ProfileAuthWrapper } from "layouts/user-profile-layout";
// components
import { UserProfileHeader } from "components/headers";
// types
import { NextPageWithLayout } from "lib/types";
import { ProfileIssuesPage } from "components/profile/profile-issues";

const ProfileCreatedIssuesPage: NextPageWithLayout = () => <ProfileIssuesPage type="created" />;

ProfileCreatedIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<UserProfileHeader />}>
      <ProfileAuthWrapper showProfileIssuesFilter>{page}</ProfileAuthWrapper>
    </AppLayout>
  );
};

export default observer(ProfileCreatedIssuesPage);
