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
import { env } from "@/env";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { BaseAgent } from "../core";
import type { AgentConfig, AgentRunContext } from "../core";
import { CursorApiClient } from "./cursor-api";
import { buildCursorPrompt, getCursorApiKey, getDefaultRepository, getWebhookCallbackUrl } from "./helpers";
import type { CursorProjectMappingEntityData, CursorSessionEntityData } from "./types";

/**
 * Cursor Agent — launches Cursor Cloud Agent sessions and forwards follow-ups.
 *
 * First @mention (agent_run):     launches a new Cursor session
 * Follow-up (agent_run_activity): sends a follow-up to the existing Cursor session
 * Cursor completion:              handled by CursorController webhook endpoint → CursorWebhookWorker
 */
export class CursorAgent extends BaseAgent {
  readonly config: AgentConfig = {
    key: "cursor",
    integrationKey: E_INTEGRATION_KEYS.CURSOR,
  };

  async processAgentRun(context: AgentRunContext): Promise<void> {
    const {
      planeClient,
      agentRunId,
      workspaceSlug,
      workspaceId,
      projectId,
      issueId,
      userPrompt,
      credential,
      workspaceConnection,
      workspaceConnectionId,
    } = context;
    logger.info(`[CursorAgent] Processing run ${agentRunId}, type=${context.webhookType}`);

    // 1. Get Cursor API key from credential
    const apiKey = getCursorApiKey(credential);
    if (!apiKey) {
      await planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
        type: "response",
        content: {
          type: "response",
          body: "Cursor API key is not configured. Please set up the Cursor integration in your workspace settings.",
        },
      });
      return;
    }

    const cursorApi = new CursorApiClient(apiKey);

    // 2. Check if this agent run already has a Cursor session
    const existingSession = await this.findExistingSession(workspaceConnectionId, agentRunId);

    if (existingSession) {
      // Follow-up: send message to existing Cursor session
      await this.handleFollowUp(cursorApi, planeClient, workspaceSlug, agentRunId, existingSession, userPrompt);
      return;
    }

    // 3. Resolve repository: project mapping → default repo → elicitation
    const repoConfig = await this.resolveRepository(workspaceConnectionId, workspaceConnection, projectId);

    if (!repoConfig) {
      // No mapping and no default — check if this is a reply to an elicitation
      if (context.webhookType === "agent_run_activity" && userPrompt) {
        const parsed = this.parseRepositoryFromReply(userPrompt);
        if (parsed) {
          await this.handleNewSession(
            cursorApi,
            planeClient,
            workspaceSlug,
            agentRunId,
            workspaceId,
            workspaceConnectionId,
            projectId,
            issueId,
            parsed,
            userPrompt
          );
          return;
        }
      }

      // Ask the user which repo to use
      await planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
        type: "elicitation",
        content: {
          type: "elicitation",
          body: "No repository is configured for this project. Which repository should I work on? Please reply with the repository in <code>owner/repo</code> format.",
        },
      });
      return;
    }

    // 4. Launch a new Cursor session
    await this.handleNewSession(
      cursorApi,
      planeClient,
      workspaceSlug,
      agentRunId,
      workspaceId,
      workspaceConnectionId,
      projectId,
      issueId,
      repoConfig,
      userPrompt
    );
  }

  /**
   * Look up an existing Cursor session for this agent run.
   */
  private async findExistingSession(
    workspaceConnectionId: string,
    agentRunId: string
  ): Promise<CursorSessionEntityData | null> {
    try {
      const entityConnections = await integrationConnectionHelper.getWorkspaceEntityConnections({
        workspace_connection_id: workspaceConnectionId,
        entity_type: "CURSOR_SESSION",
      });

      for (const ec of entityConnections) {
        const data = ec.entity_data as unknown as CursorSessionEntityData;
        if (data.agent_run_id === agentRunId) {
          return data;
        }
      }
    } catch (error) {
      logger.error("[CursorAgent] Error looking up existing session", { error });
    }
    return null;
  }

  /**
   * Resolve which repository to use for this agent run.
   * Priority: project mapping → default repo → null (triggers elicitation).
   */
  private async resolveRepository(
    workspaceConnectionId: string,
    workspaceConnection: AgentRunContext["workspaceConnection"],
    projectId: string
  ): Promise<{ repository: string; ref?: string } | null> {
    try {
      const entityConnections = await integrationConnectionHelper.getWorkspaceEntityConnections({
        workspace_connection_id: workspaceConnectionId,
        entity_type: "CURSOR_PROJECT_MAPPING",
      });

      for (const ec of entityConnections) {
        if (ec.project_id === projectId) {
          const data = ec.entity_data as unknown as CursorProjectMappingEntityData;
          return { repository: data.repository, ref: data.ref };
        }
      }
    } catch (error) {
      logger.error("[CursorAgent] Error looking up project mapping", { error });
    }

    // Fallback to default repository
    return getDefaultRepository(workspaceConnection);
  }

  /**
   * Parse a repository string from the user's elicitation reply.
   * Expects "owner/repo" format (possibly wrapped in HTML tags).
   */
  private parseRepositoryFromReply(htmlBody: string): { repository: string; ref?: string } | null {
    const text = htmlBody.replace(/<[^>]*>/g, "").trim();
    const match = text.match(/^([a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+)$/);
    if (match) {
      return { repository: match[1] };
    }
    return null;
  }

  /**
   * Launch a new Cursor Cloud Agent session.
   */
  private async handleNewSession(
    cursorApi: CursorApiClient,
    planeClient: AgentRunContext["planeClient"],
    workspaceSlug: string,
    agentRunId: string,
    workspaceId: string,
    workspaceConnectionId: string,
    projectId: string,
    issueId: string,
    repoConfig: { repository: string; ref?: string },
    userPrompt: string
  ): Promise<void> {
    // Thought activity
    await planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
      type: "thought",
      content: { type: "thought", body: "Launching Cursor agent..." },
    });

    try {
      // Fetch issue metadata for richer prompt context
      let issueContext: { title: string; descriptionHtml?: string } | undefined;
      try {
        const workItem = await planeClient.workItems.retrieve(workspaceSlug, projectId, issueId);
        issueContext = {
          title: workItem.name,
          descriptionHtml: workItem.description_html || undefined,
        };
      } catch (error) {
        logger.warn("[CursorAgent] Failed to fetch issue details, proceeding without context", { error });
      }

      const promptText = buildCursorPrompt(userPrompt, issueContext);

      const callbackUrl = getWebhookCallbackUrl({
        workspaceConnectionId,
        workspaceId,
      });
      const webhook = { url: callbackUrl, secret: env.CURSOR_WEBHOOK_SECRET };

      const cursorAgent = await cursorApi.launchAgent({
        prompt: { text: promptText },
        source: { repository: repoConfig.repository, ref: repoConfig.ref },
        target: { autoCreatePr: true, openAsCursorGithubApp: true },
        webhook,
      });

      logger.info(`[CursorAgent] Launched cursor session ${cursorAgent.id} for run ${agentRunId}`);

      // Store mapping as entity connection
      const entityData: CursorSessionEntityData = {
        cursor_session_id: cursorAgent.id,
        agent_run_id: agentRunId,
        workspace_slug: workspaceSlug,
        project_id: projectId,
        issue_id: issueId,
        repository: repoConfig.repository,
        status: cursorAgent.status,
      };

      await integrationConnectionHelper.createOrUpdateWorkspaceEntityConnection({
        workspace_id: workspaceId,
        workspace_connection_id: workspaceConnectionId,
        entity_type: "CURSOR_SESSION",
        entity_id: cursorAgent.id,
        entity_data: entityData,
        project_id: projectId,
        issue_id: issueId,
      });

      // Response activity
      await planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
        type: "response",
        content: {
          type: "response",
          body: `Cursor agent launched against \`${repoConfig.repository}\`. I'll update you when it's done.`,
        },
      });
    } catch (error) {
      logger.error("[CursorAgent] Failed to launch cursor agent", { error });
      await planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
        type: "response",
        content: {
          type: "response",
          body: "Failed to launch Cursor agent. Please check your API key and repository configuration.",
        },
      });
    }
  }

  /**
   * Send a follow-up message to an existing Cursor session.
   */
  private async handleFollowUp(
    cursorApi: CursorApiClient,
    planeClient: AgentRunContext["planeClient"],
    workspaceSlug: string,
    agentRunId: string,
    session: CursorSessionEntityData,
    userPrompt: string
  ): Promise<void> {
    await planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
      type: "thought",
      content: { type: "thought", body: "Sending follow-up to Cursor agent..." },
    });

    try {
      const promptText = buildCursorPrompt(userPrompt);
      await cursorApi.addFollowUp(session.cursor_session_id, {
        prompt: { text: promptText },
      });

      await planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
        type: "response",
        content: {
          type: "response",
          body: "Follow-up sent to Cursor agent.",
        },
      });
    } catch (error) {
      logger.error("[CursorAgent] Failed to send follow-up", { error });
      await planeClient.agentRuns.activities.create(workspaceSlug, agentRunId, {
        type: "response",
        content: {
          type: "response",
          body: "Failed to send follow-up to Cursor agent.",
        },
      });
    }
  }
}
