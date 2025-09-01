import { Request, Response } from "express";
import { E_INTEGRATION_KEYS } from "@plane/etl/core";
import { SentryCreateFields, SentryData, SentryLinkFields } from "@plane/etl/sentry";
import { ExIssue } from "@plane/sdk";
import { env } from "@/env";
import { responseHandler } from "@/helpers/response-handler";
import { Controller, EnsureEnabled, Get, Post } from "@/lib";
import { getAPIClient } from "@/services/client";
import { Store } from "@/worker/base";
import { getSentryConnectionDetails } from "../helpers/connection";
import { getSentryIssueDelinkMessage, getSentryIssueLinkedSuccessMessage, getSentryIssueUrl } from "../helpers/constants";
import { getProjectStateMappings } from "../helpers/state";
import { ESentryEntityConnectionType } from "../types";

const apiClient = getAPIClient();

@Controller("/api/sentry")
@EnsureEnabled(E_INTEGRATION_KEYS.SENTRY)
export class SentryAssetsController {
  /*
   * The SentryAssetsController manages the integration between Sentry and Plane,
   * handling asset retrieval (issues, users, labels) and issue synchronization
   * between both platforms.
   */

  @Get("/issues")
  async getIssues(req: Request, res: Response) {
    const { installationId, query } = req.query as { installationId: string; query?: string };

    if (!query) {
      return res.status(200).json([]);
    }

    const { planeClient, workspaceConnection } = await getSentryConnectionDetails(installationId);

    const response = await planeClient.issue.searchIssues(workspaceConnection.workspace_slug, query);

    const formatttedResponse = response.issues.map((issue) => ({
      label: `[${issue.project__identifier}-${issue.sequence_id}] ${issue.name}`,
      value: `${issue.project__identifier}:${issue.project_id}:${issue.id}`,
    }));

    return res.status(200).json(formatttedResponse);
  }

  @Get("/projects")
  async getProjects(req: Request, res: Response) {
    try {
      const query = req.query as unknown as { installationId: string };
      const { installationId } = query;

      if (!installationId)
        return res.status(400).send({ message: "Bad Request, expected installationId to be present." });

      const { planeClient, workspaceConnection } = await getSentryConnectionDetails(installationId);

      const projects = await planeClient.project.list(workspaceConnection.workspace_slug);
      const formatttedResponse = projects.results.map((project) => ({
        label: project.name,
        value: project.id,
      }));

      res.status(200).json(formatttedResponse);
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/users")
  async getUsers(req: Request, res: Response) {
    try {
      const { installationId, dependentData } = req.query as unknown as {
        installationId: string;
        dependentData: string;
      };
      const { project_id } = JSON.parse(dependentData) as { project_id: string };

      const { planeClient, workspaceConnection } = await getSentryConnectionDetails(installationId);
      const members = await planeClient.users.list(workspaceConnection.workspace_slug, project_id);
      const formatttedResponse = members.map((member) => ({
        label: member.display_name || member.email || member.first_name, // Fallback options
        value: member.id,
        default: false,
      }));

      res.status(200).json(formatttedResponse);
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/labels")
  async getLabels(req: Request, res: Response) {
    try {
      const { installationId, dependentData } = req.query as unknown as {
        installationId: string;
        dependentData: string;
      };
      const { project_id } = JSON.parse(dependentData) as { project_id: string };

      const { planeClient, workspaceConnection } = await getSentryConnectionDetails(installationId);
      const labels = await planeClient.label.list(workspaceConnection.workspace_slug, project_id);
      const formatttedResponse = labels.results.map((label) => ({
        label: label.name,
        value: label.id,
      }));

      res.status(200).json(formatttedResponse);
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/states")
  async getStates(req: Request, res: Response) {
    try {
      const { installationId, dependentData } = req.query as unknown as {
        installationId: string;
        dependentData: string;
      };
      const { project_id } = JSON.parse(dependentData) as { project_id: string };

      const { planeClient, workspaceConnection } = await getSentryConnectionDetails(installationId);
      const states = await planeClient.state.list(workspaceConnection.workspace_slug, project_id);
      const formatttedResponse = states.results.map((state) => ({
        label: state.name,
        value: state.id,
      }));

      res.status(200).json(formatttedResponse);
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/priorities")
  async getPriorities(req: Request, res: Response) {
    const priorities = ["low", "medium", "high", "urgent", "none"];
    const formatttedResponse = priorities.map((priority) => ({
      // Capitalize the first letter of the label name
      label: priority.charAt(0).toUpperCase() + priority.slice(1),
      value: priority,
    }));

    res.status(200).json(formatttedResponse);
  }

  @Get("/cycles")
  async getCycles(req: Request, res: Response) {
    try {
      const { installationId, dependentData } = req.query as { installationId: string; dependentData: string };
      const { project_id } = JSON.parse(dependentData) as { project_id: string };
      const { planeClient, workspaceConnection } = await getSentryConnectionDetails(installationId);
      const cycles = await planeClient.cycles.list(workspaceConnection.workspace_slug, project_id);
      const formatttedResponse = cycles.results.map((cycle) => ({
        // Capitalize the first letter of the label name
        label: cycle.name,
        value: cycle.id,
      }));

      res.status(200).json(formatttedResponse);
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  @Get("/modules")
  async getModules(req: Request, res: Response) {
    try {
      const { installationId, dependentData } = req.query as { installationId: string; dependentData: string };
      const { project_id } = JSON.parse(dependentData) as { project_id: string };
      const { planeClient, workspaceConnection } = await getSentryConnectionDetails(installationId);
      const modules = await planeClient.modules.list(workspaceConnection.workspace_slug, project_id);
      const formatttedResponse = modules.results.map((module) => ({
        // Capitalize the first letter of the label name
        label: module.name,
        value: module.id,
      }));

      res.status(200).json(formatttedResponse);
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }

  @Post("/issues/link")
  async linkIssue(req: Request, res: Response) {
    try {
      const data = req.body as SentryData;
      const { installationId, issueId, webUrl } = data;

      const fields = data.fields as SentryLinkFields;

      if (!fields.identifier) {
        return res.status(400).json({ success: false });
      }

      const [project_identifier, project, issue] = fields.identifier.split(":");

      if (!project_identifier || !issue || !project) {
        return res.status(400).json({ success: false });
      }

      const { planeClient, sentryService, workspaceConnection } = await getSentryConnectionDetails(installationId);

      // Get entity connection with entity id
      const entityConnection = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
        entity_id: issueId.toString(),
        entity_type: ESentryEntityConnectionType.SENTRY_ISSUE,
      });

      let title = `[SENTRY] ${webUrl}`;

      if (sentryService && workspaceConnection.connection_slug) {
        try {
          const sentryIssue = await sentryService.getIssue(workspaceConnection.connection_slug, issueId.toString());
          if (sentryIssue) {
            title = `[SENTRY] ${sentryIssue?.title}`;
          }
        } catch { }
      }

      const operations = [];

      // If another connection comes for the same issue, it means that the
      // previous connection was removed, hence we need to update our entity
      // connection with the new issue id
      if (entityConnection.length > 0) {
        const targetEntityConnection = entityConnection[0];

        // Send delink message to Plane
        if (targetEntityConnection.issue_id && targetEntityConnection.project_id) {
          const delinkMessage = getSentryIssueDelinkMessage(title, webUrl);
          const delinkComment = planeClient.issueComment.create(
            workspaceConnection.workspace_slug,
            targetEntityConnection.project_id,
            targetEntityConnection.issue_id,
            {
              comment_html: delinkMessage,
            }
          );

          operations.push(delinkComment);
        }

        const updateEntityConnection = apiClient.workspaceEntityConnection.updateWorkspaceEntityConnection(
          entityConnection[0].id,
          {
            workspace_id: workspaceConnection.workspace_id,
            project_id: project,
            issue_id: issue,
          }
        );

        operations.push(updateEntityConnection);
      } else {
        // After the issue is created, let's create an entity connection to store
        // the issue id's connection
        const createEntityConnection = apiClient.workspaceEntityConnection.createWorkspaceEntityConnection({
          // Plane's information
          workspace_id: workspaceConnection.workspace_id,
          project_id: project,
          issue_id: issue,

          // Sentry's information
          entity_id: issueId.toString(),
          entity_type: ESentryEntityConnectionType.SENTRY_ISSUE,
          entity_data: data,

          // Something that silo can use
          workspace_connection_id: workspaceConnection.id,
        });

        operations.push(createEntityConnection);
      }

      try {
        // Make an attempt to create a link in plane issue for sentry
        const sentryIssueUrl = getSentryIssueUrl(workspaceConnection.connection_slug!, issueId.toString());
        await planeClient.issue.createLink(workspaceConnection.workspace_slug, project, issue, title, sentryIssueUrl);
      } catch (error) {
        console.log(error);
      }

      const stateResult = await getProjectStateMappings(planeClient, workspaceConnection, project);

      // Make an attempt to post success message in plane
      const message = getSentryIssueLinkedSuccessMessage(title, webUrl, stateResult ? {
        resolvedState: stateResult.resolvedState.name,
        unresolvedState: stateResult.unresolvedState.name,
        isDefault: stateResult.isDefault,
      } : undefined);

      const createComment = planeClient.issueComment.create(workspaceConnection.workspace_slug, project, issue, {
        comment_html: message,
      });

      operations.push(createComment);

      await Promise.all(operations);

      const planeIssue = await planeClient.issue.getIssue(workspaceConnection.workspace_slug, project, issue);

      const sentryResponse = {
        webUrl: `${env.APP_BASE_URL}/${workspaceConnection.workspace_slug}/projects/${project}/issues/${issue}`,
        project: project_identifier ?? project,
        identifier: planeIssue.sequence_id.toString(),
      };

      res.status(200).json(sentryResponse);
      return res.status(200);
    } catch (error) {
      console.log(error);
      responseHandler(res, 500, error);
    }
  }

  @Post("/issues/create")
  async createIssue(req: Request, res: Response) {
    try {
      const store = Store.getInstance()
      const data = req.body as SentryData;
      const { installationId, issueId, webUrl } = data;
      const { planeClient, workspaceConnection } = await getSentryConnectionDetails(installationId);

      const fields = data.fields as SentryCreateFields;

      if (!fields.title || !fields.description) {
        return res.status(400).json({ success: false });
      }

      const issue: Partial<ExIssue> = {
        name: fields.title,
        description_html: `<p>${fields.description}</p>`,
        labels: fields.labels !== "" ? fields.labels : [],
        assignees: fields.assignee_ids !== "" ? fields.assignee_ids : [],
        priority: fields.priorities !== "" ? fields.priorities : "none",
        state: fields.state !== "" ? fields.state : undefined,
      };

      const project = await planeClient.project.getProject(workspaceConnection.workspace_slug, fields.project_id);
      const response = await planeClient.issue.create(workspaceConnection.workspace_slug, fields.project_id, issue);

      // Set store key for deduplication
      await store.set(`silo:sentry:issue:${response.id}`, "true", 15);

      if (fields.cycle !== "") {
        // Add the issue to the cycle
        await planeClient.cycles.addIssues(workspaceConnection.workspace_slug, fields.project_id, fields.cycle, [
          response.id,
        ]);
      }

      if (fields.module !== "") {
        await planeClient.modules.addIssues(workspaceConnection.workspace_slug, fields.project_id, fields.module, "", [
          response.id,
        ]);
      }

      // Get entity connection with entity id
      const entityConnection = await apiClient.workspaceEntityConnection.listWorkspaceEntityConnections({
        entity_id: issueId.toString(),
        entity_type: ESentryEntityConnectionType.SENTRY_ISSUE,
      });

      const operations = [];

      // If another connection comes for the same issue, it means that the
      // previous connection was removed, hence we need to update our entity
      // connection with the new issue id
      if (entityConnection.length > 0) {
        const targetEntityConnection = entityConnection[0];

        // Send delink message to Plane
        if (targetEntityConnection.issue_id && targetEntityConnection.project_id) {
          const delinkMessage = getSentryIssueDelinkMessage(fields.title, webUrl);
          const delinkComment = planeClient.issueComment.create(
            workspaceConnection.workspace_slug,
            targetEntityConnection.project_id,
            targetEntityConnection.issue_id,
            {
              comment_html: delinkMessage,
            }
          );

          operations.push(delinkComment);
        }
        const updateEntityConnection = apiClient.workspaceEntityConnection.updateWorkspaceEntityConnection(
          entityConnection[0].id,
          {
            workspace_id: workspaceConnection.workspace_id,
            project_id: fields.project_id,
            issue_id: response.id,
          }
        );

        operations.push(updateEntityConnection);
      } else {
        // After the issue is created, let's create an entity connection to store
        // the issue id's connection
        const createEntityConnection = apiClient.workspaceEntityConnection.createWorkspaceEntityConnection({
          // Plane's information
          workspace_id: workspaceConnection.workspace_id,
          project_id: fields.project_id,
          issue_id: response.id,

          // Sentry's information
          entity_id: issueId.toString(),
          entity_type: ESentryEntityConnectionType.SENTRY_ISSUE,
          entity_data: data,

          // Something that silo can use
          workspace_connection_id: workspaceConnection.id,
        });

        operations.push(createEntityConnection);
      }

      // Make an attempt to create a link in plane issue for sentry
      const sentryIssueUrl = getSentryIssueUrl(workspaceConnection.connection_slug!, issueId.toString());
      const title = `[SENTRY] ${fields.title}`;
      const createLink = planeClient.issue.createLink(
        workspaceConnection.workspace_slug,
        fields.project_id,
        response.id,
        title,
        sentryIssueUrl
      );

      operations.push(createLink);

      const stateResult = await getProjectStateMappings(planeClient, workspaceConnection, fields.project_id);

      // Make an attempt to post success message in plane
      const message = getSentryIssueLinkedSuccessMessage(fields.title, webUrl, stateResult ? {
        resolvedState: stateResult.resolvedState.name,
        unresolvedState: stateResult.unresolvedState.name,
        isDefault: stateResult.isDefault,
      } : undefined);
      const createComment = planeClient.issueComment.create(
        workspaceConnection.workspace_slug,
        fields.project_id,
        response.id,
        {
          comment_html: message,
        }
      );

      operations.push(createComment);

      await Promise.all(operations);

      const sentryResponse = {
        webUrl: `${env.APP_BASE_URL}/${workspaceConnection.workspace_slug}/projects/${fields.project_id}/issues/${response.id}`,
        project: project.identifier ?? project.name,
        identifier: response.sequence_id.toString(),
      };

      res.status(200).json(sentryResponse);
    } catch (error) {
      responseHandler(res, 500, error);
    }
  }
}
