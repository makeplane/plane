"use client";

// components
import AppHeaderWrapper from "@/app/[workspaceSlug]/app-header-wrapper";
import UserProfileHeader from "../header";
import ProfileIssuesMobileHeader from "../mobile-header";

const ProfileSubscribedHeader = () => (
  <AppHeaderWrapper header={<UserProfileHeader type="Subscribed" />} mobileHeader={<ProfileIssuesMobileHeader />} />
);

export default ProfileSubscribedHeader;
