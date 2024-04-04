import React, { ReactElement } from "react";
import { useRouter } from "next/router";
import { TProfileViews } from "@plane/types";
// layouts
import { PageHead } from "@/components/core";
import { UserProfileHeader } from "@/components/headers";
import { ProfileIssuesPage } from "@/components/profile/profile-issues";
import { AppLayout } from "@/layouts/app-layout";
import { ProfileAuthWrapper } from "@/layouts/user-profile-layout";
// components
// types
import { NextPageWithLayout } from "@/lib/types";

const ProfilePageHeader = {
  assigned: "Profile - Assigned",
  created: "Profile - Created",
  subscribed: "Profile - Subscribed",
};

const ProfileAssignedIssuesPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { profileViewId } = router.query;

  if (!profileViewId) return null;

  const profileView = profileViewId.toString() as TProfileViews;

  return (
    <>
      <PageHead title={ProfilePageHeader[profileView]} />
      <ProfileIssuesPage type={profileView} />
    </>
  );
};

ProfileAssignedIssuesPage.getLayout = function GetLayout(page: ReactElement) {
  const router = useRouter();
  const { profileViewId } = router.query;

  if (!profileViewId) return null;

  return (
    <AppLayout header={<UserProfileHeader type={profileViewId.toString()} />}>
      <ProfileAuthWrapper showProfileIssuesFilter>{page}</ProfileAuthWrapper>
    </AppLayout>
  );
};

export default ProfileAssignedIssuesPage;
