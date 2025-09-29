import { Request, Response } from "express";
import { Controller, Get, Post } from "@plane/decorators";
import { E_IMPORTER_KEYS } from "@plane/etl/core";
import { createLinearService } from "@plane/etl/linear";
import { logger } from "@plane/logger";
import { env } from "@/env";
import { compareAndGetAdditionalUsers } from "@/helpers/additional-users";
import { createOrUpdateCredentials, getCredentialsByWorkspaceId } from "@/helpers/credential";
import { responseHandler } from "@/helpers/response-handler";
import { createPlaneClient } from "@/helpers/utils";
import { useValidateUserAuthentication } from "@/lib/decorators";

@Controller("/api/linear")
class LinearController {
  @Get("/ping")
  async ping(_req: Request, res: Response) {
    res.send("pong");
  }

  @Post("/auth/pat")
  async upsertCredentials(req: Request, res: Response) {
    try {
      const { workspaceId, userId, apiToken, personalAccessToken } = req.body;
      if (!workspaceId || !userId || !apiToken || !personalAccessToken) {
        res.status(400).json({ message: "Workspace ID, User ID, API Token and Personal Access Token are required" });
      }

      // Verify the credentials for validity
      try {
        const linearService = createLinearService({ isPAT: true, apiKey: personalAccessToken });
        await linearService.organization();
      } catch {
        return res.status(401).send({ message: "Invalid personal access token" });
      }

      // Create or update the credentials
      const credential = await createOrUpdateCredentials(workspaceId, userId, E_IMPORTER_KEYS.LINEAR, {
        source_access_token: personalAccessToken,
        target_access_token: apiToken,
        workspace_id: workspaceId,
        is_pat: true,
      });
      return res.status(200).json(credential);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/org")
  @useValidateUserAuthentication()
  async getOrganization(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.query;
      if (!workspaceId || !userId) {
        return res.status(400).send({
          message: "Bad Request, expected both workspaceId and userId to be present.",
        });
      }
      const linearServiceInstance = await createLinearClient(workspaceId as string, userId as string);
      const org = await linearServiceInstance.organization();
      res.send(org);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  /**
   * @description fetching linear teams
   */
  @Post("/teams")
  @useValidateUserAuthentication()
  async getTeams(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.body;
      if (!workspaceId || !userId) {
        return res.status(400).send({
          message: "Bad Request, expected both workspaceId and userId to be present.",
        });
      }
      const linearServiceInstance = await createLinearClient(workspaceId, userId);
      const teams = await linearServiceInstance.getTeamsWithoutPagination();
      res.send(teams);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  /**
   * @description fetching linear team states
   */
  @Post("/team-states")
  @useValidateUserAuthentication()
  async getTeamStates(req: Request, res: Response) {
    try {
      const { workspaceId, userId, teamId } = req.body;
      if (!workspaceId || !userId || !teamId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, userId, and teamId to be present.",
        });
      }
      const linearServiceInstance = await createLinearClient(workspaceId, userId);
      const teams = await linearServiceInstance.getTeamStatusesWithoutPagination(teamId);
      res.send(teams);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  /**
   * @description fetching linear team issues count
   */
  @Post("/data-summary")
  async getDataSummary(req: Request, res: Response) {
    try {
      const { workspaceId, userId, teamId } = req.body;
      if (!workspaceId || !userId || !teamId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, userId, and teamId to be present.",
        });
      }
      const linearServiceInstance = await createLinearClient(workspaceId, userId);
      const summary = await linearServiceInstance.getLinearDataSummary(teamId);
      res.json(summary);
    } catch (error: any) {
      logger.error(error);
      responseHandler(res, 500, error);
    }
  }

  @Get("/additional-users/:workspaceId/:workspaceSlug/:userId/:teamId")
  @useValidateUserAuthentication()
  async getUserDifferential(req: Request, res: Response) {
    const { workspaceId, workspaceSlug, userId, teamId } = req.params;

    try {
      const [planeClient, linearClient] = await Promise.all([
        createPlaneClient(workspaceId, userId, E_IMPORTER_KEYS.LINEAR),
        createLinearClient(workspaceId, userId),
      ]);

      const [workspaceMembers, linearUsers] = await Promise.all([
        planeClient.users.listAllUsers(workspaceSlug),
        linearClient.getTeamMembers(teamId),
      ]);

      const billableMembers = workspaceMembers.filter((member) => member.role > 10);
      const additionalUsers = compareAndGetAdditionalUsers(
        billableMembers,
        linearUsers.nodes.map((user) => user.email)
      );

      return res.json({
        additionalUserCount: additionalUsers.length,
        occupiedUserCount: billableMembers.length,
      });
    } catch (error) {
      if (error instanceof Error) {
        return res.status(401).json({ error: error.message });
      }
      responseHandler(res, 500, error);
    }
  }
}

export const createLinearClient = async (workspaceId: string, userId: string) => {
  if (!workspaceId || !userId) {
    throw new Error("workspaceId and userId are required");
  }

  const credentials = await getCredentialsByWorkspaceId(workspaceId, userId, E_IMPORTER_KEYS.LINEAR);
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
