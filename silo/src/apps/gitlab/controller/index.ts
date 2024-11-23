import taskManager from "@/apps/engine/worker";
import { env } from "@/env";
import { Controller, Get, Post } from "@/lib";
import { ExIssueLabel } from "@plane/sdk";
import { Request, Response } from "express";
import { createGitLabAuth, createGitLabService, GitlabWebhookEvent } from "@silo/gitlab";
import { verifyGitlabToken } from "../helpers";
import { createOrUpdateCredentials } from "@/db/query";
import { createWorkspaceConnection, getWorkspaceConnections, updateWorkspaceConnection } from "@/db/query/connection";

@Controller("/gitlab")
export class GitlabController {
  /* -------------------- Auth Endpoints -------------------- */
  @Post("/auth/url")
  async getAuthURL(req: Request, res: Response) {
    const { workspaceId, workspaceSlug, apiToken, targetHost, userId, hostname } = req.body;

    if (!workspaceId || !workspaceSlug || !apiToken || !targetHost)
      return res.status(400).send({ message: "Missing required fields" });

    const gitlabService = createGitLabAuth({
      clientId: env.GITLAB_CLIENT_ID,
      clientSecret: env.GITLAB_CLIENT_SECRET,
      redirectUri: `${env.SILO_API_BASE_URL}/silo/api/gitlab/auth/callback`,
    });

    res.send(
      gitlabService.getAuthUrl({
        user_id: userId,
        gitlab_hostname: hostname,
        workspace_id: workspaceId,
        workspace_slug: workspaceSlug,
        plane_api_token: apiToken,
        target_host: targetHost,
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
    const worspaceConnections = await getWorkspaceConnections(authState.workspace_id, "GITLAB");

    // Get associated gitlab user

    // If the workspace connection exist and the credential id is also the same,
    // pass, else create the workspace connection or update the credential id
    if (worspaceConnections.length > 0) {
      const workspaceConnection = worspaceConnections[0];
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
    await taskManager.registerTask(
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
      // If labels doesn't include github label, then we don't need to process this event
      if (!labels.find((label) => label.name === "gitlab")) {
        return;
      }
    }

    // Forward the event to the task manager to process
    await taskManager.registerStoreTask(
      {
        route: "plane-github-webhook",
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
