import crypto from "crypto";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { E_ENTITY_CONNECTION_KEYS, E_INTEGRATION_KEYS, E_SILO_ERROR_CODES } from "@plane/etl/core";
import {
  createGithubAuth,
  createGithubService,
  createGithubUserService,
  GithubAuthorizeState,
  GithubInstallation,
  GithubPlaneOAuthState,
  GithubRepository,
  GithubUserAuthState,
  GithubWebhookPayload,
} from "@plane/etl/github";
import { ExIssue, ExIssueComment, ExIssueLabel, PlaneUser, PlaneWebhookPayloadBase } from "@plane/sdk";
import { TWorkspaceConnection } from "@plane/types";
import { env } from "@/env";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { getPlaneAppDetails } from "@/helpers/plane-app-details";
import { responseHandler } from "@/helpers/response-handler";
import { Controller, EnsureEnabled, Get, Middleware, Post, useValidateUserAuthentication } from "@/lib";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { planeOAuthService } from "@/services/oauth";
import { EOAuthGrantType, ESourceAuthorizationType } from "@/types/oauth";
import { integrationTaskManager } from "@/worker";
import { E_GITHUB_DISCONNECT_SOURCE, GithubUserMap } from "../types";

export const githubAuthService = createGithubAuth(
  env.GITHUB_APP_NAME,
  env.GITHUB_CLIENT_ID,
  env.GITHUB_CLIENT_SECRET,
  encodeURI(env.SILO_API_BASE_URL + env.SILO_BASE_PATH + "/api/github/auth/user/callback")
);

const apiClient = getAPIClient();

@EnsureEnabled(E_INTEGRATION_KEYS.GITHUB)
@Controller("/api/github")
export default class GithubController {
  @Get("/ping")
  async ping(_req: Request, res: Response) {
    res.send({ message: "pong" });
  }

  /* -------------------- Auth Endpoint s -------------------- */
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
        connection_type: E_INTEGRATION_KEYS.GITHUB,
        workspace_id: workspaceId,
      });

      return res.json(workspaceConnection);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  // Disconnect the organization connection
  @Post("/auth/organization-disconnect/:workspaceId/:connectionId/:userId")
  @useValidateUserAuthentication()
  async disconnectOrganization(req: Request, res: Response) {
    const { workspaceId, connectionId, userId } = req.params;

    if (!workspaceId || !connectionId) {
      return res.status(400).send({
        message: "Bad Request, expected workspaceId and connectionId to be present.",
      });
    }

    try {
      // Get the github workspace connections associated with the workspaceId
      const connections = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.GITHUB,
        connection_id: connectionId,
        workspace_id: workspaceId,
      });

      if (connections.length === 0) {
        return res.sendStatus(200);
      }

      const connection = connections[0];
      const credential = await apiClient.workspaceCredential.getWorkspaceCredential(connection.credential_id);

      if (!credential || !credential.source_access_token) {
        logger.error("No valid credential found for GitHub installation");
        return res.status(400).send({
          message: "No valid credential found for GitHub installation",
        });
      }

      try {
        // First attempt to delete the GitHub installation
        const githubService = createGithubService(
          env.GITHUB_APP_ID,
          env.GITHUB_PRIVATE_KEY,
          credential.source_access_token
        );

        let isDeleted = false;
        let deletionResult = null;

        // Try to delete the installation from GitHub first
        try {
          deletionResult = await githubService.deleteInstallation(Number(credential.source_access_token));
          isDeleted = deletionResult.status === 204;
        } catch (error: any) {
          if (error && error?.response?.status === 404) {
            isDeleted = true;
          }
        }

        if (!isDeleted) {
          return res.status(400).json({ error: "GitHub deletion failed" });
        }

        await apiClient.workspaceConnection.deleteWorkspaceConnection(
          connection.id,
          {
            disconnect_source: E_GITHUB_DISCONNECT_SOURCE.ROUTE_DISCONNECT,
            disconnect_id: credential.source_access_token,
            connection_length: connections.length,
            deletion_result: deletionResult,
          },
          userId
        );

        // delete the token from the cache
        await planeOAuthService.deleteTokenFromCache(credential);

        return res.sendStatus(200);
      } catch (error: any) {
        logger.error("Failed to delete GitHub installation:", error);
        return res.status(500).send({
          message: "Failed to delete GitHub installation. Please try again or contact support.",
          error: error.message,
        });
      }
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/auth/url")
  @useValidateUserAuthentication()
  async getAuthURL(req: Request, res: Response) {
    try {
      const { workspace_id, workspace_slug, plane_api_token, user_id, plane_app_installation_id } = req.body;

      if (!workspace_id || !workspace_slug || !plane_api_token || !user_id || !plane_app_installation_id) {
        return res.status(400).send({
          message:
            "Bad Request, expected workspace_id, workspace_slug, plane_api_token, user_id and plane_app_installation_id be present.",
        });
      }

      const connections = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.GITHUB,
        workspace_id: workspace_id,
      });

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
          plane_app_installation_id: plane_app_installation_id,
        })
      );
    } catch (error) {
      return responseHandler(res, 500, error);
    }
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
    const redirectUri = `${env.APP_BASE_URL}/${authState.workspace_slug}/settings/integrations/github/`;

    try {
      /*
        Check if the same installation id is already present in any workspace of plane. Which means that the organization that we are trying to
        associate with this workspace is already associated with another workspace. At this point, we don't allow multiple connections.
      */
      const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
        source: E_INTEGRATION_KEYS.GITHUB,
        source_access_token: installation_id as string,
      });

      if (credentials && credentials.length > 0) {
        return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.CANNOT_CREATE_MULTIPLE_CONNECTIONS}`);
      }

      // use plane_app_installation_id in the state payload and clientid and secret to generate the token
      const { planeAppClientId, planeAppClientSecret } = await getPlaneAppDetails(E_INTEGRATION_KEYS.GITHUB);
      if (!planeAppClientId || !planeAppClientSecret) {
        return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.INVALID_APP_CREDENTIALS}`);
      }

      if (!authState.plane_app_installation_id) {
        return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.INVALID_APP_INSTALLATION_ID}`);
      }

      const tokenResponse = await planeOAuthService.generateToken({
        client_id: planeAppClientId,
        client_secret: planeAppClientSecret,
        grant_type: EOAuthGrantType.CLIENT_CREDENTIALS,
        app_installation_id: authState.plane_app_installation_id,
      });

      const { id: insertedId } = await apiClient.workspaceCredential.createWorkspaceCredential({
        source: E_INTEGRATION_KEYS.GITHUB,
        workspace_id: authState.workspace_id,
        user_id: authState.user_id,
        source_identifier: installation_id as string,
        source_authorization_type: ESourceAuthorizationType.TOKEN,
        source_access_token: installation_id as string,
        target_access_token: tokenResponse.access_token,
        target_identifier: authState.plane_app_installation_id,
        target_authorization_type: EOAuthGrantType.CLIENT_CREDENTIALS,
      });

      // Create github service from the installation id
      const service = createGithubService(env.GITHUB_APP_ID, env.GITHUB_PRIVATE_KEY, installation_id as string);

      // Get the installation details
      const installation = await service.getInstallation(Number(installation_id));

      // In cases of partial installations, the account is might not be present, or absense of scopes.
      if (!installation.data.account) {
        return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.INVALID_INSTALLATION_ACCOUNT}`);
      }

      // Create workspace connection for github
      await apiClient.workspaceConnection.createWorkspaceConnection({
        workspace_id: authState.workspace_id,
        connection_type: E_INTEGRATION_KEYS.GITHUB,
        target_hostname: env.API_BASE_URL,
        credential_id: insertedId,
        connection_id: installation.data.account.id.toString(),
        connection_data: installation.data.account,
        // @ts-expect-error
        connection_slug: installation.data.account.login,
        config: {
          userMap: [],
        },
      });

      res.redirect(redirectUri);
    } catch (error) {
      logger.error("Failed to create GitHub connection:", error);
      return res.redirect(`${env.APP_BASE_URL}/error?error=${E_SILO_ERROR_CODES.GENERIC_ERROR}`);
    }
  }

  @Get("/auth/user-status/:workspaceId/:userId")
  @useValidateUserAuthentication()
  async getUserConnectionStatus(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.params;

      if (!workspaceId || !userId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId and userId to be present.",
        });
      }

      const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
        source: E_ENTITY_CONNECTION_KEYS.GITHUB_USER,
        workspace_id: workspaceId,
        user_id: userId,
        is_active: "true",
      });

      return res.json({
        isConnected: credentials.length > 0,
      });
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/auth/user-disconnect/:workspaceId/:userId")
  @useValidateUserAuthentication()
  async disconnectUser(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.params;

      if (!workspaceId || !userId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId and userId to be present.",
        });
      }
      // Delete the user credentials for the workspace
      const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
        source: E_ENTITY_CONNECTION_KEYS.GITHUB_USER,
        workspace_id: workspaceId,
        user_id: userId,
      });

      if (!credentials.length) {
        return res.status(200);
      }

      await apiClient.workspaceCredential.deleteWorkspaceCredential(credentials[0].id);

      // remove the user mapping from the workspace connection
      const connections = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.GITHUB,
        workspace_id: workspaceId,
      });
      const connection = connections[0] as TWorkspaceConnection<{ userMap: GithubUserMap }>;
      if (!connection || !connection.config.userMap || !connection.id) {
        // We don't need to touch the connection if it doesn't exist
        return res.status(200);
      }
      const userMap = connection.config.userMap.filter((map) => map.planeUser.id !== userId);
      await apiClient.workspaceConnection.updateWorkspaceConnection(connection.id, {
        config: {
          userMap,
        },
      });

      // delete the token from the cache
      await planeOAuthService.deleteTokenFromCache(credentials[0]);

      return res.sendStatus(200);
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/auth/user/url")
  async getUserAuthUrl(req: Request, res: Response) {
    try {
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
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  // this endpoint will receive the code from the oauth authorize flow
  // then exchange the code for the access token and continue the user callback flow
  @Get("/plane-oauth/callback")
  async OAuthCallback(req: Request, res: Response) {
    const { code: oauthCode, state: encodedGithubState } = req.query;

    // Check if the request is valid, with the data received
    if (!oauthCode || !encodedGithubState) {
      return res.status(400).send("Invalid request callback");
    }

    // continue the user callback flow for github
    const githubState: GithubPlaneOAuthState = JSON.parse(
      Buffer.from(encodedGithubState as string, "base64").toString()
    );

    const { github_code, encoded_github_state } = githubState;

    const authState: GithubUserAuthState = JSON.parse(Buffer.from(encoded_github_state as string, "base64").toString());
    let redirectUri = `${env.APP_BASE_URL}/${authState.workspace_slug}/settings/integrations/github/`;

    if (authState.profile_redirect) {
      redirectUri = `${env.APP_BASE_URL}/${authState.workspace_slug}/settings/account/connections/?workspaceId=${authState.workspace_id}`;
    }

    try {
      const { response, state } = await githubAuthService.getUserAccessToken({
        code: github_code as string,
        state: authState,
      });

      const connections = await apiClient.workspaceConnection.listWorkspaceConnections({
        connection_type: E_INTEGRATION_KEYS.GITHUB,
        workspace_id: authState.workspace_id,
      });

      if (connections.length === 0) {
        return res.status(400).send(`${redirectUri}?error=${E_SILO_ERROR_CODES.CONNECTION_NOT_FOUND}`);
      }

      if (connections.length > 1) {
        return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.MULTIPLE_CONNECTIONS_FOUND}`);
      }

      const connection = connections[0] as TWorkspaceConnection<{ userMap: GithubUserMap }>;

      if (!connection.id) {
        return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.CONNECTION_NOT_FOUND}`);
      }

      const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
        source: E_INTEGRATION_KEYS.GITHUB,
        workspace_id: authState.workspace_id,
      });
      if (credentials.length === 0) {
        return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.CONNECTION_NOT_FOUND}`);
      }

      const credential = credentials[0];
      if (!credential.source_access_token || !credential.target_access_token || !credential.target_identifier) {
        return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.INSTALLATION_NOT_FOUND}`);
      }

      // Extract the parameters from the response
      const accessToken = parseAccessToken(response);
      const githubService = createGithubUserService(accessToken);
      const user = await githubService.getUser();

      if (!user) {
        return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.USER_NOT_FOUND}`);
      }

      const planeClient = await getPlaneAPIClient(credential, E_INTEGRATION_KEYS.GITHUB);

      const users: PlaneUser[] = await planeClient.users.listAllUsers(authState.workspace_slug);
      const planeUser = users.find((user) => user.id === authState.user_id);

      // get the token from plane oauth service
      const { planeAppClientId, planeAppClientSecret } = await getPlaneAppDetails(E_INTEGRATION_KEYS.GITHUB);
      if (!planeAppClientId || !planeAppClientSecret) {
        return res.status(400).send("Invalid app credentials");
      }
      // generate the token for the user
      const tokenResponse = await planeOAuthService.generateToken({
        client_id: planeAppClientId,
        client_secret: planeAppClientSecret,
        grant_type: EOAuthGrantType.AUTHORIZATION_CODE,
        code: oauthCode as string,
        redirect_uri: `${env.SILO_API_BASE_URL}${env.SILO_BASE_PATH}/api/github/plane-oauth/callback`,
        app_installation_id: credential.target_identifier,
        user_id: authState.user_id,
      });

      await integrationConnectionHelper.createOrUpdateWorkspaceCredential({
        workspace_id: state.workspace_id,
        user_id: state.user_id,
        source: E_ENTITY_CONNECTION_KEYS.GITHUB_USER,
        source_identifier: user.id.toString(),
        source_authorization_type: ESourceAuthorizationType.TOKEN,
        source_access_token: accessToken,
        source_refresh_token: "",
        target_access_token: tokenResponse.access_token,
        target_refresh_token: tokenResponse.refresh_token,
        target_authorization_type: EOAuthGrantType.AUTHORIZATION_CODE,
        target_identifier: credential.target_identifier,
        source_hostname: "",
      });

      // update the workspace connection for the user
      if (planeUser) {
        await apiClient.workspaceConnection.updateWorkspaceConnection(connection.id, {
          config: {
            userMap: [...connection.config.userMap, { githubUser: user, planeUser: planeUser }],
          },
        });
      }

      return res.redirect(redirectUri);
    } catch (error) {
      logger.error("Failed to create GitHub connection:", error);
      return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.GENERIC_ERROR}`);
    }
  }

  @Get("/auth/user/callback")
  async authUserCallback(req: Request, res: Response) {
    const { code, state: queryState } = req.query;
    // Check if the request is valid, with the data received
    if (!code || !queryState) {
      return res.status(400).send("Invalid request callback");
    }

    const authState: GithubUserAuthState = JSON.parse(Buffer.from(queryState as string, "base64").toString());
    let redirectUri = `${env.APP_BASE_URL}/${authState.workspace_slug}/settings/integrations/github/`;

    try {
      if (authState.profile_redirect) {
        redirectUri = `${env.APP_BASE_URL}/${authState.workspace_slug}/settings/account/connections/?workspaceId=${authState.workspace_id}`;
      }

      const githubState: GithubPlaneOAuthState = {
        github_code: code as string,
        encoded_github_state: queryState as string,
      };

      const { planeAppClientId, planeAppClientSecret } = await getPlaneAppDetails(E_INTEGRATION_KEYS.GITHUB);
      if (!planeAppClientId || !planeAppClientSecret) {
        return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.INVALID_APP_CREDENTIALS}`);
      }

      const siloAppOAuthCallbackURL = `${env.SILO_API_BASE_URL}${env.SILO_BASE_PATH}/api/github/plane-oauth/callback`;
      const authorizationURL = planeOAuthService.getPlaneOAuthRedirectUrl(
        planeAppClientId,
        siloAppOAuthCallbackURL,
        Buffer.from(JSON.stringify(githubState)).toString("base64")
      );

      return res.redirect(authorizationURL);
    } catch (error) {
      logger.error("Failed to create GitHub connection:", error);
      return res.redirect(`${redirectUri}?error=${E_SILO_ERROR_CODES.GENERIC_ERROR}`);
    }
  }
  /* -------------------- Auth Endpoints -------------------- */

  /* -------------------- Data Endpoints -------------------- */
  @Get("/:workspaceId/installations")
  @useValidateUserAuthentication()
  async getInstallations(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;

      if (!workspaceId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId to be present.",
        });
      }

      // Get the credentials for the workspace id, where the source is GITHUB
      const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
        source: E_INTEGRATION_KEYS.GITHUB,
        workspace_id: workspaceId,
      });

      // If there are no credentials, this simply means that there is nothing
      // installed for the workspace, so we return an empty array
      if (!credentials || credentials.length === 0) {
        return res.status(200).send([]);
      }

      const githubCredentials = credentials[0];

      if (!githubCredentials.source_access_token) {
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
      return responseHandler(res, 500, error);
    }
  }

  @Get("/:workspaceId/repos")
  @useValidateUserAuthentication()
  async getWorkspaceAccessibleRepositories(req: Request, res: Response) {
    try {
      const { workspaceId } = req.params;

      if (!workspaceId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId to be present.",
        });
      }

      // Get the credentials for the workspace id, where the source is GITHUB

      const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
        source: E_INTEGRATION_KEYS.GITHUB,
        workspace_id: workspaceId,
      });

      // If there are no credentials, this simply means that there is nothing
      // installed for the workspace, so we return an empty array
      if (!credentials || credentials.length === 0) {
        return res.status(200).send([]);
      }

      const githubCredentials = credentials[0];

      if (!githubCredentials.source_access_token) {
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
          githubCredentials.source_access_token!
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
      return responseHandler(res, 500, error);
    }
  }

  @Get("/plane-app-details")
  async getPlaneAppDetails(req: Request, res: Response) {
    try {
      const { planeAppId, planeAppClientId } = await getPlaneAppDetails(E_INTEGRATION_KEYS.GITHUB);
      res.status(200).json({
        appId: planeAppId,
        clientId: planeAppClientId,
      });
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }
  /* -------------------- Data Endpoints -------------------- */

  /* ------------------- Webhook Endpoints ------------------- */
  @Post("/github-webhook")
  @Middleware(verifyGithubWebhook as RequestHandler)
  async githubWebhook(req: Request, res: Response) {
    try {
      // Get the event types and the delivery id
      const eventType = req.headers["x-github-event"];
      const deliveryId = req.headers["x-github-delivery"];

      const payload = req.body as GithubWebhookPayload;
      logGithubWebhookPayload(payload, eventType, deliveryId);

      if (!payload?.installation?.id) {
        return res.status(400).send({
          message: "Installation ID is required to process the webhook",
        });
      }

      if (eventType === "issues") {
        const issuePayload = req.body as GithubWebhookPayload["webhook-issues-opened"];

        // Discard the issue, if the labels doens't include github label
        if (!issuePayload.issue?.labels?.find((label) => label.name.toLowerCase() === "plane")) {
          return res.status(202).send({
            message: "Webhook received",
          });
        }
        await integrationTaskManager.registerStoreTask(
          {
            route: "github-webhook",
            jobId: eventType as string,
            type: eventType as string,
          },
          {
            installationId: issuePayload.installation?.id,
            owner: issuePayload.repository.owner.login,
            accountId: issuePayload.organization ? issuePayload.organization.id : issuePayload.repository.owner.id,
            repositoryId: issuePayload.repository.id,
            repositoryName: issuePayload.repository.name,
            issueNumber: issuePayload.issue.number,
          },
          Number(env.DEDUP_INTERVAL)
        );
        // Forward the event to the task manager to process
      } else if (eventType === "pull_request") {
        const pullRequestPayload = req.body as GithubWebhookPayload["webhook-pull-request-opened"];
        await integrationTaskManager.registerStoreTask(
          {
            route: "github-webhook",
            jobId: eventType as string,
            type: eventType as string,
          },
          {
            installationId: pullRequestPayload.installation?.id,
            owner: pullRequestPayload.repository.owner.login,
            accountId: pullRequestPayload.organization
              ? pullRequestPayload.organization.id
              : pullRequestPayload.repository.owner.id,
            repositoryId: pullRequestPayload.repository.id,
            repositoryName: pullRequestPayload.repository.name,
            pullRequestNumber: pullRequestPayload.pull_request.number,
          },
          Number(env.DEDUP_INTERVAL)
        );
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

      return res.status(202).send({
        message: "Webhook received",
      });
    } catch (error) {
      logger.error("Failed to process GitHub webhook:", error);
      responseHandler(res, 500, error);
    }
  }

  @Post("/plane-webhook")
  async planeWebhook(req: Request, res: Response) {
    try {
      // Get the event types and delivery id
      const eventType = req.headers["x-plane-event"];
      const event = req.body.event;

      if (event == "issue" || event == "issue_comment") {
        const payload = req.body as PlaneWebhookPayloadBase<ExIssue | ExIssueComment>;

        const id = payload.data.id;
        const workspace = payload.data.workspace;
        const project = payload.data.project;
        const issue = payload.data.issue;

        const log = {
          eventType,
          event,
          id,
          workspace,
          project,
        };

        logger.info("Plane webhook received", log);

        if (event == "issue") {
          const labels = req.body.data.labels as ExIssueLabel[] | undefined;
          // If labels doesn't include github label, then we don't need to process this event
          if (
            !labels ||
            !labels.find((label) => label.name.toLowerCase() === E_INTEGRATION_KEYS.GITHUB.toLowerCase())
          ) {
            return res.status(202).send({
              message: "Webhook received",
            });
          }

          // Reject the activity, that is not useful
          const skipFields = ["priority", "state", "start_date", "target_date", "cycles", "parent", "modules", "link"];
          if (payload.activity.field && skipFields.includes(payload.activity.field)) {
            return res.status(202).send({
              message: "Webhook received",
            });
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
      return res.status(202).send({
        message: "Webhook received",
      });
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  /* ------------------- Webhook Endpoints ------------------- */
}

export const logGithubWebhookPayload = (
  payload: any,
  eventType: string | string[] | undefined,
  deliveryId: string | string[] | undefined
): void => {
  const log = {
    eventType,
    deliveryId,
    installationId: payload?.installation?.id,
    owner: payload?.repository?.owner?.login,
    repositoryId: payload?.repository?.id,
    repositoryName: payload?.repository?.name,
  };

  logger.info(`Github Webhook Payload`, {
    log,
  });
};

function verifyGithubWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    // If the webhook secret is not set, we don't need to verify the signature
    if (!env.GITHUB_WEBHOOK_SECRET) {
      return next();
    }

    const signature = req.headers["x-hub-signature-256"];
    const event = req.headers["x-github-event"];
    const id = req.headers["x-github-delivery"];

    const payload = JSON.stringify(req.body);

    // Make sure all required headers are present
    if (!signature || !event || !id) {
      logGithubWebhookPayload(req.body, event, id);
      return res.status(401).json({
        error: "Missing required headers",
      });
    }

    // Get the raw body of the request
    if (!payload) {
      logGithubWebhookPayload(req.body, event, id);
      return res.status(400).json({
        error: "Request body empty",
      });
    }

    // Calculate expected signature
    const hmac = crypto.createHmac("sha256", env.GITHUB_WEBHOOK_SECRET ?? "");
    const calculatedSignature = "sha256=" + hmac.update(payload).digest("hex");

    // Constant time comparison to prevent timing attacks
    const verified = crypto.timingSafeEqual(Buffer.from(calculatedSignature), Buffer.from(signature as string));

    if (!verified) {
      logGithubWebhookPayload(req.body, event, id);
      return res.status(401).json({
        error: "Invalid signature",
      });
    }

    // Signature is valid, proceed
    next();
  } catch (error) {
    logger.error("Error validating GitHub webhook:", error);
    return res.status(500).json({
      error: "Error validating webhook signature",
    });
  }
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
