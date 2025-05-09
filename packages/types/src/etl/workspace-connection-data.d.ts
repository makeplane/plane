import { TGitlabWorkspaceConnectionData, TSlackWorkspaceConnectionData, TGithubWorkspaceConnectionData } from "../integration";

export type TWorkspaceConnectionData = TGithubWorkspaceConnectionData | TGitlabWorkspaceConnectionData | TSlackWorkspaceConnectionData;
