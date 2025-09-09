// services
import axios from "axios";
import { Paginated } from "jira.js";
import { Board as BoardClient } from "jira.js/out/agile";
import { Board } from "jira.js/out/agile/models";
import { Version2Client } from "jira.js/out/version2";
import {
  CustomFieldContextOption,
  FieldDetails,
  Issue,
  IssueTypeDetails,
  JiraStatus,
  Project,
  User,
} from "jira.js/out/version2/models";
import { JiraCustomFieldWithCtx } from "@/jira-server/types/custom-fields";
import { fetchPaginatedData, JiraApiUser, JiraProps } from "..";

export class JiraV2Service {
  private jiraClient: Version2Client;
  private hostname: string;
  private patToken: string;

  constructor(props: JiraProps) {
    this.hostname = props.hostname;
    this.patToken = props.patToken;

    this.jiraClient = new Version2Client({
      host: props.hostname,
      authentication: {
        personalAccessToken: props.patToken,
      },
    });
  }

  async getServerInfo() {
    return this.jiraClient.serverInfo.getServerInfo();
  }

  // Verified
  async getCurrentUser() {
    return await this.jiraClient.myself.getCurrentUser();
  }

  async getJiraUsers(): Promise<JiraApiUser[]> {
    // @ts-expect-error
    return (await this.jiraClient.userSearch.findUsers({
      username: ".",
      // @ts-expect-error
      includeActive: true,
    })) as JiraApiUser[];
  }

  // Verified
  async getNumberOfIssues(projectKey: string) {
    const issues = await this.jiraClient.issueSearch.searchForIssuesUsingJql({
      jql: `project = ${projectKey}`,
      maxResults: 0,
    });
    return issues.total;
  }

  // Verified
  async getIssueFields() {
    return this.jiraClient.issueFields.getFields();
  }

  // Verified
  async getResourceStatuses() {
    const response = await axios.get(`${this.hostname}/rest/api/2/status`, {
      headers: {
        Authorization: `Bearer ${this.patToken}`,
      },
    });

    const data = response.data as JiraStatus[];
    return data;
  }

  // Verified
  async getProjectStatuses(projectId: string) {
    const types: JiraStatus[] = [];
    let isLast = false;
    let startAt = 0;

    try {
      while (!isLast) {
        const response = await axios.get(
          `${this.hostname}/rest/api/2/status/page?projectIds=${projectId}&startAt=${startAt}`,
          {
            headers: {
              Authorization: `Bearer ${this.patToken}`,
            },
          }
        );

        const data = response.data as Paginated<JiraStatus>;

        if (data.values) {
          types.push(...data.values);
        }

        isLast = data.isLast;
        startAt += data.maxResults;
      }
    } catch (e) {
      throw e;
    }

    return types;
  }

  // Verified
  async getFields() {
    return this.jiraClient.issueFields.getFields();
  }

  // Verified
  async getProjectComponents(projectId: string) {
    return this.jiraClient.projectComponents.getProjectComponents({
      projectIdOrKey: projectId,
    });
  }

  // Verified
  async getProjectComponentIssues(componentId: string) {
    return this.jiraClient.issueSearch.searchForIssuesUsingJql({
      jql: `component = ${componentId}`,
    });
  }

  // Verified
  async getBoardSprints(boardId: number) {
    const board = new BoardClient(this.jiraClient);
    return board.getAllSprints({
      boardId: boardId,
    });
  }

  // Verified
  async getBoardSprintsIssues(boardId: number, sprintId: number, startAt: number) {
    const board = new BoardClient(this.jiraClient);
    return board.getBoardIssuesForSprint({
      boardId: boardId,
      sprintId: sprintId,
      startAt: startAt,
    });
  }

  // Verified
  async getBoardEpics(boardId: number) {
    const board = new BoardClient(this.jiraClient);
    return board.getEpics({
      boardId: boardId,
    });
  }

  // Verified
  async getProjectBoards(projectId: string) {
    const board = new BoardClient(this.jiraClient);

    const result: Board[] = [];
    let isLast = false;
    let startAt = 0;

    try {
      while (!isLast) {
        const boards = await board.getAllBoards({
          projectKeyOrId: projectId,
        });

        if (boards.values) {
          result.push(...boards.values);
        }

        isLast = boards.isLast ?? false;
        startAt += boards.maxResults ?? 0;
      }
    } catch (e) {
      throw e;
    }

    return result;
  }

  // Verified
  async getIssuePriorities() {
    return this.jiraClient.issuePriorities.getPriorities();
  }

  // Verified
  async getAllProjectLabels(projectId: string) {
    try {
      const labels: string[] = [];
      await fetchPaginatedData(
        (startAt) => this.getProjectLabels(projectId, startAt),
        (values) => labels.push(...(values as string[])),
        "labels"
      );
      return labels;
    } catch (error) {
      console.error("error getAllProjectLabels", error);
      return [];
    }
  }

  // Verified
  async getProjectLabels(projectId: string, startAt = 0) {
    const response = await axios.get(`${this.hostname}/rest/api/2/search`, {
      params: {
        jql: `project = ${projectId}`,
        fields: ["labels"],
        startAt: startAt,
      },
      headers: {
        Authorization: `Bearer ${this.patToken}`,
      },
    });

    const data = response.data;
    const issues = data.issues as Issue[];
    // eslint-disable-next-line no-undef
    const allLabels = new Set();
    issues.forEach((issue) => {
      if (issue.fields.labels) {
        issue.fields.labels.forEach((label) => allLabels.add(label));
      }
    });

    return { labels: Array.from(allLabels), total: data.total };
  }

  // Verified
  async getResourceProjects(key: string = ""): Promise<Project[]> {
    return this.jiraClient.projects.getProject({
      projectIdOrKey: key,
    });
  }

  // Verified
  async getProjectIssueTypes(projectId: string) {
    const types: IssueTypeDetails[] = [];
    let isLast = false;
    let startAt = 0;

    try {
      while (!isLast) {
        const response = await axios.get(
          `${this.hostname}/rest/api/2/issuetype/page?projectIds=${projectId}&startAt=${startAt}`,
          {
            headers: {
              Authorization: `Bearer ${this.patToken}`,
            },
          }
        );

        const data = response.data as Paginated<IssueTypeDetails>;

        if (data.values) {
          types.push(...data.values);
        }

        isLast = data.isLast;
        startAt += data.maxResults;
      }
    } catch (e) {
      throw e;
    }

    return types;
  }

  // Verified
  async getCustomFields() {
    const fields: FieldDetails[] = await this.jiraClient.issueFields.getFields();
    const customFields: FieldDetails[] = fields.filter((field) => field.custom === true);
    return customFields;
  }

  async getCustomFieldsWithContext(projectId?: string) {
    const fields: JiraCustomFieldWithCtx[] = [];
    let isLast = false;
    let startAt = 0;

    try {
      while (!isLast) {
        const response = await axios.get(
          `${this.hostname}/rest/api/2/customFields?startAt=${startAt}&projectIds=${projectId ?? ""}`,
          {
            headers: {
              Authorization: `Bearer ${this.patToken}`,
            },
          }
        );

        const data = response.data as Paginated<JiraCustomFieldWithCtx>;

        if (data.values) {
          fields.push(...data.values);
        }

        isLast = data.isLast;
        startAt += data.maxResults;
      }
    } catch (e) {
      throw e;
    }

    return fields;
  }

  async getProjectFieldContexts(fieldId: string, startAt = 0) {
    return this.jiraClient.issueCustomFieldContexts.getProjectContextMapping({
      fieldId: fieldId,
      startAt: startAt,
    });
  }

  async getIssueTypeFieldContexts(fieldId: string, contextIds: number[], startAt = 0) {
    return this.jiraClient.issueCustomFieldContexts.getIssueTypeMappingsForContexts({
      fieldId: fieldId,
      contextId: contextIds,
      startAt: startAt,
    });
  }

  async getIssueFieldOptions(fieldId: string, projectId: string, issueTypeId: string) {
    const response = await axios.get(`${this.hostname}/rest/api/2/customFields/${fieldId}/options`, {
      params: {
        projectIds: projectId,
        issueTypeIds: issueTypeId,
      },
      headers: {
        Authorization: `Bearer ${this.patToken}`,
      },
    });

    const data = response.data;
    const options = data.options as CustomFieldContextOption[];

    return options;
  }

  async getProjectIssueCreateMeta(projectId: string) {
    return this.jiraClient.issues.getCreateIssueMeta({
      projectIds: [projectId],
      expand: "projects.issuetypes.fields",
    });
  }

  async getProjectIssues(projectKey: string, startAt = 0, createdAfter?: string) {
    return this.jiraClient.issueSearch.searchForIssuesUsingJql({
      jql: createdAfter
        ? `project = ${projectKey} AND (created >= "${createdAfter}" OR updated >= "${createdAfter}")`
        : `project = ${projectKey}`,
      expand: "renderedFields",
      fields: ["*all"],
      startAt,
    });
  }

  async getAllLabels() {
    const labels: string[] = [];
    let startAt = 0;
    const maxResults = 1000;

    while (true) {
      const response = await this.jiraClient.labels.getAllLabels({
        startAt,
        maxResults,
      });

      if (response.values) {
        labels.push(...response.values);
      }

      if (response.isLast) {
        break;
      }

      startAt += maxResults;
    }

    return labels;
  }

  async getNumberOfLabels() {
    const labels = await this.jiraClient.labels.getAllLabels();
    return labels.total;
  }

  async getProjectUsers(projectKey: string) {
    return this.jiraClient.userSearch.findAssignableUsers({
      project: projectKey,
    });
  }

  async getIssueComments(issueId: string, startAt: number) {
    return await this.jiraClient.issueComments.getComments({
      issueIdOrKey: issueId,
      startAt: startAt,
      expand: "renderedBody",
    });
  }
}

export default JiraV2Service;
