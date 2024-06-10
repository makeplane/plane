"use client";

import React from "react";
import { useParams } from "next/navigation";
// components
import { PageHead } from "@/components/core";
import { ProfileIssuesPage } from "@/components/profile/profile-issues";

const ProfilePageHeader = {
  assigned: "Profile - Assigned",
  created: "Profile - Created",
  subscribed: "Profile - Subscribed",
};

const ProfileIssuesTypePage = () => {
  const { profileViewId } = useParams() as { profileViewId: "assigned" | "subscribed" | "created" | undefined };

  if (!profileViewId) return null;

  const header = ProfilePageHeader[profileViewId];

  return (
    <>
      <PageHead title={header} />
      <ProfileIssuesPage type={profileViewId} />
    </>
  );
};

export default ProfileIssuesTypePage;
