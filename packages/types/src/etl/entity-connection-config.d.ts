import { TGithubEntityConnectionConfig, TGitlabEntityConnectionConfig, TSlackEntityConnectionConfig } from "../integration";

export type TWorkspaceEntityConnectionConfig = TGithubEntityConnectionConfig | TGitlabEntityConnectionConfig | TSlackEntityConnectionConfig;
