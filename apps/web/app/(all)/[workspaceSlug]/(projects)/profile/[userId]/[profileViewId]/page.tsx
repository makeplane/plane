"use client";

import React from "react";
import type { Route } from "./+types/page";
// components
import { PageHead } from "@/components/core/page-title";
import { ProfileIssuesPage } from "@/components/profile/profile-issues";

const ProfilePageHeader = {
  assigned: "Profile - Assigned",
  created: "Profile - Created",
  subscribed: "Profile - Subscribed",
};

function isValidProfileViewId(viewId: string): viewId is keyof typeof ProfilePageHeader {
  return viewId in ProfilePageHeader;
}

export default function ProfileIssuesTypePage({ params }: Route.ComponentProps) {
  const { profileViewId } = params;

  if (!isValidProfileViewId(profileViewId)) {
    return null;
  }

  const header = ProfilePageHeader[profileViewId];

  return (
    <>
      <PageHead title={header} />
      <ProfileIssuesPage type={profileViewId} />
    </>
  );
};
