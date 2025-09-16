"use client";

// components
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SILO_ERROR_CODES } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/ui";
// components
import { PageHead } from "@/components/core/page-title";
import { SettingsHeading } from "@/components/settings/heading";
// plane web components
import { UserConnectionsView } from "@/plane-web/components/profile/user-connections-view";

export default function ProfileNotificationPage() {
  const { t } = useTranslation();
  const params = useSearchParams();
  const errorCode = params.get("error");

  useEffect(() => {
    if (!errorCode) {
      return;
    }

    const message = SILO_ERROR_CODES.find((code) => String(code.code) === errorCode)?.description;
    if (message) {
      setToast({
        title: "Error",
        message: t(`silo_errors.${message}`),
        type: TOAST_TYPE.ERROR,
      });
    }
  }, [errorCode, t]);

  return (
    <>
      <PageHead title="Profile - Connections" />
      <SettingsHeading
        title={t("account_settings.connections.heading")}
        description={t("account_settings.connections.description")}
      />
      <UserConnectionsView />
    </>
  );
}
