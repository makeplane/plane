export type TGithubIntegrationConfig = {
  GITHUB_APP_NAME: string;
  GITHUB_APP_ID: string;
  GITHUB_CLIENT_ID: string;
  GITHUB_CLIENT_SECRET: string;
  GITHUB_PRIVATE_KEY: string;
};

export type TGitlabIntegrationConfig = {
  GITLAB_CLIENT_ID: string;
  GITLAB_CLIENT_SECRET: string;
};

export type TSlackIntegrationConfig = {
  SLACK_CLIENT_ID: string;
  SLACK_CLIENT_SECRET: string;
};

export type TIntegrationConfig = {
  github?: TGithubIntegrationConfig;
  gitlab?: TGitlabIntegrationConfig;
  slack?: TSlackIntegrationConfig;
};
