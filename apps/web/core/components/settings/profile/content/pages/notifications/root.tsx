import useSWR from "swr";
import { observer } from "mobx-react";
// plane imports
import { useTranslation } from "@plane/i18n";
// components
import { ProfileSettingsHeading } from "@/components/settings/profile/heading";
import { EmailSettingsLoader } from "@/components/ui/loader/settings/email";
// services
import { UserService } from "@/services/user.service";
// local imports
import { NotificationsProfileSettingsForm } from "./email-notification-form";

const userService = new UserService();

export const NotificationsProfileSettings = observer(function NotificationsProfileSettings() {
  const { t } = useTranslation();
  // fetching user email notification settings
  const { data, isLoading } = useSWR("CURRENT_USER_EMAIL_NOTIFICATION_SETTINGS", () =>
    userService.currentUserEmailNotificationSettings()
  );

  if (!data || isLoading) {
    return <EmailSettingsLoader />;
  }

  return (
    <div className="size-full">
      <ProfileSettingsHeading
        title={t("account_settings.notifications.heading")}
        description={t("account_settings.notifications.description")}
      />
      <div className="mt-7">
        <NotificationsProfileSettingsForm data={data} />
      </div>
    </div>
  );
});
