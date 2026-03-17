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
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { getPlaneAppDetails } from "@/helpers/plane-app-details";
import { getPlaneClientV2 } from "@/helpers/plane-api-client-v2";
import { planeOAuthService } from "@/services/oauth/auth";
import type { AgentConfig, AgentRunContext, AgentWebhookPayload } from "./types";

/**
 * Abstract base class for all agents. Handles common concerns like
 * credential resolution, Plane token refresh, and PlaneClient initialization.
 */
export abstract class BaseAgent {
  abstract readonly config: AgentConfig;

  /**
   * Called by the worker when a webhook arrives. Resolves credentials,
   * refreshes the Plane token, creates a PlaneClient, and delegates to `processAgentRun`.
   */
  async handleWebhook(payload: AgentWebhookPayload): Promise<void> {
    const { workspace_id, project_id, issue_id } = payload;
    const agentRunId = payload.agent_run.id;
    const integrationKey = this.config.integrationKey;

    logger.info(`[${this.config.key}] Processing agent webhook type=${payload.type} for run ${agentRunId}`);

    // Look up workspace connection for this agent
    const workspaceConnection = await integrationConnectionHelper.getWorkspaceConnection({
      workspace_id,
      connection_type: integrationKey,
    });

    if (!workspaceConnection) {
      logger.error(`[${this.config.key}] No workspace connection found for workspace ${workspace_id}`);
      return;
    }

    // Look up credential
    const credential = await integrationConnectionHelper.getWorkspaceCredential({
      credential_id: workspaceConnection.credential_id,
    });

    if (!credential) {
      logger.error(`[${this.config.key}] No credential found for workspace connection ${workspaceConnection.id}`);
      return;
    }

    // Get Plane OAuth token
    const { planeAppClientId, planeAppClientSecret } = await getPlaneAppDetails(integrationKey);
    const token = await planeOAuthService.getOAuthToken(credential, planeAppClientId, planeAppClientSecret);

    if (!token.access_token) {
      logger.error(`[${this.config.key}] Failed to get Plane OAuth token`);
      return;
    }

    // Create PlaneClient using the SDK helper
    const planeClient = getPlaneClientV2({ accessToken: token.access_token });

    // Extract user prompt based on webhook type
    let userPrompt = "";
    if (payload.type === "agent_run_activity") {
      userPrompt = payload.agent_run_activity?.content?.body ?? "";
    }

    const workspaceSlug = workspaceConnection.workspace_slug ?? "";

    const context: AgentRunContext = {
      planeClient,
      agentRunId,
      workspaceSlug,
      workspaceId: workspace_id,
      projectId: project_id,
      issueId: issue_id,
      userPrompt,
      workspaceConnectionId: workspaceConnection.id,
      credentialId: credential.id,
      credential,
      workspaceConnection,
      webhookType: payload.type,
    };

    await this.processAgentRun(context);
  }

  /**
   * Subclasses implement this to handle the actual agent logic.
   */
  abstract processAgentRun(context: AgentRunContext): Promise<void>;
}
