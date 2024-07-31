import { TIssue } from "@plane/types";
import { issueFilterCountQueryConstructor, issueFilterQueryConstructor } from "../query-constructor";
import { runQuery } from "../query-executor";

const arrayFields = ["label_ids", "assignee_ids", "module_ids"];

export const getIssues = async (workspaceSlug: string, projectId: string, queries?: any, config = {}): Promise<any> => {
  //   {
  //     "priority": "urgent,high,medium",
  //     "state": "5d572a70-aa2f-409c-ade0-6a49e3c052c7,f0c8572a-164a-4ae0-98b4-329e89e22d86",
  //     "order_by": "-created_at",
  //     "sub_issue": true,
  //     "cursor": "100:0:0",
  //     "per_page": "100"
  // }
  // https://dexie.org/docs/MultiEntry-Index

  // console.log("#### queries", queries);
  const { cursor } = queries;

  const start = performance.now();
  const query = issueFilterQueryConstructor(workspaceSlug, projectId, queries);
  const countQuery = issueFilterCountQueryConstructor(workspaceSlug, projectId, queries);
  let issues = await runQuery(query);
  const { total_count } = (await runQuery(countQuery))[0];
  const end = performance.now();

  console.log("#### Local time", end - start);

  const [pageSize, page, offset] = cursor.split(":");

  issues = issues.map((issue: TIssue) => {
    arrayFields.forEach((field) => {
      issue[field] = JSON.parse(issue[field]);
    });

    return issue;
  });

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
