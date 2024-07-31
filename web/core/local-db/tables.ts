export const createIssuesTable = (SQLITE) => {
  const sqlstr = `CREATE TABLE IF NOT EXISTS issues (
      id TEXT, 
      name TEXT, 
      state_id TEXT, 
      sort_order REAL, 
      completed_at TEXT, 
      estimate_point REAL, 
      priority TEXT, 
      start_date TEXT, 
      target_date TEXT, 
      sequence_id INTEGER, 
      project_id TEXT, 
      parent_id TEXT, 
      created_at TEXT, 
      updated_at TEXT, 
      created_by TEXT, 
      updated_by TEXT, 
      is_draft INTEGER, 
      archived_at TEXT, 
      state__group TEXT, 
      sub_issues_count INTEGER, 
      cycle_id TEXT, 
      link_count INTEGER, 
      attachment_count INTEGER, 
      label_ids TEXT, 
      assignee_ids TEXT, 
      module_ids TEXT);`;
  SQLITE.exec(sqlstr);
};

export const createIssueMetaTable = (SQLITE) => {
  const sqlstr = `CREATE TABLE IF NOT EXISTS issue_meta (
      issue_id TEXT, 
      key TEXT, 
      value TEXT);`;
  SQLITE.exec(sqlstr);
};
export const createTables = async (SQLITE) => {
  await createIssuesTable(SQLITE);
  await createIssueMetaTable(SQLITE);
};
