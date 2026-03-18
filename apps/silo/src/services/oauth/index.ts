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

export * from "./auth";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { sentryAuth } from "@/apps/sentry/auth/auth";
import { env } from "@/env";
import { OAuthController } from "./controller";
import { OAuthRoutes } from "./routes";
import { BitbucketOAuthStrategy } from "./strategies/bitbucket-dc.strategy";
import { GithubEnterpriseStrategy } from "./strategies/github.strategy";
import { GitlabEnterpriseStrategy } from "./strategies/gitlab.strategy";
import { PlaneOAuthStrategy } from "./strategies/plane-oauth.strategy";
import { SentryOAuthStrategy } from "./strategies/sentry-oauth.strategy";
import { OAuthStrategyManager } from "./strategy-manager";

// Initialize and register strategies
const strategyManager = OAuthStrategyManager.getInstance();

export function registerOAuthStrategies() {
  if (env.PRD_AGENT_CLIENT_ID && env.PRD_AGENT_CLIENT_SECRET) {
    strategyManager.registerStrategy(
      E_INTEGRATION_KEYS.PRD_AGENT,
      new PlaneOAuthStrategy(env.PRD_AGENT_CLIENT_ID, env.PRD_AGENT_CLIENT_SECRET)
    );
  }

  if (env.SENTRY_CLIENT_ID && env.SENTRY_CLIENT_SECRET && env.SENTRY_INTEGRATION_SLUG) {
    strategyManager.registerStrategy(E_INTEGRATION_KEYS.SENTRY, new SentryOAuthStrategy(sentryAuth));
  }

  strategyManager.registerStrategy(
    E_INTEGRATION_KEYS.GITHUB_ENTERPRISE,
    new GithubEnterpriseStrategy(E_INTEGRATION_KEYS.GITHUB_ENTERPRISE)
  );

  strategyManager.registerStrategy(
    E_INTEGRATION_KEYS.GITLAB_ENTERPRISE,
    new GitlabEnterpriseStrategy(E_INTEGRATION_KEYS.GITLAB_ENTERPRISE)
  );

  strategyManager.registerStrategy(E_INTEGRATION_KEYS.BITBUCKET_DC, new BitbucketOAuthStrategy());
}

export { OAuthController, OAuthRoutes, OAuthStrategyManager };
export * from "./types";
