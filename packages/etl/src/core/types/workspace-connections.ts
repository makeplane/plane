// github workspace connection type and data
export enum EGithubWorkspaceConnectionType {
  GITHUB = "GITHUB",
}
export type TGithubWorkspaceConnectionType = keyof typeof EGithubWorkspaceConnectionType;

export type TGithubWorkspaceConnectionData = {
  id: number | undefined;
  url: string | undefined;
  type: string | undefined;
  login: string | undefined;
  node_id: string | undefined;
  html_url: string | undefined;
  gists_url: string | undefined;
  repos_url: string | undefined;
  avatar_url: string | undefined;
  events_url: string | undefined;
  site_admin: boolean;
  gravatar_id: string | undefined;
  starred_url: string | undefined;
  followers_url: string | undefined;
  following_url: string | undefined;
  user_view_type: string | undefined;
  organizations_url: string | undefined;
  subscriptions_url: string | undefined;
  received_events_url: string | undefined;
};

// gitlab workspace connection type and data
export enum EGitlabWorkspaceConnectionType {
  GITLAB = "GITLAB",
}
export type TGitlabWorkspaceConnectionType = keyof typeof EGitlabWorkspaceConnectionType;

export type TGitlabWorkspaceConnectionData = {
  id: number | undefined;
  name: string | undefined;
  organization: string | undefined;
  url: string | undefined;
  type: string | undefined;
  login: string | undefined;
  node_id: string | undefined;
  html_url: string | undefined;
  gists_url: string | undefined;
  repos_url: string | undefined;
  avatar_url: string | undefined;
  events_url: string | undefined;
  site_admin: boolean;
  gravatar_id: string | undefined;
  starred_url: string | undefined;
  followers_url: string | undefined;
  following_url: string | undefined;
  user_view_type: string | undefined;
  organizations_url: string | undefined;
  subscriptions_url: string | undefined;
  received_events_url: string | undefined;
};

// workspace connections
export type TWorkspaceConnectionType = TGithubWorkspaceConnectionType | TGitlabWorkspaceConnectionType;

export type TWorkspaceConnection<TWorkspaceConnectionData extends object> = {
  id: string | undefined;
  workspaceId: string | undefined;
  workspaceSlug: string | undefined;
  targetHostname: string | undefined;
  sourceHostname: string | undefined;
  connectionType: TWorkspaceConnectionType;
  connectionSlug: string | undefined;
  connectionId: string | undefined;
  connectionData: TWorkspaceConnectionData;
  credentialsId: string | undefined;
  config: object | undefined;
  createdAt: string | undefined;
  updatedAt: string | undefined;
};

export type TUserWorkspaceConnection<TWorkspaceConnectionData extends object> =
  TWorkspaceConnection<TWorkspaceConnectionData> & {
    isUserConnected: boolean;
  };
