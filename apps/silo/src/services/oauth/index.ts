export * from "./auth";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { sentryAuth } from "@/apps/sentry/auth/auth";
import { env } from "@/env";
import { OAuthController } from "./controller";
import { OAuthRoutes } from "./routes";
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
}

export { OAuthController, OAuthRoutes, OAuthStrategyManager };
export * from "./types";
