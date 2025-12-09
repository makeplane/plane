import * as Sentry from "@sentry/react-router";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  environment: process.env.VITE_SENTRY_ENVIRONMENT,
  sendDefaultPii: process.env.VITE_SENTRY_SEND_DEFAULT_PII ? process.env.VITE_SENTRY_SEND_DEFAULT_PII === "1" : false,
  release: process.env.VITE_APP_VERSION,
  tracesSampleRate: process.env.VITE_SENTRY_TRACES_SAMPLE_RATE
    ? parseFloat(process.env.VITE_SENTRY_TRACES_SAMPLE_RATE)
    : 0.1,
  profilesSampleRate: process.env.VITE_SENTRY_PROFILES_SAMPLE_RATE
    ? parseFloat(process.env.VITE_SENTRY_PROFILES_SAMPLE_RATE)
    : 0.1,
  replaysSessionSampleRate: process.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE
    ? parseFloat(process.env.VITE_SENTRY_REPLAYS_SESSION_SAMPLE_RATE)
    : 0.1,
  replaysOnErrorSampleRate: process.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE
    ? parseFloat(process.env.VITE_SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE)
    : 1.0,
  integrations: [],
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
