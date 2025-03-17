// instrument.js
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { env } from "./env";
import { logger } from "@plane/logger";
import { StartSpanOptions } from "@sentry/core";

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

export const startSpan = (
  spanOptions: StartSpanOptions,
  callback: ((span: Sentry.Span) => unknown) | ((arg0: unknown) => any)
) => {
  const transaction = Sentry.startSpan(spanOptions, callback);
  try {
    const result = callback(transaction);
    transaction.finish(); // Ensure the span is completed
    return result;
  } catch (err) {
    Sentry.captureException(err);
    transaction.finish();
    throw err;
  }
};

export const captureException = (err: unknown) => {
  Sentry.captureException(err);
};

export const SentryInstance = Sentry;
