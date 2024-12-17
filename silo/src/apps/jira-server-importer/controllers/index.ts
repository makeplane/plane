import { Controller, Get, Post } from "@/lib";
import { Request, Response } from "express";
import { createJiraService, JiraProject, JiraV2Service } from "@silo/jira-server";
import { createOrUpdateCredentials, getCredentialsByWorkspaceId } from "@/db/query";
import { JiraResource } from "@silo/jira";

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
        source: "JIRA_SERVER",
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
    const { workspaceId, userId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId);
      const serverInfo = await jiraClient.getServerInfo();
      // @ts-ignore
      const resource: JiraResource = {
        id: serverInfo.scmInfo ?? "",
        url: serverInfo.baseUrl ?? "",
        name: serverInfo.serverTitle ?? "",
      };
      return res.json([resource]);
    } catch (error: any) {
      return res.status(401).send({ message: error.message });
    }
  }

  @Post("/projects")
  async getProjects(req: Request, res: Response) {
    const { workspaceId, userId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId);
      const projects: JiraProject[] = await jiraClient.getResourceProjects();
      return res.json(projects);
    } catch (error: any) {
      return res.status(401).send({ message: error.message });
    }
  }

  // Doesn't work
  @Post("/states")
  async getStates(req: Request, res: Response) {
    const { workspaceId, userId, projectId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId);
      const statuses = await jiraClient.getProjectStatuses(projectId);
      return res.json(statuses);
    } catch (error: any) {
      return res.status(401).send({ message: error.message });
    }
  }

  @Post("/priorities")
  async getPriority(req: Request, res: Response) {
    const { workspaceId, userId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId);
      const priorities = await jiraClient.getIssuePriorities();
      return res.json(priorities);
    } catch (error: any) {
      return res.status(401).send({ message: error.message });
    }
  }

  @Post("/labels")
  async getLabels(req: Request, res: Response) {
    const { workspaceId, userId, projectId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId);
      const labels = await jiraClient.getAllProjectLabels(projectId);
      return res.json(labels);
    } catch (error: any) {
      return res.status(401).send({ message: error.message });
    }
  }

  @Post("/issue-count")
  async getIssueCount(req: Request, res: Response) {
    const { workspaceId, userId, projectId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId);
      const issueCount = await jiraClient.getNumberOfIssues(projectId);
      return res.json({
        count: issueCount,
      });
    } catch (error: any) {
      return res.status(401).send({ message: error.message });
    }
  }

  @Post("/issue-types")
  async getIssueTypes(req: Request, res: Response) {
    const { workspaceId, userId, projectId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId);
      const statuses = await jiraClient.getProjectIssueTypes(projectId);
      return res.json(statuses);
    } catch (error: any) {
      return res.status(401).send({ message: error.message });
    }
  }

  @Post("/test")
  async getFields(req: Request, res: Response) {
    const { workspaceId, userId, projectId } = req.body;

    try {
      const jiraClient = await createJiraClient(workspaceId, userId);
      const statuses = await jiraClient.getJiraUsers();
      return res.json(statuses);
    } catch (error: any) {
      return res.status(401).send({ message: error.message });
    }
  }
}

const createJiraClient = async (workspaceId: string, userId: string): Promise<JiraV2Service> => {
  const credentials = await getCredentialsByWorkspaceId(workspaceId, userId, "JIRA_SERVER");

  if (!credentials || credentials.length === 0) {
    throw new Error("No jira credentials available for the given workspaceId and userId");
  }

  const jiraCredentials = credentials[0];

  if (!jiraCredentials.source_hostname || !jiraCredentials.source_access_token || !jiraCredentials.user_email) {
    throw new Error("Invalid Jira credentials");
  }

  return createJiraService({
    hostname: jiraCredentials.source_hostname,
    patToken: jiraCredentials.source_access_token,
  });
};

export default JiraDataCenterController;
