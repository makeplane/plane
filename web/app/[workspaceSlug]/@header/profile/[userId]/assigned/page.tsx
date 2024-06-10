"use client";

// components
import AppHeaderWrapper from "@/app/[workspaceSlug]/app-header-wrapper";
import UserProfileHeader from "../../../../profile/[userId]/header";
import ProfileIssuesMobileHeader from "../../../../profile/[userId]/mobile-header";

const ProfileAssignedHeader = () => (
  <AppHeaderWrapper header={<UserProfileHeader type="Assigned" />} mobileHeader={<ProfileIssuesMobileHeader />} />
);

export default ProfileAssignedHeader;
