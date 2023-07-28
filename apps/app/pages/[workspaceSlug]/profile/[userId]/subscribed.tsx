import React from "react";

// contexts
import { ProfileIssuesContextProvider } from "contexts/profile-issues-context";
// layouts
import { ProfileLayout } from "layouts/profile-layout";
// components
import { ProfileIssuesView } from "components/profile";
// types
import type { NextPage } from "next";

const ProfileSubscribedIssues: NextPage = () => (
  <ProfileIssuesContextProvider>
    <ProfileLayout>
      <ProfileIssuesView />
    </ProfileLayout>
  </ProfileIssuesContextProvider>
);

export default ProfileSubscribedIssues;
