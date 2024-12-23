"use client";

import { FC, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Button } from "@plane/ui";
// plane web hooks
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
        gitlab-auth Something went wrong
      </div>
    );

  return (
    <div className="relative flex justify-between items-center gap-4 p-4 border border-custom-border-100 rounded">
      {workspaceConnection ? (
        <div className="w-full relative flex items-center gap-4">
          <div className="flex-shrink-0 w-11 h-11 rounded overflow-hidden relative">
            <img
              src={workspaceConnection?.connectionData?.avatar_url}
              alt={workspaceConnection?.connectionData?.login}
              className="object-contain w-full h-full overflow-hidden"
            />
          </div>
          <div className="space-y-0.5 w-full">
            <div className="text-base font-medium">{workspaceConnection?.connectionData?.login}</div>
            <div className="text-sm text-custom-text-200">Gitlab org added by and time</div>
          </div>
        </div>
      ) : (
        <div className="space-y-0.5 w-full">
          <div className="text-base font-medium">Connect Organization</div>
          <div className="text-sm text-custom-text-200">
            Connect your Gitlab workspaceConnection to use the integration
          </div>
        </div>
      )}
      <Button
        variant={workspaceConnectionId ? "neutral-primary" : "primary"}
        size="sm"
        className="flex-shrink-0"
        onClick={handleGitlabAuth}
        disabled={(isLoading && workspaceConnectionId) || isConnectionSetup || error}
      >
        {(isLoading && workspaceConnectionId) || error
          ? "..."
          : isConnectionSetup
            ? "Processing"
            : !workspaceConnectionId
              ? "Connect"
              : "Disconnect"}
      </Button>
    </div>
  );
});
