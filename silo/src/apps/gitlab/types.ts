import { EntityConnection, WorkspaceConnection } from "@/types";
import { gitlabEntityConnectionSchema, gitlabWorkspaceConnectionSchema } from "@silo/gitlab";

export type GitlabWorkspaceConnection = WorkspaceConnection<typeof gitlabWorkspaceConnectionSchema>;
export type GitlabEntityConnection = EntityConnection<typeof gitlabEntityConnectionSchema>;

export type GitlabConnectionDetails = {
  workspaceConnection: GitlabWorkspaceConnection;
  entityConnection: GitlabEntityConnection;
};
