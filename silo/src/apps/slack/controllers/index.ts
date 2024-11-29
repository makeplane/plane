import { Controller, Get, Post } from "@/lib";
import { Request, Response } from "express";
import { isUserMessage, SlackAuthState, TSlackPayload } from "@silo/slack";
import { slackAuth } from "../auth/auth";
import {
  createOrUpdateCredentials,
  deactivateCredentials,
  deleteCredentialsForWorkspace,
  getCredentialsByWorkspaceId,
} from "@/db/query";
import { logger } from "@/logger";
import taskManager from "@/apps/engine/worker";
import {
  createWorkspaceConnection,
  deleteEntityConnectionByWorkspaceConnectionId,
  deleteWorkspaceConnection,
  getWorkspaceConnections,
} from "@/db/query/connection";
import { PlaneWebhookData } from "@plane/sdk";
import { env } from "@/env";

@Controller("/api/slack")
export class SlackController {
  @Get("/ping")
  async ping(_req: Request, res: Response) {
    res.send("pong");
  }

  @Post("/app/auth/url")
  async getAppAuthURL(req: Request, res: Response) {
    const body: SlackAuthState = req.body;
    if (!body.workspaceId || !body.apiToken) {
      return res.status(400).send({
        message: "Bad Request, expected both apiToken and workspaceId to be present.",
      });
    }
    const response = slackAuth.getWorkspaceAuthUrl(body);
    res.send(response);
  }

  @Post("/user/auth/url")
  async getUserAuthURL(req: Request, res: Response) {
    const body: SlackAuthState = req.body;
    if (!body.userId) {
      return res.status(400).send({
        message: "Bad Request, expected userId to be present.",
      });
    }
    const response = slackAuth.getUserAuthUrl(body);
    res.send(response);
  }

  @Get("/team/auth/callback")
  async getAppAuthCallback(req: Request, res: Response) {
    const { code, state } = req.query;
    const authState = JSON.parse(Buffer.from(state as string, "base64").toString("utf-8")) as SlackAuthState;

    try {
      const { state, response } = await slackAuth.getWorkspaceAuthToken({
        code: code as string,
        state: authState,
      });

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
          connectionType: "SLACK",
          connectionData: response.team,
          credentialsId: credentials.id,
          targetHostname: env.API_BASE_URL,
        });
      }
    } catch (error) {
      logger.error(error);
      return res.status(500).send({
        error: error,
      });
    }
    res.redirect(`${env.APP_BASE_URL}/${authState.workspaceSlug}/settings/integrations/slack/`);
  }

  @Get("/user/auth/callback")
  async getUserAuthCallback(req: Request, res: Response) {
    const { code, state } = req.query;
    const authState = JSON.parse(Buffer.from(state as string, "base64").toString("utf-8")) as SlackAuthState;

    try {
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
    } catch (error) {
      logger.error(error);
      res.sendStatus(500);
    }
    res.redirect(`${env.APP_BASE_URL}/${authState.workspaceSlug}/settings/integrations/slack/`);
  }

  @Get("/app/status/:workspaceId")
  async getAppConnectionStatus(req: Request, res: Response) {
    const { workspaceId } = req.params;
    if (!workspaceId) {
      return res.status(400).send({
        message: "Bad Request, expected workspaceId to be present.",
      });
    }

    // Get the slack workspace connections associated with the workspaceId
    const connections = await getWorkspaceConnections(workspaceId, "SLACK");
    return res.json(connections);
  }

  @Get("/user/status/:workspaceId/:userId")
  async getUserConnectionStatus(req: Request, res: Response) {
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
  }

  @Post("/app/disconnect")
  async disconnectApp(req: Request, res: Response) {
    const { workspaceId, connectionId } = req.body;
    if (!workspaceId || !connectionId) {
      return res.status(400).send({
        message: "Bad Request, expected workspaceId and connectionId to be present.",
      });
    }

    try {
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

        console.log("Deleted slack credentials and connections");
        return res.sendStatus(200);
      }
    } catch (error) {
      logger.error(error);
      return res.status(500).send({
        error: error,
      });
    }
  }

  @Post("/user/disconnect")
  async disconnectUser(req: Request, res: Response) {
    const { workspaceId, userId } = req.body;
    if (!workspaceId || !userId) {
      return res.status(400).send({
        message: "Bad Request, expected workspaceId and userId to be present.",
      });
    }

    try {
      // Delete the user credentials for the workspace
      await deactivateCredentials(workspaceId, userId, "SLACK-USER");
      return res.sendStatus(200);
    } catch (error) {
      logger.error(error);
      return res.status(500).send({
        error: error,
      });
    }
  }

  @Post("/action")
  async ackSlackAction(req: Request, res: Response) {
    const payloadStr = req.body.payload;

    if (!payloadStr) {
      return res.status(400).json({ error: "No payload received" });
    }

    // Parse the payload
    const payload: TSlackPayload = JSON.parse(payloadStr);

    // Pass the payload to the slack worker, to take action
    taskManager.registerTask(
      {
        route: "slack-interaction",
        jobId: payload.type,
        type: payload.type,
      },
      payload
    );

    res.status(200).json({});
  }

  @Post("/events")
  async slackEvents(req: Request, res: Response) {
    const payload = req.body;

    if (isUserMessage(payload)) {
      payload.type = "message";

      taskManager.registerTask(
        {
          route: "slack-interaction",
          jobId: payload.event_id,
          type: "message",
        },
        payload
      );
    }

    res.sendStatus(200);
  }

  @Post("/plane/events")
  async planeEvents(req: Request, res: Response) {
    const payload = req.body as PlaneWebhookData;

    if (payload.event === "issue_comment") {
      taskManager.registerTask(
        {
          route: "plane-slack-webhook",
          jobId: payload.event,
          type: "issue_comment",
        },
        payload
      );
    }

    res.sendStatus(200);
  }
}
