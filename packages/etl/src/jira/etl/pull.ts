import * as CSV from "csv-string";
import {
  Issue as IJiraIssue,
  ComponentWithIssueCount,
  Comment as JComment,
  IssueTypeDetails as JiraIssueTypeDetails,
  FieldDetails,
  CustomFieldContextProjectMapping,
  IssueTypeToContextMapping,
  CustomFieldContextOption,
} from "jira.js/out/version3/models";
import { JiraService } from "@/jira/services";
import {
  ImportedJiraUser,
  JiraComment,
  JiraComponent,
  JiraSprint,
  PaginatedResponse,
  JiraIssueField,
  JiraIssueFieldOptions,
  JiraCustomFieldKeys,
} from "@/jira/types";
import {
  fetchPaginatedData,
  formatDateStringForHHMM,
  OPTION_CUSTOM_FIELD_TYPES,
  removeArrayObjSpaces,
} from "../helpers";

export function pullUsers(users: string): ImportedJiraUser[] {
  const jiraUsersObject = CSV.parse(users, { output: "objects" });
  return removeArrayObjSpaces(jiraUsersObject) as ImportedJiraUser[];
}

export async function pullLabels(client: JiraService): Promise<string[]> {
  const labels: string[] = [];
  await fetchPaginatedData(
    (startAt) => client.getResourceLabels(startAt),
    (values) => labels.push(...(values as string[])),
    "values"
  );
  return labels;
}

export async function pullIssues(client: JiraService, projectKey: string, from?: Date): Promise<IJiraIssue[]> {
  const issues: IJiraIssue[] = [];
  await fetchPaginatedData(
    (startAt) => client.getProjectIssues(projectKey, startAt, from ? formatDateStringForHHMM(from) : ""),
    (values) => issues.push(...(values as IJiraIssue[])),
    "issues"
  );
  return issues;
}

export async function pullComments(issues: IJiraIssue[], client: JiraService): Promise<any[]> {
  return await pullCommentsInBatches(issues, 20, client);
}

export async function pullSprints(client: JiraService, projectId: string): Promise<JiraSprint[]> {
  const jiraSprints: JiraSprint[] = [];
  try {
    const boards = await client.getProjectBoards(projectId);
    for (const board of boards.values) {
      const sprints = await client.getBoardSprints(board.id as number);
      for (const sprint of sprints.values) {
        const boardIssues: unknown[] = [];
        await fetchPaginatedData(
          (startAt) =>
            client.getBoardSprintsIssues(
              board.id as number,
              sprint.id as number,
              startAt
            ) as Promise<PaginatedResponse>,
          (values) => boardIssues.push(...(values as IJiraIssue[])),
          "issues"
        );
        jiraSprints.push({ sprint, issues: boardIssues as IJiraIssue[] });
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    console.error("Could not fetch sprints, something went wrong", e.response?.data);
  }
  return jiraSprints;
}

export async function pullComponents(client: JiraService, projectKey: string): Promise<JiraComponent[]> {
  const jiraComponents: JiraComponent[] = [];
  try {
    const jiraComponentObjects: ComponentWithIssueCount[] = await client.getProjectComponents(projectKey);
    for (const component of jiraComponentObjects) {
      const issues = await client.getProjectComponentIssues(component.id!);
      if (issues.issues) {
        jiraComponents.push({ component, issues: issues.issues });
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e: any) {
    console.error("Could not fetch components, something went wrong", e.response?.data);
  }
  return jiraComponents;
}

export const pullCommentsForIssue = async (issue: IJiraIssue, client: JiraService): Promise<JiraComment[]> => {
  const comments: JiraComment[] = [];
  await fetchPaginatedData(
    (startAt) => client.getIssueComments(issue.id, startAt),
    (values) => {
      const jiraComments = values.map(
        (comment): JiraComment => ({
          ...(comment as JComment),
          issue_id: issue.id,
        })
      );
      comments.push(...jiraComments);
    },
    "comments"
  );
  return comments;
};

export const pullCommentsInBatches = async (
  issues: IJiraIssue[],
  batchSize: number,
  client: JiraService
): Promise<JiraComment[]> => {
  const comments: JiraComment[] = [];
  for (let i = 0; i < issues.length; i += batchSize) {
    const batch = issues.slice(i, i + batchSize);
    const batchComments = await Promise.all(batch.map((issue) => pullCommentsForIssue(issue, client)));
    comments.push(...batchComments.flat());
  }
  return comments;
};

export const pullIssueTypes = async (client: JiraService, projectId: string): Promise<JiraIssueTypeDetails[]> =>
  await client.getProjectIssueTypes(projectId);

export const pullIssueFields = async (
  client: JiraService,
  issueTypes: JiraIssueTypeDetails[],
  projectId: string
): Promise<JiraIssueField[]> => {
  // initialize custom fields
  const customFields: JiraIssueField[] = [];
  try {
    // initialize fields
    const fields: FieldDetails[] = await client.getCustomFields();

    // get all field contexts
    for (const field of fields) {
      // skip if field has no id
      if (!field.id) continue;

      // Get project contexts for each field
      const projectPageFieldContexts: CustomFieldContextProjectMapping[] = [];

      try {
        await fetchPaginatedData(
          (startAt) => client.getProjectFieldContexts(field.id as string, startAt),
          (values) => projectPageFieldContexts.push(...(values as CustomFieldContextProjectMapping[])),
          "values"
        );
      } catch (e: any) {
        console.error(`Could not fetch field contexts for field ${field.id}`, e.response?.data);
      }

      // get field values for each issue
      const fieldProjectContext = projectPageFieldContexts?.filter((context) => context?.projectId === projectId);

      // get field values for each issue type
      if (fieldProjectContext?.length) {
        // get context ids
        const contextIds: number[] = fieldProjectContext
          .filter((context) => !!context?.contextId)
          .map((context) => Number(context?.contextId));

        const issueTypeContexts: IssueTypeToContextMapping[] = [];

        // get issue type contexts
        try {
          await fetchPaginatedData(
            (startAt) => client.getIssueTypeFieldContexts(field.id as string, contextIds, startAt),
            (values) => issueTypeContexts.push(...(values as IssueTypeToContextMapping[])),
            "values"
          );
        } catch (e: any) {
          console.error(`Could not fetch issue type contexts for field ${field.id}`, e.response?.data);
        }

        // get issue type for each issue type context
        if (!issueTypeContexts) continue;

        for (const issueTypeContext of issueTypeContexts) {
          const issueType = issueTypes.find((issueType) => issueType.id === issueTypeContext.issueTypeId);

          if (!issueType) continue;

          const fieldOptions: JiraIssueFieldOptions[] = [];
          if (OPTION_CUSTOM_FIELD_TYPES.includes(field.schema?.custom as JiraCustomFieldKeys)) {
            // get field options
            await fetchPaginatedData(
              (startAt) => client.getIssueFieldOptions(field.id as string, Number(issueTypeContext.contextId), startAt),
              (values: CustomFieldContextOption[]) => {
                values.map((value) => {
                  if (field.id) fieldOptions.push({ ...value, fieldId: field.id });
                });
              },
              "values"
            );
          }

          // add field to custom fields
          customFields.push({
            ...field,
            scope: {
              project: { id: projectId },
              type: issueType.id,
            },
            options: fieldOptions,
          });
        }
      }
    }
  } catch (e: any) {
    console.error(e.response?.data);
  }
  // return custom fields
  return customFields;
};
