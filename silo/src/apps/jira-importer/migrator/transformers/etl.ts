import { ExCycle, ExIssueComment, ExIssueLabel, ExModule, ExIssue as PlaneIssue, PlaneUser } from "@plane/sdk";
import { TSyncJobWithConfig } from "@silo/core";
import {
  IJiraIssue,
  IPriorityConfig,
  IStateConfig,
  JiraConfig,
  JiraEntity,
  transformComment,
  transformComponent,
  transformIssue,
  transformLabel,
  transformSprint,
  transformUser,
} from "@silo/jira";

/* ------------------ Transformers ----------------------
The file contains transformers for the jira entities, responsible
for converting the given jira entites into plane entities. The
transformation depends on the types exported by the source core,
the core types need to be maintained in order to get the correct
transformation results
--------------------- Transformers ---------------------- */

export const getTransformedIssues = (
  job: TSyncJobWithConfig<JiraConfig>,
  entities: JiraEntity
): Partial<PlaneIssue>[] => {
  const resourceUrl = job.config?.meta.resource.url || "";
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

export const getTransformedLabels = (
  _job: TSyncJobWithConfig<JiraConfig>,
  labels: string[]
): Partial<ExIssueLabel>[] => {
  return labels.map(transformLabel);
};

export const getTransformedComments = (
  _job: TSyncJobWithConfig<JiraConfig>,
  entities: JiraEntity
): Partial<ExIssueComment>[] => {
  return entities.issue_comments.map(transformComment);
};

export const getTransformedUsers = (
  _job: TSyncJobWithConfig<JiraConfig>,
  entities: JiraEntity
): Partial<PlaneUser>[] => {
  return entities.users.map(transformUser);
};

export const getTransformedSprints = (
  _job: TSyncJobWithConfig<JiraConfig>,
  entities: JiraEntity
): Partial<ExCycle>[] => {
  return entities.sprints.map(transformSprint);
};

export const getTransformedComponents = (
  _job: TSyncJobWithConfig<JiraConfig>,
  entities: JiraEntity
): Partial<ExModule>[] => {
  return entities.components.map(transformComponent);
};
