import { TIssue } from "@plane/types";
import { rootStore } from "@/lib/store-context";
import { IssueService } from "@/services/issue";
import { persistence } from "../storage.sqlite";
import { ARRAY_FIELDS, PRIORITY_MAP } from "./constants";
import { issueSchema } from "./schemas";

export const PROJECT_OFFLINE_STATUS: Record<string, boolean> = {};

export const addIssue = async (issue: any) => {
  if (document.hidden || !rootStore.user.localDBEnabled) return;

  persistence.db.exec("BEGIN TRANSACTION;");
  stageIssueInserts(issue);
  persistence.db.exec("COMMIT;");
};

export const addIssuesBulk = async (issues: any, batchSize = 100) => {
  if (!rootStore.user.localDBEnabled) return;

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
  if (!rootStore.user.localDBEnabled) return;

  const deleteQuery = `delete from issues where id='${issue_id}'`;
  const deleteMetaQuery = `delete from issue_meta where issue_id='${issue_id}'`;

  persistence.db.exec("BEGIN TRANSACTION;");
  persistence.db.exec(deleteQuery);
  persistence.db.exec(deleteMetaQuery);
  persistence.db.exec("COMMIT;");
};
// @todo: Update deletes the issue description from local. Implement a separate update.
export const updateIssue = async (issue: TIssue & { is_local_update: number }) => {
  if (document.hidden || !rootStore.user.localDBEnabled) return;

  const issue_id = issue.id;
  // delete the issue and its meta data
  await deleteIssueFromLocal(issue_id);
  addIssue(issue);
};

export const syncDeletesToLocal = async (workspaceId: string, projectId: string, queries: any) => {
  if (!rootStore.user.localDBEnabled) return;

  const issueService = new IssueService();
  const response = await issueService.getDeletedIssues(workspaceId, projectId, queries);
  if (Array.isArray(response)) {
    response.map(async (issue) => deleteIssueFromLocal(issue));
  }
};

const stageIssueInserts = (issue: any) => {
  const issue_id = issue.id;
  issue.priority_proxy = PRIORITY_MAP[issue.priority as keyof typeof PRIORITY_MAP];

  const keys = Object.keys(issueSchema);
  const sanitizedIssue = keys.reduce((acc: any, key) => {
    if (issue[key] || issue[key] === 0) {
      acc[key] = issue[key];
    }
    return acc;
  }, {});

  const columns = "'" + Object.keys(sanitizedIssue).join("','") + "'";

  const values = Object.values(sanitizedIssue)
    .map((value) => {
      if (value === null) {
        return "";
      }
      if (typeof value === "object") {
        return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
      }
      if (typeof value === "string") {
        return `'${value.replace(/'/g, "''")}'`;
      }
      return value;
    })
    .join(", ");

  const query = `INSERT OR REPLACE INTO issues (${columns}) VALUES (${values});`;
  persistence.db.exec(query);

  persistence.db.exec({
    sql: `DELETE from issue_meta where issue_id='${issue_id}'`,
  });

  ARRAY_FIELDS.forEach((field) => {
    const values = issue[field];
    if (values && values.length) {
      values.forEach((val: any) => {
        persistence.db.exec({
          sql: `INSERT OR REPLACE  into issue_meta(issue_id,key,value) values (?,?,?) `,
          bind: [issue_id, field, val],
        });
      });
    } else {
      // Added for empty fields?
      persistence.db.exec({
        sql: `INSERT OR REPLACE  into issue_meta(issue_id,key,value) values (?,?,?) `,
        bind: [issue_id, field, ""],
      });
    }
  });
};
