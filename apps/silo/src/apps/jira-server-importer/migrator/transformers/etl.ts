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

import { v4 as uuid } from "uuid";
import type { E_IMPORTER_KEYS, TIssuePropertyValuesPayload } from "@plane/etl/core";
import type {
  JiraCustomFieldKeys,
  IJiraIssue,
  IPriorityConfig,
  IStateConfig,
  JiraConfig,
  JiraEntity,
  JiraIssueField,
} from "@plane/etl/jira-server";
import {
  OPTION_CUSTOM_FIELD_TYPES,
  transformIssueFieldOptions,
  transformComment,
  transformComponent,
  transformIssue,
  transformIssueType,
  transformLabel,
  transformSprint,
  transformUser,
  transformIssueFields,
  transformIssuePropertyValues,
  transformDefaultPropertyValues,
  resolveFieldTypeKey,
  buildExtenalId,
} from "@plane/etl/jira-server";
import type {
  ExCycle,
  ExIssueComment,
  ExIssueLabel,
  ExIssueProperty,
  ExIssuePropertyOption,
  ExIssueType,
  ExModule,
  ExIssue as PlaneIssue,
  PlaneUser,
} from "@plane/sdk";
import type { TImportJob } from "@plane/types";
import { createHashForString } from "@/helpers/utils";
import type { TIssueTypesData } from "../../v2/types";

export const getTransformedIssues = (
  job: TImportJob<JiraConfig>,
  entities: JiraEntity,
  resourceUrl: string
): Partial<PlaneIssue>[] => {
  const stateMap: IStateConfig[] = job.config?.state || [];
  const priorityMap: IPriorityConfig[] = job.config?.priority || [];
  const resourceId = job.config.resource ? job.config.resource.id : uuid();

  return entities.issues.map((issue: IJiraIssue): Partial<PlaneIssue> => {
    const transformedIssue = transformIssue(
      {
        resourceId,
        projectId: job.project_id,
        source: job.source as E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA,
      },
      issue,
      resourceUrl,
      stateMap,
      priorityMap
    );

    if (job.config?.issueType && issue.fields.issuetype?.name) {
      const issueTypeValue = job.config.issueType;
      if (issueTypeValue === "create_as_label") {
        transformedIssue.labels?.push(issue.fields.issuetype.name.toUpperCase());
      } else {
        transformedIssue.name = `[${issue.fields.issuetype.name.toUpperCase()}] ${transformedIssue.name}`;
      }
    }

    return transformedIssue;
  });
};

export const getTransformedLabels = (_job: TImportJob<JiraConfig>, labels: string[]): Partial<ExIssueLabel>[] =>
  labels.map(transformLabel);

export const getTransformedComments = (
  job: TImportJob<JiraConfig>,
  entities: JiraEntity
): Partial<ExIssueComment>[] => {
  const resourceId = job.config.resource ? job.config.resource.id : uuid();
  return entities.issue_comments.map((comment) =>
    transformComment(
      {
        resourceId,
        projectId: job.project_id,
        source: job.source as E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA,
      },
      comment
    )
  );
};

export const getTransformedUsers = (_job: TImportJob<JiraConfig>, entities: JiraEntity): Partial<PlaneUser>[] =>
  entities.users.map(transformUser);

export const getTransformedSprints = (job: TImportJob<JiraConfig>, entities: JiraEntity): Partial<ExCycle>[] => {
  const resourceId = job.config.resource ? job.config.resource.id : uuid();
  return entities.sprints.map((sprint) =>
    transformSprint(
      {
        resourceId,
        projectId: job.project_id,
        source: job.source as E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA,
      },
      sprint
    )
  );
};

export const getTransformedComponents = (job: TImportJob<JiraConfig>, entities: JiraEntity): Partial<ExModule>[] => {
  const resourceId = job.config.resource ? job.config.resource.id : uuid();
  return entities.components.map((component) =>
    transformComponent(
      {
        resourceId,
        projectId: job.project_id,
        source: job.source as E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA,
      },
      component
    )
  );
};

export const getTransformedIssueTypes = (job: TImportJob<JiraConfig>, entities: JiraEntity): Partial<ExIssueType>[] => {
  const resourceId = job.config.resource ? job.config.resource.id : uuid();
  return entities.issueTypes.map((issueType) =>
    transformIssueType(
      {
        resourceId,
        projectId: job.project_id,
        source: job.source as E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA,
      },
      issueType,
      false
    )
  );
};

export const getTransformedIssueFields = (
  job: TImportJob<JiraConfig>,
  entities: JiraEntity
): Partial<ExIssueProperty>[] => {
  const resourceId = job.config.resource ? job.config.resource.id : uuid();
  return entities.issueFields
    .map((issueField) =>
      transformIssueFields(
        {
          resourceId,
          projectId: job.project_id,
          source: job.source as E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA,
        },
        issueField
      )
    )
    .filter((field) => field && field.property_type) as Partial<ExIssueProperty>[];
};

export const getTransformedIssueFieldOptions = (
  job: TImportJob<JiraConfig>,
  entities: JiraEntity
): Partial<ExIssuePropertyOption>[] => {
  const resourceId = job.config.resource ? job.config.resource.id : uuid();
  return entities.issueFields
    .filter(
      (issueField) =>
        issueField.schema?.custom &&
        OPTION_CUSTOM_FIELD_TYPES.includes(issueField.schema?.custom as JiraCustomFieldKeys)
    )
    .flatMap((issueField) =>
      issueField?.options?.map((fieldOption) =>
        transformIssueFieldOptions(
          {
            resourceId,
            projectId: job.project_id,
            source: job.source as E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA,
          },
          "",
          fieldOption
        )
      )
    )
    .filter(Boolean) as Partial<ExIssuePropertyOption>[];
};

export const getTransformedIssuePropertyValues = (
  job: TImportJob<JiraConfig>,
  entities: JiraEntity,
  planeIssueProperties: Partial<ExIssueProperty>[]
): TIssuePropertyValuesPayload => {
  const resourceId = job.config.resource ? job.config.resource.id : uuid();
  const projectId = job.project_id;
  // Get the plane issue properties map to only transform values for the properties that are present in the plane
  const planeIssuePropertiesMap = new Map<string, Partial<ExIssueProperty>>(
    planeIssueProperties
      .filter((property) => property.external_id)
      .map((property) => {
        const customFieldKey = property.external_id?.split("_").pop();
        return [`customfield_${customFieldKey}`, property];
      })
  );
  // Get the jira field type map to get the type of the custom field (supports both custom attributes and system types)
  const jiraFieldTypeMap = new Map<string, string>(
    entities.issueFields
      .filter((property) => property.id && resolveFieldTypeKey(property.schema))
      .map((property) => [property.id as string, resolveFieldTypeKey(property.schema) as string])
  );
  // Get transformed values for issue_id -> property_id -> property_values
  const transformedIssuePropertyValues: TIssuePropertyValuesPayload = {};
  entities.issues.forEach((issue: IJiraIssue) => {
    if (issue.id && issue.fields) {
      transformedIssuePropertyValues[`${projectId}_${resourceId}_${issue.id}`] = transformIssuePropertyValues(
        { resourceId, projectId, source: job.source as E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA },
        issue,
        "",
        planeIssuePropertiesMap,
        jiraFieldTypeMap
      );
    }
  });
  return transformedIssuePropertyValues;
};

export const getTransformedIssuePropertyValuesV2 = (
  job: TImportJob<JiraConfig>,
  issues: IJiraIssue[],
  issueFields: JiraIssueField[],
  planeIssueProperties: Partial<ExIssueProperty>[],
  issueTypes: TIssueTypesData
): TIssuePropertyValuesPayload => {
  const resourceId = job.config.resource ? job.config.resource.id : uuid();
  const projectId = job.project_id;
  const importWorkItemTypesGlobally = job.config.importWorkItemTypesGlobally ?? false;
  const transformedIssuePropertyValues: TIssuePropertyValuesPayload = {};
  // Get the plane issue properties map to only transform values for the properties that are present in the plane
  //
  const planeIssuePropertiesMap = new Map<string, Partial<ExIssueProperty>>(
    planeIssueProperties
      .filter((property) => property.external_id)
      .map((property) => {
        const parts = property.external_id?.split("_") || [];
        const customFieldKey = parts[parts.length - 1]; // Last part
        const issueTypeId = parts[parts.length - 2]; // Second-to-last part
        return { issueTypeId, customFieldKey, property };
      })
      .filter(({ issueTypeId }) => issueTypeId)
      .map(({ issueTypeId, customFieldKey, property }) => [`${issueTypeId}_customfield_${customFieldKey}`, property])
  );

  // Get the jira field type map to get the type of the custom field (supports both custom attributes and system types)
  const jiraFieldTypeMap = new Map<string, string>(
    issueFields
      .filter((property) => property.id && resolveFieldTypeKey(property.schema))
      .map((property) => [property.id as string, resolveFieldTypeKey(property.schema) as string])
  );
  // Transform values for each issue
  issues.forEach((issue: IJiraIssue) => {
    if (issue.id && issue.fields) {
      const issueKey = buildExtenalId([projectId, resourceId, issue.id]);
      const issueTypeId = issueTypes?.find((type) => {
        const issuetypeId = issue.fields.issuetype?.id;
        if (!issuetypeId || !type.external_id) return false;
        const comparisonExternalId = importWorkItemTypesGlobally
          ? buildExtenalId([resourceId, issuetypeId])
          : buildExtenalId([projectId, resourceId, issuetypeId]);
        return type.external_id === comparisonExternalId;
      })?.id;

      // Transform custom field property values
      const customPropertyValues = transformIssuePropertyValues(
        {
          resourceId,
          projectId: importWorkItemTypesGlobally ? undefined : projectId,
          source: job.source as E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA,
        },
        issue,
        issue.fields.issuetype?.id ?? "",
        planeIssuePropertiesMap,
        jiraFieldTypeMap
      );

      // Transform default property values (fix versions, affected versions, reporter)
      const defaultPropertyValues = issueTypeId
        ? transformDefaultPropertyValues(
            {
              resourceId,
              projectId: importWorkItemTypesGlobally ? undefined : projectId,
              source: job.source as E_IMPORTER_KEYS.JIRA_SERVER | E_IMPORTER_KEYS.JIRA,
            },
            job.workspace_slug,
            issue,
            issueTypeId,
            planeIssueProperties,
            createHashForString
          )
        : {};

      // Merge both custom and default property values
      transformedIssuePropertyValues[issueKey] = {
        ...customPropertyValues,
        ...defaultPropertyValues,
      };
    }
  });
  return transformedIssuePropertyValues;
};
