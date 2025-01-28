import { env } from "@/env";
import { NextFunction, Request, Response } from "express";
import { APIError, Controller, Get, Post } from "@/lib";
// silo asana
import {
  AsanaTokenResponse,
  createAsanaService,
  AsanaAuthPayload,
  AsanaAuthState,
  AsanaCustomField,
  PaginationPayload,
  AsanaCustomFieldSettings,
  PaginatedResponse,
  pullUsers,
} from "@plane/etl/asana";
// silo db
import { createOrUpdateCredentials, deactivateCredentials, getCredentialsByWorkspaceId } from "@/db/query";
// silo asana auth
import { asanaAuth } from "../auth/auth";
import { createPlaneClient } from "@/helpers/utils";
import { compareAndGetAdditionalUsers } from "@/helpers/additional-users";
import { responseHandler } from "@/helpers/response-handler";

@Controller("/api/asana")
class AsanaController {
  @Get("/ping")
  async ping(_req: Request, res: Response) {
    res.send("pong");
  }

  @Post("/auth/url")
  async getAuthURL(req: Request, res: Response) {
    try {
      const body: AsanaAuthState = req.body;
      if (!body.workspaceId || !body.apiToken) {
        throw new APIError("Bad Request, expected both apiToken and workspaceId to be present.", 400);
      }
      const response = asanaAuth.getAuthorizationURL(body);
      res.send(response);
    } catch (error) {
      responseHandler(res, 500, error)
    }
  }

  @Get("/auth/callback")
  async authCallback(req: Request, res: Response) {
    try {
      const query: AsanaAuthPayload | any = req.query;
      if (!query.code || !query.state) {
        return res.status(400).send("code not found in the query params");
      }
      const stringifiedJsonState = query.state as string;
      // Decode the base64 encoded state string and parse it to JSON
      const state: AsanaAuthState = JSON.parse(Buffer.from(stringifiedJsonState, "base64").toString());
      let tokenResponse: AsanaTokenResponse;
      try {
        const tokenInfo = await asanaAuth.getAccessToken(query.code as string, state);
        tokenResponse = tokenInfo.tokenResponse;
      } catch (error: any) {
        console.log("Error occurred while fetching token details", error);
        res.status(400).send(error);
        return;
      }

      if (!tokenResponse) {
        res.status(400).send("failed to fetch token details");
        return;
      }

      try {
        // Create a new credentials record in the database for the received token
        await createOrUpdateCredentials(state.workspaceId, state.userId, {
          source_access_token: tokenResponse.access_token,
          source_refresh_token: tokenResponse.refresh_token,
          target_access_token: state.apiToken,
          source: "ASANA",
          workspace_id: state.workspaceId,
        });
        // As we are using base path as /asana, we can redirect to /asana
        res.redirect(`${env.APP_BASE_URL}/${state.workspaceSlug}/settings/imports/asana/`);
      } catch (error: any) {
        res.status(500).send(error);
      }
    } catch (error) {
      responseHandler(res, 500, error)
    }
  }

  @Post("/auth/refresh")
  async refreshAccessToken(req: Request, res: Response) {
    try {
      const { refreshToken, workspaceId, userId } = req.body;
      if (!refreshToken || !workspaceId) {
        return res.status(400).send({ message: "Bad Request" });
      }
      try {
        const { access_token, refresh_token, expires_in } = await asanaAuth.getRefreshToken(refreshToken);
        // Update the credentials record in the database with the new token
        await createOrUpdateCredentials(workspaceId, userId, {
          source_access_token: access_token,
          source_refresh_token: refresh_token,
          source: "ASANA",
          workspace_id: workspaceId,
        });
        // send the new tokens in the response
        res
          .cookie("accessToken", access_token)
          .cookie("refreshToken", refresh_token)
          .send({ access_token, refresh_token, expires_in });
      } catch (error: any) {
        res.status(error.response.status).send(error);
      }
    } catch (error) {
      responseHandler(res, 500, error)
    }
  }

  @Post("/auth/pat")
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
      await createOrUpdateCredentials(workspaceId, userId, {
        source_access_token: personalAccessToken,
        target_access_token: apiToken,
        source: "ASANA",
        workspace_id: workspaceId,
        isPAT: true,
      });
      res.status(200).json({ message: "Authentication successful" });
    } catch (error: any) {
      responseHandler(res, 500, error)
    }
  }

  @Get("/workspaces")
  async getWorkspaces(req: Request, res: Response) {
    try {
      const { workspaceId, userId } = req.query;
      if (!workspaceId || !userId) {
        return res.status(400).send({ message: "Bad Request" });
      }
      const asanaServiceInstance = await asanaService(workspaceId?.toString(), userId?.toString());
      const workspaces = await asanaServiceInstance.getWorkspaces();
      res.send(workspaces.data);
    } catch (error: any) {
      responseHandler(res, 500, error)
    }
  }

  @Get("/projects")
  async getProjects(req: Request, res: Response) {
    try {
      const { workspaceId, userId, workspaceGid } = req.query;
      if (!workspaceId || !userId || !workspaceGid) {
        return res.status(400).send({ message: "Bad Request" });
      }
      const asanaServiceInstance = await asanaService(workspaceId?.toString(), userId?.toString());
      const projects = await asanaServiceInstance.getWorkspaceProjects(workspaceGid?.toString());
      res.send(projects.data);
    } catch (error: any) {
      responseHandler(res, 500, error)
    }
  }

  @Get("/sections")
  async getProjectSections(req: Request, res: Response) {
    try {
      const { workspaceId, userId, projectGid } = req.query;
      if (!workspaceId || !userId || !projectGid) {
        return res.status(400).send({ message: "Bad Request" });
      }
      const asanaServiceInstance = await asanaService(workspaceId?.toString(), userId?.toString());
      const sections = await asanaServiceInstance.getProjectSections(projectGid?.toString());
      res.send(sections.data);
    } catch (error: any) {
      responseHandler(res, 500, error)
    }
  }

  // Get all enum custom fields that can be used as priorities
  @Get("/priorities")
  async getProjectPriorities(req: Request, res: Response) {
    try {
      const { workspaceId, userId, projectGid } = req.query;
      if (!workspaceId || !userId || !projectGid) {
        return res.status(400).send({ message: "Bad Request" });
      }
      const asanaServiceInstance = await asanaService(workspaceId?.toString(), userId?.toString());
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
      responseHandler(res, 500, error)
    }
  }

  @Get("/project-task-count")
  async getProjectTaskCount(req: Request, res: Response) {
    try {
      const { workspaceId, userId, projectGid } = req.query;
      if (!workspaceId || !userId || !projectGid) {
        return res.status(400).send({ message: "Bad Request" });
      }
      const asanaServiceInstance = await asanaService(workspaceId?.toString(), userId?.toString());
      const taskCount = await asanaServiceInstance.getProjectTaskCount(projectGid?.toString());
      res.send(taskCount.data);
    } catch (error: any) {
      responseHandler(res, 500, error)
    }
  }

  @Get("/additional-users/:workspaceId/:workspaceSlug/:userId/:workspaceGid")
  async getUserDifferential(req: Request, res: Response) {
    try {
      const { workspaceId, workspaceSlug, userId, workspaceGid } = req.params;
      const [planeClient, asanaClient] = await Promise.all([
        createPlaneClient(workspaceId, userId, "ASANA"),
        asanaService(workspaceId, userId),
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
      responseHandler(res, 500, error)
    }
  }
}

const asanaService = async (workspaceId: string, userId: string) => {
  try {
    const credentials = await getCredentialsByWorkspaceId(workspaceId, userId, "ASANA");
    if (!credentials || credentials.length <= 0) {
      throw new Error("No asana credentials available for the given workspaceId and userId");
    }
    // Get the credentials data
    const credentialsData = credentials[0];
    // Check if refresh token is required
    const isRefreshAllowed = !credentialsData.isPAT && credentialsData.source_refresh_token;
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
      await createOrUpdateCredentials(workspaceId, userId, {
        source_access_token: access_token,
        source_refresh_token: refresh_token,
        source: "ASANA",
      });
    };

    const refreshTokenRejectCallback = async () => {
      await deactivateCredentials(workspaceId, userId, "ASANA");
    };

    return createAsanaService({
      accessToken: credentialsData.source_access_token,
      refreshToken: credentialsData.source_refresh_token,
      refreshTokenFunc: isRefreshAllowed ? asanaAuth.getRefreshToken.bind(asanaAuth) : undefined,
      refreshTokenCallback: isRefreshAllowed ? refreshTokenCallback : undefined,
      refreshTokenRejectCallback: refreshTokenRejectCallback,
    });
  } catch (error) {
    throw error;
  }
};

export default AsanaController;
