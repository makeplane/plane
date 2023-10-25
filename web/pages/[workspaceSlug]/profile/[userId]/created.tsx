import React from "react";

// contexts
import { ProfileIssuesContextProvider } from "contexts/profile-issues-context";
// layouts
import { ProfileAuthWrapper } from "layouts/profile-layout/layout";
// components
import { ProfileIssuesView } from "components/profile";
// types
import type { NextPage } from "next";

const ProfileCreatedIssues: NextPage = () => (
  <ProfileIssuesContextProvider>
    <ProfileAuthWrapper>
      <ProfileIssuesView />
    </ProfileAuthWrapper>
  </ProfileIssuesContextProvider>
);

export default ProfileCreatedIssues;
