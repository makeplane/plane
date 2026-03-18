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

/* eslint-disable react-hooks/rules-of-hooks -- useValidateUserAuthentication is a decorator, not a React hook */
import type { Request, RequestHandler, Response } from "express";
import { Controller, Delete, Get, Middleware, Post } from "@plane/decorators";
import type {
  BitbucketPullRequestWebhookAction,
  BitbucketRepository,
  BitbucketWebhookPayload,
} from "@plane/etl/bitbucket";
import { logger } from "@plane/logger";
import type { ExIssueLabel, PlaneWebhookPayloadBase } from "@plane/sdk";
import type { TBitbucketWorkspaceConnection } from "@plane/types";
import { E_INTEGRATION_KEYS } from "@plane/types";
import { env } from "@/env";
import { responseHandler } from "@/helpers/response-handler";
import { EnsureEnabled, useValidateUserAuthentication } from "@/lib/decorators";
import { getAPIClient } from "@/services/client";
import { integrationTaskManager } from "@/worker";
import {
  BITBUCKET_PR_WEBHOOK_EVENTS,
  buildBitbucketService,
  getHeaderValue,
  getWebhookSourceBaseUrl,
  logBitbucketWebhookPayload,
  verifyBitbucketWebhook,
} from "../helpers";

type PlaneIssueWebhookData = {
  id: string;
  workspace: string;
  project: string;
  labels?: ExIssueLabel[];
};

type PlaneIssueCommentWebhookData = {
  id: string;
  workspace: string;
  project: string;
  issue: string;
};

type PlaneBitbucketWebhookPayload = PlaneWebhookPayloadBase<PlaneIssueWebhookData | PlaneIssueCommentWebhookData>;

const apiClient = getAPIClient();

@EnsureEnabled(E_INTEGRATION_KEYS.BITBUCKET_DC)
@Controller("/api/bitbucket-dc")
export default class BitbucketController {
  @Get("/ping")
  ping(_req: Request, res: Response) {
    res.send({ message: "pong" });
  }

  @Get("/repositories/:workspaceId")
  @useValidateUserAuthentication()
  async getRepositories(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;

      if (!workspaceId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId to be present.",
        });
      }

      const workspaceConnections = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.BITBUCKET_DC,
        workspace_id: workspaceId,
      });

      if (!workspaceConnections || workspaceConnections.length === 0) {
        return res.status(200).send([]);
      }

      const workspaceConnection = workspaceConnections[0] as TBitbucketWorkspaceConnection;
      const credential = await apiClient.workspaceCredential.getWorkspaceCredential(workspaceConnection.credential_id);

      if (!credential.source_access_token) {
        return res.status(401).json({
          message: "No Bitbucket credentials found for the workspace",
        });
      }

      const baseUrl = workspaceConnection.connection_data?.baseUrl || credential.source_hostname;
      if (!baseUrl) {
        return res.status(400).json({
          message: "Bitbucket base URL not found in workspace connection",
        });
      }

      const bitbucketService = buildBitbucketService(baseUrl, credential, workspaceConnection);

      let repositories: BitbucketRepository[] = [];
      const projectKey = typeof req.query.projectKey === "string" ? req.query.projectKey : undefined;

      if (projectKey) {
        repositories = await bitbucketService.getRepositoriesForProject(projectKey);
      } else {
        repositories = await bitbucketService.getRepositories();
      }

      return res.status(200).json(
        repositories.map((repo) => ({
          id: repo.id,
          slug: repo.slug,
          name: repo.name,
          project: {
            key: repo.project.key,
            name: repo.project.name,
          },
        }))
      );
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/bitbucket-dc-webhook")
  @Middleware(verifyBitbucketWebhook as RequestHandler)
  async bitbucketWebhook(req: Request, res: Response) {
    try {
      const eventType = getHeaderValue(req.headers["x-event-key"]);
      const deliveryId = getHeaderValue(req.headers["x-request-id"]);

      const payload = req.body as BitbucketWebhookPayload;
      logBitbucketWebhookPayload(payload, eventType, deliveryId);

      if (!eventType) {
        return res.status(400).send({
          message: "Missing X-Event-Key header",
        });
      }

      if (BITBUCKET_PR_WEBHOOK_EVENTS.includes(eventType as BitbucketPullRequestWebhookAction)) {
        const repository = payload.pullRequest?.toRef?.repository || payload.repository;

        const projectKey = repository?.project?.key;
        const repoSlug = repository?.slug;
        const pullRequestId = payload.pullRequest?.id;
        const repositoryId = repository?.id;

        if (!projectKey || !repoSlug || typeof pullRequestId !== "number" || repositoryId === undefined) {
          return res.status(400).send({
            message: "Invalid pull request webhook payload",
          });
        }

        const eventActorId =
          payload.actor?.id !== undefined ? payload.actor.id.toString() : (payload.actor?.slug ?? "");
        const sourceBaseUrl = getWebhookSourceBaseUrl(payload);

        // Bitbucket event types contain colons (e.g. "pr:modified", "pr:opened") which conflict
        // with the Redis store key format used by TaskManager (silo:{route}:{type}:{jobId}:{entity}).
        // The manager splits on ":" to parse headers back, so we sanitize colons in route-level
        // fields. The original event type is preserved in data.action for the worker to use.
        const sanitizedEventType = eventType.replaceAll(":", "_");
        await integrationTaskManager.registerStoreTask(
          {
            route: "bitbucket-dc-webhook",
            jobId: sanitizedEventType,
            type: sanitizedEventType,
          },
          {
            action: eventType,
            projectKey,
            repositoryId: repositoryId.toString(),
            repositoryName: repository.name,
            repoSlug,
            pullRequestId: pullRequestId.toString(),
            eventActorId,
            sourceBaseUrl,
          },
          Number(env.DEDUP_INTERVAL)
        );
      } else {
        await integrationTaskManager.registerTask(
          {
            route: "bitbucket-dc-webhook",
            jobId: deliveryId || `${eventType}-${Date.now()}`,
            type: eventType,
          },
          req.body
        );
      }

      return res.status(202).send({
        message: "Webhook received",
      });
    } catch (error) {
      logger.error("Failed to process Bitbucket webhook:", error);
      return responseHandler(res, 500, error);
    }
  }

  @Post("/plane-webhook")
  async planeWebhook(req: Request, res: Response) {
    try {
      const eventType = getHeaderValue(req.headers["x-plane-event"]);
      const event = (req.body as { event?: string }).event;

      if (event === "issue" || event === "issue_comment") {
        const payload = req.body as PlaneBitbucketWebhookPayload;

        const id = payload.data.id;
        const workspace = payload.data.workspace;
        const project = payload.data.project;
        const issue = "issue" in payload.data ? payload.data.issue : payload.data.id;
        const taskType = eventType || event;

        if (event === "issue") {
          const labels = "labels" in payload.data ? payload.data.labels : undefined;

          if (
            !labels ||
            !labels.find((label) => label.name.toLowerCase() === E_INTEGRATION_KEYS.BITBUCKET_DC.toLowerCase())
          ) {
            return res.status(202).send({
              message: "Webhook received",
            });
          }

          const skipFields = ["priority", "state", "start_date", "target_date", "cycles", "parent", "modules", "link"];
          if (payload.activity.field && skipFields.includes(payload.activity.field)) {
            return res.status(202).send({
              message: "Webhook received",
            });
          }
        }

        await integrationTaskManager.registerStoreTask(
          {
            route: "plane-bitbucket-dc-webhook",
            jobId: taskType,
            type: taskType,
          },
          {
            id,
            event,
            action: payload.action,
            workspace,
            project,
            issue,
          },
          Number(env.DEDUP_INTERVAL)
        );
      }

      return res.status(202).send({
        message: "Webhook received",
      });
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/entity-connections/:workspaceId/:workspaceConnectionId")
  @useValidateUserAuthentication()
  async addEntityConnection(req: Request, res: Response) {
    try {
      const { workspaceId, workspaceConnectionId } = req.params;

      const reqBody = req.body as {
        workspace_slug?: string;
        project_id?: string;
        entity_id?: string;
        entity_type?: string;
        entity_slug?: string;
        entity_data?: { id: number; slug: string; name: string; project: { key: string; name: string } };
        config?: Record<string, unknown>;
        type?: string;
      };

      if (
        !workspaceId ||
        !workspaceConnectionId ||
        !reqBody.entity_id ||
        !reqBody.entity_slug ||
        !reqBody.entity_data
      ) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, workspaceConnectionId, entity_id, entity_slug, and entity_data.",
        });
      }

      // Get workspace connection and credential to create webhook on Bitbucket
      const workspaceConnection = (await apiClient.workspaceConnection.getWorkspaceConnection(
        workspaceConnectionId
      )) as TBitbucketWorkspaceConnection | null;

      if (!workspaceConnection) {
        return res.status(404).send({ message: "Workspace connection not found" });
      }

      const credential = await apiClient.workspaceCredential.getWorkspaceCredential(workspaceConnection.credential_id);
      const baseUrl = workspaceConnection.connection_data?.baseUrl || credential.source_hostname;

      if (!baseUrl || !credential.source_access_token) {
        return res.status(400).send({ message: "Bitbucket credentials not found" });
      }

      // Create webhook on Bitbucket DC repo
      const bitbucketService = buildBitbucketService(baseUrl, credential, workspaceConnection);
      const projectKey = reqBody.entity_data.project.key;
      const repoSlug = reqBody.entity_data.slug;
      const webhookUrl = `${env.SILO_API_BASE_URL}${env.SILO_BASE_PATH}/api/bitbucket-dc/bitbucket-dc-webhook`;
      const webhookSecret = workspaceConnection.connection_data?.appConfig?.webhookSecret || "";

      const webhookEvents = [
        "pr:opened",
        "pr:modified",
        "pr:merged",
        "pr:declined",
        "pr:deleted",
        "pr:comment:added",
        "pr:comment:edited",
        "pr:comment:deleted",
      ];

      logger.info("Creating Bitbucket webhook", {
        projectKey,
        repoSlug,
        webhookUrl,
        baseUrl,
        eventsCount: webhookEvents.length,
      });

      let webhook: { id: number };
      try {
        webhook = await bitbucketService.createRepositoryWebhook(
          projectKey,
          repoSlug,
          webhookUrl,
          webhookSecret,
          webhookEvents
        );
      } catch (webhookError) {
        const axiosError = webhookError as {
          response?: { status?: number; data?: unknown; headers?: unknown };
          message?: string;
        };
        logger.error("Failed to create Bitbucket webhook on DC", {
          status: axiosError.response?.status,
          responseBody: axiosError.response?.data,
          message: axiosError.message,
          projectKey,
          repoSlug,
          webhookUrl,
        });
        return res.status(502).send({
          message: "Failed to create webhook on Bitbucket",
          bitbucketStatus: axiosError.response?.status,
          bitbucketError: axiosError.response?.data,
        });
      }

      const connection = await apiClient.workspaceEntityConnection.createWorkspaceEntityConnection({
        workspace_id: workspaceId,
        workspace_connection_id: workspaceConnectionId,
        workspace_slug: reqBody.workspace_slug,
        project_id: reqBody.project_id,
        entity_id: reqBody.entity_id,
        entity_type: reqBody.entity_type,
        entity_slug: reqBody.entity_slug,
        entity_data: {
          ...reqBody.entity_data,
          webhookId: webhook.id,
        },
        config: reqBody.config,
        type: reqBody.type,
      });

      return res.status(200).json(connection);
    } catch (error) {
      const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
      logger.error("Failed to create Bitbucket entity connection:", {
        error: axiosError.message || "Unknown error",
        status: axiosError.response?.status,
        responseBody: axiosError.response?.data,
      });
      return responseHandler(res, 500, error);
    }
  }

  @Delete("/entity-connections/:workspaceId/:workspaceConnectionId/:entityId")
  @useValidateUserAuthentication()
  async removeEntityConnection(req: Request, res: Response) {
    try {
      const { workspaceId, workspaceConnectionId, entityId } = req.params;

      if (!workspaceId || !workspaceConnectionId || !entityId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, workspaceConnectionId, and entityId.",
        });
      }

      // Find the entity connection
      const [entityConnection] = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
        workspace_connection_id: workspaceConnectionId,
        workspace_id: workspaceId,
        id: entityId,
      });

      if (!entityConnection) {
        return res.status(404).send({ message: "Entity connection not found" });
      }

      // Remove webhook from Bitbucket DC
      const entityData = entityConnection.entity_data as {
        webhookId?: number;
        project?: { key: string };
        slug?: string;
      };

      if (entityData?.webhookId && entityData?.project?.key && entityData?.slug) {
        try {
          const workspaceConnection = (await apiClient.workspaceConnection.getWorkspaceConnection(
            workspaceConnectionId
          )) as TBitbucketWorkspaceConnection | null;

          if (workspaceConnection) {
            const credential = await apiClient.workspaceCredential.getWorkspaceCredential(
              workspaceConnection.credential_id
            );
            const baseUrl = workspaceConnection.connection_data?.baseUrl || credential.source_hostname;

            if (baseUrl && credential.source_access_token) {
              const bitbucketService = buildBitbucketService(baseUrl, credential, workspaceConnection);
              await bitbucketService.deleteRepositoryWebhook(
                entityData.project.key,
                entityData.slug,
                entityData.webhookId.toString()
              );
            }
          }
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Unknown error";
          logger.error("Failed to remove Bitbucket webhook, continuing with entity deletion", { error: msg });
        }
      }

      const result = await apiClient.workspaceEntityConnection.deleteWorkspaceEntityConnection(entityConnection.id);
      return res.status(200).json(result);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error("Failed to delete Bitbucket entity connection:", { error: msg });
      return responseHandler(res, 500, error);
    }
  }
}
