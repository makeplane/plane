"use client";

// components
import AppHeaderWrapper from "@/app/[workspaceSlug]/app-header-wrapper";
import UserProfileHeader from "../header";
import ProfileIssuesMobileHeader from "../mobile-header";

const ProfileCreatedHeader = () => (
  <AppHeaderWrapper header={<UserProfileHeader type="Created" />} mobileHeader={<ProfileIssuesMobileHeader />} />
);

export default ProfileCreatedHeader;
