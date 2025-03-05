"use client";

import { observer } from "mobx-react";
// components
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { PageHead } from "@/components/core";
// hooks
import { InboxSettingsContentHeader, InboxSettingsRoot, InboxSettingContentWrapper } from "@/components/inbox/settings";
import { EmailSettingsLoader } from "@/components/ui";
import { NOTIFICATION_SETTINGS } from "@/constants/fetch-keys";
import { useWorkspaceNotificationSettings } from "@/hooks/store";

const NotificationsSettingsPage = observer(() => {
  // store hooks
  const { workspace: currentWorkspace, fetchWorkspaceUserNotificationSettings } = useWorkspaceNotificationSettings();
  const { t } = useTranslation();
  // derived values
  const pageTitle = currentWorkspace?.name
    ? t("notification_settings.page_label", { workspace: currentWorkspace.name })
    : undefined;


  const { data, isLoading } = useSWR(currentWorkspace?.slug ? NOTIFICATION_SETTINGS(currentWorkspace?.slug) : null, () => fetchWorkspaceUserNotificationSettings());

  if (!data || isLoading) {
    return <EmailSettingsLoader />;
  }

  return (
    <>
      <PageHead title={pageTitle} />
      <InboxSettingContentWrapper>
        <InboxSettingsContentHeader
          title={t("notification_settings.inbox_settings")}
          description={t("notification_settings.inbox_settings_description")}
        />
        <InboxSettingsRoot />
      </InboxSettingContentWrapper>
    </>
  );
});

export default NotificationsSettingsPage;
