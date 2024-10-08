import * as CSV from "csv-string";
import {
  Issue as IJiraIssue,
  ComponentWithIssueCount,
  Comment as JComment,
} from "jira.js/out/version3/models";
import {
  fetchPaginatedData,
  formatDateStringForHHMM,
  removeArrayObjSpaces,
} from "../helpers";
import { JiraService } from "@/services";
import {
  ImportedJiraUser,
  JiraComment,
  JiraComponent,
  JiraSprint,
  PaginatedResponse,
} from "@/types";

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

export async function pullIssues(
  client: JiraService,
  projectKey: string,
  from?: Date
): Promise<IJiraIssue[]> {
  const issues: IJiraIssue[] = [];
  await fetchPaginatedData(
    (startAt) =>
      client.getProjectIssues(
        projectKey,
        startAt,
        from ? formatDateStringForHHMM(from) : ""
      ),
    (values) => issues.push(...(values as IJiraIssue[])),
    "issues"
  );
  return issues;
}

export async function pullComments(
  issues: IJiraIssue[],
  client: JiraService
): Promise<any[]> {
  return await pullCommentsInBatches(issues, 20, client);
}

export async function pullSprints(
  client: JiraService,
  projectId: string
): Promise<JiraSprint[]> {
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
  } catch (e) {
    throw new Error(`Could not fetch sprints, something went wrong`);
  }
  return jiraSprints;
}

export async function pullComponents(
  client: JiraService,
  projectKey: string
): Promise<JiraComponent[]> {
  const jiraComponents: JiraComponent[] = [];
  try {
    const jiraComponentObjects: ComponentWithIssueCount[] =
      await client.getProjectComponents(projectKey);
    for (const component of jiraComponentObjects) {
      const issues = await client.getProjectComponentIssues(component.id!);
      if (issues.issues) {
        jiraComponents.push({ component, issues: issues.issues });
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    throw new Error(`Could not fetch components, something went wrong`);
  }
  return jiraComponents;
}

export const pullCommentsForIssue = async (
  issue: IJiraIssue,
  client: JiraService
): Promise<JiraComment[]> => {
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
    const batchComments = await Promise.all(
      batch.map((issue) => pullCommentsForIssue(issue, client))
    );
    comments.push(...batchComments.flat());
  }
  return comments;
};
