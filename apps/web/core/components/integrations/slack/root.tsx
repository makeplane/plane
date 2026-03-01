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
import { useParams } from "next/navigation";
import useSWR from "swr";
// Plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
// assets
import SlackLogo from "@/app/assets/services/slack.png?url";
// plane web components
import { ConnectedAppCard } from "@/components/integrations/slack";
import { InstallationCard, PersonalAccountInstallationCard } from "@/components/integrations/ui";
// hooks
import { useSlackIntegration } from "@/plane-web/hooks/store/integrations/use-slack";
import { ProjectUpdatesRoot } from "./sections";

export const SlackIntegrationRoot = observer(function SlackIntegrationRoot() {
  // router
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    isAppConnectionLoading,
    isUserConnectionLoading,
    isAppConnected,
    isUserConnected,
    appConnectionIds,
    getAppByConnectionId,
    fetchAppConnections,
    fetchUserConnectionStatus,
    connectApp,
    disconnectApp,
    connectUser,
    disconnectUser,
    setUserAlertsConfig,
  } = useSlackIntegration();
  const { t } = useTranslation();
  // derived values
  const firstAppConnectionId = appConnectionIds?.[0] ? getAppByConnectionId(appConnectionIds?.[0])?.id : null;
  // swr
  useSWR(
    workspaceSlug ? `SLACK_APP_CONNECTIONS_${workspaceSlug?.toString()}` : null,
    workspaceSlug ? async () => fetchAppConnections() : null,
    { errorRetryCount: 0, revalidateOnFocus: false, revalidateIfStale: false }
  );
  useSWR(
    workspaceSlug ? `SLACK_USER_CONNECTION_STATUS_${workspaceSlug?.toString()}` : null,
    workspaceSlug ? async () => fetchUserConnectionStatus() : null,
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
        message: error?.toString() || "Something went wrong while installing Slack app",
      });
    }
  };

  const handlePersonalAccountConnect = async () => {
    try {
      if (isUserConnected) {
        await disconnectUser();
      } else {
        const response = await connectUser();
        if (response) window.open(response, "_self");
        await setUserAlertsConfig({ isEnabled: true });
      }
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message:
          error?.toString() ||
          `Something went wrong while ${isUserConnected ? "disconnecting" : "connecting"} personal account`,
      });
    }
  };

  const handleAppDisconnect = async (connectionId: string) => {
    try {
      await disconnectApp(connectionId);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: error?.toString() || "Something went wrong while disconnecting Slack app",
      });
    }
  };

  return (
    <>
      {/* header */}
      <InstallationCard
        providerName={t("slack_integration.name")}
        providerDescription={t("slack_integration.description")}
        providerLogo={SlackLogo}
        isConnectionLoading={isAppConnectionLoading}
        isAppConnected={isAppConnected}
        handleInstallation={handleAppInstall}
      />
      {isAppConnected && (
        <PersonalAccountInstallationCard
          providerName="Slack"
          isConnectionLoading={isUserConnectionLoading}
          isUserConnected={isUserConnected}
          handleConnection={handlePersonalAccountConnect}
        />
      )}
      {/* List of connected workspaces */}
      {appConnectionIds && appConnectionIds.length > 0 && (
        <div className="flex-shrink-0 relative flex flex-col border-t border-subtle py-4 px-2">
          <div className="font-medium">{t("slack_integration.connected_slack_workspaces")}</div>
          <div className="w-full h-full flex flex-col gap-4 py-4">
            {appConnectionIds?.map((appId) => {
              const app = getAppByConnectionId(appId);
              if (!app) return null;
              return <ConnectedAppCard key={appId} data={app} handleDisconnect={handleAppDisconnect} />;
            })}
          </div>
          {firstAppConnectionId && <ProjectUpdatesRoot connectionId={firstAppConnectionId} />}
        </div>
      )}
    </>
  );
});
