"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { GITLAB_INTEGRATION_TRACKER_ELEMENTS, INTEGRATION_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, Loader } from "@plane/ui";
// plane web hooks
import { captureSuccess } from "@/helpers/event-tracker.helper";
import { useGitlabIntegration } from "@/plane-web/hooks/store/integrations";

export const ConnectOrganization: FC = observer(() => {
  // hooks
  const {
    workspace,
    auth: {
      workspaceConnectionIds,
      workspaceConnectionById,
      fetchWorkspaceConnection,
      connectWorkspaceConnection,
      disconnectWorkspaceConnection,
    },
  } = useGitlabIntegration();
  const { t } = useTranslation();

  // states
  const [isConnectionSetup, setIsConnectionSetup] = useState<boolean>(false);

  // derived values
  const workspaceId = workspace?.id || undefined;
  const workspaceConnectionId = workspaceConnectionIds[0] || undefined;
  const workspaceConnection = workspaceConnectionId ? workspaceConnectionById(workspaceConnectionId) : undefined;

  // handlers
  const handleConnectOrganization = async () => {
    try {
      setIsConnectionSetup(true);
      const response = await connectWorkspaceConnection();
      if (response) window.open(response, "_self");
      captureSuccess({
        eventName: INTEGRATION_TRACKER_EVENTS.integration_started,
        payload: {
          type: "GITLAB_ORGANIZATION",
          workspaceConnectionId,
        },
      });
    } catch (error) {
      console.error("connectWorkspaceConnection", error);
    } finally {
      setIsConnectionSetup(false);
    }
  };

  const handleDisconnectOrganization = async () => {
    try {
      setIsConnectionSetup(true);
      await disconnectWorkspaceConnection();
      captureSuccess({
        eventName: INTEGRATION_TRACKER_EVENTS.integration_disconnected,
        payload: {
          type: "GITLAB_ORGANIZATION",
          workspaceConnectionId,
        },
      });
    } catch (error) {
      console.error("disconnectWorkspaceConnection", error);
    } finally {
      setIsConnectionSetup(false);
    }
  };

  const handleGitlabAuth = () => {
    if (!workspaceConnectionId) handleConnectOrganization();
    else handleDisconnectOrganization();
  };

  // fetching gitlab workspace connection connection
  const { isLoading, error } = useSWR(
    workspaceId ? `GITLAB_INTEGRATION_${workspaceId}` : null,
    workspaceId ? async () => await fetchWorkspaceConnection() : null,
    { errorRetryCount: 0 }
  );

  if (error)
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">
        {t("gitlab_integration.connection_fetch_error")}
      </div>
    );

  return (
    <div className="relative flex justify-between items-center gap-4 p-4 border border-custom-border-100 rounded">
      {workspaceConnection ? (
        <div className="w-full relative flex items-center gap-4">
          <div className="flex-shrink-0 w-11 h-11 rounded overflow-hidden relative">
            <img
              src={workspaceConnection?.connection_data?.avatar_url}
              alt={workspaceConnection?.connection_data?.login}
              className="object-contain w-10 h-10 overflow-hidden rounded"
            />
          </div>
          <div className="text-sm text-custom-text-200 font-medium">
            {workspaceConnection?.connection_data?.organization || workspaceConnection?.connection_data?.name}
          </div>
        </div>
      ) : (
        <div className="space-y-0.5 w-full">
          <div className="text-base font-medium">{t("gitlab_integration.connect_org")}</div>
          <div className="text-sm text-custom-text-200">{t("gitlab_integration.connect_org_description")}</div>
        </div>
      )}

      {isLoading && !workspaceConnectionId ? (
        <Loader>
          <Loader.Item height="29px" width="82px" />
        </Loader>
      ) : (
        <Button
          variant={workspaceConnectionId ? "neutral-primary" : "primary"}
          size="sm"
          className="flex-shrink-0"
          onClick={handleGitlabAuth}
          disabled={(isLoading && workspaceConnectionId) || isConnectionSetup || error}
          data-ph-element={GITLAB_INTEGRATION_TRACKER_ELEMENTS.CONNECT_DISCONNECT_ORGANIZATION_BUTTON}
        >
          {(isLoading && workspaceConnectionId) || error
            ? "..."
            : isConnectionSetup
              ? t("common.processing")
              : !workspaceConnectionId
                ? t("common.connect")
                : t("common.disconnect")}
        </Button>
      )}
    </div>
  );
});
