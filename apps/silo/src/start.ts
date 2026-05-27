/**
 * Copyright (c) 2026-present Zebaria.
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { config, setSlackConfig } from "./config";
import { loadSlackSecrets } from "./secrets";
import { createApp } from "./server";

const slackRedirect = `${config.publicBaseUrl}${config.basePath}/api/slack/team/auth/callback`;

const bootstrap = async (): Promise<void> => {
  const s = await loadSlackSecrets(config.env);
  setSlackConfig({
    clientId: s.client_id,
    clientSecret: s.client_secret,
    signingSecret: s.signing_secret,
    redirectUrl: slackRedirect,
  });
  // eslint-disable-next-line no-console
  console.log(`[silo] loaded Slack secrets from SSM (/${config.env}/plane-slack)`);
};

const app = createApp();

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(`[silo] listening on :${config.port} basePath=${config.basePath}`);
});

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(`[silo] bootstrap failed: ${(err as Error).message}`);
  process.exit(1);
});

const shutdown = (signal: string) => {
  // eslint-disable-next-line no-console
  console.log(`[silo] received ${signal}, shutting down`);
  server.close(() => process.exit(0));
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
