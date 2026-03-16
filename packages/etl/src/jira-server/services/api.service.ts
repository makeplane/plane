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
import type { Paginated } from "jira.js";
import { Board as BoardClient } from "jira.js/out/agile/index.js";
import { Version2Client } from "jira.js/out/version2/index.js";
import type {
  CustomFieldContextOption,
  FieldDetails,
  Issue,
  JiraStatus,
  Project,
  IssueTypeDetails,
  StatusDetails,
} from "jira.js/out/version2/models/index.js";
import type { JiraCustomFieldWithCtx } from "@/jira-server/types/custom-fields";
import type { JiraApiUser, JiraProps } from "..";
import { fetchPaginatedData, EJiraAuthenticationType } from "..";

export class JiraV2Service {
  private jiraClient: Version2Client;
  private hostname: string;
  private patToken: string;
  private email: string;
  private authenticationType: EJiraAuthenticationType = EJiraAuthenticationType.PERSONAL_ACCESS_TOKEN;

  constructor(props: JiraProps) {
    this.hostname = props.hostname;
    this.patToken = props.patToken;
    this.email = props.email;
    this.authenticationType = props.authenticationType;

    if (this.authenticationType === EJiraAuthenticationType.BASIC) {
      this.jiraClient = new Version2Client({
        host: props.hostname,
        authentication: {
          basic: {
            email: this.email,
            apiToken: props.patToken,
          },
        },
      });
    } else {
      this.jiraClient = new Version2Client({
        host: props.hostname,
        authentication: {
          personalAccessToken: props.patToken,
        },
      });
    }

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

  async getServerInfo() {
    return this.jiraClient.serverInfo.getServerInfo();
  }

  // Verified
  async getCurrentUser() {
    return await this.jiraClient.myself.getCurrentUser();
  }

  async getJiraUsers(startAt?: number, maxResults?: number): Promise<JiraApiUser[]> {
    // @ts-expect-error - Ignoring ts error for return type
    return (await this.jiraClient.userSearch.findUsers({
      username: ".",
      // @ts-expect-error - Ignoring ts error for includeActive
      includeActive: true,
      startAt: startAt ?? 0,
      maxResults: maxResults ?? 1000,
    })) as JiraApiUser[];
  }

  async getIssueWorklogs(issueId: string, startAt: number, maxResults: number) {
    return this.jiraClient.issueWorklogs.getIssueWorklog({
      issueIdOrKey: issueId,
      startAt: startAt,
      maxResults: maxResults,
    });
  }

  // Verified
  async getNumberOfIssues(projectKey: string, jql?: string) {
    const issues = await this.jiraClient.issueSearch.searchForIssuesUsingJql({
      jql: jql ? jql : `project = "${projectKey}"`,
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
    try {
      return await fetchPaginatedData<StatusDetails>((startAt) =>
        axios
          .get(`${this.hostname}/rest/api/2/status/page?projectIds=${projectId}&startAt=${startAt}`, {
            headers: {
              Authorization: `Bearer ${this.patToken}`,
            },
          })
          .then((res) => res.data as Paginated<StatusDetails>)
      );
    } catch (e) {
      console.error("error getProjectStatuses", e);
      throw e;
    }
  }

  // Verified
  async getFields() {
    return this.jiraClient.issueFields.getFields();
  }

  // Verified
  async getProjectComponents(projectId: string) {
    return await this.jiraClient.projectComponents.getProjectComponents({
      projectIdOrKey: projectId,
    });
  }

  async getIssueWatchers(issueIdOrKey: string) {
    return this.jiraClient.issueWatchers.getIssueWatchers({
      issueIdOrKey,
    });
  }

  // Verified
  async getProjectComponentIssues(componentId: string, startAt?: number, maxResults?: number) {
    return this.jiraClient.issueSearch.searchForIssuesUsingJql({
      jql: `component = "${componentId}"`,
      startAt: startAt ?? 0,
      maxResults: maxResults ?? 100,
    });
  }

  // Verified
  async getBoardSprints(boardId: number, startAt?: number, maxResults?: number) {
    const board = new BoardClient(this.jiraClient);
    return board.getAllSprints({
      boardId: boardId,
      startAt: startAt ?? 0,
      maxResults: maxResults ?? 50,
    });
  }

  // Verified
  async getBoardSprintsIssues(boardId: number, sprintId: number, startAt: number, maxResults?: number) {
    const board = new BoardClient(this.jiraClient);
    return board.getBoardIssuesForSprint({
      boardId: boardId,
      sprintId: sprintId,
      startAt: startAt,
      maxResults: maxResults ?? 50,
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
  async getProjectBoards(projectId: string, startAt?: number, maxResults?: number) {
    const board = new BoardClient(this.jiraClient);
    return board.getAllBoards({
      projectKeyOrId: projectId,
      startAt: startAt ?? 0,
      maxResults: maxResults ?? 50,
    });
  }

  // Verified
  async getIssuePriorities() {
    return this.jiraClient.issuePriorities.getPriorities();
  }

  // Verified
  async getAllProjectLabels(projectId: string) {
    try {
      const allLabels = await fetchPaginatedData<string>((startAt) => this.getProjectLabels(projectId, startAt));
      return Array.from(new Set(allLabels));
    } catch (error) {
      console.error("error getAllProjectLabels", error);
      return [];
    }
  }

  async getLabelsV2(startAt?: number, maxResults?: number) {
    return this.jiraClient.labels.getAllLabels({
      startAt: startAt ?? 0,
      maxResults: maxResults ?? 1000,
    });
  }

  // Verified
  async getProjectLabels(projectId: string, startAt = 0, maxResults = 100) {
    const response = await axios.get(`${this.hostname}/rest/api/2/search`, {
      params: {
        jql: `project = "${projectId}" AND labels is not EMPTY`,
        fields: ["labels"],
        startAt: startAt,
        maxResults: maxResults,
      },
      headers: {
        Authorization: `Bearer ${this.patToken}`,
      },
    });

    const data = response.data;
    const issues = data.issues as Issue[];

    const allLabels = new Set();
    issues.forEach((issue) => {
      if (issue.fields.labels) {
        issue.fields.labels.forEach((label) => allLabels.add(label));
      }
    });

    return {
      values: Array.from(allLabels) as string[],
      total: data.total,
      maxResults: data.maxResults || issues.length,
      isLast: data.total ? startAt + issues.length >= data.total : issues.length === 0,
    };
  }

  // Verified
  async getResourceProjects(key: string = ""): Promise<Project[]> {
    return this.jiraClient.projects.getProject({
      projectIdOrKey: key,
    });
  }

  // Verified
  async getPaginatedIssueTypes(projectId: string, startAt?: number, maxResults?: number) {
    try {
      return await this.jiraClient
        .sendRequestFullResponse<Paginated<IssueTypeDetails>>({
          method: "GET",
          url: `${this.hostname}/rest/api/2/issuetype/page?projectIds=${projectId}&startAt=${startAt}&maxResults=${maxResults}`,
        })
        .then((res) => res.data);
    } catch (e) {
      console.error("error getProjectIssueTypes", e);
      throw e;
    }
  }

  // Verified
  async getCustomFields() {
    const fields: FieldDetails[] = await this.jiraClient.issueFields.getFields();
    const customFields: FieldDetails[] = fields.filter((field) => field.custom === true);
    return customFields;
  }

  async getCustomFieldsWithContext(projectId?: string) {
    try {
      const result = await this.jiraClient.sendRequestFullResponse<Paginated<JiraCustomFieldWithCtx>>({
        method: "GET",
        url: `${this.hostname}/rest/api/2/customFields?maxResults=10000`,
      });
      return result.data.values;
    } catch (e) {
      console.error("error getCustomFieldsWithContext", e);
      throw e;
    }
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

  async getAllResolutions() {
    return this.jiraClient.issueResolutions.getResolutions();
  }

  async getIssueFieldOptions(fieldId: string, projectId?: string, issueTypeId?: string) {
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

  async getProjectIssues(projectKey: string, startAt = 0, createdAfter?: string, maxResults = 100, jql?: string) {
    return this.jiraClient.issueSearch.searchForIssuesUsingJql({
      jql: jql
        ? jql
        : createdAfter
          ? `project = "${projectKey}" AND (created >= "${createdAfter}" OR updated >= "${createdAfter}") ORDER BY created ASC`
          : `project = "${projectKey}" ORDER BY created ASC`,
      expand: "renderedFields,changelog",
      fields: ["*all", "sprints", "closedSprints"],
      startAt,
      maxResults: maxResults,
    });
  }

  async getAllLabels() {
    return await fetchPaginatedData<string>((startAt) =>
      this.jiraClient.labels.getAllLabels({
        startAt,
        maxResults: 1000,
      })
    );
  }

  async getNumberOfLabels() {
    const labels = await this.jiraClient.labels.getAllLabels();
    return labels.total;
  }

  async getProjectUsers(projectKey: string, startAt?: number, maxResults?: number) {
    return this.jiraClient.userSearch.findAssignableUsers({
      project: projectKey,
      startAt: startAt ?? 0,
      maxResults: maxResults ?? 100,
    });
  }

  async getIssueComments(issueId: string, startAt: number, maxResults = 100) {
    return await this.jiraClient.issueComments.getComments({
      issueIdOrKey: issueId,
      startAt: startAt,
      maxResults: maxResults,
      expand: "renderedBody",
    });
  }
}

export default JiraV2Service;
