"use client";

import AppHeaderWrapper from "@/app/[workspaceSlug]/app-header-wrapper";
import UserProfileHeader from "../../../../profile/[userId]/header";

const ProfileActivityHeader = () => <AppHeaderWrapper header={<UserProfileHeader type="Activity" />} />;

export default ProfileActivityHeader;
