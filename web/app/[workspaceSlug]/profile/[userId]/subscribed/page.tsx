"use client";

// store
import { observer } from "mobx-react-lite";
// components
import { PageHead } from "@/components/core";
import { ProfileIssuesPage } from "@/components/profile/profile-issues";

const ProfileSubscribedIssuesPage = () => (
  <>
    <PageHead title="Profile - Subscribed" />
    <ProfileIssuesPage type="subscribed" />
  </>
);

export default observer(ProfileSubscribedIssuesPage);
