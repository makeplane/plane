"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { useTranslation } from "@plane/i18n";
import { Button } from "@plane/ui";
// plane web hooks
import { useGithubIntegration } from "@/plane-web/hooks/store/integrations";

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
  } = useGithubIntegration();

  // states
  const [isConnectionSetup, setIsConnectionSetup] = useState<boolean>(false);

  // derived values
  const workspaceId = workspace?.id || undefined;
  const workspaceConnectionId = workspaceConnectionIds[0] || undefined;
  const workspaceConnection = workspaceConnectionId ? workspaceConnectionById(workspaceConnectionId) : undefined;
  const { t } = useTranslation();

  // handlers
  const handleConnectOrganization = async () => {
    try {
      setIsConnectionSetup(true);
      const response = await connectWorkspaceConnection();
      if (response) window.open(response, "_self");
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
    } catch (error) {
      console.error("disconnectWorkspaceConnection", error);
    } finally {
      setIsConnectionSetup(false);
    }
  };

  const handleGithubAuth = () => {
    if (!workspaceConnectionId) handleConnectOrganization();
    else handleDisconnectOrganization();
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
      <Button
        variant={workspaceConnectionId ? "neutral-primary" : "primary"}
        size="sm"
        className="flex-shrink-0"
        onClick={handleGithubAuth}
        disabled={(isLoading && workspaceConnectionId) || isConnectionSetup || error}
      >
        {(isLoading && workspaceConnectionId) || error
          ? "..."
          : isConnectionSetup
            ? t("common.processing")
            : !workspaceConnectionId
              ? t("common.connect")
              : t("common.disconnect")}
      </Button>
    </div>
  );
});
