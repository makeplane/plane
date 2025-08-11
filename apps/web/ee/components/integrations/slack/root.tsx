import { observer } from "mobx-react";
// ui
import { useParams } from "next/navigation";
import useSWR from "swr";
import { INTEGRATION_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/ui";
// plane web components
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { ConnectedAppCard } from "@/plane-web/components/integrations/slack";
import { InstallationCard, PersonalAccountInstallationCard } from "@/plane-web/components/integrations/ui";
// hooks
import { useSlackIntegration } from "@/plane-web/hooks/store/integrations/use-slack";
// assets
import SlackLogo from "@/public/services/slack.png";
import { ProjectUpdatesRoot } from "./sections";

export const SlackIntegrationRoot = observer(() => {
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
      captureSuccess({
        eventName: INTEGRATION_TRACKER_EVENTS.integration_started,
        payload: {
          type: "SLACK_APP",
        },
      });
      if (response) window.open(response, "_self");
    } catch (error) {
      captureError({
        eventName: INTEGRATION_TRACKER_EVENTS.integration_started,
        payload: {
          type: "SLACK_APP",
        },
      });
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
        captureSuccess({
          eventName: INTEGRATION_TRACKER_EVENTS.integration_disconnected,
          payload: {
            type: "SLACK_USER",
          },
        });
      } else {
        const response = await connectUser();
        captureSuccess({
          eventName: INTEGRATION_TRACKER_EVENTS.integration_started,
          payload: {
            type: "SLACK_USER",
          },
        });
        if (response) window.open(response, "_self");
      }
    } catch (error) {
      captureError({
        eventName: isUserConnected
          ? INTEGRATION_TRACKER_EVENTS.integration_disconnected
          : INTEGRATION_TRACKER_EVENTS.integration_started,
        payload: {
          type: "SLACK_USER",
        },
      });
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
      captureSuccess({
        eventName: INTEGRATION_TRACKER_EVENTS.integration_disconnected,
        payload: {
          connection_id: connectionId,
          type: "SLACK_APP",
        },
      });
    } catch (error) {
      captureError({
        eventName: INTEGRATION_TRACKER_EVENTS.integration_disconnected,
        payload: {
          connection_id: connectionId,
          type: "SLACK_APP",
        },
      });
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
        <div className="flex-shrink-0 relative flex flex-col border-t border-custom-border-100 py-4 px-2">
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
