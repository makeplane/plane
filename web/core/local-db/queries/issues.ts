import { TIssue } from "@plane/types";
import { issueFilterCountQueryConstructor, issueFilterQueryConstructor } from "../query-constructor";
import { runQuery } from "../query-executor";

const arrayFields = ["label_ids", "assignee_ids", "module_ids"];

export const getIssues = async (workspaceSlug: string, projectId: string, queries?: any, config = {}): Promise<any> => {
  const { cursor } = queries;

  const query = issueFilterQueryConstructor(workspaceSlug, projectId, queries);
  const countQuery = issueFilterCountQueryConstructor(workspaceSlug, projectId, queries);
  const start = performance.now();
  let issues = await runQuery(query);
  const end = performance.now();

  const countStart = performance.now();
  const { total_count } = (await runQuery(countQuery))[0];
  const countEnd = performance.now();

  const [pageSize, page, offset] = cursor.split(":");

  const parsingStart = performance.now();
  issues = issues.map((issue: TIssue) => {
    arrayFields.forEach((field) => {
      issue[field] = JSON.parse(issue[field]);
    });

    return issue;
  });

  const parsingEnd = performance.now();

  const times = {
    IssueQuery: end - start,
    Count: countEnd - countStart,
    Parsing: parsingEnd - parsingStart,
  };

  console.table(times);

  const out = {
    results: issues,
    next_cursor: `${pageSize}:${page}:${Number(offset) + Number(pageSize)}`,
    prev_cursor: `${pageSize}:${page}:${Number(offset) - Number(pageSize)}`,
    total_results: total_count,
    count: issues.length,
    total_count,
    total_pages: Math.ceil(total_count / Number(pageSize)),
  };

  console.log(out);
  return {
    results: issues,
    next_cursor: `${pageSize}:${page}:${Number(offset) + Number(pageSize)}`,
    prev_cursor: `${pageSize}:${page}:${Number(offset) - Number(pageSize)}`,
    total_results: total_count,
    count: issues.length,
    total_count,
    total_pages: Math.ceil(total_count / Number(pageSize)),
  };
};
