/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { E_INTEGRATION_KEYS } from "@plane/types";
import { env } from "@/env";

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

export const isSentryEnabled = function () {
  return env.SENTRY_CLIENT_ID && env.SENTRY_CLIENT_SECRET;
};

export const getSupportedIntegrations = () =>
  [
    isGithubEnabled() && E_INTEGRATION_KEYS.GITHUB,
    isSlackEnabled() && E_INTEGRATION_KEYS.SLACK,
    isGitlabEnabled() && E_INTEGRATION_KEYS.GITLAB,
    isSentryEnabled() && E_INTEGRATION_KEYS.SENTRY,
    E_INTEGRATION_KEYS.BITBUCKET_DC,
    E_INTEGRATION_KEYS.DRAWIO,
    E_INTEGRATION_KEYS.GITHUB_ENTERPRISE,
    E_INTEGRATION_KEYS.GITLAB_ENTERPRISE,
    E_INTEGRATION_KEYS.OAUTH_BRIDGE,
  ].filter(Boolean) as E_INTEGRATION_KEYS[];

export const checkIntegrationAvailability = (key: E_INTEGRATION_KEYS) => {
  switch (key) {
    case E_INTEGRATION_KEYS.GITHUB:
      return isGithubEnabled();
    case E_INTEGRATION_KEYS.SLACK:
      return isSlackEnabled();
    case E_INTEGRATION_KEYS.GITLAB:
      return isGitlabEnabled();
    case E_INTEGRATION_KEYS.SENTRY:
      return isSentryEnabled();
    case E_INTEGRATION_KEYS.BITBUCKET_DC:
    case E_INTEGRATION_KEYS.GITHUB_ENTERPRISE:
    case E_INTEGRATION_KEYS.DRAWIO:
    case E_INTEGRATION_KEYS.GITLAB_ENTERPRISE:
    case E_INTEGRATION_KEYS.OAUTH_BRIDGE:
      return true;
    default:
      return false;
  }
};
