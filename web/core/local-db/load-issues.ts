import { TBaseIssue } from "@plane/types";
import { IssueService } from "@/services/issue";
import createIndexes from "./indexes";
import { runQuery } from "./query-executor";
import { SQL } from "./sqlite";

const arrayFields = ["label_ids", "assignee_ids", "module_ids"];

export const addIssue = async (issue: any) => {
  const issue_id = issue.id;
  const { label_ids, assignee_ids, module_ids, ...otherProps } = issue;
  const keys = Object.keys(issue).join(",");
  const values = Object.values(issue).map((val) => {
    if (val === null) {
      return "";
    }
    if (typeof val === "object") {
      return JSON.stringify(val);
    }
    return val;
  }); // Will fail when the values have a comma

  const promises = [];
  SQL.db.exec("BEGIN TRANSACTION;");

  promises.push(
    SQL.db.exec({
      sql: `insert into issues(${keys}) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      bind: values,
    })
  );

  arrayFields.forEach((field) => {
    const values = issue[field];
    if (values) {
      values.forEach((val) => {
        // promises.push(
        SQL.db.exec({
          sql: `insert into issue_meta(issue_id,key,value) values (?,?,?)`,
          bind: [issue_id, field, val],
        });
        // );
      });
    }
  });
  SQL.db.exec("COMMIT;");

  // await Promise.all(promises);
  console.log("### Added issue", issue.id);
};

export const loadIssues = async (workspaceId: string, projectId: string) => {
  // Load issues from the API
  const issueService = new IssueService();

  const PAGE_SIZE = 100;
  let cursor = `${PAGE_SIZE}:0:0`;
  let results;
  let breakLoop = false;
  let count = await runQuery(`select count(*) as count from issues where project_id='${projectId}'`);
  console.log("### Count", count);
  count = count[0]["count"];

  console.log("### Count", count, typeof count);
  if (!count) {
    do {
      const response = await issueService.getIssuesFromServer(workspaceId, projectId, { cursor });
      cursor = response.next_cursor;
      results = response.results as TBaseIssue[];
      console.log("#### Loading issues", results.length);
      results.map(async (issue) => {
        try {
          await addIssue(issue);
        } catch (e) {
          console.log("###Error", e, issue);
          breakLoop = true;
        }
      });
    } while (results.length >= PAGE_SIZE && !breakLoop);
  } else {
    console.log("### Project already stored locally, call update issues");
  }

  createIndexes();
};
