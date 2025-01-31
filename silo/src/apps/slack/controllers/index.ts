import { Request, Response } from "express";
import {
  isUserMessage,
  SlackAuthState,
  SlackUserAuthState,
  TSlackCommandPayload,
  TSlackPayload,
} from "@plane/etl/slack";
import { PlaneWebhookData } from "@plane/sdk";
import { env } from "@/env";
import { responseHandler } from "@/helpers/response-handler";
import { Controller, EnsureEnabled, Get, Post, useValidateUserAuthentication } from "@/lib";
import { getAPIClient } from "@/services/client";
import { integrationTaskManager } from "@/worker";
import { slackAuth } from "../auth/auth";
import { getConnectionDetails } from "../helpers/connection-details";
import { ACTIONS } from "../helpers/constants";
import { parseIssueFormData } from "../helpers/parse-issue-form";
import { convertToSlackOptions } from "../helpers/slack-options";
import { E_ENTITY_CONNECTION_KEYS, E_INTEGRATION_KEYS } from "@plane/etl/core";

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

  @Get("/team/auth/callback")
  async getAppAuthCallback(req: Request, res: Response) {
    try {
      const { code, state: slackState } = req.query;
      const authState = JSON.parse(Buffer.from(slackState as string, "base64").toString("utf-8")) as SlackAuthState;

      const { state, response } = await slackAuth.getWorkspaceAuthToken({
        code: code as string,
        state: authState,
      });

      if (!response.ok) {
        return res.status(500).send({
          error: response,
        });
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
        });
      }

      return res.redirect(`${env.APP_BASE_URL}/${state.workspaceSlug}/settings/integrations/slack/`);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Get("/user/auth/callback")
  async getUserAuthCallback(req: Request, res: Response) {
    try {
      const { code, state: slackState } = req.query;
      const authState = JSON.parse(Buffer.from(slackState as string, "base64").toString("utf-8")) as SlackUserAuthState;
      const { state, response } = await slackAuth.getUserAuthToken({
        code: code as string,
        state: authState,
      });

      // Create credentials for slack for the workspace
      await apiClient.workspaceCredential.createWorkspaceCredential({
        source: E_ENTITY_CONNECTION_KEYS.SLACK_USER,
        target_access_token: state.apiToken,
        source_access_token: response.authed_user.access_token,
        source_refresh_token: response.authed_user.refresh_token,
        workspace_id: state.workspaceId,
        user_id: authState.userId,
      });
      if (authState.profileRedirect) {
        res.redirect(`${env.APP_BASE_URL}/profile/connections/?workspaceId=${authState.workspaceId}`);
      } else {
        res.redirect(`${env.APP_BASE_URL}/${authState.workspaceSlug}/settings/integrations/slack/`);
      }
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
      return res.sendStatus(200);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
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
        const { workspaceConnection, planeClient } = await getConnectionDetails(payload.team.id);
        const values = parseIssueFormData(payload.view.state.values);
        const labels = await planeClient.label.list(workspaceConnection.workspace_id, values.project);
        const filteredLabels = labels.results
          .filter((label) => label.name.toLowerCase().includes(text.toLowerCase()))
          .sort((a, b) => a.name.localeCompare(b.name));
        const labelOptions = convertToSlackOptions(filteredLabels);
        return res.status(200).json({
          options: labelOptions,
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

      if (payload.event === "issue_comment") {
        integrationTaskManager.registerTask(
          {
            route: "plane-slack-webhook",
            jobId: payload.event,
            type: "issue_comment",
          },
          payload
        );
      }

      return res.sendStatus(200);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }
}
