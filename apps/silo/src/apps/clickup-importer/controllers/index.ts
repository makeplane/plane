import { Request, Response } from "express";
import { Controller, Get, Post } from "@plane/decorators";
import { createClickUpService } from "@plane/etl/clickup";
import { E_IMPORTER_KEYS } from "@plane/etl/core";
import { logger } from "@plane/logger";
import { compareAndGetAdditionalUsers } from "@/helpers/additional-users";
import { integrationConnectionHelper } from "@/helpers/integration-connection-helper";
import { getPlaneAPIClient } from "@/helpers/plane-api-client";
import { getPlaneAppDetails } from "@/helpers/plane-app-details";
import { responseHandler } from "@/helpers/response-handler";
import { useValidateUserAuthentication } from "@/lib/decorators";
import { planeOAuthService } from "@/services/oauth";
import { EOAuthGrantType, ESourceAuthorizationType } from "@/types/oauth";

@Controller("/api/clickup")
class ClickupController {
  @Get("/ping")
  async ping(_req: Request, res: Response) {
    res.send("pong");
  }

  @Post("/auth/pat")
  @useValidateUserAuthentication()
  async upsertCredentials(req: Request, res: Response) {
    try {
      const { workspaceId, userId, personalAccessToken, appInstallationId } = req.body;
      if (!workspaceId || !userId || !personalAccessToken || !appInstallationId) {
        res
          .status(400)
          .json({ message: "Workspace ID, User ID, Personal Access Token and App Installation ID are required" });
      }

      // Verify the credentials for validity
      try {
        const clickupService = createClickUpService(personalAccessToken);
        await clickupService.getTeams();
      } catch {
        return res.status(401).send({ message: "Invalid personal access token" });
      }

      // get the app oauth token
      const { planeAppClientId, planeAppClientSecret } = await getPlaneAppDetails(E_IMPORTER_KEYS.IMPORTER);

      // get the app oauth token
      const { access_token: appOauthToken } = await planeOAuthService.generateToken({
        client_id: planeAppClientId,
        client_secret: planeAppClientSecret,
        grant_type: EOAuthGrantType.CLIENT_CREDENTIALS,
        app_installation_id: appInstallationId,
      });

      const credential = await integrationConnectionHelper.createOrUpdateWorkspaceCredential({
        workspace_id: workspaceId,
        user_id: userId,
        source: E_IMPORTER_KEYS.CLICKUP,
        source_access_token: personalAccessToken,
        source_authorization_type: ESourceAuthorizationType.TOKEN,
        target_access_token: appOauthToken,
        target_identifier: appInstallationId,
        target_authorization_type: EOAuthGrantType.CLIENT_CREDENTIALS,
        is_pat: true,
        source_refresh_token: "",
        source_hostname: "",
      });
      return res.status(200).json(credential);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  /**
   * @description fetching clickup teams
   */
  @Get("/team")
  @useValidateUserAuthentication()
  async getTeams(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.query;
      if (!workspaceId || !userId) {
        return res.status(400).send({
          message: "Bad Request, expected both workspaceId and userId to be present.",
        });
      }
      const clickupServiceInstance = await createClickUpClient(workspaceId as string, userId as string);
      const teams = await clickupServiceInstance.getTeams();
      res.send(teams);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  /**
   * @description fetching clickup spaces
   */
  @Get("/space")
  @useValidateUserAuthentication()
  async getSpaces(req: Request, res: Response) {
    try {
      const { workspaceId, userId, teamId } = req.query;
      if (!workspaceId || !userId || !teamId) {
        return res.status(400).send({
          message: "Bad Request, expected both workspaceId, userId and teamId to be present.",
        });
      }
      const clickupServiceInstance = await createClickUpClient(workspaceId as string, userId as string);
      const spaces = await clickupServiceInstance.getSpaces(teamId as string);
      res.send(spaces);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  /**
   * @description fetching clickup folders
   */
  @Get("/folder")
  @useValidateUserAuthentication()
  async getFolders(req: Request, res: Response) {
    try {
      const { workspaceId, userId, spaceId } = req.query;
      if (!workspaceId || !userId || !spaceId) {
        return res.status(400).send({
          message: "Bad Request, expected both workspaceId, userId and spaceId to be present.",
        });
      }
      const clickupServiceInstance = await createClickUpClient(workspaceId as string, userId as string);
      const folders = await clickupServiceInstance.getFolders(spaceId as string);
      res.send(folders);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  /**
   * @description fetching clickup folder task count
   */
  @Get("/folder/:folderId/task-count")
  @useValidateUserAuthentication()
  async getFolderTaskCount(req: Request, res: Response) {
    try {
      const { folderId } = req.params;
      const { workspaceId, userId } = req.query;
      if (!workspaceId || !userId || !folderId) {
        return res.status(400).send({
          message: "Bad Request, expected workspaceId, userId and folderId to be present.",
        });
      }
      const clickupServiceInstance = await createClickUpClient(workspaceId as string, userId as string);
      const folder = await clickupServiceInstance.getFolder(folderId);
      res.json({ taskCount: folder.task_count });
    } catch (error: any) {
      logger.error(error);
      responseHandler(res, 500, error);
    }
  }

  /**
   * @description fetching clickup additional users
   */
  @Get("/additional-users/:workspaceId/:workspaceSlug/:userId/:teamId")
  @useValidateUserAuthentication()
  async getUserDifferential(req: Request, res: Response) {
    const { workspaceId, workspaceSlug, userId, teamId } = req.params;
    try {
      const [credential] = await integrationConnectionHelper.getWorkspaceCredentials({
        workspace_id: workspaceId,
        source: E_IMPORTER_KEYS.CLICKUP,
        user_id: userId,
      });

      if (!credential) {
        throw new Error("No credentials found for the workspace");
      }

      const planeClient = await getPlaneAPIClient(credential, E_IMPORTER_KEYS.IMPORTER);

      if (!credential.source_access_token) {
        throw new Error("No source access token found");
      }

      const clickupService = createClickUpService(credential.source_access_token);

      const workspaceMembers = await planeClient.users.listAllUsers(workspaceSlug);
      const clickupUsers = await clickupService.getTeamMembers(teamId);

      const billableMembers = workspaceMembers.filter((member) => member.role > 10);
      const additionalUsers = compareAndGetAdditionalUsers(
        billableMembers,
        clickupUsers.map((user) => user.email)
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

export const createClickUpClient = async (workspaceId: string, userId: string) => {
  if (!workspaceId || !userId) {
    throw new Error("workspaceId and userId are required");
  }

  const [credential] = await integrationConnectionHelper.getWorkspaceCredentials({
    workspace_id: workspaceId,
    source: E_IMPORTER_KEYS.CLICKUP,
    user_id: userId,
  });
  if (!credential) {
    throw new Error("No credentials found for the workspace");
  }

  if (!credential.source_access_token) {
    throw new Error("No target access token found");
  }
  return createClickUpService(credential.source_access_token);
};

export default ClickupController;
