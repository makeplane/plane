import { TGithubWorkspaceConnectionData } from "../integration/github";
import { TGitlabWorkspaceConnectionData } from "../integration/gitlab";
import { TSlackWorkspaceConnectionData } from "../integration/slack";

export type TWorkspaceConnectionData =
  | TGithubWorkspaceConnectionData
  | TGitlabWorkspaceConnectionData
  | TSlackWorkspaceConnectionData;
