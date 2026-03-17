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
import { E_INTEGRATION_KEYS } from "@plane/types";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { getPlaneAppDetails } from "@/helpers/plane-app-details";
import { getPlaneClientV2 } from "@/helpers/plane-api-client-v2";
import type { TaskHeaders } from "@/types";
import { TaskHandler } from "@/types";
import type { MQ, Store } from "@/worker/base";
import { planeOAuthService } from "@/services/oauth/auth";
import { CursorApiClient } from "../cursor-api";
import { markdownToHtml } from "../helpers";
import type { CursorSessionEntityData, CursorWebhookQueuePayload } from "../types";

export class CursorWebhookWorker extends TaskHandler {
  mq: MQ;
  store: Store;

  constructor(mq: MQ, store: Store) {
    super();
    this.mq = mq;
    this.store = store;
  }

  async handleTask(_headers: TaskHeaders, data: CursorWebhookQueuePayload): Promise<boolean> {
    const { payload, workspaceConnectionId, workspaceId } = data;
    const cursorAgentId = payload.id;

    logger.info(`[CursorWebhookWorker] Processing webhook for cursor agent ${cursorAgentId}, status=${payload.status}`);

    // Look up the entity connection using workspace_connection_id + entity_id (cursor agent ID)
    const entityConnection = await integrationConnectionHelper.getWorkspaceEntityConnection({
      workspace_connection_id: workspaceConnectionId,
      entity_id: cursorAgentId,
    });

    if (!entityConnection) {
      logger.error(`[CursorWebhookWorker] No entity connection found for cursor agent ${cursorAgentId}`);
      return false;
    }

    const entityData = entityConnection.entity_data as unknown as CursorSessionEntityData;

    // Get workspace connection and credential to create a PlaneClient
    const workspaceConnection = await integrationConnectionHelper.getWorkspaceConnection({
      workspace_id: workspaceId,
      connection_type: E_INTEGRATION_KEYS.CURSOR,
    });

    if (!workspaceConnection) {
      logger.error("[CursorWebhookWorker] No workspace connection found");
      return false;
    }

    const credential = await integrationConnectionHelper.getWorkspaceCredential({
      credential_id: workspaceConnection.credential_id,
    });

    if (!credential) {
      logger.error("[CursorWebhookWorker] No credential found");
      return false;
    }

    // Refresh Plane OAuth token and create PlaneClient
    const { planeAppClientId, planeAppClientSecret } = await getPlaneAppDetails(E_INTEGRATION_KEYS.CURSOR);
    const token = await planeOAuthService.getOAuthToken(credential, planeAppClientId, planeAppClientSecret);
    const planeClient = getPlaneClientV2({ accessToken: token.access_token });

    const workspaceSlug = entityData.workspace_slug;
    const agentRunId = entityData.agent_run_id;

    const apiKey = credential.source_access_token;
    const alreadyPosted = entityData.posted_message_count || 0;
    let newPostedCount = alreadyPosted;

    if (payload.status === "FINISHED" || payload.status === "ERROR") {
      let prUrl = payload.target?.prUrl;

      if (apiKey) {
        const cursorApi = new CursorApiClient(apiKey);

        // Fetch agent details for PR URL (only on FINISHED)
        if (payload.status === "FINISHED") {
          try {
            const agentDetails = await cursorApi.getAgent(cursorAgentId);
            prUrl = agentDetails.target?.prUrl || prUrl;
          } catch {
            // Use payload data as fallback
          }
        }

        // Fetch conversation and post all new assistant messages
        try {
          const conversation = await cursorApi.getConversation(cursorAgentId);
          const assistantMessages = conversation.messages.filter((m) => m.type === "assistant_message");
          const newMessages = assistantMessages.slice(alreadyPosted);

          for (const message of newMessages) {
            await planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
              type: "response",
              content: { type: "response", body: markdownToHtml(message.text) },
            });
          }

          newPostedCount = assistantMessages.length;

          // If no new messages, post a fallback
          if (newMessages.length === 0) {
            const fallback =
              payload.status === "ERROR"
                ? `Cursor agent encountered an error: ${payload.summary || payload.name || "Unknown error"}`
                : payload.summary || payload.name || "Cursor agent completed.";

            await planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
              type: "response",
              content: { type: "response", body: markdownToHtml(fallback) },
            });
          }
        } catch {
          // Fall back to payload summary
          const fallback =
            payload.status === "ERROR"
              ? `Cursor agent encountered an error: ${payload.summary || payload.name || "Unknown error"}`
              : payload.summary || payload.name || "Cursor agent completed.";

          await planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
            type: "response",
            content: { type: "response", body: markdownToHtml(fallback) },
          });
        }
      } else {
        // No API key — use payload data
        const fallback =
          payload.status === "ERROR"
            ? `Cursor agent encountered an error: ${payload.summary || payload.name || "Unknown error"}`
            : payload.summary || payload.name || "Cursor agent completed.";

        await planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
          type: "response",
          content: { type: "response", body: markdownToHtml(fallback) },
        });
      }

      // Append PR link as a separate response on FINISHED
      if (payload.status === "FINISHED" && prUrl) {
        await planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
          type: "response",
          content: { type: "response", body: markdownToHtml(`Pull Request: ${prUrl}`) },
        });
      }
    }

    // Update entity connection status and posted message count
    await integrationConnectionHelper.updateWorkspaceEntityConnection({
      entity_connection_id: entityConnection.id,
      entity_data: { ...entityData, status: payload.status, posted_message_count: newPostedCount },
    });

    return true;
  }
}
