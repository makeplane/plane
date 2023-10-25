import React from "react";

// layouts
import { AppLayout } from "layouts/app-layout";
import { ProfileAuthWrapper } from "layouts/profile-layout";
// components
import { UserProfileHeader } from "components/headers";
import { ProfileIssuesView } from "components/profile";
// types
import type { NextPage } from "next";

const ProfileSubscribedIssues: NextPage = () => (
  <AppLayout header={<UserProfileHeader />}>
    <ProfileAuthWrapper>
      <ProfileIssuesView />
    </ProfileAuthWrapper>
  </AppLayout>
);

export default ProfileSubscribedIssues;
