import { v4 as uuid } from "uuid";
import { TIssuePropertyValuesPayload } from "@plane/etl/core";
import {
  JiraCustomFieldKeys,
  OPTION_CUSTOM_FIELD_TYPES,
  transformIssueFieldOptions,
  IJiraIssue,
  IPriorityConfig,
  IStateConfig,
  JiraConfig,
  JiraEntity,
  transformComment,
  transformComponent,
  transformIssue,
  transformIssueType,
  transformLabel,
  transformSprint,
  transformUser,
  transformIssueFields,
  transformIssuePropertyValues,
} from "@plane/etl/jira-server";
import {
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
import { TImportJob } from "@plane/types";

export const getTransformedIssues = (
  job: TImportJob<JiraConfig>,
  entities: JiraEntity,
  resourceUrl: string
): Partial<PlaneIssue>[] => {
  const stateMap: IStateConfig[] = job.config?.state || [];
  const priorityMap: IPriorityConfig[] = job.config?.priority || [];
  const resourceId = job.config.resource ? job.config.resource.id : uuid();

  return entities.issues.map((issue: IJiraIssue): Partial<PlaneIssue> => {
    const transformedIssue = transformIssue(resourceId, job.project_id, issue, resourceUrl, stateMap, priorityMap);

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
  return entities.issue_comments.map((comment) => transformComment(resourceId, job.project_id, comment));
};

export const getTransformedUsers = (_job: TImportJob<JiraConfig>, entities: JiraEntity): Partial<PlaneUser>[] =>
  entities.users.map(transformUser);

export const getTransformedSprints = (job: TImportJob<JiraConfig>, entities: JiraEntity): Partial<ExCycle>[] => {
  const resourceId = job.config.resource ? job.config.resource.id : uuid();
  return entities.sprints.map((sprint) => transformSprint(resourceId, job.project_id, sprint));
};

export const getTransformedComponents = (job: TImportJob<JiraConfig>, entities: JiraEntity): Partial<ExModule>[] => {
  const resourceId = job.config.resource ? job.config.resource.id : uuid();
  return entities.components.map((component) => transformComponent(resourceId, job.project_id, component));
};

export const getTransformedIssueTypes = (job: TImportJob<JiraConfig>, entities: JiraEntity): Partial<ExIssueType>[] => {
  const resourceId = job.config.resource ? job.config.resource.id : uuid();
  return entities.issueTypes.map((issueType) => transformIssueType(resourceId, job.project_id, issueType));
};

export const getTransformedIssueFields = (
  job: TImportJob<JiraConfig>,
  entities: JiraEntity
): Partial<ExIssueProperty>[] => {
  const resourceId = job.config.resource ? job.config.resource.id : uuid();
  return entities.issueFields
    .map((issueField) => transformIssueFields(resourceId, job.project_id, issueField))
    .filter(Boolean) as Partial<ExIssueProperty>[];
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
      issueField?.options?.map((fieldOption) => transformIssueFieldOptions(resourceId, job.project_id, fieldOption))
    )
    .filter(Boolean) as Partial<ExIssuePropertyOption>[];
};

export const getTransformedIssuePropertyValues = (
  _job: TImportJob<JiraConfig>,
  entities: JiraEntity,
  planeIssueProperties: Partial<ExIssueProperty>[]
): TIssuePropertyValuesPayload => {
  // Get the plane issue properties map to only transform values for the properties that are present in the plane
  const planeIssuePropertiesMap = new Map<string, Partial<ExIssueProperty>>(
    planeIssueProperties
      .filter((property) => property.external_id)
      .map((property) => [property.external_id as string, property])
  );
  // Get the jira custom field map to get the type of the custom field
  const jiraCustomFieldMap = new Map<string, string>(
    entities.issueFields
      .filter((property) => property.id && property.schema?.custom)
      .map((property) => [property.id as string, property.schema?.custom as string])
  );
  // Get transformed values for issue_id -> property_id -> property_values
  const transformedIssuePropertyValues: TIssuePropertyValuesPayload = {};
  entities.issues.forEach((issue: IJiraIssue) => {
    if (issue.id && issue.fields) {
      transformedIssuePropertyValues[issue.id] = transformIssuePropertyValues(
        issue,
        planeIssuePropertiesMap,
        jiraCustomFieldMap
      );
    }
  });
  return transformedIssuePropertyValues;
};
