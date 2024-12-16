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

  await persistence.db.exec({ sql: `CREATE UNIQUE INDEX issues_issue_id_idx ON issues (id)` });

  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    await persistence.db.exec({ sql: `CREATE INDEX issues_issue_${column}_idx ON issues (project_id, ${column})` });
  }
};

export const createIssueMetaIndexes = async () => {
  // Drop indexes
  await persistence.db.exec({ sql: `CREATE INDEX issue_meta_all_idx ON issue_meta (issue_id,key,value)` });
};

export const createWorkSpaceIndexes = async () => {
  // Labels
  await persistence.db.exec({ sql: `CREATE INDEX labels_name_idx ON labels (id,name,project_id)` });
  // Modules
  await persistence.db.exec({ sql: `CREATE INDEX modules_name_idx ON modules  (id,name,project_id)` });
  // States
  await persistence.db.exec({ sql: `CREATE INDEX states_name_idx ON states  (id,name,project_id)` });
  // Cycles
  await persistence.db.exec({ sql: `CREATE INDEX cycles_name_idx ON cycles  (id,name,project_id)` });

  // Members
  await persistence.db.exec({ sql: `CREATE INDEX members_name_idx ON members  (id,first_name)` });

  // Estimate Points @todo
  await persistence.db.exec({ sql: `CREATE INDEX estimate_points_name_idx ON estimate_points  (id,value)` });
  // Options
  await persistence.db.exec({ sql: `CREATE INDEX options_key_idx ON options  (key)` });
};

const createIndexes = async () => {
  log("### Creating indexes");
  const start = performance.now();

  try {
    await createIssueIndexes();
    await createIssueMetaIndexes();
    await createWorkSpaceIndexes();
  } catch (e) {
    console.log((e as Error).message);
  }
  log("### Indexes created in", `${performance.now() - start}ms`);
};

export default createIndexes;
