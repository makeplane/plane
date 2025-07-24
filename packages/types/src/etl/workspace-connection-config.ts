import { TGithubWorkspaceConnectionConfig } from "../integration/github";
import { TGitlabWorkspaceConnectionConfig } from "../integration/gitlab";
import { TSlackWorkspaceConnectionConfig } from "../integration/slack";

export type TWorkspaceConnectionConfig =
  | TGithubWorkspaceConnectionConfig
  | TGitlabWorkspaceConnectionConfig
  | TSlackWorkspaceConnectionConfig;
