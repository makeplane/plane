import { Request, Response } from "express";
import { validate as uuidValidate } from "uuid";
import { E_ENTITY_CONNECTION_KEYS, E_INTEGRATION_KEYS, E_SILO_ERROR_CODES } from "@plane/etl/core";
import {
  E_SLACK_ENTITY_TYPE,
  isUserMessage,
  SlackAuthState,
  SlackUserAuthState,
  TSlackCommandPayload,
  TSlackPayload,
} from "@plane/etl/slack";
import {
  E_PLANE_WEBHOOK_ACTION,
  E_PLANE_WEBHOOK_EVENT,
  ExIssue,
  PlaneWebhookData,
  PlaneWebhookPayloadBase,
} from "@plane/sdk";
import { env } from "@/env";
import { responseHandler } from "@/helpers/response-handler";
import { Controller, Delete, EnsureEnabled, Get, Post, Put, useValidateUserAuthentication } from "@/lib";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { integrationTaskManager } from "@/worker";
import { Store } from "@/worker/base";
import { slackAuth } from "../auth/auth";
import { getConnectionDetails, updateUserMap } from "../helpers/connection-details";
import { ACTIONS } from "../helpers/constants";
import { parseIssueFormData } from "../helpers/parse-issue-form";
import { convertToSlackOptions } from "../helpers/slack-options";
const apiClient = getAPIClient();

@EnsureEnabled(E_INTEGRATION_KEYS.SLACK)
@Controller("/api/slack")
export default class SlackController {
  @Get("/ping")
  async ping(_req: Request, res: Response) {
    res.send("pong");
  }

  @Post("/app/auth/url")
  async getAppAuthURL(req: Request, res: Response) {
    try {
      const body: SlackAuthState = req.body;
      if (!body.workspaceId || !body.apiToken) {
        return res.status(400).send({
          message: "Bad Request, expected both apiToken and workspaceId to be present.",
        });
      }
      const response = slackAuth.getWorkspaceAuthUrl(body);
      res.send(response);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/user/auth/url")
  async getUserAuthURL(req: Request, res: Response) {
    try {
      const body: SlackAuthState = req.body;
      if (!body.userId) {
        return res.status(400).send({
          message: "Bad Request, expected userId to be present.",
        });
      }
      const response = slackAuth.getUserAuthUrl(body);
      res.send(response);
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  /*
    Endpoint to get the projects - channel mapping from the workspace connection
  */
  @Get("/updates/projects/:workspaceId")
  @useValidateUserAuthentication()
  async getProjectUpdates(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;

      // Get the workspace connection
      const workspaceConnections = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.SLACK,
        workspace_id: workspaceId,
      });

      if (!workspaceConnections || workspaceConnections.length === 0) {
        return res.status(400).send({
          message: "Bad Request, expected workspace connection to be present.",
        });
      }

      const workspaceConnection = workspaceConnections[0];

      // Get the projects - channel mapping from the workspace connection
      const projects = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
        workspace_id: workspaceId,
        workspace_connection_id: workspaceConnection.id,
        entity_type: E_SLACK_ENTITY_TYPE.SLACK_PROJECT_UPDATES,
      });

      return res.json(projects);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/updates/projects/:workspaceId")
  @useValidateUserAuthentication()
  async createProjectUpdates(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;

      // Get the workspace connection
      const workspaceConnections = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.SLACK,
        workspace_id: workspaceId,
      });

      if (!workspaceConnections || workspaceConnections.length === 0) {
        return res.status(400).send({
          message: "Bad Request, expected workspace connection to be present.",
        });
      }

      const connection = await apiClient.workspaceEntityConnection.createWorkspaceEntityConnection(req.body);
      return res.json(connection);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Put("/updates/projects/:id")
  @useValidateUserAuthentication()
  async updateProjectUpdates(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const connection = await apiClient.workspaceEntityConnection.updateWorkspaceEntityConnection(id, req.body);
      return res.json(connection);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Delete("/updates/projects/:id")
  @useValidateUserAuthentication()
  async deleteProjectUpdates(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await apiClient.workspaceEntityConnection.deleteWorkspaceEntityConnection(id);
      return res.json({ message: "Project connection deleted successfully" });
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Get("/team/auth/callback")
  async getAppAuthCallback(req: Request, res: Response) {
    const { code, state: slackState } = req.query;

    if (!code || !slackState) {
      return res.status(400).send({
        message: "Bad Request, expected code and state to be present.",
      });
    }

    const authState = JSON.parse(Buffer.from(slackState as string, "base64").toString("utf-8")) as SlackAuthState;
    const redirectUri = `${env.APP_BASE_URL}/${authState.workspaceSlug}/settings/integrations/slack/`;

    try {
      const { state, response } = await slackAuth.getWorkspaceAuthToken({
        code: code as string,
        state: authState,
      });

      if (!response.ok) {
        return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.ERROR_FETCHING_TOKEN}`);
      }

      // Check if the team is already connected to any other workspace
      const connections = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.SLACK,
        connection_id: response.team.id,
      });

      // If the team is already connected to another workspace, return an error
      if (connections.length > 0) {
        return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.CANNOT_CREATE_MULTIPLE_CONNECTIONS}`);
      }

      // Create credentials for slack for the workspace
      const credentials = await apiClient.workspaceCredential.createWorkspaceCredential({
        source: E_INTEGRATION_KEYS.SLACK,
        target_access_token: state.apiToken,
        source_access_token: response.access_token,
        source_refresh_token: response.refresh_token,
        workspace_id: state.workspaceId,
        user_id: authState.userId,
      });

      const workspaceConnection = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.SLACK,
        connection_id: response.team.id,
        workspace_id: state.workspaceId,
      });

      if (!workspaceConnection || workspaceConnection.length === 0) {
        // Create a workspace connection for the authenticated team
        await apiClient.workspaceConnection.createWorkspaceConnection({
          workspace_id: state.workspaceId,
          connection_type: E_INTEGRATION_KEYS.SLACK,
          connection_id: response.team.id,
          connection_slug: response.team.name,
          connection_data: response.team,
          credential_id: credentials.id,
          target_hostname: env.API_BASE_URL,
          config: {
            userMap: [],
          },
        });
      }

      return res.redirect(`${env.APP_BASE_URL}/${state.workspaceSlug}/settings/integrations/slack/`);
    } catch (error) {
      return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.GENERIC_ERROR}`);
    }
  }

  @Get("/user/auth/callback")
  async getUserAuthCallback(req: Request, res: Response) {
    const { code, state: slackState } = req.query;
    const authState = JSON.parse(Buffer.from(slackState as string, "base64").toString("utf-8")) as SlackUserAuthState;

    if (!code || !slackState) {
      return res.status(400).send({
        message: "Bad Request, expected code and state to be present.",
      });
    }

    let redirectUri = `${env.APP_BASE_URL}/${authState.workspaceSlug}/settings/integrations/slack/`;
    if (authState.profileRedirect) {
      redirectUri = `${env.APP_BASE_URL}/${authState.workspaceSlug}/settings/account/connections/?workspaceId=${authState.workspaceId}`;
    }

    try {
      const { state, response } = await slackAuth.getUserAuthToken({
        code: code as string,
        state: authState,
      });

      if (!response.ok) {
        return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.ERROR_FETCHING_TOKEN}`);
      }

      const workspaceConnection = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.SLACK,
        workspace_id: state.workspaceId,
      });

      if (!workspaceConnection || workspaceConnection.length === 0) {
        // Create a workspace connection for the authenticated team
        return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.CONNECTION_NOT_FOUND}`);
      }

      if (!response.authed_user) {
        return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.ERROR_FETCHING_TOKEN}`);
      }

      const userToken = response.authed_user.access_token;
      const refreshToken = response.authed_user.refresh_token;
      const slackUserId = response.authed_user.id;

      // Create credentials for slack for the workspace
      const workspaceCredentialPromise = apiClient.workspaceCredential.createWorkspaceCredential({
        source: E_ENTITY_CONNECTION_KEYS.SLACK_USER,
        target_access_token: state.apiToken,
        source_access_token: userToken,
        source_refresh_token: refreshToken,
        workspace_id: state.workspaceId,
        user_id: authState.userId,
      });

      const updateUserMapPromise = updateUserMap(workspaceConnection[0], authState.userId, slackUserId);
      await Promise.all([workspaceCredentialPromise, updateUserMapPromise]);

      return res.redirect(redirectUri);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Get("/app/status/:workspaceId")
  @useValidateUserAuthentication()
  async getAppConnectionStatus(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;
      if (!workspaceId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId to be present.",
        });
      }

      // Get the slack workspace connections associated with the workspaceId
      const connections = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.SLACK,
        workspace_id: workspaceId,
      });
      return res.json(connections);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Get("/user/status/:workspaceId/:userId")
  @useValidateUserAuthentication()
  async getUserConnectionStatus(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.params;
      if (!workspaceId || !userId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId and userId to be present.",
        });
      }

      // Get credentials for slack user for the workspace
      const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
        source: E_ENTITY_CONNECTION_KEYS.SLACK_USER,
        workspace_id: workspaceId,
        user_id: userId,
      });
      return res.json({
        isConnected: credentials.length > 0,
      });
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/app/disconnect")
  @useValidateUserAuthentication()
  async disconnectApp(req: Request, res: Response) {
    try {
      const { workspaceId, connectionId } = req.body;
      if (!workspaceId || !connectionId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, connectionId to be present.",
        });
      }

      // Get the slack workspace connections associated with the workspaceId

      const connections = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.SLACK,
        connection_id: connectionId,
        workspace_id: workspaceId,
      });
      if (connections.length === 0) {
        return res.sendStatus(200);
      } else {
        const connection = connections[0];

        // Delete the workspace connection associated with the team
        await apiClient.workspaceConnection.deleteWorkspaceConnection(connection.id);
        return res.sendStatus(200);
      }
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/user/disconnect")
  @useValidateUserAuthentication()
  async disconnectUser(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.body;
      if (!workspaceId || !userId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, userId to be present.",
        });
      }

      // Delete the user credentials for the workspace
      const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
        source: E_ENTITY_CONNECTION_KEYS.SLACK_USER,
        workspace_id: workspaceId,
        user_id: userId,
      });

      if (!credentials.length) {
        return res.status(200);
      }

      await apiClient.workspaceCredential.deleteWorkspaceCredential(credentials[0].id);

      // Update the workspace connection to remove the user id
      const workspaceConnection = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.SLACK,
        workspace_id: workspaceId,
      });

      if (!workspaceConnection || workspaceConnection.length === 0) {
        return res.status(200);
      }

      // Update the workspace connection to remove the user id
      await updateUserMap(workspaceConnection[0], userId, null);

      return res.sendStatus(200);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Get("/channels/:teamId")
  @useValidateUserAuthentication()
  async getChannels(req: Request, res: Response) {
    const { teamId } = req.params;
    const { onlyChannels } = req.query;

    if (!teamId) {
      return res.status(400).send({
        message: "Bad Request, expected teamId to be present.",
      });
    }

    const details = await getConnectionDetails(teamId);
    if (!details) {
      return res.status(400).send({
        message: "Bad Request, expected connection details to be present.",
      });
    }

    const { slackService } = details;

    const channels = await slackService.getChannels();

    if (!channels.ok) {
      return res.status(500).send({
        message: "Failed to fetch channels from slack",
      });
    }

    if (onlyChannels === "true") {
      return res.json(channels.channels.filter((channel) => channel.is_channel));
    }

    return res.json(channels.channels);
  }

  @Post("/action")
  async ackSlackAction(req: Request, res: Response) {
    try {
      const payloadStr = req.body.payload;

      if (!payloadStr) {
        return res.status(400).json({ error: "No payload received" });
      }

      // Parse the payload
      const payload: TSlackPayload = JSON.parse(payloadStr);

      logger.info(`[SLACK] [ACK_SLACK_ACTION] Received payload`, {
        payload: payload,
      });

      // Pass the payload to the slack worker, to take action
      integrationTaskManager.registerTask(
        {
          route: "slack-interaction",
          jobId: payload.type,
          type: payload.type,
        },
        payload
      );

      res.status(200).json({});
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/command")
  async slackCommand(req: Request, res: Response) {
    try {
      const payload = req.body as TSlackCommandPayload;
      payload.type = "command";

      logger.info(`[SLACK] [SLACK_COMMAND] Received payload`, {
        payload: payload,
      });

      integrationTaskManager.registerTask(
        {
          route: "slack-interaction",
          jobId: payload.token,
          type: "command",
        },
        payload
      );

      return res.json().status(200);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/events")
  async slackEvents(req: Request, res: Response) {
    try {
      const payload = req.body;

      logger.info(`[SLACK] [SLACK_EVENTS] Received payload`, {
        payload: payload,
      });

      if (payload.challenge) {
        return res.status(200).json({ challenge: payload.challenge });
      }

      if (isUserMessage(payload)) {
        payload.type = "event";
        integrationTaskManager.registerTask(
          {
            route: "slack-interaction",
            jobId: payload.event_id,
            type: "event",
          },
          payload
        );
      }

      return res.sendStatus(200);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/options")
  async slackOptions(req: Request, res: Response) {
    try {
      const payload = JSON.parse(req.body.payload) as TSlackPayload;

      // Check if the payload type is block_suggestion
      if (payload.type === "block_suggestion" && payload.action_id && payload.action_id === ACTIONS.ISSUE_LABELS) {
        const text = payload.value;
        // If the action is issue_labels, parse the view to be of type
        // IssueModalViewFull and pass it to the slack worker
        const details = await getConnectionDetails(payload.team.id);
        if (!details) {
          logger.info(`[SLACK] No connection details found for team ${payload.team.id}`);
          return res.status(200).json({});
        }

        const { workspaceConnection, planeClient } = details;
        const values = await parseIssueFormData(payload.view.state.values);
        const labels = await planeClient.label.list(workspaceConnection.workspace_id, values.project);
        const filteredLabels = labels.results
          .filter((label) => label.name.toLowerCase().includes(text.toLowerCase()))
          .sort((a, b) => a.name.localeCompare(b.name));
        const labelOptions = convertToSlackOptions(filteredLabels);
        return res.status(200).json({
          options: labelOptions,
        });
      }

      if (payload.type === "block_suggestion" && payload.action_id && payload.action_id === ACTIONS.LINK_WORK_ITEM) {
        const text = payload.value;
        // If the action is link_work_item, parse the view to be of type
        // LinkIssueModalView and pass it to the slack worker
        const details = await getConnectionDetails(payload.team.id);
        if (!details) {
          logger.info(`[SLACK] No connection details found for team ${payload.team.id}`);
          return;
        }

        const { workspaceConnection, planeClient } = details;
        const workItems = await planeClient.issue.searchIssues(workspaceConnection.workspace_slug, text);

        const filteredWorkItems = workItems.issues
          .map((workItem) => ({
            id: `${workItem.workspace__slug}:${workItem.project_id}:${workItem.id}`,
            name: `[${workItem.project__identifier}-${workItem.sequence_id}] ${workItem.name}`,
          }))
          .sort((a, b) => a.name.localeCompare(b.name));

        const workItemOptions = convertToSlackOptions(filteredWorkItems);
        return res.status(200).json({
          options: workItemOptions,
        });
      }

      return res.status(200).json({});
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/plane/events")
  async planeEvents(req: Request, res: Response) {
    try {
      const payload = req.body as PlaneWebhookData;

      logger.info(`[SLACK] [PLANE_EVENTS] Received payload`, {
        headers: req.headers,
        payload: payload,
      });

      const isUUID = (id: string | null) => id && uuidValidate(id);

      if (payload.event === E_PLANE_WEBHOOK_EVENT.ISSUE_COMMENT) {
        integrationTaskManager.registerTask(
          {
            route: "plane-slack-webhook",
            jobId: payload.event,
            type: "issue_comment",
          },
          payload
        );
      }

      if (payload.event === E_PLANE_WEBHOOK_EVENT.ISSUE) {
        const payload = req.body as PlaneWebhookPayloadBase<ExIssue>;

        const id = payload.data.id;
        const workspace = payload.data.workspace;
        const project = payload.data.project;
        const issue = payload.data.issue;

        /*
          Checking for the field is important, because from plane sometimes reactions and links are sent with
          action as created, but when the issue is created, the field is not null.
        */
        const isIssueCreated = payload.action === E_PLANE_WEBHOOK_ACTION.CREATED && payload.activity.field == null;

        if (isIssueCreated) {
          // Get the project entity connection
          const [entityConnection] = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
            workspace_id: workspace,
            project_id: project,
            entity_type: E_SLACK_ENTITY_TYPE.SLACK_PROJECT_UPDATES,
          });

          if (!entityConnection) {
            return res.sendStatus(200);
          }

          logger.info("Entity connection found for project update webhook", {
            project_id: project,
            channel_id: entityConnection.entity_id,
          });

          // Register store task for stacking the issue
          await integrationTaskManager.registerStoreTask(
            {
              route: "plane-slack-webhook",
              jobId: payload.event,
              type: "project_update",
            },
            {
              id,
              event: "project_update",
              workspace,
              project,
              issue,
            },
            Number(env.DEDUP_INTERVAL)
          );
        } else if (
          payload.activity.field &&
          !payload.activity.field.includes("_id") &&
          !isUUID(payload.activity.old_value) &&
          !isUUID(payload.activity.new_value)
        ) {
          const [entityConnection] = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
            workspace_id: workspace,
            project_id: project,
            issue_id: id,
            entity_type: E_INTEGRATION_KEYS.SLACK,
          });

          if (!entityConnection) {
            return res.sendStatus(200);
          }

          logger.info(
            `[SLACK] Entity connection found for issue ${id} in workspace ${workspace} and project ${project}`
          );
          // Register activity key for the particular issue
          await this.collectActivityForStacking(payload);

          // Register store task for stacking the issue
          await integrationTaskManager.registerStoreTask(
            {
              route: "plane-slack-webhook",
              jobId: payload.event,
              type: "issue",
            },
            {
              id,
              event: payload.event,
              workspace,
              project,
              issue,
            },
            Number(env.DEDUP_INTERVAL)
          );
        } else {
          logger.info("No operation performed for issue", {
            action: payload.action,
            field: payload.activity.field,
          });
        }
      }
      return res.sendStatus(200);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  /**
   * Collects activity for stacking the issue
   * @param payload - The payload of the issue
   */
  async collectActivityForStacking(payload: PlaneWebhookPayloadBase<ExIssue>) {
    const store = Store.getInstance();

    // Create a key for the activity field
    const key = `slack:issue:${payload.data.id}`;
    const ttl = 60; // 1 minute

    const activity = {
      ...payload.activity,
      timestamp: payload.data.updated_at ?? payload.data.created_at ?? new Date().toISOString(),
    };

    // Set the activity field, as we gave false, it's gonna update the field
    await store.setList(key, JSON.stringify(activity), ttl, false);
  }
}
