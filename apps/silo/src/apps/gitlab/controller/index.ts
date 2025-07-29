import { Request, Response } from "express";
import { E_INTEGRATION_KEYS, E_SILO_ERROR_CODES } from "@plane/etl/core";
import {
  createGitLabAuth,
  createGitLabService,
  GitlabWebhookEvent,
  GitlabWebhook,
  GitlabEntityType,
  IGitlabEntity,
  GitlabEntityData,
  EConnectionType,
  GitLabAuthorizeState,
  GitlabPlaneOAuthState,
} from "@plane/etl/gitlab";
import { ExIssueLabel } from "@plane/sdk";
import { TWorkspaceEntityConnection } from "@plane/types";
import { env } from "@/env";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { getPlaneAppDetails } from "@/helpers/plane-app-details";
import { responseHandler } from "@/helpers/response-handler";
import { Controller, Delete, EnsureEnabled, Get, Post, useValidateUserAuthentication } from "@/lib";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { planeOAuthService } from "@/services/oauth";
import { EOAuthGrantType, ESourceAuthorizationType } from "@/types/oauth";
import { integrationTaskManager } from "@/worker";
import { verifyGitlabToken } from "../helpers";
import { gitlabAuthService, getGitlabClientService } from "../services";

const apiClient = getAPIClient();

@EnsureEnabled(E_INTEGRATION_KEYS.GITLAB)
@Controller("/api/gitlab")
export default class GitlabController {
  /* -------------------- Auth Endpoints -------------------- */
  // Get the organization connection status
  @Get("/auth/organization-status/:workspaceId")
  @useValidateUserAuthentication()
  async getOrganizationConnectionStatus(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;
      if (!workspaceId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId to be present.",
        });
      }

      const workspaceConnection = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.GITLAB,
        workspace_id: workspaceId,
      });
      return res.json(workspaceConnection);
    } catch (error) {
      logger.error(error);
      return responseHandler(res, 500, error);
    }
  }

  // Disconnect the organization connection
  @Post("/auth/organization-disconnect/:workspaceId/:connectionId")
  @useValidateUserAuthentication()
  async disconnectOrganization(req: Request, res: Response) {
    const { workspaceId, connectionId } = req.params;

    if (!workspaceId || !connectionId) {
      return res.status(400).send({
        message: "Bad Request, expected workspaceId and connectionId to be present.",
      });
    }

    try {
      // Get the github workspace connections associated with the workspaceId
      const connections = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.GITLAB,
        connection_id: connectionId,
        workspace_id: workspaceId,
      });
      if (connections.length === 0) {
        return res.sendStatus(200);
      } else {
        const connection = connections[0];
        const workspaceId = connection.workspace_id;
        // remove the webhooks from gitlab
        const gitlabClientService = await getGitlabClientService(workspaceId);
        const entityConnections = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
          workspace_connection_id: connection.id,
        });
        for (const entityConnection of entityConnections) {
          const entityData = entityConnection.entity_data as GitlabEntityData;
          if (entityData.type === GitlabEntityType.PROJECT) {
            await gitlabClientService.removeWebhookFromProject(entityData.id, entityData.webhookId?.toString());
          } else if (entityData.type === GitlabEntityType.GROUP) {
            await gitlabClientService.removeWebhookFromGroup(entityData.id, entityData.webhookId?.toString());
          }
        }

        // Delete the workspace connection associated with the team
        await apiClient.workspaceConnection.deleteWorkspaceConnection(connection.id);
        return res.sendStatus(200);
      }
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/auth/url")
  async getAuthURL(req: Request, res: Response) {
    try {
      const {
        workspace_id,
        workspace_slug,
        plane_api_token,
        target_host,
        user_id,
        gitlab_hostname,
        plane_app_installation_id,
      } = req.body;
      if (
        !user_id ||
        !workspace_id ||
        !workspace_slug ||
        !plane_api_token ||
        !target_host ||
        !plane_app_installation_id
      )
        return res.status(400).send({ message: "Missing required fields" });

      const gitlabService = createGitLabAuth({
        clientId: env.GITLAB_CLIENT_ID,
        clientSecret: env.GITLAB_CLIENT_SECRET,
        redirectUri: encodeURI(env.SILO_API_BASE_URL + env.SILO_BASE_PATH + "/api/gitlab/auth/callback"),
      });

      res.send(
        gitlabService.getAuthUrl({
          user_id: user_id,
          gitlab_hostname: gitlab_hostname,
          workspace_id: workspace_id,
          workspace_slug: workspace_slug,
          plane_api_token: plane_api_token,
          target_host: target_host,
          plane_app_installation_id: plane_app_installation_id,
        })
      );
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Get("/plane-oauth/callback")
  async oauthCallback(req: Request, res: Response) {
    const { code: oauthCode, state: encodedGitlabState } = req.query;

    if (!oauthCode || !encodedGitlabState) {
      return responseHandler(res, 400, "Invalid request callback");
    }

    const gitlabState: GitlabPlaneOAuthState = JSON.parse(
      Buffer.from(encodedGitlabState as string, "base64").toString()
    );

    const { gitlab_code, encoded_gitlab_state } = gitlabState;

    const gitlabAuthState: GitLabAuthorizeState = JSON.parse(
      Buffer.from(encoded_gitlab_state as string, "base64").toString()
    );
    const redirectUri = `${env.APP_BASE_URL}/${gitlabAuthState.workspace_slug}/settings/integrations/gitlab/`;

    try {
      const gitlabAuthService = createGitLabAuth({
        clientId: env.GITLAB_CLIENT_ID,
        clientSecret: env.GITLAB_CLIENT_SECRET,
        redirectUri: encodeURI(env.SILO_API_BASE_URL + env.SILO_BASE_PATH + "/api/gitlab/auth/callback"),
      });

      const { response: token, state: authState } = await gitlabAuthService.getAccessToken({
        code: gitlab_code as string,
        state: encoded_gitlab_state,
      });

      if (!token || !token.access_token) {
        return res.redirect(
          `${env.APP_BASE_URL}/${authState.workspace_slug}/settings/integrations/gitlab/?error=${E_SILO_ERROR_CODES.ERROR_FETCHING_TOKEN}`
        );
      }

      const gitlabService = createGitLabService(
        token.access_token,
        token.refresh_token,
        async (access_token, refresh_token) => {
          await apiClient.workspaceCredential.createWorkspaceCredential({
            workspace_id: authState.workspace_id,
            user_id: authState.user_id,
            source_access_token: access_token,
            source_refresh_token: refresh_token,
            target_access_token: authState.plane_api_token,
            source: E_INTEGRATION_KEYS.GITLAB,
          });
        }
      );

      const user = await gitlabService.getUser();

      if (!user) {
        return res.redirect(
          `${env.APP_BASE_URL}/${authState.workspace_slug}/settings/integrations/gitlab/?error=${E_SILO_ERROR_CODES.USER_NOT_FOUND}`
        );
      }

      const { planeAppClientId, planeAppClientSecret } = await getPlaneAppDetails(E_INTEGRATION_KEYS.GITLAB);
      if (!planeAppClientId || !planeAppClientSecret) {
        return res.status(400).send("Invalid app credentials");
      }
      // generate the token for the user
      const tokenResponse = await planeOAuthService.generateToken({
        client_id: planeAppClientId,
        client_secret: planeAppClientSecret,
        grant_type: EOAuthGrantType.AUTHORIZATION_CODE,
        code: oauthCode as string,
        redirect_uri: `${env.SILO_API_BASE_URL}${env.SILO_BASE_PATH}/api/gitlab/plane-oauth/callback`,
        app_installation_id: gitlabAuthState.plane_app_installation_id,
        user_id: gitlabAuthState.user_id,
      });

      // Create or update credential
      const credential = await integrationConnectionHelper.createOrUpdateWorkspaceCredential({
        workspace_id: authState.workspace_id,
        user_id: authState.user_id,
        source: E_INTEGRATION_KEYS.GITLAB,
        source_identifier: user.id.toString(),
        source_authorization_type: ESourceAuthorizationType.OAUTH,
        source_access_token: token.access_token,
        source_refresh_token: token.refresh_token,
        target_access_token: tokenResponse.access_token,
        target_refresh_token: tokenResponse.refresh_token,
        target_authorization_type: EOAuthGrantType.AUTHORIZATION_CODE,
        target_identifier: gitlabAuthState.plane_app_installation_id,
        source_hostname: gitlabAuthState.gitlab_hostname || "gitlab.com",
      });

      /*
       In case of Gitlab, we don't have any organization level connection, the access given is at the user level.
       So we need to use the userId as the organizationId.
      */
      const organizationId = user.id.toString();

      // If the user account is already connected to another workspace, return an error
      const connections = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.GITLAB,
        connection_id: organizationId,
      });

      if (connections.length > 0) {
        return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.CANNOT_CREATE_MULTIPLE_CONNECTIONS}`);
      }

      await apiClient.workspaceConnection.createWorkspaceConnection({
        workspace_id: authState.workspace_id,
        target_hostname: authState.target_host,
        source_hostname: authState.gitlab_hostname || "gitlab.com",
        connection_type: E_INTEGRATION_KEYS.GITLAB,
        connection_id: organizationId,
        connection_data: user,
        credential_id: credential.id,
      });

      return res.redirect(redirectUri);
    } catch (error) {
      console.error(error);
      return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.GENERIC_ERROR}`);
    }
  }

  @Get("/auth/callback")
  async authCallback(req: Request, res: Response) {
    const { code, state } = req.query;

    if (!code || !state) {
      return responseHandler(res, 400, "Missing required fields");
    }

    const decodedState = JSON.parse(Buffer.from(state as string, "base64").toString()) as GitLabAuthorizeState;
    const redirectUri = `${env.APP_BASE_URL}/${decodedState.workspace_slug}/settings/integrations/gitlab/`;

    try {
      const gitlabState: GitlabPlaneOAuthState = {
        gitlab_code: code as string,
        encoded_gitlab_state: state as string,
      };

      const { planeAppClientId, planeAppClientSecret } = await getPlaneAppDetails(E_INTEGRATION_KEYS.GITLAB);
      if (!planeAppClientId || !planeAppClientSecret) {
        return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.INVALID_APP_CREDENTIALS}`);
      }

      const siloAppOAuthCallbackURL = `${env.SILO_API_BASE_URL}${env.SILO_BASE_PATH}/api/gitlab/plane-oauth/callback`;
      const authorizationURL = planeOAuthService.getPlaneOAuthRedirectUrl(
        planeAppClientId,
        siloAppOAuthCallbackURL,
        Buffer.from(JSON.stringify(gitlabState)).toString("base64")
      );

      return res.redirect(authorizationURL);
    } catch (error) {
      logger.error("Failed to redirect Gitlab callback to plane oauth", { error });
      return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.GENERIC_ERROR}`);
    }
  }

  @Get("/plane-app-details")
  async getPlaneAppDetail(req: Request, res: Response) {
    try {
      const { planeAppId, planeAppClientId } = await getPlaneAppDetails(E_INTEGRATION_KEYS.GITLAB);
      res.status(200).json({
        appId: planeAppId,
        clientId: planeAppClientId,
      });
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/gitlab-webhook")
  async gitlabWebhook(req: Request, res: Response) {
    try {
      // Get the event type and the token
      const token = req.headers["x-gitlab-token"];

      const isVerified = !verifyGitlabToken(token);

      if (!isVerified) {
        return res.status(400).send({
          message: "Verification failed",
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

      return res.status(202).send({
        message: "Webhook received",
      });
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

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

      // Check for existing connections
      const connections = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
        workspace_connection_id: workspaceConnectionId,
        entity_id: entity_id,
        entity_type: entity_type,
      });

      if (connections.length > 0) {
        return res.status(201).json({ error: "Entity connection already exists" });
      }

      // Add webhook to gitlab
      const { url, token } = await this.getWorkspaceWebhookData(workspaceId);
      const gitlabClientService = await getGitlabClientService(workspaceId);

      // based on enum either add to project or group
      let webhookId;
      if (entity_type === GitlabEntityType.PROJECT) {
        const { id: hookId } = await gitlabClientService.addWebhookToProject(entity_id, url, token);
        webhookId = hookId;
      } else {
        const { id: hookId } = await gitlabClientService.addWebhookToGroup(entity_id, url, token);
        webhookId = hookId;
      }

      const connection = await apiClient.workspaceEntityConnection.createWorkspaceEntityConnection({
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
      const connections = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
        workspace_connection_id: workspaceConnectionId,
        project_id,
        entity_type: GitlabEntityType.PROJECT,
      });

      if (connections.length > 0) {
        return res.status(201).json({ error: "Entity connection already exists" });
      }

      const connection = await apiClient.workspaceEntityConnection.createWorkspaceEntityConnection({
        workspace_id: workspaceId,
        workspace_connection_id: workspaceConnectionId,
        config,
        type: EConnectionType.PLANE_PROJECT,
        project_id,
        entity_type: GitlabEntityType.PROJECT,
        entity_data: {
          id: project_id,
          type: GitlabEntityType.PROJECT,
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
      const { connectionId } = req.params;

      const entityConnection = await apiClient.workspaceEntityConnection.getWorkspaceEntityConnection(connectionId);
      if (!entityConnection) {
        return res.status(400).json({ error: "Entity connection not found" });
      }

      const gitlabClientService = await getGitlabClientService(entityConnection.workspace_id);
      const entityData = entityConnection.entity_data as GitlabEntityData;

      if (entityConnection.type === EConnectionType.ENTITY) {
        if (entityData.type === GitlabEntityType.PROJECT) {
          await gitlabClientService.removeWebhookFromProject(entityData.id, entityData.webhookId?.toString());
        } else if (entityData.type === GitlabEntityType.GROUP) {
          await gitlabClientService.removeWebhookFromGroup(entityData.id, entityData.webhookId?.toString());
        }
      }

      const connection = await apiClient.workspaceEntityConnection.deleteWorkspaceEntityConnection(connectionId);
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
      responseHandler(res, 500, error);
    }
  }

  @Get("/entity-connections/:workspaceId")
  @useValidateUserAuthentication()
  async getAllEntityConnections(req: Request, res: Response) {
    try {
      const workspaceId = req.params.workspaceId;
      const [workspaceConnection] = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.GITLAB,
        workspace_id: workspaceId,
      });

      if (!workspaceConnection) {
        return res.status(200).json([]);
      }

      const entityConnections = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
        workspace_connection_id: workspaceConnection.id,
        workspace_id: workspaceConnection.workspace_id,
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
      const gitlabClientService = await getGitlabClientService(workspaceId);

      const projects = await gitlabClientService.getProjects();
      if (projects.length) {
        entities.push(
          ...projects.map((project: IGitlabEntity) => ({
            id: project.id,
            name: project.name,
            path: project.path_with_namespace,
            type: GitlabEntityType.PROJECT,
          }))
        );
      }

      res.status(200).json(entities);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  getWorkspaceWebhookData(workspaceId: string) {
    try {
      if (!workspaceId) {
        throw new Error("workspaceId is not defined");
      }
      const workspaceWebhookSecret = gitlabAuthService.getWorkspaceWebhookSecret(workspaceId);
      const webhookURL = `${env.SILO_API_BASE_URL}${env.SILO_BASE_PATH}/api/gitlab/webhook/${workspaceId}`;
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
