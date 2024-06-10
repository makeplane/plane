"use client";

// components
import AppHeaderWrapper from "@/app/[workspaceSlug]/app-header-wrapper";
import UserProfileHeader from "../header";
import ProfileIssuesMobileHeader from "../mobile-header";

const ProfileAssignedHeader = () => (
  <AppHeaderWrapper header={<UserProfileHeader type="Assigned" />} mobileHeader={<ProfileIssuesMobileHeader />} />
);

export default ProfileAssignedHeader;
