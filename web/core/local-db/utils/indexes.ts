import { persistence } from "../storage.sqlite";

const log = console.log;
export const createIssueIndexes = async () => {
  const columns = [
    "state_id",
    "sort_order",
    //  "priority",
    "priority_proxy",
    "project_id",
    "created_by",
    "cycle_id",
  ];

  const promises = [];

  promises.push(persistence.db.exec({ sql: `CREATE UNIQUE INDEX issues_issue_id_idx ON issues (id)` }));

  columns.forEach((column) => {
    promises.push(
      persistence.db.exec({ sql: `CREATE  INDEX issues_issue_${column}_idx ON issues (project_id, ${column})` })
    );
  });
  await Promise.all(promises);
};

export const createIssueMetaIndexes = async () => {
  // Drop indexes
  await persistence.db.exec({ sql: `CREATE INDEX issue_meta_all_idx ON issue_meta (issue_id,key,value)` });
};

export const createLabelIndexes = async () => {
  const columns = ["name", "id", "project_id"];
  const promises = [];
  columns.forEach((column) => {
    promises.push(persistence.db.exec({ sql: `CREATE INDEX labels_${column}_idx ON labels (${column})` }));
  });
  await Promise.all(promises);
};
const createIndexes = async () => {
  log("### Creating indexes");
  const start = performance.now();
  const promises = [createIssueIndexes(), createIssueMetaIndexes(), createLabelIndexes()];
  try {
    await Promise.all(promises);
  } catch (e) {
    console.log(e.result.message);
  }
  log("### Indexes created in", `${performance.now() - start}ms`);
};

export default createIndexes;
