"use client";

import { useParams } from "next/navigation";
// components
import AppHeaderWrapper from "@/app/[workspaceSlug]/app-header-wrapper";
import UserProfileHeader from "../header";
import ProfileIssuesMobileHeader from "../mobile-header";

const ProfileHeader = () => {
  const { profileViewId } = useParams();

  return (
    <AppHeaderWrapper
      header={<UserProfileHeader type={profileViewId?.toString()} />}
      mobileHeader={<ProfileIssuesMobileHeader />}
    />
  );
};

export default ProfileHeader;
