import { Request, Response } from "express";
// etl
import { Controller, Get, Post } from "@plane/decorators";
import { E_IMPORTER_KEYS } from "@plane/etl/core";
import { JiraResource } from "@plane/etl/jira";
import { createJiraService, JiraProject, JiraV2Service } from "@plane/etl/jira-server";
// db
// helpers
import { compareAndGetAdditionalUsers } from "@/helpers/additional-users";
import { createOrUpdateCredentials, getValidCredentials } from "@/helpers/credential";
import { responseHandler } from "@/helpers/response-handler";
import { createPlaneClient } from "@/helpers/utils";
import { useValidateUserAuthentication } from "@/lib/decorators";

@Controller("/api/jira-server")
class JiraDataCenterController {
  @Get("/ping")
  async ping(_req: Request, res: Response) {
    res.send("pong");
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
          patToken: personalAccessToken,
          hostname: hostname,
        });

        await jiraService.getCurrentUser();
      } catch (error: any) {
        return res.status(401).send({ message: "Invalid personal access token" });
      }

      // Create or update the credentials
      const credential = await createOrUpdateCredentials(workspaceId, userId, E_IMPORTER_KEYS.JIRA_SERVER, {
        source_access_token: personalAccessToken,
        target_access_token: apiToken,
        source_auth_email: userEmail,
        source_hostname: hostname,
        source: E_IMPORTER_KEYS.JIRA_SERVER,
        workspace_id: workspaceId,
        is_pat: true,
      });

      res.status(200).json(credential);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Post("/resources")
  @useValidateUserAuthentication()
  async getResources(req: Request, res: Response) {
    const { workspaceId, userId } = req.body;

    try {
      const jiraClient = await createJiraServerClient(workspaceId, userId);
      const serverInfo = await jiraClient.getServerInfo();
      // @ts-expect-error
      const resource: JiraResource = {
        id: serverInfo.scmInfo ?? "",
        url: serverInfo.baseUrl ?? "",
        name: serverInfo.serverTitle ?? "",
      };
      return res.json([resource]);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Post("/projects")
  @useValidateUserAuthentication()
  async getProjects(req: Request, res: Response) {
    const { workspaceId, userId } = req.body;

    try {
      const jiraClient = await createJiraServerClient(workspaceId, userId);
      const projects: JiraProject[] = await jiraClient.getResourceProjects();
      return res.json(projects);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Post("/states")
  @useValidateUserAuthentication()
  async getStates(req: Request, res: Response) {
    const { workspaceId, userId, projectId } = req.body;

    try {
      const jiraClient = await createJiraServerClient(workspaceId, userId);
      const statuses = await jiraClient.getProjectStatuses(projectId);
      return res.json(statuses);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Post("/priorities")
  @useValidateUserAuthentication()
  async getPriority(req: Request, res: Response) {
    const { workspaceId, userId } = req.body;

    try {
      const jiraClient = await createJiraServerClient(workspaceId, userId);
      const priorities = await jiraClient.getIssuePriorities();
      return res.json(priorities);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Post("/labels")
  @useValidateUserAuthentication()
  async getLabels(req: Request, res: Response) {
    const { workspaceId, userId, projectId } = req.body;

    try {
      const jiraClient = await createJiraServerClient(workspaceId, userId);
      const labels = await jiraClient.getAllProjectLabels(projectId);
      return res.json(labels);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Post("/issue-count")
  @useValidateUserAuthentication()
  async getIssueCount(req: Request, res: Response) {
    const { workspaceId, userId, projectId } = req.body;

    try {
      const jiraClient = await createJiraServerClient(workspaceId, userId);
      const issueCount = await jiraClient.getNumberOfIssues(projectId);
      return res.json({
        count: issueCount,
      });
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Post("/issue-types")
  @useValidateUserAuthentication()
  async getIssueTypes(req: Request, res: Response) {
    const { workspaceId, userId, projectId } = req.body;

    try {
      const jiraClient = await createJiraServerClient(workspaceId, userId);
      const statuses = await jiraClient.getProjectIssueTypes(projectId);
      return res.json(statuses);
    } catch (error: any) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/additional-users/:workspaceId/:workspaceSlug/:userId")
  @useValidateUserAuthentication()
  async getUserDifferential(req: Request, res: Response) {
    const { workspaceId, workspaceSlug, userId } = req.params;

    try {
      const [planeClient, jiraClient] = await Promise.all([
        createPlaneClient(workspaceId, userId, E_IMPORTER_KEYS.JIRA_SERVER),
        createJiraServerClient(workspaceId, userId),
      ]);
      const [workspaceMembers, jiraActiveMembers] = await Promise.all([
        planeClient.users.listAllUsers(workspaceSlug),
        jiraClient.getJiraUsers(),
      ]);
      const billableMembers = workspaceMembers.filter((member) => member.role > 10);
      const additionalUsers = compareAndGetAdditionalUsers(billableMembers, jiraActiveMembers);

      return res.json({
        additionalUserCount: additionalUsers.length,
        occupiedUserCount: billableMembers.length,
      });
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }
}

export const createJiraServerClient = async (workspaceId: string, userId: string): Promise<JiraV2Service> => {
  const jiraCredentials = await getValidCredentials(workspaceId, userId, E_IMPORTER_KEYS.JIRA_SERVER);

  if (!jiraCredentials.source_hostname || !jiraCredentials.source_access_token || !jiraCredentials.source_auth_email) {
    throw new Error("Invalid Jira credentials");
  }

  return createJiraService({
    hostname: jiraCredentials.source_hostname,
    patToken: jiraCredentials.source_access_token,
  });
};

export default JiraDataCenterController;
