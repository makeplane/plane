
import { TGithubWorkspaceConnectionConfig, TGitlabWorkspaceConnectionConfig, TSlackWorkspaceConnectionConfig } from "../integration"

export type TWorkspaceConnectionConfig = TGithubWorkspaceConnectionConfig | TGitlabWorkspaceConnectionConfig | TSlackWorkspaceConnectionConfig;
