"use client";

import useSWR from "swr";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { PageHead } from "@/components/core/page-title";
import { EmailNotificationForm } from "@/components/profile/notification/email-notification-form";
import { SettingsHeading } from "@/components/settings/heading";
import { EmailSettingsLoader } from "@/components/ui/loader/settings/email";
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
