import { env } from "@/env";
import { Controller, Get, Post } from "@/lib";
import { Request, Response } from "express";
import { LinearTokenResponse, createLinearService } from "@silo/linear";
import { createOrUpdateCredentials, getCredentialsByWorkspaceId } from "@/db/query";
import { LinearAuthPayload, LinearAuthState } from "@silo/linear";
import { linearAuth } from "../auth/auth";

@Controller("/linear")
class LinearController {
  @Get("/ping")
  async ping(_req: Request, res: Response) {
    res.send("pong");
  }

  @Post("/auth/url")
  async getAuthURL(req: Request, res: Response) {
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
      console.log("tokenResponse", tokenResponse);
    } catch (error: any) {
      console.log("Error occured while fetching token details", error.response.data);
      res.status(400).send(error.response.data);
      return;
    }

    if (!tokenResponse) {
      res.status(400).send("failed to fetch token details");
      return;
    }

    // Create a new credentials record in the database for the recieved token
    await createOrUpdateCredentials(state.workspaceId, state.userId, {
      source_access_token: tokenResponse.access_token,
      source_refresh_token: tokenResponse.refresh_token,
      target_access_token: state.apiToken,
      source: "LINEAR",
      workspace_id: state.workspaceId,
    });

    try {
      // As we are using base path as /linear, we can redirect to /linear
      res.redirect(`${env.APP_BASE_URL}/${state.workspaceSlug}/settings/imports/linear/`);
    } catch (error: any) {
      res.status(500).send(error.response.data);
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
      res.status(500).send(error.response.data);
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
      res.send(teams);
    } catch (error: any) {
      res.status(500).send(error.response.data);
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

  return createLinearService({ accessToken: credentialsData.source_access_token });
};

export default LinearController;
