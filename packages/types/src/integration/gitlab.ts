import { TWorkspaceEntityConnection, TWorkspaceConnection } from "../workspace";

export type TGitlabMergeRequestEvent =
  | "DRAFT_MR_OPENED"
  | "MR_OPENED"
  | "MR_REVIEW_REQUESTED"
  | "MR_READY_FOR_MERGE"
  | "MR_MERGED"
  | "MR_CLOSED";

export type TGitlabExState = {
  id: string;
  name: string;
  status?: "to_be_created";
};

// gitlab entity connection config
export type TGitlabEntityConnectionConfig = {
  states?: {
    mergeRequestEventMapping: Record<TGitlabMergeRequestEvent, TGitlabExState>;
  };
};

// gitlab workspace connection config
export type TGitlabWorkspaceConnectionConfig = object;

// gitlab workspace connection data
export type TGitlabWorkspaceConnectionData = {
  id: number;
  username: string;
  name: string;
  state: "active" | "blocked";
  avatar_url: string;
  web_url: string;
};

// gitlab workspace connection
export type TGitlabWorkspaceConnection = TWorkspaceConnection<
  TGitlabWorkspaceConnectionConfig,
  TGitlabWorkspaceConnectionData
>;

// gitlab entity connection
export type TGitlabEntityConnection = TWorkspaceEntityConnection<TGitlabEntityConnectionConfig>;
