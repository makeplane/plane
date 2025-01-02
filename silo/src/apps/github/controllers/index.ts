import { integrationTaskManager } from "@/apps/engine/worker";
import {
  createCredentials,
  createOrUpdateCredentials,
  getCredentialsByOnlyWorkspaceId,
  deleteCredentialsForWorkspace,
  deactivateCredentials,
  getCredentialsByWorkspaceId,
} from "@/db/query";
import {
  createWorkspaceConnection,
  getWorkspaceConnections,
  deleteEntityConnectionByWorkspaceConnectionId,
  deleteWorkspaceConnection,
  updateWorkspaceConnection,
  getEntityConnectionByWorkspaceIdAndConnectionId,
} from "@/db/query/connection";
import { env } from "@/env";
import { Controller, Get, Post } from "@/lib";
import { Client, ExIssue, ExIssueComment, ExIssueLabel, PlaneUser, PlaneWebhookPayloadBase } from "@plane/sdk";
import {
  createGithubAuth,
  createGithubService,
  createGithubUserService,
  GithubAuthorizeState,
  GithubInstallation,
  GithubRepository,
  GithubUserAuthState,
  GithubWebhookPayload,
} from "@plane/etl/github";
import { Request, Response } from "express";
import { logger } from "@/logger";
import { GithubWorkspaceConnection } from "../types";

export const githubAuthService = createGithubAuth(
  env.GITHUB_APP_NAME,
  env.GITHUB_CLIENT_ID,
  env.GITHUB_CLIENT_SECRET,
  `${env.SILO_API_BASE_URL}${env.SILO_BASE_PATH}/api/github/auth/user/callback`
);

@Controller("/api/github")
class GithubController {
  @Get("/ping")
  async ping(_req: Request, res: Response) {
    res.send("pong");
  }

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

      const workspaceConnection = await getWorkspaceConnections(workspaceId, "GITHUB");

      return res.json(workspaceConnection);
    } catch (error) {
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
      const connections = await getWorkspaceConnections(workspaceId, "GITHUB", connectionId);
      const credentials = await getCredentialsByOnlyWorkspaceId(workspaceId, "GITHUB");

      if (connections.length === 0) {
        return res.sendStatus(200);
      } else {
        const connection = connections[0];
        // Delete entity connections referencing the workspace connection
        await deleteEntityConnectionByWorkspaceConnectionId(connection.id);

        // Delete the workspace connection associated with the team
        await deleteWorkspaceConnection(connection.id);

        // Delete the team and user credentials for the workspace
        await deleteCredentialsForWorkspace(workspaceId, "GITHUB");
        await deleteCredentialsForWorkspace(workspaceId, "GITHUB-USER");

        // delete the installation from github
        if (credentials.length > 0) {
          const credential = credentials[0];
          if (credential.source_access_token) {
            const githubService = createGithubService(
              env.GITHUB_APP_ID,
              env.GITHUB_PRIVATE_KEY,
              credential.source_access_token
            );

            // delete the installation from github
            await githubService.deleteInstallation(Number(credential.source_access_token));
          }
        }
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
    const { workspace_id, workspace_slug, plane_api_token, user_id } = req.body;

    if (!workspace_id || !workspace_slug || !plane_api_token || !user_id) {
      return res.status(400).send({
        message: "Bad Request, expected workspace_id, workspace_slug and plane_api_token be present.",
      });
    }

    const connections = await getWorkspaceConnections(workspace_id, "GITHUB");

    if (connections.length > 0) {
      // If the connection already exists, then we don't need to create it again
      return res.status(400).send("Connection already exists");
    }

    res.send(
      githubAuthService.getAuthUrl({
        workspace_id: workspace_id,
        workspace_slug: workspace_slug,
        plane_api_token: plane_api_token,
        user_id: user_id,
        target_host: env.API_BASE_URL,
      })
    );
  }

  @Get("/auth/callback")
  async authCallback(req: Request, res: Response) {
    const { installation_id, state } = req.query;

    // Check if the request is valid, with the data received
    if (!installation_id || !state) {
      return res.status(400).send("Invalid request callback");
    }
    // Decode the base64 encoded state string and parse it to JSON
    const authState: GithubAuthorizeState = JSON.parse(Buffer.from(state as string, "base64").toString());

    // Create a credentials entry for the installation
    try {
      // Get the credentials for the workspaceId
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
          user_id: authState.user_id,
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
          targetHostname: env.API_BASE_URL,
          credentialsId: insertedId,
          connectionType: "GITHUB",
          // @ts-ignore
          connectionSlug: installation.data.account.login,
          config: {
            userMap: [],
          },
          connectionId: installation.data.account.id.toString(),
          connectionData: installation.data.account,
        });
      }

      res.redirect(`${env.APP_BASE_URL}/${authState.workspace_slug}/settings/integrations/github/`);
    } catch (error) {
      res.status(500).send(error);
    }
  }

  @Get("/auth/user-status/:workspaceId/:userId")
  async getUserConnectionStatus(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.params;

      if (!workspaceId || !userId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId and userId to be present.",
        });
      }

      const credentials = await getCredentialsByWorkspaceId(workspaceId, userId, "GITHUB-USER");

      return res.json({
        isConnected: credentials.length > 0,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).send("Internal Server Error");
    }
  }

  @Post("/auth/user-disconnect/:workspaceId/:userId")
  async disconnectUser(req: Request, res: Response) {
    const { workspaceId, userId } = req.params;

    if (!workspaceId || !userId) {
      return res.status(400).send({
        message: "Bad Request, expected workspaceId and userId to be present.",
      });
    }

    try {
      // Delete the user credentials for the workspace
      await deactivateCredentials(workspaceId, userId, "GITHUB-USER");

      // remove the user mapping from the workspace connection
      const connections = await getWorkspaceConnections(workspaceId, "GITHUB");
      const connection = connections[0] as GithubWorkspaceConnection;
      if (!connection || !connection.config.userMap || !connection.id) {
        // We don't need to touch the connection if it doesn't exist
        return res.status(200);
      }
      const userMap = connection.config.userMap.filter((map) => map.planeUser.id !== userId);
      await updateWorkspaceConnection(connection.id, {
        config: {
          userMap,
        },
      });

      return res.sendStatus(200);
    } catch (error) {
      logger.error(error);
      return res.status(500).send({
        error: error,
      });
    }
  }

  @Post("/auth/user/url")
  async getUserAuthUrl(req: Request, res: Response) {
    const { workspace_id, workspace_slug, user_id, plane_api_token, profile_redirect } = req.body;

    if (!workspace_id || !workspace_slug || !user_id) {
      return res.status(400).send({
        message: "Bad Request, expected workspace_id, workspace_slug, user_id and plane_api_token to be present.",
      });
    }

    const authUrl = githubAuthService.getUserAuthUrl({
      workspace_id: workspace_id,
      workspace_slug: workspace_slug,
      user_id: user_id,
      plane_api_token: plane_api_token,
      profile_redirect: profile_redirect,
      target_host: env.API_BASE_URL,
    });

    res.send(authUrl);
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

      const connections = await getWorkspaceConnections(authState.workspace_id, "GITHUB");

      if (connections.length === 0) {
        return res.status(400).send("Connection not found");
      }

      if (connections.length > 1) {
        return res.status(400).send("Multiple connections found, not supported");
      }

      const connection = connections[0] as GithubWorkspaceConnection;

      if (!connection.id) {
        return res.status(400).send("Connection not found");
      }

      const credentials = await getCredentialsByOnlyWorkspaceId(authState.workspace_id, "GITHUB");
      if (credentials.length === 0) {
        return res.status(400).send("No installation found for the workspace");
      }

      const credential = credentials[0];
      if (!credential.source_access_token || !credential.target_access_token) {
        return res.status(400).send("No installation found for the workspace");
      }

      // Extract the parameters from the response
      const accessToken = parseAccessToken(response);
      const githubService = createGithubUserService(accessToken);
      const user = await githubService.getUser();

      if (!user) {
        return res.status(400).send("No user found for the access token");
      }

      const planeClient = new Client({
        apiToken: credential.target_access_token,
        baseURL: connection.targetHostname,
      });

      const users: PlaneUser[] = await planeClient.users.listAllUsers(connection.workspaceSlug);
      const planeUser = users.find((user) => user.id === authState.user_id);

      await createOrUpdateCredentials(state.workspace_id, authState.user_id, {
        source: "GITHUB-USER",
        source_access_token: accessToken,
        workspace_id: state.workspace_id,
        user_id: state.user_id,
        target_access_token: state.plane_api_token,
      });

      // update the workspace connection for the user
      if (planeUser) {
        await updateWorkspaceConnection(connection.id, {
          config: {
            userMap: [...connection.config.userMap, { githubUser: user, planeUser: planeUser }],
          },
        });
      }
    } catch (error) {
      return res.status(500);
    }

    if (authState.profile_redirect) {
      return res.redirect(`${env.APP_BASE_URL}/profile/connections/?workspaceId=${authState.workspace_id}`);
    }

    return res.redirect(`${env.APP_BASE_URL}/${authState.workspace_slug}/settings/integrations/github/`);
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
          repositories.push(...repos.map((repo: any) => ({ id: repo.id, name: repo.name, full_name: repo.full_name })));
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
      if (!payload.issue?.labels?.find((label) => label.name.toLowerCase() === "plane")) {
        return;
      }
      await integrationTaskManager.registerStoreTask(
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
      await integrationTaskManager.registerTask(
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
        if (!labels.find((label) => label.name.toLowerCase() === "github")) {
          return;
        }

        // Reject the activity, that is not useful
        const skipFields = ["priority", "state", "start_date", "target_date", "cycles", "parent", "modules", "link"];
        if (payload.activity.field && skipFields.includes(payload.activity.field)) {
          return;
        }
      }

      // Forward the event to the task manager to process
      await integrationTaskManager.registerStoreTask(
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
