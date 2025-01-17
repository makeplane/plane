"use client";

import useSWR from "swr";
// components
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core";
import { ProfileSettingContentHeader, ProfileSettingContentWrapper } from "@/components/profile";
import { EmailNotificationForm } from "@/components/profile/notification";
import { EmailSettingsLoader } from "@/components/ui";
// services
import { UserService } from "@/services/user.service";

const userService = new UserService();

export default function ProfileNotificationPage() {
  const { t } = useTranslation();
  // fetching user email notification settings
  const { data, isLoading } = useSWR("CURRENT_USER_EMAIL_NOTIFICATION_SETTINGS", () =>
    userService.currentUserEmailNotificationSettings()
  );

  if (!data || isLoading) {
    return <EmailSettingsLoader />;
  }

  return (
    <>
      <PageHead title={`${t("profile.label")} - ${t("notifications")}`} />
      <ProfileSettingContentWrapper>
        <ProfileSettingContentHeader
          title={t("email_notifications")}
          description={t("stay_in_the_loop_on_issues_you_are_subscribed_to_enable_this_to_get_notified")}
        />
        <EmailNotificationForm data={data} />
      </ProfileSettingContentWrapper>
    </>
  );
}
