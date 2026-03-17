/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { logger } from "@plane/logger";
import type { BaseAgent } from "./core";
import { CursorAgent } from "./cursor/agent";

class AgentRegistry {
  private agents = new Map<string, BaseAgent>();

  register(agent: BaseAgent): void {
    this.agents.set(agent.config.key, agent);
    logger.info(`[AgentRegistry] Registered agent: ${agent.config.key}`);
  }

  get(key: string): BaseAgent | undefined {
    return this.agents.get(key);
  }

  has(key: string): boolean {
    return this.agents.has(key);
  }
}

export const agentRegistry = new AgentRegistry();

export function registerAgents(): void {
  agentRegistry.register(new CursorAgent());
}
