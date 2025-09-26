import { TWorkspaceEntityConnection, TWorkspaceConnection } from "../workspace";
import { TStateMap } from "./common";

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
export type TGitlabEntityConnectionConfig = object & { states: { mergeRequestEventMapping: TStateMap } };

// gitlab workspace connection config
export type TGitlabWorkspaceConnectionConfig = object;

// gitlab app config
export type TGitlabAppConfig = {
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  webhookSecret: string;
};

// gitlab workspace connection data
export type TGitlabWorkspaceConnectionData = {
  id: number;
  username: string;
  organization: string;
  login: string;
  name: string;
  state: "active" | "blocked";
  avatar_url: string;
  web_url: string;
  appConfig?: TGitlabAppConfig | undefined;
};

// gitlab workspace connection
export type TGitlabWorkspaceConnection = TWorkspaceConnection<
  TGitlabWorkspaceConnectionConfig,
  TGitlabWorkspaceConnectionData
>;

// gitlab entity connection
export type TGitlabEntityConnection = TWorkspaceEntityConnection<TGitlabEntityConnectionConfig>;

// data types
export type TGitlabRepository = {
  id: number;
  name: string;
  full_name: string;
};
