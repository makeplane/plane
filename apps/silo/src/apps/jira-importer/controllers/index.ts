import axios, { AxiosInstance } from "axios";
import { Request, Response } from "express";
import { E_IMPORTER_KEYS } from "@plane/etl/core";
import { createJiraService, fetchPaginatedData, JiraProject, JiraResource, JiraService } from "@plane/etl/jira";
import { TWorkspaceCredential } from "@plane/types";
import { env } from "@/env";
import { compareAndGetAdditionalUsers } from "@/helpers/additional-users";
import { responseHandler } from "@/helpers/response-handler";
import { createPlaneClient } from "@/helpers/utils";
import { Controller, Get, Post, useValidateUserAuthentication } from "@/lib";
import { logger } from "@/logger";
import { getAPIClient } from "@/services/client";
import { jiraAuth } from "../auth/auth";

class JiraApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = "JiraApiError";
  }
}

@Controller("/api/jira")
class JiraController {
  @Get("/ping")
  async ping(_req: Request, res: Response) {
    res.send("pong");
  }

  @Post("/auth/pat")
  @useValidateUserAuthentication()
  async upsertCredentials(req: Request, res: Response) {
    try {
      const { workspaceId, userId, apiToken, personalAccessToken, userEmail, hostname } = req.body;
      if (!workspaceId || !userId || !apiToken || !personalAccessToken) {
        return responseHandler(res, 400, {
          message: "Workspace ID, User ID, API Token and Personal Access Token are required",
        });
      }

      try {
        const jiraService = createJiraService({
          isPAT: true,
          patToken: personalAccessToken,
          userEmail: userEmail,
          hostname: hostname,
        });

        await jiraService.getCurrentUser();
      } catch (error: any) {
        return responseHandler(res, 401, { message: "Invalid personal access token" });
      }

      // Create or update the credentials
      const apiClient = getAPIClient();
      await apiClient.workspaceCredential.createWorkspaceCredential({
        source: E_IMPORTER_KEYS.JIRA,
        source_auth_email: userEmail,
        target_access_token: apiToken,
        source_access_token: personalAccessToken,
        source_hostname: hostname,
        workspace_id: workspaceId,
        user_id: userId,
        is_pat: true,
      });

      return res.status(200).json({ message: "Authentication successfull" });
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/resources")
  @useValidateUserAuthentication()
  async getResources(req: Request, res: Response) {
    try {
      if (env.JIRA_OAUTH_ENABLED === "0") {
        const { workspaceId, userId } = req.body;
        const credentials = await validateAndGetCredentials(workspaceId, userId);
        const jiraHostName = credentials?.source_hostname;
        if (jiraHostName) {
          try {
            const JIRA_CLOUD_INFO_URL = new URL(jiraHostName);
            JIRA_CLOUD_INFO_URL.protocol = "https";
            JIRA_CLOUD_INFO_URL.pathname = `/_edge/tenant_info`;
            const cloudResponse = await axios.get(JIRA_CLOUD_INFO_URL.toString());
            const cloudId = cloudResponse.data.cloudId;
            const resource = {
              id: cloudId,
              url: jiraHostName,
              name: jiraHostName,
              scopes: [],
              avatarUrl: null,
            };
            return res.json([resource]);
          } catch (error: any) {
            logger.error(error);
            return res.sendStatus(400);
          }
        }
        return res.sendStatus(400);
      }

      const { workspaceId, userId } = req.body;
      const credentials = await validateAndGetCredentials(workspaceId, userId);
      const axiosInstance = createAxiosInstance();

      if (!credentials.source_access_token) {
        return res.status(401).send({ message: "No access token found" });
      }
      const resources = await fetchJiraResources(axiosInstance, credentials);
      return res.json(resources);
    } catch (error) {
      logger.error("error in get resources", error);
      handleError(error, res);
    }
  }

  @Post("/projects")
  @useValidateUserAuthentication()
  async getProjects(req: Request, res: Response) {
    const { workspaceId, userId, cloudId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId, cloudId);
      const projects: JiraProject[] = [];
      await fetchPaginatedData(
        (startAt) => jiraClient.getResourceProjects(startAt),
        (values) => {
          projects.push(...(values as JiraProject[]));
        },
        "values"
      );
      return res.json(projects);
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/states")
  @useValidateUserAuthentication()
  async getStates(req: Request, res: Response) {
    const { workspaceId, userId, cloudId, projectId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId, cloudId);
      const statuses = await jiraClient.getProjectStatuses(projectId);
      return res.json(statuses);
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/priorities")
  @useValidateUserAuthentication()
  async getPriority(req: Request, res: Response) {
    const { workspaceId, userId, cloudId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId, cloudId);
      const statuses = await jiraClient.getIssuePriorities();
      return res.json(statuses);
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/labels")
  @useValidateUserAuthentication()
  async getLabels(req: Request, res: Response) {
    const { workspaceId, userId, cloudId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId, cloudId);
      const labels = await jiraClient.getResourceLabels();
      return res.json(labels?.values);
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/issue-count")
  @useValidateUserAuthentication()
  async getIssueCount(req: Request, res: Response) {
    const { workspaceId, userId, cloudId, projectId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId, cloudId);
      const issueCount = await jiraClient.getNumberOfIssues(projectId);
      return res.json(issueCount);
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/issue-types")
  @useValidateUserAuthentication()
  async getIssueTypes(req: Request, res: Response) {
    const { workspaceId, userId, cloudId, projectId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId, cloudId);
      const statuses = await jiraClient.getProjectIssueTypes(projectId);
      return res.json(statuses);
    } catch (error: any) {
      return responseHandler(res, 500, error);
    }
  }

  @Post("/additional-users/:workspaceId/:workspaceSlug/:userId")
  @useValidateUserAuthentication()
  async getUserDifferential(req: Request, res: Response) {
    try {
      const { workspaceId, workspaceSlug, userId } = req.params;
      const { userData } = req.body;

      if (!Array.isArray(userData) || userData.length === 0) {
        return res.status(400).send({ message: "No emails provided" });
      }

      if (typeof userData[0]?.email !== "string") {
        return res.status(400).send({ message: "Emails must be strings" });
      }

      const jiraEmails = userData?.map((x) => x.email);

      const planeClient = await createPlaneClient(workspaceId, userId, E_IMPORTER_KEYS.JIRA);
      const workspaceMembers = await planeClient.users.listAllUsers(workspaceSlug);
      const billableMembers = workspaceMembers.filter((member) => member.role > 10);
      const additionalUsers = compareAndGetAdditionalUsers(billableMembers, jiraEmails);

      return res.json({
        additionalUserCount: additionalUsers.length,
        occupiedUserCount: billableMembers.length,
      });
    } catch (error) {
      return responseHandler(res, 500, error);
    }
  }
}

export const createJiraClient = async (workspaceId: string, userId: string, cloudId?: string): Promise<JiraService> => {
  const apiClient = getAPIClient();
  const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
    workspace_id: workspaceId,
    source: E_IMPORTER_KEYS.JIRA,
    user_id: userId,
  });

  if (!credentials || credentials.length === 0) {
    throw new Error("No jira credentials available for the given workspaceId and userId");
  }

  const jiraCredentials = credentials[0];

  const refreshTokenCallback = async ({
    access_token,
    refresh_token,
  }: {
    access_token: string;
    refresh_token: string;
  }) => {
    await apiClient.workspaceCredential.createWorkspaceCredential({
      source: E_IMPORTER_KEYS.JIRA,
      target_access_token: jiraCredentials.target_access_token,
      source_access_token: access_token,
      source_refresh_token: refresh_token,
      workspace_id: workspaceId,
      user_id: userId,
    });
  };

  if (env.JIRA_OAUTH_ENABLED === "1") {
    if (
      !jiraCredentials.source_access_token ||
      !jiraCredentials.source_refresh_token ||
      !jiraCredentials.target_access_token
    ) {
      throw new Error("No jira credentials available for the given workspaceId and userId");
    }
    if (!cloudId) {
      throw new Error("Cloud ID is required");
    }

    return createJiraService({
      isPAT: false,
      cloudId: cloudId,
      accessToken: jiraCredentials.source_access_token,
      refreshToken: jiraCredentials.source_refresh_token,
      refreshTokenFunc: jiraAuth.getRefreshToken,
      refreshTokenCallback: refreshTokenCallback,
    });
  } else {
    if (
      !jiraCredentials.source_hostname ||
      !jiraCredentials.source_access_token ||
      !jiraCredentials.source_auth_email
    ) {
      throw new Error("Invalid Jira credentials");
    }

    return createJiraService({
      isPAT: true,
      hostname: jiraCredentials.source_hostname,
      userEmail: jiraCredentials.source_auth_email,
      patToken: jiraCredentials.source_access_token,
    });
  }
};

async function validateAndGetCredentials(workspaceId: string, userId: string) {
  const apiClient = getAPIClient();
  const credentials = await apiClient.workspaceCredential.listWorkspaceCredentials({
    workspace_id: workspaceId,
    source: E_IMPORTER_KEYS.JIRA,
    user_id: userId,
  });
  if (!credentials || credentials.length === 0) {
    throw new JiraApiError("No Jira credentials available for the given workspaceId and userId", 401);
  }

  const credential = credentials[0];
  if (env.JIRA_OAUTH_ENABLED === "0") {
    if (!credential.source_access_token || !credential.target_access_token || !credential.source_hostname) {
      throw new JiraApiError("Incomplete Jira credentials for the given workspaceId and userId", 401);
    }
  } else {
    if (!credential.source_access_token || !credential.source_refresh_token || !credential.target_access_token) {
      throw new JiraApiError("Incomplete Jira credentials for the given workspaceId and userId", 401);
    }
  }

  return credential;
}

function createAxiosInstance(): AxiosInstance {
  return axios.create({
    baseURL: "https://api.atlassian.com",
  });
}

async function fetchJiraResources(axiosInstance: AxiosInstance, credentials: TWorkspaceCredential, isRetry = false) {
  try {
    const response = await axiosInstance.get("/oauth/token/accessible-resources", {
      headers: {
        Authorization: `Bearer ${credentials.source_access_token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.status === 401) {
      // To avoid infinite loop, we are checking if the request is a retry
      if (isRetry) {
        throw new JiraApiError("Invalid access token", 401);
      } else {
        return await refreshAndRetry(credentials.workspace_id!, credentials.user_id!, credentials, axiosInstance);
      }
    }
    throw error;
  }
}

async function refreshAndRetry(
  workspaceId: string,
  userId: string,
  credentials: TWorkspaceCredential,
  axiosInstance: AxiosInstance
): Promise<JiraResource[]> {
  if (!credentials.source_refresh_token) {
    throw new JiraApiError("No refresh token found", 401);
  }

  const newJiraCredentials = await jiraAuth.getRefreshToken(credentials.source_refresh_token);
  const apiClient = getAPIClient();

  const updatedCredentials = await apiClient.workspaceCredential.createWorkspaceCredential({
    source: E_IMPORTER_KEYS.JIRA,
    target_access_token: credentials.target_access_token,
    source_access_token: newJiraCredentials.access_token,
    source_refresh_token: newJiraCredentials.refresh_token,
    workspace_id: workspaceId,
    user_id: userId,
  });

  if (!updatedCredentials.source_access_token) {
    throw new JiraApiError("No access token found", 401);
  }

  return await fetchJiraResources(axiosInstance, updatedCredentials, true);
}

function handleError(error: any, res: Response) {
  logger.error("Error occurred:", error);
  if (error instanceof JiraApiError) {
    return responseHandler(res, error.statusCode, error);
  }
  return responseHandler(res, 500, new JiraApiError("An unexpected error occurred", 500));
}

export default JiraController;
