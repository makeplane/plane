import { ReactElement } from "react";
// store
import { observer } from "mobx-react-lite";
// components
import { PageHead } from "@/components/core";
import { UserProfileHeader } from "@/components/headers";
import { ProfileIssuesPage } from "@/components/profile/profile-issues";
import ProfileIssuesMobileHeader from "@/components/profile/profile-issues-mobile-header";
// layouts
import { AppLayout } from "@/layouts/app-layout";
import { ProfileAuthWrapper } from "@/layouts/user-profile-layout";
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
    <AppLayout header={<UserProfileHeader type="Created" />} mobileHeader={<ProfileIssuesMobileHeader />}>
      <ProfileAuthWrapper showProfileIssuesFilter>{page}</ProfileAuthWrapper>
    </AppLayout>
  );
};

export default observer(ProfileCreatedIssuesPage);
