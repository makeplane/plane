import { Request, Response } from "express";
// silo asana
import { Controller, Get, Post } from "@plane/decorators";
import {
  createAsanaService,
  AsanaCustomField,
  PaginationPayload,
  AsanaCustomFieldSettings,
  PaginatedResponse,
  pullUsers,
} from "@plane/etl/asana";
// silo asana auth
import { E_IMPORTER_KEYS } from "@plane/etl/core";
import { compareAndGetAdditionalUsers } from "@/helpers/additional-users";
import { createOrUpdateCredentials, deactivateCredentials, getCredentialsByWorkspaceId } from "@/helpers/credential";
import { responseHandler } from "@/helpers/response-handler";
import { createPlaneClient } from "@/helpers/utils";
import { useValidateUserAuthentication } from "@/lib/decorators";
import { asanaAuth } from "../auth/auth";

@Controller("/api/asana")
class AsanaController {
  @Get("/ping")
  async ping(_req: Request, res: Response) {
    res.send("pong");
  }

  @Post("/auth/pat")
  @useValidateUserAuthentication()
  async upsertCredentials(req: Request, res: Response) {
    try {
      const { workspaceId, userId, apiToken, personalAccessToken } = req.body;
      if (!workspaceId || !userId || !apiToken || !personalAccessToken) {
        res.status(400).json({ message: "Workspace ID, User ID, API Token and Personal Access Token are required" });
      }
      try {
        const asanaService = createAsanaService({
          accessToken: personalAccessToken,
          refreshToken: null,
        });
        await asanaService.getWorkspaces();
      } catch (error: any) {
        return res.status(401).send({ message: "Invalid personal access token" });
      }
      // Create or update the credentials
      await createOrUpdateCredentials(workspaceId, userId, E_IMPORTER_KEYS.ASANA, {
        source_access_token: personalAccessToken,
        target_access_token: apiToken,
        source: E_IMPORTER_KEYS.ASANA,
        workspace_id: workspaceId,
        is_pat: true,
      });
      res.status(200).json({ message: "Authentication successful" });
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/workspaces")
  @useValidateUserAuthentication()
  async getWorkspaces(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.query;
      if (!workspaceId || !userId) {
        return res.status(400).send({ message: "Bad Request" });
      }
      const asanaServiceInstance = await createAsanaClient(workspaceId?.toString(), userId?.toString());
      const workspaces = await asanaServiceInstance.getWorkspaces();
      res.send(workspaces.data);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/projects")
  @useValidateUserAuthentication()
  async getProjects(req: Request, res: Response) {
    try {
      const { workspaceId, userId, workspaceGid } = req.query;
      if (!workspaceId || !userId || !workspaceGid) {
        return res.status(400).send({ message: "Bad Request" });
      }
      const asanaServiceInstance = await createAsanaClient(workspaceId?.toString(), userId?.toString());
      const projects = await asanaServiceInstance.getWorkspaceProjects(workspaceGid?.toString());
      res.send(projects.data);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/sections")
  @useValidateUserAuthentication()
  async getProjectSections(req: Request, res: Response) {
    try {
      const { workspaceId, userId, projectGid } = req.query;
      if (!workspaceId || !userId || !projectGid) {
        return res.status(400).send({ message: "Bad Request" });
      }
      const asanaServiceInstance = await createAsanaClient(workspaceId?.toString(), userId?.toString());
      const sections = await asanaServiceInstance.getProjectSections(projectGid?.toString());
      res.send(sections.data);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  // Get all enum custom fields that can be used as priorities
  @Get("/priorities")
  @useValidateUserAuthentication()
  async getProjectPriorities(req: Request, res: Response) {
    try {
      const { workspaceId, userId, projectGid } = req.query;
      if (!workspaceId || !userId || !projectGid) {
        return res.status(400).send({ message: "Bad Request" });
      }
      const asanaServiceInstance = await createAsanaClient(workspaceId?.toString(), userId?.toString());
      const enumCustomFields: AsanaCustomField[] = [];
      const pagination: PaginationPayload = {
        limit: 100,
        offset: "",
      };
      do {
        const response: PaginatedResponse<AsanaCustomFieldSettings> =
          await asanaServiceInstance.getProjectCustomFieldSettings(projectGid?.toString(), pagination);
        const responseFields = response.data
          .filter(
            (field) =>
              field.custom_field && field.custom_field.type === "enum" && field.custom_field.enum_options?.length
          )
          .map((field) => field.custom_field)
          .filter((field): field is AsanaCustomField => field !== undefined);
        enumCustomFields.push(...responseFields);
        pagination.offset = response._response.next_page?.offset || "";
      } while (pagination.offset);
      res.send(enumCustomFields);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/project-task-count")
  @useValidateUserAuthentication()
  async getProjectTaskCount(req: Request, res: Response) {
    try {
      const { workspaceId, userId, projectGid } = req.query;
      if (!workspaceId || !userId || !projectGid) {
        return res.status(400).send({ message: "Bad Request" });
      }
      const asanaServiceInstance = await createAsanaClient(workspaceId?.toString(), userId?.toString());
      const taskCount = await asanaServiceInstance.getProjectTaskCount(projectGid?.toString());
      res.send(taskCount.data);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/additional-users/:workspaceId/:workspaceSlug/:userId/:workspaceGid")
  @useValidateUserAuthentication()
  async getUserDifferential(req: Request, res: Response) {
    try {
      const { workspaceId, workspaceSlug, userId, workspaceGid } = req.params;
      const [planeClient, asanaClient] = await Promise.all([
        createPlaneClient(workspaceId, userId, E_IMPORTER_KEYS.ASANA),
        createAsanaClient(workspaceId, userId),
      ]);

      const [workspaceMembers, asanaUsers] = await Promise.all([
        planeClient.users.listAllUsers(workspaceSlug),
        pullUsers(asanaClient, workspaceGid),
      ]);

      const billableMembers = workspaceMembers.filter((member) => member.role > 10);
      const additionalUsers = compareAndGetAdditionalUsers(
        billableMembers,
        asanaUsers.map((user) => user.email)
      );

      return res.json({
        asanaUsers,
        billableMembers,
        additionalUserCount: additionalUsers.length,
        occupiedUserCount: billableMembers.length,
      });
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }
}

export const createAsanaClient = async (workspaceId: string, userId: string) => {
  // eslint-disable-next-line no-useless-catch
  try {
    const credentials = await getCredentialsByWorkspaceId(workspaceId, userId, E_IMPORTER_KEYS.ASANA);
    if (!credentials || credentials.length <= 0) {
      throw new Error("No asana credentials available for the given workspaceId and userId");
    }
    // Get the credentials data
    const credentialsData = credentials[0];
    // Check if refresh token is required
    const isRefreshAllowed = !credentialsData.is_pat && credentialsData.source_refresh_token;
    // Check if the credentials are valid
    if (
      !credentialsData.source_access_token ||
      !credentialsData.target_access_token ||
      (isRefreshAllowed && !credentialsData.source_refresh_token)
    ) {
      throw new Error("No asana credentials available for the given workspaceId and userId");
    }

    const refreshTokenCallback = async ({
      access_token,
      refresh_token,
    }: {
      access_token: string;
      refresh_token: string;
    }) => {
      await createOrUpdateCredentials(workspaceId, userId, E_IMPORTER_KEYS.ASANA, {
        source_access_token: access_token,
        source_refresh_token: refresh_token,
        source: E_IMPORTER_KEYS.ASANA,
      });
    };

    const refreshTokenRejectCallback = async () => {
      await deactivateCredentials(workspaceId, userId, E_IMPORTER_KEYS.ASANA);
    };

    return createAsanaService({
      accessToken: credentialsData.source_access_token,
      refreshToken: credentialsData.source_refresh_token ?? "",
      refreshTokenFunc: isRefreshAllowed ? asanaAuth.getRefreshToken.bind(asanaAuth) : undefined,
      refreshTokenCallback: isRefreshAllowed ? refreshTokenCallback : undefined,
      refreshTokenRejectCallback: refreshTokenRejectCallback,
    });
  } catch (error) {
    throw error;
  }
};

export default AsanaController;
