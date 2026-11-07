/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Test doubles for code built on `AgentChatSession`: a deterministic ACP agent (SDK `agent()`) and
 * an in-memory transport that can close with a bridge close code. Not for production use.
 */
export * from "./fake-agent.ts";
export * from "./memory-transport.ts";
