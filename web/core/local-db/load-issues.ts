import { TBaseIssue } from "@plane/types";
import { IssueService } from "@/services/issue";
import createIndexes from "./indexes";
import { stageIssueInserts } from "./query-constructor";
import { runQuery } from "./query-executor";
import { SQL } from "./sqlite";
import { log } from "./utils";

const PAGE_SIZE = 1000;

export const PROJECT_OFFLINE_STATUS: Record<string, boolean> = {};

export const addIssue = async (issue: any) => {
  SQL.db.exec("BEGIN TRANSACTION;");
  stageIssueInserts(issue);
  SQL.db.exec("COMMIT;");
};

export const addIssuesBulk = async (issues: any, batchSize = 100) => {
  for (let i = 0; i < issues.length; i += batchSize) {
    const batch = issues.slice(i, i + batchSize);

    SQL.db.exec("BEGIN TRANSACTION;");
    batch.forEach((issue: any) => {
      stageIssueInserts(issue);
    });
    await SQL.db.exec("COMMIT;");
  }
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

export const loadIssuesPrivate = async (workspaceId: string, projectId: string) => {
  // Load issues from the API
  if (PROJECT_OFFLINE_STATUS[projectId] === undefined) {
    PROJECT_OFFLINE_STATUS[projectId] = false;
  } else {
    // Load issues is already in progress
    return;
  }

  let count = await runQuery(`select count(*) as count from issues where project_id='${projectId}'`);
  count = count[0]["count"];

  if (!count) {
    log("### Loading issues from the server");
    const issueService = new IssueService();
    let cursor = `${PAGE_SIZE}:0:0`;
    let results;
    let breakLoop = false;
    do {
      const response = await issueService.getIssuesFromServer(workspaceId, projectId, { cursor });
      cursor = response.next_cursor;
      results = response.results as TBaseIssue[];
      try {
        await addIssuesBulk(results);
      } catch (e) {
        log("###Error", e, results);
        breakLoop = true;
      }
    } while (results.length >= PAGE_SIZE && !breakLoop);
    await createIndexes();
  } else {
    log(`### issues already present in the db ${count}`);
    syncLocalData(workspaceId, projectId);
  }

  PROJECT_OFFLINE_STATUS[projectId] = true;
};

export const loadIssues = async (workspaceId: string, projectId: string) => {
  SQL.syncInProgress = loadIssuesPrivate(workspaceId, projectId);
  await SQL.syncInProgress;
};

export const syncUpdatesToLocal = async (workspaceId: string, projectId: string) => {
  let cursor = `${PAGE_SIZE}:0:0`;
  let results;
  let breakLoop = false;

  // get the last updated issue
  const lastUpdatedIssue = await runQuery(
    `select id, name, updated_at , sequence_id from issues where project_id='${projectId}' order by datetime(updated_at) desc limit 1`
  );

  console.log("#### Last Updated Issue", lastUpdatedIssue);

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { updated_at: updated_at__gt, sequence_id } = lastUpdatedIssue[0];
  log("#### Last Updated Issue", sequence_id, updated_at__gt);
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
  if (Array.isArray(response)) {
    response.map(async (issue) => deleteIssueFromLocal(issue));
  }
};

export const syncLocalData = async (workspaceId: string, projectId: string) => {
  SQL.syncInProgress = Promise.all([
    syncDeletesToLocal(workspaceId, projectId),
    syncUpdatesToLocal(workspaceId, projectId),
  ]);

  await SQL.syncInProgress;
};
