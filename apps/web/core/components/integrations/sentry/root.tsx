/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { observer } from "mobx-react";
// ui
import { useParams } from "next/navigation";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// assets
import SentryLogo from "@/app/assets/services/sentry.svg?url";
// plane web components
import { ConnectedAppCard } from "@/components/integrations/sentry";
import { InstallationCard } from "@/components/integrations/ui";
// hooks
import { useSentryIntegration } from "@/plane-web/hooks/store/integrations/use-sentry";
// sections
import { SentryStateMappingRoot } from "./sections/state-mapping/root";
// assets

export const SentryIntegrationRoot = observer(function SentryIntegrationRoot() {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    isAppConnectionLoading,
    isAppConnected,
    appConnectionIds,
    getAppByConnectionId,
    fetchAppConnections,
    connectApp,
    disconnectApp,
  } = useSentryIntegration();
  const { t } = useTranslation();
  // swr
  useSWR(
    workspaceSlug ? `SENTRY_APP_CONNECTIONS_${workspaceSlug?.toString()}` : null,
    workspaceSlug ? async () => fetchAppConnections() : null,
    { errorRetryCount: 0, revalidateOnFocus: false, revalidateIfStale: false }
  );

  const handleAppInstall = async () => {
    try {
      const response = await connectApp();
      if (response) window.open(response, "_self");
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.toString() || "Something went wrong while installing Sentry app",
      });
    }
  };

  const handleAppDisconnect = async (connectionId: string) => {
    try {
      const response = await disconnectApp(connectionId);
      if (response) window.open(response, "_blank");
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.toString() || "Something went wrong while disconnecting Sentry app",
      });
    }
  };

  // Get the first app connection for state mapping
  const firstConnectionId = appConnectionIds?.[0];

  return (
    <>
      {/* header */}
      <InstallationCard
        providerName={t("sentry_integration.name")}
        providerDescription={t("sentry_integration.description")}
        providerLogo={SentryLogo}
        isConnectionLoading={isAppConnectionLoading}
        isAppConnected={isAppConnected}
        handleInstallation={handleAppInstall}
      />
      {/* List of connected workspaces */}
      {appConnectionIds && appConnectionIds.length > 0 && (
        <div className="flex-shrink-0 relative flex flex-col border-t border-subtle py-4 px-2">
          <div className="font-medium">{t("sentry_integration.connected_sentry_workspaces")}</div>
          <div className="w-full h-full flex flex-col gap-4 py-4">
            {appConnectionIds?.map((appId) => {
              const app = getAppByConnectionId(appId);
              if (!app) return null;
              return <ConnectedAppCard key={appId} data={app} handleDisconnect={handleAppDisconnect} />;
            })}
          </div>
          {firstConnectionId && <SentryStateMappingRoot connectionId={firstConnectionId} />}
        </div>
      )}
    </>
  );
});
