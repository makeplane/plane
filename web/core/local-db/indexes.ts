import { SQL } from "./sqlite";

const log = console.log;
export const createIssueIndexes = async () => {
  const columns = [
    "state_id",
    "sort_order",
    //  "priority",
    "project_id",
    "created_by",
    "cycle_id",
  ];

  // Drop indexes
  const dropPromises = [];
  dropPromises.push(SQL.db.exec({ sql: `DROP INDEX IF EXISTS issues_issue_id_idx` }));
  dropPromises.push(SQL.db.exec({ sql: `DROP INDEX IF EXISTS issues_priority_idx` }));
  columns.forEach((column) => {
    dropPromises.push(SQL.db.exec({ sql: `DROP INDEX IF EXISTS issues_issue_${column}_idx` }));
  });
  await Promise.all(dropPromises);

  const promises = [];

  promises.push(SQL.db.exec({ sql: `CREATE UNIQUE INDEX issues_issue_id_idx ON issues (id)` }));

  columns.forEach((column) => {
    promises.push(SQL.db.exec({ sql: `CREATE  INDEX issues_issue_${column}_idx ON issues (project_id, ${column})` }));
  });
  await Promise.all(promises);
};

export const createIssueMetaIndexes = async () => {
  // Drop indexes
  await SQL.db.exec({ sql: `DROP INDEX IF EXISTS issue_meta_all_idx` });

  await SQL.db.exec({ sql: `CREATE INDEX issue_meta_all_idx ON issue_meta (issue_id,key,value)` });
};

const createIndexes = async () => {
  log("### Creating indexes");
  const start = performance.now();
  const promises = [createIssueIndexes(), createIssueMetaIndexes()];
  await Promise.all(promises);
  log("### Indexes created in", `${performance.now() - start}ms`);
};

export default createIndexes;
