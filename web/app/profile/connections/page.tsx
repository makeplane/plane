"use client";

// components
import { PageHead } from "@/components/core";
import { ProfileSettingContentHeader, ProfileSettingContentWrapper } from "@/components/profile";
import { UserConnectionsView } from "@/components/profile/connection/user-connections-view";

export default function ProfileNotificationPage({ searchParams }: { searchParams: { workspaceId: string } }) {
  return (
    <>
      <PageHead title="Profile - Connections" />
      <ProfileSettingContentWrapper>
        <ProfileSettingContentHeader title="Connections" description="Manage your workspace connections settings." />
        <UserConnectionsView workspaceId={searchParams?.workspaceId} />
      </ProfileSettingContentWrapper>
    </>
  );
}
