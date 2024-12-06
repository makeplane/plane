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
import { TIssuePropertyValuesPayload, TJobWithConfig } from "@silo/core";
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
} from "@silo/jira-server";

/* ------------------ Transformers ----------------------
The file contains transformers for the jira entities, responsible
for converting the given jira entites into plane entities. The
transformation depends on the types exported by the source core,
the core types need to be maintained in order to get the correct
transformation results
--------------------- Transformers ---------------------- */

export const getTransformedIssues = (
  job: TJobWithConfig<JiraConfig>,
  entities: JiraEntity,
  resourceUrl: string
): Partial<PlaneIssue>[] => {
  const stateMap: IStateConfig[] = job.config?.meta.state || [];
  const priorityMap: IPriorityConfig[] = job.config?.meta.priority || [];

  return entities.issues.map((issue: IJiraIssue): Partial<PlaneIssue> => {
    const transformedIssue = transformIssue(issue, resourceUrl, stateMap, priorityMap);

    // Handle issue type configuration
    if (job.config?.meta.issueType && issue.fields.issuetype?.name) {
      const issueTypeValue = job.config.meta.issueType;
      if (issueTypeValue === "create_as_label") {
        transformedIssue.labels?.push(issue.fields.issuetype.name.toUpperCase());
      } else {
        transformedIssue.name = `[${issue.fields.issuetype.name.toUpperCase()}] ${transformedIssue.name}`;
      }
    }

    return transformedIssue;
  });
};

export const getTransformedLabels = (_job: TJobWithConfig<JiraConfig>, labels: string[]): Partial<ExIssueLabel>[] =>
  labels.map(transformLabel);

export const getTransformedComments = (
  _job: TJobWithConfig<JiraConfig>,
  entities: JiraEntity
): Partial<ExIssueComment>[] => entities.issue_comments.map(transformComment);

export const getTransformedUsers = (_job: TJobWithConfig<JiraConfig>, entities: JiraEntity): Partial<PlaneUser>[] =>
  entities.users.map(transformUser);

export const getTransformedSprints = (_job: TJobWithConfig<JiraConfig>, entities: JiraEntity): Partial<ExCycle>[] =>
  entities.sprints.map(transformSprint);

export const getTransformedComponents = (_job: TJobWithConfig<JiraConfig>, entities: JiraEntity): Partial<ExModule>[] =>
  entities.components.map(transformComponent);

export const getTransformedIssueTypes = (
  _job: TJobWithConfig<JiraConfig>,
  entities: JiraEntity
): Partial<ExIssueType>[] => entities.issueTypes.map(transformIssueType);

export const getTransformedIssueFields = (
  _job: TJobWithConfig<JiraConfig>,
  entities: JiraEntity
): Partial<ExIssueProperty>[] =>
  entities.issueFields.map(transformIssueFields).filter(Boolean) as Partial<ExIssueProperty>[];

export const getTransformedIssueFieldOptions = (
  _job: TJobWithConfig<JiraConfig>,
  entities: JiraEntity
): Partial<ExIssuePropertyOption>[] =>
  entities.issueFields
    .filter(
      (issueField) =>
        issueField.schema?.custom &&
        OPTION_CUSTOM_FIELD_TYPES.includes(issueField.schema?.custom as JiraCustomFieldKeys)
    )
    .flatMap((issueField) => issueField?.options && issueField?.options?.map(transformIssueFieldOptions))
    .filter(Boolean) as Partial<ExIssuePropertyOption>[];

export const getTransformedIssuePropertyValues = (
  _job: TJobWithConfig<JiraConfig>,
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
