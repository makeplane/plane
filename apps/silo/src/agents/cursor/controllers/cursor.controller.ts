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

import { randomUUID } from "crypto";
import type { Request, Response } from "express";
import { Controller, Delete, Get, Post } from "@plane/decorators";
import { logger } from "@plane/logger";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { env } from "@/env";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { responseHandler } from "@/helpers/response-handler";
import { useValidateUserAuthentication } from "@/lib/decorators";
import { integrationTaskManager } from "@/worker/index";
import { Store } from "@/worker/base/store";
import { CursorApiClient } from "../cursor-api";
import { verifyWebhookSignature } from "../helpers";
import type { CursorProjectMappingEntityData, CursorWebhookPayload, CursorWebhookQueuePayload } from "../types";

const CURSOR_REPOS_CACHE_PREFIX = "silo:cursor:repositories:";
const CURSOR_REPOS_CACHE_TTL = 3600; // 1 hour

interface CursorSettingsBody {
  apiKey?: string;
  repository: string;
  ref?: string;
}

@Controller("/api/agents/cursor")
export class CursorController {
  /**
   * Fetch saved Cursor settings for a workspace.
   * Returns repository, ref, and whether an API key is configured (never the actual key).
   */
  @Get("/settings/:workspaceId/")
  // eslint-disable-next-line react-hooks/rules-of-hooks
  @useValidateUserAuthentication()
  async getSettings(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;

      const workspaceConnection = await integrationConnectionHelper.getWorkspaceConnection({
        workspace_id: workspaceId,
        connection_type: E_INTEGRATION_KEYS.CURSOR,
      });

      if (!workspaceConnection) {
        return responseHandler(res, 404, "Cursor workspace connection not found. Please install the Cursor app first.");
      }

      const connectionData = (workspaceConnection.connection_data as Record<string, unknown>) || {};

      let hasApiKey = false;
      try {
        const credential = await integrationConnectionHelper.getWorkspaceCredential({
          credential_id: workspaceConnection.credential_id,
        });
        hasApiKey = !!credential?.source_access_token;
      } catch {
        // credential not found — hasApiKey stays false
      }

      return responseHandler(res, 200, {
        repository: (connectionData.default_repository as string) || "",
        ref: (connectionData.default_ref as string) || "",
        hasApiKey,
      });
    } catch (error) {
      logger.error("[CursorController] Error fetching settings", { error });
      return responseHandler(res, 500, error);
    }
  }

  /**
   * Save Cursor API key and default repository for a workspace.
   * Called by the frontend when a user configures the Cursor integration.
   * apiKey is optional — if omitted, the existing key is kept.
   */
  @Post("/settings/:workspaceId/")
  // eslint-disable-next-line react-hooks/rules-of-hooks
  @useValidateUserAuthentication()
  async saveSettings(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;
      const { apiKey, repository, ref } = req.body as CursorSettingsBody;

      if (!repository) {
        return responseHandler(res, 400, "repository is required");
      }

      // Look up existing workspace connection
      const workspaceConnection = await integrationConnectionHelper.getWorkspaceConnection({
        workspace_id: workspaceId,
        connection_type: E_INTEGRATION_KEYS.CURSOR,
      });

      if (!workspaceConnection) {
        return responseHandler(res, 404, "Cursor workspace connection not found. Please install the Cursor app first.");
      }

      // Only update the credential if a new API key is provided
      if (apiKey) {
        // Validate the API key against Cursor
        const cursorApi = new CursorApiClient(apiKey);
        try {
          await cursorApi.verifyMe();
        } catch {
          return responseHandler(res, 400, "Invalid Cursor API key");
        }

        await integrationConnectionHelper.updateWorkspaceCredential({
          credential_id: workspaceConnection.credential_id,
          source_access_token: apiKey,
        });
      }

      // Update the workspace connection's connection_data with the default repository
      const existingData = (workspaceConnection.connection_data as Record<string, unknown>) || {};

      // We need to use createOrUpdate since updateWorkspaceConnection only updates config
      // Store repo info in connection_data by re-creating the connection
      await integrationConnectionHelper.createOrUpdateWorkspaceConnection({
        workspace_id: workspaceId,
        connection_type: E_INTEGRATION_KEYS.CURSOR,
        connection_id: workspaceConnection.connection_id,
        connection_slug: workspaceConnection.connection_slug || "",
        connection_data: { ...existingData, default_repository: repository, default_ref: ref || "main" },
        credential_id: workspaceConnection.credential_id,
      });

      return responseHandler(res, 200, { message: "Cursor settings saved" });
    } catch (error) {
      logger.error("[CursorController] Error saving settings", { error });
      return responseHandler(res, 500, error);
    }
  }

  /**
   * Fetch repositories from Cursor API for the workspace.
   */
  @Get("/repositories/:workspaceId/")
  // eslint-disable-next-line react-hooks/rules-of-hooks
  @useValidateUserAuthentication()
  async getRepositories(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;

      const workspaceConnection = await integrationConnectionHelper.getWorkspaceConnection({
        workspace_id: workspaceId,
        connection_type: E_INTEGRATION_KEYS.CURSOR,
      });

      if (!workspaceConnection) {
        return responseHandler(res, 404, "Cursor workspace connection not found.");
      }

      let apiKey: string | undefined;
      try {
        const credential = await integrationConnectionHelper.getWorkspaceCredential({
          credential_id: workspaceConnection.credential_id,
        });
        apiKey = credential?.source_access_token || undefined;
      } catch {
        // credential not found
      }

      if (!apiKey) {
        return responseHandler(res, 400, "Cursor API key is not configured.");
      }

      // Check Redis cache first
      const store = Store.getInstance();
      const cacheKey = `${CURSOR_REPOS_CACHE_PREFIX}${workspaceConnection.connection_id}`;
      const cached = await store.get(cacheKey);
      if (cached) {
        return responseHandler(res, 200, JSON.parse(cached));
      }

      const cursorApi = new CursorApiClient(apiKey);
      const result = await cursorApi.listRepositories();

      // Cache the result
      await store.set(cacheKey, JSON.stringify(result.repositories), CURSOR_REPOS_CACHE_TTL, false);

      return responseHandler(res, 200, result.repositories);
    } catch (error) {
      logger.error("[CursorController] Error fetching repositories", { error });
      return responseHandler(res, 500, error);
    }
  }

  /**
   * List project-to-repository mappings for a workspace.
   */
  @Get("/project-mappings/:workspaceId/")
  // eslint-disable-next-line react-hooks/rules-of-hooks
  @useValidateUserAuthentication()
  async getProjectMappings(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;

      const workspaceConnection = await integrationConnectionHelper.getWorkspaceConnection({
        workspace_id: workspaceId,
        connection_type: E_INTEGRATION_KEYS.CURSOR,
      });

      if (!workspaceConnection) {
        return responseHandler(res, 404, "Cursor workspace connection not found.");
      }

      const entityConnections = await integrationConnectionHelper.getWorkspaceEntityConnections({
        workspace_connection_id: workspaceConnection.id,
        entity_type: "CURSOR_PROJECT_MAPPING",
      });

      const mappings = entityConnections.map((ec) => ({
        id: ec.id,
        project_id: ec.project_id,
        entity_id: ec.entity_id,
        entity_data: ec.entity_data as unknown as CursorProjectMappingEntityData,
      }));

      return responseHandler(res, 200, mappings);
    } catch (error) {
      logger.error("[CursorController] Error fetching project mappings", { error });
      return responseHandler(res, 500, error);
    }
  }

  /**
   * Create a project-to-repository mapping.
   */
  @Post("/project-mappings/:workspaceId/")
  // eslint-disable-next-line react-hooks/rules-of-hooks
  @useValidateUserAuthentication()
  async createProjectMapping(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;
      const { projectId, repository, ref } = req.body as { projectId: string; repository: string; ref?: string };

      if (!projectId || !repository) {
        return responseHandler(res, 400, "projectId and repository are required");
      }

      const workspaceConnections = await integrationConnectionHelper.getWorkspaceConnections({
        workspace_id: workspaceId,
        connection_type: E_INTEGRATION_KEYS.CURSOR,
      });

      if (!workspaceConnections) {
        return responseHandler(res, 404, "Cursor workspace connection not found.");
      }

      const workspaceConnection = workspaceConnections[0];

      const entityData: CursorProjectMappingEntityData = { repository, ref };

      const entityConnection = await integrationConnectionHelper.createOrUpdateWorkspaceEntityConnection({
        workspace_id: workspaceId,
        workspace_connection_id: workspaceConnection.id,
        entity_type: "CURSOR_PROJECT_MAPPING",
        entity_id: repository,
        entity_data: entityData,
        project_id: projectId,
      });

      return responseHandler(res, 200, {
        id: entityConnection.id,
        project_id: entityConnection.project_id,
        entity_id: entityConnection.entity_id,
        entity_data: entityConnection.entity_data as unknown as CursorProjectMappingEntityData,
      });
    } catch (error) {
      logger.error("[CursorController] Error creating project mapping", { error });
      return responseHandler(res, 500, error);
    }
  }

  /**
   * Delete a project-to-repository mapping.
   */
  @Delete("/project-mappings/:workspaceId/:entityConnectionId/")
  // eslint-disable-next-line react-hooks/rules-of-hooks
  @useValidateUserAuthentication()
  async deleteProjectMapping(req: Request, res: Response) {
    try {
      const { entityConnectionId } = req.params;

      await integrationConnectionHelper.deleteWorkspaceEntityConnection({
        entity_connection_id: entityConnectionId,
      });

      return responseHandler(res, 200, { message: "Project mapping deleted" });
    } catch (error) {
      logger.error("[CursorController] Error deleting project mapping", { error });
      return responseHandler(res, 500, error);
    }
  }

  /**
   * Cursor webhook — called by Cursor when agent status changes to FINISHED or ERROR.
   * Validates the signature, queues the payload for async processing, and returns 200 immediately.
   * Query params: wc_id (workspace connection ID), ws_id (workspace ID)
   */
  @Post("/webhook")
  async handleCursorWebhook(req: Request, res: Response) {
    try {
      const secret = env.CURSOR_WEBHOOK_SECRET;
      if (!secret) {
        logger.error("[CursorController] CURSOR_WEBHOOK_SECRET not configured");
        return responseHandler(res, 500, "Webhook secret not configured");
      }

      // Verify webhook signature
      const signature = req.headers["x-webhook-signature"] as string | undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access
      const rawBody = (req as any).rawBody as string | undefined;

      if (!signature || !rawBody) {
        return responseHandler(res, 401, "Missing webhook signature");
      }

      if (!verifyWebhookSignature(rawBody, signature, secret)) {
        return responseHandler(res, 401, "Invalid webhook signature");
      }

      const payload = req.body as CursorWebhookPayload;
      const cursorAgentId = payload.id;

      if (!cursorAgentId) {
        return responseHandler(res, 400, "Missing agent ID in payload");
      }

      // Read correlation params from query string
      const workspaceConnectionId = req.query.wc_id as string | undefined;
      const workspaceId = req.query.ws_id as string | undefined;

      if (!workspaceConnectionId || !workspaceId) {
        logger.error("[CursorController] Missing wc_id or ws_id query params");
        return responseHandler(res, 400, "Missing wc_id or ws_id query params");
      }

      logger.info(`[CursorController] Received webhook for cursor agent ${cursorAgentId}, status=${payload.status}`);

      // Queue the webhook for async processing and return immediately
      const queuePayload: CursorWebhookQueuePayload = { payload, workspaceConnectionId, workspaceId };
      await integrationTaskManager.registerTask(
        { route: "cursor-webhook", jobId: randomUUID(), type: "cursor" },
        queuePayload
      );

      return res.status(200).json({ message: "ok" });
    } catch (error) {
      logger.error("[CursorController] Error handling webhook", { error });
      return responseHandler(res, 500, error);
    }
  }
}
