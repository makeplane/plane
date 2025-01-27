import { NextFunction, Request, Response } from "express";
import {
  isUserMessage,
  SlackAuthState,
  SlackUserAuthState,
  TSlackCommandPayload,
  TSlackPayload,
} from "@plane/etl/slack";
import { PlaneWebhookData } from "@plane/sdk";
import { integrationTaskManager } from "@/apps/engine/worker";
import {
  createOrUpdateCredentials,
  deactivateCredentials,
  deleteCredentialsForWorkspace,
  getCredentialsByWorkspaceId,
} from "@/db/query";
import {
  createWorkspaceConnection,
  deleteEntityConnectionByWorkspaceConnectionId,
  deleteWorkspaceConnection,
  getWorkspaceConnections,
} from "@/db/query/connection";
import { env } from "@/env";
import { Controller, Get, Post } from "@/lib";
import { logger } from "@/logger";
import { slackAuth } from "../auth/auth";
import { getConnectionDetails } from "../helpers/connection-details";
import { ACTIONS } from "../helpers/constants";
import { parseIssueFormData } from "../helpers/parse-issue-form";
import { convertToSlackOptions } from "../helpers/slack-options";
import { responseHandler } from "@/helpers/response-handler";

@Controller("/api/slack")
export class SlackController {
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
      responseHandler(res, 500, error);
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
      const credentials = await createOrUpdateCredentials(state.workspaceId, state.userId, {
        source: "SLACK",
        target_access_token: state.apiToken,
        source_access_token: response.access_token,
        source_refresh_token: response.refresh_token,
        workspace_id: state.workspaceId,
      });

      const workspaceConnection = await getWorkspaceConnections(state.workspaceId, "SLACK", response.team.id);

      if (!workspaceConnection || workspaceConnection.length === 0) {
        // Create a workspace connection for the authenticated team
        await createWorkspaceConnection({
          workspaceId: state.workspaceId,
          workspaceSlug: state.workspaceSlug,
          connectionId: response.team.id,
          connectionSlug: response.team.name,
          connectionType: "SLACK",
          connectionData: response.team,
          credentialsId: credentials.id,
          targetHostname: env.API_BASE_URL,
        });
      }

      return res.redirect(`${env.APP_BASE_URL}/${state.workspaceSlug}/settings/integrations/slack/`);
    } catch (error) {
      responseHandler(res, 500, error);
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
      await createOrUpdateCredentials(state.workspaceId, state.userId, {
        source: "SLACK-USER",
        target_access_token: state.apiToken,
        source_access_token: response.authed_user.access_token,
        source_refresh_token: response.authed_user.refresh_token,
        workspace_id: state.workspaceId,
      });
      if (authState.profileRedirect) {
        res.redirect(`${env.APP_BASE_URL}/profile/connections/?workspaceId=${authState.workspaceId}`);
      } else {
        res.redirect(`${env.APP_BASE_URL}/${authState.workspaceSlug}/settings/integrations/slack/`);
      }
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/app/status/:workspaceId")
  async getAppConnectionStatus(req: Request, res: Response) {
    try {

      const { workspaceId } = req.params;
      if (!workspaceId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId to be present.",
        });
      }

      // Get the slack workspace connections associated with the workspaceId
      const connections = await getWorkspaceConnections(workspaceId, "SLACK");
      return res.json(connections);
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/user/status/:workspaceId/:userId")
  async getUserConnectionStatus(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.params;
      if (!workspaceId || !userId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId and userId to be present.",
        });
      }

      // Get credentials for slack user for the workspace
      const credentials = await getCredentialsByWorkspaceId(workspaceId, userId, "SLACK-USER");

      return res.json({
        isConnected: credentials.length > 0,
      });
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  @Post("/app/disconnect")
  async disconnectApp(req: Request, res: Response) {
    try {
      const { workspaceId, connectionId } = req.body;
      if (!workspaceId || !connectionId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId and connectionId to be present.",
        });
      }

      // Get the slack workspace connections associated with the workspaceId
      const connections = await getWorkspaceConnections(workspaceId, "SLACK", connectionId);
      if (connections.length === 0) {
        return res.sendStatus(200);
      } else {
        const connection = connections[0];
        // Delete entity connections referencing the workspace connection
        await deleteEntityConnectionByWorkspaceConnectionId(connection.id);

        // Delete the workspace connection associated with the team
        await deleteWorkspaceConnection(connection.id);

        // Delete the team and user credentials for the workspace
        await deleteCredentialsForWorkspace(workspaceId, "SLACK");
        await deleteCredentialsForWorkspace(workspaceId, "SLACK-USER");

        return res.sendStatus(200);
      }
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  @Post("/user/disconnect")
  async disconnectUser(req: Request, res: Response) {

    try {
      const { workspaceId, userId } = req.body;
      if (!workspaceId || !userId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId and userId to be present.",
        });
      }
      // Delete the user credentials for the workspace
      await deactivateCredentials(workspaceId, userId, "SLACK-USER");
      return res.sendStatus(200);
    } catch (error) {
      responseHandler(res, 500, error);
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
      responseHandler(res, 500, error);
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
      responseHandler(res, 500, error);
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
      responseHandler(res, 500, error);
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
        const labels = await planeClient.label.list(workspaceConnection.workspaceSlug, values.project);
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
      responseHandler(res, 500, error);
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
      responseHandler(res, 500, error);
    }
  }
}
