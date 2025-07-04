import { env } from "@/env";
import { E_INTEGRATION_KEYS } from "@plane/etl/core";

export const isGithubEnabled = function () {
  return (
    env.GITHUB_APP_ID &&
    env.GITHUB_APP_NAME &&
    env.GITHUB_PRIVATE_KEY &&
    env.GITHUB_CLIENT_ID &&
    env.GITHUB_CLIENT_SECRET
  );
};

export const isSlackEnabled = function () {
  return env.SLACK_CLIENT_ID && env.SLACK_CLIENT_SECRET;
};

export const isGitlabEnabled = function () {
  return env.GITLAB_CLIENT_ID && env.GITLAB_CLIENT_SECRET;
};

export const isGithubEnterpriseEnabled = function () {
  return true;
};

export const getSupportedIntegrations = () =>
  [
    isGithubEnabled() && E_INTEGRATION_KEYS.GITHUB,
    isSlackEnabled() && E_INTEGRATION_KEYS.SLACK,
    isGitlabEnabled() && E_INTEGRATION_KEYS.GITLAB,
    isGithubEnterpriseEnabled() && E_INTEGRATION_KEYS.GITHUB_ENTERPRISE,
  ].filter(Boolean) as E_INTEGRATION_KEYS[];

export const checkIntegrationAvailability = (key: E_INTEGRATION_KEYS) => {
  switch (key) {
    case E_INTEGRATION_KEYS.GITHUB:
      return isGithubEnabled();
    case E_INTEGRATION_KEYS.SLACK:
      return isSlackEnabled();
    case E_INTEGRATION_KEYS.GITLAB:
      return isGitlabEnabled();
    case E_INTEGRATION_KEYS.GITHUB_ENTERPRISE:
      return isGithubEnterpriseEnabled();
    default:
      return false;
  }
};
