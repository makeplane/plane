"use client";

import React from "react";
import { useParams } from "next/navigation";
import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core";
import { ProfileIssuesPage } from "@/components/profile/profile-issues";

const ProfilePageHeader = {
  assigned: "Profile - Assigned",
  created: "Profile - Created",
  subscribed: "Profile - Subscribed",
};

const ProfileIssuesTypePage = observer(() => {
  const { profileViewId } = useParams() as { profileViewId: "assigned" | "subscribed" | "created" | undefined };

  if (!profileViewId) return null;

  const header = ProfilePageHeader[profileViewId];

  return (
    <>
      <PageHead title={header} />
      <ProfileIssuesPage type={profileViewId} />
    </>
  );
});

export default ProfileIssuesTypePage;
