"use client";

import useSWR from "swr";
// components
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core";
import { EmailNotificationForm } from "@/components/profile/notification";
import { SettingsHeading } from "@/components/settings";
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

      <SettingsHeading
        title={t("account_settings.notifications.heading")}
        description={t("account_settings.notifications.description")}
      />
      <EmailNotificationForm data={data} />
    </>
  );
}
