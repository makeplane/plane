export const issueFilterQueryConstructor = (workspaceSlug: string, projectId: string, queries) => {
  const { order_by, cursor, per_page, labels, sub_issue, assignees, state, cycle, group_by, module, ...otherProps } =
    queries;

  if (state) otherProps.state_id = state;
  if (cycle) otherProps.cycle_id = cycle;
  if (module) otherProps.module_ids = module;
  if (labels) otherProps.label_ids = labels;
  if (assignees) otherProps.assignee_ids = assignees;

  const arrayFields = ["label_ids", "assignee_ids", "module_ids"];
  let sql = `SELECT * FROM issues i LEFT JOIN issue_meta im ON i.id = im.issue_id WHERE 1=1 AND project_id='${projectId}' `;

  const keys = Object.keys(otherProps);

  keys.forEach((key) => {
    const value = otherProps[key] ? otherProps[key].split(",") : "";
    if (!value) return;
    if (arrayFields.includes(key)) {
      sql += ` AND key='${key}' AND value IN ('${value.join("','")}')`;
    } else {
      sql += ` AND ${key} in ('${value.join("','")}')`;
    }
  });

  sql += ` group by i.id`;

  if (order_by) {
    //if order_by starts with "-" then sort in descending order
    if (order_by.startsWith("-")) {
      sql += ` ORDER BY ${order_by.slice(1)} DESC`;
    } else {
      sql += ` ORDER BY ${order_by} ASC`;
    }
  }

  const [pageSize, page, offset] = cursor.split(":");
  // Add offset and paging to query
  sql += ` LIMIT  ${pageSize} OFFSET ${offset * 1 + page * pageSize};`;

  console.log("$$$", sql);
  return sql;
};

export const issueFilterCountQueryConstructor = (workspaceSlug: string, projectId: string, queries) => {
  let sql = issueFilterQueryConstructor(workspaceSlug, projectId, queries);

  sql = sql.replace("SELECT *", "SELECT COUNT(DISTINCT i.id) as total_count");
  // Remove everything after group by i.id
  sql = `${sql.split("group by i.id")[0]};`;

  return sql;
};
