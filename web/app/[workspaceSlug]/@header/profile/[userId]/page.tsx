"use client";

import AppHeaderWrapper from "@/app/[workspaceSlug]/app-header-wrapper";
import UserProfileHeader from "./header";

const ProfileOverviewHeader = () => <AppHeaderWrapper header={<UserProfileHeader type="Summary" />} />;

export default ProfileOverviewHeader;
