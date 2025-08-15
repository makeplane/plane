"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
// plane imports
import { SILO_ERROR_CODES } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/ui";
// components
import { PageHead } from "@/components/core/page-title";
import { ProfileSettingContentHeader } from "@/components/profile/profile-setting-content-header";
import { ProfileSettingContentWrapper } from "@/components/profile/profile-setting-content-wrapper";
// plane web imports
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
  }, [errorCode]);

  return (
    <>
      <PageHead title="Profile - Connections" />
      <ProfileSettingContentWrapper>
        <ProfileSettingContentHeader title="Connections" description="Manage your workspace connections settings." />
        <UserConnectionsView />
      </ProfileSettingContentWrapper>
    </>
  );
}
