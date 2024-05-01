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

const ProfileSubscribedIssuesPage: NextPageWithLayout = () => (
  <>
    <PageHead title="Profile - Subscribed" />
    <ProfileIssuesPage type="subscribed" />
  </>
);

ProfileSubscribedIssuesPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AppLayout header={<UserProfileHeader type="Subscribed" />} mobileHeader={<ProfileIssuesMobileHeader />}>
      <ProfileAuthWrapper showProfileIssuesFilter>{page}</ProfileAuthWrapper>
    </AppLayout>
  );
};

export default observer(ProfileSubscribedIssuesPage);
