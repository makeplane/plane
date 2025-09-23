import { IState } from "../state";
import { TWorkspaceConnection, TWorkspaceEntityConnection } from "../workspace";

// entity types
export enum E_STATE_MAP_KEYS {
  DRAFT_MR_OPENED = "DRAFT_MR_OPENED",
  MR_OPENED = "MR_OPENED",
  MR_REVIEW_REQUESTED = "MR_REVIEW_REQUESTED",
  MR_READY_FOR_MERGE = "MR_READY_FOR_MERGE",
  MR_MERGED = "MR_MERGED",
  MR_CLOSED = "MR_CLOSED",
}
export type TStateMapKeys = keyof typeof E_STATE_MAP_KEYS;

// entity types
export enum E_ISSUE_STATE_MAP_KEYS {
  ISSUE_OPEN = "ISSUE_OPEN",
  ISSUE_CLOSED = "ISSUE_CLOSED",
}
export type TIssueStateMapKeys = keyof typeof E_ISSUE_STATE_MAP_KEYS;

export type TStateMap = {
  [key in TStateMapKeys]: IState | undefined;
};

export type TIssueStateMap = {
  [key in TIssueStateMapKeys]: IState | undefined;
};

export type TGithubMergeRequestEvent =
  | "DRAFT_MR_OPENED"
  | "MR_OPENED"
  | "MR_REVIEW_REQUESTED"
  | "MR_READY_FOR_MERGE"
  | "MR_MERGED"
  | "MR_CLOSED";

export type TGithubExState = {
  id: string;
  name: string;
};

export type TGithubRepository = {
  id: number;
  name: string;
  full_name: string;
};

// github entity connection config
export type TGithubEntityConnectionConfig = object & {
  states: { mergeRequestEventMapping?: TStateMap; issueEventMapping?: TIssueStateMap };
  allowBidirectionalSync?: boolean;
};

// github connection config
export type TGithubUserConnectionData = {
  id: number;
  url?: string;
  type?: "Bot" | "User" | "Organization";
  login: string;
  node_id?: string;
  html_url?: string;
  gists_url?: string;
  repos_url?: string;
  avatar_url?: string;
  events_url?: string;
  site_admin?: boolean;
  gravatar_id?: string;
  // Additional fields not present in the original type
  deleted?: boolean;
  email?: string | null;
  followers_url?: string;
  following_url?: string;
  name?: string | null;
  organizations_url?: string;
  received_events_url?: string;
  starred_url?: string;
  subscriptions_url?: string;
};

// github workspace connection config
export type TGithubWorkspaceConnectionConfig = {
  userMap: {
    planeUser: {
      id: string;
      email: string;
      name: string;
      avatarUrl: string;
    };
    githubUser?: TGithubUserConnectionData;
    integrationUser?: TGithubUserConnectionData;
  }[];
};

// github workspace connection data
export type TGithubWorkspaceConnectionData =
  | {
      name?: string | null | undefined;
      email?: string | null | undefined;
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string | null;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      site_admin: boolean;
      starred_at?: string | undefined;
      user_view_type?: string | undefined;
      appConfig?: TGithubAppConfig | undefined;
    }
  | {
      description?: string | null | undefined;
      html_url: string;
      website_url?: string | null | undefined;
      id: number;
      node_id: string;
      name: string;
      login: string;
      slug: string;
      created_at: string | null;
      updated_at: string | null;
      avatar_url: string;
      appConfig?: TGithubAppConfig | undefined;
    };

export type TGithubAppConfig = {
  appId: string;
  appName: string;
  baseUrl: string;
  clientId: string;
  clientSecret: string;
  privateKey: string;
  webhookSecret: string;
};

// github workspace connection
export type TGithubWorkspaceConnection = TWorkspaceConnection<
  TGithubWorkspaceConnectionConfig,
  TGithubWorkspaceConnectionData
>;

// github entity connection
export type TGithubEntityConnection = TWorkspaceEntityConnection<TGithubEntityConnectionConfig> & {
  entity_data: object & {
    id: number;
    name: string;
    full_name: string;
  };
};

// github workspace user connection
export type TGithubWorkspaceUserConnection = {
  isConnected: boolean;
};
