import { TGithubEntityConnectionConfig } from "../integration/github";
import { TGitlabEntityConnectionConfig } from "../integration/gitlab";
import { TSlackEntityConnectionConfig } from "../integration/slack";

export type TWorkspaceEntityConnectionConfig =
  | TGithubEntityConnectionConfig
  | TGitlabEntityConnectionConfig
  | TSlackEntityConnectionConfig;
