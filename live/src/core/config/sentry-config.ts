import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Ensure to call this before importing any other modules!
Sentry.init({
  dsn: process.env.LIVE_SENTRY_DSN,
  environment: process.env.LIVE_SENTRY_ENVIRONMENT || "development",

  integrations: [
    // Add our Profiling integration
    nodeProfilingIntegration(),
  ],
  // Add Tracing by setting tracesSampleRate
  // We recommend adjusting this value in production
  tracesSampleRate: Number(process.env.LIVE_SENTRY_TRACES_SAMPLE_RATE) || 0.5,
  // Set sampling rate for profiling
  // This is relative to tracesSampleRate
  profilesSampleRate: 1.0,
});
