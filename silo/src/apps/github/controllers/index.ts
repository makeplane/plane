import taskManager from "@/apps/engine/worker";
import { createCredentials, createOrUpdateCredentials, getCredentialsByOnlyWorkspaceId } from "@/db/query";
import { createWorkspaceConnection } from "@/db/query/connection";
import { env } from "@/env";
import { Controller, Get, Post } from "@/lib";
import { ExIssue, ExIssueComment, ExIssueLabel, PlaneWebhookPayloadBase } from "@plane/sdk";
import {
  createGithubAuth,
  createGithubService,
  GithubAuthorizeState,
  GithubInstallation,
  GithubRepository,
  GithubUserAuthState,
  GithubWebhookPayload,
} from "@silo/github";
import { Request, Response } from "express";

export const githubAuthService = createGithubAuth(
  env.GITHUB_APP_NAME,
  env.GITHUB_CLIENT_ID,
  env.GITHUB_CLIENT_SECRET,
  `${env.SILO_API_BASE_URL}/silo/api/github/auth/user/callback`
);

@Controller("/github")
class GithubController {
  @Post("/auth/user/url")
  async getUserAuthUrl(req: Request, res: Response) {
    const { userId, workspaceId, workspaceSlug, apiToken, targetHost } = req.body;
    const authUrl = githubAuthService.getUserAuthUrl({
      user_id: userId,
      workspace_id: workspaceId,
      workspace_slug: workspaceSlug,
      plane_api_token: apiToken,
      target_host: targetHost,
    });

    res.send(authUrl);
  }

  /* -------------------- Auth Endpoints -------------------- */
  @Post("/auth/url")
  async getAuthURL(req: Request, res: Response) {
    const { workspaceId, workspaceSlug, apiToken, targetHost } = req.body;

    res.send(
      githubAuthService.getAuthUrl({
        workspace_id: workspaceId,
        workspace_slug: workspaceSlug,
        plane_api_token: apiToken,
        target_host: targetHost,
      })
    );
  }

  @Get("/auth/user/callback")
  async authUserCallback(req: Request, res: Response) {
    // Generate the access token for the user and save the credentials to the db
    const { code, state } = req.query;

    // Check if the request is valid, with the data received
    if (!code || !state) {
      return res.status(400).send("Invalid request callback");
    }

    const authState: GithubUserAuthState = JSON.parse(Buffer.from(state as string, "base64").toString());

    try {
      const { response, state } = await githubAuthService.getUserAccessToken({
        code: code as string,
        state: authState,
      });

      // Extract the parameters from the response
      const accessToken = parseAccessToken(response);

      await createOrUpdateCredentials(state.workspace_id, state.user_id, {
        source: "GITHUB-USER",
        source_access_token: accessToken,
        workspace_id: state.workspace_id,
        user_id: state.user_id,
        target_access_token: state.plane_api_token,
      });
    } catch (error) {
      return res.status(500);
    }

    res.send("Authenticated Successfully!");
  }

  @Get("/auth/callback")
  async authCallback(req: Request, res: Response) {
    const { code, installation_id, state } = req.query;

    // Check if the request is valid, with the data received
    if (!code || !installation_id || !state) {
      return res.status(400).send("Invalid request callback");
    }
    // Decode the base64 encoded state string and parse it to JSON
    const authState: GithubAuthorizeState = JSON.parse(Buffer.from(state as string, "base64").toString());

    // Create a credentials entry for the installation
    try {
      // Get the credentials for the workspaceid
      const credentials = await getCredentialsByOnlyWorkspaceId(authState.workspace_id, "GITHUB");

      let shouldCreate = true;
      if (credentials && credentials.length > 0) {
        credentials.forEach((credential) => {
          // If we already have the installation id, we don't need to create it again
          if (credential.source_access_token === installation_id) {
            shouldCreate = false;
          }
        });
      }

      if (shouldCreate) {
        const { insertedId } = await createCredentials(authState.workspace_id, {
          source: "GITHUB",
          source_access_token: installation_id as string,
          target_access_token: authState.plane_api_token,
        });

        // Create github service from the installation id
        const service = createGithubService(env.GITHUB_APP_ID, env.GITHUB_PRIVATE_KEY, installation_id as string);

        // Get the installation details
        const installation = await service.getInstallation(Number(installation_id));

        if (!installation.data.account) {
          return res.status(400).send("No account found for the installation");
        }

        // Create workspace connection for github
        await createWorkspaceConnection({
          workspaceId: authState.workspace_id,
          workspaceSlug: authState.workspace_slug,
          targetHostname: authState.target_host,
          credentialsId: insertedId,
          connectionType: "GITHUB",
          connectionId: installation.data.account.id.toString(),
          connectionData: installation.data.account,
        });
      }

      res.status(200).send("Authenticated Successfully!");
    } catch (error) {
      res.status(500).send(error);
    }
  }
  /* -------------------- Auth Endpoints -------------------- */

  /* -------------------- Data Endpoints -------------------- */
  @Get("/:workspaceId/installations")
  async getInstallations(req: Request, res: Response) {
    const { workspaceId } = req.params;

    try {
      // Get the credentials for the workspace id, where the source is GITHUB
      const credentials = await getCredentialsByOnlyWorkspaceId(workspaceId, "GITHUB");

      // If there are no credentials, this simply means that there is nothing
      // installed for the workspace, so we return an empty array
      if (!credentials || credentials.length === 0) {
        return res.status(200).send([]);
      }

      const githubCredentials = credentials[0];

      if (githubCredentials.source_access_token === null) {
        return res.status(401).json({
          message: "No installations found for the workspace",
        });
      }

      const service = createGithubService(
        env.GITHUB_APP_ID,
        env.GITHUB_PRIVATE_KEY,
        githubCredentials.source_access_token
      );

      const installations: GithubInstallation[] = [];

      // Get each installation for the workspace
      for (const credential of credentials) {
        const installationId = Number(credential.source_access_token);

        const installation = await service.getInstallation(installationId);
        if (installation && installation.data && installation.status === 200) {
          installations.push(installation.data);
        }
      }

      // Return the response of the installation
      res.status(200).json(installations);
    } catch (error) {
      res.status(500).json({
        error: "Something went wrong fetching installations",
        message: error,
      });
    }
  }

  @Get("/:workspaceId/repos")
  async getWorkspaceAccessibleRepositories(req: Request, res: Response) {
    const { workspaceId } = req.params;

    try {
      // Get the credentials for the workspace id, where the source is GITHUB
      const credentials = await getCredentialsByOnlyWorkspaceId(workspaceId, "GITHUB");

      // If there are no credentials, this simply means that there is nothing
      // installed for the workspace, so we return an empty array
      if (!credentials || credentials.length === 0) {
        return res.status(200).send([]);
      }

      const githubCredentials = credentials[0];

      if (githubCredentials.source_access_token === null) {
        return res.status(401).json({
          message: "No installations found for the workspace",
        });
      }

      const repositories: GithubRepository[] = [];

      const repoPromises = credentials.map(async (credential) => {
        // Create the github service with the credentials
        const service = createGithubService(
          env.GITHUB_APP_ID,
          env.GITHUB_PRIVATE_KEY,
          // @ts-ignore
          githubCredentials.source_access_token
        );

        const installationId = Number(credential.source_access_token);
        const repos = await service.getReposForInstallation(installationId);
        if (repos) {
          repositories.push(...repos);
        }
      });

      // Fetch data for all the installation Ids
      await Promise.all(repoPromises);
      res.status(200).json(repositories);
    } catch (error) {
      res.status(500).send({
        error: "Something went wrong fetching repositories",
        message: error,
      });
    }
  }
  /* -------------------- Data Endpoints -------------------- */

  /* ------------------- Webhook Endpoints ------------------- */
  @Post("/github-webhook")
  async githubWebhook(req: Request, res: Response) {
    res.status(202).send({
      message: "Webhook received",
    });
    // Get the event types and the delivery id
    const eventType = req.headers["x-github-event"];
    const deliveryId = req.headers["x-github-delivery"];

    if (eventType === "issues") {
      const payload = req.body as GithubWebhookPayload["webhook-issues-opened"];
      // Discard the issue, if the labels doens't include github label
      if (!payload.issue?.labels?.find((label) => label.name === "plane")) {
        return;
      }
      await taskManager.registerStoreTask(
        {
          route: "github-webhook",
          jobId: eventType as string,
          type: eventType as string,
        },
        {
          installationId: payload.installation?.id,
          owner: payload.repository.owner.login,
          accountId: payload.organization ? payload.organization.id : payload.repository.owner.id,
          repositoryId: payload.repository.id,
          repositoryName: payload.repository.name,
          issueNumber: payload.issue.number,
        },
        Number(env.DEDUP_INTERVAL)
      );

      // Forward the event to the task manager to process
    } else {
      await taskManager.registerTask(
        {
          route: "github-webhook",
          jobId: deliveryId as string,
          type: eventType as string,
        },
        req.body
      );
    }
  }

  @Post("/plane-webhook")
  async planeWebhook(req: Request, res: Response) {
    res.status(202).send({
      message: "Webhook received",
    });

    // Get the event types and delivery id
    const eventType = req.headers["x-plane-event"];
    const event = req.body.event;
    if (event == "issue" || event == "issue_comment") {
      const payload = req.body as PlaneWebhookPayloadBase<ExIssue | ExIssueComment>;

      const id = payload.data.id;
      const workspace = payload.data.workspace;
      const project = payload.data.project;
      const issue = payload.data.issue;

      if (event == "issue") {
        const labels = req.body.data.labels as ExIssueLabel[];
        // If labels doesn't include github label, then we don't need to process this event
        if (!labels.find((label) => label.name === "github")) {
          return;
        }

        // Reject the activity, that are not useful
        const skipFields = ["priority", "state", "start_date", "target_date", "cycles", "parent", "modules"];
        if (payload.activity.field && skipFields.includes(payload.activity.field)) {
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
  /* ------------------- Webhook Endpoints ------------------- */
}

function parseAccessToken(response: string): string {
  // Split the response into key-value pairs
  const pairs = response.split("&");

  // Find the pair that starts with "access_token"
  const accessTokenPair = pairs.find((pair) => pair.startsWith("access_token="));

  if (!accessTokenPair) {
    throw new Error("Access token not found in the response");
  }

  // Split the pair and return the value (index 1)
  const [, accessToken] = accessTokenPair.split("=");

  if (!accessToken) {
    throw new Error("Access token is empty");
  }

  return accessToken;
}

export default GithubController;
