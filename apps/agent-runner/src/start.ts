/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { loadRunnerConfig } from "./config.ts";
import { createLogger } from "./logger.ts";
import { AgentRunner } from "./server.ts";

const log = createLogger("agent-runner");

let runner: AgentRunner;
try {
  const config = loadRunnerConfig();
  if (config.isolation === "uid" && process.getuid?.() !== 0) {
    throw new Error(
      "AGENT_RUNNER_ISOLATION=uid runs each agent as its own uid and needs root; " +
        "set AGENT_RUNNER_ISOLATION=none for local development only"
    );
  }
  if (config.isolation === "none") {
    log.warn("agent-runner: isolation is off; every agent runs as the runner's own user (development only)");
  }
  runner = new AgentRunner({ config, log });
  await runner.listen();
} catch (error) {
  log.error("agent-runner: failed to start", { error: (error as Error).message });
  process.exit(1);
}

let stopping = false;
const shutdown = (signal: string) => {
  if (stopping) return;
  stopping = true;
  log.info("agent-runner: shutting down", { signal });
  runner.close().then(
    () => process.exit(0),
    (error: unknown) => {
      log.error("agent-runner: shutdown failed", { error: (error as Error).message });
      process.exit(1);
    }
  );
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  log.error("agent-runner: unhandled rejection", { error: (reason as Error)?.message ?? String(reason) });
});
