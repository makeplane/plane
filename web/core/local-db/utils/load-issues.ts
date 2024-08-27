import { IssueService } from "@/services/issue";
import { persistence } from "../storage.sqlite";
import { stageIssueInserts } from "./query-constructor";

const PAGE_SIZE = 1000;

export const PROJECT_OFFLINE_STATUS: Record<string, boolean> = {};

export const addIssue = async (issue: any) => {
  persistence.db.exec("BEGIN TRANSACTION;");
  stageIssueInserts(issue);
  persistence.db.exec("COMMIT;");
};

export const addIssuesBulk = async (issues: any, batchSize = 100) => {
  for (let i = 0; i < issues.length; i += batchSize) {
    const batch = issues.slice(i, i + batchSize);

    persistence.db.exec("BEGIN TRANSACTION;");
    batch.forEach((issue: any) => {
      if (!issue.type_id) {
        issue.type_id = "";
      }
      stageIssueInserts(issue);
    });
    await persistence.db.exec("COMMIT;");
  }
};
export const deleteIssueFromLocal = async (issue_id: any) => {
  const deleteQuery = `delete from issues where id='${issue_id}'`;
  const deleteMetaQuery = `delete from issue_meta where issue_id='${issue_id}'`;

  persistence.db.exec("BEGIN TRANSACTION;");
  persistence.db.exec(deleteQuery);
  persistence.db.exec(deleteMetaQuery);
  persistence.db.exec("COMMIT;");
};

export const updateIssue = async (issue: any) => {
  const issue_id = issue.id;
  // delete the issue and its meta data
  await deleteIssueFromLocal(issue_id);
  addIssue(issue);
};

export const syncDeletesToLocal = async (workspaceId: string, projectId: string) => {
  const issueService = new IssueService();
  const response = await issueService.getDeletedIssues(workspaceId, projectId);
  if (Array.isArray(response)) {
    response.map(async (issue) => deleteIssueFromLocal(issue));
  }
};

// export const syncLocalData = async (workspaceId: string, projectId: string) => {
//   persistence.syncInProgress = Promise.all([
//     syncDeletesToLocal(workspaceId, projectId),
//     syncUpdatesToLocal(workspaceId, projectId),
//   ]);

//   await persistence.syncInProgress;
// };
