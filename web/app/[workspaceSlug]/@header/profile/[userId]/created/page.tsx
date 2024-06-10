"use client";

// components
import AppHeaderWrapper from "@/app/[workspaceSlug]/app-header-wrapper";
import UserProfileHeader from "../../../../profile/[userId]/header";
import ProfileIssuesMobileHeader from "../../../../profile/[userId]/mobile-header";

const ProfileCreatedHeader = () => (
  <AppHeaderWrapper header={<UserProfileHeader type="Created" />} mobileHeader={<ProfileIssuesMobileHeader />} />
);

export default ProfileCreatedHeader;
