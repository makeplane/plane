import { EIssueGroupBYServerToProperty } from "@plane/constants";
import { TIssue } from "@plane/types";
import { IssueService } from "@/services/issue/issue.service";
import { PROJECT_OFFLINE_STATUS } from "../load-issues";
import { issueFilterCountQueryConstructor, issueFilterQueryConstructor } from "../query-constructor";
import { runQuery } from "../query-executor";
import { SQL } from "../sqlite";

const arrayFields = ["label_ids", "assignee_ids", "module_ids"];

export const getIssues = async (workspaceSlug: string, projectId: string, queries?: any, config = {}): Promise<any> => {
  if (!PROJECT_OFFLINE_STATUS[projectId]) {
    console.log(`Project ${projectId} is not offline, fetching from server.`);
    const issueService = new IssueService();
    return await issueService.getIssuesFromServer(workspaceSlug, projectId, queries, config);
  }

  const { cursor, group_by } = queries;

  await SQL.syncInProgress;
  const query = issueFilterQueryConstructor(workspaceSlug, projectId, queries);
  const countQuery = issueFilterCountQueryConstructor(workspaceSlug, projectId, queries);
  const start = performance.now();
  const [issuesRaw, count] = await Promise.all([runQuery(query), runQuery(countQuery)]);
  // const issuesRaw = await runQuery(query);
  const end = performance.now();

  const { total_count } = count[0];
  // const total_count = 2300;

  const [pageSize, page, offset] = cursor.split(":");

  const groupByProperty = EIssueGroupBYServerToProperty[group_by as typeof EIssueGroupBYServerToProperty];

  const parsingStart = performance.now();
  let issueResults = issuesRaw.map((issue: any) => {
    arrayFields.forEach((field: string) => {
      issue[field] = issue[field] ? JSON.parse(issue[field]) : [];
    });

    return issue;
  });

  const parsingEnd = performance.now();

  const times = {
    IssueQuery: end - start,
    Parsing: parsingEnd - parsingStart,
  };

  if (groupByProperty && page === "0") {
    issueResults = getGroupedIssueResults(issueResults);
  }

  console.log(issueResults);
  console.table(times);

  const total_pages = Math.ceil(total_count / Number(pageSize));
  const next_page_results = total_pages > parseInt(page) + 1;

  const out = {
    results: issueResults,
    next_cursor: `${pageSize}:${page}:${Number(offset) + Number(pageSize)}`,
    prev_cursor: `${pageSize}:${page}:${Number(offset) - Number(pageSize)}`,
    total_results: total_count,
    total_count,
    next_page_results,
    total_pages,
  };

  return out;
};

function getGroupedIssueResults(issueResults: (TIssue & { group_id: string; total_issues: number })[]): any {
  const groupedResults: {
    [key: string]: {
      results: TIssue[];
      total_results: number;
    };
  } = {};

  for (const issue of issueResults) {
    const { group_id, total_issues } = issue;
    const groupId = group_id ? group_id : "None";
    if (groupedResults?.[groupId] !== undefined && Array.isArray(groupedResults?.[groupId]?.results)) {
      groupedResults?.[groupId]?.results.push(issue);
    } else {
      groupedResults[groupId] = { results: [issue], total_results: total_issues };
    }
  }

  return groupedResults;
}
