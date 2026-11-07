/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { loadBridgeConfig } from "./config.ts";
import { createLogger } from "./logger.ts";
import { AgentBridge } from "./server.ts";

const log = createLogger("agent-bridge");

let bridge: AgentBridge;
try {
  bridge = new AgentBridge({ config: loadBridgeConfig(), log });
  await bridge.listen();
} catch (error) {
  log.error("agent-bridge: failed to start", { error: (error as Error).message });
  process.exit(1);
}

let stopping = false;
const shutdown = (signal: string) => {
  if (stopping) return;
  stopping = true;
  log.info("agent-bridge: shutting down", { signal });
  bridge.close().then(
    () => process.exit(0),
    (error: unknown) => {
      log.error("agent-bridge: shutdown failed", { error: (error as Error).message });
      process.exit(1);
    }
  );
};
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  log.error("agent-bridge: unhandled rejection", { error: (reason as Error)?.message ?? String(reason) });
});
