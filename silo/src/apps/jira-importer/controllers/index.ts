import { env } from "@/env";
import { Controller, Get, Post } from "@/lib";
import { Request, Response } from "express";
import { jiraAuth } from "../auth/auth";
import {
  createJiraService,
  fetchPaginatedData,
  JiraAuthPayload,
  JiraAuthState,
  JiraProject,
  JiraResource,
  JiraService,
  JiraTokenResponse,
} from "@silo/jira";
import { createOrUpdateCredentials, getCredentialsByWorkspaceId } from "@/db/query";
import axios, { AxiosInstance } from "axios";
import { Credentials } from "@/types";

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

  @Post("/auth/url")
  async getAuthURL(req: Request, res: Response) {
    if (env.JIRA_OAUTH_ENABLED === "0") {
      return res.status(400).send({
        message: "Bad Request, OAuth is not enabled for Jira.",
      });
    }

    const body: JiraAuthState = req.body;
    if (!body.workspaceId || !body.apiToken) {
      return res.status(400).send({
        message: "Bad Request, expected both apiToken and workspaceId to be present.",
      });
    }
    const baseUrl = env.SILO_API_BASE_URL;
    const response = jiraAuth.getAuthorizationURL(body, baseUrl);
    res.send(response);
  }

  @Get("/auth/callback")
  async authCallback(req: Request, res: Response) {
    if (env.JIRA_OAUTH_ENABLED === "0") {
      return res.status(400).send({
        message: "Invalid Callback, OAuth is not enabled for Jira.",
      });
    }
    const query: JiraAuthPayload | any = req.query;
    if (!query.code) {
      return res.status(400).send("code not found in the query params");
    }
    const stringifiedJsonState = query.state as string;
    // Decode the base64 encoded state string and parse it to JSON
    const state: JiraAuthState = JSON.parse(Buffer.from(stringifiedJsonState, "base64").toString());
    let tokenResponse: JiraTokenResponse;
    try {
      const baseUrl = env.SILO_API_BASE_URL;
      const tokenInfo = await jiraAuth.getAccessToken(query.code as string, state, baseUrl);
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

    // Create a new credentials record in the database for the recieved token
    await createOrUpdateCredentials(state.workspaceId, state.userId, {
      source_access_token: tokenResponse.access_token,
      source_refresh_token: tokenResponse.refresh_token,
      target_access_token: state.apiToken,
      source: "JIRA",
      workspace_id: state.workspaceId,
    });

    try {
      // As we are using base path as /jira, we can redirect to /jira
      res.redirect(`${env.APP_BASE_URL}/${state.workspaceSlug}/settings/imports/jira/`);
    } catch (error: any) {
      res.status(500).send(error.response.data);
    }
  }

  @Post("/auth/refresh")
  async refreshAccessToken(req: Request, res: Response) {
    if (env.JIRA_OAUTH_ENABLED === "0") {
      return res.status(400).send({
        message: "Invalid Callback, OAuth is not enabled for Jira.",
      });
    }
    const { refreshToken, workspaceId, userId } = req.body;
    if (!refreshToken || !workspaceId) {
      return res.status(400).send({ message: "Bad Request" });
    }
    try {
      const { access_token, refresh_token, expires_in } = await jiraAuth.getRefreshToken(refreshToken);

      // Update the credentials record in the database with the new token
      await createOrUpdateCredentials(workspaceId, userId, {
        source_access_token: access_token,
        source_refresh_token: refresh_token,
        source: "JIRA",
        workspace_id: workspaceId,
      });

      res
        .cookie("accessToken", access_token)
        .cookie("refreshToken", refresh_token)
        .send({ access_token, refresh_token, expires_in });
    } catch (error: any) {
      res.status(error.response.status).send(error.response.data);
    }
  }

  @Post("/auth/pat")
  async upsertCredentials(req: Request, res: Response) {
    try {
      const { workspaceId, userId, apiToken, personalAccessToken, userEmail, hostname } = req.body;
      if (!workspaceId || !userId || !apiToken || !personalAccessToken) {
        res.status(400).json({ message: "Workspace ID, User ID, API Token and Personal Access Token are required" });
      }

      try {
        const jiraService = createJiraService({
          isPAT: true,
          patToken: personalAccessToken,
          userEmail: userEmail,
          hostname: hostname,
        });

        await jiraService.getResourceProjects();
      } catch (error: any) {
        return res.status(401).send({ message: "Invalid personal access token" });
      }

      // Create or update the credentials
      const credential = await createOrUpdateCredentials(workspaceId, userId, {
        source_access_token: personalAccessToken,
        target_access_token: apiToken,
        user_email: userEmail,
        source_hostname: hostname,
        source: "JIRA",
        workspace_id: workspaceId,
        isPAT: true,
      });

      res.status(200).json(credential);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  @Post("/resources")
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
            console.error(error);
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
      handleError(error, res);
    }
  }

  @Post("/projects")
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
      return res.status(401).send({ message: error.message });
    }
  }

  @Post("/states")
  async getStates(req: Request, res: Response) {
    const { workspaceId, userId, cloudId, projectId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId, cloudId);
      const statuses = await jiraClient.getProjectStatuses(projectId);
      // const statuses = await jiraClient.getResourceStatuses();
      return res.json(statuses);
    } catch (error: any) {
      return res.status(401).send({ message: error.message });
    }
  }

  @Post("/priorities")
  async getPriority(req: Request, res: Response) {
    const { workspaceId, userId, cloudId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId, cloudId);
      const statuses = await jiraClient.getIssuePriorities();
      return res.json(statuses);
    } catch (error: any) {
      return res.status(401).send({ message: error.message });
    }
  }

  @Post("/labels")
  async getLabels(req: Request, res: Response) {
    const { workspaceId, userId, cloudId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId, cloudId);
      const labels = await jiraClient.getResourceLabels();
      return res.json(labels);
    } catch (error: any) {
      return res.status(401).send({ message: error.message });
    }
  }

  @Post("/issue-count")
  async getIssueCount(req: Request, res: Response) {
    const { workspaceId, userId, cloudId, projectId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId, cloudId);
      const issueCount = await jiraClient.getNumberOfIssues(projectId);
      return res.json(issueCount);
    } catch (error: any) {
      return res.status(401).send({ message: error.message });
    }
  }

  @Post("/issue-types")
  async getIssueTypes(req: Request, res: Response) {
    const { workspaceId, userId, cloudId, projectId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId, cloudId);
      const statuses = await jiraClient.getProjectIssueTypes(projectId);
      return res.json(statuses);
    } catch (error: any) {
      return res.status(401).send({ message: error.message });
    }
  }
}

const createJiraClient = async (workspaceId: string, userId: string, cloudId?: string): Promise<JiraService> => {
  const credentials = await getCredentialsByWorkspaceId(workspaceId, userId, "JIRA");

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
    await createOrUpdateCredentials(workspaceId, userId, {
      source_access_token: access_token,
      source_refresh_token: refresh_token,
      target_access_token: jiraCredentials.target_access_token,
      source: "JIRA",
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
    if (!jiraCredentials.source_hostname || !jiraCredentials.source_access_token || !jiraCredentials.user_email) {
      throw new Error("Invalid Jira credentials");
    }

    return createJiraService({
      isPAT: true,
      hostname: jiraCredentials.source_hostname,
      userEmail: jiraCredentials.user_email,
      patToken: jiraCredentials.source_access_token,
    });
  }
};

async function validateAndGetCredentials(workspaceId: string, userId: string) {
  const credentials = await getCredentialsByWorkspaceId(workspaceId, userId, "JIRA");
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

async function fetchJiraResources(axiosInstance: AxiosInstance, credentials: Credentials, isRetry = false) {
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
  credentials: Credentials,
  axiosInstance: AxiosInstance
): Promise<JiraResource[]> {
  if (!credentials.source_refresh_token) {
    throw new JiraApiError("No refresh token found", 401);
  }

  const newJiraCredentials = await jiraAuth.getRefreshToken(credentials.source_refresh_token);
  const updatedCredentials = await createOrUpdateCredentials(workspaceId, userId, {
    source_access_token: newJiraCredentials.access_token,
    source_refresh_token: newJiraCredentials.refresh_token,
    target_access_token: credentials.target_access_token,
    source: "JIRA",
  });

  if (!updatedCredentials.source_access_token) {
    throw new JiraApiError("No access token found", 401);
  }

  return await fetchJiraResources(axiosInstance, updatedCredentials, true);
}

function handleError(error: any, res: Response) {
  console.error("Error occurred:", error);
  if (error instanceof JiraApiError) {
    return res.status(error.statusCode).send({ message: error.message });
  }
  return res.status(500).send({ message: "An unexpected error occurred" });
}

export default JiraController;
