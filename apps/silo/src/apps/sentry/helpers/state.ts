import { TSentryConfig } from "@plane/etl/sentry";
import { Client, ExState } from "@plane/sdk";
import { TWorkspaceConnection } from "@plane/types";
import { EPlaneStates } from "../types";

export const getProjectStateMappings = async (
  planeClient: Client,
  workspaceConnection: TWorkspaceConnection,
  projectId: string
): Promise<{ resolvedState: ExState; unresolvedState: ExState; isDefault: boolean } | null> => {
  if (workspaceConnection.config) {
    const config = workspaceConnection.config as TSentryConfig;
    const projectStateMappings = config.stateMappings?.find((mapping) => mapping.projectId === projectId);

    if (projectStateMappings) {
      return {
        resolvedState: projectStateMappings.resolvedState,
        unresolvedState: projectStateMappings.unresolvedState,
        isDefault: false,
      };
    }
  }

  // Get project states for default configuration
  const states = await planeClient.state.list(workspaceConnection.workspace_slug, projectId);
  const resolvedStates = states.results
    .filter((state) => state.group.toLowerCase() === EPlaneStates.COMPLETED)
    .sort((a, b) => a.name.localeCompare(b.name));
  const unresolvedStates = states.results
    .filter((state) => state.group.toLowerCase() === EPlaneStates.BACKLOG)
    .sort((a, b) => a.name.localeCompare(b.name));

  const resolvedState = resolvedStates.length > 0 ? resolvedStates[0] : undefined;
  const unresolvedState = unresolvedStates.length > 0 ? unresolvedStates[0] : undefined;

  if (!resolvedState || !unresolvedState) {
    return null;
  }

  return {
    resolvedState: resolvedState,
    unresolvedState: unresolvedState,
    isDefault: true,
  };
};
