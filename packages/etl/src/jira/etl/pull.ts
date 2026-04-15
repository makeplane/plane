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

import type {
  Issue as IJiraIssue,
  ComponentWithIssueCount,
  Comment as JComment,
  IssueTypeDetails as JiraIssueTypeDetails,
  FieldDetails,
  IssueTypeToContextMapping,
  CustomFieldContextOption,
} from "jira.js/out/version3/models/index.js";
import { isAxiosError } from "axios";
import Papa from "papaparse";
import type { JiraService } from "@/jira/services";
import type {
  ImportedJiraUser,
  JiraComment,
  JiraComponent,
  JiraSprint,
  PaginatedResponse,
  JiraIssueField,
  JiraIssueFieldOptions,
  JiraCustomFieldKeys,
} from "@/jira/types";
import {
  fetchPaginatedData,
  formatDateStringForHHMM,
  OPTION_CUSTOM_FIELD_TYPES,
  removeArrayObjSpaces,
} from "../helpers";

export function pullUsers(users: string): ImportedJiraUser[] {
  const jiraUsersObject = Papa.parse(users, { header: true, skipEmptyLines: true }).data;
  return removeArrayObjSpaces(jiraUsersObject) as ImportedJiraUser[];
}

export async function pullLabels(client: JiraService): Promise<string[]> {
  const labels: string[] = [];
  try {
    await fetchPaginatedData(
      (startAt) => client.getResourceLabels(startAt),
      (values) => labels.push(...(values as string[])),
      "values"
    );
  } catch (error) {
    console.log("Error while pulling labels", error);
  }

  return labels;
}

export async function pullIssues(
  client: JiraService,
  projectKey: string,
  from?: Date,
  jql?: string
): Promise<IJiraIssue[]> {
  const issues: IJiraIssue[] = [];

  let nextPageToken = undefined;
  do {
    const response = await client.getProjectIssues(
      projectKey,
      nextPageToken,
      from ? formatDateStringForHHMM(from) : "",
      jql
    );
    issues.push(...(response.issues as IJiraIssue[]));
    nextPageToken = response.nextPageToken;
  } while (nextPageToken);

  return issues;
}

/**
 * Pull issues using nextPageToken pagination (Jira Cloud Enhanced Search API)
 * Note: Enhanced Search API does not return total count, only nextPageToken for pagination
 */
export async function pullIssuesV2(
  ctx: {
    client: JiraService;
    nextPageToken?: string;
    maxResults?: number;
  },
  projectKey: string,
  // We are using this property for the pagination context
  total = 0,
  from?: Date,
  jql?: string
): Promise<{
  items: IJiraIssue[];
  hasMore: boolean;
  total?: number;
  nextPageToken?: string;
}> {
  const { client, nextPageToken } = ctx;
  const result = await client.getProjectIssues(
    projectKey,
    nextPageToken,
    from ? formatDateStringForHHMM(from) : "",
    jql
  );

  return {
    items: result.issues || [],
    hasMore: !!result.nextPageToken,
    total: total,
    nextPageToken: result.nextPageToken,
  };
}

export async function pullComments(issues: IJiraIssue[], client: JiraService): Promise<any[]> {
  const comments: JiraComment[] = [];

  try {
    // Pull comments for each issue
    for (const issue of issues) {
      const issueComments = await pullCommentsForIssue(issue, client);
      comments.push(...issueComments);
    }
  } catch (error) {
    console.log("Error while pulling comments for issues", error);
  }

  return comments;
}

export async function pullSprints(client: JiraService, projectId: string): Promise<JiraSprint[]> {
  const jiraSprints: JiraSprint[] = [];
  try {
    const boards = await client.getProjectBoards(projectId);
    for (const board of boards.values) {
      const sprints = await client.getBoardSprints(board.id as number);
      for (const sprint of sprints.values) {
        const boardIssues: unknown[] = [];
        await fetchPaginatedData(
          (startAt) =>
            client.getBoardSprintsIssues(board.id as number, sprint.id, startAt) as Promise<PaginatedResponse>,
          (values) => boardIssues.push(...(values as IJiraIssue[])),
          "issues"
        );
        jiraSprints.push({ sprint, issues: boardIssues as IJiraIssue[] });
      }
    }
  } catch (e: any) {
    console.error("Could not fetch sprints, something went wrong", e.response?.data);
  }
  return jiraSprints;
}

export async function pullComponents(client: JiraService, projectKey: string): Promise<JiraComponent[]> {
  const jiraComponents: JiraComponent[] = [];
  try {
    const jiraComponentObjects: ComponentWithIssueCount[] = await client.getProjectComponents(projectKey);
    for (const component of jiraComponentObjects) {
      let nextPageToken = undefined;
      const issues: IJiraIssue[] = [];
      do {
        const response = await client.getProjectComponentIssues(component.id!, nextPageToken);
        issues.push(...(response.issues as IJiraIssue[]));
        nextPageToken = response.nextPageToken;
      } while (nextPageToken);

      if (issues) {
        jiraComponents.push({ component, issues: issues });
      }
    }
  } catch (e: any) {
    console.error("Could not fetch components, something went wrong", e.response?.data);
  }
  return jiraComponents;
}

export const pullCommentsForIssue = async (issue: IJiraIssue, client: JiraService): Promise<JiraComment[]> => {
  const comments: JiraComment[] = [];
  await fetchPaginatedData(
    (startAt) => client.getIssueComments(issue.id, startAt),
    (values) => {
      const jiraComments = values.map(
        (comment): JiraComment => ({
          ...(comment as JComment),
          issue_id: issue.id,
        })
      );
      comments.push(...jiraComments);
    },
    "comments"
  );
  return comments;
};

export const pullIssueTypes = async (client: JiraService, projectId: string): Promise<JiraIssueTypeDetails[]> => {
  try {
    return await client.getProjectIssueTypes(projectId);
  } catch (error) {
    console.log("Error while pulling issue types", error);
    return [];
  }
};

export const pullIssueFields = async (
  client: JiraService,
  issueTypes: JiraIssueTypeDetails[],
  projectId: string
): Promise<JiraIssueField[]> => {
  // initialize custom fields
  const customFields: JiraIssueField[] = [];
  try {
    // initialize fields
    const allFields: FieldDetails[] = await client.getCustomFields();
    const filteredFields = allFields.filter((field) => field.custom);

    // get all field contexts
    for (const field of filteredFields) {
      // skip if field has no id
      if (!field.id) continue;

      const issueTypeContexts: IssueTypeToContextMapping[] = [];

      // get issue type contexts
      try {
        await fetchPaginatedData(
          (startAt) => client.getIssueTypeFieldContexts(field.id as string, undefined, startAt),
          (values) => issueTypeContexts.push(...(values as IssueTypeToContextMapping[])),
          "values"
        );
      } catch (e: any) {
        console.error(`Could not fetch issue type contexts for field ${field.id}`, e.response?.data);
      }

      // get issue type for each issue type context
      if (!issueTypeContexts) continue;

      for (const issueTypeContext of issueTypeContexts) {
        const issueTypesToAdd = [];

        if (issueTypeContext.isAnyIssueType) {
          // Add for all available issue types
          issueTypesToAdd.push(...issueTypes);
        } else {
          const issueType = issueTypes.find((issueType) => issueType.id === issueTypeContext.issueTypeId);
          if (issueType) issueTypesToAdd.push(issueType);
        }

        if (issueTypesToAdd.length === 0) continue;

        const fieldOptions: JiraIssueFieldOptions[] = [];
        if (OPTION_CUSTOM_FIELD_TYPES.includes(field.schema?.custom as JiraCustomFieldKeys)) {
          // get field options
          await fetchPaginatedData(
            (startAt) => client.getIssueFieldOptions(field.id as string, Number(issueTypeContext.contextId), startAt),
            (values: CustomFieldContextOption[]) => {
              values.map((value) => {
                if (field.id)
                  fieldOptions.push({
                    ...value,
                    fieldId: field.id.includes("customfield_") ? field.id.split("_").pop()! : field.id,
                  });
              });
            },
            "values"
          );
        }

        // add field to custom fields
        issueTypesToAdd.forEach((type) => {
          customFields.push({
            ...field,
            scope: {
              project: { id: projectId },
              type: type.id,
            },
            options: fieldOptions,
          });
        });
      }
    }
  } catch (e: any) {
    console.error(e.response?.data);
  }
  // return custom fields
  return customFields;
};
