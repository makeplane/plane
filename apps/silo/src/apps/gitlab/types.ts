import { gitlabEntityConnectionSchema, gitlabWorkspaceConnectionSchema } from "@plane/etl/gitlab";
import { TWorkspaceConnection, TWorkspaceEntityConnection } from "@plane/types";

export type GitlabWorkspaceConnection = TWorkspaceConnection<typeof gitlabWorkspaceConnectionSchema>;
export type GitlabEntityConnection = TWorkspaceEntityConnection<typeof gitlabEntityConnectionSchema>;

export type GitlabConnectionDetails = {
  workspaceConnection: GitlabWorkspaceConnection;
  entityConnection?: GitlabEntityConnection;
  projectConnections?: GitlabEntityConnection[];
};
