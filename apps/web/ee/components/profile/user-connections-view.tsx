"use client";

import { useState } from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { Grid2x2X } from "lucide-react";
// plane internal packages
import { INTEGRATION_TRACKER_EVENTS, TUserConnection, USER_CONNECTION_PROVIDERS } from "@plane/constants";
import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { IWorkspace, TWorkspaceUserConnection } from "@plane/types";
// services
import { captureSuccess } from "@/helpers/event-tracker.helper";
import { useWorkspace } from "@/hooks/store/use-workspace";
import { useUser } from "@/hooks/store/user";
// plane web imports
import { useGithubIntegration } from "@/plane-web/hooks/store";
import { useConnections } from "@/plane-web/hooks/store/integrations/use-connection";
import { useSlackIntegration } from "@/plane-web/hooks/store/integrations/use-slack";
import { ConnectionLoader } from "./loader";
import { PersonalAccountConnectView } from "./personal-account-view";

export const UserConnectionsView = observer(() => {
  // route params
  const { workspaceSlug } = useParams();
  // store
  const { getWorkspaceBySlug } = useWorkspace();
  const { fetchUserConnections, getConnectionsByWorkspaceSlug } = useConnections();
  // derived
  const selectedWorkspace = getWorkspaceBySlug(workspaceSlug as string);
  const connections = selectedWorkspace && getConnectionsByWorkspaceSlug(selectedWorkspace?.slug);

  const { isLoading } = useSWR(
    selectedWorkspace ? `USER_INTEGRATION_CONNECTIONS_${selectedWorkspace.slug?.toString()}` : null,
    selectedWorkspace ? async () => fetchUserConnections(selectedWorkspace.id, selectedWorkspace.slug) : null,
    { errorRetryCount: 0, revalidateOnFocus: true, revalidateIfStale: false }
  );

  if (isLoading)
    return (
      <div className="w-full my-6">
        <ConnectionLoader />
      </div>
    );
  return (
    <>
      {selectedWorkspace ? (
        connections && connections.length > 0 ? (
          <>
            <div className="w-full py-6 sm:gap-16">
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
          <div className="w-full py-6 sm:gap-16">
            <div className="flex gap-2 items-center col-span-12 p-4 border border-custom-border-100 rounded-md">
              <Grid2x2X size={16} className="text-custom-primary-300" />
              <p className="text-sm text-custom-text-200 col-span-12 font-medium">
                No integration is currently connected to the selected workspace.
              </p>
            </div>
          </div>
        )
      ) : null}
    </>
  );
});

export const ConnectionMapper = observer(
  (props: { selectedWorkspace: IWorkspace; connections: TWorkspaceUserConnection[] }) => {
    const { selectedWorkspace } = props;

    const { connectUser, disconnectUser, fetchExternalApiToken: fetchSlackExternalApiToken } = useSlackIntegration();
    const {
      auth: { connectGithubUserCredential, disconnectGithubUserCredential },
      fetchExternalApiToken: fetchGithubExternalApiToken,
    } = useGithubIntegration();
    const {
      auth: {
        connectGithubUserCredential: connectGithubEnterpriseUserCredential,
        disconnectGithubUserCredential: disconnectGithubEnterpriseUserCredential,
      },
    } = useGithubIntegration(true);
    const user = useUser();
    const { isLoading: isLoadingExternalApiTokens } = useSWR(
      selectedWorkspace ? `SLACK_EXTERNAL_API_TOKEN_${selectedWorkspace.slug}` : null,
      selectedWorkspace
        ? async () =>
            Promise.all([
              fetchSlackExternalApiToken(selectedWorkspace.slug),
              fetchGithubExternalApiToken(selectedWorkspace.slug),
            ])
        : null
    );

    const [connections, setConnections] = useState<TWorkspaceUserConnection[]>(props.connections);

    const handleConnection = async (source: TUserConnection) => {
      if (source === E_INTEGRATION_KEYS.GITHUB) {
        const response = await connectGithubUserCredential(
          selectedWorkspace.id,
          selectedWorkspace.slug,
          user.data?.id,
          true
        );
        captureSuccess({
          eventName: INTEGRATION_TRACKER_EVENTS.integration_started,
          payload: {
            type: "GITHUB_USER",
            workspaceId: selectedWorkspace.id,
          },
        });
        if (response) window.open(response, "_self");
      } else if (source === E_INTEGRATION_KEYS.SLACK) {
        const response = await connectUser(selectedWorkspace.id, selectedWorkspace.slug, true);
        captureSuccess({
          eventName: INTEGRATION_TRACKER_EVENTS.integration_started,
          payload: {
            type: "SLACK_USER",
            workspaceId: selectedWorkspace.id,
          },
        });
        if (response) window.open(response, "_self");
      } else if (source === E_INTEGRATION_KEYS.GITHUB_ENTERPRISE) {
        const response = await connectGithubEnterpriseUserCredential(
          selectedWorkspace.id,
          selectedWorkspace.slug,
          user.data?.id,
          true
        );
        if (response) window.open(response, "_self");
      }
    };

    const handleDisconnection = async (source: TUserConnection) => {
      if (source === E_INTEGRATION_KEYS.GITHUB) {
        await disconnectGithubUserCredential(selectedWorkspace.id, user.data?.id);
        captureSuccess({
          eventName: INTEGRATION_TRACKER_EVENTS.integration_disconnected,
          payload: {
            type: "GITHUB_USER",
            workspaceId: selectedWorkspace.id,
          },
        });
      } else if (source === E_INTEGRATION_KEYS.SLACK) {
        await disconnectUser(selectedWorkspace.id);
        captureSuccess({
          eventName: INTEGRATION_TRACKER_EVENTS.integration_disconnected,
          payload: {
            type: "SLACK_USER",
            workspaceId: selectedWorkspace.id,
          },
        });
      } else if (source === E_INTEGRATION_KEYS.GITHUB_ENTERPRISE) {
        await disconnectGithubEnterpriseUserCredential(selectedWorkspace.id, user.data?.id);
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
        isConnectionLoading={isLoadingExternalApiTokens}
        isUserConnected={connection.isUserConnected}
        connectionSlug={connection.connection_slug || ""}
        handleConnection={handleConnection}
        handleDisconnection={handleDisconnection}
      />
    ));
  }
);
