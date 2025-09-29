import { Request, Response } from "express";
import { Controller, Delete, Get, Post } from "@plane/decorators";
import {
  GitlabWebhookEvent,
  GitlabWebhook,
  GitlabEnterpriseEntityType,
  IGitlabEntity,
  GitlabEntityData,
  EConnectionType,
} from "@plane/etl/gitlab";
import { logger } from "@plane/logger";
import { ExIssueLabel } from "@plane/sdk";
import {
  E_INTEGRATION_KEYS,
  TGitlabWorkspaceConnection,
  TGitlabAppConfig,
  TWorkspaceEntityConnection,
} from "@plane/types";
import { getGitlabClientService, getGitlabEnterpriseAuthService } from "@/apps/gitlab/services";
import { env } from "@/env";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { responseHandler } from "@/helpers/response-handler";
import { EnsureEnabled, useValidateUserAuthentication } from "@/lib/decorators";
import { getAPIClient } from "@/services/client";
import { integrationTaskManager } from "@/worker";
import { getGitlabEntityWebhookURL } from "../helpers/urls";

const apiClient = getAPIClient();

@EnsureEnabled(E_INTEGRATION_KEYS.GITLAB_ENTERPRISE)
@Controller("/api/gitlab-enterprise")
export default class GitlabEnterpriseController {
  private readonly integrationKey = E_INTEGRATION_KEYS.GITLAB_ENTERPRISE;

  @Post("/plane-webhook")
  async planeWebhook(req: Request, res: Response) {
    try {
      // Get the event types and delivery id
      const eventType = req.headers["x-plane-event"];

      const id = req.body.data.id;
      const event = req.body.event;
      const workspace = req.body.data.workspace;
      const project = req.body.data.project;
      const issue = req.body.data.issue;

      if (event == "issue") {
        const labels = req.body.data.labels as ExIssueLabel[] | undefined;
        // If labels doesn't include gitlab label, then we don't need to process this event
        if (!labels || !labels.find((label) => label.name === E_INTEGRATION_KEYS.GITLAB)) {
          return res.status(202).send({
            message: "Webhook received",
          });
        }
      }

      // Forward the event to the task manager to process
      await integrationTaskManager.registerStoreTask(
        {
          route: "plane-gitlab-webhook",
          jobId: eventType as string,
          type: eventType as string,
        },
        {
          id,
          event,
          workspace,
          project,
          issue,
        },
        Number(env.DEDUP_INTERVAL)
      );

      return res.status(202).send({
        message: "Webhook received",
      });
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  @Post("/entity-connections/:workspaceId/:workspaceConnectionId")
  @useValidateUserAuthentication()
  async addEntityConnection(req: Request, res: Response) {
    try {
      const { workspaceId, workspaceConnectionId } = req.params;

      const { entity_id, entity_type, entity_slug, entity_data } = req.body as TWorkspaceEntityConnection;

      if (!workspaceId || !workspaceConnectionId || !entity_id || !entity_type || !entity_slug || !entity_data) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, workspaceConnectionId, and entityId to be present.",
        });
      }

      const workspaceConnection = (await apiClient.workspaceConnection.getWorkspaceConnection(
        workspaceConnectionId
      )) as TGitlabWorkspaceConnection;
      if (!workspaceConnection) {
        return res.status(400).send({
          message: "Workspace connection not found",
        });
      }
      const appConfig = workspaceConnection.connection_data.appConfig as TGitlabAppConfig;

      // Check for existing connections
      const wsEntityConnections = await integrationConnectionHelper.getWorkspaceEntityConnections({
        workspace_connection_id: workspaceConnectionId,
        entity_type: entity_type,
      });

      const existingConnection = wsEntityConnections.find((connection) => connection.entity_id === entity_id);

      if (existingConnection) {
        return res.status(201).json({ error: "Entity connection already exists" });
      }

      // Add webhook to gitlab
      const { url, token } = await this.getWorkspaceWebhookData(workspaceId, appConfig);
      const gitlabClientService = await getGitlabClientService(
        workspaceId,
        this.integrationKey,
        appConfig.baseUrl,
        appConfig.clientId,
        appConfig.clientSecret
      );

      // based on enum either add to project or group
      let webhookId;
      if (entity_type === GitlabEnterpriseEntityType.PROJECT) {
        const { id: hookId } = await gitlabClientService.addWebhookToProject(entity_id, url, token);
        webhookId = hookId;
      } else {
        const { id: hookId } = await gitlabClientService.addWebhookToGroup(entity_id, url, token);
        webhookId = hookId;
      }

      const connection = await integrationConnectionHelper.createOrUpdateWorkspaceEntityConnection({
        workspace_id: workspaceId,
        workspace_connection_id: workspaceConnectionId,
        type: EConnectionType.ENTITY,
        entity_id: entity_id,
        entity_type: entity_type,
        entity_slug: entity_slug,
        entity_data: {
          id: entity_id,
          type: entity_type,
          webhookId,
        },
      });

      res.status(200).json(connection);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/entity-project-connections/:workspaceId/:workspaceConnectionId")
  @useValidateUserAuthentication()
  async addProjectConnection(req: Request, res: Response) {
    try {
      const { workspaceId, workspaceConnectionId } = req.params;
      const { project_id, workspace_slug, config } = req.body as TWorkspaceEntityConnection;

      if (!workspaceId || !workspaceConnectionId || !project_id || !workspace_slug) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, workspaceConnectionId, and projectId to be present.",
        });
      }

      // Check for existing connections
      const wsEntityConnections = await integrationConnectionHelper.getWorkspaceEntityConnections({
        workspace_connection_id: workspaceConnectionId,
        entity_type: GitlabEnterpriseEntityType.PROJECT,
      });
      const existingConnection = wsEntityConnections.find((connection) => connection.project_id === project_id);

      if (existingConnection) {
        return res.status(201).json({ error: "Entity connection already exists" });
      }

      const connection = await integrationConnectionHelper.createOrUpdateWorkspaceEntityConnection({
        workspace_id: workspaceId,
        workspace_connection_id: workspaceConnectionId,
        config,
        type: EConnectionType.PLANE_PROJECT,
        project_id,
        entity_type: GitlabEnterpriseEntityType.PROJECT,
        entity_data: {
          id: project_id,
          type: GitlabEnterpriseEntityType.PROJECT,
        },
      });

      res.status(200).json(connection);
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  @Delete("/entity-connections/:connectionId")
  @useValidateUserAuthentication()
  async removeEntityConnection(req: Request, res: Response) {
    try {
      const { connectionId: entityConnectionId } = req.params;

      const entityConnection =
        await apiClient.workspaceEntityConnection.getWorkspaceEntityConnection(entityConnectionId);
      if (!entityConnection) {
        return res.status(400).json({ error: "Entity connection not found" });
      }

      const wsConnection = (await apiClient.workspaceConnection.getWorkspaceConnection(
        entityConnection.workspace_connection_id
      )) as TGitlabWorkspaceConnection;
      if (!wsConnection) {
        return res.status(400).json({ error: "Workspace connection not found" });
      }

      if (!wsConnection.connection_data.appConfig) {
        logger.error(`${this.integrationKey} App config not found for`, {
          workspace_id: entityConnection.workspace_id,
          connection_type: this.integrationKey,
        });
        return res.status(400).send({
          message: "App config not found",
        });
      }

      const appConfig = wsConnection.connection_data.appConfig as TGitlabAppConfig;

      const gitlabClientService = await getGitlabClientService(
        entityConnection.workspace_id,
        this.integrationKey,
        appConfig.baseUrl,
        appConfig.clientId,
        appConfig.clientSecret
      );
      const entityData = entityConnection.entity_data as GitlabEntityData;

      if (entityConnection.type === EConnectionType.ENTITY) {
        if (entityData.type === GitlabEnterpriseEntityType.PROJECT) {
          await gitlabClientService.removeWebhookFromProject(entityData.id, entityData.webhookId?.toString());
        } else if (entityData.type === GitlabEnterpriseEntityType.GROUP) {
          await gitlabClientService.removeWebhookFromGroup(entityData.id, entityData.webhookId?.toString());
        }
      }

      const connection = await apiClient.workspaceEntityConnection.deleteWorkspaceEntityConnection(entityConnectionId);
      res.status(200).json(connection);
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  @Post("/webhook/:workspaceId")
  async webhook(req: Request, res: Response) {
    try {
      const workspaceId = req.params.workspaceId;
      const webhookSecret = req.headers["x-gitlab-token"]?.toString();

      const wsConnection = (await integrationConnectionHelper.getWorkspaceConnection({
        workspace_id: workspaceId,
        connection_type: this.integrationKey,
      })) as TGitlabWorkspaceConnection;

      if (!wsConnection) {
        logger.error(`${this.integrationKey} Workspace connection not found for`, {
          workspace_id: workspaceId,
          connection_type: this.integrationKey,
        });
        return res.status(400).send({
          message: "Workspace connection not found",
        });
      }

      const appConfig = wsConnection.connection_data.appConfig as TGitlabAppConfig;
      if (!appConfig) {
        logger.error(`${this.integrationKey} App config not found for`, {
          workspace_id: workspaceId,
          connection_type: this.integrationKey,
        });
        return res.status(400).send({
          message: "App config not found",
        });
      }
      const gitlabEnterpriseAuthService = getGitlabEnterpriseAuthService(
        appConfig.baseUrl,
        appConfig.clientId,
        appConfig.clientSecret
      );

      if (!gitlabEnterpriseAuthService.verifyGitlabWebhookSecret(workspaceId, webhookSecret ?? "")) {
        return res.status(400).send({
          message: "Webhook received",
        });
      } else {
        res.status(202).send({
          message: "Webhook received",
        });

        const webhookEvent = req.body as GitlabWebhookEvent;

        // Generate a unique job ID
        const jobId = `gitlab-${webhookEvent.object_kind}-${Date.now()}`;

        // Forward the event to the task manager to process
        await integrationTaskManager.registerTask(
          {
            route: "gitlab-webhook",
            jobId: jobId,
            type: webhookEvent.object_kind,
          },
          { ...webhookEvent, isEnterprise: true }
        );
      }
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/entity-connections/:workspaceId")
  @useValidateUserAuthentication()
  async getAllEntityConnections(req: Request, res: Response) {
    try {
      const workspaceId = req.params.workspaceId;

      const [wsConnection] = await integrationConnectionHelper.getWorkspaceConnections({
        workspace_id: workspaceId,
        connection_type: this.integrationKey,
      });

      if (!wsConnection) {
        return res.status(200).json([]);
      }

      const entityConnections = await integrationConnectionHelper.getWorkspaceEntityConnections({
        workspace_connection_id: wsConnection.id,
      });

      res.status(200).json(entityConnections);
    } catch (error) {
      logger.error(error);
      responseHandler(res, 500, error);
    }
  }

  @Get("/entities/:workspaceId")
  @useValidateUserAuthentication()
  async getProjectAndGroups(req: Request, res: Response) {
    try {
      const workspaceId = req.params.workspaceId;

      const entities = [];

      const wsConnection = (await integrationConnectionHelper.getWorkspaceConnection({
        workspace_id: workspaceId,
        connection_type: this.integrationKey,
      })) as TGitlabWorkspaceConnection;

      if (!wsConnection) {
        logger.error(`${this.integrationKey} Workspace connection not found for`, {
          workspace_id: workspaceId,
          connection_type: this.integrationKey,
        });
        return res.status(200).json([]);
      }

      const appConfig = wsConnection.connection_data.appConfig as TGitlabAppConfig;
      const gitlabClientService = await getGitlabClientService(
        workspaceId,
        this.integrationKey,
        appConfig.baseUrl,
        appConfig.clientId,
        appConfig.clientSecret
      );

      const projects = await gitlabClientService.getProjects();
      if (projects.length) {
        entities.push(
          ...projects.map((project: IGitlabEntity) => ({
            id: project.id,
            name: project.name,
            path: project.path_with_namespace,
            type: GitlabEnterpriseEntityType.PROJECT,
          }))
        );
      }

      res.status(200).json(entities);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  getWorkspaceWebhookData(workspaceId: string, appConfig: TGitlabAppConfig) {
    try {
      if (!workspaceId) {
        throw new Error("workspaceId is not defined");
      }
      const gitlabEnterpriseAuthService = getGitlabEnterpriseAuthService(
        appConfig.baseUrl,
        appConfig.clientId,
        appConfig.clientSecret
      );
      const workspaceWebhookSecret = gitlabEnterpriseAuthService.getWorkspaceWebhookSecret(workspaceId);
      const webhookURL = getGitlabEntityWebhookURL(workspaceId, this.integrationKey);
      const gitlabWebhook: GitlabWebhook = {
        url: webhookURL,
        token: workspaceWebhookSecret,
      };
      return gitlabWebhook;
    } catch (error) {
      logger.error("error getWorkspaceWebhook", error);
      throw error;
    }
  }
}
