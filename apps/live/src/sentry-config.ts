import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { logger } from "@plane/logger";
import { env } from "@/env";

export const initializeSentry = () => {
  if (!env.LIVE_SENTRY_DSN) {
    logger.warn("Sentry DSN not configured");
    return;
  }

  logger.info(`Initializing Sentry | Version:${env.LIVE_SENTRY_RELEASE_VERSION}`);
  Sentry.init({
    dsn: env.LIVE_SENTRY_DSN,
    integrations: [Sentry.httpIntegration(), Sentry.expressIntegration(), nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    environment: env.NODE_ENV,
    release: env.LIVE_SENTRY_RELEASE_VERSION,
  });
};

export const captureException = (err: Error, context?: Record<string, any>) => {
  Sentry.captureException(err, context);
};

export const SentryInstance = Sentry;
