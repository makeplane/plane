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

// Parameters for launching a Cursor Cloud Agent session
export interface CursorLaunchParams {
  prompt: { text: string };
  source: { repository: string; ref?: string };
  target?: { autoCreatePr?: boolean; branchName?: string; openAsCursorGithubApp?: boolean };
  webhook?: { url: string; secret?: string };
}

// Parameters for sending a follow-up message to an existing session
export interface CursorFollowUpParams {
  prompt: { text: string };
}

// Response from Cursor API when launching or fetching an agent
export interface CursorAgentResponse {
  id: string;
  name: string;
  status: "CREATING" | "RUNNING" | "FINISHED" | "ERROR";
  source: { repository: string; ref: string };
  target: { url: string; branchName: string; prUrl?: string; autoCreatePr: boolean };
  summary: string;
  createdAt: string;
}

// Response from follow-up endpoint
export interface CursorFollowUpResponse {
  id: string;
}

// Response from GET /v0/me
export interface CursorMeResponse {
  apiKeyName: string;
  userEmail: string;
}

// Conversation message from Cursor
export interface CursorConversationMessage {
  id: string;
  type: "user_message" | "assistant_message";
  text: string;
}

// Response from GET /v0/agents/{id}/conversation
export interface CursorConversationResponse {
  id: string;
  messages: CursorConversationMessage[];
}

// Webhook payload sent by Cursor when agent status changes
export interface CursorWebhookPayload {
  event: "statusChange";
  timestamp: string;
  id: string;
  status: "FINISHED" | "ERROR";
  source: { repository: string; ref: string };
  target: { url: string; branchName: string; prUrl?: string };
  name?: string;
  summary?: string;
  createdAt?: string;
}

// Data queued to RabbitMQ for async webhook processing
export interface CursorWebhookQueuePayload {
  payload: CursorWebhookPayload;
  workspaceConnectionId: string;
  workspaceId: string;
}

// Repository returned by Cursor API
export interface CursorRepository {
  owner: string;
  name: string;
  repository: string;
}

// Response from GET /v0/repositories
export interface CursorRepositoriesResponse {
  repositories: CursorRepository[];
}

// Entity data stored in workspace_entity_connections for project-to-repo mappings
export interface CursorProjectMappingEntityData {
  repository: string; // "owner/repo"
  ref?: string; // branch override, optional
}

// Entity data stored in workspace_entity_connections for session mapping
export interface CursorSessionEntityData {
  cursor_session_id: string;
  agent_run_id: string;
  workspace_slug: string;
  project_id: string;
  issue_id: string;
  repository: string;
  status: string;
  posted_message_count?: number; // number of assistant messages already posted to Plane, used for deduplication
}
