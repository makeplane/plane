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

import { set } from "lodash-es";
// plane imports
import { DEFAULT_WORK_ITEM_FORM_VALUES, ISSUE_PRIORITIES } from "@plane/constants";
import type {
  IPartialProject,
  IProject,
  ISearchIssueResponse,
  IState,
  IUser,
  TIssue,
  TIssuePriorities,
} from "@plane/types";
import { renderFormattedPayloadDate } from "../datetime";

export const getUpdateFormDataForReset = (projectId: string | null | undefined, formData: Partial<TIssue>) => ({
  ...DEFAULT_WORK_ITEM_FORM_VALUES,
  project_id: projectId,
  name: formData.name,
  description_html: formData.description_html,
  priority: formData.priority,
  start_date: formData.start_date,
  target_date: formData.target_date,
});

export const convertWorkItemDataToSearchResponse = (
  workspaceSlug: string,
  workItem: TIssue,
  project: IPartialProject | undefined,
  state: IState | undefined
): ISearchIssueResponse => ({
  id: workItem.id,
  name: workItem.name,
  project_id: workItem.project_id ?? "",
  project__identifier: project?.identifier ?? "",
  project__name: project?.name ?? "",
  sequence_id: workItem.sequence_id,
  type_id: workItem.type_id ?? "",
  state__color: state?.color ?? "",
  start_date: workItem.start_date,
  state__group: state?.group ?? "backlog",
  state__name: state?.name ?? "",
  workspace__slug: workspaceSlug,
});

export function getChangedIssuefields(formData: Partial<TIssue>, dirtyFields: { [key: string]: boolean | undefined }) {
  const changedFields = {};

  const dirtyFieldKeys = Object.keys(dirtyFields) as (keyof TIssue)[];
  for (const dirtyField of dirtyFieldKeys) {
    if (dirtyFields[dirtyField]) {
      set(changedFields, [dirtyField], formData[dirtyField]);
    }
  }

  return changedFields as Partial<TIssue>;
}

export function parseQueryParamsToFormData(args: {
  currentUserId: string;
  projects: Pick<IProject, "id" | "identifier">[];
  queryParams: Record<string, unknown>;
  users: Pick<IUser, "id" | "display_name">[];
}): Partial<TIssue> {
  const { currentUserId, projects, queryParams, users } = args;
  const formData: Partial<TIssue> = {};
  try {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (typeof value !== "string") return;
      switch (key) {
        case "description":
          formData.description_html = value;
          break;
        case "title":
          formData.name = value;
          break;
        case "project": {
          const project = projects.find((p) => p.identifier.toLowerCase() === value.toLowerCase() || p.id === value);
          if (project) {
            formData.project_id = project.id;
          }
          break;
        }
        case "priority": {
          const priority = ISSUE_PRIORITIES.find(
            (p) => p.key.toLowerCase() === (value.toLowerCase() as TIssuePriorities)
          );
          if (priority) {
            formData.priority = priority.key;
          }
          break;
        }
        case "assignee": {
          const userIds = value.split(",");
          const assigneeIds: string[] = [];
          userIds.forEach((userId) => {
            if (userId === "me" && !assigneeIds.includes(currentUserId)) {
              assigneeIds.push(currentUserId);
            }

            const user = users.find((u) => u.display_name.toLowerCase() === userId.toLowerCase() || u.id === userId);
            if (user && !assigneeIds.includes(user.id)) {
              assigneeIds.push(user.id);
            }
          });
          if (assigneeIds.length > 0) {
            formData.assignee_ids = assigneeIds;
          }
          break;
        }
        case "start_date": {
          const normalizedDate = new Date(value);
          if (!Number.isNaN(normalizedDate.getTime())) {
            const formattedStartDate = renderFormattedPayloadDate(normalizedDate);
            if (formattedStartDate) {
              formData.start_date = formattedStartDate;
            }
          }
          break;
        }
        case "due_date": {
          const normalizedDate = new Date(value);
          if (!Number.isNaN(normalizedDate.getTime())) {
            const formattedTargetDate = renderFormattedPayloadDate(normalizedDate);
            if (formattedTargetDate) {
              formData.target_date = formattedTargetDate;
            }
          }
          break;
        }
        default:
          break;
      }
    });
  } catch {
    throw new Error("Failed to parse query params to form data");
  }
  return formData;
}
