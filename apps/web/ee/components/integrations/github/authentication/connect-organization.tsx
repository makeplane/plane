"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { GITHUB_INTEGRATION_TRACKER_ELEMENTS, INTEGRATION_TRACKER_EVENTS } from "@plane/constants";
import { useTranslation } from "@plane/i18n";
import { Button, EModalWidth, ModalCore, Loader } from "@plane/ui";
// plane web hooks
import { captureError, captureSuccess } from "@/helpers/event-tracker.helper";
import { useGithubIntegration } from "@/plane-web/hooks/store/integrations";
import { GithubEnterpriseServerAppForm } from "./server-app-form";

interface IConnectOrganizationProps {
  isEnterprise: boolean;
}

export const ConnectOrganization: FC<IConnectOrganizationProps> = observer(({ isEnterprise }) => {
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
  } = useGithubIntegration(isEnterprise);

  // states
  const [isConnectionSetup, setIsConnectionSetup] = useState<boolean>(false);
  const [isServerAppFormOpen, setIsServerAppFormOpen] = useState<boolean>(false);

  // derived values
  const workspaceId = workspace?.id || undefined;
  const workspaceConnectionId = workspaceConnectionIds[0] || undefined;
  const workspaceConnection = workspaceConnectionId ? workspaceConnectionById(workspaceConnectionId) : undefined;
  const { t } = useTranslation();

  // after server app form is submitted, connect the organization
  const handleServerAppFormSubmitSuccess = async () => {
    await handleConnectOrganization();
    setIsServerAppFormOpen(false);
  };

  // handlers
  const handleConnectOrganization = async () => {
    try {
      setIsConnectionSetup(true);
      const response = await connectWorkspaceConnection();
      captureSuccess({
        eventName: INTEGRATION_TRACKER_EVENTS.integration_started,
        payload: {
          type: "GITHUB_ORGANIZATION",
          workspaceId,
        },
      });
      if (response) window.open(response, "_self");
    } catch (error) {
      console.error("connectWorkspaceConnection", error);
      captureError({
        eventName: INTEGRATION_TRACKER_EVENTS.integration_started,
        payload: {
          type: "GITHUB_ORGANIZATION",
          workspaceId,
        },
      });
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
          type: "GITHUB_ORGANIZATION",
          workspaceId,
        },
      });
    } catch (error) {
      console.error("disconnectWorkspaceConnection", error);
      captureError({
        eventName: INTEGRATION_TRACKER_EVENTS.integration_disconnected,
        payload: {
          type: "GITHUB_ORGANIZATION",
          workspaceId,
        },
      });
    } finally {
      setIsConnectionSetup(false);
    }
  };

  const handleGithubAuth = () => {
    if (!workspaceConnectionId) {
      if (isEnterprise) setIsServerAppFormOpen(true);
      else handleConnectOrganization();
    } else handleDisconnectOrganization();
  };

  // fetching github workspace connection connection
  const { isLoading, error } = useSWR(
    workspaceId ? `GITHUB_INTEGRATION_${workspaceId}` : null,
    workspaceId ? async () => await fetchWorkspaceConnection() : null,
    { errorRetryCount: 0 }
  );

  if (error)
    return (
      <div className="text-custom-text-200 relative flex justify-center items-center">
        {t("github_integration.connection_fetch_error")}
      </div>
    );

  return (
    <div className="relative flex justify-between items-center gap-4 p-4 border border-custom-border-100 rounded">
      <ModalCore isOpen={isServerAppFormOpen} handleClose={() => setIsServerAppFormOpen(false)} width={EModalWidth.XXL}>
        <GithubEnterpriseServerAppForm
          handleFormSubmitSuccess={handleServerAppFormSubmitSuccess}
          handleClose={() => setIsServerAppFormOpen(false)}
        />
      </ModalCore>
      {workspaceConnection ? (
        <div className="w-full relative flex items-center gap-4">
          <div className="flex-shrink-0 w-11 h-11 rounded overflow-hidden relative">
            <img
              src={workspaceConnection?.connection_data?.avatar_url}
              alt={workspaceConnection?.connection_data?.login}
              className="object-contain w-full h-full overflow-hidden"
            />
          </div>
          <div className="space-y-0.5 w-full">
            <div className="text-base font-medium">{workspaceConnection?.connection_data?.login}</div>
          </div>
        </div>
      ) : (
        <div className="space-y-0.5 w-full">
          <div className="text-base font-medium">{t("github_integration.connect_org")}</div>
          <div className="text-sm text-custom-text-200">{t("github_integration.connect_org_description")}</div>
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
          onClick={handleGithubAuth}
          disabled={(isLoading && workspaceConnectionId) || isConnectionSetup || error}
          data-ph-element={GITHUB_INTEGRATION_TRACKER_ELEMENTS.CONNECT_DISCONNECT_ORGANIZATION_BUTTON}
        >
          {(isLoading && !workspaceConnectionId) || error
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
