import { env } from "@/env";
import { Controller, Get, Post } from "@/lib";
import { Request, Response } from "express";
import { LinearTokenResponse, createLinearService, LinearAuthPayload, LinearAuthState } from "@silo/linear";
import { createOrUpdateCredentials, getCredentialsByWorkspaceId } from "@/db/query";
import { linearAuth } from "../auth/auth";
import { TServiceCredentials } from "@silo/core";

@Controller("/api/linear")
class LinearController {
  @Get("/ping")
  async ping(_req: Request, res: Response) {
    res.send("pong");
  }

  @Post("/auth/url")
  async getAuthURL(req: Request, res: Response) {
    if (env.LINEAR_OAUTH_ENABLED === "0") {
      return res.status(400).send({
        message: "Bad Request, OAuth is not enabled for Linear.",
      });
    }

    const body: LinearAuthState = req.body;
    if (!body.workspaceId || !body.apiToken) {
      return res.status(400).send({
        message: "Bad Request, expected both apiToken and workspaceId to be present.",
      });
    }
    const hostname = env.SILO_API_BASE_URL;
    const response = linearAuth.getAuthorizationURL(body, hostname);
    res.send(response);
  }

  @Get("/auth/callback")
  async authCallback(req: Request, res: Response) {
    if (env.LINEAR_OAUTH_ENABLED === "0") {
      return res.status(400).send({
        message: "Invalid Callback, OAuth is not enabled for Linear.",
      });
    }
    const query: LinearAuthPayload | any = req.query;
    if (!query.code || !query.state) {
      return res.status(400).send("code not found in the query params");
    }
    const stringifiedJsonState = query.state as string;
    // Decode the base64 encoded state string and parse it to JSON
    const state: LinearAuthState = JSON.parse(Buffer.from(stringifiedJsonState, "base64").toString());
    let tokenResponse: LinearTokenResponse;
    try {
      const hostname = env.SILO_API_BASE_URL;
      const tokenInfo = await linearAuth.getAccessToken(query.code as string, state, hostname);
      tokenResponse = tokenInfo.tokenResponse;
    } catch (error: any) {
      console.log("Error occured while fetching token details", error.response.data);
      res.status(400).send(error.response.data);
      return;
    }

    if (!tokenResponse) {
      res.status(400).send("failed to fetch token details");
      return;
    }

    try {
      // Create a new credentials record in the database for the recieved token
      await createOrUpdateCredentials(state.workspaceId, state.userId, {
        source_access_token: tokenResponse.access_token,
        source_refresh_token: tokenResponse.refresh_token,
        target_access_token: state.apiToken,
        source: "LINEAR",
        workspace_id: state.workspaceId,
      });
      // As we are using base path as /linear, we can redirect to /linear
      res.redirect(`${env.APP_BASE_URL}/${state.workspaceSlug}/settings/imports/linear/`);
    } catch (error: any) {
      res.status(500).send(error.response.data);
    }
  }

  @Post("/auth/pat")
  async upsertCredentials(req: Request, res: Response) {
    try {
      const { workspaceId, userId, apiToken, personalAccessToken } = req.body;
      if (!workspaceId || !userId || !apiToken || !personalAccessToken) {
        res.status(400).json({ message: "Workspace ID, User ID, API Token and Personal Access Token are required" });
      }

      const payload = req.body as TServiceCredentials;

      // Verify the credentials for validity
      try {
        const linearService = createLinearService({ isPAT: true, apiKey: personalAccessToken });
        await linearService.organization();
      } catch {
        return res.status(401).send({ message: "Invalid personal access token" });
      }

      // Create or update the credentials
      const credential = await createOrUpdateCredentials(workspaceId, userId, {
        source_access_token: personalAccessToken,
        target_access_token: apiToken,
        source: "LINEAR",
        workspace_id: workspaceId,
        isPAT: true,
      });
      return res.status(200).json(credential);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  @Get("/org")
  async getOrganization(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.query;
      if (!workspaceId || !userId) {
        return res.status(400).send({
          message: "Bad Request, expected both workspaceId and userId to be present.",
        });
      }
      const linearServiceInstance = await linearService(workspaceId as string, userId as string);
      const org = await linearServiceInstance.organization();
      res.send(org);
    } catch (error: any) {
      res.status(500).send(error?.response?.data);
    }
  }

  /**
   * @description fetching linear teams
   */
  @Post("/teams")
  async getTeams(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.body;
      if (!workspaceId || !userId) {
        return res.status(400).send({
          message: "Bad Request, expected both workspaceId and userId to be present.",
        });
      }
      const linearServiceInstance = await linearService(workspaceId, userId);
      const teams = await linearServiceInstance.getTeamsWithoutPagination();
      res.send(teams);
    } catch (error: any) {
      res.status(500).send(error?.response?.data);
    }
  }

  /**
   * @description fetching linear team states
   */
  @Post("/team-states")
  async getTeamStates(req: Request, res: Response) {
    try {
      const { workspaceId, userId, teamId } = req.body;
      if (!workspaceId || !userId || !teamId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, userId, and teamId to be present.",
        });
      }
      const linearServiceInstance = await linearService(workspaceId, userId);
      const teams = await linearServiceInstance.getTeamStatusesWithoutPagination(teamId);
      res.send(teams);
    } catch (error: any) {
      res.status(500).send(error.response.data);
    }
  }

  /**
   * @description fetching linear team issues count
   */
  @Post("/team-issue-count")
  async getTeamIssuesCount(req: Request, res: Response) {
    try {
      const { workspaceId, userId, teamId } = req.body;
      if (!workspaceId || !userId || !teamId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, userId, and teamId to be present.",
        });
      }
      const linearServiceInstance = await linearService(workspaceId, userId);
      const teams = await linearServiceInstance.getNumberOfIssues(teamId);
      res.json(teams);
    } catch (error: any) {
      console.log(error);
      res.sendStatus(500).send(error);
    }
  }
}

const linearService = async (workspaceId: string, userId: string) => {
  if (!workspaceId || !userId) {
    throw new Error("workspaceId and userId are required");
  }

  const credentials = await getCredentialsByWorkspaceId(workspaceId, userId, "LINEAR");
  if (!credentials || credentials.length <= 0) {
    throw new Error("No credentials found for the workspace");
  }

  const credentialsData = credentials[0];

  if (!credentialsData.source_access_token) {
    throw new Error("No target access token found");
  }

  if (env.LINEAR_OAUTH_ENABLED === "1") {
    return createLinearService({ isPAT: false, accessToken: credentialsData.source_access_token });
  } else {
    return createLinearService({ isPAT: true, apiKey: credentialsData.source_access_token });
  }
};

export default LinearController;
