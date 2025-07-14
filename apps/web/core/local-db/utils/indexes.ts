import { persistence } from "../storage.sqlite";
import { log } from "./utils";

export const createIssueIndexes = async () => {
  const columns = [
    "state_id",
    "sort_order",
    //  "priority",
    "priority_proxy",
    "project_id",
    "created_by",
    "cycle_id",
    "sequence_id",
  ];

  const promises: Promise<any>[] = [];

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

export const createWorkSpaceIndexes = async () => {
  const promises: Promise<any>[] = [];
  // Labels
  promises.push(persistence.db.exec({ sql: `CREATE INDEX labels_name_idx ON labels (id,name,project_id)` }));
  // Modules
  promises.push(persistence.db.exec({ sql: `CREATE INDEX modules_name_idx ON modules  (id,name,project_id)` }));
  // States
  promises.push(persistence.db.exec({ sql: `CREATE INDEX states_name_idx ON states  (id,name,project_id)` }));
  // Cycles
  promises.push(persistence.db.exec({ sql: `CREATE INDEX cycles_name_idx ON cycles  (id,name,project_id)` }));

  // Members
  promises.push(persistence.db.exec({ sql: `CREATE INDEX members_name_idx ON members  (id,first_name)` }));

  // Estimate Points @todo
  promises.push(persistence.db.exec({ sql: `CREATE INDEX estimate_points_name_idx ON estimate_points  (id,value)` }));
  // Options
  promises.push(persistence.db.exec({ sql: `CREATE INDEX options_key_idx ON options  (key)` }));

  await Promise.all(promises);
};

const createIndexes = async () => {
  log("### Creating indexes");
  const start = performance.now();
  const promises = [createIssueIndexes(), createIssueMetaIndexes(), createWorkSpaceIndexes()];
  try {
    await Promise.all(promises);
  } catch (e) {
    console.log((e as Error).message);
  }
  log("### Indexes created in", `${performance.now() - start}ms`);
};

export default createIndexes;
