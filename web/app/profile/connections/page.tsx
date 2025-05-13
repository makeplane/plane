"use client";

// components
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SILO_ERROR_CODES } from "@plane/etl/core";
import { useTranslation } from "@plane/i18n";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { PageHead } from "@/components/core";
import { ProfileSettingContentHeader, ProfileSettingContentWrapper } from "@/components/profile";
import { UserConnectionsView } from "@/components/profile/connection/user-connections-view";

export default function ProfileNotificationPage() {
  const { t } = useTranslation();
  const params = useSearchParams();
  const errorCode = params.get("error");
  const workspaceId = params.get("workspaceId");

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
        <UserConnectionsView workspaceId={workspaceId ?? ""} />
      </ProfileSettingContentWrapper>
    </>
  );
}
