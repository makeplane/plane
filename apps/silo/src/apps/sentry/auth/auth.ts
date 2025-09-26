import { createSentryAuth, SentryAuthService } from "@plane/etl/sentry";
import { env } from "@/env";

export const sentryAuth = createSentryAuth({
  clientId: env.SENTRY_CLIENT_ID,
  clientSecret: env.SENTRY_CLIENT_SECRET,
  integrationSlug: env.SENTRY_INTEGRATION_SLUG,
  baseUrl: env.SENTRY_BASE_URL,
}) as SentryAuthService;
