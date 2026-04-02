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

import type { Board, Sprint } from "jira.js/out/agile/models/index.js";
import type {
  Issue as IJiraIssue,
  ComponentWithIssueCount,
  Comment as JComment,
  IssueTypeDetails as JiraIssueTypeDetails,
  Worklog,
  FieldDetails,
  Version,
} from "jira.js/out/version2/models/index.js";
import type {
  ImportedJiraUser,
  JiraComment,
  PaginatedResponse,
  JiraIssueField,
  JiraIssueFieldOptions,
  JiraCustomFieldKeys,
  JiraV2Service,
} from "..";
import { fetchPaginatedDataByKey, formatDateStringForHHMM, OPTION_CUSTOM_FIELD_TYPES } from "../helpers";
import { isAxiosError } from "axios";

type BasePaginationContext = {
  client: JiraV2Service;
  startAt: number;
  maxResults: number;
};

/**
 * Paginated result with metadata
 */
export type PaginatedResult<T> = {
  items: T[];
  hasMore: boolean;
  total?: number;
  startAt: number;
  maxResults: number;
};

export async function pullUsersV2(ctx: BasePaginationContext): Promise<PaginatedResult<ImportedJiraUser>> {
  const { client, startAt, maxResults } = ctx;
  const result = await client.getJiraUsers(startAt, maxResults);

  const users: ImportedJiraUser[] = result
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

  return {
    items: users,
    hasMore: users.length === maxResults,
    total: users.length, // API doesn't return total
    startAt,
    maxResults,
  };
}

export async function pullLabelsV2(ctx: BasePaginationContext): Promise<PaginatedResult<string>> {
  const { client, startAt, maxResults } = ctx;
  const result = await client.getLabelsV2(startAt, maxResults);

  return {
    items: result.values || [],
    hasMore: result.isLast === false,
    total: result.total,
    startAt,
    maxResults,
  };
}

export async function pullVersions(ctx: BasePaginationContext, projectKey: string): Promise<PaginatedResult<Version>> {
  const { client, startAt, maxResults } = ctx;
  const result = await client.getVersionsPaginated(projectKey, startAt, maxResults);

  return {
    items: result.values || [],
    hasMore: result.isLast === false,
    total: result.total,
    startAt,
    maxResults,
  };
}

export async function pullIssuesV2(
  ctx: BasePaginationContext,
  projectKey: string,
  from?: Date,
  jql?: string
): Promise<PaginatedResult<IJiraIssue>> {
  const { client, startAt, maxResults } = ctx;
  const result = await client.getProjectIssues(
    projectKey,
    startAt,
    from ? formatDateStringForHHMM(from) : "",
    maxResults,
    jql
  );

  return {
    items: result.issues || [],
    hasMore: result.total ? startAt + (result.issues?.length || 0) < result.total : false,
    total: result.total,
    startAt,
    maxResults,
  };
}

export async function pullBoardsV2(ctx: BasePaginationContext, projectId: string): Promise<PaginatedResult<Board>> {
  const { client, startAt, maxResults } = ctx;
  const result = await client.getProjectBoards(projectId, startAt, maxResults);

  return {
    items: result.values || [],
    hasMore: result.isLast === false,
    total: result.total,
    startAt,
    maxResults,
  };
}

export async function pullSprintsForBoardV2(
  ctx: BasePaginationContext,
  boardId: number
): Promise<PaginatedResult<Sprint>> {
  const { client, startAt, maxResults } = ctx;
  const result = await client.getBoardSprints(boardId, startAt, maxResults);

  return {
    items: result.values || [],
    hasMore: result.isLast === false,
    total: result.total,
    startAt,
    maxResults,
  };
}

export async function getSprintIssuesV2(
  ctx: BasePaginationContext,
  boardId: number,
  sprintId: number
): Promise<PaginatedResult<IJiraIssue>> {
  const { client, startAt, maxResults } = ctx;
  const result = (await client.getBoardSprintsIssues(boardId, sprintId, startAt, maxResults)) as PaginatedResponse;

  return {
    items: (result.issues as IJiraIssue[]) || [],
    hasMore: result.total ? startAt + (result.issues?.length || 0) < result.total : false,
    total: result.total,
    startAt,
    maxResults,
  };
}

export async function pullComponentsV2(
  ctx: BasePaginationContext,
  projectKey: string
): Promise<PaginatedResult<ComponentWithIssueCount>> {
  const { client, startAt, maxResults } = ctx;

  try {
    const result = await client.getProjectComponents(projectKey);

    return {
      items: result || [],
      hasMore: false,
      total: result.length,
      startAt,
      maxResults,
    };
  } catch (e: any) {
    console.error("Could not fetch components, something went wrong", e.response?.data);
    return {
      items: [],
      hasMore: false,
      total: 0,
      startAt,
      maxResults,
    };
  }
}

export async function pullComponentIssuesV2(
  ctx: BasePaginationContext,
  componentId: string
): Promise<PaginatedResult<IJiraIssue>> {
  const { client, startAt, maxResults } = ctx;
  const result = (await client.getProjectComponentIssues(componentId, startAt, maxResults)) as PaginatedResponse;

  return {
    items: (result.issues as IJiraIssue[]) || [],
    hasMore: result.total ? startAt + (result.issues?.length || 0) < result.total : false,
    total: result.total,
    startAt,
    maxResults,
  };
}

export const pullAllCommentsForIssue = async (issue: IJiraIssue, client: JiraV2Service): Promise<JiraComment[]> => {
  const values = await fetchPaginatedDataByKey<JComment>(
    (startAt) => client.getIssueComments(issue.id, startAt, 500),
    "comments"
  );

  return values.map(
    (comment): JiraComment => ({
      ...comment,
      issue_id: issue.id,
    })
  );
};

export const pullAllWorklogsForIssue = async (issue: IJiraIssue, client: JiraV2Service): Promise<Worklog[]> => {
  const values = await fetchPaginatedDataByKey<Worklog>(
    (startAt) => client.getIssueWorklogs(issue.id, startAt, 500),
    "worklogs"
  );

  return values.map((worklog) => ({
    ...worklog,
    issue_id: issue.id,
  }));
};

export async function pullCommentsForIssueV2(
  ctx: BasePaginationContext,
  issue: IJiraIssue
): Promise<PaginatedResult<JiraComment>> {
  const { client, startAt, maxResults } = ctx;
  const result = await client.getIssueComments(issue.id, startAt, maxResults);

  const comments: JiraComment[] = (result.comments || []).map(
    (comment): JiraComment => ({
      ...comment,
      issue_id: issue.id,
    })
  );

  return {
    items: comments,
    hasMore: result.total ? startAt + comments.length < result.total : false,
    total: result.total,
    startAt,
    maxResults,
  };
}

export async function pullIssueTypesV2(
  ctx: BasePaginationContext,
  projectId: string
): Promise<PaginatedResult<JiraIssueTypeDetails>> {
  const { client, startAt, maxResults } = ctx;
  const result = await client.getPaginatedIssueTypes(projectId, startAt, maxResults);
  return {
    items: result.values || [],
    hasMore: result.isLast === false,
    total: result.total,
    startAt,
    maxResults,
  };
}

/**
 * Issue fields - no pagination, but takes issue types as dependency
 */
export async function pullIssueFieldsV2(
  client: JiraV2Service,
  projectKey: string,
  projectId: string,
  projectIssueTypes: JiraIssueTypeDetails[]
): Promise<JiraIssueField[]> {
  const customFields: JiraIssueField[] = [];

  try {
    // Get custom fields directly
    const fieldInfos: FieldDetails[] = [];

    const fieldInfosFromScreens = await client.getScreensCustomFieldsForProject(projectKey).catch((e: unknown) => {
      console.error("Error fetching custom fields from screens", isAxiosError(e) ? e.response?.data : e);
      return [] as FieldDetails[];
    });

    if (fieldInfosFromScreens.length > 0) {
      fieldInfos.push(...fieldInfosFromScreens);
    } else {
      const allCustomFields = await client.getCustomFields().catch((e: unknown) => {
        console.error("Error fetching custom fields", isAxiosError(e) ? e.response?.data : e);
        return [] as FieldDetails[];
      });
      fieldInfos.push(...allCustomFields);
    }

    if (fieldInfos.length === 0) return [];

    // Get custom fields with context
    const fieldsWithCtx = await client.getCustomFieldsWithContext();

    for (const field of fieldsWithCtx) {
      let associatedIssueTypes = projectIssueTypes;

      if (field.issueTypeIds && field.issueTypeIds.length > 0) {
        associatedIssueTypes = projectIssueTypes.filter((projectIssueType) =>
          field.issueTypeIds.includes(projectIssueType.id ?? "")
        );
      }

      const fieldInfo = fieldInfos.find((fieldInfo) => fieldInfo.id === field.id);
      if (!fieldInfo) continue;

      const fieldOptions: JiraIssueFieldOptions[] = OPTION_CUSTOM_FIELD_TYPES.includes(
        fieldInfo?.schema?.custom as JiraCustomFieldKeys
      )
        ? await getFieldOptionsV2(client, field.numericId.toString(), projectId)
        : [];

      associatedIssueTypes.forEach((issueType) => {
        const payload = {
          ...fieldInfo,
          scope: {
            project: { id: projectId },
            type: issueType.id,
          },
          options: fieldOptions,
        };

        customFields.push(payload);
      });
    }
  } catch (e) {
    if (isAxiosError(e)) {
      console.error("Error fetching custom fields", e.response?.data);
    } else {
      console.error("Error fetching custom fields", e);
    }
  }

  return customFields;
}

/**
 * Helper function to get field options
 */
async function getFieldOptionsV2(
  client: JiraV2Service,
  fieldId: string,
  projectId?: string,
  issueTypeId?: string
): Promise<JiraIssueFieldOptions[]> {
  const fieldOptions: JiraIssueFieldOptions[] = [];

  try {
    const options = await client.getIssueFieldOptions(fieldId, projectId, issueTypeId);

    if (options) {
      options.forEach((value) => {
        fieldOptions.push({
          ...value,
          fieldId: fieldId,
        });
      });
    }
  } catch (e) {
    if (isAxiosError(e)) {
      console.error(`Could not fetch field options for field ${fieldId}`, e.response?.data);
    } else {
      console.error(`Could not fetch field options for field ${fieldId}`, e);
    }
  }

  return fieldOptions;
}
