import { issueFilterCountQueryConstructor, issueFilterQueryConstructor } from "../query-constructor";
import { runQuery } from "../query-executor";
import { SQL } from "../sqlite";

const arrayFields = ["label_ids", "assignee_ids", "module_ids"];

export const getIssues = async (workspaceSlug: string, projectId: string, queries?: any, config = {}): Promise<any> => {
  const { cursor } = queries;

  await SQL.syncInProgress;
  const query = issueFilterQueryConstructor(workspaceSlug, projectId, queries);
  const countQuery = issueFilterCountQueryConstructor(workspaceSlug, projectId, queries);
  const start = performance.now();
  const [issuesRaw, count] = await Promise.all([runQuery(query), runQuery(countQuery)]);
  const end = performance.now();

  const { total_count } = count[0];

  const [pageSize, page, offset] = cursor.split(":");

  const parsingStart = performance.now();
  const issues = issuesRaw.map((issue: any) => {
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

  console.table(times);

  const total_pages = Math.ceil(total_count / Number(pageSize));
  const next_page_results = total_pages > parseInt(page) + 1;

  const out = {
    results: issues,
    next_cursor: `${pageSize}:${page}:${Number(offset) + Number(pageSize)}`,
    prev_cursor: `${pageSize}:${page}:${Number(offset) - Number(pageSize)}`,
    total_results: total_count,
    count: issues.length,
    total_count,
    next_page_results,
    total_pages,
  };

  return out;
};
