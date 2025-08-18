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
} from "@plane/etl/jira";
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

/* ------------------ Transformers ----------------------
The file contains transformers for the jira entities, responsible
for converting the given jira entites into plane entities. The
transformation depends on the types exported by the source core,
the core types need to be maintained in order to get the correct
transformation results
--------------------- Transformers ---------------------- */

export const getTransformedIssues = (
  job: TImportJob<JiraConfig>,
  entities: JiraEntity,
  resourceUrl: string
): Partial<PlaneIssue>[] => {
  const stateMap: IStateConfig[] = job.config?.state || [];
  const priorityMap: IPriorityConfig[] = job.config?.priority || [];

  return entities.issues.map((issue: IJiraIssue): Partial<PlaneIssue> => {
    const resourceId = job.config.resource ? job.config.resource.id : uuid();

    const transformedIssue = transformIssue(resourceId, job.project_id, issue, resourceUrl, stateMap, priorityMap);

    // Handle issue type configuration
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

export const getTransformedComments = (job: TImportJob<JiraConfig>, entities: JiraEntity): Partial<ExIssueComment>[] =>
  entities.issue_comments.map((comment) => {
    const resourceId = job.config.resource ? job.config.resource.id : uuid();

    return transformComment(resourceId, job.project_id, comment);
  });

export const getTransformedUsers = (_job: TImportJob<JiraConfig>, entities: JiraEntity): Partial<PlaneUser>[] =>
  entities.users.map(transformUser);

export const getTransformedSprints = (job: TImportJob<JiraConfig>, entities: JiraEntity): Partial<ExCycle>[] =>
  entities.sprints.map((sprint) => {
    const resourceId = job.config.resource ? job.config.resource.id : uuid();
    return transformSprint(resourceId, job.project_id, sprint);
  });

export const getTransformedComponents = (job: TImportJob<JiraConfig>, entities: JiraEntity): Partial<ExModule>[] =>
  entities.components.map((component) => {
    const resourceId = job.config.resource ? job.config.resource.id : uuid();
    return transformComponent(resourceId, job.project_id, component);
  });

export const getTransformedIssueTypes = (job: TImportJob<JiraConfig>, entities: JiraEntity): Partial<ExIssueType>[] =>
  entities.issueTypes.map((issueType) => {
    const resourceId = job.config.resource ? job.config.resource.id : uuid();
    return transformIssueType(resourceId, job.project_id, issueType);
  });

export const getTransformedIssueFields = (
  job: TImportJob<JiraConfig>,
  entities: JiraEntity
): Partial<ExIssueProperty>[] =>
  entities.issueFields
    .map((issueField) => {
      const resourceId = job.config.resource ? job.config.resource.id : uuid();

      return transformIssueFields(resourceId, job.project_id, issueField);
    })
    .filter(Boolean) as Partial<ExIssueProperty>[];

export const getTransformedIssueFieldOptions = (
  job: TImportJob<JiraConfig>,
  entities: JiraEntity
): Partial<ExIssuePropertyOption>[] =>
  entities.issueFields
    .filter(
      (issueField) =>
        issueField.schema?.custom &&
        OPTION_CUSTOM_FIELD_TYPES.includes(issueField.schema?.custom as JiraCustomFieldKeys)
    )
    .flatMap(
      (issueField) =>
        issueField?.options &&
        issueField?.options?.map((fieldOption) => {
          const resourceId = job.config.resource ? job.config.resource.id : uuid();
          return transformIssueFieldOptions(resourceId, job.project_id, fieldOption);
        })
    )
    .filter(Boolean) as Partial<ExIssuePropertyOption>[];

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
