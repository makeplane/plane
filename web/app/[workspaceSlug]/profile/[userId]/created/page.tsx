"use client";

// store
import { observer } from "mobx-react-lite";
// components
import { PageHead } from "@/components/core";
import { ProfileIssuesPage } from "@/components/profile/profile-issues";

const ProfileCreatedIssuesPage = () => (
  <>
    <PageHead title="Profile - Created" />
    <ProfileIssuesPage type="created" />
  </>
);

export default observer(ProfileCreatedIssuesPage);
