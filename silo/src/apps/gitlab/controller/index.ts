import { importTaskManger, integrationTaskManager } from "@/apps/engine/worker";
import { env } from "@/env";
import { Controller, Delete, Get, Post } from "@/lib";
import { ExIssueLabel } from "@plane/sdk";
import { Request, Response } from "express";
import { createGitLabAuth, createGitLabService, GitlabWebhookEvent, GitlabWebhook, GitlabEntityType, IGitlabEntity, GitlabEntityData, EConnectionType } from "@plane/etl/gitlab";
import { verifyGitlabToken } from "../helpers";
import { createOrUpdateCredentials, getCredentialsByOnlyWorkspaceId, deleteCredentialsForWorkspace } from "@/db/query";
import {
  createWorkspaceConnection,
  getWorkspaceConnections,
  updateWorkspaceConnection,
  deleteEntityConnectionByWorkspaceConnectionId,
  deleteWorkspaceConnection,
  createEntityConnectionByWorkspaceConnectionId,
  getEntityConnectionByWorkspaceIdAndConnectionIdAndEntityId,
  getEntityConnectionByEntityId,
  getEntityConnectionByWorkspaceIdAndConnectionId,
  deleteEntityConnection,
  getEntityConnection,
  getEntityConnectionByWorkspaceAndProjectId,
  getEntityConnectionByWorkspaceConnectionAndProjectId,
} from "@/db/query/connection";
import { logger } from "@/logger";
import { EIntegrationType } from "@/types";
import { gitlabAuthService, getGitlabClientService } from "../services";

@Controller("/api/gitlab")
export class GitlabController {
  /* -------------------- Auth Endpoints -------------------- */
  // Get the organization connection status
  @Get("/auth/organization-status/:workspaceId")
  async getOrganizationConnectionStatus(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;

      if (!workspaceId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId to be present.",
        });
      }

      const workspaceConnection = await getWorkspaceConnections(workspaceId, "GITLAB");

      return res.json(workspaceConnection);
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  }

  // Disconnect the organization connection
  @Post("/auth/organization-disconnect/:workspaceId/:connectionId")
  async disconnectOrganization(req: Request, res: Response) {
    const { workspaceId, connectionId } = req.params;

    if (!workspaceId || !connectionId) {
      return res.status(400).send({
        message: "Bad Request, expected workspaceId and connectionId to be present.",
      });
    }

    try {
      // Get the github workspace connections associated with the workspaceId
      const connections = await getWorkspaceConnections(workspaceId, "GITLAB", connectionId);

      if (connections.length === 0) {
        return res.sendStatus(200);
      } else {
        const connection = connections[0];
        // Delete entity connections referencing the workspace connection
        await deleteEntityConnectionByWorkspaceConnectionId(connection.id);

        // Delete the workspace connection associated with the team
        await deleteWorkspaceConnection(connection.id);

        // Delete the team and user credentials for the workspace
        await deleteCredentialsForWorkspace(workspaceId, "GITLAB");

        return res.sendStatus(200);
      }
    } catch (error) {
      logger.error(error);
      return res.status(500).send({
        error: error,
      });
    }
  }

  @Post("/auth/url")
  async getAuthURL(req: Request, res: Response) {
    const { workspace_id, workspace_slug, plane_api_token, target_host, user_id, gitlab_hostname } = req.body;

    if (!user_id || !workspace_id || !workspace_slug || !plane_api_token || !target_host)
      return res.status(400).send({ message: "Missing required fields" });

    const gitlabService = createGitLabAuth({
      clientId: env.GITLAB_CLIENT_ID,
      clientSecret: env.GITLAB_CLIENT_SECRET,
      redirectUri: `${env.SILO_API_BASE_URL}/silo/api/gitlab/auth/callback`,
    });

    res.send(
      gitlabService.getAuthUrl({
        user_id: user_id,
        gitlab_hostname: gitlab_hostname,
        workspace_id: workspace_id,
        workspace_slug: workspace_slug,
        plane_api_token: plane_api_token,
        target_host: target_host,
      })
    );
  }

  @Get("/auth/callback")
  async authCallback(req: Request, res: Response) {
    const { code, state } = req.query;

    const gitlabAuthService = createGitLabAuth({
      clientId: env.GITLAB_CLIENT_ID,
      clientSecret: env.GITLAB_CLIENT_SECRET,
      redirectUri: `${env.SILO_API_BASE_URL}/silo/api/gitlab/auth/callback`,
    });

    const { response: token, state: authState } = await gitlabAuthService.getAccessToken({
      code: code as string,
      state: state as string,
    });

    // Create or update credentials
    const credentials = await createOrUpdateCredentials(authState.workspace_id, authState.user_id, {
      source_access_token: token.access_token,
      source_refresh_token: token.refresh_token,
      target_access_token: authState.plane_api_token,
      source: "GITLAB",
    });

    const gitlabService = createGitLabService(
      token.access_token,
      token.refresh_token,
      async (access_token, refresh_token) => {
        await createOrUpdateCredentials(authState.workspace_id, authState.user_id, {
          source_access_token: access_token,
          source_refresh_token: refresh_token,
          target_access_token: authState.plane_api_token,
          source: "GITLAB",
        });
      }
    );

    const user = await gitlabService.getUser();

    // Check if the workspace connection already exist
    const workspaceConnections = await getWorkspaceConnections(authState.workspace_id, "GITLAB");

    // Get associated gitlab user

    // If the workspace connection exist and the credential id is also the same,
    // pass, else create the workspace connection or update the credential id
    if (workspaceConnections.length > 0) {
      const workspaceConnection = workspaceConnections[0];
      if (workspaceConnection.credentialsId !== credentials.id) {
        updateWorkspaceConnection(workspaceConnection.id, {
          credentialsId: credentials.id,
        });
      }
    } else {
      // Create the workspace connection
      await createWorkspaceConnection({
        workspaceId: authState.workspace_id,
        workspaceSlug: authState.workspace_slug,
        targetHostname: authState.target_host,
        sourceHostname: authState.gitlab_hostname || "gitlab.com",
        connectionType: "GITLAB",
        connectionId: user.id.toString(),
        connectionData: user,
        credentialsId: credentials.id,
      });
    }

    res.redirect(`${env.APP_BASE_URL}/${authState.workspace_slug}/settings/integrations/gitlab/`);
  }

  @Post("/gitlab-webhook")
  async gitlabWebhook(req: Request, res: Response) {
    // Get the event type and the token
    const token = req.headers["x-gitlab-token"];

    if (!verifyGitlabToken(token)) {
      return res.status(400).send({
        message: "Webhook received",
      });
    } else {
      res.status(202).send({
        message: "Webhook received",
      });
    }

    // Get the webhook event data
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
      webhookEvent
    );
  }

  @Post("/plane-webhook")
  async planeWebhook(req: Request, res: Response) {
    res.status(202).send({
      message: "Webhook received",
    });

    // Get the event types and delivery id
    const eventType = req.headers["x-plane-event"];

    const id = req.body.data.id;
    const event = req.body.event;
    const workspace = req.body.data.workspace;
    const project = req.body.data.project;
    const issue = req.body.data.issue;

    if (event == "issue") {
      const labels = req.body.data.labels as ExIssueLabel[];
      // If labels doesn't include gitlab label, then we don't need to process this event
      if (!labels.find((label) => label.name === "gitlab")) {
        return;
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
  }


  @Post("/entity-connections/:workspaceId/:workspaceConnectionId")
  async addEntityConnection(req: Request, res: Response, next: any) {
    try {
      const { workspaceId, workspaceConnectionId } = req.params;
      const { entityId, entityType, workspaceSlug, entitySlug } = req.body;

      if (!workspaceId || !workspaceConnectionId || !entityId || !entityType || !workspaceSlug || !entitySlug) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, workspaceConnectionId, and entityId to be present.",
        });
      }

      // Check for existing connections
      const connections = await getEntityConnectionByWorkspaceIdAndConnectionIdAndEntityId(
        workspaceId,
        workspaceConnectionId,
        entityId
      );

      if (connections.length > 0) {
        return res.status(201).json({ error: "Entity connection already exists" });
      }


      // Add webhook to gitlab
      const { url, token } = this.getWorkspaceWebhookData(workspaceId)
      const gitlabClientService = await getGitlabClientService(workspaceId)

      // based on enum either add to project or group
      let webhookId;
      console.log("inside add webhook to project", entityType, entityId, url, token)
      if (entityType === GitlabEntityType.PROJECT) {
        const { id: hookId } = await gitlabClientService.addWebhookToProject(entityId, url, token);
        webhookId = hookId;
      } else {
        const { id: hookId } = await gitlabClientService.addWebhookToGroup(entityId, url, token);
        webhookId = hookId;
      }

      const connection = await createEntityConnectionByWorkspaceConnectionId(
        workspaceId,
        workspaceConnectionId,
        {
          workspaceId,
          workspaceConnectionId,
          connectionType: EConnectionType.ENTITY,
          workspaceSlug,
          entityId,
          entitySlug,
          entityData: {
            id: entityId,
            type: entityType,
            webhookId
          }
        }
      );

      res.status(200).json(connection);
    } catch (error) {
      next(error);
    }
  }

  @Post("/entity-project-connections/:workspaceId/:workspaceConnectionId")
  async addProjectConnection(req: Request, res: Response, next: any) {
    try {
      const { workspaceId, workspaceConnectionId } = req.params;
      const { projectId, workspaceSlug, config } = req.body;

      if (!workspaceId || !workspaceConnectionId || !projectId || !workspaceSlug) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, workspaceConnectionId, and projectId to be present.",
        });
      }

      // Check for existing connections
      const connections = await getEntityConnectionByWorkspaceConnectionAndProjectId(
        workspaceId,
        projectId
      );

      if (connections.length > 0) {
        return res.status(201).json({ error: "Entity connection already exists" });
      }

      const connection = await createEntityConnectionByWorkspaceConnectionId(
        workspaceId,
        workspaceConnectionId,
        {
          workspaceId,
          workspaceConnectionId,
          connectionType: EConnectionType.PLANE_PROJECT,
          projectId,
          workspaceSlug,
          config
        }
      );

      res.status(200).json(connection);
    } catch (error) {
      next(error);
    }
  }

  @Delete("/entity-connections/:workspaceId/:connectionId")
  async removeEntityConnection(req: Request, res: Response, next: any) {
    try {
      const { workspaceId, connectionId } = req.params;

      const [entityConnection] = await getEntityConnection(connectionId);
      if (!entityConnection) {
        return res.status(400).json({ error: "Entity connection not found" });
      }

      const gitlabClientService = await getGitlabClientService(workspaceId)
      const entityData = entityConnection.entityData as GitlabEntityData

      if (entityData.type === GitlabEntityType.PROJECT) {
        await gitlabClientService.removeWebhookFromProject(entityData.id, entityData.webhookId);
      } else if (entityData.type === GitlabEntityType.GROUP) {
        await gitlabClientService.removeWebhookFromGroup(entityData.id, entityData.webhookId);
      }

      const connection = await deleteEntityConnection(connectionId);
      res.status(200).json(connection);
    } catch (error) {
      next(error);
    }
  }


  @Post("/webhook/:workspaceId")
  async webhook(req: Request, res: Response, next: any) {
    try {
      const workspaceId = req.params.workspaceId;
      const webhookSecret = req.headers["x-gitlab-token"]?.toString();

      if (!gitlabAuthService.verifyGitlabWebhookSecret(workspaceId, webhookSecret ?? "")) {
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
          webhookEvent
        );
      }
    } catch (error) {
      next(error)
    }
  }


  @Get("/entity-connections/:workspaceId")
  async getAllEntityConnections(req: Request, res: Response, next: any) {
    try {
      const workspaceId = req.params.workspaceId;
      const [workspaceConnections] = await getWorkspaceConnections(workspaceId, EIntegrationType.GITLAB);
      const entityConnections = await getEntityConnectionByWorkspaceIdAndConnectionId(workspaceId, workspaceConnections.id);
      res.status(200).json(entityConnections);
    } catch (error) {
      console.error(error)
      next(error)
    }
  }

  @Get("/entities/:workspaceId")
  async getProjectAndGroups(req: Request, res: Response, next: any) {
    try {
      const workspaceId = req.params.workspaceId;
      const entities = [];
      const gitlabClientService = await getGitlabClientService(workspaceId)
      const [projects, groups] = await Promise.all([
        gitlabClientService.getProjects(),
        gitlabClientService.getGroups(),
      ]);

      if (projects.length) {
        entities.push(...projects.map((project: IGitlabEntity) => ({ id: project.id, name: project.name, type: GitlabEntityType.PROJECT })));
      }

      if (groups.length) {
        entities.push(...groups.map((group: IGitlabEntity) => ({ id: group.id, name: group.name, type: GitlabEntityType.GROUP })));
      }
      res.status(200).json(entities);
    } catch (error) {
      console.error(error)
      next(error)
    }
  }

  getWorkspaceWebhookData(workspaceId: string) {
    try {
      if (!workspaceId) {
        throw new Error("workspaceId is not defined");
      }
      const workspaceWebhookSecret = gitlabAuthService.getWorkspaceWebhookSecret(workspaceId);
      const webhookURL = `${env.SILO_API_BASE_URL}/silo/api/gitlab/webhook/${workspaceId}`;
      const gitlabWebhook: GitlabWebhook = {
        url: webhookURL,
        token: workspaceWebhookSecret,
      };
      return gitlabWebhook;
    } catch (error) {
      console.error("error getWorkspaceWebhook", error);
      throw error;
    }
  }

}


