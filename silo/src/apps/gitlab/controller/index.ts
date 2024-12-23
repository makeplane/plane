import { importTaskManger, integrationTaskManager } from "@/apps/engine/worker";
import { env } from "@/env";
import { Controller, Get, Post } from "@/lib";
import { ExIssueLabel } from "@plane/sdk";
import { Request, Response } from "express";
import { createGitLabAuth, createGitLabService, GitlabWebhookEvent } from "@plane/etl/gitlab";
import { verifyGitlabToken } from "../helpers";
import { createOrUpdateCredentials, getCredentialsByOnlyWorkspaceId, deleteCredentialsForWorkspace } from "@/db/query";
import {
  createWorkspaceConnection,
  getWorkspaceConnections,
  updateWorkspaceConnection,
  deleteEntityConnectionByWorkspaceConnectionId,
  deleteWorkspaceConnection,
} from "@/db/query/connection";
import { logger } from "@/logger";

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

    res.send({ message: "Successfully connected to GitLab" });
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
}
