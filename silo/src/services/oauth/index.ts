export * from "./auth";
import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { env } from "@/env";
import { OAuthController } from "./controller";
import { OAuthRoutes } from "./routes";
import { GithubEnterpriseStrategy } from "./strategies/github.strategy";
import { PlaneOAuthStrategy } from "./strategies/plane-oauth.strategy";
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

  strategyManager.registerStrategy(
    E_INTEGRATION_KEYS.GITHUB_ENTERPRISE,
    new GithubEnterpriseStrategy(E_INTEGRATION_KEYS.GITHUB_ENTERPRISE)
  );
}

export { OAuthController, OAuthRoutes, OAuthStrategyManager };
export * from "./types";
