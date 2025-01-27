import { EntityConnection, WorkspaceConnection } from "@/types";
import { gitlabEntityConnectionSchema, gitlabWorkspaceConnectionSchema } from "@plane/etl/gitlab";

export type GitlabWorkspaceConnection = WorkspaceConnection<typeof gitlabWorkspaceConnectionSchema>;
export type GitlabEntityConnection = EntityConnection<typeof gitlabEntityConnectionSchema>;

export type GitlabConnectionDetails = {
  workspaceConnection: GitlabWorkspaceConnection;
  entityConnection: GitlabEntityConnection;
  projectConnections: GitlabEntityConnection[];
};
