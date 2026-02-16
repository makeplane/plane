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
  Attachment as JiraAttachment,
  Priority as JiraPriority,
  StatusDetails as JiraState,
} from "jira.js/out/version2/models/index.js";
import type { ExIssueAttachment, ExState, ExIssueProperty, ExIssuePropertyValue, TPropertyValue } from "@plane/sdk";
import { E_IMPORTER_KEYS } from "@/core";
import type { IPriorityConfig, IStateConfig, JiraCustomFieldKeys, JiraIssueField } from "@/jira-server/types";
import { SUPPORTED_CUSTOM_FIELD_ATTRIBUTES } from "./custom-field-etl";
import { getFormattedDate } from "./date";

export const getTargetState = (stateMap: IStateConfig[], sourceState: JiraState): ExState | undefined => {
  if (!sourceState || !sourceState.id) {
    return undefined;
  }

  // Assign the external source and external id from jira and return the target state
  const targetState = stateMap.find((state: IStateConfig) => {
    if (state.source_state.id === sourceState.id) {
      state.target_state.external_source = E_IMPORTER_KEYS.JIRA;
      state.target_state.external_id = sourceState.id as string;
      return state;
    }
  });

  return targetState?.target_state;
};

export const getTargetAttachments = (
  resourceId: string,
  projectId: string,
  attachments?: JiraAttachment[]
): Partial<ExIssueAttachment[]> => {
  if (!attachments) {
    return [];
  }
  const attachmentArray = attachments
    .map((attachment: JiraAttachment): Partial<ExIssueAttachment | undefined> => {
      if (!attachment.id) {
        return;
      }

      return {
        external_id: `${projectId}_${resourceId}_${attachment.id}`,
        external_source: E_IMPORTER_KEYS.JIRA,
        attributes: {
          name: attachment.filename ?? "Untitled",
          size: attachment.size ?? 0,
        },
        asset: attachment.content ?? "",
      };
    })
    .filter((attachment) => attachment !== undefined) as ExIssueAttachment[];

  return attachmentArray;
};

export const getTargetPriority = (priorityMap: IPriorityConfig[], sourcePriority: JiraPriority): string | undefined => {
  if (!sourcePriority || !sourcePriority.name) {
    return undefined;
  }

  const targetPriority = priorityMap.find(
    (priority: IPriorityConfig) => priority.source_priority.name === sourcePriority.name
  );
  return targetPriority?.target_priority;
};

/**
 * Generic helper for fetching paginated data from Jira's Paginated<T> endpoints
 * that use isLast and maxResults for pagination control
 */
export const fetchPaginatedData = async <T>(
  fetchFunction: (startAt: number) => Promise<{ values?: T[]; isLast?: boolean; maxResults?: number }>
): Promise<T[]> => {
  const results: T[] = [];
  let startAt = 0;

  while (true) {
    const response = await fetchFunction(startAt);

    // Exit if no values or empty array
    if (!response || !response.values || response.values.length === 0) {
      break;
    }

    results.push(...response.values);

    // Exit if this is the last page
    if (response.isLast) {
      break;
    }

    // Guard against invalid maxResults
    if (!response.maxResults || response.maxResults <= 0) {
      break;
    }

    startAt += response.maxResults;
  }

  return results;
};

type PaginatedResponseWithKey = {
  total?: number;
  maxResults?: number;
  [key: string]: any;
};

/**
 * Generic helper for fetching paginated data with dynamic property key pattern
 * Used for APIs that return data in a custom property (e.g., { issues: [...], total: N })
 */
export const fetchPaginatedDataByKey = async <T>(
  fetchFunction: (startAt: number) => Promise<PaginatedResponseWithKey>,
  listPropertyName: string
): Promise<T[]> => {
  const results: T[] = [];
  let startAt = 0;

  while (true) {
    const response = await fetchFunction(startAt);

    if (!response || response.total === 0) {
      break;
    }

    const values = response[listPropertyName] as T[];
    // Process values if they exist
    if (values && values.length > 0) {
      results.push(...values);
    }

    // Advance by maxResults (items fetched) if available, otherwise by values length
    const increment = values?.length || 0;

    if (increment === 0) {
      break; // No progress possible, exit to prevent infinite loop
    }

    startAt += increment;

    if (response.total && startAt >= response.total) {
      break;
    }
  }

  return results;
};

export const getPropertyAttributes = (jiraIssueField: JiraIssueField): Partial<ExIssueProperty> => {
  if (!jiraIssueField.schema || !jiraIssueField.schema.custom) {
    return {};
  }

  return {
    ...SUPPORTED_CUSTOM_FIELD_ATTRIBUTES[jiraIssueField.schema.custom as JiraCustomFieldKeys],
  };
};

export const getPropertyValues = (
  resourceId: string,
  projectId: string,
  customFieldType: JiraCustomFieldKeys,
  value: any,
  renderedValue: any
): ExIssuePropertyValue => {
  const propertyValues: ExIssuePropertyValue = [];
  const commonPropertyProp: Partial<TPropertyValue> = {
    external_source: E_IMPORTER_KEYS.JIRA,
    external_id: undefined,
  };

  if (!value) return [];

  switch (customFieldType) {
    case "com.atlassian.jira.plugin.system.customfieldtypes:textfield":
      // Handle textfield
      propertyValues.push({
        ...commonPropertyProp,
        value: value,
      });
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:url":
      // Handle url
      propertyValues.push({
        ...commonPropertyProp,
        value: value,
      });
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:userpicker":
      // Handle userpicker
      if (value.emailAddress || value.displayName) {
        propertyValues.push({
          ...commonPropertyProp,
          external_id: value.emailAddress ?? value.displayName,
          value: value.emailAddress ?? value.displayName,
        });
      }
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:select":
      // Handle single select
      propertyValues.push({
        ...commonPropertyProp,
        external_id: `${projectId}_${resourceId}_${value.id}`,
        value: `${projectId}_${resourceId}_${value.id}`,
      });
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:float":
      // Handle float
      propertyValues.push({
        ...commonPropertyProp,
        value: value,
      });
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:textarea":
      // Handle textarea
      if (renderedValue) {
        propertyValues.push({
          ...commonPropertyProp,
          value: renderedValue,
        });
      }
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:multicheckboxes":
      // Handle multicheckboxes
      if (Array.isArray(value)) {
        value.forEach((val) => {
          propertyValues.push({
            ...commonPropertyProp,
            external_id: `${projectId}_${resourceId}_${val.id}`,
            value: `${projectId}_${resourceId}_${val.id}`,
          });
        });
      }
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:datetime":
      // Handle datetime
      // eslint-disable-next-line no-case-declarations
      const formattedDate = getFormattedDate(value); // Format it to datetime format
      if (formattedDate) {
        propertyValues.push({
          ...commonPropertyProp,
          value: formattedDate,
        });
      }
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:radiobuttons":
      // Handle radiobuttons
      propertyValues.push({
        ...commonPropertyProp,
        external_id: `${projectId}_${resourceId}_${value.id}`,
        value: `${projectId}_${resourceId}_${value.id}`,
      });
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:multiselect":
      // Handle multiselect
      if (Array.isArray(value)) {
        value.forEach((val) => {
          propertyValues.push({
            ...commonPropertyProp,
            external_id: `${projectId}_${resourceId}_${val.id}`,
            value: `${projectId}_${resourceId}_${val.id}`,
          });
        });
      }
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:datepicker":
      // Handle datepicker
      propertyValues.push({
        ...commonPropertyProp,
        value: value,
      });
      break;
    case "com.atlassian.jira.plugin.system.customfieldtypes:multiuserpicker":
      // Handle multiuserpicker
      if (Array.isArray(value)) {
        value.forEach((val) => {
          if (val.emailAddress || val.displayName) {
            propertyValues.push({
              ...commonPropertyProp,
              external_id: val.emailAddress ?? val.displayName,
              value: val.emailAddress ?? val.displayName,
            });
          }
        });
      }
      break;
    default:
      console.warn(`Unhandled custom field type: ${customFieldType}`);
  }

  return propertyValues;
};
