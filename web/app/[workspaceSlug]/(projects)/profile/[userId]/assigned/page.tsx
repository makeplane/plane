"use client";

import React from "react";
import { observer } from "mobx-react";
// components
import { PageHead } from "@/components/core";
import { ProfileIssuesPage } from "@/components/profile/profile-issues";

const ProfileAssignedIssuesPage = observer(() => (
  <>
    <PageHead title="Profile - Assigned" />
    <ProfileIssuesPage type="assigned" />
  </>
));

export default ProfileAssignedIssuesPage;
