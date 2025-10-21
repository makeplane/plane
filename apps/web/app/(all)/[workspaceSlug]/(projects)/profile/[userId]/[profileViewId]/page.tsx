"use client";

import React from "react";
// components
import { PageHead } from "@/components/core/page-title";
import { ProfileIssuesPage } from "@/components/profile/profile-issues";

const ProfilePageHeader = {
  assigned: "Profile - Assigned",
  created: "Profile - Created",
  subscribed: "Profile - Subscribed",
};

function isValidProfileViewId(profileViewId: string): profileViewId is keyof typeof ProfilePageHeader {
  return profileViewId in ProfilePageHeader;
}

type ProfileIssuesTypePageProps = {
  params: {
    workspaceSlug: string;
    userId: string;
    profileViewId: string;
  };
};

function ProfileIssuesTypePage({ params }: ProfileIssuesTypePageProps) {
  const { profileViewId } = params;

  if (!isValidProfileViewId(profileViewId)) return null;

  const header = ProfilePageHeader[profileViewId];

  return (
    <>
      <PageHead title={header} />
      <ProfileIssuesPage type={profileViewId} />
    </>
  );
}

export default ProfileIssuesTypePage;
