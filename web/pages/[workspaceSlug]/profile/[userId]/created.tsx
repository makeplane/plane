import { ReactElement } from "react";
// store
import { observer } from "mobx-react-lite";
// layouts
import { PageHead } from "@/components/core";
import { UserProfileHeader } from "@/components/headers";
import { ProfileIssuesPage } from "@/components/profile/profile-issues";
import { AppLayout } from "@/layouts/app-layout";
import { ProfileAuthWrapper } from "@/layouts/user-profile-layout";
// components
// types
import { NextPageWithLayout } from "@/lib/types";

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
