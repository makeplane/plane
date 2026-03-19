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
  ComponentWithIssueCount,
  IssueTypeDetails as JiraIssueTypeDetails,
} from "jira.js/out/version2/models/index.js";
import type {
  ExCycle,
  ExIssueComment,
  ExIssueLabel,
  ExIssueType,
  ExModule,
  ExIssue as PlaneIssue,
  ExIssueProperty,
  PlaneUser,
  ExIssuePropertyOption,
} from "@plane/sdk";
import { createHashForString } from "@/core";
import type { E_IMPORTER_KEYS, TPropertyValuesPayload } from "@/core";
import {
  buildExtenalId,
  getFormattedDate,
  getPropertyAttributes,
  getPropertyValues,
  getRandomColor,
  getTargetAttachments,
  getTargetPriority,
  getTargetState,
  normalizeJiraHTML,
  OPTION_CUSTOM_FIELD_TYPES,
  SUPPORTED_CUSTOM_FIELD_ATTRIBUTES,
  SUPPORTED_CUSTOM_FIELD_TYPES,
} from "../helpers";
import type {
  IJiraIssue,
  ImportedJiraUser,
  IPriorityConfig,
  IStateConfig,
  JiraComment,
  JiraComponent,
  JiraSprint,
  JiraCustomFieldKeys,
  JiraIssueField,
  JiraIssueFieldOptions,
} from "../types";

export type TTransformationContext = {
  resourceId: string;
  projectId?: string;
  source: E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA;
};

export const transformIssue = (
  ctx: TTransformationContext,
  issue: IJiraIssue,
  resourceUrl: string,
  stateMap: IStateConfig[],
  priorityMap: IPriorityConfig[]
): Partial<PlaneIssue> => {
  const { resourceId, projectId, source } = ctx;
  const targetState = getTargetState(stateMap, issue.fields.status);
  const targetPriority = getTargetPriority(priorityMap, issue.fields.priority);
  const attachments = projectId ? getTargetAttachments(resourceId, projectId, issue.fields.attachment) : [];
  const renderedFields = (issue.renderedFields as { description: string }) ?? {
    description: "<p></p>",
  };
  const links = [
    {
      name: "Linked Jira Issue",
      url: `${resourceUrl}/browse/${issue.key}`,
    },
  ];
  let description = renderedFields.description ?? "<p></p>";
  if (description === "") {
    description = "<p></p>";
  }
  // Normalize Jira HTML to Plane-compatible HTML; images kept as <img> for silo's asset pipeline
  description = normalizeJiraHTML(description);

  issue.fields.labels.push("JIRA IMPORTED");

  return {
    assignees: issue.fields.assignee?.name ? [issue.fields.assignee.name] : [],
    links,
    external_id: `${projectId}_${resourceId}_${issue.id}`,
    external_source: source,
    created_by: issue.fields.creator?.name,
    name: issue.fields.summary ?? "Untitled",
    description_html: description,
    target_date: issue.fields.duedate,
    start_date: issue.fields.customfield_10015 as string | null,
    created_at: issue.fields.created,
    attachments: attachments,
    state: targetState?.id ?? "",
    external_source_state_id: targetState?.external_id ? `${projectId}_${resourceId}_${targetState.external_id}` : null,
    priority: targetPriority ?? "none",
    labels: issue.fields.labels,
    parent: issue.fields.parent?.id ? `${projectId}_${resourceId}_${issue.fields.parent?.id}` : null,
    type_id: issue.fields.issuetype?.id ? `${projectId}_${resourceId}_${issue.fields.issuetype?.id}` : null,
  } as unknown as PlaneIssue;
};

export const transformIssueV2 = (
  ctx: TTransformationContext,
  issue: IJiraIssue,
  resourceUrl: string,
  stateMap: IStateConfig[],
  priorityMap: IPriorityConfig[],
  knownCustomFields: {
    startDateFields?: string[];
    completionDateFields?: string[];
    storyPointsFields?: string[];
  },
  importWorkItemTypesGlobally: boolean = false
): Partial<PlaneIssue> => {
  const { resourceId, projectId, source } = ctx;
  const targetState = getTargetState(stateMap, issue.fields.status);
  const targetPriority = getTargetPriority(priorityMap, issue.fields.priority);
  const attachments = projectId ? getTargetAttachments(resourceId, projectId, issue.fields.attachment) : [];
  const renderedFields = (issue.renderedFields as { description: string }) ?? {
    description: "<p></p>",
  };
  const links = [
    {
      name: "Linked Jira Issue",
      url: `${resourceUrl}/browse/${issue.key}`,
    },
  ];
  let description = renderedFields.description ?? "<p></p>";
  if (description === "") {
    description = "<p></p>";
  }
  // Normalize Jira HTML to Plane-compatible HTML; images kept as <img> for silo's asset pipeline
  description = normalizeJiraHTML(description);

  issue.fields.labels.push("JIRA IMPORTED");
  const typeId = importWorkItemTypesGlobally
    ? buildExtenalId([resourceId, issue.fields.issuetype.id])
    : buildExtenalId([projectId, resourceId, issue.fields.issuetype.id]);

  return {
    assignees: issue.fields.assignee?.emailAddress
      ? [issue.fields.assignee.emailAddress]
      : issue.fields.assignee?.displayName
        ? [issue.fields.assignee.displayName]
        : [],
    links,
    external_id: buildExtenalId([projectId, resourceId, issue.id]),
    external_source: source,
    created_by: issue.fields.creator?.emailAddress || issue.fields.creator?.displayName,
    name: issue.fields.summary ?? "Untitled",
    description_html: description,
    target_date:
      issue.fields.duedate ||
      knownCustomFields.completionDateFields?.reduce((val: string | null, id: string) => {
        return val || (issue.fields[id] as string | null);
      }, null) ||
      null,
    start_date:
      knownCustomFields.startDateFields?.reduce((val: string | null, id: string) => {
        return val || (issue.fields[id] as string | null);
      }, null) || null,
    created_at: issue.fields.created,
    updated_at: issue.fields.updated,
    attachments: attachments,
    state: targetState?.id ?? "",
    external_source_state_id: targetState?.external_id
      ? buildExtenalId([projectId, resourceId, targetState.external_id])
      : null,
    priority: targetPriority ?? "none",
    labels: issue.fields.labels,
    parent: issue.fields.parent?.id ? buildExtenalId([projectId, resourceId, issue.fields.parent?.id]) : null,
    type_id: issue.fields.issuetype?.id ? typeId : null,
    external_sequence_id: issue.key.split("-")[1],
    story_points:
      knownCustomFields.storyPointsFields?.reduce((val: number | null, id: string) => {
        return val ?? (issue.fields[id] as number | null);
      }, null) ?? null,
  } as unknown as PlaneIssue;
};

export const transformLabel = (label: string): Partial<ExIssueLabel> => ({
  name: label,
  color: getRandomColor(),
});

export const transformComment = (ctx: TTransformationContext, comment: JiraComment): Partial<ExIssueComment> => {
  const { resourceId, projectId, source } = ctx;
  let commentHtml: string = comment.renderedBody
    ? comment.renderedBody
    : // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- body exists at runtime but not in type
      ((comment as unknown as { body?: string }).body ?? "<p></p>");

  if (commentHtml && commentHtml !== "<p></p>") {
    commentHtml = normalizeJiraHTML(commentHtml);
  }

  return {
    external_id: buildExtenalId([projectId, resourceId, comment.id]),
    external_source: source,
    created_at: comment.created,
    created_by: comment.author?.emailAddress || comment.author?.displayName,
    comment_html: commentHtml,
    actor: comment.author?.emailAddress || comment.author?.displayName,
    issue: `${projectId}_${resourceId}_${comment.issue_id}`,
  };
};

export const transformUser = (user: ImportedJiraUser): Partial<PlaneUser> => {
  const [first_name, last_name] = user.full_name.split(" ");
  const role = user.org_role && user.org_role.toLowerCase().includes("admin") ? 20 : 15;

  return {
    email: user.email,
    display_name: user.user_name,
    avatar: user.avatarUrl,
    first_name: first_name ?? "",
    last_name: last_name ?? "",
    role,
  };
};

export const transformSprint = (ctx: TTransformationContext, sprint: JiraSprint): Partial<ExCycle> => {
  const { resourceId, projectId, source } = ctx;
  return {
    external_id: buildExtenalId([projectId, resourceId, sprint.sprint.id.toString()]),
    external_source: source,
    name: sprint.sprint.name,
    start_date: getFormattedDate(sprint.sprint.startDate),
    end_date: getFormattedDate(sprint.sprint.endDate),
    created_at: getFormattedDate(sprint.sprint.createdDate),
    issues: sprint.issues.map((issue) => `${projectId}_${resourceId}_${issue.id}`),
  };
};

export const transformComponent = (ctx: TTransformationContext, component: JiraComponent): Partial<ExModule> => {
  const { resourceId, projectId, source } = ctx;
  return {
    external_id: buildExtenalId([projectId, resourceId, component.component.id]),
    external_source: source,
    name: component.component.name,
    issues: component.issues.map((issue) => `${projectId}_${resourceId}_${issue.id}`),
  };
};

export const transformComponentV2 = (
  ctx: TTransformationContext,
  component: ComponentWithIssueCount
): Partial<ExModule> => {
  const { resourceId, projectId, source } = ctx;
  return {
    external_id: buildExtenalId([projectId, resourceId, component.id]),
    external_source: source,
    name: component.name,
  };
};

export const transformIssueType = (
  ctx: TTransformationContext,
  issueType: JiraIssueTypeDetails,
  epicsAsWorkItems: boolean
): Partial<ExIssueType> => {
  const { resourceId, projectId, source } = ctx;
  const isEpic = !epicsAsWorkItems && issueType.name?.toLowerCase() === "epic";

  return {
    name: issueType.name,
    description: issueType.description,
    is_active: true,
    is_epic: isEpic,
    external_id: buildExtenalId([projectId, resourceId, issueType.id]),
    external_source: source,
  };
};

export const transformIssueFields = (
  ctx: TTransformationContext,
  issueField: JiraIssueField
): Partial<ExIssueProperty> | undefined => {
  const { resourceId, projectId, source } = ctx;

  // Must have schema and scope
  if (!issueField.schema || !issueField.scope?.type) {
    return undefined;
  }

  // Check if this is a supported custom field OR a supported system field
  const isCustomField =
    issueField.schema.custom && SUPPORTED_CUSTOM_FIELD_ATTRIBUTES[issueField.schema.custom as JiraCustomFieldKeys];

  const isSystemField = issueField.schema.type && SUPPORTED_CUSTOM_FIELD_TYPES[issueField.schema.type];

  const isArrayField =
    issueField.schema.type === "array" &&
    issueField.schema.items &&
    SUPPORTED_CUSTOM_FIELD_TYPES[`array-${issueField.schema.items}`];

  // If none of the types are supported, skip this field
  if (!isCustomField && !isSystemField && !isArrayField) {
    return undefined;
  }

  const fieldId = issueField.id?.startsWith("customfield_") ? issueField.id.split("_").pop() : issueField.id;

  // Extract options if this is an OPTION type field
  const isOptionField =
    issueField.schema?.custom && OPTION_CUSTOM_FIELD_TYPES.includes(issueField.schema.custom as JiraCustomFieldKeys);

  const options = isOptionField
    ? (issueField.options || [])
        .map((option) => transformIssueFieldOptions(ctx, issueField.scope?.type ?? "", option))
        .filter(Boolean)
    : undefined;

  return {
    external_id: buildExtenalId([projectId, resourceId, issueField.scope?.type, fieldId]),
    external_source: source,
    display_name: issueField.name,
    type_id: issueField.scope?.type ? buildExtenalId([projectId, resourceId, issueField.scope?.type]) : undefined,
    is_required: false,
    is_active: true,
    ...getPropertyAttributes(issueField),
    ...(options && options.length > 0 ? { options } : {}),
  };
};

export const transformIssueFieldOptions = (
  ctx: TTransformationContext,
  typeId: string,
  issueFieldOption: JiraIssueFieldOptions
): Partial<ExIssuePropertyOption> => {
  const { resourceId, projectId, source } = ctx;
  return {
    external_id: buildExtenalId([projectId, resourceId, typeId, issueFieldOption.fieldId, issueFieldOption.id]),
    external_source: source,
    name: issueFieldOption.value,
    is_active: issueFieldOption.disabled ? false : true,
    property_id: buildExtenalId([projectId, resourceId, typeId, issueFieldOption.fieldId]),
  };
};

export const transformIssuePropertyValues = (
  ctx: TTransformationContext,
  issue: IJiraIssue,
  typeId: string,

  planeIssueProperties: Map<string, Partial<ExIssueProperty>>, // TODO: replace Map with Record<string, Partial<ExIssueProperty>> in the future

  jiraFieldTypeMap: Map<string, string> // TODO: replace Map with Record<string, string> in the future
): TPropertyValuesPayload => {
  const { resourceId, projectId } = ctx;
  // Get all custom fields that are present in the issue and are also present in the plane issue properties
  const customFieldKeysToTransform = Object.keys(issue.fields).filter(
    (key) => key.startsWith("customfield_") && planeIssueProperties.has(`${typeId}_${key}`)
  );
  // Get transformed values for property_id -> property_values
  const propertyValuesPayload: TPropertyValuesPayload = {};
  customFieldKeysToTransform.forEach((key) => {
    const property = planeIssueProperties.get(`${typeId}_${key}`);
    const jiraPropertyId = property?.external_id?.split("_").pop();
    if (property && property.external_id && jiraFieldTypeMap.has(key)) {
      propertyValuesPayload[property.external_id] = getPropertyValues(
        resourceId,
        typeId,
        jiraPropertyId ?? "",
        jiraFieldTypeMap.get(key) as string,
        issue.fields[key],
        (issue.renderedFields as Record<string, unknown>)?.[key] as string | undefined,
        projectId
      );
    }
  });
  return propertyValuesPayload;
};

export const transformDefaultPropertyValues = (
  ctx: TTransformationContext,
  workspaceSlug: string,
  issue: IJiraIssue,
  issueTypeId: string,
  planeIssueProperties: Partial<ExIssueProperty>[]
): TPropertyValuesPayload => {
  const { resourceId, projectId, source } = ctx;
  const propertyValuesPayload: TPropertyValuesPayload = {};

  // Fix Versions
  if (issue.fields.fixVersions && Array.isArray(issue.fields.fixVersions)) {
    const fixVersionExternalId = buildExtenalId([resourceId, projectId, issueTypeId, "fix-version"], "-");
    propertyValuesPayload[fixVersionExternalId] = issue.fields.fixVersions.map((version) => {
      const versionNameInput = `${workspaceSlug}:${version.name?.trim().toLowerCase()}`;
      const hashedName = createHashForString(versionNameInput);

      return {
        external_source: source,
        external_id: buildExtenalId([projectId, resourceId, version.id]),
        value: `${resourceId}_${hashedName}`,
      };
    });
  }

  // Affected Versions
  if (issue.fields.versions && Array.isArray(issue.fields.versions)) {
    const affectedVersionExternalId = buildExtenalId([resourceId, projectId, issueTypeId, "affected-version"], "-");
    const versions = issue.fields.versions as { id?: string; name?: string }[];
    propertyValuesPayload[affectedVersionExternalId] = versions.map((version) => {
      const versionNameInput = `${workspaceSlug}:${version.name?.trim().toLowerCase()}`;
      const hashedName = createHashForString(versionNameInput);
      return {
        external_source: source,
        external_id: buildExtenalId([projectId, resourceId, version.id]),
        value: `${resourceId}_${hashedName}`,
      };
    });
  }

  // Reporter
  if (issue.fields.reporter) {
    const reporterExternalId = buildExtenalId([resourceId, projectId, issueTypeId, "reporter"], "-");
    propertyValuesPayload[reporterExternalId] = [
      {
        external_source: source,
        external_id: issue.fields.reporter.emailAddress || issue.fields.reporter.displayName || "",
        value: issue.fields.reporter.emailAddress || issue.fields.reporter.displayName || "",
      },
    ];
  }

  // Original Estimate
  if (issue.fields.timeoriginalestimate) {
    const originalEstimateExternalId = buildExtenalId([resourceId, projectId, issueTypeId, "original_estimate"], "-");
    const estimate = Number(issue.fields.timeoriginalestimate);
    propertyValuesPayload[originalEstimateExternalId] = [
      {
        external_source: source,
        value: !isNaN(estimate) ? estimate / 60 : 0,
      },
    ];
  }

  // Resolution State
  if (issue.fields.resolution) {
    const resolutionProperty = planeIssueProperties.find(
      (property) =>
        property.external_id === buildExtenalId([resourceId, projectId, issueTypeId, "resolution_state"], "-")
    );
    const resolutionExternalId = resolutionProperty?.external_id;

    if (resolutionExternalId) {
      // In case we are importing the property as text
      if (resolutionProperty?.property_type === "TEXT") {
        propertyValuesPayload[resolutionExternalId] = [
          { external_source: source, value: issue.fields.resolution.name || "" },
        ];
      }
      // In case we are importing the property as option
      else if (resolutionProperty?.property_type === "OPTION" && resolutionProperty.options) {
        const targetOption = resolutionProperty.options.find((option) => option.name === issue.fields.resolution!.name);
        if (targetOption?.external_id) {
          propertyValuesPayload[resolutionExternalId] = [
            {
              external_source: source,
              external_id: targetOption.external_id,
              value: targetOption.external_id,
            },
          ];
        } else {
          console.warn("[Assertion Failed] Resolution option not found for resolution name", {
            resolutionProperty,
            resolutionName: issue.fields.resolution?.name,
            issue: issue.fields.resolution,
          });
        }
      } else {
        console.warn("[Assertion Failed] Resolution property type is not TEXT or OPTION", {
          resolutionProperty,
          issue: issue.fields.resolution,
        });
      }
    } else {
      console.warn("[Assertion Failed] Resolution external id is not found", {
        resolutionProperty,
        issue: issue.fields.resolution,
      });
    }
  }

  // Resolution as Resolution Date
  if (issue.fields.resolutiondate) {
    const resolutionDateExternalId = buildExtenalId([resourceId, projectId, issueTypeId, "resolution"], "-");
    const formattedDate = getFormattedDate(issue.fields.resolutiondate);
    if (formattedDate) {
      propertyValuesPayload[resolutionDateExternalId] = [
        {
          external_source: source,
          value: formattedDate,
        },
      ];
    }
  }

  return propertyValuesPayload;
};
