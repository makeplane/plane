"use client";

import useSWR from "swr";
// components
import { PageHead } from "@/components/core";
import { ProfileSettingContentHeader, ProfileSettingContentWrapper } from "@/components/profile";
import { EmailNotificationForm } from "@/components/profile/notification";
import { EmailSettingsLoader } from "@/components/ui";
// services
import { UserService } from "@/services/user.service";

const userService = new UserService();

export default function ProfileNotificationPage() {
  // fetching user email notification settings
  const { data, isLoading } = useSWR("CURRENT_USER_EMAIL_NOTIFICATION_SETTINGS", () =>
    userService.currentUserEmailNotificationSettings()
  );

  if (!data || isLoading) {
    return <EmailSettingsLoader />;
  }

  return (
    <>
      <PageHead title="Profile - Notifications" />
      <ProfileSettingContentWrapper>
        <ProfileSettingContentHeader
          title="Email notifications"
          description="Stay in the loop on Issues you are subscribed to. Enable this to get notified."
        />
        <EmailNotificationForm data={data} />
      </ProfileSettingContentWrapper>
    </>
  );
}
