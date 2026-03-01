/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

// services
import type { AxiosError } from "axios";
import axios from "axios";
import { Board } from "jira.js/out/agile/index.js";
import { Version3Client } from "jira.js/out/version3/index.js";
import type { FieldDetails, PageString } from "jira.js/out/version3/models/index.js";
import type { JiraProps, JiraResource } from "@/jira/types";

export class JiraService {
  private jiraClient: Version3Client;
  private accessToken: string = "";
  private refreshToken: string = "";

  constructor(props: JiraProps) {
    if (props.isPAT === false) {
      this.accessToken = props.accessToken;
      this.jiraClient = new Version3Client({
        host: `https://api.atlassian.com/ex/jira/${props.cloudId}`,
        authentication: {
          oauth2: {
            accessToken: props.accessToken,
          },
        },
      });

      this.refreshToken = props.refreshToken;
      this.jiraClient.handleFailedResponse = async (request) => {
        const error = request as AxiosError;
        if (error.response?.status === 401) {
          try {
            const { access_token, refresh_token, expires_in } = await props.refreshTokenFunc(this.refreshToken);
            this.refreshToken = refresh_token;
            this.jiraClient = new Version3Client({
              host: `https://api.atlassian.com/ex/jira/${props.cloudId}`,
              authentication: {
                oauth2: {
                  accessToken: access_token,
                },
              },
            });
            await props.refreshTokenCallback({
              access_token,
              refresh_token,
              expires_in,
            });
            return request;
          } catch (error) {
            console.log("Error while refreshing token");
            console.log(error);
          }
        }
        throw error;
      };
    } else {
      this.jiraClient = new Version3Client({
        host: props.hostname,
        authentication: {
          basic: {
            email: props.userEmail,
            apiToken: props.patToken,
          },
        },
      });

      this.jiraClient.handleFailedResponse = async (request) => {
        const error = request as AxiosError;
        if (error.response?.status === 429) {
          const retryAfter = 60; // 60 seconds default
          console.log("Rate limit exceeded ====== in jira client, waiting for", retryAfter, "seconds");
          await new Promise((resolve) => setTimeout(resolve, retryAfter * 1000));

          // Actually retry the request
          const originalConfig = error.config;
          if (originalConfig) {
            console.log("Retrying request after rate limit...");
            const response = await axios.request(originalConfig);
            return response.data;
          }
        }
        throw error;
      };
    }
  }

  async getCurrentUser() {
    return await this.jiraClient.myself.getCurrentUser();
  }

  async getNumberOfIssues(projectKey: string, jql?: string) {
    const issues = await this.jiraClient.issueSearch.countIssues({
      jql: jql ? jql : `project = "${projectKey}"`,
    });
    return issues.count;
  }

  async getIssueFields() {
    return this.jiraClient.issueFields.getFields();
  }

  async getCurrentResource() {
    return this.jiraClient.projects;
  }

  async getResourceStatuses() {
    return this.jiraClient.status.search();
  }

  // async getProjectStatuses(projectId: string) {
  //   return this.jiraClient.status.search({
  //     projectId: projectId,
  //   });
  // }

  async getProjectStatuses(projectId: string) {
    return this.jiraClient.projects.getAllStatuses({
      projectIdOrKey: projectId,
    });
  }

  async getFields() {
    return this.jiraClient.issueFields.getFields();
  }

  async getProjectComponents(projectId: string) {
    return this.jiraClient.projectComponents.getProjectComponents({
      projectIdOrKey: projectId,
    });
  }

  async getProjectComponentIssues(componentId: string, nextPageToken?: string) {
    return this.jiraClient.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
      jql: `component = ${componentId}`,
      nextPageToken: nextPageToken,
    });
  }

  async getBoardSprints(boardId: number) {
    const board = new Board(this.jiraClient);
    return board.getAllSprints({
      boardId: boardId,
    });
  }

  async getBoardSprintsIssues(boardId: number, sprintId: number, startAt: number) {
    const board = new Board(this.jiraClient);
    return board.getBoardIssuesForSprint({
      boardId: boardId,
      sprintId: sprintId,
      startAt: startAt,
    });
  }

  async getBoardEpics(boardId: number) {
    const board = new Board(this.jiraClient);
    return board.getEpics({
      boardId: boardId,
    });
  }

  async getProjectBoards(projectId: string) {
    const board = new Board(this.jiraClient);
    return board.getAllBoards({
      projectKeyOrId: projectId,
    });
  }

  async getIssuePriorities() {
    return this.jiraClient.issuePriorities.getPriorities();
  }

  async getResourceLabels(startAt = 0): Promise<PageString> {
    return this.jiraClient.labels.getAllLabels({
      startAt: startAt,
    });
  }

  async getResourceProjects(startAt: number = 0) {
    return this.jiraClient.projects.searchProjects({
      startAt: startAt,
    });
  }

  async getProjectIssueTypes(projectId: string) {
    return this.jiraClient.issueTypes.getIssueTypesForProject({
      projectId: projectId as unknown as number,
    });
  }

  async getCustomFields() {
    const fields: FieldDetails[] = await this.jiraClient.issueFields.getFields();
    const customFields: FieldDetails[] = fields.filter((field) => field.schema?.custom);
    return customFields;
  }

  async getProjectFieldContexts(fieldId: string, startAt = 0) {
    return this.jiraClient.issueCustomFieldContexts.getProjectContextMapping({
      fieldId: fieldId,
      startAt: startAt,
    });
  }

  async getIssueTypeFieldContexts(fieldId: string, contextIds?: number[], startAt = 0) {
    return this.jiraClient.issueCustomFieldContexts.getIssueTypeMappingsForContexts({
      fieldId: fieldId,
      contextId: contextIds,
      startAt: startAt,
    });
  }

  async getIssueFieldOptions(fieldId: string, contextId: number, startAt = 0) {
    return this.jiraClient.issueCustomFieldOptions.getOptionsForContext({
      fieldId: fieldId,
      contextId: contextId,
      startAt: startAt,
    });
  }

  async getProjectIssueCreateMeta(projectId: string) {
    return this.jiraClient.issues.getCreateIssueMeta({
      projectIds: [projectId],
      expand: "projects.issuetypes.fields",
    });
  }

  async getProjectIssues(projectKey: string, nextPageToken?: string, createdAfter?: string, jql?: string) {
    // Assertion: Project key is appended to the provided jql
    return this.jiraClient.issueSearch.searchForIssuesUsingJqlEnhancedSearch({
      jql: jql
        ? jql
        : createdAfter
          ? `project = "${projectKey}" AND (created >= "${createdAfter}" OR updated >= "${createdAfter}")`
          : `project = "${projectKey}"`,
      expand: "renderedFields",
      fields: ["*all"],
      nextPageToken: nextPageToken,
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

  async getNumberOfLabels(projectKey: string) {
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

  async getResources(): Promise<JiraResource[]> {
    const axiosInstance = axios.create({
      baseURL: "https://api.atlassian.com",
    });

    axiosInstance.interceptors.request.use(
      async (config: any) => {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
        return config;
      },
      (error) => Promise.reject(error)
    );

    const response = await axiosInstance.get("/oauth/token/accessible-resources");

    return response.data;
  }
}

export default JiraService;
