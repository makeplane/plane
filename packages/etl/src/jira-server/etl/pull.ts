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
} from "jira.js/out/version2/models/index.js";
import type {
  ImportedJiraUser,
  JiraComment,
  JiraComponent,
  JiraSprint,
  PaginatedResponse,
  JiraIssueField,
  JiraIssueFieldOptions,
  JiraCustomFieldKeys,
  JiraV2Service,
} from "..";
import { fetchPaginatedDataByKey, formatDateStringForHHMM, OPTION_CUSTOM_FIELD_TYPES } from "../helpers";

export async function pullUsers(client: JiraV2Service): Promise<ImportedJiraUser[]> {
  const jiraUsers = await client.getJiraUsers();
  const users: ImportedJiraUser[] = jiraUsers
    .map((user): ImportedJiraUser | undefined => {
      if (!user.emailAddress) return;

      const avatarUrl = user.avatarUrls["24x24"];

      return {
        avatarUrl: avatarUrl,
        user_id: user.key,
        email: user.emailAddress,
        full_name: user.displayName,
        user_name: user.name,
        added_to_org: "",
        org_role: "None",
        user_status: "Active",
      };
    })
    .filter((user): user is ImportedJiraUser => user !== undefined);
  return users;
}

export async function pullLabels(client: JiraV2Service, projectId: string): Promise<string[]> {
  const labels: string[] = await client.getAllProjectLabels(projectId);
  return labels;
}

export async function pullIssues(client: JiraV2Service, projectKey: string, from?: Date): Promise<IJiraIssue[]> {
  return await fetchPaginatedDataByKey<IJiraIssue>(
    (startAt) => client.getProjectIssues(projectKey, startAt, from ? formatDateStringForHHMM(from) : ""),
    "issues"
  );
}

export async function pullComments(issues: IJiraIssue[], client: JiraV2Service): Promise<JiraComment[]> {
  return await pullCommentsInBatches(issues, 20, client);
}

export async function pullSprints(client: JiraV2Service, projectId: string): Promise<JiraSprint[]> {
  const jiraSprints: JiraSprint[] = [];
  try {
    const boards = await client.getProjectBoards(projectId);
    for (const board of boards.values) {
      const sprints = await client.getBoardSprints(board.id as number);
      for (const sprint of sprints.values) {
        const boardIssues = await fetchPaginatedDataByKey<IJiraIssue>(
          (startAt) =>
            client.getBoardSprintsIssues(board.id as number, sprint.id, startAt) as Promise<PaginatedResponse>,
          "issues"
        );
        jiraSprints.push({ sprint, issues: boardIssues });
      }
    }
  } catch (e: any) {
    console.error("Could not fetch sprints, something went wrong", e.response?.data);
  }
  return jiraSprints;
}

export async function pullComponents(client: JiraV2Service, projectKey: string): Promise<JiraComponent[]> {
  const jiraComponents: JiraComponent[] = [];
  try {
    const result = await client.getProjectComponents(projectKey);
    if (!result.values) return [];
    const jiraComponentObjects: ComponentWithIssueCount[] = result;
    for (const component of jiraComponentObjects) {
      const issues = await client.getProjectComponentIssues(component.id!);
      if (issues.issues) {
        jiraComponents.push({ component, issues: issues.issues });
      }
    }
  } catch (e: any) {
    console.error("Could not fetch components, something went wrong", e.response?.data);
  }
  return jiraComponents;
}

export const pullCommentsForIssue = async (issue: IJiraIssue, client: JiraV2Service): Promise<JiraComment[]> => {
  const values = await fetchPaginatedDataByKey<JComment>(
    (startAt) => client.getIssueComments(issue.id, startAt),
    "comments"
  );

  return values.map(
    (comment): JiraComment => ({
      ...comment,
      issue_id: issue.id,
    })
  );
};

export const pullCommentsInBatches = async (
  issues: IJiraIssue[],
  batchSize: number,
  client: JiraV2Service
): Promise<JiraComment[]> => {
  const comments: JiraComment[] = [];
  for (let i = 0; i < issues.length; i += batchSize) {
    const batch = issues.slice(i, i + batchSize);
    const batchComments = await Promise.all(batch.map((issue) => pullCommentsForIssue(issue, client)));
    comments.push(...batchComments.flat());
  }
  return comments;
};

export const pullIssueTypes = async (client: JiraV2Service, projectId: string): Promise<JiraIssueTypeDetails[]> => [];

export const pullIssueFields = async (client: JiraV2Service, projectId: string): Promise<JiraIssueField[]> => {
  const customFields: JiraIssueField[] = [];

  try {
    // Get custom fields directly
    const fields: FieldDetails[] = await client.getCustomFields();
    const fieldsWithCtx = await client.getCustomFieldsWithContext();
    const projectIssueTypes: JiraIssueTypeDetails[] = [];

    const mappedFields = fieldsWithCtx
      .map((field) => ({
        ...field,
        fieldInfo: fields.find((f) => f.id === field.id),
      }))
      .filter((field) => field.isAllProjects || field.projectIds.includes(Number(projectId)));

    for (const field of mappedFields) {
      if (!field.fieldInfo) continue;

      const resolveFieldPromises = field.issueTypeIds.map(async (issueTypeId: any) => {
        const issueType = projectIssueTypes.find((type) => type.id === issueTypeId);

        if (!issueType) return;

        const fieldOptions: JiraIssueFieldOptions[] = OPTION_CUSTOM_FIELD_TYPES.includes(
          field.fieldInfo?.schema?.custom as JiraCustomFieldKeys
        )
          ? await getFieldOptions(client, field.numericId.toString(), projectId, issueTypeId)
          : [];

        return {
          ...field.fieldInfo,
          scope: {
            project: { id: projectId },
            type: issueTypeId,
          },
          options: fieldOptions,
        };
      });

      const resolvedFields: any = (await Promise.all(resolveFieldPromises)).filter((field) => field !== undefined);
      customFields.push(...resolvedFields);
    }
  } catch (e: any) {
    console.error("Error fetching custom fields", e.response?.data);
  }

  return customFields;
};

// Helper function to get field options
async function getFieldOptions(
  client: JiraV2Service,
  fieldId: string,
  projectId: string,
  issueTypeId: string
): Promise<JiraIssueFieldOptions[]> {
  const fieldOptions: JiraIssueFieldOptions[] = [];

  try {
    // We'll use a single context approach
    const options = await client.getIssueFieldOptions(fieldId, projectId, issueTypeId);

    if (options) {
      options.forEach((value) => {
        fieldOptions.push({
          ...value,
          fieldId: fieldId,
        });
      });
    }
  } catch (e: any) {
    console.error(`Could not fetch field options for field ${fieldId}`, e.response?.data);
  }

  return fieldOptions;
}
