import { TBaseIssue } from "@plane/types";
import { IssueService } from "@/services/issue";
import createIndexes from "./indexes";
import { runQuery } from "./query-executor";
import { SQL } from "./sqlite";
import { log } from "./utils";

const arrayFields = ["label_ids", "assignee_ids", "module_ids"];
const PAGE_SIZE = 1000;

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
  // log("### Added issue", issue.id);
};

export const deleteIssueFromLocal = async (issue_id: any) => {
  const deleteQuery = `delete from issues where id='${issue_id}'`;
  const deleteMetaQuery = `delete from issue_meta where issue_id='${issue_id}'`;

  SQL.db.exec("BEGIN TRANSACTION;");
  SQL.db.exec(deleteQuery);
  SQL.db.exec(deleteMetaQuery);
  SQL.db.exec("COMMIT;");
};

export const updateIssue = async (issue: any) => {
  const issue_id = issue.id;
  // delete the issue and its meta data
  await deleteIssueFromLocal(issue_id);
  addIssue(issue);
};
export const loadIssues = async (workspaceId: string, projectId: string) => {
  // Load issues from the API
  const issueService = new IssueService();

  let count = await runQuery(`select count(*) as count from issues where project_id='${projectId}'`);
  log("### Count", count);
  count = count[0]["count"];

  log("### Count", count, typeof count);
  if (!count) {
    let cursor = `${PAGE_SIZE}:0:0`;
    let results;
    let breakLoop = false;
    do {
      const response = await issueService.getIssuesFromServer(workspaceId, projectId, { cursor });
      cursor = response.next_cursor;
      results = response.results as TBaseIssue[];
      log("#### Loading issues", results.length);
      results.map(async (issue) => {
        try {
          await addIssue(issue);
        } catch (e) {
          log("###Error", e, issue);
          breakLoop = true;
        }
      });
    } while (results.length >= PAGE_SIZE && !breakLoop);
  } else {
    syncLocalData(workspaceId, projectId);
  }

  createIndexes();
};

export const syncUpdatesToLocal = async (workspaceId: string, projectId: string) => {
  let cursor = `${PAGE_SIZE}:0:0`;
  let results;
  let breakLoop = false;

  // get the last updated issue
  const lastUpdatedIssue = await runQuery(
    `select id, name, updated_at , sequence_id from issues where project_id='${projectId}' order by date(updated_at) desc limit 1`
  );

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const updated_at__gt = lastUpdatedIssue[0]["updated_at"];
  const issueService = new IssueService();

  do {
    const response = await issueService.getIssuesFromServer(workspaceId, projectId, { cursor, updated_at__gt });
    cursor = response.next_cursor;
    results = response.results as TBaseIssue[];
    log("#### Loading issues", results.length);
    results.map(async (issue) => {
      try {
        await updateIssue(issue);
      } catch (e) {
        log("###Error", e, issue);
        breakLoop = true;
      }
    });
  } while (results.length >= PAGE_SIZE && !breakLoop);
};

export const syncDeletesToLocal = async (workspaceId: string, projectId: string) => {
  const issueService = new IssueService();
  const response = await issueService.getDeletedIssues(workspaceId, projectId);
  response.map(async (issue) => deleteIssueFromLocal(issue));
};

export const syncLocalData = async (workspaceId: string, projectId: string) => {
  await Promise.all([syncDeletesToLocal(workspaceId, projectId), syncUpdatesToLocal(workspaceId, projectId)]);
};
