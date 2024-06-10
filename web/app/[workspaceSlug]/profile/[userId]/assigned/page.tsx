"use client";

import React from "react";
// components
import { PageHead } from "@/components/core";
import { ProfileIssuesPage } from "@/components/profile/profile-issues";

const ProfileAssignedIssuesPage = () => (
  <>
    <PageHead title="Profile - Assigned" />
    <ProfileIssuesPage type="assigned" />
  </>
);

export default ProfileAssignedIssuesPage;
