"use client";

import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import useSWR from "swr";
import { Grid2x2X } from "lucide-react";
// plane internal packages
import { E_INTEGRATION_KEYS, TUserWorkspaceConnection } from "@plane/etl/core";
import { IWorkspace, TWorkspaceUserConnection } from "@plane/types";
// services
import { TUserConnection, USER_CONNECTION_PROVIDERS } from "@/constants/profile";
import { useUser, useWorkspace } from "@/hooks/store";
import { useGithubIntegration } from "@/plane-web/hooks/store";
import { useConnections } from "@/plane-web/hooks/store/integrations/use-connection";
import { useSlackIntegration } from "@/plane-web/hooks/store/integrations/use-slack";
import { PersonalAccountConnectView } from "./personal-account-view";
import { WorkspaceSwitch } from "./workspace-switch";

export const UserConnectionsView = observer(({ workspaceId }: { workspaceId: string }) => {
  const [selectedWorkspace, setSelectedWorkspace] = useState<IWorkspace | null>(null);
  const { workspaces, loader } = useWorkspace();

  const handleWorkspaceChange = (workspace: IWorkspace) => {
    setSelectedWorkspace(workspace);
  };

  const [connections, setConnections] = useState<TWorkspaceUserConnection[]>();

  const { fetchUserConnections, getConnectionsByWorkspaceSlug } = useConnections();

  const { isLoading } = useSWR(
    selectedWorkspace ? `USER_INTEGRATION_CONNECTIONS_${selectedWorkspace.slug?.toString()}` : null,
    selectedWorkspace ? async () => fetchUserConnections(selectedWorkspace.id, selectedWorkspace.slug) : null,
    { errorRetryCount: 0, revalidateOnFocus: true, revalidateIfStale: false }
  );

  useEffect(() => {
    if (selectedWorkspace && !isLoading) {
      let response = getConnectionsByWorkspaceSlug(selectedWorkspace.slug);
      response = (response || []).reduce((allConnections: any, connection: any) => {
        if (connection.connectionType !== E_INTEGRATION_KEYS.GITLAB) {
          allConnections.push(connection);
        }
        return allConnections;
      }, []);
      setConnections(response);
    }

    if (!selectedWorkspace && workspaceId) {
      const workspace = workspaces[workspaceId as string];
      if (workspace) {
        setSelectedWorkspace(workspace);
      }
    }
  }, [selectedWorkspace, isLoading, workspaceId, loader, workspaces]);

  return !isLoading ? (
    <>
      <div className="grid grid-cols-12 gap-4 py-6 sm:gap-16">
        <div className="col-span-12 sm:col-span-6">
          <h4 className="text-lg font-semibold text-custom-text-100" />
          <p className="text-sm text-custom-text-100">
            Select workspace for which you need to customize connection preferences.
          </p>
        </div>
        <div className="col-span-12 sm:col-span-6">
          <WorkspaceSwitch workspaces={workspaces} value={selectedWorkspace} onChange={handleWorkspaceChange} />
        </div>
      </div>

      {selectedWorkspace ? (
        connections && connections.length > 0 ? (
          <>
            <div className="grid grid-cols-12 py-6 sm:gap-16">
              <div className="col-span-12">
                <h4 className="text-lg font-medium text-custom-text-100">Connect Account</h4>
                <p className="text-sm text-custom-text-200">
                  Connecting personal account unlocks new possibilities with connected workspace integrations.
                </p>
              </div>
            </div>

            {selectedWorkspace && (
              <div className="grid-col-8">
                <ConnectionMapper selectedWorkspace={selectedWorkspace} connections={connections} />
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-12 py-6 sm:gap-16">
            <div className="flex gap-2 items-center col-span-12 p-4 border border-custom-border-400 bg-custom-background-400 rounded-md">
              <Grid2x2X size={16} className="text-custom-primary-300" />
              <p className="text-sm text-custom-text-200 col-span-12 font-medium">
                No integration is currently connected to the selected workspace.
              </p>
            </div>
          </div>
        )
      ) : null}
    </>
  ) : (
    <div>Loading...</div>
  );
});

export const ConnectionMapper = observer(
  (props: { selectedWorkspace: IWorkspace; connections: TWorkspaceUserConnection[] }) => {
    const { selectedWorkspace } = props;

    const { connectUser, disconnectUser, fetchExternalApiToken: slackFetchExternalApiToken } = useSlackIntegration();
    const {
      auth: { connectGithubUserCredential, disconnectGithubUserCredential },
      fetchExternalApiToken: githubFetchExternalApiToken,
    } = useGithubIntegration();
    const user = useUser();

    const [connections, setConnections] = useState<TWorkspaceUserConnection[]>(props.connections);

    useSWR(
      selectedWorkspace ? `SLACK_EXTERNAL_API_TOKEN_${selectedWorkspace.slug.toString()}` : null,
      selectedWorkspace ? async () => slackFetchExternalApiToken(selectedWorkspace.slug.toString()) : null,
      { errorRetryCount: 0, revalidateOnFocus: false, revalidateIfStale: false }
    );

    useSWR(
      selectedWorkspace ? `GITHUB_EXTERNAL_API_TOKEN_${selectedWorkspace.slug.toString()}` : null,
      selectedWorkspace ? async () => githubFetchExternalApiToken(selectedWorkspace.slug.toString()) : null,
      { errorRetryCount: 0, revalidateOnFocus: false, revalidateIfStale: false }
    );

    const handleConnection = async (source: TUserConnection) => {
      if (source === E_INTEGRATION_KEYS.GITHUB) {
        const response = await connectGithubUserCredential(
          selectedWorkspace.id,
          selectedWorkspace.slug,
          user.data?.id,
          true
        );
        if (response) window.open(response, "_self");
      } else if (source === E_INTEGRATION_KEYS.SLACK) {
        const response = await connectUser(selectedWorkspace.id, selectedWorkspace.slug, true);
        if (response) window.open(response, "_self");
      }
    };

    const handleDisconnection = async (source: TUserConnection) => {
      if (source === E_INTEGRATION_KEYS.GITHUB) {
        await disconnectGithubUserCredential(selectedWorkspace.id, user.data?.id);
      } else if (source === E_INTEGRATION_KEYS.SLACK) {
        await disconnectUser(selectedWorkspace.id);
      }

      setConnections(
        connections.map((connection) => {
          if (connection.connection_type === source) {
            connection.isUserConnected = false;
          }
          return connection;
        })
      );
    };

    return connections.map((connection) => (
      <PersonalAccountConnectView
        key={connection.id}
        provider={USER_CONNECTION_PROVIDERS[connection.connection_type as TUserConnection]}
        isConnectionLoading={false}
        isUserConnected={connection.isUserConnected}
        connectionSlug={connection.connection_slug || ""}
        handleConnection={handleConnection}
        handleDisconnection={handleDisconnection}
      />
    ));
  }
);
