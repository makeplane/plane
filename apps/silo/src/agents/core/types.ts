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

import type { PlaneClient } from "@makeplane/plane-node-sdk";
import type { E_INTEGRATION_KEYS, TWorkspaceConnection, TWorkspaceCredential } from "@plane/types";

// ---------------------------------------------------------------------------
// Agent Run (shared across both webhook types)
// ---------------------------------------------------------------------------
export interface AgentRunData {
  id: string;
  status: string;
  type: string;
  agent_user: string;
  comment: string | null;
  source_comment: string | null;
  creator: string;
  stopped_by: string | null;
  issue: string | null;
  workspace: string;
  project: string | null;
  started_at: string;
  ended_at: string | null;
  stopped_at: string | null;
  external_link: string | null;
  error_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Agent Run Activity (present in agent_run_user_prompt events)
// ---------------------------------------------------------------------------
export interface AgentRunActivityData {
  id: string;
  content: {
    type: string;
    body: string;
  };
  content_metadata: Record<string, unknown>;
  ephemeral: boolean;
  signal: string;
  signal_metadata: Record<string, unknown>;
  type: string;
  agent_run: string;
  comment: string | null;
  actor: string | null;
  project: string | null;
  workspace: string;
  created_at: string;
  updated_at: string;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Webhook data payloads (the `data` field from the top-level webhook envelope)
// ---------------------------------------------------------------------------

/** data payload for event = "agent_run_create" */
export interface AgentRunCreateData {
  type: "agent_run";
  action: string;
  agent_run: AgentRunData;
  agent_user_id: string;
  app_client_id: string;
  comment_id: string | null;
  issue_id: string;
  project_id: string;
  workspace_id: string;
}

/** data payload for event = "agent_run_user_prompt" */
export interface AgentRunUserPromptData {
  type: "agent_run_activity";
  action: string;
  agent_run_activity: AgentRunActivityData;
  agent_run: AgentRunData;
  agent_user_id: string;
  app_client_id: string;
  comment_id: string | null;
  issue_id: string;
  project_id: string;
  workspace_id: string;
}

/** Union of all data payloads the worker receives (controller sends `payload.data`). */
export type AgentWebhookPayload = AgentRunCreateData | AgentRunUserPromptData;

// ---------------------------------------------------------------------------
// Agent configuration
// ---------------------------------------------------------------------------
export interface AgentConfig {
  /** Unique key identifying this agent, e.g. "cursor" */
  key: string;
  /** The integration key used for credential / connection lookups */
  integrationKey: E_INTEGRATION_KEYS;
}

// ---------------------------------------------------------------------------
// Context passed to agent implementations
// ---------------------------------------------------------------------------
export interface AgentRunContext {
  /** Authenticated PlaneClient instance (from @makeplane/plane-node-sdk) */
  planeClient: PlaneClient;
  /** The agent run ID from Plane */
  agentRunId: string;
  /** Workspace slug */
  workspaceSlug: string;
  /** Workspace ID */
  workspaceId: string;
  /** Project ID */
  projectId: string;
  /** Issue ID */
  issueId: string;
  /** The user's prompt (HTML) — present for agent_run_activity, empty for agent_run */
  userPrompt: string;
  /** The workspace connection ID */
  workspaceConnectionId: string;
  /** The workspace credential ID */
  credentialId: string;
  /** The full workspace credential object */
  credential: TWorkspaceCredential;
  /** The full workspace connection object */
  workspaceConnection: TWorkspaceConnection;
  /** "agent_run" for initial @mention, "agent_run_activity" for user follow-up */
  webhookType: "agent_run" | "agent_run_activity";
}
